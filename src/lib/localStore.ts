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
  nameEn?: string;
  code?: string;
  parentCode?: string;
  level?: number;
  type: "cash" | "bank" | "credit_card" | "savings" | "income" | "expense" | "asset" | "liability" | "equity" | "contra_asset" | "contra_revenue" | "contra_equity" | "other" | string;
  financialStatement?: string;
  normalBalance?: string;
  isPostable?: boolean;
  isReconciled?: boolean;
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

export interface LocalVoucher {
  id: number;
  number: string;
  type: "receipt" | "payment";
  date: string;
  amount: string;
  contactId?: number | null;
  contactName?: string;
  accountId: number;
  paymentMethod: "cash" | "transfer" | "cheque" | "card";
  referenceNo?: string;
  description: string;
  receivedBy?: string;
  createdAt: string;
}

export interface ClientAccount {
  id: string;
  code: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  pin: string;
  currency: string;
  createdAt: string;
}

export interface LocalDatabase {
  user: {
    id: number;
    name: string;
    email: string;
    role: "admin" | "user";
    avatar: string;
    clientName?: string;
    clientCode?: string;
    clientId?: string;
  };
  company: CompanyInfo;
  accounts: LocalAccount[];
  contacts: LocalContact[];
  vouchers: LocalVoucher[];
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
  { id: 1, code: "1", name: "الأصول", nameEn: "Assets", parentCode: "", level: 1, type: "asset", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: false, isReconciled: false, color: "#10b981", userId: 1 },
  { id: 2, code: "11", name: "الأصول المتداولة", nameEn: "Current Assets", parentCode: "1", level: 2, type: "asset", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: false, isReconciled: false, color: "#0ea5e9", userId: 1 },
  { id: 3, code: "1101", name: "النقد وما في حكمه", nameEn: "Cash and Cash Equivalents", parentCode: "11", level: 3, type: "asset", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: false, isReconciled: false, color: "#f59e0b", userId: 1 },
  { id: 4, code: "110101", name: "الصناديق النقدية (الخزينة)", nameEn: "Petty Cash & Vaults", parentCode: "1101", level: 4, type: "cash", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: false, isReconciled: true, color: "#8b5cf6", userId: 1 },
  { id: 5, code: "11010101", name: "صندوق المركز الرئيسي", nameEn: "Main Vault Cash", parentCode: "110101", level: 5, type: "cash", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: true, isReconciled: true, color: "#ec4899", userId: 1 },
  { id: 6, code: "11010102", name: "العهد النقدية المؤقتة", nameEn: "Temporary Cash Advances", parentCode: "110101", level: 5, type: "cash", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: true, isReconciled: true, color: "#ef4444", userId: 1 },
  { id: 7, code: "110102", name: "الحسابات البنكية", nameEn: "Bank Accounts", parentCode: "1101", level: 4, type: "bank", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: false, isReconciled: true, color: "#14b8a6", userId: 1 },
  { id: 8, code: "11010201", name: "الحساب الجاري المحلي", nameEn: "Local Current Bank Account", parentCode: "110102", level: 5, type: "bank", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: true, isReconciled: true, color: "#6366f1", userId: 1 },
  { id: 9, code: "11010202", name: "الحساب الجاري بالعملات الأجنبية", nameEn: "Foreign Currency Bank Account", parentCode: "110102", level: 5, type: "bank", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: true, isReconciled: true, color: "#10b981", userId: 1 },
  { id: 10, code: "1102", name: "الذمم المدينة (العملاء)", nameEn: "Accounts Receivable", parentCode: "11", level: 3, type: "asset", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: false, isReconciled: true, color: "#0ea5e9", userId: 1 },
  { id: 11, code: "110201", name: "ذمم العملاء التجاريين", nameEn: "Trade Receivables", parentCode: "1102", level: 4, type: "asset", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: false, isReconciled: true, color: "#f59e0b", userId: 1 },
  { id: 12, code: "11020101", name: "عملاء محليون", nameEn: "Local Customers", parentCode: "110201", level: 5, type: "asset", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: true, isReconciled: true, color: "#8b5cf6", userId: 1 },
  { id: 13, code: "11020102", name: "عملاء خارجيون / دوليون", nameEn: "Foreign Customers", parentCode: "110201", level: 5, type: "asset", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: true, isReconciled: true, color: "#ec4899", userId: 1 },
  { id: 14, code: "110202", name: "مخصص خسائر الائتمان المتوقعة", nameEn: "Allowance for Expected Credit Losses", parentCode: "1102", level: 4, type: "contra_asset", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: true, isReconciled: false, color: "#ef4444", userId: 1 },
  { id: 15, code: "1103", name: "أوراق القبض", nameEn: "Notes Receivable", parentCode: "11", level: 3, type: "asset", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: true, isReconciled: true, color: "#14b8a6", userId: 1 },
  { id: 16, code: "1104", name: "المخزون السلعي", nameEn: "Inventory", parentCode: "11", level: 3, type: "asset", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: false, isReconciled: false, color: "#6366f1", userId: 1 },
  { id: 17, code: "110401", name: "مخزون بضاعة تامة الصنع / تجارية", nameEn: "Finished Goods Inventory", parentCode: "1104", level: 4, type: "asset", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#10b981", userId: 1 },
  { id: 18, code: "110402", name: "مخزون مواد خام وقطع غيار", nameEn: "Raw Materials & Spare Parts", parentCode: "1104", level: 4, type: "asset", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#0ea5e9", userId: 1 },
  { id: 19, code: "110403", name: "بضاعة بالطريق (اعتمادات مستندية)", nameEn: "Goods in Transit / LC", parentCode: "1104", level: 4, type: "asset", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#f59e0b", userId: 1 },
  { id: 20, code: "1105", name: "أرصدة مدينة أخرى ومصروفات مقدمة", nameEn: "Prepayments & Other Receivables", parentCode: "11", level: 3, type: "asset", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: false, isReconciled: false, color: "#8b5cf6", userId: 1 },
  { id: 21, code: "110501", name: "إيجارات مدفوعة مقدماً", nameEn: "Prepaid Rent", parentCode: "1105", level: 4, type: "asset", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#ec4899", userId: 1 },
  { id: 22, code: "110502", name: "تأمينات مدفوعة مقدماً", nameEn: "Prepaid Insurance", parentCode: "1105", level: 4, type: "asset", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#ef4444", userId: 1 },
  { id: 23, code: "110503", name: "سلفيات وأمانات الموظفين", nameEn: "Employee Advances & Deposits", parentCode: "1105", level: 4, type: "asset", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: true, isReconciled: true, color: "#14b8a6", userId: 1 },
  { id: 24, code: "12", name: "الأصول غير المتداولة", nameEn: "Non-Current Assets", parentCode: "1", level: 2, type: "asset", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: false, isReconciled: false, color: "#6366f1", userId: 1 },
  { id: 25, code: "1201", name: "الأصول الثابتة الملموسة", nameEn: "Property, Plant & Equipment", parentCode: "12", level: 3, type: "asset", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: false, isReconciled: false, color: "#10b981", userId: 1 },
  { id: 26, code: "120101", name: "الأراضي", nameEn: "Land", parentCode: "1201", level: 4, type: "asset", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#0ea5e9", userId: 1 },
  { id: 27, code: "120102", name: "المباني والإنشاءات", nameEn: "Buildings & Improvements", parentCode: "1201", level: 4, type: "asset", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#f59e0b", userId: 1 },
  { id: 28, code: "120103", name: "الآلات والمعدات", nameEn: "Machinery & Equipment", parentCode: "1201", level: 4, type: "asset", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#8b5cf6", userId: 1 },
  { id: 29, code: "120104", name: "أجهزة الحاسب والشبكات", nameEn: "IT Equipment & Networks", parentCode: "1201", level: 4, type: "asset", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#ec4899", userId: 1 },
  { id: 30, code: "120105", name: "السيارات ووسائل النقل", nameEn: "Vehicles & Transport", parentCode: "1201", level: 4, type: "asset", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#ef4444", userId: 1 },
  { id: 31, code: "1202", name: "مجمعات إهلاك الأصول الثابتة", nameEn: "Accumulated Depreciation", parentCode: "12", level: 3, type: "contra_asset", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: false, isReconciled: false, color: "#14b8a6", userId: 1 },
  { id: 32, code: "120202", name: "مجمع إهلاك المباني", nameEn: "Acc. Dep. - Buildings", parentCode: "1202", level: 4, type: "contra_asset", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: true, isReconciled: false, color: "#6366f1", userId: 1 },
  { id: 33, code: "120203", name: "مجمع إهلاك الآلات والمعدات", nameEn: "Acc. Dep. - Machinery", parentCode: "1202", level: 4, type: "contra_asset", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: true, isReconciled: false, color: "#10b981", userId: 1 },
  { id: 34, code: "120204", name: "مجمع إهلاك أجهزة الحاسب", nameEn: "Acc. Dep. - IT Equipment", parentCode: "1202", level: 4, type: "contra_asset", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: true, isReconciled: false, color: "#0ea5e9", userId: 1 },
  { id: 35, code: "120205", name: "مجمع إهلاك السيارات والناقلات", nameEn: "Acc. Dep. - Vehicles", parentCode: "1202", level: 4, type: "contra_asset", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: true, isReconciled: false, color: "#f59e0b", userId: 1 },
  { id: 36, code: "1203", name: "مشروعات تحت التنفيذ", nameEn: "Capital Work in Progress (CWIP)", parentCode: "12", level: 3, type: "asset", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#8b5cf6", userId: 1 },
  { id: 37, code: "1204", name: "الأصول غير الملموسة", nameEn: "Intangible Assets & Software", parentCode: "12", level: 3, type: "asset", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#ec4899", userId: 1 },
  { id: 38, code: "2", name: "الالتزامات", nameEn: "Liabilities", parentCode: "", level: 1, type: "liability", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: false, isReconciled: false, color: "#ef4444", userId: 1 },
  { id: 39, code: "21", name: "الالتزامات المتداولة", nameEn: "Current Liabilities", parentCode: "2", level: 2, type: "liability", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: false, isReconciled: false, color: "#14b8a6", userId: 1 },
  { id: 40, code: "2101", name: "الذمم الدائنة (الموردون)", nameEn: "Accounts Payable", parentCode: "21", level: 3, type: "liability", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: false, isReconciled: true, color: "#6366f1", userId: 1 },
  { id: 41, code: "210101", name: "موردو البضائع والمواد", nameEn: "Trade Suppliers", parentCode: "2101", level: 4, type: "liability", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: true, isReconciled: true, color: "#10b981", userId: 1 },
  { id: 42, code: "210102", name: "موردو الخدمات والمقاولون", nameEn: "Service Providers & Contractors", parentCode: "2101", level: 4, type: "liability", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: true, isReconciled: true, color: "#0ea5e9", userId: 1 },
  { id: 43, code: "2102", name: "أوراق الدفع", nameEn: "Notes Payable", parentCode: "21", level: 3, type: "liability", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: true, isReconciled: true, color: "#f59e0b", userId: 1 },
  { id: 44, code: "2103", name: "المصروفات المستحقة والأرصدة الدائنة", nameEn: "Accrued Expenses & Payables", parentCode: "21", level: 3, type: "liability", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: false, isReconciled: false, color: "#8b5cf6", userId: 1 },
  { id: 45, code: "210301", name: "رواتب وأجور مستحقة", nameEn: "Accrued Salaries & Wages", parentCode: "2103", level: 4, type: "liability", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: true, isReconciled: false, color: "#ec4899", userId: 1 },
  { id: 46, code: "210302", name: "إيجارات ومصروفات مستحقة", nameEn: "Accrued Rent & Utilities", parentCode: "2103", level: 4, type: "liability", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: true, isReconciled: false, color: "#ef4444", userId: 1 },
  { id: 47, code: "210303", name: "تأمينات اجتماعية مستحقة", nameEn: "Social Insurance Payable", parentCode: "2103", level: 4, type: "liability", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: true, isReconciled: false, color: "#14b8a6", userId: 1 },
  { id: 48, code: "2104", name: "الإيرادات المقبوضة مقدماً", nameEn: "Unearned Revenues / Contract Liabilities", parentCode: "21", level: 3, type: "liability", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: true, isReconciled: false, color: "#6366f1", userId: 1 },
  { id: 49, code: "2105", name: "المستحقات والضمانات الضريبية", nameEn: "Tax Payables (VAT / Income)", parentCode: "21", level: 3, type: "liability", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: false, isReconciled: false, color: "#10b981", userId: 1 },
  { id: 50, code: "210501", name: "ضريبة القيمة المضافة المحصلة (مخرجات)", nameEn: "Output VAT Payable", parentCode: "2105", level: 4, type: "liability", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: true, isReconciled: false, color: "#0ea5e9", userId: 1 },
  { id: 51, code: "210502", name: "تسويات ضريبة القيمة المضافة", nameEn: "VAT Settlement Account", parentCode: "2105", level: 4, type: "liability", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: true, isReconciled: false, color: "#f59e0b", userId: 1 },
  { id: 52, code: "2106", name: "تسهيلات وقروض قصيرة الأجل", nameEn: "Short-Term Bank Facilities", parentCode: "21", level: 3, type: "liability", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: true, isReconciled: true, color: "#8b5cf6", userId: 1 },
  { id: 53, code: "22", name: "الالتزامات غير المتداولة", nameEn: "Non-Current Liabilities", parentCode: "2", level: 2, type: "liability", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: false, isReconciled: false, color: "#ec4899", userId: 1 },
  { id: 54, code: "2201", name: "قروض وتمويلات طويلة الأجل", nameEn: "Long-Term Loans & Financing", parentCode: "22", level: 3, type: "liability", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: true, isReconciled: true, color: "#ef4444", userId: 1 },
  { id: 55, code: "2202", name: "مخصص مكافأة نهاية الخدمة", nameEn: "End of Service Benefits Provision", parentCode: "22", level: 3, type: "liability", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: true, isReconciled: false, color: "#14b8a6", userId: 1 },
  { id: 56, code: "2203", name: "التزامات عقود الإيجار التمويلي", nameEn: "Lease Liabilities (Long-Term)", parentCode: "22", level: 3, type: "liability", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: true, isReconciled: false, color: "#6366f1", userId: 1 },
  { id: 57, code: "3", name: "حقوق الملكية", nameEn: "Equity", parentCode: "", level: 1, type: "equity", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: false, isReconciled: false, color: "#10b981", userId: 1 },
  { id: 58, code: "31", name: "رأس المال والاحتياطيات", nameEn: "Capital & Reserves", parentCode: "3", level: 2, type: "equity", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: false, isReconciled: false, color: "#0ea5e9", userId: 1 },
  { id: 59, code: "3101", name: "رأس المال المدفوع", nameEn: "Paid-in Capital", parentCode: "31", level: 3, type: "equity", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: false, isReconciled: false, color: "#f59e0b", userId: 1 },
  { id: 60, code: "310101", name: "حصة الشريك الأول", nameEn: "Partner A Capital", parentCode: "3101", level: 4, type: "equity", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: true, isReconciled: false, color: "#8b5cf6", userId: 1 },
  { id: 61, code: "310102", name: "حصة الشريك الثاني", nameEn: "Partner B Capital", parentCode: "3101", level: 4, type: "equity", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: true, isReconciled: false, color: "#ec4899", userId: 1 },
  { id: 62, code: "3102", name: "الاحتياطي النظامي", nameEn: "Statutory / Legal Reserve", parentCode: "31", level: 3, type: "equity", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: true, isReconciled: false, color: "#ef4444", userId: 1 },
  { id: 63, code: "3103", name: "الاحتياطي العام والاتفاقي", nameEn: "General Reserve", parentCode: "31", level: 3, type: "equity", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: true, isReconciled: false, color: "#14b8a6", userId: 1 },
  { id: 64, code: "3104", name: "الأرباح المبقاة (المحتجزة)", nameEn: "Retained Earnings", parentCode: "31", level: 3, type: "equity", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: true, isReconciled: false, color: "#6366f1", userId: 1 },
  { id: 65, code: "3105", name: "أرباح (خسائر) العام الحالي", nameEn: "Current Year Profit / Loss", parentCode: "31", level: 3, type: "equity", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: true, isReconciled: false, color: "#10b981", userId: 1 },
  { id: 66, code: "3106", name: "جاري الشركاء والمسحوبات", nameEn: "Partners Current & Drawings", parentCode: "31", level: 3, type: "equity", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: false, isReconciled: false, color: "#0ea5e9", userId: 1 },
  { id: 67, code: "310601", name: "جاري الشريك (أ)", nameEn: "Partner A Current Account", parentCode: "3106", level: 4, type: "equity", financialStatement: "Balance Sheet", normalBalance: "Credit", isPostable: true, isReconciled: true, color: "#f59e0b", userId: 1 },
  { id: 68, code: "310602", name: "مسحوبات الشركاء الشخصية", nameEn: "Partner Drawings", parentCode: "3106", level: 4, type: "contra_equity", financialStatement: "Balance Sheet", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#8b5cf6", userId: 1 },
  { id: 69, code: "4", name: "الإيرادات", nameEn: "Revenues", parentCode: "", level: 1, type: "income", financialStatement: "Income Statement", normalBalance: "Credit", isPostable: false, isReconciled: false, color: "#ec4899", userId: 1 },
  { id: 70, code: "41", name: "الإيرادات التشغيلية الرئيسية", nameEn: "Operating Revenues", parentCode: "4", level: 2, type: "income", financialStatement: "Income Statement", normalBalance: "Credit", isPostable: false, isReconciled: false, color: "#ef4444", userId: 1 },
  { id: 71, code: "4101", name: "إيرادات مبيعات السلع والمنتجات", nameEn: "Sales Revenue - Goods", parentCode: "41", level: 3, type: "income", financialStatement: "Income Statement", normalBalance: "Credit", isPostable: true, isReconciled: false, color: "#14b8a6", userId: 1 },
  { id: 72, code: "4102", name: "إيرادات تقديم الخدمات والحلول", nameEn: "Service & Consulting Revenues", parentCode: "41", level: 3, type: "income", financialStatement: "Income Statement", normalBalance: "Credit", isPostable: true, isReconciled: false, color: "#6366f1", userId: 1 },
  { id: 73, code: "4103", name: "مردودات ومسموحات المبيعات", nameEn: "Sales Returns & Allowances", parentCode: "41", level: 3, type: "contra_revenue", financialStatement: "Income Statement", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#10b981", userId: 1 },
  { id: 74, code: "4104", name: "الخصم المسموح به", nameEn: "Discounts Allowed", parentCode: "41", level: 3, type: "contra_revenue", financialStatement: "Income Statement", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#0ea5e9", userId: 1 },
  { id: 75, code: "42", name: "إيرادات غير تشغيلية وأخرى", nameEn: "Other & Non-Operating Income", parentCode: "4", level: 2, type: "income", financialStatement: "Income Statement", normalBalance: "Credit", isPostable: false, isReconciled: false, color: "#f59e0b", userId: 1 },
  { id: 76, code: "4201", name: "أرباح بيع أصول ثابتة", nameEn: "Gain on Disposal of Fixed Assets", parentCode: "42", level: 3, type: "income", financialStatement: "Income Statement", normalBalance: "Credit", isPostable: true, isReconciled: false, color: "#8b5cf6", userId: 1 },
  { id: 77, code: "4202", name: "أرباح فروق أسعار الصرف", nameEn: "Realized/Unrealized FX Gains", parentCode: "42", level: 3, type: "income", financialStatement: "Income Statement", normalBalance: "Credit", isPostable: true, isReconciled: false, color: "#ec4899", userId: 1 },
  { id: 78, code: "4203", name: "إيرادات استثمارات وعوائد أخرى", nameEn: "Investment & Miscellaneous Income", parentCode: "42", level: 3, type: "income", financialStatement: "Income Statement", normalBalance: "Credit", isPostable: true, isReconciled: false, color: "#ef4444", userId: 1 },
  { id: 79, code: "5", name: "التكاليف والمصروفات", nameEn: "Costs & Expenses", parentCode: "", level: 1, type: "expense", financialStatement: "Income Statement", normalBalance: "Debit", isPostable: false, isReconciled: false, color: "#14b8a6", userId: 1 },
  { id: 80, code: "51", name: "تكلفة الإيرادات / تكلفة البضاعة المباعة", nameEn: "Cost of Goods Sold (COGS)", parentCode: "5", level: 2, type: "expense", financialStatement: "Income Statement", normalBalance: "Debit", isPostable: false, isReconciled: false, color: "#6366f1", userId: 1 },
  { id: 81, code: "5101", name: "تكلفة المواد الخام والمشتريات", nameEn: "Direct Materials & Purchases", parentCode: "51", level: 3, type: "expense", financialStatement: "Income Statement", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#10b981", userId: 1 },
  { id: 82, code: "5102", name: "مصاريف شحن وتخليص جمركي للمشتريات", nameEn: "Freight-In & Customs Duties", parentCode: "51", level: 3, type: "expense", financialStatement: "Income Statement", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#0ea5e9", userId: 1 },
  { id: 83, code: "5103", name: "الأجور المباشرة وتكاليف العمالة التشغيلية", nameEn: "Direct Labor", parentCode: "51", level: 3, type: "expense", financialStatement: "Income Statement", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#f59e0b", userId: 1 },
  { id: 84, code: "5104", name: "تكاليف تشغيلية واستضافة سحابية مباشرة", nameEn: "Direct Cloud & Operational Tech Costs", parentCode: "51", level: 3, type: "expense", financialStatement: "Income Statement", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#8b5cf6", userId: 1 },
  { id: 85, code: "52", name: "المصروفات البيعية والتسويقية", nameEn: "Selling & Marketing Expenses", parentCode: "5", level: 2, type: "expense", financialStatement: "Income Statement", normalBalance: "Debit", isPostable: false, isReconciled: false, color: "#ec4899", userId: 1 },
  { id: 86, code: "5201", name: "الحملات الإعلانية والتسويق الرقمي", nameEn: "Digital Marketing & Advertising", parentCode: "52", level: 3, type: "expense", financialStatement: "Income Statement", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#ef4444", userId: 1 },
  { id: 87, code: "5202", name: "عمولات البيع ومكافآت المبيعات", nameEn: "Sales Commissions & Bonuses", parentCode: "52", level: 3, type: "expense", financialStatement: "Income Statement", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#14b8a6", userId: 1 },
  { id: 88, code: "5203", name: "مصاريف المعارض والضيافة الترويجية", nameEn: "Exhibitions & Promotions", parentCode: "52", level: 3, type: "expense", financialStatement: "Income Statement", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#6366f1", userId: 1 },
  { id: 89, code: "53", name: "المصروفات العمومية والإدارية", nameEn: "General & Administrative (G&A)", parentCode: "5", level: 2, type: "expense", financialStatement: "Income Statement", normalBalance: "Debit", isPostable: false, isReconciled: false, color: "#10b981", userId: 1 },
  { id: 90, code: "5301", name: "الرواتب والأجور الأساسية للإدارة", nameEn: "Management Salaries & Wages", parentCode: "53", level: 3, type: "expense", financialStatement: "Income Statement", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#0ea5e9", userId: 1 },
  { id: 91, code: "5302", name: "بدلات ومكافآت وتأمينات الموظفين", nameEn: "Employee Allowances & Insurance", parentCode: "53", level: 3, type: "expense", financialStatement: "Income Statement", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#f59e0b", userId: 1 },
  { id: 92, code: "5303", name: "إيجار المقرات والمكاتب", nameEn: "Office & Facility Rent", parentCode: "53", level: 3, type: "expense", financialStatement: "Income Statement", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#8b5cf6", userId: 1 },
  { id: 93, code: "5304", name: "خدمات المرافق (كهرباء، مياه، اتصالات)", nameEn: "Utilities & Telecommunications", parentCode: "53", level: 3, type: "expense", financialStatement: "Income Statement", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#ec4899", userId: 1 },
  { id: 94, code: "5305", name: "تراخيص ورسوم حكومية واستشارات مهنية", nameEn: "Licenses, Government Fees & Legal", parentCode: "53", level: 3, type: "expense", financialStatement: "Income Statement", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#ef4444", userId: 1 },
  { id: 95, code: "5306", name: "مصروفات إهلاك الأصول الثابتة", nameEn: "Depreciation Expense", parentCode: "53", level: 3, type: "expense", financialStatement: "Income Statement", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#14b8a6", userId: 1 },
  { id: 96, code: "5307", name: "أدوات مكتبية ومطبوعات وضيافة داخلية", nameEn: "Office Supplies & Refreshments", parentCode: "53", level: 3, type: "expense", financialStatement: "Income Statement", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#6366f1", userId: 1 },
  { id: 97, code: "54", name: "المصروفات المالية والأخرى", nameEn: "Financial & Other Expenses", parentCode: "5", level: 2, type: "expense", financialStatement: "Income Statement", normalBalance: "Debit", isPostable: false, isReconciled: false, color: "#10b981", userId: 1 },
  { id: 98, code: "5401", name: "الرسوم والعمولات البنكية", nameEn: "Bank Charges & Commissions", parentCode: "54", level: 3, type: "expense", financialStatement: "Income Statement", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#0ea5e9", userId: 1 },
  { id: 99, code: "5402", name: "خسائر فروق أسعار الصرف", nameEn: "Realized/Unrealized FX Losses", parentCode: "54", level: 3, type: "expense", financialStatement: "Income Statement", normalBalance: "Debit", isPostable: true, isReconciled: false, color: "#f59e0b", userId: 1 }
];

const DEFAULT_VOUCHERS: LocalVoucher[] = [
  {
    id: 1,
    number: "RV-001",
    type: "receipt",
    date: "2026-10-01",
    amount: "15000.00",
    contactId: 1,
    contactName: "مؤسسة الأفق للتجارة والمقاولات",
    accountId: 1,
    paymentMethod: "cash",
    referenceNo: "REC-7891",
    description: "استلام دفعة نقدية عهدة مشروع",
    receivedBy: "مكاشفي",
    createdAt: "2026-10-01",
  },
  {
    id: 2,
    number: "RV-002",
    type: "receipt",
    date: "2026-10-02",
    amount: "38500.00",
    contactId: 2,
    contactName: "شركة نماء الخليج للتطوير والاستثمار",
    accountId: 2,
    paymentMethod: "transfer",
    referenceNo: "TR-445588",
    description: "سداد دفعة العقد الاستشاري الأول",
    receivedBy: "مكاشفي",
    createdAt: "2026-10-02",
  },
  {
    id: 3,
    number: "PV-001",
    type: "payment",
    date: "2026-10-04",
    amount: "8200.00",
    contactId: 3,
    contactName: "شركة التجهيزات والتقنية المتقدمة",
    accountId: 2,
    paymentMethod: "transfer",
    referenceNo: "PAY-1102",
    description: "سداد فاتورة توريد أجهزة مكتبية وشبكات",
    receivedBy: "مكاشفي",
    createdAt: "2026-10-04",
  },
  {
    id: 4,
    number: "PV-002",
    type: "payment",
    date: "2026-10-05",
    amount: "2500.00",
    contactId: 4,
    contactName: "مكتب المستشار للخدمات القانونية",
    accountId: 1,
    paymentMethod: "cash",
    referenceNo: "CSH-339",
    description: "صرف أتعاب خدمات قانونية ومتابعة",
    receivedBy: "مكاشفي",
    createdAt: "2026-10-05",
  },
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
  vouchers: DEFAULT_VOUCHERS,
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

const CLIENTS_REGISTRY_KEY = "kaf_pro_clients_registry";
const ACTIVE_CLIENT_KEY = "kaf_pro_active_client_id";

export const DEFAULT_CLIENTS: ClientAccount[] = [
  {
    id: "client_main",
    code: "MAIN-01",
    name: "شركة كاف برو للحلول الإدارية والمالية",
    ownerName: "مكاشفي",
    email: "admin@kaf.pro",
    phone: "+966 50 123 4567",
    pin: "1234",
    currency: "ر.س (SAR)",
    createdAt: "2026-09-01",
  },
];

export function getClientsRegistry(): ClientAccount[] {
  if (typeof window === "undefined") return DEFAULT_CLIENTS;
  try {
    const raw = localStorage.getItem(CLIENTS_REGISTRY_KEY);
    if (!raw) {
      localStorage.setItem(CLIENTS_REGISTRY_KEY, JSON.stringify(DEFAULT_CLIENTS));
      return DEFAULT_CLIENTS;
    }
    const parsed = JSON.parse(raw);
    let clients = Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CLIENTS;
    
    // Migration: Filter out the hardcoded mock clients to ensure only user-created and main clients remain
    clients = clients.filter(c => c.id !== "client_alofooq" && c.id !== "client_namaa");
    
    // Save back if we removed anything
    if (clients.length !== parsed.length) {
      localStorage.setItem(CLIENTS_REGISTRY_KEY, JSON.stringify(clients));
    }
    
    return clients.length > 0 ? clients : DEFAULT_CLIENTS;
  } catch {
    return DEFAULT_CLIENTS;
  }
}

export function saveClientsRegistry(clients: ClientAccount[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CLIENTS_REGISTRY_KEY, JSON.stringify(clients));
  } catch (err) {
    console.error("Failed to save clients registry", err);
  }
}

export function getActiveClientId(): string {
  if (typeof window === "undefined") return "client_main";
  try {
    const active = localStorage.getItem(ACTIVE_CLIENT_KEY);
    return active || "client_main";
  } catch {
    return "client_main";
  }
}

export function setActiveClientId(id: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVE_CLIENT_KEY, id);
  } catch (err) {
    console.error("Failed to set active client id", err);
  }
}

export function getClientStorageKey(clientId: string): string {
  if (clientId === "client_main") {
    return "kaf_pro_accounting_db";
  }
  return `kaf_pro_client_${clientId}_db`;
}

function getDb(): LocalDatabase {
  if (typeof window === "undefined") return DEFAULT_DB;
  const clientId = getActiveClientId();
  const storageKey = getClientStorageKey(clientId);
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      const registry = getClientsRegistry();
      const currentClient = registry.find((c) => c.id === clientId);
      const initialDb: LocalDatabase = {
        ...DEFAULT_DB,
        user: {
          id: 1,
          name: currentClient?.ownerName || "مسؤول النظام",
          email: currentClient?.email || "user@kaf.pro",
          role: "admin",
          avatar: "",
          clientName: currentClient?.name,
          clientCode: currentClient?.code,
          clientId,
        },
        company: currentClient
          ? {
              ...DEFAULT_COMPANY,
              name: currentClient.name,
              nameEn: currentClient.code,
              currency: currentClient.currency || "ر.س (SAR)",
              phone: currentClient.phone,
              email: currentClient.email,
            }
          : DEFAULT_COMPANY,
        transactions: clientId === "client_main" ? DEFAULT_DB.transactions : [],
        vouchers: clientId === "client_main" ? DEFAULT_VOUCHERS : [],
        contacts: clientId === "client_main" ? DEFAULT_CONTACTS : [],
        journalEntries: clientId === "client_main" ? DEFAULT_DB.journalEntries : [],
        transfers: [],
      };
      localStorage.setItem(storageKey, JSON.stringify(initialDb));
      return initialDb;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.company) parsed.company = DEFAULT_COMPANY;
    if (!parsed.contacts) parsed.contacts = DEFAULT_CONTACTS;
    if (!parsed.vouchers) parsed.vouchers = DEFAULT_VOUCHERS;
    
    // Migration: Update accounts if they match the old default accounts structure (no nameEn, code 101)
    if (!parsed.accounts || (parsed.accounts.length > 0 && parsed.accounts[0].code === "101" && !("nameEn" in parsed.accounts[0]))) {
       parsed.accounts = DEFAULT_ACCOUNTS;
       localStorage.setItem(storageKey, JSON.stringify(parsed));
    }

    return parsed;
  } catch {
    return DEFAULT_DB;
  }
}

function saveDb(db: LocalDatabase) {
  if (typeof window === "undefined") return;
  const clientId = getActiveClientId();
  const storageKey = getClientStorageKey(clientId);
  try {
    localStorage.setItem(storageKey, JSON.stringify(db));
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
  // ── Client Registry & Authentication Management ──
  if (path === "auth.clients.list") {
    const clients = getClientsRegistry();
    return clients.map(({ pin, ...rest }) => ({
      ...rest,
      hasPin: Boolean(pin),
    }));
  }

  if (path === "auth.clients.getActive") {
    const activeId = getActiveClientId();
    const clients = getClientsRegistry();
    const activeClient = clients.find((c) => c.id === activeId) || clients[0] || DEFAULT_CLIENTS[0];
    return {
      activeClient,
      clientId: activeId,
      isPrivate: true,
    };
  }

  if (path === "auth.clients.login") {
    const { identifier, pin } = input;
    const clients = getClientsRegistry();
    const found = clients.find(
      (c) =>
        c.id === identifier ||
        c.code.toLowerCase() === (identifier || "").toLowerCase().trim() ||
        c.email.toLowerCase() === (identifier || "").toLowerCase().trim()
    );
    if (!found) {
      throw new Error("بيانات العميل غير صحيحة، يرجى التأكد من كود أو بريد العميل");
    }
    if (found.pin && pin && found.pin !== pin) {
      throw new Error("رمز المرور (PIN) غير صحيح لهذا العميل");
    }
    setActiveClientId(found.id);
    return { success: true, client: found };
  }

  if (path === "auth.clients.register") {
    const { name, ownerName, email, phone, pin, currency, crNumber, taxNumber } = input;
    const clients = getClientsRegistry();
    const nextNum = clients.length + 1;
    const code = `CL-${String(nextNum).padStart(3, "0")}`;
    const newId = `client_${Date.now()}`;
    const newClient: ClientAccount = {
      id: newId,
      code,
      name,
      ownerName: ownerName || name,
      email: email || `${code.toLowerCase()}@client.kaf`,
      phone: phone || "",
      pin: pin || "1234",
      currency: currency || "ر.س (SAR)",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    clients.push(newClient);
    saveClientsRegistry(clients);

    // Initialize completely private, clean database for this client
    const newDb: LocalDatabase = {
      user: {
        id: 1,
        name: newClient.ownerName,
        email: newClient.email,
        role: "admin",
        avatar: "",
        clientName: newClient.name,
        clientCode: newClient.code,
        clientId: newId,
      },
      company: {
        name: newClient.name,
        nameEn: code,
        crNumber: crNumber || "",
        taxNumber: taxNumber || "",
        currency: newClient.currency,
        phone: newClient.phone,
        email: newClient.email,
        address: "المقر الرئيسي للعميل",
        city: "المملكة العربية السعودية",
        slogan: "نظام محاسبي خاص ومعزول",
      },
      accounts: DEFAULT_ACCOUNTS,
      contacts: [],
      vouchers: [],
      transactions: [],
      journalEntries: [],
      transfers: [],
    };
    const storageKey = getClientStorageKey(newId);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(newDb));
    }

    setActiveClientId(newId);
    return { success: true, client: newClient };
  }

  if (path === "auth.clients.switch") {
    const { clientId, pin } = input;
    const clients = getClientsRegistry();
    const target = clients.find((c) => c.id === clientId);
    if (!target) throw new Error("العميل غير موجود");
    if (target.pin && pin && target.pin !== pin) {
      throw new Error("رمز المرور غير صحيح");
    }
    setActiveClientId(clientId);
    return { success: true, client: target };
  }

  const db = getDb();
  const balances = computeBalances(db);

  // ── Auth ──
  if (path === "auth.me") {
    const activeId = getActiveClientId();
    const clients = getClientsRegistry();
    const client = clients.find((c) => c.id === activeId);
    if (client) {
      return {
        id: 1,
        name: client.ownerName || client.name,
        email: client.email,
        role: "admin",
        avatar: "",
        clientName: client.name,
        clientCode: client.code,
        clientId: client.id,
      };
    }
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

  // ── Vouchers: Receipt & Payment ──
  if (path === "vouchers.list") {
    const type = input?.type;
    const list = db.vouchers ?? DEFAULT_VOUCHERS;
    if (type) return list.filter((v) => v.type === type);
    return list;
  }

  if (path === "vouchers.create") {
    const list = db.vouchers ?? DEFAULT_VOUCHERS;
    const nextId = list.length > 0 ? Math.max(...list.map((v) => v.id)) + 1 : 1;
    const prefix = input.type === "receipt" ? "RV" : "PV";
    const voucherNumber = input.number || `${prefix}-${String(nextId).padStart(3, "0")}`;

    const newVoucher: LocalVoucher = {
      id: nextId,
      number: voucherNumber,
      type: input.type,
      date: input.date,
      amount: Number(input.amount).toFixed(2),
      contactId: input.contactId ?? null,
      contactName: input.contactName ?? "",
      accountId: input.accountId,
      paymentMethod: input.paymentMethod ?? "cash",
      referenceNo: input.referenceNo ?? "",
      description: input.description,
      receivedBy: input.receivedBy ?? "مكاشفي",
      createdAt: new Date().toISOString().slice(0, 10),
    };

    list.unshift(newVoucher);
    db.vouchers = list;

    // Automatically create a matching transaction for real-time account balances
    const nextTxId = db.transactions.length > 0 ? Math.max(...db.transactions.map((t) => t.id)) + 1 : 1;
    const kind = input.type === "receipt" ? "income" : "expense";
    const category = input.type === "receipt" ? "سندات قبض" : "سندات صرف";
    db.transactions.unshift({
      id: nextTxId,
      accountId: input.accountId,
      contactId: input.contactId ?? null,
      amount: Number(input.amount).toFixed(2),
      kind,
      category,
      description: `${voucherNumber} - ${input.description}`,
      date: input.date,
      userId: 1,
    });

    // Update contact balance if contact is selected
    if (input.contactId) {
      const contact = (db.contacts ?? []).find((c) => c.id === input.contactId);
      if (contact) {
        if (input.type === "receipt") {
          contact.balance = Math.max(0, (contact.balance || 0) - Number(input.amount));
        } else {
          contact.balance = Math.max(0, (contact.balance || 0) - Number(input.amount));
        }
      }
    }

    saveDb(db);
    return newVoucher;
  }

  if (path === "vouchers.delete") {
    db.vouchers = (db.vouchers ?? DEFAULT_VOUCHERS).filter((v) => v.id !== input.id);
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
