import { describe, expect, it } from "vitest";
import { parseDateToISODate } from "../src/shared/dates.js";

describe("dates", () => {
  it("parses ISO", () => {
    expect(parseDateToISODate("2026-01-02")).toBe("2026-01-02");
  });

  it("parses dot format", () => {
    expect(parseDateToISODate("02.01.2026")).toBe("2026-01-02");
  });

  it("parses slash format with heuristics", () => {
    expect(parseDateToISODate("01/02/2026", "auto")).toBe("2026-01-02");
    expect(parseDateToISODate("13/02/2026", "auto")).toBe("2026-02-13");
  });
});
