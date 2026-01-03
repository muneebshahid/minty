import path from "node:path";
import { randomUUID, createHash } from "node:crypto";
import type { MintyContext } from "../../profile/context.js";
import { MintyError } from "../../../shared/errors.js";
import { parseDateToISODate, type DateFormat } from "../../../shared/dates.js";
import { parseMoneyToMinorUnits } from "../../../shared/money.js";
import { normalizeForHash } from "../../normalize/text.js";
import { normalizeMerchant } from "../../normalize/merchant.js";
import { readCsvFile } from "./readCsv.js";
import { resolveCsvMapping, type CsvMappingInput } from "./mapping.js";
import { getAccountByName } from "../../accounts/accounts.js";

export type IngestCsvOptions = CsvMappingInput & {
  accountName: string;
  filePath: string;
  delimiter?: string | undefined;
  dateFormat?: DateFormat | undefined;
  invertSign?: boolean | undefined;
};

export type IngestCsvResult = {
  ingestRunId: string;
  accountId: string;
  inserted: number;
  skipped: number;
};

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export async function ingestCsv(
  ctx: MintyContext,
  opts: IngestCsvOptions
): Promise<IngestCsvResult> {
  const account = await getAccountByName(ctx, opts.accountName);
  if (!account)
    throw new MintyError(`Account not found: '${opts.accountName}'`);

  const ingestRunId = randomUUID();
  const startedAt = Date.now();

  const meta = {
    file: path.resolve(opts.filePath),
    delimiter: opts.delimiter ?? null,
    dateFormat: opts.dateFormat ?? "auto",
    invertSign: Boolean(opts.invertSign),
  };

  // Create ingest run record up-front so failures are recorded even if we crash mid-run.
  ctx.sqlite
    .prepare(
      `INSERT INTO ingest_runs (id, userId, accountId, sourceType, sourceMeta, startedAt, endedAt, status, error)
       VALUES (?, ?, ?, 'csv', ?, ?, NULL, 'failed', 'incomplete')`
    )
    .run(ingestRunId, ctx.userId, account.id, JSON.stringify(meta), startedAt);

  try {
    const { headers, rows } = readCsvFile(opts.filePath, {
      delimiter: opts.delimiter,
    });
    const mapping = resolveCsvMapping(headers, {
      dateCol: opts.dateCol,
      amountCol: opts.amountCol,
      currencyCol: opts.currencyCol,
      descriptionCol: opts.descriptionCol,
      externalIdCol: opts.externalIdCol,
    });

    const insertStmt = ctx.sqlite.prepare(
      `INSERT OR IGNORE INTO transactions
        (id, userId, accountId, postedAt, amount, currency, rawDescription, normalizedMerchant,
         category, categoryConfidence, categorySource, externalId, hash, createdAt)
       VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, 'none', ?, ?, ?)`
    );

    let inserted = 0;
    let skipped = 0;

    const now = Date.now();
    const tx = ctx.sqlite.transaction(() => {
      for (const row of rows) {
        const rawDate = row[mapping.dateCol] ?? "";
        const rawAmount = row[mapping.amountCol] ?? "";
        const rawDesc = row[mapping.descriptionCol] ?? "";

        if (!rawDate && !rawAmount && !rawDesc) continue;

        const postedAt = parseDateToISODate(rawDate, opts.dateFormat ?? "auto");
        let amount = parseMoneyToMinorUnits(rawAmount);
        if (opts.invertSign) amount = -amount;

        const currency =
          mapping.currencyCol && row[mapping.currencyCol]
            ? row[mapping.currencyCol]!.trim()
            : (account.currency ?? "UNKNOWN");
        if (!currency)
          throw new MintyError(
            "Missing currency (provide --currency-col or set account currency)"
          );

        const rawDescription = rawDesc.trim();
        if (!rawDescription) throw new MintyError("Missing description value");

        const normalizedMerchant = normalizeMerchant(rawDescription);
        const normalizedRawDesc = normalizeForHash(rawDescription);
        const hash = sha256(
          `${postedAt}|${amount}|${currency}|${normalizedRawDesc}|${account.id}`
        );

        const externalId =
          mapping.externalIdCol && row[mapping.externalIdCol]
            ? row[mapping.externalIdCol]!.trim() || null
            : null;

        const id = randomUUID();
        const info = insertStmt.run(
          id,
          ctx.userId,
          account.id,
          postedAt,
          amount,
          currency,
          rawDescription,
          normalizedMerchant,
          externalId,
          hash,
          now
        );

        if (info.changes > 0) inserted += 1;
        else skipped += 1;
      }
    });

    tx();

    ctx.sqlite
      .prepare(
        "UPDATE ingest_runs SET endedAt = ?, status = 'success', error = NULL WHERE id = ?"
      )
      .run(Date.now(), ingestRunId);

    return { ingestRunId, accountId: account.id, inserted, skipped };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ctx.sqlite
      .prepare(
        "UPDATE ingest_runs SET endedAt = ?, status = 'failed', error = ? WHERE id = ?"
      )
      .run(Date.now(), message, ingestRunId);
    throw new MintyError(`CSV ingest failed: ${message}`, { cause: error });
  }
}
