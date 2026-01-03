import fs from "node:fs";
import { MintyError } from "../../shared/errors.js";
import { openSqlite } from "../db/client.js";
import { migrateDatabase } from "../db/migrations/migrate.js";
import { profileDbPath } from "../config/paths.js";

export type MintyContext = {
  userId: string;
  dbPath: string;
  close: () => void;
  sqlite: ReturnType<typeof openSqlite>["sqlite"];
  db: ReturnType<typeof openSqlite>["db"];
};

export function openContext(): MintyContext {
  const dbPath = profileDbPath();
  if (!fs.existsSync(dbPath)) {
    throw new MintyError("Profile is not initialized. Run `minty init` first.");
  }

  const { sqlite, db } = openSqlite(dbPath);
  migrateDatabase(sqlite);

  const row = sqlite.prepare("SELECT id FROM users LIMIT 1").get() as
    | { id: string }
    | undefined;
  if (!row) {
    sqlite.close();
    throw new MintyError(
      "Profile is missing user record. Re-run `minty init`."
    );
  }

  return {
    userId: row.id,
    dbPath,
    sqlite,
    db,
    close: () => sqlite.close(),
  };
}
