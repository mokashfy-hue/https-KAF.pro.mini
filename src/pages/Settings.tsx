import { useRef } from "react";
import Layout from "@/components/Layout";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CloudDownload, CloudUpload, LogOut, ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const utils = trpc.useUtils();
  const fileRef = useRef<HTMLInputElement>(null);

  const exportQuery = trpc.finance.backup.export.useQuery(undefined, {
    enabled: false,
  });

  const restoreMut = trpc.finance.backup.restore.useMutation({
    onSuccess: async () => {
      toast.success("تمت استعادة النسخة الاحتياطية بنجاح");
      await utils.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const doExport = async () => {
    const res = await exportQuery.refetch();
    if (!res.data) return toast.error("تعذر إنشاء النسخة الاحتياطية");
    const blob = new Blob([JSON.stringify(res.data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mokashfy-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("تم تنزيل النسخة الاحتياطية");
  };

  const doRestore = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      if (
        !data ||
        !Array.isArray(data.accounts) ||
        !Array.isArray(data.transactions) ||
        !Array.isArray(data.journalEntries) ||
        !Array.isArray(data.transfers)
      ) {
        return toast.error("ملف النسخة الاحتياطية غير صالح");
      }
      if (!confirm("سيتم استبدال جميع بياناتك الحالية بمحتوى النسخة الاحتياطية. هل أنت متأكد؟")) return;
      restoreMut.mutate({
        accounts: data.accounts,
        transactions: data.transactions,
        journalEntries: data.journalEntries,
        transfers: data.transfers,
      });
    } catch {
      toast.error("تعذر قراءة الملف");
    }
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">الإعدادات</h1>
          <p className="text-sm text-muted-foreground">الحساب، النسخ الاحتياطي، والأمان</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">الملف الشخصي</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border">
              <AvatarImage src={user?.avatar ?? undefined} />
              <AvatarFallback>{user?.name?.slice(0, 1) ?? "م"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{user?.name ?? "مستخدم"}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</div>
            </div>
            <Button variant="outline" onClick={() => logout()} className="gap-1.5">
              <LogOut className="h-4 w-4" /> خروج
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              النسخ الاحتياطي والاستعادة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              بياناتك محفوظة بأمان في السحابة ومرتبطة بحسابك — عند تغيير هاتفك،
              سجّل الدخول بنفس الحساب وستجد كل بياناتك كما هي، وتُزامَن تلقائياً
              بين جميع أجهزتك. يمكنك أيضاً تنزيل نسخة احتياطية (JSON) واستعادتها
              في أي وقت.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={doExport} variant="outline" className="gap-1.5">
                <CloudDownload className="h-4 w-4" /> تنزيل نسخة احتياطية
              </Button>
              <Button
                variant="outline"
                className="gap-1.5"
                disabled={restoreMut.isPending}
                onClick={() => fileRef.current?.click()}
              >
                <CloudUpload className="h-4 w-4" />
                {restoreMut.isPending ? "جارٍ الاستعادة…" : "استعادة من ملف"}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) doRestore(f);
                  e.target.value = "";
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-emerald-600" />
              المزامنة والأمان
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-1.5">
            <p>• تسجيل الدخول الآمن عبر حساب Kimi (OAuth).</p>
            <p>• بياناتك خاصة بك ولا يمكن لأي مستخدم آخر الوصول إليها.</p>
            <p>• جميع الاتصالات مشفرة، والبيانات مخزنة في قاعدة بيانات سحابية آمنة.</p>
            <p>• المزامنة تلقائية: أي تغيير على جهاز يظهر على باقي أجهزتك فور تسجيل الدخول.</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
