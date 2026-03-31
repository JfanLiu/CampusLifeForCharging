const state = {
  session: null,
  account: null,
  chargeStatus: null,
  priceInfo: null,
  records: [],
  recordMonth: getDefaultMonth(),
  jacount: null,
  chargeList: null,
  stations: null,
  stationQuery: '',
  stationFilter: 'all',
  message: null,
  payment: null,
  scanner: {
    active: false,
    detector: null,
    stream: null,
    rafId: 0,
  },
};

const elements = {};
let toastTimer = 0;

document.addEventListener('DOMContentLoaded', () => {
  captureElements();
  bindEvents();
  initializeApp().catch((error) => {
    console.error(error);
    showToast(error.message || '初始化失败', true);
  });
});

function captureElements() {
  Object.assign(elements, {
    loginView: document.getElementById('login-view'),
    dashboardView: document.getElementById('dashboard-view'),
    loginForm: document.getElementById('login-form'),
    loginUsername: document.getElementById('login-username'),
    loginPassword: document.getElementById('login-password'),
    loginSubmit: document.getElementById('login-submit'),
    profileName: document.getElementById('profile-name'),
    profilePhone: document.getElementById('profile-phone'),
    profileAvatar: document.getElementById('profile-avatar'),
    accountSummary: document.getElementById('account-summary'),
    chargeStatusSummary: document.getElementById('charge-status-summary'),
    refreshAccount: document.getElementById('refresh-account'),
    refreshChargeStatus: document.getElementById('refresh-charge-status'),
    chargeForm: document.getElementById('charge-form'),
    chargeQrcode: document.getElementById('charge-qrcode'),
    scanTrigger: document.getElementById('scan-trigger'),
    payForm: document.getElementById('pay-form'),
    payAmount: document.getElementById('pay-amount'),
    paymentLaunch: document.getElementById('payment-launch'),
    paymentMessage: document.getElementById('payment-message'),
    paymentOpen: document.getElementById('payment-open'),
    paymentRefresh: document.getElementById('payment-refresh'),
    paymentUrl: document.getElementById('payment-url'),
    recordsForm: document.getElementById('records-form'),
    recordsYear: document.getElementById('records-yy'),
    recordsMonth: document.getElementById('records-mm'),
    recordsList: document.getElementById('records-list'),
    fetchPriceInfo: document.getElementById('fetch-price-info'),
    fetchJacount: document.getElementById('fetch-jacount'),
    fetchChargeList: document.getElementById('fetch-charge-list'),
    fetchMessage: document.getElementById('fetch-message'),
    priceInfoRaw: document.getElementById('price-info-raw'),
    jacountRaw: document.getElementById('jacount-raw'),
    chargeListRaw: document.getElementById('charge-list-raw'),
    stationNote: document.getElementById('station-note'),
    stationSummary: document.getElementById('station-summary'),
    stationSearch: document.getElementById('station-search'),
    stationGrid: document.getElementById('station-grid'),
    refreshStations: document.getElementById('refresh-stations'),
    messageRaw: document.getElementById('message-raw'),
    logoutButton: document.getElementById('logout-button'),
    scannerModal: document.getElementById('scanner-modal'),
    scannerClose: document.getElementById('scanner-close'),
    scannerVideo: document.getElementById('scanner-video'),
    scannerStatus: document.getElementById('scanner-status'),
    toast: document.getElementById('toast'),
  });
}

