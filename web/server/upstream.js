const CryptoJS = require('crypto-js');
const { XMLParser } = require('fast-xml-parser');
const iconv = require('iconv-lite');
const {
  LOGIN_URL,
  USER_URL,
  CHARGE_URL,
  PAY_URL,
  DES_IV,
  DES_KEY,
  USER_AGENT,
  MIN_PAY_AMOUNT,
  REQUEST_TIMEOUT_MS,
} = require('./config');

const xmlParser = new XMLParser({
  attributeNamePrefix: '@_',
  ignoreAttributes: false,
  parseNodeValue: true,
  trimValues: true,
  parseAttributeValue: true,
});

const desIv = CryptoJS.enc.Utf8.parse(DES_IV);
const desKey = CryptoJS.enc.Latin1.parse(DES_KEY);

function encryptPayload(payload) {
  return CryptoJS.DES.encrypt(payload, desKey, {
    iv: desIv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  }).toString();
}

function decryptPayload(payload) {
  const decrypted = CryptoJS.DES.decrypt(payload, desKey, {
    iv: desIv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  }).toString(CryptoJS.enc.Latin1);

  return iconv.decode(Buffer.from(decrypted, 'binary'), 'GBK');
}

function unwrapXmlResponse(xmlText) {
  const parsed = xmlParser.parse(xmlText);
  const textNode = parsed?.string?.['#text'] ?? parsed?.string;

  if (typeof textNode !== 'string') {
    throw new Error('上游响应格式异常');
  }

  return textNode;
}

async function postForm(url, formData) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
    },
    body: new URLSearchParams(formData).toString(),
    redirect: 'follow',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  return response.text();
}

async function postOrder(url, order) {
  const encryptedOrder = encryptPayload(JSON.stringify(order));
  const xmlText = await postForm(url, { order: encryptedOrder });
  const responseJson = JSON.parse(decryptPayload(unwrapXmlResponse(xmlText)));

  if (responseJson.state !== '1') {
    throw new Error(responseJson.note || '上游接口返回失败');
  }

  return responseJson;
}

function getFirstResult(responseJson) {
  return responseJson?.data?.result1?.[0] ?? null;
}

function decodeOrderComponent(value) {
  return decodeURIComponent(String(value || ''));
}

