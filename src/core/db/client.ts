import { createRequire } from "node:module";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";
import { MintyError } from "../../shared/errors.js";

export type SqliteClient = {
  sqlite: import("better-sqlite3").Database;
  db: ReturnType<typeof drizzle>;
};

export function openSqlite(dbPath: string): SqliteClient {
  const require = createRequire(import.meta.url);
  let BetterSqlite3: typeof import("better-sqlite3");
  try {
    BetterSqlite3 = require("better-sqlite3");
  } catch (error) {
    const nodeVersion = process.versions.node;
    throw new MintyError(
      `Failed to load 'better-sqlite3' native module. Minty currently requires Node 22.x (detected ${nodeVersion}).`,
      { cause: error }
    );
  }

  let sqlite: import("better-sqlite3").Database;
  try {
    sqlite = new BetterSqlite3(dbPath);
  } catch (error) {
    const nodeVersion = process.versions.node;
    throw new MintyError(
      `Failed to open SQLite database via 'better-sqlite3'. Minty currently requires Node 22.x (detected ${nodeVersion}).`,
      { cause: error }
    );
  }
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  return { sqlite, db };
}
