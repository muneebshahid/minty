import BetterSqlite3 from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

export type SqliteClient = {
  sqlite: BetterSqlite3.Database;
  db: ReturnType<typeof drizzle>;
};

export function openSqlite(dbPath: string): SqliteClient {
  const sqlite = new BetterSqlite3(dbPath);
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite);
  return { sqlite, db };
}

