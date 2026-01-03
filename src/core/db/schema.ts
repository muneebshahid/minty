import {
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    createdAt: integer("createdAt").notNull(),
  },
  (table) => ({
    nameUnique: uniqueIndex("users_name_unique").on(table.name),
  })
);

export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: text("userId").notNull(),
    name: text("name").notNull(),
    currency: text("currency"),
    createdAt: integer("createdAt").notNull(),
  },
  (table) => ({
    userNameUnique: uniqueIndex("accounts_user_name_unique").on(
      table.userId,
      table.name
    ),
  })
);

export const ingestRuns = sqliteTable("ingest_runs", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  accountId: text("accountId").notNull(),
  sourceType: text("sourceType").notNull(),
  sourceMeta: text("sourceMeta").notNull(),
  startedAt: integer("startedAt").notNull(),
  endedAt: integer("endedAt"),
  status: text("status").notNull(),
  error: text("error"),
});

export const transactions = sqliteTable(
  "transactions",
  {
    id: text("id").primaryKey(),
    userId: text("userId").notNull(),
    accountId: text("accountId").notNull(),
    postedAt: text("postedAt").notNull(),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull(),
    rawDescription: text("rawDescription").notNull(),
    normalizedMerchant: text("normalizedMerchant").notNull(),
    category: text("category"),
    categoryConfidence: real("categoryConfidence"),
    categorySource: text("categorySource").notNull(),
    externalId: text("externalId"),
    hash: text("hash").notNull(),
    createdAt: integer("createdAt").notNull(),
  },
  (table) => ({
    accountHashUnique: uniqueIndex("transactions_account_hash_unique").on(
      table.accountId,
      table.hash
    ),
  })
);

export const rules = sqliteTable("rules", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  matchType: text("matchType").notNull(),
  pattern: text("pattern").notNull(),
  merchantOverride: text("merchantOverride"),
  category: text("category").notNull(),
  priority: integer("priority").notNull(),
  createdAt: integer("createdAt").notNull(),
});

export const subscriptions = sqliteTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    userId: text("userId").notNull(),
    normalizedMerchant: text("normalizedMerchant").notNull(),
    currency: text("currency").notNull(),
    period: text("period").notNull(),
    avgAmount: integer("avgAmount").notNull(),
    confidence: real("confidence").notNull(),
    lastSeenAt: text("lastSeenAt").notNull(),
    nextExpectedAt: text("nextExpectedAt"),
    updatedAt: integer("updatedAt").notNull(),
  },
  (table) => ({
    userMerchantCurrencyUnique: uniqueIndex(
      "subscriptions_user_merchant_currency_unique"
    ).on(table.userId, table.normalizedMerchant, table.currency),
  })
);
