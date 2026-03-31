const crypto = require('node:crypto');
const { SESSION_COOKIE, SESSION_TTL_MS } = require('./config');

class SessionStore {
  constructor() {
    this.sessions = new Map();
  }

  create(data) {
    const sid = crypto.randomBytes(24).toString('hex');
    const now = Date.now();
    this.sessions.set(sid, {
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    return sid;
  }

  get(sid) {
    if (!sid) {
      return null;
    }

    const session = this.sessions.get(sid);
    if (!session) {
      return null;
    }

    if (Date.now() - session.updatedAt > SESSION_TTL_MS) {
      this.sessions.delete(sid);
      return null;
    }

    return session;
  }

  touch(sid) {
    const session = this.get(sid);
    if (!session) {
      return null;
    }

    session.updatedAt = Date.now();
    this.sessions.set(sid, session);
    return session;
  }

  destroy(sid) {
    if (sid) {
      this.sessions.delete(sid);
    }
  }

  pruneExpired() {
    const now = Date.now();
    for (const [sid, session] of this.sessions.entries()) {
      if (now - session.updatedAt > SESSION_TTL_MS) {
        this.sessions.delete(sid);
      }
    }
  }
}

function parseCookies(headerValue) {
  const cookies = {};
  if (!headerValue) {
    return cookies;
  }

  for (const chunk of headerValue.split(';')) {
    const separatorIndex = chunk.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = chunk.slice(0, separatorIndex).trim();
    const value = chunk.slice(separatorIndex + 1).trim();
    if (key) {
      cookies[key] = decodeURIComponent(value);
    }
  }

  return cookies;
}

function buildSessionCookie(sid, secure) {
  const pieces = [
    `${SESSION_COOKIE}=${encodeURIComponent(sid)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ];

  if (secure) {
    pieces.push('Secure');
  }

  return pieces.join('; ');
}

function buildClearSessionCookie(secure) {
  const pieces = [
    `${SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];

  if (secure) {
    pieces.push('Secure');
  }

  return pieces.join('; ');
}

module.exports = {
  SessionStore,
  parseCookies,
  buildSessionCookie,
  buildClearSessionCookie,
};