function bindEvents() {
  elements.loginForm.addEventListener('submit', handleLoginSubmit);
  elements.refreshAccount.addEventListener('click', () => loadAccount(true));
  elements.refreshChargeStatus.addEventListener('click', () => loadChargeStatus(true));
  elements.chargeForm.addEventListener('submit', handleChargeSubmit);
  elements.scanTrigger.addEventListener('click', openScanner);
  elements.payForm.addEventListener('submit', handlePaySubmit);
  elements.paymentOpen.addEventListener('click', openPaymentLink);
  elements.paymentRefresh.addEventListener('click', refreshAfterPayment);
  elements.recordsForm.addEventListener('submit', handleRecordsSubmit);
  elements.fetchPriceInfo.addEventListener('click', () => loadPriceInfo(true));
  elements.fetchJacount.addEventListener('click', () => loadJacount(true));
  elements.fetchChargeList.addEventListener('click', () => loadChargeList(true));
  elements.fetchMessage.addEventListener('click', () => loadMessage(true));
  elements.refreshStations.addEventListener('click', () => loadStations(true));
  elements.stationSearch.addEventListener('input', (event) => {
    state.stationQuery = event.target.value.trim().toLowerCase();
    renderStations();
  });
  elements.logoutButton.addEventListener('click', handleLogout);
  elements.scannerClose.addEventListener('click', closeScanner);
  elements.scannerModal.addEventListener('click', (event) => {
    if (event.target === elements.scannerModal) {
      closeScanner();
    }
  });

  document.querySelectorAll('[data-amount]').forEach((button) => {
    button.addEventListener('click', () => {
      elements.payAmount.value = button.getAttribute('data-amount') || '';
    });
  });

  document.querySelectorAll('[data-station-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      state.stationFilter = button.getAttribute('data-station-filter') || 'all';
      document.querySelectorAll('[data-station-filter]').forEach((item) => {
        item.classList.toggle(
          'chip-active',
          item.getAttribute('data-station-filter') === state.stationFilter,
        );
      });
      renderStations();
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.scanner.active) {
      closeScanner();
    }
  });
}

async function initializeApp() {
  elements.recordsYear.value = state.recordMonth.yy;
  elements.recordsMonth.value = state.recordMonth.mm;
  await handlePaymentReturnFromUrl();
  await restoreSession();
  if (!state.stations) {
    await loadStations(false);
  }
}

