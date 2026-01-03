#!/usr/bin/env node
import { Command, CommanderError } from "commander";
import { registerAccountsCommand } from "./commands/accounts.js";
import { registerClassifyCommand } from "./commands/classify.js";
import { registerExportCommand } from "./commands/export.js";
import { registerIngestCommand } from "./commands/ingest.js";
import { registerInitCommand } from "./commands/init.js";
import { registerReportsCommand } from "./commands/reports.js";
import { registerRulesCommand } from "./commands/rules.js";
import { registerSubscriptionsCommand } from "./commands/subscriptions.js";
import { registerTxnCommand } from "./commands/txn.js";
import { MintyError } from "../shared/errors.js";
import { printError } from "./ui/output.js";

const program = new Command();

program
  .name("minty")
  .description("Local-first personal finance ledger (CLI)")
  .option("--debug", "show stack traces on errors", false)
  .showHelpAfterError();

registerInitCommand(program);
registerAccountsCommand(program);
registerIngestCommand(program);
registerClassifyCommand(program);
registerRulesCommand(program);
registerTxnCommand(program);
registerReportsCommand(program);
registerSubscriptionsCommand(program);
registerExportCommand(program);

program.exitOverride();

try {
  await program.parseAsync(process.argv);
} catch (error) {
  const opts = program.opts<{ debug?: boolean }>();
  const showStack = Boolean(opts.debug);
  if (error instanceof CommanderError) {
    if (
      error.code === "commander.helpDisplayed" ||
      error.code === "commander.version"
    ) {
      process.exitCode = 0;
    } else {
      printError(new MintyError(error.message, { cause: error }), {
        showStack,
      });
      process.exitCode = error.exitCode ?? 1;
    }
  } else {
    const mintyError =
      error instanceof MintyError
        ? error
        : error instanceof Error
          ? new MintyError(error.message, { cause: error })
          : new MintyError(String(error));
    printError(mintyError, { showStack });
    process.exitCode = 1;
  }
}
