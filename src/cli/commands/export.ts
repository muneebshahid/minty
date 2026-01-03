import type { Command } from "commander";

export function registerExportCommand(program: Command) {
  const exportCmd = program.command("export").description("Export ledger");

  exportCmd
    .command("csv")
    .description("Export as CSV")
    .requiredOption("--out <path>", "output file path")
    .action(async () => {
      throw new Error("Not implemented yet");
    });

  exportCmd
    .command("json")
    .description("Export as JSON")
    .requiredOption("--out <path>", "output file path")
    .action(async () => {
      throw new Error("Not implemented yet");
    });
}