async function restoreSession() {
  const session = await api('/api/session');
  if (!session.loggedIn) {
    state.session = null;
    render();
    return;
  }

  const bootstrap = await api('/api/bootstrap');
  state.session = bootstrap.session;
  state.account = bootstrap.account;
  state.chargeStatus = bootstrap.chargeStatus;
  state.priceInfo = bootstrap.priceInfo;
  state.records = bootstrap.records || [];
  state.stations = bootstrap.stations || state.stations;
  state.recordMonth = bootstrap.recordMonth || state.recordMonth;
  elements.recordsYear.value = state.recordMonth.yy;
  elements.recordsMonth.value = state.recordMonth.mm;
  render();
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const username = elements.loginUsername.value.trim();
  const password = elements.loginPassword.value.trim();

  if (!username || !password) {
    showToast('请输入账号和密码', true);
    return;
  }

  setButtonBusy(elements.loginSubmit, true, '登录中...');
  try {
    const session = await api('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    state.session = session;
    elements.loginPassword.value = '';
    showToast('登录成功');
    await loadBootstrap();
  } catch (error) {
    showToast(error.message || '登录失败', true);
  } finally {
    setButtonBusy(elements.loginSubmit, false, '登录');
  }
}

async function loadBootstrap() {
  const bootstrap = await api('/api/bootstrap');
  state.session = bootstrap.session;
  state.account = bootstrap.account;
  state.chargeStatus = bootstrap.chargeStatus;
  state.priceInfo = bootstrap.priceInfo;
  state.records = bootstrap.records || [];
  state.stations = bootstrap.stations || state.stations;
  state.recordMonth = bootstrap.recordMonth || state.recordMonth;
  elements.recordsYear.value = state.recordMonth.yy;
  elements.recordsMonth.value = state.recordMonth.mm;
  render();
}

async function handleLogout() {
  await api('/api/logout', { method: 'POST', body: '{}' });
  state.session = null;
  state.account = null;
  state.chargeStatus = null;
  state.priceInfo = null;
  state.records = [];
  state.jacount = null;
  state.chargeList = null;
  state.message = null;
  state.payment = null;
  closeScanner();
  render();
  showToast('已退出登录');
}

async function loadAccount(withToast = false) {
  try {
    state.account = await api('/api/account');
    renderAccount();
    if (withToast) {
      showToast('余额已刷新');
    }
  } catch (error) {
    showToast(error.message || '余额刷新失败', true);
  }
}

async function loadChargeStatus(withToast = false) {
  try {
    state.chargeStatus = await api('/api/charge-status');
    renderChargeStatus();
    if (withToast) {
      showToast('充电状态已刷新');
    }
  } catch (error) {
    showToast(error.message || '状态刷新失败', true);
  }
}

async function loadPriceInfo(withToast = false) {
  try {
    state.priceInfo = await api('/api/price-info');
    renderAdvanced();
    if (withToast) {
      showToast('价格信息已刷新');
    }
  } catch (error) {
    showToast(error.message || '价格信息加载失败', true);
  }
}

async function loadJacount(withToast = false) {
  try {
    state.jacount = await api('/api/jacount');
    renderAdvanced();
    if (withToast) {
      showToast('电表信息已刷新');
    }
  } catch (error) {
    showToast(error.message || '电表信息加载失败', true);
  }
}

async function loadChargeList(withToast = false) {
  try {
    state.chargeList = await api('/api/charge-list');
    renderAdvanced();
    if (withToast) {
      showToast('充电列表已刷新');
    }
  } catch (error) {
    showToast(error.message || '充电列表加载失败', true);
  }
}

async function loadMessage(withToast = false) {
  try {
    state.message = await api('/api/message', { method: 'POST', body: '{}' });
    renderAdvanced();
    if (withToast) {
      showToast('用户消息已刷新');
    }
  } catch (error) {
    showToast(error.message || '用户消息加载失败', true);
  }
}

async function loadStations(withToast = false) {
  try {
    state.stations = await api('/api/stations');
    renderStations();
    if (withToast) {
      showToast('地点状态已刷新');
    }
  } catch (error) {
    showToast(error.message || '地点状态加载失败', true);
  }
}

async function handleChargeSubmit(event) {
  event.preventDefault();
  const qrcode = elements.chargeQrcode.value.trim();
  if (!/^\d+$/.test(qrcode)) {
    showToast('请输入纯数字二维码后 8 位', true);
    return;
  }

  const submitButton =
    event.submitter || elements.chargeForm.querySelector('button[type="submit"]');
  setButtonBusy(submitButton, true, '提交中...');
  try {
    const result = await api('/api/charge', {
      method: 'POST',
      body: JSON.stringify({ qrcode }),
    });
    showToast(result.note || '充电请求已提交');
    await Promise.all([loadAccount(false), loadChargeStatus(false)]);
  } catch (error) {
    showToast(error.message || '充电失败', true);
  } finally {
    setButtonBusy(submitButton, false, '开始充电');
  }
}

async function handlePaySubmit(event) {
  event.preventDefault();
  const amount = Number(elements.payAmount.value);
  if (!Number.isFinite(amount) || amount <= 0) {
    showToast('请输入合法的充值金额', true);
    return;
  }

  const submitButton =
    event.submitter || elements.payForm.querySelector('button[type="submit"]');
  setButtonBusy(submitButton, true, '生成中...');
  try {
    state.payment = await api('/api/pay/apply', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
    renderPayment();
    showToast('支付订单已生成');
  } catch (error) {
    showToast(error.message || '支付订单生成失败', true);
  } finally {
    setButtonBusy(submitButton, false, '生成支付订单');
  }
}

async function refreshAfterPayment() {
  await Promise.all([loadAccount(false), loadChargeStatus(false)]);
  showToast('已刷新余额与状态');
}

function openPaymentLink() {
  const launch = state.payment?.launch;
  if (!launch?.gatewayUrl || !launch?.formFields) {
    showToast('当前没有可用的支付链接', true);
    return;
  }

  if (launch.webSupported === false) {
    showToast('当前上游只返回 App 支付订单，Web 端无法直接完成支付。', true);
    return;
  }

  const isMobile = /iphone|ipad|android|mobile/i.test(navigator.userAgent);
  if (!isMobile && launch.method === 'alipay.trade.app.pay') {
    showToast('当前是支付宝 App 支付单，桌面浏览器拉起成功率较低，建议在手机上继续。', true);
  }
  const target = isMobile ? '_self' : '_blank';
  submitPaymentForm(launch.gatewayUrl, launch.formFields, target);
}

async function handleRecordsSubmit(event) {
  event.preventDefault();
  const yy = elements.recordsYear.value.trim();
  const mm = elements.recordsMonth.value.trim().padStart(2, '0');

  if (!/^\d{4}$/.test(yy) || !/^\d{2}$/.test(mm)) {
    showToast('请输入正确的年月', true);
    return;
  }

  const submitButton =
    event.submitter || elements.recordsForm.querySelector('button[type="submit"]');
  setButtonBusy(submitButton, true, '查询中...');
  try {
    state.records = await api(
      `/api/charge-records?yy=${encodeURIComponent(yy)}&mm=${encodeURIComponent(mm)}`,
    );
    state.recordMonth = { yy, mm };
    renderRecords();
    showToast('记录已刷新');
  } catch (error) {
    showToast(error.message || '记录查询失败', true);
  } finally {
    setButtonBusy(submitButton, false, '查询记录');
  }
}

async function handlePaymentReturnFromUrl() {
  const query = new URLSearchParams(window.location.search);
  if (!query.size) {
    return;
  }

  const entries = Object.fromEntries(query.entries());
  const hasPaymentLikeField = Object.keys(entries).some((key) =>
    ['resultStatus', 'memo', 'result', 'trade_status', 'out_trade_no'].includes(key),
  );

  if (!hasPaymentLikeField) {
    return;
  }

  try {
    await api('/api/pay/return', {
      method: 'POST',
      body: JSON.stringify({
        returnContent: JSON.stringify(entries),
      }),
    });
    showToast('已回传支付结果');
  } catch (error) {
    showToast(`支付结果回传失败：${error.message}`, true);
  } finally {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

async function openScanner() {
  if (!navigator.mediaDevices?.getUserMedia) {
    showToast('当前浏览器不支持相机访问', true);
    return;
  }

  elements.scannerStatus.textContent = '正在尝试打开后置摄像头。';
  elements.scannerModal.classList.remove('hidden');
  state.scanner.active = true;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
      },
      audio: false,
    });

    state.scanner.stream = stream;
    elements.scannerVideo.srcObject = stream;
    await elements.scannerVideo.play();

    if (!('BarcodeDetector' in window)) {
      elements.scannerStatus.textContent =
        '当前浏览器没有内置条码识别能力。请手动输入二维码后 8 位，或换到支持 BarcodeDetector 的浏览器。';
      return;
    }

    const desiredFormats = [
      'qr_code',
      'code_128',
      'code_39',
      'code_93',
      'ean_13',
      'ean_8',
      'pdf417',
      'aztec',
      'data_matrix',
    ];
    const supportedFormats =
      typeof BarcodeDetector.getSupportedFormats === 'function'
        ? await BarcodeDetector.getSupportedFormats()
        : desiredFormats;

    const activeFormats = desiredFormats.filter((format) =>
      supportedFormats.includes(format),
    );
    state.scanner.detector = new BarcodeDetector(
      activeFormats.length ? { formats: activeFormats } : undefined,
    );
    elements.scannerStatus.textContent = '识别中，请将二维码放在画面中央。';
    scanLoop();
  } catch (error) {
    closeScanner();
    showToast(error.message || '无法打开摄像头', true);
  }
}

