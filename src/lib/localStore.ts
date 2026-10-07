import superjson from "superjson";

export interface CompanyInfo {
  name: string;
  nameEn: string;
  crNumber: string;
  taxNumber: string;
  currency: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  slogan: string;
}

export interface LocalAccount {
  id: number;
  name: string;
  code?: string;
  type: "cash" | "bank" | "credit_card" | "savings" | "income" | "expense" | "other";
  color: string;
  userId: number;
}

export interface LocalContact {
  id: number;
  name: string;
  type: "customer" | "supplier";
  phone: string;
  email: string;
  taxNumber?: string;
  balance: number;
  custodyBalance?: number;
  notes?: string;
  createdAt: string;
}

export interface LocalTransaction {
  id: number;
  accountId: number;
  contactId?: number | null;
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
  contactId?: number | null;
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
  company: CompanyInfo;
  accounts: LocalAccount[];
  contacts: LocalContact[];
  transactions: LocalTransaction[];
  journalEntries: LocalJournalEntry[];
  transfers: LocalTransfer[];
}

const STORAGE_KEY = "kaf_pro_accounting_db";

const DEFAULT_COMPANY: CompanyInfo = {
  name: "شركة كاف برو للحلول الإدارية والمالية",
  nameEn: "KAF PRO ERP & Financial Solutions Co.",
  crNumber: "1010789456",
  taxNumber: "310456789000003",
  currency: "ر.س (SAR)",
  phone: "+966 50 123 4567",
  email: "finance@kaf-pro.com",
  address: "طريق الملك فهد، حي الصحافة",
  city: "الرياض، المملكة العربية السعودية",
  slogan: "الريادة في الأنظمة المحاسبية والمالية الذكية",
};

const DEFAULT_CONTACTS: LocalContact[] = [
  {
    id: 1,
    name: "مؤسسة الأفق للتجارة والمقاولات",
    type: "customer",
    phone: "0551122334",
    email: "alofooq@example.com",
    taxNumber: "300123456700003",
    balance: 14500,
    custodyBalance: 5000,
    notes: "عميل عقود سنوية معتمد",
    createdAt: "2026-09-15",
  },
  {
    id: 2,
    name: "شركة نماء الخليج للتطوير والاستثمار",
    type: "customer",
    phone: "0509988776",
    email: "namaa@example.com",
    taxNumber: "300765432100003",
    balance: 28000,
    custodyBalance: 0,
    notes: "مشروع استشارات إدارية",
    createdAt: "2026-09-20",
  },
  {
    id: 3,
    name: "شركة التجهيزات والتقنية المتقدمة",
    type: "supplier",
    phone: "0114455667",
    email: "tech-supply@example.com",
    taxNumber: "310987654300003",
    balance: 8200,
    custodyBalance: 0,
    notes: "مورد أجهزة وسيرفرات",
    createdAt: "2026-09-10",
  },
  {
    id: 4,
    name: "مكتب المستشار للخدمات القانونية",
    type: "supplier",
    phone: "0543322110",
    email: "legal@advisor.com",
    taxNumber: "300445566700003",
    balance: 3500,
    custodyBalance: 0,
    notes: "استشارات ومتابعة قضايا",
    createdAt: "2026-09-25",
  },
];

const DEFAULT_ACCOUNTS: LocalAccount[] = [
  { id: 1, name: "الصندوق الرئيسي (نقدي)", code: "101", type: "cash", color: "#10b981", userId: 1 },
  { id: 2, name: "الحساب البنكي (الراجحي)", code: "102", type: "bank", color: "#0ea5e9", userId: 1 },
  { id: 3, name: "بنك الجزيرة", code: "103", type: "bank", color: "#3b82f6", userId: 1 },
  { id: 4, name: "حساب الادخار والاستثمار", code: "104", type: "savings", color: "#8b5cf6", userId: 1 },
  { id: 5, name: "بطاقة ائتمان الأعمال", code: "201", type: "credit_card", color: "#f59e0b", userId: 1 },
  { id: 6, name: "إيرادات المبيعات والخدمات", code: "401", type: "income", color: "#22c55e", userId: 1 },
  { id: 7, name: "المصروفات التشغيلية", code: "501", type: "expense", color: "#ef4444", userId: 1 },
];

