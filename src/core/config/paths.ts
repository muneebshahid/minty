import os from "node:os";
import path from "node:path";
import { MintyError } from "../../shared/errors.js";

export function mintyHomeDir(): string {
  return path.join(os.homedir(), ".minty");
}

export function assertValidUserName(userName: string): string {
  const trimmed = userName.trim();
  if (!trimmed) throw new MintyError("User name is required");
  if (trimmed === "." || trimmed === "..") throw new MintyError("Invalid user name");
  if (trimmed.includes("/") || trimmed.includes("\\")) throw new MintyError("Invalid user name");
  return trimmed;
}

export function userHomeDir(userName: string): string {
  const safeName = assertValidUserName(userName);
  return path.join(mintyHomeDir(), "users", safeName);
}

export function userDbPath(userName: string): string {
  return path.join(userHomeDir(userName), "ledger.sqlite");
}

export function userConfigPath(userName: string): string {
  return path.join(userHomeDir(userName), "config.json");
}

export function userRulesPath(userName: string): string {
  return path.join(userHomeDir(userName), "rules.json");
}