async function scanLoop() {
  if (!state.scanner.active || !state.scanner.detector) {
    return;
  }

  try {
    if (elements.scannerVideo.readyState >= 2) {
      const results = await state.scanner.detector.detect(elements.scannerVideo);
      if (results.length > 0) {
        const code = String(results[0].rawValue || '').trim();
        if (code) {
          elements.chargeQrcode.value = code.slice(-8);
          closeScanner();
          showToast('已识别并回填二维码');
          return;
        }
      }
    }
  } catch (error) {
    elements.scannerStatus.textContent = `识别失败：${error.message}`;
  }

  state.scanner.rafId = window.requestAnimationFrame(() => {
    scanLoop();
  });
}

function closeScanner() {
  state.scanner.active = false;
  if (state.scanner.rafId) {
    window.cancelAnimationFrame(state.scanner.rafId);
    state.scanner.rafId = 0;
  }
  if (state.scanner.stream) {
    state.scanner.stream.getTracks().forEach((track) => track.stop());
    state.scanner.stream = null;
  }
  state.scanner.detector = null;
  elements.scannerVideo.srcObject = null;
  elements.scannerModal.classList.add('hidden');
}

function render() {
  const loggedIn = Boolean(state.session);
  elements.loginView.classList.toggle('hidden', loggedIn);
  elements.dashboardView.classList.toggle('hidden', !loggedIn);
  renderStations();

  if (!loggedIn) {
    elements.loginUsername.focus();
    return;
  }

  renderProfile();
  renderAccount();
  renderChargeStatus();
  renderRecords();
  renderAdvanced();
  renderPayment();
}

