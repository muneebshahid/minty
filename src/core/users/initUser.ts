import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { openSqlite } from "../db/client.js";
import { migrateDatabase } from "../db/migrations/migrate.js";
import { readConfigOrDefault, writeConfig } from "../config/loadConfig.js";
import {
  mintyHomeDir,
  profileConfigPath,
  profileDbPath,
  profileRulesPath,
} from "../config/paths.js";
import { MintyError } from "../../shared/errors.js";

export async function initProfile(): Promise<{
  userId: string;
  homeDir: string;
  dbPath: string;
  configPath: string;
  rulesPath: string;
}> {
  const homeDir = mintyHomeDir();
  const dbPath = profileDbPath();
  const configPath = profileConfigPath();
  const rulesPath = profileRulesPath();

  fs.mkdirSync(homeDir, { recursive: true });

  if (!fs.existsSync(configPath)) {
    const config = readConfigOrDefault(configPath);
    writeConfig(configPath, config);
  }

  if (!fs.existsSync(rulesPath)) {
    fs.writeFileSync(
      rulesPath,
      `${JSON.stringify({ version: 1, rules: [] }, null, 2)}\n`,
      "utf8"
    );
  }

  const { sqlite } = openSqlite(dbPath);
  try {
    migrateDatabase(sqlite);

    const existing = sqlite.prepare("SELECT id FROM users LIMIT 1").get() as
      | { id: string }
      | undefined;

    if (existing) {
      return { userId: existing.id, homeDir, dbPath, configPath, rulesPath };
    }

    const userId = randomUUID();
    try {
      sqlite
        .prepare("INSERT INTO users (id, name, createdAt) VALUES (?, ?, ?)")
        .run(userId, "default", Date.now());
    } catch (error) {
      // If another process created the user concurrently, re-read.
      const again = sqlite.prepare("SELECT id FROM users LIMIT 1").get() as
        | { id: string }
        | undefined;
      if (!again)
        throw new MintyError("Failed to initialize user", { cause: error });
      return { userId: again.id, homeDir, dbPath, configPath, rulesPath };
    }

    return { userId, homeDir, dbPath, configPath, rulesPath };
  } finally {
    sqlite.close();
  }
}
