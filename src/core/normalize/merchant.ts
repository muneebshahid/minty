import { normalizeWhitespace } from "./text.js";

export function normalizeMerchant(rawDescription: string): string {
  let s = rawDescription.normalize("NFKC");
  s = s.toUpperCase();
  s = normalizeWhitespace(s);

  // Remove obvious card digit groups / long numeric ids.
  s = s.replace(/\b\d{4}(\s?\d{4}){2,}\b/g, "");
  s = s.replace(/\b\d{6,}\b/g, "");

  // Remove long alphanumeric tokens (reference ids) conservatively.
  s = s.replace(/\b[A-Z0-9]{12,}\b/g, "");

  // Remove some common noise tokens.
  s = s.replace(
    /\b(VISA|MASTERCARD|MC|CARD|DEBIT|CREDIT|AUTH|TRX|TXN|REF)\b/g,
    ""
  );

  s = normalizeWhitespace(s);
  return s || "UNKNOWN";
}
