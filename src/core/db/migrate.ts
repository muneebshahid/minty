import { Command } from "commander";
import { openSqlite } from "./client.js";
import { migrateDatabase } from "./migrations/migrate.js";

const program = new Command();

program
  .name("minty-db-migrate")
  .description("Apply Minty SQLite migrations")
  .requiredOption("--db <path>", "path to sqlite database file");

await program.parseAsync(process.argv);
const opts = program.opts<{ db: string }>();

const { sqlite } = openSqlite(opts.db);
try {
  migrateDatabase(sqlite);
} finally {
  sqlite.close();
}
