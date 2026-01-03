import { describe, expect, it } from "vitest";
import { parseMoneyToMinorUnits } from "../src/shared/money.js";

describe("money", () => {
  it("parses dot-decimal", () => {
    expect(parseMoneyToMinorUnits("12.34")).toBe(1234);
    expect(parseMoneyToMinorUnits("-12.34")).toBe(-1234);
  });

  it("parses comma-decimal", () => {
    expect(parseMoneyToMinorUnits("1.234,56")).toBe(123456);
    expect(parseMoneyToMinorUnits("1234,56")).toBe(123456);
  });

  it("parses thousands separators", () => {
    expect(parseMoneyToMinorUnits("1,234.56")).toBe(123456);
    expect(parseMoneyToMinorUnits("1 234,56")).toBe(123456);
  });
});
