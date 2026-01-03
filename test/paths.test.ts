import { describe, expect, it } from "vitest";
import {
  mintyHomeDir,
  profileDbPath,
  profileConfigPath,
  profileRulesPath,
} from "../src/core/config/paths.js";

describe("paths", () => {
  it("returns deterministic profile paths", () => {
    expect(mintyHomeDir()).toContain(".minty");
    expect(profileDbPath()).toContain("ledger.sqlite");
    expect(profileConfigPath()).toContain("config.json");
    expect(profileRulesPath()).toContain("rules.json");
  });
});
