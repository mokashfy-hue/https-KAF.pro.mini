export const EXPENSE_CATEGORIES = [
  "طعام ومشروبات",
  "مواصلات",
  "فواتير وخدمات",
  "تسوق",
  "ترفيه",
  "صحة",
  "تعليم",
  "سكن",
  "أخرى",
] as const;

export const INCOME_CATEGORIES = [
  "راتب",
  "أعمال حرة",
  "استثمار",
  "هدية",
  "أخرى",
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  "طعام ومشروبات": "#f97316",
  "مواصلات": "#0ea5e9",
  "فواتير وخدمات": "#8b5cf6",
  "تسوق": "#ec4899",
  "ترفيه": "#eab308",
  "صحة": "#ef4444",
  "تعليم": "#14b8a6",
  "سكن": "#6366f1",
  "أخرى": "#64748b",
};

export const ACCOUNT_TYPES = [
  { value: "cash", label: "نقدي" },
  { value: "bank", label: "حساب بنكي" },
  { value: "credit_card", label: "بطاقة ائتمان" },
  { value: "savings", label: "ادخار" },
  { value: "income", label: "دخل" },
  { value: "expense", label: "مصروف" },
  { value: "other", label: "أخرى" },
] as const;

export const ACCOUNT_COLORS = [
  "#10b981",
  "#0ea5e9",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#14b8a6",
  "#6366f1",
];

export function formatMoney(v: number | string | null | undefined) {
  const n = Number(v ?? 0);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function todayISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export function accountTypeLabel(t: string) {
  return ACCOUNT_TYPES.find((x) => x.value === t)?.label ?? t;
}
