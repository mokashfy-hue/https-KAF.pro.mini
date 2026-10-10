import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { AccountCombobox } from "@/components/finance/AccountCombobox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney, todayISO } from "@/lib/finance";
import { numberToArabicWords } from "@/lib/tafqeet";
import { cn } from "@/lib/utils";
import {
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Printer,
  Trash2,
  Search,
  Building2,
  Calendar,
  Wallet,
  CreditCard,
  CheckCircle2,
  Filter,
  FileText,
  BadgeDollarSign,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import type { LocalVoucher, LocalContact } from "@/lib/localStore";

export default function VouchersPage() {
  const { isRtl, t } = useLanguage();
  const utils = trpc.useUtils();

  // Queries
  const { data: vouchers = [], isLoading: vouchersLoading } = (trpc as any).vouchers.list.useQuery();
  const { data: contacts = [] } = (trpc as any).contacts.list.useQuery();
  const { data: accounts = [] } = trpc.finance.accounts.list.useQuery();
  const { data: company } = (trpc as any).company.get.useQuery();

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "receipt" | "payment">("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");

  // Modal dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState<LocalVoucher | null>(null);
  const [voucherToDelete, setVoucherToDelete] = useState<LocalVoucher | null>(null);

  // Form states for creating a voucher
  const [voucherType, setVoucherType] = useState<"receipt" | "payment">("receipt");
  const [voucherDate, setVoucherDate] = useState(todayISO());
  const [selectedContactId, setSelectedContactId] = useState<string>("none");
  const [customContactName, setCustomContactName] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer" | "cheque" | "card">("cash");
  const [amount, setAmount] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [description, setDescription] = useState("");
  const [receivedBy, setReceivedBy] = useState("مكاشفي");

  // Mutations
  const createMutation = (trpc as any).vouchers.create.useMutation({
    onSuccess: (newVoucher: LocalVoucher) => {
      toast.success(
        voucherType === "receipt"
          ? t("تم إصدار سند القبض بنجاح وتحديث الحسابات", "Receipt voucher issued successfully")
          : t("تم إصدار سند الصرف بنجاح وتحديث الحسابات", "Payment voucher issued successfully")
      );
      (utils as any).vouchers.list.invalidate();
      (utils as any).contacts.list.invalidate();
      utils.finance.accounts.list.invalidate();
      utils.finance.transactions.list.invalidate();
      utils.finance.dashboard.invalidate();
      setCreateDialogOpen(false);
      resetForm();

      // Offer immediate print preview
      if (newVoucher) {
        setSelectedVoucherForPrint(newVoucher);
      }
    },
    onError: (err: any) => {
      toast.error(err.message || t("حدث خطأ أثناء إصدار السند", "Error creating voucher"));
    },
  });

  const deleteMutation = (trpc as any).vouchers.delete.useMutation({
    onSuccess: () => {
      toast.success(t("تم حذف السند", "Voucher deleted successfully"));
      (utils as any).vouchers.list.invalidate();
      setVoucherToDelete(null);
    },
    onError: (err: any) => {
      toast.error(err.message || t("حدث خطأ أثناء حذف السند", "Error deleting voucher"));
    },
  });

  const resetForm = () => {
    setVoucherType("receipt");
    setVoucherDate(todayISO());
    setSelectedContactId("none");
    setCustomContactName("");
    setAmount("");
    setReferenceNo("");
    setDescription("");
  };

  const openCreateDialog = (type: "receipt" | "payment") => {
    resetForm();
    setVoucherType(type);
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(String(accounts[0].id));
    }
    setCreateDialogOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      toast.error(t("يرجى إدخال مبلغ صحيح أكبر من الصفر", "Please enter a valid amount"));
      return;
    }

    const accId = selectedAccountId ? parseInt(selectedAccountId) : accounts[0]?.id;
    if (!accId) {
      toast.error(t("يرجى اختيار الحساب المالي", "Please select an account"));
      return;
    }

    let finalContactName = "";
    let finalContactId: number | null = null;
    if (selectedContactId !== "none" && selectedContactId !== "custom") {
      const found = contacts.find((c: LocalContact) => String(c.id) === selectedContactId);
      if (found) {
        finalContactId = found.id;
        finalContactName = found.name;
      }
    } else if (customContactName.trim()) {
      finalContactName = customContactName.trim();
    }

    createMutation.mutate({
      type: voucherType,
      date: voucherDate,
      amount: numAmount.toFixed(2),
      accountId: accId,
      contactId: finalContactId,
      contactName: finalContactName,
      paymentMethod,
      referenceNo: referenceNo.trim(),
      description: description.trim() || (voucherType === "receipt" ? "سند قبض نقدي/بنكي" : "سند صرف نفقات"),
      receivedBy: receivedBy.trim() || "مكاشفي",
    });
  };

  // Filtered vouchers
  const filteredVouchers = useMemo(() => {
    return (vouchers as LocalVoucher[]).filter((v) => {
      if (typeFilter !== "all" && v.type !== typeFilter) return false;
      if (methodFilter !== "all" && v.paymentMethod !== methodFilter) return false;
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const numMatch = v.number.toLowerCase().includes(query);
        const contactMatch = (v.contactName || "").toLowerCase().includes(query);
        const descMatch = (v.description || "").toLowerCase().includes(query);
        const refMatch = (v.referenceNo || "").toLowerCase().includes(query);
        if (!numMatch && !contactMatch && !descMatch && !refMatch) return false;
      }
      return true;
    });
  }, [vouchers, typeFilter, methodFilter, search]);

  // Summary statistics
  const stats = useMemo(() => {
    const list = (vouchers as LocalVoucher[]) || [];
    let totalReceipts = 0;
    let totalPayments = 0;
    let receiptCount = 0;
    let paymentCount = 0;

    for (const v of list) {
      const amt = parseFloat(v.amount) || 0;
      if (v.type === "receipt") {
        totalReceipts += amt;
        receiptCount++;
      } else {
        totalPayments += amt;
        paymentCount++;
      }
    }

    return {
      totalReceipts,
      totalPayments,
      netFlow: totalReceipts - totalPayments,
      totalCount: list.length,
      receiptCount,
      paymentCount,
    };
  }, [vouchers]);

  const getAccountName = (accId: number) => {
    return accounts.find((a) => a.id === accId)?.name ?? `حساب رقم ${accId}`;
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash":
        return t("نقداً (كاش)", "Cash");
      case "transfer":
        return t("تحويل بنكي", "Bank Transfer");
      case "cheque":
        return t("شيك بنكي", "Cheque");
      case "card":
        return t("بطاقة مدى / ائتمان", "Card");
      default:
        return method;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Title & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Receipt className="h-7 w-7 text-emerald-600" />
              {t("سندات القبض والصرف", "Receipt & Payment Vouchers")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t(
                "إصدار ومتابعة سندات القبض المالي وسندات الصرف مع الطباعة الرسمية المعتمدة والتأثير المباشر على الحسابات",
                "Issue and manage official receipt & payment vouchers with printable slips and real-time ledger sync"
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => openCreateDialog("receipt")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-10 shadow-sm shadow-emerald-600/30"
            >
              <ArrowDownLeft className="h-4 w-4" />
              {t("+ سند قبض جديد", "+ New Receipt Voucher")}
            </Button>
            <Button
              onClick={() => openCreateDialog("payment")}
              className="bg-rose-600 hover:bg-rose-700 text-white gap-2 h-10 shadow-sm shadow-rose-600/30"
            >
              <ArrowUpRight className="h-4 w-4" />
              {t("+ سند صرف جديد", "+ New Payment Voucher")}
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border shadow-xs border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-1">
                <span>{t("إجمالي المقبوضات", "Total Receipts")}</span>
                <span className="p-1 rounded-full bg-emerald-500/10 text-emerald-600">
                  <ArrowDownLeft className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-600">
                {formatMoney(stats.totalReceipts)} <span className="text-xs font-normal">ر.س</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {stats.receiptCount} {t("سند قبض", "receipt vouchers")}
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-xs border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-1">
                <span>{t("إجمالي المدفوعات", "Total Payments")}</span>
                <span className="p-1 rounded-full bg-rose-500/10 text-rose-600">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-rose-600">
                {formatMoney(stats.totalPayments)} <span className="text-xs font-normal">ر.س</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {stats.paymentCount} {t("سند صرف", "payment vouchers")}
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-1">
                <span>{t("صافي حركة السندات", "Net Voucher Flow")}</span>
                <span className="p-1 rounded-full bg-blue-500/10 text-blue-600">
                  <BadgeDollarSign className="h-3.5 w-3.5" />
                </span>
              </div>
              <div
                className={cn(
                  "text-xl sm:text-2xl font-bold",
                  stats.netFlow >= 0 ? "text-emerald-600" : "text-rose-600"
                )}
              >
                {formatMoney(stats.netFlow)} <span className="text-xs font-normal">ر.س</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {stats.netFlow >= 0 ? t("فائض نقدية مستلمة", "Net positive cash flow") : t("عجز نقدية مسددة", "Net disbursement")}
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-1">
                <span>{t("إجمالي السندات", "Total Vouchers")}</span>
                <span className="p-1 rounded-full bg-amber-500/10 text-amber-600">
                  <FileText className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-foreground">
                {stats.totalCount} <span className="text-xs font-normal">{t("سند", "vouchers")}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {t("سندات مسجلة بالنظام", "Registered in ledger")}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search Toolbar */}
        <Card className="border shadow-xs">
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className={cn("absolute top-3 h-4 w-4 text-muted-foreground", isRtl ? "right-3" : "left-3")} />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t(
                    "بحث برقم السند (RV-001)، اسم المستفيد، البيان، رقم المرجع...",
                    "Search by voucher #, beneficiary, note, reference..."
                  )}
                  className={cn(isRtl ? "pr-9" : "pl-9")}
                />
              </div>

              {/* Type Filter Buttons */}
              <div className="flex gap-1.5 bg-muted/50 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTypeFilter("all")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                    typeFilter === "all" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t("الكل", "All")} ({stats.totalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter("receipt")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1",
                    typeFilter === "receipt" ? "bg-emerald-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ArrowDownLeft className="h-3 w-3" />
                  {t("سندات قبض", "Receipts")} ({stats.receiptCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter("payment")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1",
                    typeFilter === "payment" ? "bg-rose-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ArrowUpRight className="h-3 w-3" />
                  {t("سندات صرف", "Payments")} ({stats.paymentCount})
                </button>
              </div>

              {/* Payment Method Filter */}
              <div className="w-full md:w-48">
                <Select value={methodFilter} onValueChange={setMethodFilter}>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue placeholder={t("طريقة الدفع", "Payment Method")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("جميع طرق الدفع", "All Payment Methods")}</SelectItem>
                    <SelectItem value="cash">{t("نقدي (كاش)", "Cash")}</SelectItem>
                    <SelectItem value="transfer">{t("تحويل بنكي", "Bank Transfer")}</SelectItem>
                    <SelectItem value="cheque">{t("شيك بنكي", "Cheque")}</SelectItem>
                    <SelectItem value="card">{t("بطاقة", "Card")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vouchers Table & Listing */}
        <Card className="border shadow-xs overflow-hidden">
          <CardHeader className="p-4 bg-muted/20 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-emerald-600" />
              {t("قائمة السندات المصدرة", "Issued Vouchers List")}
              <span className="text-xs font-normal text-muted-foreground">({filteredVouchers.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {vouchersLoading ? (
              <div className="p-8 text-center text-muted-foreground">{t("جاري التحميل...", "Loading...")}</div>
            ) : filteredVouchers.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Receipt className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                <h3 className="font-semibold text-lg">{t("لا توجد سندات مطابقة", "No vouchers found")}</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  {t(
                    "لم يتم العثور على أي سندات ضمن معايير البحث المحددة. يمكنك إصدار سند قبض أو سند صرف جديد الآن.",
                    "No vouchers match your filter. You can issue a new receipt or payment voucher now."
                  )}
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <Button onClick={() => openCreateDialog("receipt")} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                    <ArrowDownLeft className="h-3.5 w-3.5 mr-1" /> {t("سند قبض", "Receipt Voucher")}
                  </Button>
                  <Button onClick={() => openCreateDialog("payment")} size="sm" className="bg-rose-600 hover:bg-rose-700">
                    <ArrowUpRight className="h-3.5 w-3.5 mr-1" /> {t("سند صرف", "Payment Voucher")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground border-b uppercase">
                    <tr>
                      <th className="py-3 px-4">{t("رقم السند والنوع", "Voucher # & Type")}</th>
                      <th className="py-3 px-4">{t("التاريخ", "Date")}</th>
                      <th className="py-3 px-4">{t("المستفيد / الدافع", "Beneficiary / Payer")}</th>
                      <th className="py-3 px-4">{t("الحساب المالي", "Account")}</th>
                      <th className="py-3 px-4">{t("طريقة الدفع", "Payment Method")}</th>
                      <th className="py-3 px-4">{t("البيان", "Description")}</th>
                      <th className="py-3 px-4 text-left">{t("المبلغ", "Amount")}</th>
                      <th className="py-3 px-4 text-center">{t("إجراءات", "Actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredVouchers.map((v) => {
                      const isReceipt = v.type === "receipt";
                      return (
                        <tr key={v.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1",
                                  isReceipt
                                    ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-700 border border-rose-500/20"
                                )}
                              >
                                {isReceipt ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                                {isReceipt ? t("قبض", "Receipt") : t("صرف", "Payment")}
                              </span>
                              <span className="font-mono font-bold text-foreground">{v.number}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap text-xs">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {v.date}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-medium">
                            <div className="flex items-center gap-1.5">
                              <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{v.contactName || t("طرف غير محدد", "General")}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Wallet className="h-3 w-3 text-muted-foreground" />
                              <span>{getAccountName(v.accountId)}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                            <Badge variant="outline" className="font-normal text-xs py-0.5">
                              {getPaymentMethodLabel(v.paymentMethod)}
                              {v.referenceNo ? ` (${v.referenceNo})` : ""}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-muted-foreground max-w-xs truncate" title={v.description}>
                            {v.description}
                          </td>
                          <td className="py-3.5 px-4 text-left whitespace-nowrap font-mono font-bold">
                            <span
                              className={cn(
                                "text-base",
                                isReceipt ? "text-emerald-600" : "text-rose-600"
                              )}
                            >
                              {isReceipt ? "+" : "-"}
                              {formatMoney(v.amount)}{" "}
                              <span className="text-xs font-normal text-muted-foreground">ر.س</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedVoucherForPrint(v)}
                                className="h-8 gap-1.5 px-2.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200"
                                title={t("معاينة وطباعة السند", "Preview & Print Voucher")}
                              >
                                <Printer className="h-3.5 w-3.5" />
                                <span className="text-xs">{t("طباعة", "Print")}</span>
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setVoucherToDelete(v)}
                                className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                title={t("حذف السند", "Delete Voucher")}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Dialog: Create Voucher ── */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" dir={isRtl ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              {voucherType === "receipt" ? (
                <>
                  <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <ArrowDownLeft className="h-4 w-4" />
                  </div>
                  <span>{t("إصدار سند قبض مالي جديد", "Issue New Receipt Voucher")}</span>
                </>
              ) : (
                <>
                  <div className="h-8 w-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                  <span>{t("إصدار سند صرف مالي جديد", "Issue New Payment Voucher")}</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            {/* Voucher Type Selector Toggle */}
            <div className="flex rounded-xl bg-muted p-1">
              <button
                type="button"
                onClick={() => setVoucherType("receipt")}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2",
                  voucherType === "receipt" ? "bg-emerald-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ArrowDownLeft className="h-4 w-4" />
                {t("سند قبض (استلام نقدية / إيداع)", "Receipt (Income / Deposit)")}
              </button>
              <button
                type="button"
                onClick={() => setVoucherType("payment")}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2",
                  voucherType === "payment" ? "bg-rose-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ArrowUpRight className="h-4 w-4" />
                {t("سند صرف (سداد / نفقات)", "Payment (Expense / Payout)")}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date */}
              <div className="space-y-1.5">
                <Label>{t("تاريخ السند", "Voucher Date")} *</Label>
                <Input
                  type="date"
                  value={voucherDate}
                  onChange={(e) => setVoucherDate(e.target.value)}
                  required
                />
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <Label>{t("المبلغ (ر.س)", "Amount (SAR)")} *</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="font-bold text-lg"
                  />
                  <span className={cn("absolute top-2.5 text-xs text-muted-foreground font-semibold", isRtl ? "left-3" : "right-3")}>
                    SAR
                  </span>
                </div>
                {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
                  <p className="text-[11px] text-emerald-600 font-medium">
                    {numberToArabicWords(amount)}
                  </p>
                )}
              </div>
            </div>

            {/* Contact / Beneficiary */}
            <div className="space-y-1.5">
              <Label>
                {voucherType === "receipt"
                  ? t("المستلم منه (العميل أو الدافع)", "Received From (Customer/Payer)")
                  : t("المصروف له (المورد أو المستفيد)", "Paid To (Supplier/Beneficiary)")}
              </Label>
              <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("اختر من العملاء والموردين...", "Select contact...")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("بدون ربط بجهة اتصال (طرف عام)", "No linked contact")}</SelectItem>
                  <SelectItem value="custom">{t("كتابة اسم مخصص...", "Enter custom name...")}</SelectItem>
                  {contacts.map((c: LocalContact) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} ({c.type === "customer" ? t("عميل", "Customer") : t("مورد", "Supplier")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedContactId === "custom" && (
                <Input
                  value={customContactName}
                  onChange={(e) => setCustomContactName(e.target.value)}
                  placeholder={
                    voucherType === "receipt"
                      ? t("اسم الشخص أو الجهة المستلم منها", "Payer Name")
                      : t("اسم الشخص أو الجهة المصروف لها", "Beneficiary Name")
                  }
                  className="mt-2"
                  required
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Account */}
              <div className="space-y-1.5">
                <Label>
                  {voucherType === "receipt"
                    ? t("الحساب المودع به (الصندوق/البنك)", "Deposit To Account")
                    : t("الحساب المسحوب منه (الصندوق/البنك)", "Withdraw From Account")} *
                </Label>
                <AccountCombobox
                  accounts={accounts}
                  value={selectedAccountId ? Number(selectedAccountId) : null}
                  onChange={(v) => setSelectedAccountId(String(v))}
                  placeholder={t("اختر الحساب المالي", "Select Account")}
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5">
                <Label>{t("طريقة الدفع", "Payment Method")} *</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(v: any) => setPaymentMethod(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{t("نقدي (كاش الصندوق)", "Cash")}</SelectItem>
                    <SelectItem value="transfer">{t("تحويل بنكي", "Bank Transfer")}</SelectItem>
                    <SelectItem value="cheque">{t("شيك بنكي", "Cheque")}</SelectItem>
                    <SelectItem value="card">{t("بطاقة مدى / ائتمان", "Card")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Reference No */}
              <div className="space-y-1.5">
                <Label>{t("رقم المرجع / الشيك / الحوالة", "Reference / Cheque #")}</Label>
                <Input
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="مثال: CHQ-55421 أو TR-998811"
                />
              </div>

              {/* Received By / Prepared By */}
              <div className="space-y-1.5">
                <Label>{t("اسم المحرر / المستلم", "Issued / Received By")}</Label>
                <Input
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  placeholder="مكاشفي"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>{t("البيان والسبب بالتفصيل", "Description & Notes")} *</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  voucherType === "receipt"
                    ? t("مثال: استلام دفعة عهدة مشروع، سداد فاتورة رقم...", "e.g. Project custody payment, invoice #...")
                    : t("مثال: سداد مستحقات توريد، صيانة أجهزة مكتبية...", "e.g. Supplier payment, office equipment maintenance...")
                }
                rows={3}
                required
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                {t("إلغاء", "Cancel")}
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className={cn(
                  "gap-2",
                  voucherType === "receipt"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-rose-600 hover:bg-rose-700 text-white"
                )}
              >
                <CheckCircle2 className="h-4 w-4" />
                {createMutation.isPending
                  ? t("جاري الإصدار...", "Issuing...")
                  : voucherType === "receipt"
                  ? t("إصدار سند القبض وحفظه", "Issue Receipt Voucher")
                  : t("إصدار سند الصرف وحفظه", "Issue Payment Voucher")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Official Printable Voucher Slip ── */}
      <Dialog
        open={Boolean(selectedVoucherForPrint)}
        onOpenChange={(open) => !open && setSelectedVoucherForPrint(null)}
      >
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-4 sm:p-6" dir="rtl">
          <div className="flex items-center justify-between border-b pb-3 print:hidden">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Printer className="h-5 w-5 text-emerald-600" />
              <span>
                {selectedVoucherForPrint?.type === "receipt"
                  ? t("معاينة سند القبض المالي الرسمي", "Official Receipt Voucher Slip")
                  : t("معاينة سند الصرف المالي الرسمي", "Official Payment Voucher Slip")}
              </span>
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                onClick={() => window.print()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm"
              >
                <Printer className="h-4 w-4" />
                {t("طباعة السند 🖨️", "Print Voucher 🖨️")}
              </Button>
            </div>
          </div>

          {selectedVoucherForPrint && (
            <div
              id="printable-voucher-document"
              className="bg-white text-slate-900 p-6 sm:p-8 rounded-xl border-2 border-slate-300 shadow-sm space-y-6 my-2 text-right relative font-sans"
            >
              {/* Header with Company Logo & Info */}
              <div className="flex items-start justify-between border-b-2 border-slate-800 pb-5">
                <div className="space-y-1 text-right">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-emerald-700 text-white font-bold flex items-center justify-center text-xl shadow-xs">
                      ك
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 leading-tight">
                        {company?.name || "شركة كاف برو للحلول الإدارية والمالية"}
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        {company?.nameEn || "KAF PRO ERP & Financial Solutions Co."}
                      </p>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-0.5 pt-1">
                    <p>السجل التجاري: <span className="font-mono font-semibold">{company?.crNumber || "1010789456"}</span> | الرقم الضريبي: <span className="font-mono font-semibold">{company?.taxNumber || "310456789000003"}</span></p>
                    <p>{company?.address || "طريق الملك فهد، حي الصحافة"} - {company?.city || "الرياض، المملكة العربية السعودية"}</p>
                    <p>هاتف: <span className="font-mono">{company?.phone || "+966 50 123 4567"}</span> | بريد: {company?.email || "finance@kaf-pro.com"}</p>
                  </div>
                </div>

                <div className="text-left space-y-1.5 shrink-0">
                  <div
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-sm font-extrabold uppercase border-2 text-center",
                      selectedVoucherForPrint.type === "receipt"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-600"
                        : "bg-rose-50 text-rose-800 border-rose-600"
                    )}
                  >
                    {selectedVoucherForPrint.type === "receipt" ? "سند قبض مالي" : "سند صرف مالي"}
                    <div className="text-[10px] font-normal tracking-wider">
                      {selectedVoucherForPrint.type === "receipt" ? "RECEIPT VOUCHER" : "PAYMENT VOUCHER"}
                    </div>
                  </div>
                  <div className="border border-slate-300 rounded p-2 text-center bg-slate-50 text-xs font-mono space-y-0.5">
                    <div>رقم السند: <strong className="text-sm font-bold text-slate-900">{selectedVoucherForPrint.number}</strong></div>
                    <div>التاريخ: <strong>{selectedVoucherForPrint.date}</strong></div>
                  </div>
                </div>
              </div>

              {/* Amount Highlight Box */}
              <div
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border-2",
                  selectedVoucherForPrint.type === "receipt"
                    ? "bg-emerald-50/60 border-emerald-300"
                    : "bg-rose-50/60 border-rose-300"
                )}
              >
                <div>
                  <span className="text-xs font-semibold text-slate-600 block mb-0.5">المبلغ الإجمالي المستحق:</span>
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">
                    {formatMoney(selectedVoucherForPrint.amount)}{" "}
                    <span className="text-sm font-bold text-slate-700">ريال سعودي (SAR)</span>
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-xs text-slate-500 block">طريقة السداد:</span>
                  <span className="text-sm font-bold text-slate-800">
                    {getPaymentMethodLabel(selectedVoucherForPrint.paymentMethod)}
                  </span>
                </div>
              </div>

              {/* Voucher Content Table */}
              <div className="border-2 border-slate-300 rounded-xl overflow-hidden text-sm">
                <div className="grid grid-cols-1 divide-y divide-slate-200">
                  {/* Party */}
                  <div className="grid grid-cols-4 p-3 bg-slate-50/50">
                    <span className="font-bold text-slate-700 col-span-1">
                      {selectedVoucherForPrint.type === "receipt" ? "استلمنا من المكرم:" : "يُصرف إلى المكرم:"}
                    </span>
                    <span className="col-span-3 font-semibold text-slate-900">
                      {selectedVoucherForPrint.contactName || "طرف خارجي عام"}
                    </span>
                  </div>

                  {/* Tafqeet words */}
                  <div className="grid grid-cols-4 p-3">
                    <span className="font-bold text-slate-700 col-span-1">المبلغ كتابة:</span>
                    <span className="col-span-3 font-bold text-emerald-800">
                      {numberToArabicWords(selectedVoucherForPrint.amount)}
                    </span>
                  </div>

                  {/* Reason / Description */}
                  <div className="grid grid-cols-4 p-3 bg-slate-50/50">
                    <span className="font-bold text-slate-700 col-span-1">وذلك عن / البيان:</span>
                    <span className="col-span-3 text-slate-900 leading-relaxed font-medium">
                      {selectedVoucherForPrint.description}
                    </span>
                  </div>

                  {/* Account & Reference */}
                  <div className="grid grid-cols-4 p-3">
                    <span className="font-bold text-slate-700 col-span-1">الحساب المالي:</span>
                    <div className="col-span-3 flex flex-wrap gap-4 text-slate-800">
                      <span><strong>الحساب:</strong> {getAccountName(selectedVoucherForPrint.accountId)}</span>
                      {selectedVoucherForPrint.referenceNo && (
                        <span><strong>رقم المرجع / الشيك:</strong> {selectedVoucherForPrint.referenceNo}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Signatures & Seal Section */}
              <div className="pt-6 border-t-2 border-slate-300 grid grid-cols-4 gap-4 text-center">
                <div className="space-y-8">
                  <p className="text-xs font-bold text-slate-700">المستلم</p>
                  <p className="text-xs font-medium text-slate-500 border-b border-dashed border-slate-400 pb-1">
                    {selectedVoucherForPrint.receivedBy || "مكاشفي"}
                  </p>
                </div>
                <div className="space-y-8">
                  <p className="text-xs font-bold text-slate-700">أمين الصندوق / المحاسب</p>
                  <p className="text-xs font-medium text-slate-500 border-b border-dashed border-slate-400 pb-1">
                    قسم الحسابات
                  </p>
                </div>
                <div className="space-y-8">
                  <p className="text-xs font-bold text-slate-700">المدير المالي / الاعتماد</p>
                  <p className="text-xs font-medium text-slate-500 border-b border-dashed border-slate-400 pb-1">
                    معتمد
                  </p>
                </div>
                <div className="space-y-3 flex flex-col items-center">
                  <p className="text-xs font-bold text-slate-700">الختم الرسمي</p>
                  <div className="h-16 w-16 rounded-full border-2 border-emerald-600/40 border-dashed flex items-center justify-center text-[10px] text-emerald-800 font-bold p-1">
                    ختم الاعتماد
                  </div>
                </div>
              </div>

              {/* Bottom Notice */}
              <div className="text-[10px] text-center text-slate-400 border-t pt-3">
                تم استخراج هذا السند إلكترونياً من نظام كاف برو المالي والمحاسبي (KAF PRO ERP) - يعتبر السند سارياً بالاعتماد الرسمي.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── AlertDialog: Delete Confirmation ── */}
      <AlertDialog
        open={Boolean(voucherToDelete)}
        onOpenChange={(open) => !open && setVoucherToDelete(null)}
      >
        <AlertDialogContent dir={isRtl ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("تأكيد حذف السند", "Confirm Voucher Deletion")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                `هل أنت متأكد من رغبتك في حذف السند رقم (${voucherToDelete?.number})؟ لا يمكن التراجع عن هذا الإجراء.`,
                `Are you sure you want to delete voucher (${voucherToDelete?.number})? This action cannot be undone.`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>{t("إلغاء", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => voucherToDelete && deleteMutation.mutate({ id: voucherToDelete.id })}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {t("حذف السند", "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
