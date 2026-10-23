-- Maths Practice API storage (Cloudflare D1)
CREATE TABLE IF NOT EXISTS sync (
  id TEXT PRIMARY KEY,          -- SHA-256 of the student's sync code (the code itself never reaches the server)
  v INTEGER NOT NULL,           -- version, for optimistic concurrency
  data TEXT NOT NULL,           -- encrypted, compressed progress (base64)
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS usage (
  day TEXT NOT NULL,            -- YYYY-MM-DD (UTC)
  kind TEXT NOT NULL,           -- 'ai'
  n INTEGER NOT NULL,
  PRIMARY KEY (day, kind)
);
