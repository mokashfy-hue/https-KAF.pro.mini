import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  accounts,
  journalEntries,
  journalLines,
  transactions,
  transfers,
} from "@db/schema";
import { getDb } from "./queries/connection";
import { authedQuery, createRouter } from "./middleware";

const n = (v: unknown) => Number(v ?? 0);

const DEFAULT_ACCOUNTS: Array<{
  name: string;
  type: "cash" | "bank" | "credit_card" | "savings" | "income" | "expense";
  color: string;
}> = [
  { name: "نقدي", type: "cash", color: "#10b981" },
  { name: "حساب بنكي", type: "bank", color: "#0ea5e9" },
  { name: "بطاقة ائتمان", type: "credit_card", color: "#f59e0b" },
  { name: "ادخار", type: "savings", color: "#8b5cf6" },
  { name: "راتب", type: "income", color: "#22c55e" },
  { name: "مصروفات عامة", type: "expense", color: "#ef4444" },
];

async function ensureDefaultAccounts(userId: number) {
  const db = getDb();
  const existing = await db
    .select()
    .from(accounts)
    .where(eq(accounts.userId, userId));
  if (existing.length === 0) {
    await db
      .insert(accounts)
      .values(DEFAULT_ACCOUNTS.map((a) => ({ ...a, userId })));
    return db.select().from(accounts).where(eq(accounts.userId, userId));
  }
  return existing;
}

/** Compute balance for one account from all its movements. */
function computeBalances(
  accs: (typeof accounts.$inferSelect)[],
  txs: (typeof transactions.$inferSelect)[],
  lines: (typeof journalLines.$inferSelect)[],
  tfs: (typeof transfers.$inferSelect)[],
) {
  const map = new Map<number, number>();
  for (const a of accs) map.set(a.id, 0);
  for (const t of txs) {
    const cur = map.get(t.accountId);
    if (cur === undefined) continue;
    map.set(t.accountId, cur + (t.kind === "income" ? n(t.amount) : -n(t.amount)));
  }
  for (const l of lines) {
    const cur = map.get(l.accountId);
    if (cur === undefined) continue;
    map.set(l.accountId, cur + n(l.debit) - n(l.credit));
  }
  for (const tf of tfs) {
    const from = map.get(tf.fromAccountId);
    if (from !== undefined) map.set(tf.fromAccountId, from - n(tf.amount));
    const to = map.get(tf.toAccountId);
    if (to !== undefined) map.set(tf.toAccountId, to + n(tf.amount));
  }
  return map;
}

async function loadUserData(userId: number) {
  const db = getDb();
  const accs = await ensureDefaultAccounts(userId);
  const txs = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId));
  const entries = await db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.userId, userId));
  const entryIds = entries.map((e) => e.id);
  const lines =
    entryIds.length === 0
      ? []
      : await db
          .select()
          .from(journalLines)
          .where(inArray(journalLines.entryId, entryIds));
  const tfs = await db
    .select()
    .from(transfers)
    .where(eq(transfers.userId, userId));
  return { accs, txs, entries, lines, tfs };
}

