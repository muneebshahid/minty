import type { Command } from "commander";
import chalk from "chalk";
import { openContext } from "../../core/profile/context.js";
import { ingestCsv } from "../../core/ingest/csv/ingestCsv.js";
import type { DateFormat } from "../../shared/dates.js";

export function registerIngestCommand(program: Command) {
  const ingest = program.command("ingest").description("Import transactions");

  ingest
    .command("csv")
    .description("Import transactions from a CSV file")
    .requiredOption("--account <accountName>", "account name")
    .requiredOption("--file <path>", "CSV file path")
    .option(
      "--date-col <header>",
      "date column header (auto-detected by default)"
    )
    .option(
      "--amount-col <header>",
      "amount column header (auto-detected by default)"
    )
    .option("--currency-col <header>", "currency column header (optional)")
    .option(
      "--description-col <header>",
      "description column header (auto-detected by default)"
    )
    .option(
      "--external-id-col <header>",
      "external id column header (optional)"
    )
    .option("--delimiter <char>", "CSV delimiter (optional; auto by default)")
    .option("--date-format <fmt>", "auto|ymd|dmy|mdy", "auto")
    .option("--invert-sign", "multiply all amounts by -1", false)
    .action(
      async (opts: {
        account: string;
        file: string;
        dateCol?: string;
        amountCol?: string;
        currencyCol?: string;
        descriptionCol?: string;
        externalIdCol?: string;
        delimiter?: string;
        dateFormat: DateFormat;
        invertSign?: boolean;
      }) => {
        const ctx = openContext();
        try {
          const result = await ingestCsv(ctx, {
            accountName: opts.account,
            filePath: opts.file,
            dateCol: opts.dateCol,
            amountCol: opts.amountCol,
            currencyCol: opts.currencyCol,
            descriptionCol: opts.descriptionCol,
            externalIdCol: opts.externalIdCol,
            delimiter: opts.delimiter,
            dateFormat: opts.dateFormat,
            invertSign: opts.invertSign,
          });
          console.log(chalk.green("CSV ingest complete"));
          console.log(`- Ingest run: ${result.ingestRunId}`);
          console.log(`- Inserted: ${result.inserted}`);
          console.log(`- Skipped (deduped): ${result.skipped}`);
        } finally {
          ctx.close();
        }
      }
    );

  ingest
    .command("json")
    .description("Import transactions from a JSON file")
    .requiredOption("--account <accountName>", "account name")
    .requiredOption("--file <path>", "JSON file path")
    .action(async () => {
      throw new Error("Not implemented yet");
    });
}