function renderProfile() {
  const profile = state.session?.profile || {};
  elements.profileName.textContent = profile.username || '未命名用户';
  elements.profilePhone.textContent = profile.phone || '未提供手机号';
  elements.profileAvatar.innerHTML = '';

  if (profile.avatar) {
    const image = document.createElement('img');
    image.src = profile.avatar;
    image.alt = profile.username || 'avatar';
    image.referrerPolicy = 'no-referrer';
    image.addEventListener('error', () => {
      elements.profileAvatar.textContent = buildInitials(profile.username);
    });
    elements.profileAvatar.appendChild(image);
  } else {
    elements.profileAvatar.textContent = buildInitials(profile.username);
  }
}

function renderAccount() {
  const account = state.account;
  if (!account) {
    renderDefinitionList(elements.accountSummary, [['状态', '暂无数据']]);
    return;
  }

  renderDefinitionList(elements.accountSummary, [
    ['账户余额', account.acbalance || '-'],
    ['电表名称', account.jacountname || '-'],
    ['电表编号', account.jacountno || '-'],
    ['电表房间', account.jacountroom || '-'],
  ]);
}

function renderChargeStatus() {
  const status = state.chargeStatus;
  if (!status || !Object.keys(status).length) {
    renderDefinitionList(elements.chargeStatusSummary, [['当前状态', '当前暂无充电记录']]);
    return;
  }

  renderDefinitionList(elements.chargeStatusSummary, [
    ['当前状态', status.chargestatus || '-'],
    ['设备位置', status.position || '-'],
    ['开始时间', status.bgtime || '-'],
    ['持续时长', status.duration || '-'],
    ['用电量', status.quantity || '-'],
    ['当前费用', status.price || '-'],
  ]);
}

function renderRecords() {
  const records = Array.isArray(state.records) ? state.records : [];
  elements.recordsList.innerHTML = '';

  if (records.length === 0) {
    const emptyCard = document.createElement('article');
    emptyCard.className = 'empty-card';
    emptyCard.textContent = `${state.recordMonth.yy}-${state.recordMonth.mm} 暂无记录`;
    elements.recordsList.appendChild(emptyCard);
    return;
  }

  records.forEach((record, index) => {
    const card = document.createElement('article');
    card.className = 'record-card';

    const title = document.createElement('h3');
    title.textContent = record.position || record.bgtime || `记录 ${index + 1}`;
    card.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'record-grid';
    for (const [key, value] of Object.entries(record)) {
      grid.appendChild(buildRecordRow(key, value));
    }
    card.appendChild(grid);
    elements.recordsList.appendChild(card);
  });
}

