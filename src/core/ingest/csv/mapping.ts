import { MintyError } from "../../../shared/errors.js";

export type CsvMappingInput = {
  dateCol?: string | undefined;
  amountCol?: string | undefined;
  currencyCol?: string | undefined;
  descriptionCol?: string | undefined;
  externalIdCol?: string | undefined;
};

export type CsvMapping = {
  dateCol: string;
  amountCol: string;
  currencyCol?: string | undefined;
  descriptionCol: string;
  externalIdCol?: string | undefined;
};

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, " ")
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .trim();
}

function findHeader(
  headers: string[],
  candidates: string[]
): string | undefined {
  const normalized = new Map(
    headers.map((h) => [normalizeHeader(h), h] as const)
  );
  for (const candidate of candidates) {
    const found = normalized.get(normalizeHeader(candidate));
    if (found) return found;
  }
  return undefined;
}

export function resolveCsvMapping(
  headers: string[],
  input: CsvMappingInput
): CsvMapping {
  const explicitProvided = Boolean(
    input.dateCol ||
    input.amountCol ||
    input.descriptionCol ||
    input.currencyCol ||
    input.externalIdCol
  );

  const dateCol =
    input.dateCol ??
    findHeader(headers, [
      "date",
      "posted at",
      "postedat",
      "booking date",
      "transaction date",
    ]);
  const amountCol =
    input.amountCol ??
    findHeader(headers, ["amount", "value", "transaction amount"]);
  const descriptionCol =
    input.descriptionCol ??
    findHeader(headers, [
      "description",
      "details",
      "memo",
      "merchant",
      "payee",
    ]);
  const currencyCol =
    input.currencyCol ?? findHeader(headers, ["currency", "ccy"]);
  const externalIdCol =
    input.externalIdCol ??
    findHeader(headers, ["id", "transaction id", "external id", "reference"]);

  if (!dateCol || !amountCol || !descriptionCol) {
    const missing = [
      !dateCol ? "date" : null,
      !amountCol ? "amount" : null,
      !descriptionCol ? "description" : null,
    ].filter(Boolean);

    const hint = explicitProvided
      ? "Provide missing columns via --date-col/--amount-col/--description-col."
      : "Provide mapping via --date-col/--amount-col/--description-col if auto-detection fails.";

    throw new MintyError(
      `Unable to map required CSV columns (${missing.join(", ")}). ${hint}`
    );
  }

  return {
    dateCol,
    amountCol,
    currencyCol: currencyCol ?? undefined,
    descriptionCol,
    externalIdCol: externalIdCol ?? undefined,
  };
}
