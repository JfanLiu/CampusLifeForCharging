const UPSTREAM_BASE = 'http://kld.sjtu.edu.cn:80/campuslifedispatch/WebService.asmx';

module.exports = {
  APP_NAME: 'AltCampusLife Web',
  PORT: Number(process.env.PORT || 8787),
  PUBLIC_DIR: 'public',
  LOGIN_URL: 'http://kld.sjtu.edu.cn:80/campuslife/WebService.asmx/UserService',
  PREFIX: UPSTREAM_BASE,
  USER_URL: `${UPSTREAM_BASE}/UserService`,
  CHARGE_URL: `${UPSTREAM_BASE}/ChargeService`,
  PAY_URL: `${UPSTREAM_BASE}/PayService`,
  DES_IV: 'univlive',
  DES_KEY: '85281581',
  USER_AGENT: 'okhttp/2.7.5',
  MIN_PAY_AMOUNT: 1.5,
  SESSION_COOKIE: 'altcampuslife_sid',
  SESSION_TTL_MS: 7 * 24 * 60 * 60 * 1000,
  REQUEST_TIMEOUT_MS: 20000,
};
