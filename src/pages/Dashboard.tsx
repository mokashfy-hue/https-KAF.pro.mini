import { useState } from "react";
import { useNavigate } from "react-router";
import Layout from "@/components/Layout";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  TransactionDialog,
  type TxLike,
} from "@/components/TransactionDialog";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney, CATEGORY_COLORS } from "@/lib/finance";
import { cn } from "@/lib/utils";
import {
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
  FileText,
  Receipt,
  BookOpen,
  Users,
  FileSpreadsheet,
  Settings,
  Lock,
} from "lucide-react";
import { InstallOfflineDialog } from "@/components/InstallOfflineDialog";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MONTH_AR: Record<string, string> = {
  "01": "يناير", "02": "فبراير", "03": "مارس", "04": "أبريل",
  "05": "مايو", "06": "يونيو", "07": "يوليو", "08": "أغسطس",
  "09": "سبتمبر", "10": "أكتوبر", "11": "نوفمبر", "12": "ديسمبر",
};

const MONTH_EN: Record<string, string> = {
  "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
  "05": "May", "06": "Jun", "07": "Jul", "08": "Aug",
  "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec",
};

const ERP_MODULES = [
  {
    path: "/vouchers",
    arTitle: "سندات القبض والصرف",
    enTitle: "Vouchers",
    arDesc: "إصدار وطباعة سندات القبض والصرف",
    enDesc: "Issue & print vouchers",
    icon: FileText,
    color: "bg-emerald-600",
    badgeAr: "مباشر",
    badgeEn: "Live",
  },
  {
    path: "/transactions",
    arTitle: "الحركات المالية",
    enTitle: "Transactions",
    arDesc: "سجل العمليات والدخل والمصروفات",
    enDesc: "Income & expense records",
    icon: Receipt,
    color: "bg-teal-600",
    badgeAr: "سجل مالي",
    badgeEn: "Ledger",
  },
  {
    path: "/journal",
    arTitle: "قيود اليومية",
    enTitle: "Journal Entries",
    arDesc: "القيود المزدوجة وموازين الحسابات",
    enDesc: "Double-entry accounting",
    icon: BookOpen,
    color: "bg-sky-600",
    badgeAr: "محاسبة",
    badgeEn: "GL",
  },
  {
    path: "/accounts",
    arTitle: "شجرة الحسابات",
    enTitle: "Accounts Tree",
    arDesc: "دليل الحسابات والأرصدة والتحويلات",
    enDesc: "Chart of accounts & balances",
    icon: Wallet,
    color: "bg-blue-600",
    badgeAr: "دليل",
    badgeEn: "COA",
  },
  {
    path: "/contacts",
    arTitle: "العملاء والموردين",
    enTitle: "Contacts",
    arDesc: "سجل العملاء والموردين والمستحقات",
    enDesc: "Customers & suppliers directory",
    icon: Users,
    color: "bg-indigo-600",
    badgeAr: "أطراف",
    badgeEn: "Entities",
  },
  {
    path: "/reports",
    arTitle: "التقارير المالية",
    enTitle: "Reports",
    arDesc: "ميزان المراجعة، الأرباح والميزانية",
    enDesc: "Trial balance & Balance Sheet",
    icon: FileSpreadsheet,
    color: "bg-violet-600",
    badgeAr: "تقارير",
    badgeEn: "Reports",
  },
  {
    path: "/settings",
    arTitle: "بيانات المنشأة",
    enTitle: "Company Info",
    arDesc: "معلومات الشركة والسجل والضريبة",
    enDesc: "Company info, CR & tax IDs",
    icon: Settings,
    color: "bg-amber-600",
    badgeAr: "المنشأة",
    badgeEn: "Profile",
  },
  {
    path: "/login",
    arTitle: "مساحات العمل الخاصة",
    enTitle: "Private Workspaces",
    arDesc: "تسجيل العملاء وعزل البيانات الخاصة",
    enDesc: "Multi-client isolated workspaces",
    icon: Lock,
    color: "bg-rose-600",
    badgeAr: "🔒 معزول",
    badgeEn: "🔒 Isolated",
  },
];

