import type { Command } from "commander";

export function registerIngestCommand(program: Command) {
  const ingest = program.command("ingest").description("Import transactions");

  ingest
    .command("csv")
    .description("Import transactions from a CSV file")
    .requiredOption("--user <name>", "user profile name")
    .requiredOption("--account <accountName>", "account name")
    .requiredOption("--file <path>", "CSV file path")
    .option("--format <format>", "auto|n26|wise|generic", "auto")
    .action(async () => {
      throw new Error("Not implemented yet");
    });

  ingest
    .command("json")
    .description("Import transactions from a JSON file")
    .requiredOption("--user <name>", "user profile name")
    .requiredOption("--account <accountName>", "account name")
    .requiredOption("--file <path>", "JSON file path")
    .action(async () => {
      throw new Error("Not implemented yet");
    });
}

