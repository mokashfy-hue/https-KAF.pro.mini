import { useState } from "react";
import Layout from "@/components/Layout";
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
} from "lucide-react";
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

export default function Dashboard() {
  const { data, isLoading } = trpc.finance.dashboard.useQuery();
  const { data: accounts } = trpc.finance.accounts.list.useQuery();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<TxLike | null>(null);

  const accName = (id: number) => accounts?.find((a) => a.id === id)?.name ?? "";

  return (
    <Layout onAdd={() => { setEditing(null); setAddOpen(true); }}>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">لوحة التحكم</h1>
          <p className="text-sm text-muted-foreground">نظرة عامة على وضعك المالي</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="الرصيد الحالي"
            value={data?.currentBalance}
            icon={<Wallet className="h-5 w-5" />}
            accent="bg-emerald-600"
            loading={isLoading}
          />
          <StatCard
            title="إجمالي الدخل"
            value={data?.totalIncome}
            icon={<TrendingUp className="h-5 w-5" />}
            accent="bg-sky-600"
            loading={isLoading}
          />
          <StatCard
            title="إجمالي المصروفات"
            value={data?.totalExpense}
            icon={<TrendingDown className="h-5 w-5" />}
            accent="bg-rose-600"
            loading={isLoading}
          />
          <StatCard
            title="الادخار"
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
              <CardTitle className="text-base">الدخل مقابل المصروفات (آخر ٦ أشهر)</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {data && data.monthly.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.monthly.map((m) => ({
                      ...m,
                      label: MONTH_AR[m.month.slice(5)] ?? m.month,
                    }))}
                  >
                    <XAxis dataKey="label" fontSize={12} />
                    <YAxis fontSize={12} width={50} />
                    <Tooltip formatter={(v: number) => formatMoney(v)} />
                    <Legend />
                    <Bar dataKey="income" name="دخل" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="مصروف" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart text="لا توجد بيانات بعد — أضف أول حركة لك" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">المصروفات حسب التصنيف</CardTitle>
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
                <EmptyChart text="لا توجد مصروفات مسجلة بعد" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">أحدث الحركات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {data && data.recent.length > 0 ? (
              data.recent.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setEditing(t);
                    setAddOpen(true);
                  }}
                  className="w-full flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-accent text-right transition-colors"
                >
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                      t.kind === "income"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {t.kind === "income" ? (
                      <ArrowDownLeft className="h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {t.description || t.category}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t.category} · {accName(t.accountId)} · {String(t.date)}
                    </div>
                  </div>
                  <div
                    className={`text-sm font-bold tabular-nums ${
                      t.kind === "income" ? "text-emerald-600" : "text-rose-600"
                    }`}
                    dir="ltr"
                  >
                    {t.kind === "income" ? "+" : "−"}{formatMoney(t.amount)}
                  </div>
                </button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                لا توجد حركات بعد. اضغط زر + لإضافة أول مصروف.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <TransactionDialog open={addOpen} onOpenChange={setAddOpen} editing={editing} />
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
