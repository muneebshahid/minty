import type { Command } from "commander";

export function registerClassifyCommand(program: Command) {
  program
    .command("classify")
    .description("Categorize transactions (rules-first, optional LLM fallback)")
    .requiredOption("--user <name>", "user profile name")
    .option("--since <date>", "only classify transactions on/after YYYY-MM-DD")
    .option("--dry-run", "do not persist changes", false)
    .action(async () => {
      throw new Error("Not implemented yet");
    });
}