function renderAdvanced() {
  elements.priceInfoRaw.textContent = prettyJson(state.priceInfo);
  elements.jacountRaw.textContent = prettyJson(state.jacount);
  elements.chargeListRaw.textContent = prettyJson(state.chargeList);
  elements.messageRaw.textContent = prettyJson(state.message);
}

function renderPayment() {
  const launch = state.payment?.launch;
  const visible = Boolean(launch);
  elements.paymentLaunch.classList.toggle('hidden', !visible);
  if (!visible) {
    elements.paymentUrl.value = '';
    elements.paymentMessage.textContent = '';
    return;
  }

  elements.paymentMessage.textContent =
    `${launch.message || '支付订单已生成。'} 当前 method=${launch.method || '-'}，product_code=${launch.productCode || '-' }。`;
  elements.paymentOpen.disabled = launch.webSupported === false;
  elements.paymentOpen.textContent =
    launch.webSupported === false ? '当前 Web 无法支付' : '前往支付宝';
  elements.paymentUrl.value = prettyJson({
    gatewayUrl: launch.gatewayUrl || '',
    method: launch.method || '',
    productCode: launch.productCode || '',
    webSupported: launch.webSupported !== false,
    strategy: launch.strategy || '',
    queryUrl: launch.queryUrl || '',
  });
}

function renderStations() {
  const overview = state.stations;
  elements.stationSummary.innerHTML = '';
  elements.stationGrid.innerHTML = '';

  if (!overview) {
    elements.stationNote.textContent = '地点状态尚未加载。';
    return;
  }

  elements.stationNote.textContent = overview.note || '上游接口未提供额外说明。';

  const totals = overview.totals || {};
  const statRows = [
    ['地点数', totals.locationCount ?? 0],
    ['充电桩总数', totals.totalCount ?? 0],
    ['可用空闲数', totals.freeCount ?? 0],
    ['充电中数量', totals.chargingCount ?? 0],
    ['异常数量', totals.errorCount ?? 0],
  ];

  statRows.forEach(([label, value]) => {
    const card = document.createElement('div');
    card.className = 'station-stat';
    card.innerHTML = `
      <div class="station-stat-label">${escapeHtml(label)}</div>
      <div class="station-stat-value">${escapeHtml(String(value))}</div>
    `;
    elements.stationSummary.appendChild(card);
  });

  const filtered = (overview.locations || []).filter((item) => {
    const matchesQuery =
      !state.stationQuery ||
      item.rname.toLowerCase().includes(state.stationQuery) ||
      (item.piles || []).some((pile) => pile.name.toLowerCase().includes(state.stationQuery));

    if (!matchesQuery) {
      return false;
    }

    if (state.stationFilter === 'all') {
      return true;
    }
    if (state.stationFilter === 'available') {
      return item.statusCode === 'available';
    }
    if (state.stationFilter === 'busy') {
      return item.statusCode === 'busy' || item.statusCode === 'mixed';
    }
    if (state.stationFilter === 'fault') {
      return item.statusCode === 'fault';
    }
    return true;
  });

  if (filtered.length === 0) {
    const empty = document.createElement('article');
    empty.className = 'empty-card';
    empty.textContent = '当前筛选条件下没有匹配的地点。';
    elements.stationGrid.appendChild(empty);
    return;
  }

  filtered.forEach((item) => {
    const card = document.createElement('article');
    card.className = `station-card status-${item.statusCode || 'unknown'}`;
    const piles = Array.isArray(item.piles) ? item.piles : [];
    const pileMarkup = piles.length
      ? `
        <div class="station-piles">
          ${piles
            .map(
              (pile) => `
                <div class="pile-item status-${pile.statusCode || 'unknown'}">
                  <div class="pile-name">${escapeHtml(pile.name || '未命名充电桩')}</div>
                  <div class="pile-status">${escapeHtml(pile.statusLabel || pile.status || '状态未知')}</div>
                </div>`,
            )
            .join('')}
        </div>
      `
      : '<div class="empty-card">当前地点没有拿到逐桩数据。</div>';
    card.innerHTML = `
      <div class="station-card-header">
        <div>
          <h3>${escapeHtml(item.rname || '未命名地点')}</h3>
          <p class="muted">地点编号 ${escapeHtml(item.rid || '-')}</p>
        </div>
        <span class="status-pill status-${item.statusCode || 'unknown'}">${escapeHtml(item.statusLabel || '状态未知')}</span>
      </div>
      <div class="definition-list">
        <div class="definition-row">
          <div class="definition-term">空闲</div>
          <div class="definition-value">${escapeHtml(String(item.freeCount ?? 0))}</div>
        </div>
        <div class="definition-row">
          <div class="definition-term">充电中</div>
          <div class="definition-value">${escapeHtml(String(item.chargingCount ?? 0))}</div>
        </div>
        <div class="definition-row">
          <div class="definition-term">异常</div>
          <div class="definition-value">${escapeHtml(String(item.errorCount ?? 0))}</div>
        </div>
        <div class="definition-row">
          <div class="definition-term">总计</div>
          <div class="definition-value">${escapeHtml(String(item.totalCount ?? 0))}</div>
        </div>
      </div>
      <div class="pile-section">
        <div class="pile-section-head">
          <span class="muted">逐桩状态</span>
          <span class="muted">${escapeHtml(String(piles.length))} 根</span>
        </div>
        ${pileMarkup}
      </div>
    `;
    elements.stationGrid.appendChild(card);
  });
}