export default function Dashboard() {
  const { lang, t, isRtl } = useLanguage();
  const navigate = useNavigate();
  const { data, isLoading } = trpc.finance.dashboard.useQuery();
  const { data: accounts } = trpc.finance.accounts.list.useQuery();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<TxLike | null>(null);
  const [installOpen, setInstallOpen] = useState(false);

  const accName = (id: number) => accounts?.find((a) => a.id === id)?.name ?? "";

  const monthMap = isRtl ? MONTH_AR : MONTH_EN;

  return (
    <Layout onAdd={() => { setEditing(null); setAddOpen(true); }}>
      <div className="space-y-4 pb-2">

        {/* Page Title */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t("لوحة التحكم", "Dashboard")}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {t("نظرة عامة على وضعك المالي", "Overview of your financial status")}
          </p>
        </div>

        {/* Stat cards - 2 cols on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <StatCard
            title={t("الرصيد الحالي", "Current Balance")}
            value={data?.currentBalance}
            icon={<Wallet className="h-4 w-4 sm:h-5 sm:w-5" />}
            accent="bg-emerald-600"
            loading={isLoading}
          />
          <StatCard
            title={t("إجمالي الدخل", "Total Income")}
            value={data?.totalIncome}
            icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />}
            accent="bg-sky-600"
            loading={isLoading}
          />
          <StatCard
            title={t("إجمالي المصروفات", "Total Expenses")}
            value={data?.totalExpense}
            icon={<TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />}
            accent="bg-rose-600"
            loading={isLoading}
          />
          <StatCard
            title={t("الادخار", "Savings")}
            value={data?.savings}
            icon={<PiggyBank className="h-4 w-4 sm:h-5 sm:w-5" />}
            accent="bg-violet-600"
            loading={isLoading}
          />
        </div>

        {/* All ERP Modules Quick Access Grid */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-600 inline-block" />
                <span>{t("وحدات وأقسام النظام المحاسبي", "ERP System Modules")}</span>
              </h2>
            </div>
            <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
              8 {t("وحدات", "Units")}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {ERP_MODULES.map((mod) => (
              <button
                key={mod.path}
                onClick={() => navigate(mod.path)}
                className="flex flex-col items-start p-2.5 sm:p-3.5 rounded-xl bg-card hover:bg-emerald-50/40 border border-border/60 hover:border-emerald-300 transition-all text-right group shadow-xs active:scale-[0.98]"
              >
                <div className="w-full flex items-center justify-between mb-1.5">
                  <div className={cn("h-8 w-8 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-110", mod.color)}>
                    <mod.icon className="h-4 w-4" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground bg-muted/70 px-1.5 py-0.5 rounded">
                    {t(mod.badgeAr, mod.badgeEn)}
                  </span>
                </div>
                <div className="font-bold text-[11px] sm:text-xs text-foreground group-hover:text-emerald-700 transition-colors leading-tight">
                  {t(mod.arTitle, mod.enTitle)}
                </div>
                <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5 hidden sm:block">
                  {t(mod.arDesc, mod.enDesc)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Charts - stacked on mobile, side by side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-sm sm:text-base">
                {t("الدخل مقابل المصروفات (آخر ٦ أشهر)", "Income vs Expenses (Last 6 Months)")}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-52 sm:h-64 px-2 sm:px-4 pb-3">
              {data && data.monthly.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.monthly.map((m) => ({
                      ...m,
                      label: monthMap[m.month.slice(5)] ?? m.month,
                    }))}
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  >
                    <XAxis dataKey="label" fontSize={10} tick={{ fontSize: 10 }} />
                    <YAxis fontSize={10} width={40} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => formatMoney(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="income" name={t("دخل", "Income")} fill="#10b981" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="expense" name={t("مصروف", "Expense")} fill="#f43f5e" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart text={t("لا توجد بيانات بعد — أضف أول حركة لك", "No data yet — add your first transaction")} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-sm sm:text-base">
                {t("المصروفات حسب التصنيف", "Expenses by Category")}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-52 sm:h-64 px-2 sm:px-4 pb-3">
              {data && data.byCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.byCategory}
                      dataKey="value"
                      nameKey="category"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {data.byCategory.map((c) => (
                        <Cell
                          key={c.category}
                          fill={CATEGORY_COLORS[c.category] ?? "#64748b"}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatMoney(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart text={t("لا توجد مصروفات مسجلة بعد", "No expenses recorded yet")} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent transactions */}
        <Card>
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm sm:text-base">{t("أحدث الحركات", "Recent Transactions")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0.5 px-2 sm:px-4 pb-3">
            {data && data.recent.length > 0 ? (
              data.recent.map((tItem) => (
                <button
                  key={tItem.id}
                  onClick={() => {
                    setEditing(tItem);
                    setAddOpen(true);
                  }}
                  className={`w-full flex items-center gap-2.5 sm:gap-3 rounded-xl px-2 py-2 hover:bg-accent ${isRtl ? "text-right" : "text-left"} transition-colors`}
                >
                  <div
                    className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center shrink-0 ${
                      tItem.kind === "income"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {tItem.kind === "income" ? (
                      <ArrowDownLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    ) : (
                      <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-medium truncate">
                      {tItem.description || tItem.category}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">
                      {tItem.category} · {String(tItem.date)}
                    </div>
                  </div>
                  <div
                    className={`text-xs sm:text-sm font-bold tabular-nums shrink-0 ${
                      tItem.kind === "income" ? "text-emerald-600" : "text-rose-600"
                    }`}
                    dir="ltr"
                  >
                    {tItem.kind === "income" ? "+" : "−"}{formatMoney(tItem.amount)}
                  </div>
                </button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                {t("لا توجد حركات بعد. اضغط زر + لإضافة أول حركة.", "No transactions yet. Click + to add your first transaction.")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <TransactionDialog open={addOpen} onOpenChange={setAddOpen} editing={editing} />
      <InstallOfflineDialog open={installOpen} onOpenChange={setInstallOpen} />
    </Layout>
  );
}

function StatCard({
  title,
  value,
  icon,
  accent,
  loading,
}: {
  title: string;
  value?: number;
  icon: React.ReactNode;
  accent: string;
  loading?: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
          <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg ${accent} text-white flex items-center justify-center shrink-0`}>
            {icon}
          </div>
          <span className="text-[10px] sm:text-xs leading-tight">{title}</span>
        </div>
        <div className="text-base sm:text-lg lg:text-xl font-bold tabular-nums" dir="ltr">
          {loading ? "…" : formatMoney(value)}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
