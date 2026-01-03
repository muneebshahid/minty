import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createTestContext } from "./helpers/testContext.js";
import { addAccount } from "../src/core/accounts/accounts.js";
import { ingestCsv } from "../src/core/ingest/csv/ingestCsv.js";

describe("ingestCsv", () => {
  it("ingests and dedupes a CSV file", async () => {
    const ctx = createTestContext();
    try {
      await addAccount(ctx, { name: "Main", currency: "EUR" });

      const csvPath = path.join(ctx.tmpDir, "statement.csv");
      fs.writeFileSync(
        csvPath,
        [
          "Date,Amount,Currency,Description,Id",
          "2026-01-01,-12.34,EUR,REWE 1234,abc1",
          '01/02/2026,"1.234,56",EUR,NETFLIX.COM REF 123456789012,abc2',
        ].join("\n"),
        "utf8"
      );

      const first = await ingestCsv(ctx, {
        accountName: "Main",
        filePath: csvPath,
      });
      expect(first.inserted).toBe(2);
      expect(first.skipped).toBe(0);

      const second = await ingestCsv(ctx, {
        accountName: "Main",
        filePath: csvPath,
      });
      expect(second.inserted).toBe(0);
      expect(second.skipped).toBe(2);
    } finally {
      ctx.close();
    }
  });
});
