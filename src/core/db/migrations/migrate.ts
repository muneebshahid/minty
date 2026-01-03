import type BetterSqlite3 from "better-sqlite3";
import { migrations } from "./migrations.js";

function ensureMigrationsTable(sqlite: BetterSqlite3.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS __minty_migrations (
      name TEXT PRIMARY KEY,
      appliedAt INTEGER NOT NULL
    );
  `);
}

function isApplied(sqlite: BetterSqlite3.Database, name: string): boolean {
  const row = sqlite
    .prepare("SELECT 1 as ok FROM __minty_migrations WHERE name = ? LIMIT 1")
    .get(name) as { ok: 1 } | undefined;
  return Boolean(row?.ok);
}

function markApplied(sqlite: BetterSqlite3.Database, name: string) {
  sqlite
    .prepare("INSERT INTO __minty_migrations (name, appliedAt) VALUES (?, ?)")
    .run(name, Date.now());
}

export function migrateDatabase(sqlite: BetterSqlite3.Database) {
  sqlite.pragma("foreign_keys = ON");
  ensureMigrationsTable(sqlite);

  const apply = sqlite.transaction(() => {
    for (const migration of migrations) {
      if (isApplied(sqlite, migration.name)) continue;
      sqlite.exec(migration.sql);
      markApplied(sqlite, migration.name);
    }
  });

  apply();
}
