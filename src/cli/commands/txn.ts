import type { Command } from "commander";

export function registerTxnCommand(program: Command) {
  const txn = program.command("txn").description("Transaction utilities");

  txn
    .command("set-category")
    .description("Manually set a transaction category")
    .requiredOption("--user <name>", "user profile name")
    .requiredOption("--id <txnId>", "transaction id")
    .requiredOption("--category <category>", "category name")
    .option("--learn-rule", "create a rule from this correction", false)
    .action(async () => {
      throw new Error("Not implemented yet");
    });
}

