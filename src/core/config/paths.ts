import os from "node:os";
import path from "node:path";

export function mintyHomeDir(): string {
  return path.join(os.homedir(), ".minty");
}

export function profileDbPath(): string {
  return path.join(mintyHomeDir(), "ledger.sqlite");
}

export function profileConfigPath(): string {
  return path.join(mintyHomeDir(), "config.json");
}

export function profileRulesPath(): string {
  return path.join(mintyHomeDir(), "rules.json");
}
