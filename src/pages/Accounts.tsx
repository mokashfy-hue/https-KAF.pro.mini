import { useState } from "react";
import Layout from "@/components/Layout";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";
import {
  ACCOUNT_COLORS,
  ACCOUNT_TYPES,
  accountTypeLabel,
  formatMoney,
  todayISO,
} from "@/lib/finance";
import {
  ArrowLeftRight,
  Banknote,
  CreditCard,
  Landmark,
  Pencil,
  PiggyBank,
  Plus,
  Search,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  cash: <Banknote className="h-5 w-5" />,
  bank: <Landmark className="h-5 w-5" />,
  credit_card: <CreditCard className="h-5 w-5" />,
  savings: <PiggyBank className="h-5 w-5" />,
  income: <Wallet className="h-5 w-5" />,
  expense: <Wallet className="h-5 w-5" />,
  other: <Wallet className="h-5 w-5" />,
};

type AccountWithBalance = {
  id: number;
  name: string;
  nameEn?: string;
  code?: string;
  parentCode?: string;
  level?: number;
  type: string;
  color: string;
  balance: number;
};

export default function AccountsPage() {
  const utils = trpc.useUtils();
  const { data: accounts, isLoading } = trpc.finance.accounts.list.useQuery();
  const { data: transfers } = trpc.finance.transfers.list.useQuery();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [accDialog, setAccDialog] = useState(false);
  const [editing, setEditing] = useState<AccountWithBalance | null>(null);
  const [deleting, setDeleting] = useState<AccountWithBalance | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<string>("cash");
  const [color, setColor] = useState(ACCOUNT_COLORS[0]);

  const [tfDialog, setTfDialog] = useState(false);
  const [fromId, setFromId] = useState<number | null>(null);
  const [toId, setToId] = useState<number | null>(null);
  const [tfAmount, setTfAmount] = useState("");
  const [tfDate, setTfDate] = useState(todayISO());
  const [tfNote, setTfNote] = useState("");

  const invalidate = () => {
    utils.finance.accounts.list.invalidate();
    utils.finance.transfers.list.invalidate();
    utils.finance.dashboard.invalidate();
  };

  const createMut = trpc.finance.accounts.create.useMutation({
    onSuccess: () => { toast.success("تم إنشاء الحساب"); invalidate(); setAccDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.finance.accounts.update.useMutation({
    onSuccess: () => { toast.success("تم تحديث الحساب"); invalidate(); setAccDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const delMut = trpc.finance.accounts.delete.useMutation({
    onSuccess: () => { toast.success("تم حذف الحساب"); invalidate(); setDeleting(null); },
    onError: (e) => toast.error(e.message),
  });
  const tfMut = trpc.finance.transfers.create.useMutation({
    onSuccess: () => {
      toast.success("تم التحويل بنجاح");
      invalidate();
      setTfDialog(false);
      setTfAmount(""); setTfNote("");
    },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    setName(""); setCode(""); setType("cash"); setColor(ACCOUNT_COLORS[0]);
    setAccDialog(true);
  };
  const openEdit = (a: AccountWithBalance) => {
    setEditing(a);
    setName(a.name); setCode(a.code || ""); setType(a.type); setColor(a.color);
    setAccDialog(true);
  };

  const accName = (id: number) => accounts?.find((a) => a.id === id)?.name ?? "";

  const allAccountsList = (accounts ?? []) as AccountWithBalance[];

  const filteredAccounts = allAccountsList.filter((a) => {
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchName = a.name.toLowerCase().includes(q);
      const matchNameEn = a.nameEn ? a.nameEn.toLowerCase().includes(q) : false;
      const matchCode = a.code ? a.code.toLowerCase().includes(q) : false;
      const matchType = accountTypeLabel(a.type).toLowerCase().includes(q);
      if (!matchName && !matchNameEn && !matchCode && !matchType) return false;
    }

    if (selectedCategory === "all") return true;
    if (selectedCategory === "asset") return a.code?.startsWith("1") || a.type === "cash" || a.type === "bank" || a.type === "asset";
    if (selectedCategory === "liability") return a.code?.startsWith("2") || a.type === "liability" || a.type === "credit_card";
    if (selectedCategory === "equity") return a.code?.startsWith("3") || a.type === "equity" || a.type.includes("equity");
    if (selectedCategory === "income") return a.code?.startsWith("4") || a.type === "income";
    if (selectedCategory === "expense") return a.code?.startsWith("5") || a.type === "expense";
    return true;
  });

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span>دليل الحسابات</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                {allAccountsList.length} حساب
              </span>
            </h1>
            <p className="text-sm text-muted-foreground">شجرة الحسابات المحاسبية والأرصدة اللحظية والتحويلات</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setTfDialog(true)} className="gap-1.5">
              <ArrowLeftRight className="h-4 w-4" /> تحويل
            </Button>
            <Button onClick={openCreate} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> حساب جديد
            </Button>
          </div>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="bg-card border rounded-2xl p-3 space-y-3 shadow-xs">
          <div className="relative">
            <Search className="absolute right-3.5 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="ابحث برقم الحساب، اسم الحساب، أو الحرف الأول..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 pl-9 h-11 text-sm bg-background/50 rounded-xl"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute left-3 top-3 p-1 text-muted-foreground hover:text-foreground"
                aria-label="مسح البحث"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {[
              { id: "all", label: "الكل", count: allAccountsList.length },
              { id: "asset", label: "1. الأصول", count: allAccountsList.filter(a => a.code?.startsWith("1") || a.type === "cash" || a.type === "bank" || a.type === "asset").length },
              { id: "liability", label: "2. الالتزامات", count: allAccountsList.filter(a => a.code?.startsWith("2") || a.type === "liability").length },
              { id: "equity", label: "3. حقوق الملكية", count: allAccountsList.filter(a => a.code?.startsWith("3") || a.type === "equity" || a.type.includes("equity")).length },
              { id: "income", label: "4. الإيرادات", count: allAccountsList.filter(a => a.code?.startsWith("4") || a.type === "income").length },
              { id: "expense", label: "5. المصروفات", count: allAccountsList.filter(a => a.code?.startsWith("5") || a.type === "expense").length },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all border",
                  selectedCategory === cat.id
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
                )}
              >
                {cat.label} ({cat.count})
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <p className="text-center text-sm text-muted-foreground py-10">جارٍ التحميل…</p>
        ) : filteredAccounts.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-2xl bg-card">
            <p className="text-muted-foreground font-medium">لم يتم العثور على حساب يطابق بحثك «{searchQuery}»</p>
            <Button variant="link" onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }} className="mt-2 text-emerald-600">
              إعادة تعيين البحث
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAccounts.map((a) => (
              <Card
                key={a.id}
                className="overflow-hidden hover:shadow-md transition-all cursor-pointer border-slate-200 group"
                onClick={() => openEdit(a)}
              >
                <div className="h-1.5" style={{ background: a.color }} />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-10 w-10 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs"
                        style={{ background: a.color }}
                      >
                        {TYPE_ICONS[a.type] ?? TYPE_ICONS.other}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {a.code && (
                            <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-bold">
                              {a.code}
                            </span>
                          )}
                          <div className="font-bold text-sm truncate group-hover:text-emerald-600 transition-colors">
                            {a.name}
                          </div>
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {a.nameEn ? `${a.nameEn} · ` : ""}{accountTypeLabel(a.type)}
                          {a.level ? ` (م${a.level})` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 -mr-2" onClick={(e) => e.stopPropagation()}>
                      <button className="p-2 text-muted-foreground hover:text-emerald-600 min-h-[44px]" onClick={() => openEdit(a)} aria-label="تعديل">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-muted-foreground hover:text-rose-600 min-h-[44px]" onClick={() => setDeleting(a)} aria-label="حذف">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-muted-foreground">الرصيد الحالي:</span>
                    <div className={cn("text-lg font-bold tabular-nums font-mono", a.balance < 0 ? "text-rose-600" : "text-emerald-700")} dir="ltr">
                      {formatMoney(a.balance)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Transfers history */}
        <h2 className="font-bold text-lg pt-2">التحويلات</h2>
        <Card>
          <CardContent className="p-2">
            {!transfers || transfers.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                لا توجد تحويلات بعد.
              </p>
            ) : (
              transfers.map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-accent">
                  <div className="h-9 w-9 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                    <ArrowLeftRight className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      من {accName(t.fromAccountId)} إلى {accName(t.toAccountId)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t.note ? `${t.note} · ` : ""}{String(t.date)}
                    </div>
                  </div>
                  <div className="text-sm font-bold tabular-nums" dir="ltr">
                    {formatMoney(t.amount)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Account create/edit dialog */}
      <Dialog open={accDialog} onOpenChange={setAccDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل الحساب" : "حساب جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>اسم الحساب</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: الصندوق، البنك..." className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label>رقم / كود الحساب</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="مثال: 110101" className="h-11 font-mono" dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label>نوع الحساب</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>اللون</Label>
            <div className="flex flex-wrap gap-2">
              {ACCOUNT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-9 w-9 rounded-full border-2 transition-transform",
                    color === c ? "border-foreground scale-110" : "border-transparent",
                  )}
                  style={{ background: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          <Button
            className="h-12"
            disabled={createMut.isPending || updateMut.isPending}
            onClick={() => {
              if (!name.trim()) return toast.error("أدخل اسم الحساب");
              if (editing) {
                updateMut.mutate({ id: editing.id, name: name.trim(), code: code.trim() || undefined, type: type as any, color });
              } else {
                createMut.mutate({ name: name.trim(), code: code.trim() || undefined, type: type as any, color });
              }
            }}
          >
            حفظ
          </Button>
        </DialogContent>
      </Dialog>

      {/* Transfer dialog */}
      <Dialog open={tfDialog} onOpenChange={setTfDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>تحويل بين الحسابات</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>من حساب</Label>
            <Select value={fromId ? String(fromId) : undefined} onValueChange={(v) => setFromId(Number(v))}>
              <SelectTrigger className="h-11"><SelectValue placeholder="اختر الحساب" /></SelectTrigger>
              <SelectContent>
                {accounts?.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>إلى حساب</Label>
            <Select value={toId ? String(toId) : undefined} onValueChange={(v) => setToId(Number(v))}>
              <SelectTrigger className="h-11"><SelectValue placeholder="اختر الحساب" /></SelectTrigger>
              <SelectContent>
                {accounts?.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>المبلغ</Label>
              <Input type="number" inputMode="decimal" min="0" step="0.01" dir="ltr" className="h-11" value={tfAmount} onChange={(e) => setTfAmount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>التاريخ</Label>
              <Input type="date" className="h-11" value={tfDate} onChange={(e) => setTfDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>ملاحظة (اختياري)</Label>
            <Input value={tfNote} onChange={(e) => setTfNote(e.target.value)} className="h-11" />
          </div>
          <Button
            className="h-12"
            disabled={tfMut.isPending}
            onClick={() => {
              const amt = parseFloat(tfAmount);
              if (!fromId || !toId) return toast.error("اختر الحسابين");
              if (!amt || amt <= 0) return toast.error("أدخل مبلغاً صحيحاً");
              tfMut.mutate({
                fromAccountId: fromId,
                toAccountId: toId,
                amount: amt,
                date: tfDate,
                note: tfNote || undefined,
              });
            }}
          >
            تنفيذ التحويل
          </Button>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الحساب «{deleting?.name}»؟</AlertDialogTitle>
            <AlertDialogDescription>
              لا يمكن حذف حساب مرتبط بحركات أو قيود أو تحويلات.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && delMut.mutate({ id: deleting.id })}
              className="bg-rose-600 hover:bg-rose-700"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
