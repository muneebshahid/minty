import type { Command } from "commander";
import chalk from "chalk";
import { initProfile } from "../../core/users/initUser.js";

export function registerInitCommand(program: Command) {
  program
    .command("init")
    .description("Initialize local Minty profile (directories + sqlite)")
    .action(async () => {
      const result = await initProfile();
      console.log(chalk.green("Initialized Minty profile"));
      console.log(`- DB: ${result.dbPath}`);
      console.log(`- Config: ${result.configPath}`);
      console.log(`- Rules: ${result.rulesPath}`);
    });
}
