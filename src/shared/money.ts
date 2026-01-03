import { MintyError } from "./errors.js";

export function parseMoneyToMinorUnits(raw: string): number {
  const input = raw.trim();
  if (!input) throw new MintyError("Missing amount value");

  // Remove currency symbols and spaces, keep digits, separators, minus.
  const cleaned = input.replace(/[^\d.,-]/g, "");
  if (!cleaned) throw new MintyError(`Invalid amount: '${raw}'`);

  const lastDot = cleaned.lastIndexOf(".");
  const lastComma = cleaned.lastIndexOf(",");

  let normalized = cleaned;
  if (lastDot !== -1 && lastComma !== -1) {
    // Both present: whichever is last is decimal separator.
    const decimalSep = lastDot > lastComma ? "." : ",";
    const thousandsSep = decimalSep === "." ? "," : ".";
    normalized = normalized.replaceAll(thousandsSep, "");
    normalized = normalized.replace(decimalSep, ".");
  } else if (lastComma !== -1) {
    // Only comma: could be decimal or thousands. If exactly 2 digits after comma => decimal.
    const parts = normalized.split(",");
    const fractional = parts.at(-1) ?? "";
    if (fractional.length === 2) {
      normalized = parts.slice(0, -1).join("") + "." + fractional;
    } else {
      normalized = normalized.replaceAll(",", "");
    }
  } else if (lastDot !== -1) {
    const parts = normalized.split(".");
    const fractional = parts.at(-1) ?? "";
    if (fractional.length === 2) {
      normalized = parts.slice(0, -1).join("") + "." + fractional;
    } else {
      normalized = normalized.replaceAll(".", "");
    }
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) throw new MintyError(`Invalid amount: '${raw}'`);

  // Convert to cents (minor units) with rounding safety.
  return Math.round(value * 100);
}
