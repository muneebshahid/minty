import chalk from "chalk";
import type { MintyError } from "../../shared/errors.js";

export function printError(error: MintyError, opts: { showStack: boolean }) {
  const message = error.message || "Unknown error";
  process.stderr.write(chalk.red(`Error: ${message}\n`));
  if (opts.showStack && error.cause instanceof Error && error.cause.stack) {
    process.stderr.write(`${error.cause.stack}\n`);
  }
}

