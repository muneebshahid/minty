import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  readConfigOrDefault,
  writeConfig,
} from "../src/core/config/loadConfig.js";

describe("config", () => {
  it("writes and reads defaults", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "minty-config-"));
    const file = path.join(dir, "config.json");

    const config = readConfigOrDefault(file);
    writeConfig(file, config);

    const readBack = readConfigOrDefault(file);
    expect(readBack.llm.enabled).toBe(false);
    expect(readBack.llm.provider).toBe("none");
    expect(readBack.privacy.sendRawDescriptionToLLM).toBe(false);
  });
});
