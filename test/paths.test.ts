import { describe, expect, it } from "vitest";
import { assertValidUserName, userDbPath } from "../src/core/config/paths.js";

describe("paths", () => {
  it("rejects empty user names", () => {
    expect(() => assertValidUserName("")).toThrow();
    expect(() => assertValidUserName("   ")).toThrow();
  });

  it("rejects path traversal", () => {
    expect(() => assertValidUserName("..")).toThrow();
    expect(() => assertValidUserName("../x")).toThrow();
    expect(() => assertValidUserName("x/..")).toThrow();
  });

  it("returns a deterministic db path", () => {
    const userName = assertValidUserName("muneeb");
    expect(userDbPath(userName)).toContain(".minty");
    expect(userDbPath(userName)).toContain("ledger.sqlite");
  });
});

