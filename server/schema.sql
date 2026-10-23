-- Maths Practice API storage (Cloudflare D1)
CREATE TABLE IF NOT EXISTS sync (
  id TEXT PRIMARY KEY,          -- SHA-256 of the student's sync code (the code itself never reaches the server)
  v INTEGER NOT NULL,           -- version, for optimistic concurrency
  data TEXT NOT NULL,           -- encrypted, compressed progress (base64)
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS usage (
  day TEXT NOT NULL,            -- YYYY-MM-DD (UTC)
  kind TEXT NOT NULL,           -- 'ai' (calls), 'bad-code' (wrong access codes), 'login:<username>' (wrong passwords)
  n INTEGER NOT NULL,
  PRIMARY KEY (day, kind)
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,  -- lower case
  name TEXT NOT NULL,
  pass TEXT NOT NULL,             -- s1$salt$sha256(salt + the app's PBKDF2-stretched password)
  admin INTEGER NOT NULL DEFAULT 0,
  must_change INTEGER NOT NULL DEFAULT 1,  -- set by an admin: choose your own at first sign-in
  disabled INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  last_seen INTEGER
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,         -- SHA-256 of the bearer token
  user_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions (user_id);
CREATE TABLE IF NOT EXISTS user_data (
  user_id INTEGER PRIMARY KEY,
  v INTEGER NOT NULL,             -- version, for optimistic concurrency
  data TEXT NOT NULL,             -- compressed progress, history and settings (base64)
  summary TEXT,                   -- JSON for the admin list: questions, marks, last active
  updated_at INTEGER NOT NULL
);
