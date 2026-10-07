import { useEffect, useState } from "react";
import { trpc } from "@/providers/trpc";
import type { Transaction } from "@db/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  todayISO,
} from "@/lib/finance";
import { toast } from "sonner";

export type TxLike = Pick<
  Transaction,
  "id" | "kind" | "amount" | "date" | "category" | "description" | "accountId"
>;

export function TransactionDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: TxLike | null;
}) {
  const utils = trpc.useUtils();
  const { data: accounts } = trpc.finance.accounts.list.useQuery();

  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setKind(editing.kind);
      setAmount(String(editing.amount));
      setDate(String(editing.date));
      setCategory(editing.category);
      setDescription(editing.description ?? "");
      setAccountId(editing.accountId);
    } else {
      setKind("expense");
      setAmount("");
      setDate(todayISO());
      setCategory(EXPENSE_CATEGORIES[0]);
      setDescription("");
      setAccountId(accounts?.[0]?.id ?? null);
    }
  }, [open, editing, accounts]);

  const categories = kind === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const invalidate = () => {
    utils.finance.transactions.list.invalidate();
    utils.finance.accounts.list.invalidate();
    utils.finance.dashboard.invalidate();
  };

  const createMut = trpc.finance.transactions.create.useMutation({
    onSuccess: () => {
      toast.success(kind === "expense" ? "تمت إضافة المصروف" : "تمت إضافة الدخل");
      invalidate();
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.finance.transactions.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الحركة");
      invalidate();
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const pending = createMut.isPending || updateMut.isPending;

  const submit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error("أدخل مبلغاً صحيحاً");
    if (!accountId) return toast.error("اختر الحساب / طريقة الدفع");
    if (!date) return toast.error("اختر التاريخ");
    if (editing) {
      updateMut.mutate({
        id: editing.id,
        kind,
        amount: amt,
        date,
        category,
        description: description || null,
        accountId,
      });
    } else {
      createMut.mutate({
        kind,
        amount: amt,
        date,
        category,
        description: description || undefined,
        accountId,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "تعديل حركة" : "إضافة حركة سريعة"}</DialogTitle>
        </DialogHeader>

        {/* Kind toggle */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { setKind("expense"); setCategory(EXPENSE_CATEGORIES[0]); }}
            className={cn(
              "h-11 rounded-xl border text-sm font-semibold transition-colors",
              kind === "expense"
                ? "bg-rose-600 text-white border-rose-600"
                : "text-muted-foreground",
            )}
          >
            مصروف
          </button>
          <button
            onClick={() => { setKind("income"); setCategory(INCOME_CATEGORIES[0]); }}
            className={cn(
              "h-11 rounded-xl border text-sm font-semibold transition-colors",
              kind === "income"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "text-muted-foreground",
            )}
          >
            دخل
          </button>
        </div>

        <div className="space-y-1.5">
          <Label>المبلغ</Label>
          <Input
            inputMode="decimal"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="h-12 text-lg text-center"
            dir="ltr"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>التاريخ</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label>الحساب / طريقة الدفع</Label>
            <Select
              value={accountId ? String(accountId) : undefined}
              onValueChange={(v) => setAccountId(Number(v))}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="اختر الحساب" />
              </SelectTrigger>
              <SelectContent>
                {accounts?.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>التصنيف</Label>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "px-3 h-9 rounded-full border text-sm transition-colors",
                  category === c
                    ? "bg-primary text-primary-foreground border-primary"
                    : "text-muted-foreground hover:bg-accent",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>الوصف (اختياري)</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="مثال: غداء مع العائلة"
          />
        </div>

        <Button onClick={submit} disabled={pending} className="h-12 text-base">
          {pending ? "جارٍ الحفظ…" : editing ? "حفظ التعديلات" : "إضافة"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
