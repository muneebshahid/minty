import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { openSqlite } from "../../src/core/db/client.js";
import { migrateDatabase } from "../../src/core/db/migrations/migrate.js";
import type { MintyContext } from "../../src/core/profile/context.js";

export function createTestContext(): MintyContext & { tmpDir: string } {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "minty-test-"));
  const dbPath = path.join(tmpDir, "ledger.sqlite");

  const { sqlite, db } = openSqlite(dbPath);
  migrateDatabase(sqlite);

  const userId = randomUUID();
  sqlite
    .prepare("INSERT INTO users (id, name, createdAt) VALUES (?, ?, ?)")
    .run(userId, "default", Date.now());

  return {
    tmpDir,
    userId,
    dbPath,
    sqlite,
    db,
    close: () => sqlite.close(),
  };
}
