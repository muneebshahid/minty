import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { openSqlite } from "../db/client.js";
import { migrateDatabase } from "../db/migrations/migrate.js";
import { readConfigOrDefault, writeConfig } from "../config/loadConfig.js";
import { assertValidUserName, userConfigPath, userDbPath, userHomeDir, userRulesPath } from "../config/paths.js";
import { MintyError } from "../../shared/errors.js";

export async function initUserProfile(opts: { userName: string }): Promise<{
  userName: string;
  userId: string;
  homeDir: string;
  dbPath: string;
  configPath: string;
  rulesPath: string;
}> {
  const userName = assertValidUserName(opts.userName);
  const homeDir = userHomeDir(userName);
  const dbPath = userDbPath(userName);
  const configPath = userConfigPath(userName);
  const rulesPath = userRulesPath(userName);

  fs.mkdirSync(homeDir, { recursive: true });

  if (!fs.existsSync(configPath)) {
    const config = readConfigOrDefault(configPath);
    writeConfig(configPath, config);
  }

  if (!fs.existsSync(rulesPath)) {
    fs.writeFileSync(rulesPath, `${JSON.stringify({ version: 1, rules: [] }, null, 2)}\n`, "utf8");
  }

  const { sqlite } = openSqlite(dbPath);
  try {
    migrateDatabase(sqlite);

    const existing = sqlite
      .prepare("SELECT id, name FROM users WHERE name = ? LIMIT 1")
      .get(userName) as { id: string; name: string } | undefined;

    if (existing) {
      return { userName: existing.name, userId: existing.id, homeDir, dbPath, configPath, rulesPath };
    }

    const userId = randomUUID();
    try {
      sqlite
        .prepare("INSERT INTO users (id, name, createdAt) VALUES (?, ?, ?)")
        .run(userId, userName, Date.now());
    } catch (error) {
      // If another process created the user concurrently, re-read.
      const again = sqlite
        .prepare("SELECT id, name FROM users WHERE name = ? LIMIT 1")
        .get(userName) as { id: string; name: string } | undefined;
      if (!again) throw new MintyError("Failed to initialize user", { cause: error });
      return { userName: again.name, userId: again.id, homeDir, dbPath, configPath, rulesPath };
    }

    return { userName, userId, homeDir, dbPath, configPath, rulesPath };
  } finally {
    sqlite.close();
  }
}
