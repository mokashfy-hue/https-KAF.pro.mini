import {
  mysqlTable,
  mysqlEnum,
  serial,
  bigint,
  varchar,
  text,
  timestamp,
  decimal,
  date,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Personal accounts (Cash, Bank, Credit Card, Savings, …) ───
export const accounts = mysqlTable("accounts", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id),
  name: varchar("name", { length: 120 }).notNull(),
  type: mysqlEnum("type", [
    "cash",
    "bank",
    "credit_card",
    "savings",
    "income",
    "expense",
    "other",
  ])
    .default("cash")
    .notNull(),
  color: varchar("color", { length: 20 }).default("#0ea5e9").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Account = typeof accounts.$inferSelect;

// ─── Quick transactions (expenses & income) ───
export const transactions = mysqlTable("transactions", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id),
  kind: mysqlEnum("kind", ["expense", "income"]).notNull(),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
  date: date("date", { mode: "string" }).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  description: text("description"),
  accountId: bigint("accountId", { mode: "number", unsigned: true })
    .notNull()
    .references(() => accounts.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;

// ─── Manual accounting journal entries ───
export const journalEntries = mysqlTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id),
  date: date("date", { mode: "string" }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type JournalEntry = typeof journalEntries.$inferSelect;

export const journalLines = mysqlTable("journal_lines", {
  id: serial("id").primaryKey(),
  entryId: bigint("entryId", { mode: "number", unsigned: true })
    .notNull()
    .references(() => journalEntries.id),
  accountId: bigint("accountId", { mode: "number", unsigned: true })
    .notNull()
    .references(() => accounts.id),
  debit: decimal("debit", { precision: 14, scale: 2 }).default("0").notNull(),
  credit: decimal("credit", { precision: 14, scale: 2 }).default("0").notNull(),
  description: varchar("description", { length: 255 }),
});

export type JournalLine = typeof journalLines.$inferSelect;

// ─── Transfers between accounts ───
export const transfers = mysqlTable("transfers", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id),
  fromAccountId: bigint("fromAccountId", { mode: "number", unsigned: true })
    .notNull()
    .references(() => accounts.id),
  toAccountId: bigint("toAccountId", { mode: "number", unsigned: true })
    .notNull()
    .references(() => accounts.id),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
  date: date("date", { mode: "string" }).notNull(),
  note: varchar("note", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Transfer = typeof transfers.$inferSelect;
