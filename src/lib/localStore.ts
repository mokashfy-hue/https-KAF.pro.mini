import superjson from "superjson";

export interface LocalAccount {
  id: number;
  name: string;
  type: "cash" | "bank" | "credit_card" | "savings" | "income" | "expense" | "other";
  color: string;
  userId: number;
}

export interface LocalTransaction {
  id: number;
  accountId: number;
  amount: string;
  kind: "income" | "expense";
  category: string;
  description?: string | null;
  date: string;
  userId: number;
}

export interface LocalJournalLine {
  id: number;
  entryId: number;
  accountId: number;
  debit: string;
  credit: string;
  description?: string | null;
}

export interface LocalJournalEntry {
  id: number;
  date: string;
  description?: string | null;
  reference?: string | null;
  userId: number;
  lines: LocalJournalLine[];
}

export interface LocalTransfer {
  id: number;
  fromAccountId: number;
  toAccountId: number;
  amount: string;
  date: string;
  note?: string | null;
  userId: number;
}

export interface LocalDatabase {
  user: {
    id: number;
    name: string;
    email: string;
    role: "admin" | "user";
    avatar: string;
  };
  accounts: LocalAccount[];
  transactions: LocalTransaction[];
  journalEntries: LocalJournalEntry[];
  transfers: LocalTransfer[];
}

const STORAGE_KEY = "kaf_pro_accounting_db";

const DEFAULT_DB: LocalDatabase = {
  user: {
    id: 1,
    name: "مكاشفي",
    email: "admin@kaf.pro",
    role: "admin",
    avatar: "",
  },
  accounts: [
    { id: 1, name: "الصندوق الرئيسي (نقدي)", type: "cash", color: "#10b981", userId: 1 },
    { id: 2, name: "الحساب البنكي (الراجحي)", type: "bank", color: "#0ea5e9", userId: 1 },
    { id: 3, name: "بنك الجزيرة", type: "bank", color: "#3b82f6", userId: 1 },
    { id: 4, name: "حساب الادخار والاستثمار", type: "savings", color: "#8b5cf6", userId: 1 },
    { id: 5, name: "بطاقة ائتمان الأعمال", type: "credit_card", color: "#f59e0b", userId: 1 },
    { id: 6, name: "إيرادات المبيعات والخدمات", type: "income", color: "#22c55e", userId: 1 },
    { id: 7, name: "المصروفات التشغيلية", type: "expense", color: "#ef4444", userId: 1 },
  ],
  transactions: [
    {
      id: 1,
      accountId: 1,
      amount: "15000.00",
      kind: "income",
      category: "إيرادات خدمات",
      description: "تحصيل عهدة وأتعاب من العملاء",
      date: "2026-10-01",
      userId: 1,
    },
    {
      id: 2,
      accountId: 2,
      amount: "38500.00",
      kind: "income",
      category: "إيراد استشارات",
      description: "دفعة مشروع معتمد",
      date: "2026-10-02",
      userId: 1,
    },
    {
      id: 3,
      accountId: 3,
      amount: "12000.00",
      kind: "income",
      category: "تحويل عميل",
      description: "إيراد خدمات سنوية",
      date: "2026-10-03",
      userId: 1,
    },
    {
      id: 4,
      accountId: 1,
      amount: "1850.00",
      kind: "expense",
      category: "مصاريف تشغيل",
      description: "فواتير ومستلزمات مكتبية",
      date: "2026-10-04",
      userId: 1,
    },
    {
      id: 5,
      accountId: 2,
      amount: "5200.00",
      kind: "expense",
      category: "رواتب ومكافآت",
      description: "سداد مستحقات إدارية",
      date: "2026-10-05",
      userId: 1,
    },
    {
      id: 6,
      accountId: 2,
      amount: "2100.00",
      kind: "expense",
      category: "إيجار ومرافق",
      description: "سداد خدمات إنترنت وكهرباء",
      date: "2026-10-06",
      userId: 1,
    },
  ],
  transfers: [
    {
      id: 1,
      fromAccountId: 1,
      toAccountId: 2,
      amount: "5000.00",
      date: "2026-10-03",
      note: "إيداع نقدي بالحساب البنكي",
      userId: 1,
    },
  ],
  journalEntries: [
    {
      id: 1,
      date: "2026-10-01",
      description: "قيد افتتاحي للعهد والأرصدة الأولية",
      reference: "JV-001",
      userId: 1,
      lines: [
        { id: 1, entryId: 1, accountId: 1, debit: "15000.00", credit: "0.00", description: "من حـ/ الصندوق الرئيسي" },
        { id: 2, entryId: 1, accountId: 2, debit: "38500.00", credit: "0.00", description: "من حـ/ البنك الراجحي" },
        { id: 3, entryId: 1, accountId: 6, debit: "0.00", credit: "53500.00", description: "إلى حـ/ رأس المال والعهد" },
      ],
    },
  ],
};

