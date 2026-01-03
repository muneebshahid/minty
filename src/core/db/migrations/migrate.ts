import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type BetterSqlite3 from "better-sqlite3";

type Migration = { name: string; sql: string };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function listMigrations(migrationsDir: string): Migration[] {
  const names = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort();

  return names.map((name) => ({
    name,
    sql: fs.readFileSync(path.join(migrationsDir, name), "utf8"),
  }));
}

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

  const migrationsDir = path.join(__dirname);
  const migrations = listMigrations(migrationsDir);

  const apply = sqlite.transaction(() => {
    for (const migration of migrations) {
      if (isApplied(sqlite, migration.name)) continue;
      sqlite.exec(migration.sql);
      markApplied(sqlite, migration.name);
    }
  });

  apply();
}

