import type { Command } from "commander";
import chalk from "chalk";
import { openContext } from "../../core/profile/context.js";
import {
  addAccount,
  listAccounts,
  removeAccount,
} from "../../core/accounts/accounts.js";

export function registerAccountsCommand(program: Command) {
  const accounts = program.command("accounts").description("Account metadata");

  accounts
    .command("add")
    .description("Add an account")
    .requiredOption("--name <accountName>", "account name")
    .option("--currency <currency>", "account currency")
    .action(async (opts: { name: string; currency?: string }) => {
      const ctx = openContext();
      try {
        const account = await addAccount(ctx, {
          name: opts.name,
          currency: opts.currency,
        });
        console.log(chalk.green(`Added account '${account.name}'`));
      } finally {
        ctx.close();
      }
    });

  accounts
    .command("list")
    .description("List accounts")
    .action(async () => {
      const ctx = openContext();
      try {
        const rows = await listAccounts(ctx);
        if (rows.length === 0) {
          console.log(chalk.gray("No accounts yet."));
          return;
        }
        for (const row of rows) {
          console.log(
            `${row.id}  ${row.name}${row.currency ? ` (${row.currency})` : ""}`
          );
        }
      } finally {
        ctx.close();
      }
    });

  accounts
    .command("remove")
    .description("Remove an account")
    .option("--id <accountId>", "account id")
    .option("--name <accountName>", "account name")
    .action(async (opts: { id?: string; name?: string }) => {
      const ctx = openContext();
      try {
        const result = await removeAccount(ctx, {
          id: opts.id,
          name: opts.name,
        });
        if (!result.removed) {
          console.log(chalk.yellow("No matching account found."));
        } else {
          console.log(chalk.green("Account removed."));
        }
      } finally {
        ctx.close();
      }
    });
}
