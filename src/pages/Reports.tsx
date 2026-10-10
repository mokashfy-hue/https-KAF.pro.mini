import { useState } from "react";
import Layout from "@/components/Layout";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/finance";
import {
  FileSpreadsheet,
  Scale,
  PieChart,
  Printer,
  CheckCircle2,
  TrendingUp,
  Building2,
  Calendar,
  Activity,
  Receipt,
} from "lucide-react";

export default function ReportsPage() {
  const { isRtl, t } = useLanguage();
  const [reportType, setReportType] = useState<"trialBalance" | "balanceSheet" | "incomeStatement" | "transactions" | "vouchers">("trialBalance");

  const { data: trialBalance } = (trpc as any).reports.trialBalance.useQuery();
  const { data: balanceSheet } = (trpc as any).reports.balanceSheet.useQuery();
  const { data: incomeStatement } = (trpc as any).reports.incomeStatement.useQuery();
  const { data: transactions } = (trpc as any).transactions.list.useQuery();
  const { data: vouchers } = (trpc as any).vouchers.list.useQuery();
  const { data: company } = (trpc as any).company.get.useQuery();

  const handlePrint = () => {
    window.print();
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileSpreadsheet className="h-7 w-7 text-emerald-600" />
              {t("التقارير المالية والقوائم الختامية", "Financial Reports & Statements")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("ميزان المراجعة، الميزانية العمومية، وقائمة الدخل والأرباح", "Trial balance, balance sheet, and income statement")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} variant="outline" className="gap-2 h-11 border-dashed">
              <Printer className="h-4 w-4 text-emerald-600" />
              {t("طباعة التقرير 🖨️", "Print Report 🖨️")}
            </Button>
          </div>
        </div>

        {/* Report Selector Tabs */}
        <div className="flex flex-wrap gap-2 border-b pb-2">
          <Button
            variant={reportType === "trialBalance" ? "default" : "outline"}
            onClick={() => setReportType("trialBalance")}
            className={reportType === "trialBalance" ? "bg-emerald-600 hover:bg-emerald-700 gap-2" : "gap-2"}
          >
            <Scale className="h-4 w-4" />
            {t("ميزان المراجعة", "Trial Balance")}
          </Button>

          <Button
            variant={reportType === "balanceSheet" ? "default" : "outline"}
            onClick={() => setReportType("balanceSheet")}
            className={reportType === "balanceSheet" ? "bg-emerald-600 hover:bg-emerald-700 gap-2" : "gap-2"}
          >
            <Building2 className="h-4 w-4" />
            {t("الميزانية العمومية (المركز المالي)", "Balance Sheet")}
          </Button>

          <Button
            variant={reportType === "incomeStatement" ? "default" : "outline"}
            onClick={() => setReportType("incomeStatement")}
            className={reportType === "incomeStatement" ? "bg-emerald-600 hover:bg-emerald-700 gap-2" : "gap-2"}
          >
            <TrendingUp className="h-4 w-4" />
            {t("قائمة الدخل والأرباح", "Income Statement")}
          </Button>

          <Button
            variant={reportType === "transactions" ? "default" : "outline"}
            onClick={() => setReportType("transactions")}
            className={reportType === "transactions" ? "bg-emerald-600 hover:bg-emerald-700 gap-2" : "gap-2"}
          >
            <Activity className="h-4 w-4" />
            {t("العمليات (حركات)", "Transactions")}
          </Button>

          <Button
            variant={reportType === "vouchers" ? "default" : "outline"}
            onClick={() => setReportType("vouchers")}
            className={reportType === "vouchers" ? "bg-emerald-600 hover:bg-emerald-700 gap-2" : "gap-2"}
          >
            <Receipt className="h-4 w-4" />
            {t("تقرير السندات", "Vouchers Report")}
          </Button>
        </div>

        {/* Printable Official Header */}
        <Card className="border shadow-sm print:border-none print:shadow-none bg-card">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-center sm:text-start">
              <div>
                <h2 className="text-lg font-bold text-emerald-700">{company?.name || "شركة كاف برو"}</h2>
                <p className="text-xs text-muted-foreground">{company?.slogan || "نظام كاف برو المحاسبي الذكي"}</p>
                {company?.taxNumber && (
                  <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">
                    VAT ID: {company.taxNumber}
                  </p>
                )}
              </div>

              <div className="text-center sm:text-end text-xs text-muted-foreground space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {t("تاريخ التقرير: ", "Report Date: ")}
                    {new Date().toISOString().slice(0, 10)}
                  </span>
                </div>
                <p>{company?.city || "المملكة العربية السعودية"}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-6">
            {/* ── 1. TRIAL BALANCE ── */}
            {reportType === "trialBalance" && trialBalance && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Scale className="h-5 w-5 text-emerald-600" />
                    {t("ميزان المراجعة بالأرصدة والمجاميع", "Trial Balance (Totals & Balances)")}
                  </h3>
                  {trialBalance.isBalanced ? (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {t("الميزان متوازن محاسبياً ✅", "Balanced ✅")}
                    </span>
                  ) : null}
                </div>

                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-sm text-start border-collapse">
                    <thead>
                      <tr className="bg-muted/60 border-b text-xs text-muted-foreground">
                        <th className="p-3 text-start">{t("كود", "Code")}</th>
                        <th className="p-3 text-start">{t("اسم الحساب", "Account Name")}</th>
                        <th className="p-3 text-start">{t("النوع", "Type")}</th>
                        <th className="p-3 text-end">{t("مجموع المدين", "Debit Total")}</th>
                        <th className="p-3 text-end">{t("مجموع الدائن", "Credit Total")}</th>
                        <th className="p-3 text-end bg-emerald-50/50">{t("رصيد مدين", "Debit Bal.")}</th>
                        <th className="p-3 text-end bg-emerald-50/50">{t("رصيد دائن", "Credit Bal.")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-xs sm:text-sm">
                      {trialBalance.rows.map((row: any) => (
                        <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono font-bold text-muted-foreground">{row.code}</td>
                          <td className="p-3 font-medium">{row.name}</td>
                          <td className="p-3 text-muted-foreground text-xs">{row.type}</td>
                          <td className="p-3 text-end tabular-nums" dir="ltr">{formatMoney(row.debitTotal)}</td>
                          <td className="p-3 text-end tabular-nums" dir="ltr">{formatMoney(row.creditTotal)}</td>
                          <td className="p-3 text-end tabular-nums font-semibold bg-emerald-50/30 text-emerald-700" dir="ltr">
                            {row.balanceDebit > 0 ? formatMoney(row.balanceDebit) : "-"}
                          </td>
                          <td className="p-3 text-end tabular-nums font-semibold bg-emerald-50/30 text-sky-700" dir="ltr">
                            {row.balanceCredit > 0 ? formatMoney(row.balanceCredit) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/80 font-bold border-t-2 border-emerald-600 text-xs sm:text-sm">
                        <td colSpan={3} className="p-3 text-start">{t("الإجمالي العام للميزان", "Total Summary")}</td>
                        <td className="p-3 text-end tabular-nums" dir="ltr">{formatMoney(trialBalance.sumDebitTotal)}</td>
                        <td className="p-3 text-end tabular-nums" dir="ltr">{formatMoney(trialBalance.sumCreditTotal)}</td>
                        <td className="p-3 text-end tabular-nums text-emerald-700 bg-emerald-100/50" dir="ltr">
                          {formatMoney(trialBalance.sumBalanceDebit)}
                        </td>
                        <td className="p-3 text-end tabular-nums text-sky-700 bg-emerald-100/50" dir="ltr">
                          {formatMoney(trialBalance.sumBalanceCredit)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* ── 2. BALANCE SHEET ── */}
            {reportType === "balanceSheet" && balanceSheet && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                    {t("الميزانية العمومية (قائمة المركز المالي)", "Balance Sheet (Financial Position)")}
                  </h3>
                  {balanceSheet.isBalanced && (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {t("معادلة الميزانية متوازنة ✅", "Assets = Liabilities + Equity ✅")}
                    </span>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Assets Column */}
                  <div className="border rounded-xl p-4 bg-card space-y-4">
                    <div className="border-b pb-2 flex justify-between items-center">
                      <h4 className="font-bold text-emerald-700 text-sm flex items-center gap-2">
                        <span>🏛️</span> {t("الأصول (Assets)", "Assets")}
                      </h4>
                      <span className="text-xs font-bold text-emerald-600" dir="ltr">
                        {formatMoney(balanceSheet.totalAssets)}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs sm:text-sm">
                      <p className="font-semibold text-xs text-muted-foreground">{t("الأصول المتداولة والسيولة:", "Current Assets:")}</p>
                      {balanceSheet.assetAccounts.map((acc: any, i: number) => (
                        <div key={i} className="flex justify-between py-1 border-b border-dashed">
                          <span>{acc.name}</span>
                          <span className="font-mono font-medium" dir="ltr">{formatMoney(acc.balance)}</span>
                        </div>
                      ))}
                      {balanceSheet.customerDebts > 0 && (
                        <div className="flex justify-between py-1 border-b border-dashed text-emerald-600">
                          <span>{t("مدينون / ذمم العملاء المستحقة", "Accounts Receivable (Customers)")}</span>
                          <span className="font-mono font-bold" dir="ltr">{formatMoney(balanceSheet.customerDebts)}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t flex justify-between font-bold text-emerald-700">
                      <span>{t("مجموع الأصول:", "Total Assets:")}</span>
                      <span className="font-mono" dir="ltr">{formatMoney(balanceSheet.totalAssets)}</span>
                    </div>
                  </div>

                  {/* Liabilities & Equity Column */}
                  <div className="border rounded-xl p-4 bg-card space-y-4">
                    <div className="border-b pb-2 flex justify-between items-center">
                      <h4 className="font-bold text-sky-700 text-sm flex items-center gap-2">
                        <span>⚖️</span> {t("الخصوم وحقوق الملكية", "Liabilities & Equity")}
                      </h4>
                      <span className="text-xs font-bold text-sky-600" dir="ltr">
                        {formatMoney(balanceSheet.totalLiabilitiesAndEquity)}
                      </span>
                    </div>

                    <div className="space-y-3 text-xs sm:text-sm">
                      {/* Liabilities */}
                      <div className="space-y-1.5">
                        <p className="font-semibold text-xs text-muted-foreground">{t("الخصوم والالتزامات:", "Liabilities:")}</p>
                        {balanceSheet.liabilityAccounts.map((l: any, i: number) => (
                          <div key={i} className="flex justify-between py-1 border-b border-dashed">
                            <span>{l.name}</span>
                            <span className="font-mono" dir="ltr">{formatMoney(l.balance)}</span>
                          </div>
                        ))}
                        {balanceSheet.supplierDebts > 0 && (
                          <div className="flex justify-between py-1 border-b border-dashed text-rose-600">
                            <span>{t("دائنون / مستحقات الموردين", "Accounts Payable (Suppliers)")}</span>
                            <span className="font-mono font-bold" dir="ltr">{formatMoney(balanceSheet.supplierDebts)}</span>
                          </div>
                        )}
                      </div>

                      {/* Equity */}
                      <div className="space-y-1.5 pt-2 border-t">
                        <p className="font-semibold text-xs text-muted-foreground">{t("حقوق الملكية ورأس المال:", "Owner Equity:")}</p>
                        <div className="flex justify-between py-1 border-b border-dashed">
                          <span>{t("رأس المال الأولي", "Initial Capital")}</span>
                          <span className="font-mono" dir="ltr">{formatMoney(balanceSheet.capital)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-dashed text-emerald-600 font-medium">
                          <span>{t("صافي أرباح الفترة المتراكمة", "Retained Earnings / Net Profit")}</span>
                          <span className="font-mono" dir="ltr">{formatMoney(balanceSheet.retainedEarnings)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t flex justify-between font-bold text-sky-700">
                      <span>{t("مجموع الخصوم والملكية:", "Total Liabilities & Equity:")}</span>
                      <span className="font-mono" dir="ltr">{formatMoney(balanceSheet.totalLiabilitiesAndEquity)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── 3. INCOME STATEMENT ── */}
            {reportType === "incomeStatement" && incomeStatement && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    {t("قائمة الدخل (بيان الأرباح والخسائر)", "Income Statement (Profit & Loss)")}
                  </h3>
                  <div className="text-xs font-semibold px-3 py-1 bg-muted rounded-full">
                    {t("هامش الربح: ", "Profit Margin: ")}{incomeStatement.profitMargin.toFixed(1)}%
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Revenues */}
                  <div className="border border-emerald-100 rounded-xl p-4 bg-card space-y-3">
                    <div className="border-b pb-2 flex justify-between font-bold text-emerald-700">
                      <span>{t("الإيرادات والمبيعات (Revenues)", "Revenues")}</span>
                      <span dir="ltr">{formatMoney(incomeStatement.totalRevenues)}</span>
                    </div>

                    <div className="space-y-2 text-xs sm:text-sm max-h-60 overflow-y-auto">
                      {incomeStatement.revenues.map((r: any, i: number) => (
                        <div key={i} className="flex justify-between py-1 border-b border-dashed">
                          <div>
                            <span className="font-medium">{r.description}</span>
                            <span className="block text-[11px] text-muted-foreground">{r.date}</span>
                          </div>
                          <span className="font-mono font-semibold text-emerald-600" dir="ltr">
                            {formatMoney(r.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expenses */}
                  <div className="border border-rose-100 rounded-xl p-4 bg-card space-y-3">
                    <div className="border-b pb-2 flex justify-between font-bold text-rose-700">
                      <span>{t("المصروفات والتكاليف (Expenses)", "Expenses")}</span>
                      <span dir="ltr">{formatMoney(incomeStatement.totalExpenses)}</span>
                    </div>

                    <div className="space-y-2 text-xs sm:text-sm max-h-60 overflow-y-auto">
                      {incomeStatement.expensesByCategory.map((exp: any, i: number) => (
                        <div key={i} className="flex justify-between py-1 border-b border-dashed">
                          <span className="font-medium">{exp.category}</span>
                          <span className="font-mono font-semibold text-rose-600" dir="ltr">
                            {formatMoney(exp.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Net Income Summary Card */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-lg text-emerald-800">
                      {incomeStatement.netProfit >= 0
                        ? t("صافي الربح المحقق (Net Profit) 🎉", "Net Profit 🎉")
                        : t("صافي الخسارة (Net Loss)", "Net Loss")}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("إجمالي الإيرادات مخصوماً منها كافة التكاليف والمصروفات التشغيلية", "Total revenues minus operational expenses")}
                    </p>
                  </div>

                  <div className="text-2xl font-black font-mono text-emerald-700" dir="ltr">
                    {formatMoney(incomeStatement.netProfit)}
                  </div>
                </div>
              </div>
            )}

            {/* ── 4. TRANSACTIONS REPORT ── */}
            {reportType === "transactions" && transactions && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-600" />
                    {t("تقرير العمليات والحركات", "Transactions Report")}
                  </h3>
                </div>

                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-sm text-start border-collapse">
                    <thead>
                      <tr className="bg-muted/60 border-b text-xs text-muted-foreground">
                        <th className="p-3 text-start">{t("التاريخ", "Date")}</th>
                        <th className="p-3 text-start">{t("الوصف", "Description")}</th>
                        <th className="p-3 text-start">{t("التصنيف", "Category")}</th>
                        <th className="p-3 text-start">{t("النوع", "Type")}</th>
                        <th className="p-3 text-end">{t("المبلغ", "Amount")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-xs sm:text-sm">
                      {transactions.map((tx: any) => (
                        <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 whitespace-nowrap">{tx.date}</td>
                          <td className="p-3">{tx.description || "-"}</td>
                          <td className="p-3">{tx.category || "-"}</td>
                          <td className="p-3">
                            <span className={tx.kind === "income" ? "text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-semibold" : "text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full text-xs font-semibold"}>
                              {tx.kind === "income" ? t("إيراد", "Income") : t("مصروف", "Expense")}
                            </span>
                          </td>
                          <td className="p-3 text-end tabular-nums font-bold" dir="ltr">{formatMoney(tx.amount)}</td>
                        </tr>
                      ))}
                      {transactions.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-muted-foreground">
                            {t("لا توجد عمليات", "No transactions found.")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── 5. VOUCHERS REPORT ── */}
            {reportType === "vouchers" && vouchers && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-emerald-600" />
                    {t("تقرير سندات القبض والصرف", "Vouchers Report")}
                  </h3>
                </div>

                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-sm text-start border-collapse">
                    <thead>
                      <tr className="bg-muted/60 border-b text-xs text-muted-foreground">
                        <th className="p-3 text-start">{t("رقم السند", "Voucher ID")}</th>
                        <th className="p-3 text-start">{t("التاريخ", "Date")}</th>
                        <th className="p-3 text-start">{t("النوع", "Type")}</th>
                        <th className="p-3 text-start">{t("البيان", "Description")}</th>
                        <th className="p-3 text-end">{t("المبلغ", "Amount")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-xs sm:text-sm">
                      {vouchers.map((v: any) => (
                        <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono text-muted-foreground">{v.voucherNumber}</td>
                          <td className="p-3 whitespace-nowrap">{v.date}</td>
                          <td className="p-3">
                            <span className={v.type === "receipt" ? "text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-semibold" : "text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full text-xs font-semibold"}>
                              {v.type === "receipt" ? t("قبض", "Receipt") : t("صرف", "Payment")}
                            </span>
                          </td>
                          <td className="p-3">{v.description || "-"}</td>
                          <td className="p-3 text-end tabular-nums font-bold" dir="ltr">{formatMoney(v.amount)}</td>
                        </tr>
                      ))}
                      {vouchers.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-muted-foreground">
                            {t("لا توجد سندات", "No vouchers found.")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
