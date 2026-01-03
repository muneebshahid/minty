import type { Command } from "commander";

export function registerAccountsCommand(program: Command) {
  const accounts = program.command("accounts").description("Account metadata");

  accounts
    .command("add")
    .description("Add an account")
    .requiredOption("--user <name>", "user profile name")
    .requiredOption("--name <accountName>", "account name")
    .option("--currency <currency>", "account currency")
    .action(async () => {
      throw new Error("Not implemented yet");
    });

  accounts
    .command("list")
    .description("List accounts")
    .requiredOption("--user <name>", "user profile name")
    .action(async () => {
      throw new Error("Not implemented yet");
    });

  accounts
    .command("remove")
    .description("Remove an account")
    .requiredOption("--user <name>", "user profile name")
    .requiredOption("--name <accountName>", "account name")
    .action(async () => {
      throw new Error("Not implemented yet");
    });
}

