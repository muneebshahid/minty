-- Minty initial schema
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS __minty_migrations (
  name TEXT PRIMARY KEY,
  appliedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  name TEXT NOT NULL,
  currency TEXT,
  createdAt INTEGER NOT NULL,
  UNIQUE(userId, name),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ingest_runs (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  accountId TEXT NOT NULL,
  sourceType TEXT NOT NULL,
  sourceMeta TEXT NOT NULL,
  startedAt INTEGER NOT NULL,
  endedAt INTEGER,
  status TEXT NOT NULL,
  error TEXT,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  accountId TEXT NOT NULL,
  postedAt TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  rawDescription TEXT NOT NULL,
  normalizedMerchant TEXT NOT NULL,
  category TEXT,
  categoryConfidence REAL,
  categorySource TEXT NOT NULL,
  externalId TEXT,
  hash TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS transactions_account_hash_unique
  ON transactions(accountId, hash);

CREATE UNIQUE INDEX IF NOT EXISTS transactions_account_externalId_unique
  ON transactions(accountId, externalId)
  WHERE externalId IS NOT NULL;

CREATE TABLE IF NOT EXISTS rules (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  matchType TEXT NOT NULL,
  pattern TEXT NOT NULL,
  merchantOverride TEXT,
  category TEXT NOT NULL,
  priority INTEGER NOT NULL,
  createdAt INTEGER NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  normalizedMerchant TEXT NOT NULL,
  currency TEXT NOT NULL,
  period TEXT NOT NULL,
  avgAmount INTEGER NOT NULL,
  confidence REAL NOT NULL,
  lastSeenAt TEXT NOT NULL,
  nextExpectedAt TEXT,
  updatedAt INTEGER NOT NULL,
  UNIQUE(userId, normalizedMerchant, currency),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

