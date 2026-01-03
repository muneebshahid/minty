import fs from "node:fs";
import Papa from "papaparse";
import { MintyError } from "../../../shared/errors.js";

export type CsvReadResult = {
  headers: string[];
  rows: Record<string, string>[];
};

export function readCsvFile(
  filePath: string,
  opts: { delimiter?: string | undefined } = {}
): CsvReadResult {
  if (!fs.existsSync(filePath))
    throw new MintyError(`CSV file not found: ${filePath}`);
  const input = fs.readFileSync(filePath, "utf8");

  const result = Papa.parse<Record<string, string>>(input, {
    header: true,
    skipEmptyLines: "greedy",
    delimiter: opts.delimiter,
    transformHeader: (h) => h.trim(),
    transform: (value) => (typeof value === "string" ? value.trim() : value),
  });

  if (result.errors.length > 0) {
    const first = result.errors[0];
    throw new MintyError(`Failed to parse CSV: ${first.message}`);
  }

  const headers = (result.meta.fields ?? []).filter(Boolean);
  if (headers.length === 0) throw new MintyError("CSV has no header row");

  const rows = (result.data ?? []).filter((row) => Object.keys(row).length > 0);
  return { headers, rows };
}