export const financeRouter = createRouter({
  // ─── Accounts ───
  accounts: createRouter({
    list: authedQuery.query(async ({ ctx }) => {
      const { accs, txs, lines, tfs } = await loadUserData(ctx.user.id);
      const balances = computeBalances(accs, txs, lines, tfs);
      return accs.map((a) => ({ ...a, balance: balances.get(a.id) ?? 0 }));
    }),

    create: authedQuery
      .input(
        z.object({
          name: z.string().min(1).max(120),
          type: z
            .enum(["cash", "bank", "credit_card", "savings", "income", "expense", "other"])
            .default("cash"),
          color: z.string().max(20).default("#0ea5e9"),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        const [r] = await db.insert(accounts).values({ ...input, userId: ctx.user.id });
        return { id: r.insertId };
      }),

    update: authedQuery
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(120).optional(),
          type: z
            .enum(["cash", "bank", "credit_card", "savings", "income", "expense", "other"])
            .optional(),
          color: z.string().max(20).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        const { id, ...patch } = input;
        const [acc] = await db.select().from(accounts).where(eq(accounts.id, id));
        if (!acc || acc.userId !== ctx.user.id)
          throw new TRPCError({ code: "NOT_FOUND" });
        await db.update(accounts).set(patch).where(eq(accounts.id, id));
        return { ok: true };
      }),

    delete: authedQuery
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        const [acc] = await db
          .select()
          .from(accounts)
          .where(eq(accounts.id, input.id));
        if (!acc || acc.userId !== ctx.user.id)
          throw new TRPCError({ code: "NOT_FOUND" });
        const usedTx = await db
          .select()
          .from(transactions)
          .where(eq(transactions.accountId, input.id));
        const usedLine = await db
          .select()
          .from(journalLines)
          .where(eq(journalLines.accountId, input.id));
        const usedTf = await db
          .select()
          .from(transfers)
          .where(eq(transfers.fromAccountId, input.id));
        const usedTf2 = await db
          .select()
          .from(transfers)
          .where(eq(transfers.toAccountId, input.id));
        if (usedTx.length || usedLine.length || usedTf.length || usedTf2.length)
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "لا يمكن حذف حساب مرتبط بحركات. احذف الحركات أولاً.",
          });
        await db.delete(accounts).where(eq(accounts.id, input.id));
        return { ok: true };
      }),
  }),

  // ─── Transactions (expenses & income) ───
  transactions: createRouter({
    list: authedQuery
      .input(
        z
          .object({
            kind: z.enum(["expense", "income"]).optional(),
            limit: z.number().min(1).max(500).default(200),
          })
          .optional(),
      )
      .query(async ({ ctx, input }) => {
        const db = getDb();
        const where = input?.kind
          ? and(
              eq(transactions.userId, ctx.user.id),
              eq(transactions.kind, input.kind),
            )
          : eq(transactions.userId, ctx.user.id);
        return db
          .select()
          .from(transactions)
          .where(where)
          .orderBy(desc(transactions.date), desc(transactions.id))
          .limit(input?.limit ?? 200);
      }),

    create: authedQuery
      .input(
        z.object({
          kind: z.enum(["expense", "income"]),
          amount: z.number().positive(),
          date: z.string(),
          category: z.string().min(1).max(80),
          description: z.string().max(1000).optional(),
          accountId: z.number(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        const [acc] = await db
          .select()
          .from(accounts)
          .where(eq(accounts.id, input.accountId));
        if (!acc || acc.userId !== ctx.user.id)
          throw new TRPCError({ code: "BAD_REQUEST", message: "حساب غير صالح" });
        const [r] = await db.insert(transactions).values({
          ...input,
          amount: input.amount.toFixed(2),
          userId: ctx.user.id,
        });
        return { id: r.insertId };
      }),

    update: authedQuery
      .input(
        z.object({
          id: z.number(),
          kind: z.enum(["expense", "income"]).optional(),
          amount: z.number().positive().optional(),
          date: z.string().optional(),
          category: z.string().min(1).max(80).optional(),
          description: z.string().max(1000).nullable().optional(),
          accountId: z.number().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        const { id, amount, ...rest } = input;
        const [tx] = await db
          .select()
          .from(transactions)
          .where(eq(transactions.id, id));
        if (!tx || tx.userId !== ctx.user.id)
          throw new TRPCError({ code: "NOT_FOUND" });
        await db
          .update(transactions)
          .set({
            ...rest,
            ...(amount !== undefined ? { amount: amount.toFixed(2) } : {}),
            ...(rest.description === null ? { description: null } : {}),
          })
          .where(eq(transactions.id, id));
        return { ok: true };
      }),

    delete: authedQuery
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        const [tx] = await db
          .select()
          .from(transactions)
          .where(eq(transactions.id, input.id));
        if (!tx || tx.userId !== ctx.user.id)
          throw new TRPCError({ code: "NOT_FOUND" });
        await db.delete(transactions).where(eq(transactions.id, input.id));
        return { ok: true };
      }),
  }),

  // ─── Journal entries ───
  journal: createRouter({
    list: authedQuery.query(async ({ ctx }) => {
      const db = getDb();
      const entries = await db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.userId, ctx.user.id))
        .orderBy(desc(journalEntries.date), desc(journalEntries.id));
      if (entries.length === 0) return [];
      const lines = await db
        .select()
        .from(journalLines)
        .where(inArray(journalLines.entryId, entries.map((e) => e.id)));
      return entries.map((e) => ({
        ...e,
        lines: lines.filter((l) => l.entryId === e.id),
      }));
    }),

    create: authedQuery
      .input(
        z.object({
          date: z.string(),
          description: z.string().max(1000).optional(),
          lines: z
            .array(
              z.object({
                accountId: z.number(),
                debit: z.number().min(0).default(0),
                credit: z.number().min(0).default(0),
                description: z.string().max(255).optional(),
              }),
            )
            .min(2),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const totalDebit = input.lines.reduce((s, l) => s + l.debit, 0);
        const totalCredit = input.lines.reduce((s, l) => s + l.credit, 0);
        if (Math.abs(totalDebit - totalCredit) > 0.005 || totalDebit <= 0)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "القيد غير متوازن: يجب تساوي إجمالي المدين والدائن.",
          });
        const db = getDb();
        // verify accounts ownership
        const accs = await ensureDefaultAccounts(ctx.user.id);
        const owned = new Set(accs.map((a) => a.id));
        for (const l of input.lines)
          if (!owned.has(l.accountId))
            throw new TRPCError({ code: "BAD_REQUEST", message: "حساب غير صالح" });
        const [r] = await db.insert(journalEntries).values({
          userId: ctx.user.id,
          date: input.date,
          description: input.description,
        });
        await db.insert(journalLines).values(
          input.lines.map((l) => ({
            entryId: r.insertId,
            accountId: l.accountId,
            debit: l.debit.toFixed(2),
            credit: l.credit.toFixed(2),
            description: l.description,
          })),
        );
        return { id: r.insertId };
      }),

    delete: authedQuery
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        const [e] = await db
          .select()
          .from(journalEntries)
          .where(eq(journalEntries.id, input.id));
        if (!e || e.userId !== ctx.user.id)
          throw new TRPCError({ code: "NOT_FOUND" });
        await db.delete(journalLines).where(eq(journalLines.entryId, input.id));
        await db.delete(journalEntries).where(eq(journalEntries.id, input.id));
        return { ok: true };
      }),
  }),

  // ─── Transfers ───
  transfers: createRouter({
    list: authedQuery.query(async ({ ctx }) => {
      const db = getDb();
      return db
        .select()
        .from(transfers)
        .where(eq(transfers.userId, ctx.user.id))
        .orderBy(desc(transfers.date), desc(transfers.id));
    }),

    create: authedQuery
      .input(
        z.object({
          fromAccountId: z.number(),
          toAccountId: z.number(),
          amount: z.number().positive(),
          date: z.string(),
          note: z.string().max(255).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (input.fromAccountId === input.toAccountId)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "لا يمكن التحويل إلى نفس الحساب",
          });
        const accs = await ensureDefaultAccounts(ctx.user.id);
        const owned = new Set(accs.map((a) => a.id));
        if (!owned.has(input.fromAccountId) || !owned.has(input.toAccountId))
          throw new TRPCError({ code: "BAD_REQUEST", message: "حساب غير صالح" });
        const db = getDb();
        const [r] = await db.insert(transfers).values({
          ...input,
          amount: input.amount.toFixed(2),
          userId: ctx.user.id,
        });
        return { id: r.insertId };
      }),

    delete: authedQuery
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        const [t] = await db
          .select()
          .from(transfers)
          .where(eq(transfers.id, input.id));
        if (!t || t.userId !== ctx.user.id)
          throw new TRPCError({ code: "NOT_FOUND" });
        await db.delete(transfers).where(eq(transfers.id, input.id));
        return { ok: true };
      }),
  }),

  // ─── Dashboard summary ───
  dashboard: authedQuery.query(async ({ ctx }) => {
    const { accs, txs, lines, tfs } = await loadUserData(ctx.user.id);
    const balances = computeBalances(accs, txs, lines, tfs);

    const totalIncome = txs
      .filter((t) => t.kind === "income")
      .reduce((s, t) => s + n(t.amount), 0);
    const totalExpense = txs
      .filter((t) => t.kind === "expense")
      .reduce((s, t) => s + n(t.amount), 0);

    const assetTypes = new Set(["cash", "bank", "credit_card", "savings", "other"]);
    const currentBalance = accs
      .filter((a) => assetTypes.has(a.type))
      .reduce((s, a) => s + (balances.get(a.id) ?? 0), 0);
    const savings = accs
      .filter((a) => a.type === "savings")
      .reduce((s, a) => s + (balances.get(a.id) ?? 0), 0);

    // last 6 months income/expense
    const byMonth = new Map<string, { income: number; expense: number }>();
    for (const t of txs) {
      const m = String(t.date).slice(0, 7);
      const cur = byMonth.get(m) ?? { income: 0, expense: 0 };
      cur[t.kind === "income" ? "income" : "expense"] += n(t.amount);
      byMonth.set(m, cur);
    }
    const monthly = [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, v]) => ({ month, ...v }));

    // expenses by category
    const byCat = new Map<string, number>();
    for (const t of txs)
      if (t.kind === "expense")
        byCat.set(t.category, (byCat.get(t.category) ?? 0) + n(t.amount));
    const byCategory = [...byCat.entries()]
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value);

    const recent = txs
      .slice()
      .sort((a, b) =>
        String(b.date) === String(a.date) ? b.id - a.id : String(b.date).localeCompare(String(a.date)),
      )
      .slice(0, 8);

    return {
      totalIncome,
      totalExpense,
      currentBalance,
      savings,
      monthly,
      byCategory,
      recent,
    };
  }),

  // ─── Backup & restore ───
  backup: createRouter({
    export: authedQuery.query(async ({ ctx }) => {
      const { accs, txs, entries, lines, tfs } = await loadUserData(ctx.user.id);
      const nameOf = (id: number) =>
        accs.find((a) => a.id === id)?.name ?? "";
      return {
        version: 1,
        exportedAt: new Date().toISOString(),
        accounts: accs.map((a) => ({
          name: a.name,
          type: a.type,
          color: a.color,
        })),
        transactions: txs.map((t) => ({
          kind: t.kind,
          amount: n(t.amount),
          date: String(t.date),
          category: t.category,
          description: t.description,
          accountName: nameOf(t.accountId),
        })),
        journalEntries: entries.map((e) => ({
          date: String(e.date),
          description: e.description,
          lines: lines
            .filter((l) => l.entryId === e.id)
            .map((l) => ({
              accountName: nameOf(l.accountId),
              debit: n(l.debit),
              credit: n(l.credit),
              description: l.description,
            })),
        })),
        transfers: tfs.map((t) => ({
          fromAccountName: nameOf(t.fromAccountId),
          toAccountName: nameOf(t.toAccountId),
          amount: n(t.amount),
          date: String(t.date),
          note: t.note,
        })),
      };
    }),

    restore: authedQuery
      .input(
        z.object({
          accounts: z.array(
            z.object({
              name: z.string(),
              type: z.enum(["cash", "bank", "credit_card", "savings", "income", "expense", "other"]),
              color: z.string().optional(),
            }),
          ),
          transactions: z.array(
            z.object({
              kind: z.enum(["expense", "income"]),
              amount: z.union([z.string(), z.number()]),
              date: z.string(),
              category: z.string(),
              description: z.string().nullable().optional(),
              accountName: z.string(),
            }),
          ),
          journalEntries: z.array(
            z.object({
              date: z.string(),
              description: z.string().nullable().optional(),
              lines: z.array(
                z.object({
                  accountName: z.string(),
                  debit: z.union([z.string(), z.number()]),
                  credit: z.union([z.string(), z.number()]),
                  description: z.string().nullable().optional(),
                }),
              ),
            }),
          ),
          transfers: z.array(
            z.object({
              fromAccountName: z.string(),
              toAccountName: z.string(),
              amount: z.union([z.string(), z.number()]),
              date: z.string(),
              note: z.string().nullable().optional(),
            }),
          ),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const db = getDb();
        const uid = ctx.user.id;
        // wipe existing data
        const oldEntries = await db
          .select()
          .from(journalEntries)
          .where(eq(journalEntries.userId, uid));
        if (oldEntries.length)
          await db.delete(journalLines).where(
            inArray(journalLines.entryId, oldEntries.map((e) => e.id)),
          );
        await db.delete(journalEntries).where(eq(journalEntries.userId, uid));
        await db.delete(transactions).where(eq(transactions.userId, uid));
        await db.delete(transfers).where(eq(transfers.userId, uid));
        await db.delete(accounts).where(eq(accounts.userId, uid));

        // restore accounts
        const idByName = new Map<string, number>();
        for (const a of input.accounts) {
          const [r] = await db.insert(accounts).values({
            userId: uid,
            name: a.name,
            type: a.type,
            color: a.color ?? "#0ea5e9",
          });
          idByName.set(a.name, r.insertId);
        }
        // restore transactions
        for (const t of input.transactions) {
          const accountId = idByName.get(t.accountName);
          if (!accountId) continue;
          await db.insert(transactions).values({
            userId: uid,
            kind: t.kind,
            amount: n(t.amount).toFixed(2),
            date: t.date,
            category: t.category,
            description: t.description ?? null,
            accountId,
          });
        }
        // restore journal
        for (const e of input.journalEntries) {
          const [r] = await db.insert(journalEntries).values({
            userId: uid,
            date: e.date,
            description: e.description ?? null,
          });
          for (const l of e.lines) {
            const accountId = idByName.get(l.accountName);
            if (!accountId) continue;
            await db.insert(journalLines).values({
              entryId: r.insertId,
              accountId,
              debit: n(l.debit).toFixed(2),
              credit: n(l.credit).toFixed(2),
              description: l.description ?? null,
            });
          }
        }
        // restore transfers
        for (const t of input.transfers) {
          const from = idByName.get(t.fromAccountName);
          const to = idByName.get(t.toAccountName);
          if (!from || !to) continue;
          await db.insert(transfers).values({
            userId: uid,
            fromAccountId: from,
            toAccountId: to,
            amount: n(t.amount).toFixed(2),
            date: t.date,
            note: t.note ?? null,
          });
        }
        return { ok: true };
      }),
  }),
});
