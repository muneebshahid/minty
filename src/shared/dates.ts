import { MintyError } from "./errors.js";

export type DateFormat = "auto" | "ymd" | "dmy" | "mdy";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function parseDateToISODate(
  input: string,
  format: DateFormat = "auto"
): string {
  const raw = input.trim();
  if (!raw) throw new MintyError("Missing date value");

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(raw)) return raw.replaceAll("/", "-");

  const dot = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dot) {
    const day = Number(dot[1]);
    const month = Number(dot[2]);
    const year = Number(dot[3]);
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const a = Number(slash[1]);
    const b = Number(slash[2]);
    const year = Number(slash[3]);

    let month: number;
    let day: number;
    if (format === "mdy") {
      month = a;
      day = b;
    } else if (format === "dmy") {
      day = a;
      month = b;
    } else if (format === "auto") {
      // Heuristic: if first segment > 12, treat as D/M/Y.
      if (a > 12 && b <= 12) {
        day = a;
        month = b;
      } else {
        month = a;
        day = b;
      }
    } else {
      throw new MintyError(
        `Unsupported date format: ${format satisfies never}`
      );
    }

    return `${year}-${pad2(month)}-${pad2(day)}`;
  }

  throw new MintyError(`Unrecognized date format: '${raw}'`);
}
