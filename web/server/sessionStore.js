const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  SESSION_PERSIST_ENABLED,
  SESSION_FILE_PATH,
  SESSION_WRITE_DEBOUNCE_MS,
} = require('./config');

class SessionStore {
  constructor() {
    this.sessions = new Map();
    this.flushTimer = null;
    this.dirty = false;

    this.loadFromDisk();
  }

  create(data) {
    const sid = crypto.randomBytes(24).toString('hex');
    const now = Date.now();
    this.sessions.set(sid, {
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    this.persistSoon();
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
      this.persistSoon();
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
    this.persistSoon();
    return session;
  }

  destroy(sid) {
    if (sid && this.sessions.delete(sid)) {
      this.persistSoon();
    }
  }

  pruneExpired() {
    const now = Date.now();
    let changed = false;
    for (const [sid, session] of this.sessions.entries()) {
      if (now - session.updatedAt > SESSION_TTL_MS) {
        this.sessions.delete(sid);
        changed = true;
      }
    }

    if (changed) {
      this.persistSoon();
    }
  }

  flushSync() {
    if (!SESSION_PERSIST_ENABLED) {
      return;
    }

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    this.writeToDisk();
  }

  snapshot() {
    return {
      mode: SESSION_PERSIST_ENABLED ? 'file' : 'memory',
      ttlMs: SESSION_TTL_MS,
      filePath: SESSION_PERSIST_ENABLED ? SESSION_FILE_PATH : null,
      sessionCount: this.sessions.size,
    };
  }

  loadFromDisk() {
    if (!SESSION_PERSIST_ENABLED || !fs.existsSync(SESSION_FILE_PATH)) {
      return;
    }

    try {
      const raw = fs.readFileSync(SESSION_FILE_PATH, 'utf8');
      if (!raw.trim()) {
        return;
      }

      const payload = JSON.parse(raw);
      const entries = Array.isArray(payload.sessions) ? payload.sessions : [];
      const now = Date.now();

      entries.forEach(([sid, session]) => {
        if (
          !sid ||
          !session ||
          typeof session.updatedAt !== 'number' ||
          now - session.updatedAt > SESSION_TTL_MS
        ) {
          return;
        }
        this.sessions.set(String(sid), session);
      });
    } catch (error) {
      console.warn('[web] failed to load persisted sessions:', error.message);
    }
  }

  persistSoon() {
    if (!SESSION_PERSIST_ENABLED) {
      return;
    }

    this.dirty = true;
    if (this.flushTimer) {
      return;
    }

    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.writeToDisk();
    }, SESSION_WRITE_DEBOUNCE_MS);

    if (typeof this.flushTimer.unref === 'function') {
      this.flushTimer.unref();
    }
  }

  writeToDisk() {
    if (!SESSION_PERSIST_ENABLED || !this.dirty) {
      return;
    }

    const directory = path.dirname(SESSION_FILE_PATH);
    const tempFile = `${SESSION_FILE_PATH}.tmp`;
    const payload = JSON.stringify(
      {
        version: 1,
        sessions: Array.from(this.sessions.entries()),
      },
      null,
      2,
    );

    try {
      fs.mkdirSync(directory, { recursive: true });
      fs.writeFileSync(tempFile, payload, 'utf8');
      fs.renameSync(tempFile, SESSION_FILE_PATH);
      this.dirty = false;
    } catch (error) {
      console.warn('[web] failed to persist sessions:', error.message);
      try {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      } catch (cleanupError) {
        console.warn('[web] failed to clean temp session file:', cleanupError.message);
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