const DEFAULT_DB: LocalDatabase = {
  user: {
    id: 1,
    name: "مكاشفي",
    email: "admin@kaf.pro",
    role: "admin",
    avatar: "",
  },
  company: DEFAULT_COMPANY,
  accounts: DEFAULT_ACCOUNTS,
  contacts: DEFAULT_CONTACTS,
  transactions: [
    {
      id: 1,
      accountId: 1,
      contactId: 1,
      amount: "15000.00",
      kind: "income",
      category: "إيرادات خدمات",
      description: "تحصيل عهدة وأتعاب من مؤسسة الأفق",
      date: "2026-10-01",
      userId: 1,
    },
    {
      id: 2,
      accountId: 2,
      contactId: 2,
      amount: "38500.00",
      kind: "income",
      category: "إيراد استشارات",
      description: "دفعة مشروع معتمد من شركة نماء الخليج",
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
      contactId: 3,
      amount: "1850.00",
      kind: "expense",
      category: "مصاريف تشغيل",
      description: "فواتير ومستلزمات مكتبية وتقنية",
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
    {
      id: 2,
      date: "2026-10-03",
      description: "قيد إثبات إيراد واستحقاق عميل مؤسسة الأفق",
      reference: "JV-002",
      userId: 1,
      lines: [
        { id: 4, entryId: 2, accountId: 1, debit: "15000.00", credit: "0.00", description: "استلام عهدة نقدية بالصندوق" },
        { id: 5, entryId: 2, accountId: 6, debit: "0.00", credit: "15000.00", description: "إيراد مبيعات وخدمات" },
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
    const parsed = JSON.parse(raw);
    if (!parsed.company) parsed.company = DEFAULT_COMPANY;
    if (!parsed.contacts) parsed.contacts = DEFAULT_CONTACTS;
    return parsed;
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

  // ── Company Info ──
  if (path === "company.get") {
    return db.company ?? DEFAULT_COMPANY;
  }
  if (path === "company.update") {
    db.company = { ...(db.company ?? DEFAULT_COMPANY), ...input };
    saveDb(db);
    return db.company;
  }

  // ── Contacts (Customers & Suppliers) ──
  if (path === "contacts.list") {
    const type = input?.type;
    const list = db.contacts ?? DEFAULT_CONTACTS;
    if (type) return list.filter((c) => c.type === type);
    return list;
  }

  if (path === "contacts.create") {
    const list = db.contacts ?? DEFAULT_CONTACTS;
    const nextId = list.length > 0 ? Math.max(...list.map((c) => c.id)) + 1 : 1;
    const newContact: LocalContact = {
      id: nextId,
      name: input.name,
      type: input.type,
      phone: input.phone ?? "",
      email: input.email ?? "",
      taxNumber: input.taxNumber ?? "",
      balance: Number(input.balance ?? 0),
      custodyBalance: Number(input.custodyBalance ?? 0),
      notes: input.notes ?? "",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    list.unshift(newContact);
    db.contacts = list;
    saveDb(db);
    return newContact;
  }

  if (path === "contacts.update") {
    const list = db.contacts ?? DEFAULT_CONTACTS;
    const idx = list.findIndex((c) => c.id === input.id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...input };
      db.contacts = list;
      saveDb(db);
      return list[idx];
    }
    return { ok: true };
  }

  if (path === "contacts.delete") {
    db.contacts = (db.contacts ?? DEFAULT_CONTACTS).filter((c) => c.id !== input.id);
    saveDb(db);
    return { ok: true };
  }

  // ── Reports: Trial Balance, Income Statement, Balance Sheet ──
  if (path === "reports.trialBalance") {
    // Compute debits and credits for all accounts
    const accountRows = db.accounts.map((acc) => {
      let debitTotal = 0;
      let creditTotal = 0;

      // From transactions
      for (const t of db.transactions) {
        if (t.accountId === acc.id) {
          if (t.kind === "income") {
            debitTotal += n(t.amount);
          } else {
            creditTotal += n(t.amount);
          }
        }
      }

      // From journal entries
      for (const entry of db.journalEntries) {
        for (const line of entry.lines) {
          if (line.accountId === acc.id) {
            debitTotal += n(line.debit);
            creditTotal += n(line.credit);
          }
        }
      }

      // From transfers
      for (const tf of db.transfers) {
        if (tf.toAccountId === acc.id) debitTotal += n(tf.amount);
        if (tf.fromAccountId === acc.id) creditTotal += n(tf.amount);
      }

      const balanceDebit = debitTotal >= creditTotal ? debitTotal - creditTotal : 0;
      const balanceCredit = creditTotal > debitTotal ? creditTotal - debitTotal : 0;

      return {
        id: acc.id,
        code: acc.code ?? String(100 + acc.id),
        name: acc.name,
        type: acc.type,
        debitTotal,
        creditTotal,
        balanceDebit,
        balanceCredit,
      };
    });

    const sumDebitTotal = accountRows.reduce((s, r) => s + r.debitTotal, 0);
    const sumCreditTotal = accountRows.reduce((s, r) => s + r.creditTotal, 0);
    const sumBalanceDebit = accountRows.reduce((s, r) => s + r.balanceDebit, 0);
    const sumBalanceCredit = accountRows.reduce((s, r) => s + r.balanceCredit, 0);
    const isBalanced = Math.abs(sumDebitTotal - sumCreditTotal) < 0.01;

    return {
      rows: accountRows,
      sumDebitTotal,
      sumCreditTotal,
      sumBalanceDebit,
      sumBalanceCredit,
      isBalanced,
      date: new Date().toISOString().slice(0, 10),
    };
  }

  if (path === "reports.incomeStatement") {
    // Revenues
    const revenues = db.transactions
      .filter((t) => t.kind === "income")
      .map((t) => ({ description: t.description || t.category, amount: n(t.amount), date: t.date }));
    const totalRevenues = revenues.reduce((s, r) => s + r.amount, 0);

    // Expenses grouped by category
    const expCategories = new Map<string, number>();
    for (const t of db.transactions) {
      if (t.kind === "expense") {
        expCategories.set(t.category, (expCategories.get(t.category) ?? 0) + n(t.amount));
      }
    }
    const expensesByCategory = [...expCategories.entries()].map(([category, amount]) => ({ category, amount }));
    const totalExpenses = expensesByCategory.reduce((s, e) => s + e.amount, 0);
    const netProfit = totalRevenues - totalExpenses;
    const profitMargin = totalRevenues > 0 ? (netProfit / totalRevenues) * 100 : 0;

    return {
      revenues,
      totalRevenues,
      expensesByCategory,
      totalExpenses,
      netProfit,
      profitMargin,
      date: new Date().toISOString().slice(0, 10),
    };
  }

  if (path === "reports.balanceSheet") {
    // Assets: Cash, Bank, Savings, Customers
    const assetAccounts = db.accounts
      .filter((a) => ["cash", "bank", "savings"].includes(a.type))
      .map((a) => ({ name: a.name, balance: Math.max(0, balances.get(a.id) ?? 0) }));
    
    const customerDebts = (db.contacts ?? DEFAULT_CONTACTS)
      .filter((c) => c.type === "customer")
      .reduce((s, c) => s + (c.balance || 0), 0);

    const totalAssets = assetAccounts.reduce((s, a) => s + a.balance, 0) + customerDebts;

    // Liabilities: Credit Cards, Suppliers
    const liabilityAccounts = db.accounts
      .filter((a) => a.type === "credit_card")
      .map((a) => ({ name: a.name, balance: Math.abs(balances.get(a.id) ?? 0) }));
    
    const supplierDebts = (db.contacts ?? DEFAULT_CONTACTS)
      .filter((c) => c.type === "supplier")
      .reduce((s, c) => s + (c.balance || 0), 0);

    const totalLiabilities = liabilityAccounts.reduce((s, l) => s + l.balance, 0) + supplierDebts;

    // Net Profit & Capital
    const totalRevenues = db.transactions.filter((t) => t.kind === "income").reduce((s, t) => s + n(t.amount), 0);
    const totalExpenses = db.transactions.filter((t) => t.kind === "expense").reduce((s, t) => s + n(t.amount), 0);
    const retainedEarnings = totalRevenues - totalExpenses;
    const capital = Math.max(0, totalAssets - totalLiabilities - retainedEarnings);
    const totalEquity = capital + retainedEarnings;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    return {
      assetAccounts,
      customerDebts,
      totalAssets,
      liabilityAccounts,
      supplierDebts,
      totalLiabilities,
      capital,
      retainedEarnings,
      totalEquity,
      totalLiabilitiesAndEquity,
      isBalanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1,
      date: new Date().toISOString().slice(0, 10),
    };
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
      code: input.code ?? String(100 + nextId),
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
      if (input.code) db.accounts[idx].code = input.code;
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
      contactId: input.contactId ?? null,
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
      if (input.contactId !== undefined) db.transactions[idx].contactId = input.contactId;
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
      contactId: l.contactId ?? null,
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
    return {
      version: 2,
      exportedAt: new Date().toISOString(),
      company: db.company,
      accounts: db.accounts,
      contacts: db.contacts,
      transactions: db.transactions,
      journalEntries: db.journalEntries,
      transfers: db.transfers,
    };
  }

  if (path === "finance.backup.restore") {
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
