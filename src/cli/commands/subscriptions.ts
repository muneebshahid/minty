import type { Command } from "commander";

export function registerSubscriptionsCommand(program: Command) {
  const subs = program
    .command("subscriptions")
    .description("Recurring charge detection");

  subs
    .command("detect")
    .description("Detect subscriptions from transactions")
    .action(async () => {
      throw new Error("Not implemented yet");
    });

  subs
    .command("upcoming")
    .description("Show upcoming expected subscription charges")
    .option("--days <n>", "days ahead", (v) => Number(v), 60)
    .action(async () => {
      throw new Error("Not implemented yet");
    });
}
