import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import Layout from "@/components/Layout";
import {
  TransactionDialog,
  type TxLike,
} from "@/components/TransactionDialog";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { formatMoney } from "@/lib/finance";
import { cn } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Filter = "all" | "expense" | "income";

export default function TransactionsPage() {
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState<Filter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TxLike | null>(null);
  const [deleting, setDeleting] = useState<TxLike | null>(null);

  const utils = trpc.useUtils();
  const { data: txs, isLoading } = trpc.finance.transactions.list.useQuery({ limit: 300 });
  const { data: accounts } = trpc.finance.accounts.list.useQuery();

  useEffect(() => {
    if (params.get("add") === "1") {
      setEditing(null);
      setDialogOpen(true);
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const delMut = trpc.finance.transactions.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الحركة");
      utils.finance.transactions.list.invalidate();
      utils.finance.accounts.list.invalidate();
      utils.finance.dashboard.invalidate();
      setDeleting(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = useMemo(
    () => (txs ?? []).filter((t) => filter === "all" || t.kind === filter),
    [txs, filter],
  );

  const accName = (id: number) => accounts?.find((a) => a.id === id)?.name ?? "";

  return (
    <Layout onAdd={() => { setEditing(null); setDialogOpen(true); }}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">الحركات</h1>
            <p className="text-sm text-muted-foreground">سجّل مصروفاتك ودخلك اليومي</p>
          </div>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> إضافة
          </Button>
        </div>

        <div className="flex gap-2">
          {(
            [
              ["all", "الكل"],
              ["expense", "مصروفات"],
              ["income", "دخل"],
            ] as [Filter, string][]
          ).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={cn(
                "px-4 h-9 rounded-full border text-sm",
                filter === v
                  ? "bg-primary text-primary-foreground border-primary font-semibold"
                  : "text-muted-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <Card>
          <CardContent className="p-2">
            {isLoading ? (
              <p className="text-center text-sm text-muted-foreground py-10">جارٍ التحميل…</p>
            ) : filtered.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-10">
                لا توجد حركات. اضغط «إضافة» لتسجيل أول حركة.
              </p>
            ) : (
              filtered.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-accent"
                >
                  <div
                    className={cn(
                      "h-9 w-9 rounded-full flex items-center justify-center shrink-0",
                      t.kind === "income"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700",
                    )}
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
                    className={cn(
                      "text-sm font-bold tabular-nums",
                      t.kind === "income" ? "text-emerald-600" : "text-rose-600",
                    )}
                    dir="ltr"
                  >
                    {t.kind === "income" ? "+" : "−"}{formatMoney(t.amount)}
                  </div>
                  <button
                    className="p-2 text-muted-foreground hover:text-foreground min-h-[44px]"
                    onClick={() => { setEditing(t); setDialogOpen(true); }}
                    aria-label="تعديل"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    className="p-2 text-muted-foreground hover:text-rose-600 min-h-[44px]"
                    onClick={() => setDeleting(t)}
                    aria-label="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <TransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الحركة؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذه الحركة نهائياً ولا يمكن التراجع.
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
