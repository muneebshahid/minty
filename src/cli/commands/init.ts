import type { Command } from "commander";
import chalk from "chalk";
import { initUserProfile } from "../../core/users/initUser.js";

export function registerInitCommand(program: Command) {
  program
    .command("init")
    .description("Initialize a user profile (directories + sqlite)")
    .requiredOption("--user <name>", "user profile name")
    .action(async (opts: { user: string }) => {
      const result = await initUserProfile({ userName: opts.user });
      console.log(chalk.green(`Initialized user '${result.userName}'`));
      console.log(`- DB: ${result.dbPath}`);
      console.log(`- Config: ${result.configPath}`);
      console.log(`- Rules: ${result.rulesPath}`);
    });
}
