import { useRef, useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Building2,
  CloudDownload,
  CloudUpload,
  LogOut,
  ShieldCheck,
  Save,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import type { CompanyInfo } from "@/lib/localStore";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { isRtl, t } = useLanguage();
  const utils = trpc.useUtils();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: companyData } = (trpc as any).company.get.useQuery();

  const [company, setCompany] = useState<CompanyInfo>({
    name: "",
    nameEn: "",
    crNumber: "",
    taxNumber: "",
    currency: "ر.س (SAR)",
    phone: "",
    email: "",
    address: "",
    city: "",
    slogan: "",
  });

  useEffect(() => {
    if (companyData) {
      setCompany(companyData);
    }
  }, [companyData]);

  const updateCompanyMut = (trpc as any).company.update.useMutation({
    onSuccess: () => {
      toast.success(t("تم حفظ بيانات الشركة بنجاح ✅", "Company info saved successfully ✅"));
      (utils as any).company.get.invalidate();
    },
    onError: () => toast.error(t("حدث خطأ أثناء الحفظ", "Error saving data")),
  });

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyMut.mutate(company);
  };

  const exportQuery = trpc.finance.backup.export.useQuery(undefined, {
    enabled: false,
  });

  const restoreMut = trpc.finance.backup.restore.useMutation({
    onSuccess: async () => {
      toast.success(t("تمت استعادة النسخة الاحتياطية بنجاح", "Backup restored successfully"));
      await utils.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const doExport = async () => {
    const res = await exportQuery.refetch();
    if (!res.data) return toast.error(t("تعذر إنشاء النسخة الاحتياطية", "Could not generate backup"));
    const blob = new Blob([JSON.stringify(res.data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kaf-pro-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("تم تنزيل النسخة الاحتياطية", "Backup downloaded"));
  };

  const doRestore = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      if (!data) {
        return toast.error(t("ملف النسخة الاحتياطية غير صالح", "Invalid backup file"));
      }
      if (!confirm(t("سيتم استبدال جميع بياناتك الحالية بمحتوى النسخة الاحتياطية. هل أنت متأكد؟", "Current data will be replaced. Continue?"))) return;
      restoreMut.mutate({});
    } catch {
      toast.error(t("تعذر قراءة الملف", "Could not read file"));
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("الإعدادات وبيانات المنشأة", "Settings & Company Profile")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("البيانات الأساسية للشركة، الملف الشخصي، والنسخ الاحتياطي", "Company credentials, user profile, and system backups")}
          </p>
        </div>

        {/* ── 1. Company Basic Information Form ── */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              {t("البيانات الأساسية للشركة والمنشأة", "Company Core Information")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSaveCompany} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t("اسم المنشأة / الشركة (بالعربية)", "Company Name (Arabic)")} *</Label>
                  <Input
                    value={company.name}
                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>{t("اسم الشركة (باللغة الإنجليزية)", "Company Name (English)")}</Label>
                  <Input
                    value={company.nameEn}
                    onChange={(e) => setCompany({ ...company, nameEn: e.target.value })}
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>{t("رقم السجل التجاري (CR Number)", "Commercial Registration No.")}</Label>
                  <Input
                    value={company.crNumber}
                    onChange={(e) => setCompany({ ...company, crNumber: e.target.value })}
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>{t("الرقم الضريبي (VAT / Tax Number)", "Tax / VAT ID")}</Label>
                  <Input
                    value={company.taxNumber}
                    onChange={(e) => setCompany({ ...company, taxNumber: e.target.value })}
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>{t("العملة الافتراضية", "Default Currency")}</Label>
                  <Input
                    value={company.currency}
                    onChange={(e) => setCompany({ ...company, currency: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t("رقم الهاتف / الجوال", "Phone / Mobile Number")}</Label>
                  <Input
                    value={company.phone}
                    onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>{t("البريد الإلكتروني الرسمي", "Official Email")}</Label>
                  <Input
                    type="email"
                    value={company.email}
                    onChange={(e) => setCompany({ ...company, email: e.target.value })}
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t("العنوان الوطني / الشارع", "Address / Street")}</Label>
                  <Input
                    value={company.address}
                    onChange={(e) => setCompany({ ...company, address: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>{t("المدينة والدولة", "City & Country")}</Label>
                  <Input
                    value={company.city}
                    onChange={(e) => setCompany({ ...company, city: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{t("الشعار اللفظي / وصف النشاط", "Company Slogan / Business Scope")}</Label>
                <Input
                  value={company.slogan}
                  onChange={(e) => setCompany({ ...company, slogan: e.target.value })}
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 gap-2 h-11 px-6 shadow-sm">
                  <Save className="h-4 w-4" />
                  {t("حفظ بيانات الشركة", "Save Company Info")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ── 2. User Profile Card ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("الملف الشخصي للمسؤول", "Administrator Profile")}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border">
              <AvatarImage src={user?.avatar ?? undefined} />
              <AvatarFallback className="bg-emerald-100 text-emerald-800 font-bold">{user?.name?.slice(0, 1) ?? "م"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{user?.name ?? "مكاشفي"}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.email ?? "admin@kaf.pro"}</div>
            </div>
            <Button variant="outline" onClick={() => logout()} className="gap-1.5 text-rose-600 hover:text-rose-700">
              <LogOut className="h-4 w-4" /> {t("خروج", "Log Out")}
            </Button>
          </CardContent>
        </Card>

        {/* ── 3. Backup & Restore ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              {t("النسخ الاحتياطي والاستعادة", "Backup & Restore")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {t(
                "يمكنك تحميل نسخة احتياطية كاملة من جميع الحركات، الحسابات، القيود، والعملاء، واسترجاعها على أي جهاز آخر.",
                "Export complete backup of transactions, accounts, journal entries, and clients to transfer between devices."
              )}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button onClick={doExport} variant="outline" className="gap-2">
                <CloudDownload className="h-4 w-4 text-emerald-600" />
                {t("تصدير نسخة احتياطية (JSON)", "Export Backup (JSON)")}
              </Button>

              <Button onClick={() => fileRef.current?.click()} variant="outline" className="gap-2">
                <CloudUpload className="h-4 w-4 text-sky-600" />
                {t("استعادة نسخة احتياطية", "Restore Backup")}
              </Button>

              <input
                ref={fileRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) doRestore(f);
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