function renderDefinitionList(container, rows) {
  container.innerHTML = '';
  rows.forEach(([term, value]) => {
    const row = document.createElement('div');
    row.className = 'definition-row';

    const termElement = document.createElement('div');
    termElement.className = 'definition-term';
    termElement.textContent = term;

    const valueElement = document.createElement('div');
    valueElement.className = 'definition-value';
    valueElement.textContent = value || '-';

    row.appendChild(termElement);
    row.appendChild(valueElement);
    container.appendChild(row);
  });
}

function buildRecordRow(key, value) {
  const row = document.createElement('div');
  row.className = 'definition-row';

  const keyElement = document.createElement('div');
  keyElement.className = 'definition-term';
  keyElement.textContent = key;

  const valueElement = document.createElement('div');
  valueElement.className = 'definition-value';
  valueElement.textContent = value == null ? '-' : String(value);

  row.appendChild(keyElement);
  row.appendChild(valueElement);
  return row;
}

function buildInitials(name) {
  return String(name || 'AC').trim().slice(0, 2).toUpperCase();
}

function prettyJson(value) {
  if (value == null) {
    return '尚未加载';
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value);
  }
}

function getDefaultMonth() {
  const now = new Date();
  return {
    yy: String(now.getFullYear()),
    mm: String(now.getMonth() + 1).padStart(2, '0'),
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function submitPaymentForm(action, fields, target) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = action;
  form.target = target;
  form.style.display = 'none';

  Object.entries(fields || {}).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = String(value ?? '');
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
  form.remove();
}

function showToast(message, isError = false) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.remove('hidden');
  elements.toast.style.background = isError
    ? 'rgba(125, 26, 26, 0.92)'
    : 'rgba(19, 38, 28, 0.92)';
  toastTimer = window.setTimeout(() => {
    elements.toast.classList.add('hidden');
  }, 2800);
}

function setButtonBusy(button, busy, label) {
  if (!button) {
    return;
  }
  button.disabled = busy;
  button.textContent = label;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (response.status === 401) {
    state.session = null;
    render();
  }

  if (!response.ok) {
    throw new Error(payload?.error || '请求失败');
  }

  return payload;
}
