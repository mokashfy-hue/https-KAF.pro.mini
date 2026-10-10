import { useState } from "react";
import Layout from "@/components/Layout";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { AccountCombobox } from "@/components/finance/AccountCombobox";
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
import { formatMoney, todayISO } from "@/lib/finance";
import { CheckCircle2, Plus, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";

type Line = {
  accountId: number | null;
  debit: string;
  credit: string;
  description: string;
};

const emptyLine = (): Line => ({ accountId: null, debit: "", credit: "", description: "" });

export default function JournalPage() {
  const utils = trpc.useUtils();
  const { data: entries, isLoading } = trpc.finance.journal.list.useQuery();
  const { data: accounts } = trpc.finance.accounts.list.useQuery();

  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine(), emptyLine()]);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const balanced = totalDebit > 0 && Math.abs(totalDebit - totalCredit) < 0.005;

  const createMut = trpc.finance.journal.create.useMutation({
    onSuccess: () => {
      toast.success("تم حفظ القيد");
      utils.finance.journal.list.invalidate();
      utils.finance.accounts.list.invalidate();
      utils.finance.dashboard.invalidate();
      setOpen(false);
      setLines([emptyLine(), emptyLine()]);
      setDescription("");
    },
    onError: (e) => toast.error(e.message),
  });

  const delMut = trpc.finance.journal.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف القيد");
      utils.finance.journal.list.invalidate();
      utils.finance.accounts.list.invalidate();
      utils.finance.dashboard.invalidate();
      setDeletingId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const accName = (id: number) => accounts?.find((a) => a.id === id)?.name ?? "";

  const submit = () => {
    if (!balanced) return toast.error("القيد غير متوازن — يجب تساوي المدين والدائن");
    if (lines.some((l) => !l.accountId)) return toast.error("اختر الحساب لكل سطر");
    createMut.mutate({
      date,
      description: description || undefined,
      lines: lines.map((l) => ({
        accountId: l.accountId!,
        debit: parseFloat(l.debit) || 0,
        credit: parseFloat(l.credit) || 0,
        description: l.description || undefined,
      })),
    });
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">القيود المحاسبية</h1>
            <p className="text-sm text-muted-foreground">قيود يومية يدوية (مدين / دائن)</p>
          </div>
          <Button onClick={() => setOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> قيد جديد
          </Button>
        </div>

        {isLoading ? (
          <p className="text-center text-sm text-muted-foreground py-10">جارٍ التحميل…</p>
        ) : !entries || entries.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              لا توجد قيود بعد. أنشئ أول قيد محاسبي.
            </CardContent>
          </Card>
        ) : (
          entries.map((e) => (
            <Card key={e.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sm">
                      {e.description || "قيد يدوي"}
                    </div>
                    <div className="text-xs text-muted-foreground">{String(e.date)}</div>
                  </div>
                  <button
                    className="p-2 text-muted-foreground hover:text-rose-600 min-h-[44px]"
                    onClick={() => setDeletingId(e.id)}
                    aria-label="حذف القيد"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="rounded-xl border overflow-hidden">
                  <div className="grid grid-cols-[1fr_90px_90px] bg-muted/60 px-3 py-2 text-xs font-semibold text-muted-foreground">
                    <span>الحساب</span>
                    <span className="text-center">مدين</span>
                    <span className="text-center">دائن</span>
                  </div>
                  {e.lines.map((l) => (
                    <div
                      key={l.id}
                      className="grid grid-cols-[1fr_90px_90px] px-3 py-2 text-sm border-t"
                    >
                      <span className="truncate">
                        {accName(l.accountId)}
                        {l.description && (
                          <span className="block text-xs text-muted-foreground truncate">
                            {l.description}
                          </span>
                        )}
                      </span>
                      <span className="text-center tabular-nums" dir="ltr">
                        {Number(l.debit) > 0 ? formatMoney(l.debit) : "—"}
                      </span>
                      <span className="text-center tabular-nums" dir="ltr">
                        {Number(l.credit) > 0 ? formatMoney(l.credit) : "—"}
                      </span>
                    </div>
                  ))}
                  <div className="grid grid-cols-[1fr_90px_90px] px-3 py-2 text-sm font-bold border-t bg-muted/40">
                    <span>الإجمالي</span>
                    <span className="text-center tabular-nums" dir="ltr">
                      {formatMoney(e.lines.reduce((s, l) => s + Number(l.debit), 0))}
                    </span>
                    <span className="text-center tabular-nums" dir="ltr">
                      {formatMoney(e.lines.reduce((s, l) => s + Number(l.credit), 0))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* New entry dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>قيد محاسبي جديد</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>التاريخ</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label>البيان</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف القيد"
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="hidden sm:grid grid-cols-[1fr_110px_110px_36px] gap-2 text-xs font-semibold text-muted-foreground px-1">
              <span>الحساب</span>
              <span className="text-center">مدين</span>
              <span className="text-center">دائن</span>
              <span />
            </div>
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_80px_36px] sm:grid-cols-[1fr_110px_110px_36px] gap-2 items-center">
                <AccountCombobox
                  accounts={accounts}
                  value={l.accountId}
                  onChange={(v) =>
                    setLines((ls) => ls.map((x, j) => (j === i ? { ...x, accountId: v } : x)))
                  }
                  placeholder="الحساب"
                />
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  dir="ltr"
                  className="h-11"
                  value={l.debit}
                  onChange={(e) =>
                    setLines((ls) => ls.map((x, j) => (j === i ? { ...x, debit: e.target.value, credit: e.target.value ? "" : x.credit } : x)))
                  }
                />
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  dir="ltr"
                  className="h-11"
                  value={l.credit}
                  onChange={(e) =>
                    setLines((ls) => ls.map((x, j) => (j === i ? { ...x, credit: e.target.value, debit: e.target.value ? "" : x.debit } : x)))
                  }
                />
                <button
                  className="p-2 text-muted-foreground hover:text-rose-600 disabled:opacity-30 min-h-[44px]"
                  disabled={lines.length <= 2}
                  onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}
                  aria-label="حذف السطر"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setLines((ls) => [...ls, emptyLine()])} className="gap-1">
              <Plus className="h-4 w-4" /> إضافة سطر
            </Button>
          </div>

          {/* Totals + balance indicator */}
          <div className="rounded-xl border p-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span>
              إجمالي المدين:{" "}
              <b className="tabular-nums" dir="ltr">{formatMoney(totalDebit)}</b>
            </span>
            <span>
              إجمالي الدائن:{" "}
              <b className="tabular-nums" dir="ltr">{formatMoney(totalCredit)}</b>
            </span>
            <span
              className={cn(
                "mr-auto flex items-center gap-1.5 font-semibold",
                balanced ? "text-emerald-600" : "text-rose-600",
              )}
            >
              {balanced ? (
                <><CheckCircle2 className="h-4 w-4" /> القيد متوازن</>
              ) : (
                <><XCircle className="h-4 w-4" /> غير متوازن</>
              )}
            </span>
          </div>

          <Button onClick={submit} disabled={!balanced || createMut.isPending} className="h-12 text-base">
            {createMut.isPending ? "جارٍ الحفظ…" : "حفظ القيد"}
          </Button>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingId !== null} onOpenChange={(v) => !v && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف القيد؟</AlertDialogTitle>
            <AlertDialogDescription>سيتم حذف القيد وجميع سطوره نهائياً.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && delMut.mutate({ id: deletingId })}
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