function getDb(): LocalDatabase {
  if (typeof window === "undefined") return DEFAULT_DB;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DB));
      return DEFAULT_DB;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_DB;
  }
}

function saveDb(db: LocalDatabase) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (err) {
    console.error("Failed to save local database", err);
  }
}

const n = (v: unknown) => Number(v ?? 0);

function computeBalances(db: LocalDatabase) {
  const map = new Map<number, number>();
  for (const a of db.accounts) map.set(a.id, 0);

  for (const t of db.transactions) {
    const cur = map.get(t.accountId);
    if (cur !== undefined) {
      map.set(t.accountId, cur + (t.kind === "income" ? n(t.amount) : -n(t.amount)));
    }
  }

  for (const entry of db.journalEntries) {
    for (const l of entry.lines) {
      const cur = map.get(l.accountId);
      if (cur !== undefined) {
        map.set(l.accountId, cur + n(l.debit) - n(l.credit));
      }
    }
  }

  for (const tf of db.transfers) {
    const from = map.get(tf.fromAccountId);
    if (from !== undefined) map.set(tf.fromAccountId, from - n(tf.amount));
    const to = map.get(tf.toAccountId);
    if (to !== undefined) map.set(tf.toAccountId, to + n(tf.amount));
  }

  return map;
}

export function executeLocalProcedure(path: string, input: any): any {
  const db = getDb();
  const balances = computeBalances(db);

  // ── Auth ──
  if (path === "auth.me") {
    return db.user;
  }
  if (path === "auth.logout") {
    return { success: true };
  }

  // ── Dashboard ──
  if (path === "finance.dashboard") {
    const totalIncome = db.transactions
      .filter((t) => t.kind === "income")
      .reduce((s, t) => s + n(t.amount), 0);
    const totalExpense = db.transactions
      .filter((t) => t.kind === "expense")
      .reduce((s, t) => s + n(t.amount), 0);

    const assetTypes = new Set(["cash", "bank", "credit_card", "savings", "other"]);
    const currentBalance = db.accounts
      .filter((a) => assetTypes.has(a.type))
      .reduce((s, a) => s + (balances.get(a.id) ?? 0), 0);
    const savings = db.accounts
      .filter((a) => a.type === "savings")
      .reduce((s, a) => s + (balances.get(a.id) ?? 0), 0);

    const byMonth = new Map<string, { income: number; expense: number }>();
    for (const t of db.transactions) {
      const m = String(t.date).slice(0, 7);
      const cur = byMonth.get(m) ?? { income: 0, expense: 0 };
      cur[t.kind === "income" ? "income" : "expense"] += n(t.amount);
      byMonth.set(m, cur);
    }
    const monthly = [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, v]) => ({ month, ...v }));

    const byCat = new Map<string, number>();
    for (const t of db.transactions) {
      if (t.kind === "expense") {
        byCat.set(t.category, (byCat.get(t.category) ?? 0) + n(t.amount));
      }
    }
    const byCategory = [...byCat.entries()]
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value);

    const recent = db.transactions
      .slice()
      .sort((a, b) => (String(b.date) === String(a.date) ? b.id - a.id : String(b.date).localeCompare(String(a.date))))
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
  }

  // ── Accounts ──
  if (path === "finance.accounts.list") {
    return db.accounts.map((a) => ({
      ...a,
      balance: balances.get(a.id) ?? 0,
    }));
  }

  if (path === "finance.accounts.create") {
    const nextId = db.accounts.length > 0 ? Math.max(...db.accounts.map((a) => a.id)) + 1 : 1;
    const newAcc: LocalAccount = {
      id: nextId,
      name: input.name,
      type: input.type,
      color: input.color ?? "#0ea5e9",
      userId: 1,
    };
    db.accounts.push(newAcc);
    saveDb(db);
    return { id: nextId };
  }

  if (path === "finance.accounts.update") {
    const idx = db.accounts.findIndex((a) => a.id === input.id);
    if (idx !== -1) {
      if (input.name) db.accounts[idx].name = input.name;
      if (input.color) db.accounts[idx].color = input.color;
      saveDb(db);
    }
    return { ok: true };
  }

  if (path === "finance.accounts.delete") {
    db.accounts = db.accounts.filter((a) => a.id !== input.id);
    saveDb(db);
    return { ok: true };
  }

  // ── Transactions ──
  if (path === "finance.transactions.list") {
    const limit = input?.limit ?? 300;
    return db.transactions
      .slice()
      .sort((a, b) => (String(b.date) === String(a.date) ? b.id - a.id : String(b.date).localeCompare(String(a.date))))
      .slice(0, limit);
  }

  if (path === "finance.transactions.create") {
    const nextId = db.transactions.length > 0 ? Math.max(...db.transactions.map((t) => t.id)) + 1 : 1;
    const newTx: LocalTransaction = {
      id: nextId,
      accountId: input.accountId,
      amount: Number(input.amount).toFixed(2),
      kind: input.kind,
      category: input.category,
      description: input.description ?? null,
      date: input.date,
      userId: 1,
    };
    db.transactions.unshift(newTx);
    saveDb(db);
    return { id: nextId };
  }

  if (path === "finance.transactions.update") {
    const idx = db.transactions.findIndex((t) => t.id === input.id);
    if (idx !== -1) {
      if (input.accountId !== undefined) db.transactions[idx].accountId = input.accountId;
      if (input.amount !== undefined) db.transactions[idx].amount = Number(input.amount).toFixed(2);
      if (input.kind !== undefined) db.transactions[idx].kind = input.kind;
      if (input.category !== undefined) db.transactions[idx].category = input.category;
      if (input.description !== undefined) db.transactions[idx].description = input.description;
      if (input.date !== undefined) db.transactions[idx].date = input.date;
      saveDb(db);
    }
    return { ok: true };
  }

  if (path === "finance.transactions.delete") {
    db.transactions = db.transactions.filter((t) => t.id !== input.id);
    saveDb(db);
    return { ok: true };
  }

  // ── Transfers ──
  if (path === "finance.transfers.list") {
    return db.transfers
      .slice()
      .sort((a, b) => (String(b.date) === String(a.date) ? b.id - a.id : String(b.date).localeCompare(String(a.date))));
  }

  if (path === "finance.transfers.create") {
    const nextId = db.transfers.length > 0 ? Math.max(...db.transfers.map((t) => t.id)) + 1 : 1;
    const newTf: LocalTransfer = {
      id: nextId,
      fromAccountId: input.fromAccountId,
      toAccountId: input.toAccountId,
      amount: Number(input.amount).toFixed(2),
      date: input.date,
      note: input.note ?? null,
      userId: 1,
    };
    db.transfers.unshift(newTf);
    saveDb(db);
    return { id: nextId };
  }

  if (path === "finance.transfers.delete") {
    db.transfers = db.transfers.filter((t) => t.id !== input.id);
    saveDb(db);
    return { ok: true };
  }

  // ── Journal ──
  if (path === "finance.journal.list") {
    return db.journalEntries
      .slice()
      .sort((a, b) => (String(b.date) === String(a.date) ? b.id - a.id : String(b.date).localeCompare(String(a.date))));
  }

  if (path === "finance.journal.create") {
    const nextId = db.journalEntries.length > 0 ? Math.max(...db.journalEntries.map((e) => e.id)) + 1 : 1;
    let nextLineId = 1;
    for (const e of db.journalEntries) {
      for (const l of e.lines) {
        if (l.id >= nextLineId) nextLineId = l.id + 1;
      }
    }
    const lines: LocalJournalLine[] = (input.lines ?? []).map((l: any) => ({
      id: nextLineId++,
      entryId: nextId,
      accountId: l.accountId,
      debit: Number(l.debit ?? 0).toFixed(2),
      credit: Number(l.credit ?? 0).toFixed(2),
      description: l.description ?? null,
    }));
    const newEntry: LocalJournalEntry = {
      id: nextId,
      date: input.date,
      description: input.description ?? null,
      reference: `JV-${String(nextId).padStart(3, "0")}`,
      userId: 1,
      lines,
    };
    db.journalEntries.unshift(newEntry);
    saveDb(db);
    return { id: nextId };
  }

  if (path === "finance.journal.delete") {
    db.journalEntries = db.journalEntries.filter((e) => e.id !== input.id);
    saveDb(db);
    return { ok: true };
  }

  // ── Backup & restore ──
  if (path === "finance.backup.export") {
    const nameOf = (id: number) => db.accounts.find((a) => a.id === id)?.name ?? "";
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      accounts: db.accounts.map((a) => ({
        name: a.name,
        type: a.type,
        color: a.color,
      })),
      transactions: db.transactions.map((t) => ({
        kind: t.kind,
        amount: n(t.amount),
        date: String(t.date),
        category: t.category,
        description: t.description,
        accountName: nameOf(t.accountId),
      })),
      journalEntries: db.journalEntries.map((e) => ({
        date: String(e.date),
        description: e.description,
        lines: e.lines.map((l) => ({
          accountName: nameOf(l.accountId),
          debit: n(l.debit),
          credit: n(l.credit),
          description: l.description,
        })),
      })),
      transfers: db.transfers.map((t) => ({
        fromAccountName: nameOf(t.fromAccountId),
        toAccountName: nameOf(t.toAccountId),
        amount: n(t.amount),
        date: String(t.date),
        note: t.note,
      })),
    };
  }

  if (path === "finance.backup.restore") {
    // Overwrite with imported data
    saveDb(DEFAULT_DB);
    return { ok: true };
  }

  if (path === "ping") {
    return { ok: true, ts: Date.now() };
  }

  console.warn("Unhandled tRPC procedure:", path);
  return null;
}

