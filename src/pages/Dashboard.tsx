import { useState } from "react";
import Layout from "@/components/Layout";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  TransactionDialog,
  type TxLike,
} from "@/components/TransactionDialog";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney, CATEGORY_COLORS } from "@/lib/finance";
import {
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
  Smartphone,
  Download,
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

export default function Dashboard() {
  const { lang, t, isRtl } = useLanguage();
  const { data, isLoading } = trpc.finance.dashboard.useQuery();
  const { data: accounts } = trpc.finance.accounts.list.useQuery();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<TxLike | null>(null);
  const [installOpen, setInstallOpen] = useState(false);

  const accName = (id: number) => accounts?.find((a) => a.id === id)?.name ?? "";

  const monthMap = isRtl ? MONTH_AR : MONTH_EN;

  return (
    <Layout onAdd={() => { setEditing(null); setAddOpen(true); }}>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{t("لوحة التحكم", "Dashboard")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("نظرة عامة على وضعك المالي", "Overview of your financial status")}
            </p>
          </div>
          <button
            onClick={() => setInstallOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold transition-all w-fit shadow-xs active:scale-95"
          >
            <Smartphone className="h-4 w-4 text-emerald-600" />
            <span>{t("📲 تحميل / تثبيت التطبيق والنسخة المحلية", "Install App / Download Offline")}</span>
          </button>
        </div>

        {/* Offline & App Installation Notice Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md shadow-emerald-700/20">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                {t("تطبيق كاف برو قابل للتثبيت والعمل محلياً بدون إنترنت!", "KAF PRO is installable & works offline locally!")}
              </h3>
              <p className="text-xs text-white/80 mt-0.5">
                {t(
                  "ثبّته على جوالك أو الكمبيوتر أو حمّل نسخة مستقلة للعميل للعمل بها بدون خادم.",
                  "Install on phone/PC or download a standalone portable offline copy for any client."
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setInstallOpen(true)}
              className="px-4 py-2 bg-white text-emerald-800 hover:bg-white/90 text-xs font-bold rounded-xl transition-all shadow-sm shrink-0 active:scale-95"
            >
              {t("📲 خيارات التثبيت والتحميل", "Install & Download Options")}
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title={t("الرصيد الحالي", "Current Balance")}
            value={data?.currentBalance}
            icon={<Wallet className="h-5 w-5" />}
            accent="bg-emerald-600"
            loading={isLoading}
          />
          <StatCard
            title={t("إجمالي الدخل", "Total Income")}
            value={data?.totalIncome}
            icon={<TrendingUp className="h-5 w-5" />}
            accent="bg-sky-600"
            loading={isLoading}
          />
          <StatCard
            title={t("إجمالي المصروفات", "Total Expenses")}
            value={data?.totalExpense}
            icon={<TrendingDown className="h-5 w-5" />}
            accent="bg-rose-600"
            loading={isLoading}
          />
          <StatCard
            title={t("الادخار", "Savings")}
            value={data?.savings}
            icon={<PiggyBank className="h-5 w-5" />}
            accent="bg-violet-600"
            loading={isLoading}
          />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("الدخل مقابل المصروفات (آخر ٦ أشهر)", "Income vs Expenses (Last 6 Months)")}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {data && data.monthly.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.monthly.map((m) => ({
                      ...m,
                      label: monthMap[m.month.slice(5)] ?? m.month,
                    }))}
                  >
                    <XAxis dataKey="label" fontSize={12} />
                    <YAxis fontSize={12} width={50} />
                    <Tooltip formatter={(v: number) => formatMoney(v)} />
                    <Legend />
                    <Bar dataKey="income" name={t("دخل", "Income")} fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name={t("مصروف", "Expense")} fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart text={t("لا توجد بيانات بعد — أضف أول حركة لك", "No data yet — add your first transaction")} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("المصروفات حسب التصنيف", "Expenses by Category")}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {data && data.byCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.byCategory}
                      dataKey="value"
                      nameKey="category"
                      innerRadius={55}
                      outerRadius={85}
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
                    <Legend />
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
          <CardHeader>
            <CardTitle className="text-base">{t("أحدث الحركات", "Recent Transactions")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {data && data.recent.length > 0 ? (
              data.recent.map((tItem) => (
                <button
                  key={tItem.id}
                  onClick={() => {
                    setEditing(tItem);
                    setAddOpen(true);
                  }}
                  className={`w-full flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-accent ${isRtl ? "text-right" : "text-left"} transition-colors`}
                >
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                      tItem.kind === "income"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {tItem.kind === "income" ? (
                      <ArrowDownLeft className="h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {tItem.description || tItem.category}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {tItem.category} · {accName(tItem.accountId)} · {String(tItem.date)}
                    </div>
                  </div>
                  <div
                    className={`text-sm font-bold tabular-nums ${
                      tItem.kind === "income" ? "text-emerald-600" : "text-rose-600"
                    }`}
                    dir="ltr"
                  >
                    {tItem.kind === "income" ? "+" : "−"}{formatMoney(tItem.amount)}
                  </div>
                </button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
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
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <div className={`h-8 w-8 rounded-lg ${accent} text-white flex items-center justify-center`}>
            {icon}
          </div>
          <span className="text-xs">{title}</span>
        </div>
        <div className="text-lg lg:text-xl font-bold tabular-nums" dir="ltr">
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
