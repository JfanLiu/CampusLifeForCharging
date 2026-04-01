const fs = require('node:fs');
const path = require('node:path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

loadEnvFile(path.join(PROJECT_ROOT, '.env'));

const UPSTREAM_BASE =
  process.env.UPSTREAM_BASE || 'http://kld.sjtu.edu.cn:80/campuslifedispatch/WebService.asmx';

module.exports = {
  APP_NAME: process.env.APP_NAME || 'CampusLifeForCharging Web',
  HOST: process.env.HOST || '127.0.0.1',
  PORT: readNumber('PORT', 8787),
  PUBLIC_DIR: process.env.PUBLIC_DIR || 'public',
  LOGIN_URL:
    process.env.LOGIN_URL || 'http://kld.sjtu.edu.cn:80/campuslife/WebService.asmx/UserService',
  PREFIX: UPSTREAM_BASE,
  USER_URL: process.env.USER_URL || `${UPSTREAM_BASE}/UserService`,
  CHARGE_URL: process.env.CHARGE_URL || `${UPSTREAM_BASE}/ChargeService`,
  PAY_URL: process.env.PAY_URL || `${UPSTREAM_BASE}/PayService`,
  DES_IV: process.env.DES_IV || 'univlive',
  DES_KEY: process.env.DES_KEY || '85281581',
  USER_AGENT: process.env.USER_AGENT || 'okhttp/2.7.5',
  MIN_PAY_AMOUNT: readNumber('MIN_PAY_AMOUNT', 1.5),
  SESSION_COOKIE: process.env.SESSION_COOKIE || 'campuslife_sid',
  SESSION_TTL_MS: readNumber('SESSION_TTL_MS', 7 * 24 * 60 * 60 * 1000),
  SESSION_PERSIST_ENABLED: readBoolean('SESSION_PERSIST_ENABLED', true),
  SESSION_FILE_PATH: resolveProjectPath(
    process.env.SESSION_FILE || path.join('data', 'sessions.json'),
  ),
  SESSION_WRITE_DEBOUNCE_MS: readNumber('SESSION_WRITE_DEBOUNCE_MS', 500),
  REQUEST_TIMEOUT_MS: readNumber('REQUEST_TIMEOUT_MS', 20000),
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/u);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (!key || process.env[key] != null) {
      continue;
    }

    let value = line.slice(separatorIndex + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function readNumber(name, fallback) {
  const raw = process.env[name];
  if (raw == null || raw === '') {
    return fallback;
  }

  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function readBoolean(name, fallback) {
  const raw = process.env[name];
  if (raw == null || raw === '') {
    return fallback;
  }

  const normalized = String(raw).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }
  return fallback;
}

function resolveProjectPath(value) {
  return path.isAbsolute(value) ? value : path.resolve(PROJECT_ROOT, value);
}
