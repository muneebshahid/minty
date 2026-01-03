import type { Command } from "commander";

export function registerRulesCommand(program: Command) {
  const rules = program.command("rules").description("Rule-based categorization");

  rules
    .command("add")
    .description("Add a categorization rule")
    .requiredOption("--user <name>", "user profile name")
    .requiredOption("--match <type>", "contains|equals|regex")
    .requiredOption("--pattern <pattern>", "pattern to match")
    .requiredOption("--category <category>", "category name")
    .option("--merchant <merchant>", "merchant override")
    .option("--priority <n>", "priority (higher wins)", (v) => Number(v))
    .action(async () => {
      throw new Error("Not implemented yet");
    });

  rules
    .command("export")
    .description("Export rules to a JSON file")
    .requiredOption("--user <name>", "user profile name")
    .requiredOption("--out <path>", "output file path")
    .action(async () => {
      throw new Error("Not implemented yet");
    });
}