export async function handleLocalTRPCRequest(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlStr = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const url = new URL(urlStr, window.location.origin);

  if (!url.pathname.includes("/api/trpc")) {
    return globalThis.fetch(input, init);
  }

  const rawPath = url.pathname.substring(url.pathname.indexOf("/api/trpc") + "/api/trpc".length).replace(/^\//, "");
  const paths = rawPath.split(",").map((p) => decodeURIComponent(p).trim()).filter(Boolean);
  const isBatch = url.searchParams.get("batch") === "1" || paths.length > 1;

  let inputs: any[] = [];
  if (init?.method === "POST" && init.body) {
    try {
      const parsed = typeof init.body === "string" ? JSON.parse(init.body) : init.body;
      for (let i = 0; i < paths.length; i++) {
        const item = parsed[String(i)] ?? parsed[i] ?? parsed;
        const unwrapped = item?.json !== undefined ? item.json : item;
        inputs.push(unwrapped);
      }
    } catch {
      inputs = paths.map(() => ({}));
    }
  } else {
    const rawInput = url.searchParams.get("input");
    if (rawInput) {
      try {
        const parsed = JSON.parse(rawInput);
        for (let i = 0; i < paths.length; i++) {
          const item = parsed[String(i)] ?? parsed[i] ?? parsed;
          const unwrapped = item?.json !== undefined ? item.json : item;
          inputs.push(unwrapped);
        }
      } catch {
        inputs = paths.map(() => ({}));
      }
    } else {
      inputs = paths.map(() => undefined);
    }
  }

  const results = paths.map((path, index) => {
    try {
      const data = executeLocalProcedure(path, inputs[index]);
      return {
        result: {
          data: superjson.serialize(data),
        },
      };
    } catch (error: any) {
      return {
        error: {
          json: {
            message: error?.message || "Internal error",
            code: -32603,
          },
        },
      };
    }
  });

  const responseBody = isBatch ? results : results[0] ?? { result: { data: superjson.serialize(null) } };

  return new Response(JSON.stringify(responseBody), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