function parseOrderInfo(orderInfo) {
  const fields = {};

  for (const pair of String(orderInfo || '').split('&')) {
    if (!pair) {
      continue;
    }

    const separatorIndex = pair.indexOf('=');
    if (separatorIndex === -1) {
      fields[pair] = '';
      continue;
    }

    const key = pair.slice(0, separatorIndex);
    const value = pair.slice(separatorIndex + 1);
    fields[key] = decodeOrderComponent(value);
  }

  return fields;
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizePileStatus(statusText) {
  const normalized = String(statusText || '').trim();

  if (normalized === '空闲') {
    return { statusCode: 'available', statusLabel: '空闲' };
  }
  if (normalized === '充电中') {
    return { statusCode: 'busy', statusLabel: '充电中' };
  }
  if (normalized === '故障') {
    return { statusCode: 'fault', statusLabel: '故障' };
  }

  return {
    statusCode: 'unknown',
    statusLabel: normalized || '状态未知',
  };
}

function comparePileName(left, right) {
  return String(left?.name || '').localeCompare(String(right?.name || ''), 'zh-CN', {
    numeric: true,
    sensitivity: 'base',
  });
}

function normalizeStationPile(item) {
  const { statusCode, statusLabel } = normalizePileStatus(item?.rcusable);

  return {
    name: String(item?.rcname || ''),
    status: String(item?.rcusable || ''),
    note: String(item?.rcnote || ''),
    statusCode,
    statusLabel,
    raw: item,
  };
}

function normalizeStationSummary(item, piles = []) {
  const chargingCount = toNumber(item?.chargingnums);
  const freeCount = toNumber(item?.freenums);
  const errorCount = toNumber(item?.errnums);
  const totalCount = chargingCount + freeCount + errorCount;

  let statusCode = 'unknown';
  let statusLabel = '状态未知';

  if (freeCount > 0) {
    statusCode = 'available';
    statusLabel = '有空闲，可充电';
  } else if (chargingCount > 0 && errorCount > 0) {
    statusCode = 'mixed';
    statusLabel = '无空闲，部分故障';
  } else if (chargingCount > 0) {
    statusCode = 'busy';
    statusLabel = '无空闲，正在充电';
  } else if (errorCount > 0) {
    statusCode = 'fault';
    statusLabel = '当前全部异常';
  }

  return {
    rid: String(item?.rid || ''),
    rname: String(item?.rname || ''),
    chargingCount,
    freeCount,
    errorCount,
    totalCount,
    hasFree: freeCount > 0,
    statusCode,
    statusLabel,
    piles,
    raw: item,
  };
}

function buildStationOverview(rawList, pileMap = {}) {
  const locations = (Array.isArray(rawList) ? rawList : []).map((item) =>
    normalizeStationSummary(item, pileMap[String(item?.rid || '')] || []),
  );
  const totals = locations.reduce(
    (accumulator, item) => {
      accumulator.locationCount += 1;
      accumulator.chargingCount += item.chargingCount;
      accumulator.freeCount += item.freeCount;
      accumulator.errorCount += item.errorCount;
      accumulator.totalCount += item.totalCount;
      return accumulator;
    },
    {
      locationCount: 0,
      chargingCount: 0,
      freeCount: 0,
      errorCount: 0,
      totalCount: 0,
    },
  );

  return {
    granularity: 'pile-detail',
    note: '当前页面通过 getlist 获取地点汇总，再通过 getsublist(rid) 获取该地点下每一根充电桩的状态。',
    locations,
    totals,
  };
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const values = Array.isArray(items) ? items : [];
  const maxConcurrency = Math.max(1, Math.min(concurrency, values.length || 1));
  const results = new Array(values.length);
  let cursor = 0;

  async function worker() {
    while (cursor < values.length) {
      const currentIndex = cursor;
      cursor += 1;
      results[currentIndex] = await mapper(values[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: maxConcurrency }, () => worker()));
  return results;
}

function normalizeBalanceNumber(accountInfo) {
  const balanceText = String(accountInfo?.acbalance ?? '');
  const match = balanceText.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

async function ensureCanPay(userId) {
  const account = await getAccountInfo(userId);
  if (normalizeBalanceNumber(account) < MIN_PAY_AMOUNT) {
    throw new Error('余额不足，请至少保持1.5元！');
  }
}

async function postOrderWithUserId(url, order, userId) {
  if (!userId) {
    throw new Error('用户未登录！');
  }

  if (order?.ordertype === 'payapply') {
    await ensureCanPay(userId);
  }

  return postOrder(url, {
    ...order,
    userid: userId,
  });
}

async function login(username, password) {
  const response = await postOrder(LOGIN_URL, {
    ordertype: 'login',
    phone: username,
    logpass: password,
  });

  const profile = getFirstResult(response);
  const userId = Number(profile?.userid || 0);
  if (!userId) {
    throw new Error('登录成功但未拿到用户编号');
  }

  return {
    response,
    userId,
    profile: {
      username: profile?.username || username,
      phone: profile?.phone || username,
      avatar: profile?.avatar || '',
    },
  };
}

async function getAccountInfo(userId) {
  const response = await postOrderWithUserId(
    USER_URL,
    {
      ordertype: 'accountinfo',
      acid: 0,
      origin: 'cloud',
    },
    userId,
  );

  return getFirstResult(response);
}

async function getJacount(userId) {
  const response = await postOrderWithUserId(
    CHARGE_URL,
    {
      ordertype: 'jacount',
      origin: 'cloud',
    },
    userId,
  );

  return getFirstResult(response);
}

async function getMessage(userId, profile) {
  const response = await postOrderWithUserId(
    USER_URL,
    {
      ordertype: 'getmessage',
      origin: 'cloud',
      username: profile?.username || '',
      acid: '0',
      phone: profile?.phone || '',
    },
    userId,
  );

  return getFirstResult(response);
}

async function getChargeStatus(userId) {
  const response = await postOrderWithUserId(
    CHARGE_URL,
    {
      ordertype: 'chargestatus',
      origin: 'cloud',
    },
    userId,
  );

  return getFirstResult(response);
}

async function getChargeList() {
  const response = await postOrder(CHARGE_URL, {
    ordertype: 'getlist',
    origin: 'cloud',
  });

  return response?.data?.result1 ?? [];
}

async function getStationSublist(rid) {
  const response = await postOrder(CHARGE_URL, {
    ordertype: 'getsublist',
    origin: 'cloud',
    rid: Number(rid),
  });

  return (response?.data?.result1 ?? [])
    .map(normalizeStationPile)
    .sort(comparePileName);
}

async function getStationOverview() {
  const stations = await getChargeList();
  const pileEntries = await mapWithConcurrency(stations, 5, async (station) => [
    String(station?.rid || ''),
    await getStationSublist(station?.rid).catch(() => []),
  ]);

  return buildStationOverview(stations, Object.fromEntries(pileEntries));
}

async function getPriceInfo(userId) {
  const response = await postOrderWithUserId(
    CHARGE_URL,
    {
      ordertype: 'priceinfo',
      origin: 'cloud',
    },
    userId,
  );

  return getFirstResult(response);
}

async function getChargeRecords(userId, yy, mm) {
  const response = await postOrderWithUserId(
    CHARGE_URL,
    {
      ordertype: 'chargerecords',
      origin: 'cloud',
      yy,
      mm,
    },
    userId,
  );

  return response?.data?.result1 ?? [];
}

async function doCharge(userId, qrcode) {
  return postOrderWithUserId(
    CHARGE_URL,
    {
      ordertype: 'docharge',
      qrcode: Number(qrcode),
      origin: 'cloud',
    },
    userId,
  );
}

function buildPaymentLaunch(orderInfo) {
  const formFields = parseOrderInfo(orderInfo);
  const method = String(formFields.method || '');
  const productCode = String(formFields.product_code || '');
  const gatewayUrl = 'https://openapi.alipay.com/gateway.do';
  const queryUrl = `${gatewayUrl}?${orderInfo}`;

  return {
    orderInfo,
    formFields,
    gatewayUrl,
    queryUrl,
    method,
    productCode,
    strategy: 'app-order-string',
    message:
      '当前上游返回的是 App 支付签名串。Web 端将改用表单 POST 提交到支付宝网关并在移动端尝试拉起支付宝，但兼容性仍取决于设备、浏览器和支付宝客户端。',
  };
}

async function payApply(userId, amount) {
  const response = await postOrderWithUserId(
    PAY_URL,
    {
      ordertype: 'payapply',
      origin: 'cloud',
      paymoney: amount,
      paytype: 1,
    },
    userId,
  );

  const result = getFirstResult(response);
  const orderInfo = String(result?.orderinfo || '');

  if (!orderInfo) {
    throw new Error('充值接口未返回订单信息');
  }

  return {
    raw: result,
    launch: buildPaymentLaunch(orderInfo),
  };
}

async function payApplyReturn(userId, returnContent) {
  return postOrderWithUserId(
    PAY_URL,
    {
      ordertype: 'payapplyreturn',
      returncontent: returnContent,
    },
    userId,
  );
}

module.exports = {
  login,
  getAccountInfo,
  getJacount,
  getMessage,
  getChargeStatus,
  getChargeList,
  getStationSublist,
  getStationOverview,
  getPriceInfo,
  getChargeRecords,
  doCharge,
  payApply,
  payApplyReturn,
};
