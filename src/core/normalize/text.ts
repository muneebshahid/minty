export function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

export function normalizeForHash(input: string): string {
  return normalizeWhitespace(input).toUpperCase();
}
