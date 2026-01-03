import { randomUUID } from "node:crypto";
import { eq, and } from "drizzle-orm";
import { accounts } from "../db/schema.js";
import type { MintyContext } from "../profile/context.js";
import { MintyError } from "../../shared/errors.js";

export type AccountRow = typeof accounts.$inferSelect;

export async function addAccount(
  ctx: MintyContext,
  input: { name: string; currency?: string | undefined }
): Promise<AccountRow> {
  const name = input.name.trim();
  if (!name) throw new MintyError("Account name is required");

  const createdAt = Date.now();
  const id = randomUUID();

  try {
    ctx.db
      .insert(accounts)
      .values({
        id,
        userId: ctx.userId,
        name,
        currency: input.currency ?? null,
        createdAt,
      })
      .run();
  } catch (error) {
    throw new MintyError(`Failed to add account '${name}' (already exists?)`, {
      cause: error,
    });
  }

  const row = ctx.db.select().from(accounts).where(eq(accounts.id, id)).get();
  if (!row) throw new MintyError("Failed to load created account");
  return row;
}

export async function listAccounts(ctx: MintyContext): Promise<AccountRow[]> {
  return ctx.db
    .select()
    .from(accounts)
    .where(eq(accounts.userId, ctx.userId))
    .all();
}

export async function removeAccount(
  ctx: MintyContext,
  input: { id?: string | undefined; name?: string | undefined }
): Promise<{ removed: boolean }> {
  const id = input.id?.trim();
  const name = input.name?.trim();

  if (!id && !name) throw new MintyError("Provide either --id or --name");
  if (id && name) throw new MintyError("Provide only one of --id or --name");

  const predicate = id
    ? and(eq(accounts.userId, ctx.userId), eq(accounts.id, id))
    : and(eq(accounts.userId, ctx.userId), eq(accounts.name, name!));

  const result = ctx.db.delete(accounts).where(predicate).run();
  return { removed: result.changes > 0 };
}
