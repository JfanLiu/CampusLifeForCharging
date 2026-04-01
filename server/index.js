const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {
  APP_NAME,
  HOST,
  PORT,
  SESSION_COOKIE,
} = require('./config');
const {
  login,
  getAccountInfo,
  getChargeStatus,
  getStationOverview,
  getChargeRecords,
  doCharge,
} = require('./upstream');
const {
  SessionStore,
  parseCookies,
  buildSessionCookie,
  buildClearSessionCookie,
} = require('./sessionStore');

const publicRoot = path.resolve(__dirname, '..', 'dist');
const sessionStore = new SessionStore();

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function isSecureRequest(req) {
  return req.socket.encrypted || req.headers['x-forwarded-proto'] === 'https';
}

function setDefaultHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
}

function sendJson(res, statusCode, payload, headers = {}) {
  setDefaultHeaders(res);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(JSON.stringify(payload));
}

function sendError(res, statusCode, message) {
  sendJson(res, statusCode, {
    error: message,
  });
}

async function readJsonBody(req) {
  let rawBody = '';

  for await (const chunk of req) {
    rawBody += chunk;
    if (rawBody.length > 1024 * 1024) {
      throw new Error('请求体过大');
    }
  }

  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody);
  } catch (error) {
    throw new Error('请求体不是合法 JSON');
  }
}

function getSessionContext(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const sid = cookies[SESSION_COOKIE];
  const session = sessionStore.touch(sid);
  return { sid, session };
}

function requireSession(req, res) {
  const { sid, session } = getSessionContext(req);
  if (!sid || !session) {
    sendError(res, 401, '未登录或会话已过期');
    return null;
  }

  return { sid, session };
}

function getMonthDefaults() {
  const now = new Date();
  const yy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return { yy, mm };
}

function sessionPayload(session) {
  return {
    loggedIn: true,
    userid: session.userid,
    profile: session.profile || null,
  };
}

async function handleApiRequest(req, res, requestUrl) {
  if (req.method === 'GET' && requestUrl.pathname === '/api/health') {
    return sendJson(res, 200, {
      ok: true,
      app: APP_NAME,
      now: new Date().toISOString(),
      sessionStore: sessionStore.snapshot(),
    });
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/session') {
    const { session } = getSessionContext(req);
    if (!session) {
      return sendJson(res, 200, { loggedIn: false });
    }
    return sendJson(res, 200, sessionPayload(session));
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/login') {
    const body = await readJsonBody(req);
    const username = String(body.username || '').trim();
    const password = String(body.password || '').trim();

    if (!username || !password) {
      return sendError(res, 400, '用户名和密码不能为空');
    }

    const result = await login(username, password);
    const secure = isSecureRequest(req);
    const sid = sessionStore.create({
      userid: result.userId,
      profile: result.profile,
    });

    return sendJson(
      res,
      200,
      {
        ...sessionPayload({
          userid: result.userId,
          profile: result.profile,
        }),
      },
      {
        'Set-Cookie': buildSessionCookie(sid, secure),
      },
    );
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/logout') {
    const { sid } = getSessionContext(req);
    sessionStore.destroy(sid);
    return sendJson(
      res,
      200,
      { ok: true },
      { 'Set-Cookie': buildClearSessionCookie(isSecureRequest(req)) },
    );
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/bootstrap') {
    const auth = requireSession(req, res);
    if (!auth) {
      return;
    }

    const { yy, mm } = getMonthDefaults();
    const [account, chargeStatus, records, stations] = await Promise.all([
      getAccountInfo(auth.session.userid),
      getChargeStatus(auth.session.userid).catch(() => null),
      getChargeRecords(auth.session.userid, yy, mm).catch(() => []),
      getStationOverview().catch(() => null),
    ]);

    return sendJson(res, 200, {
      session: sessionPayload(auth.session),
      account,
      chargeStatus,
      records,
      stations,
      recordMonth: { yy, mm },
    });
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/account') {
    const auth = requireSession(req, res);
    if (!auth) {
      return;
    }
    return sendJson(res, 200, await getAccountInfo(auth.session.userid));
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/charge-status') {
    const auth = requireSession(req, res);
    if (!auth) {
      return;
    }
    return sendJson(res, 200, await getChargeStatus(auth.session.userid));
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/stations') {
    return sendJson(res, 200, await getStationOverview());
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/charge-records') {
    const auth = requireSession(req, res);
    if (!auth) {
      return;
    }

    const yy = String(requestUrl.searchParams.get('yy') || '').trim();
    const mm = String(requestUrl.searchParams.get('mm') || '').trim();
    if (!/^\d{4}$/.test(yy) || !/^\d{2}$/.test(mm)) {
      return sendError(res, 400, '年月参数不合法');
    }

    return sendJson(
      res,
      200,
      await getChargeRecords(auth.session.userid, yy, mm),
    );
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/charge') {
    const auth = requireSession(req, res);
    if (!auth) {
      return;
    }

    const body = await readJsonBody(req);
    const qrcode = String(body.qrcode || '').trim();
    if (!/^\d{1,32}$/.test(qrcode)) {
      return sendError(res, 400, '二维码后8位必须是数字');
    }

    return sendJson(res, 200, await doCharge(auth.session.userid, qrcode));
  }

  return sendError(res, 404, '接口不存在');
}

function resolveStaticPath(requestPath) {
  const normalizedPath =
    requestPath === '/' ? '/index.html' : decodeURIComponent(requestPath);
  const absolutePath = path.join(publicRoot, normalizedPath);
  const normalizedAbsolutePath = path.normalize(absolutePath);

  if (!normalizedAbsolutePath.startsWith(publicRoot)) {
    return null;
  }

  return normalizedAbsolutePath;
}

function serveStatic(req, res, requestUrl) {
  if (!fs.existsSync(publicRoot) || !fs.statSync(publicRoot).isDirectory()) {
    return sendError(res, 503, '前端资源不存在，请先执行 npm run build');
  }

  let targetPath = resolveStaticPath(requestUrl.pathname);
  if (!targetPath) {
    return sendError(res, 400, '非法路径');
  }

  if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
    targetPath = path.join(publicRoot, 'index.html');
  }

  if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
    return sendError(res, 503, '前端资源不存在，请先执行 npm run build');
  }

  const extension = path.extname(targetPath).toLowerCase();
  const contentType = mimeTypes[extension] || 'application/octet-stream';
  const cacheControl =
    extension === '.html'
      ? 'no-store'
      : 'public, max-age=31536000, immutable';

  setDefaultHeaders(res);
  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': cacheControl,
  });

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  fs.createReadStream(targetPath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  sessionStore.pruneExpired();
  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  try {
    if (requestUrl.pathname.startsWith('/api/')) {
      await handleApiRequest(req, res, requestUrl);
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      sendError(res, 405, '静态资源仅支持 GET');
      return;
    }

    serveStatic(req, res, requestUrl);
  } catch (error) {
    console.error('[web]', error);
    sendError(res, 500, error.message || '服务器内部错误');
  }
});

registerShutdownHooks();

server.listen(PORT, HOST, () => {
  const displayHost = HOST === '0.0.0.0' || HOST === '::' ? '127.0.0.1' : HOST;
  console.log(`${APP_NAME} listening on http://${displayHost}:${PORT}`);
});

function registerShutdownHooks() {
  const flushAndExit = (code) => {
    try {
      sessionStore.flushSync();
    } finally {
      process.exit(code);
    }
  };

  process.once('SIGINT', () => flushAndExit(0));
  process.once('SIGTERM', () => flushAndExit(0));
  process.once('beforeExit', () => {
    sessionStore.flushSync();
  });
}
