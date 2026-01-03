import type { Command } from "commander";

export function registerReportsCommand(program: Command) {
  const report = program.command("report").description("Ledger reports");

  report
    .command("month")
    .description("Monthly summary report")
    .requiredOption("--user <name>", "user profile name")
    .requiredOption("--month <YYYY-MM>", "month to report")
    .action(async () => {
      throw new Error("Not implemented yet");
    });

  report
    .command("uncategorized")
    .description("List uncategorized transactions")
    .requiredOption("--user <name>", "user profile name")
    .option("--limit <n>", "max rows", (v) => Number(v), 50)
    .action(async () => {
      throw new Error("Not implemented yet");
    });

  report
    .command("merchants")
    .description("Top merchants by spend")
    .requiredOption("--user <name>", "user profile name")
    .requiredOption("--month <YYYY-MM>", "month to report")
    .option("--top <n>", "top N merchants", (v) => Number(v), 20)
    .action(async () => {
      throw new Error("Not implemented yet");
    });
}

