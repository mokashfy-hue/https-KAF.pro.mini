import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Smartphone,
  Monitor,
  Share2,
  FileDown,
  Database,
  CheckCircle2,
  Copy,
  ExternalLink,
  Laptop,
  Apple,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface InstallOfflineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InstallOfflineDialog({ open, onOpenChange }: InstallOfflineDialogProps) {
  const { isRtl, t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Listen for PWA beforeinstallprompt
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Check if already in standalone mode
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        toast.success(t("تم قبول تثبيت التطبيق بنجاح!", "App installation accepted!"));
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      toast.info(
        t(
          "اتبع الخطوات الموضحة أدناه لتثبيت التطبيق بحسب نوع جهازك",
          "Follow instructions below to install according to your device"
        )
      );
    }
  };

  const handleDownloadOfflineBundle = () => {
    // Direct link to the standalone offline portable HTML file
    const link = document.createElement("a");
    link.href = "/kaf-pro-offline-portable.html";
    link.download = "kaf-pro-offline-portable.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(
      t(
        "تم بدء تحميل النسخة المحلية المستقلة للعميل (جاهزة للعمل بدون إنترنت)!",
        "Offline portable bundle downloaded successfully!"
      )
    );
  };

  const handleExportBackup = () => {
    try {
      const raw = localStorage.getItem("kaf_pro_accounting_db") || "{}";
      const blob = new Blob([raw], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kaf_pro_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t("تم تصدير النسخة الاحتياطية بنجاح!", "Backup exported successfully!"));
    } catch {
      toast.error(t("حدث خطأ أثناء تصدير البيانات", "Error exporting data"));
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed) {
          localStorage.setItem("kaf_pro_accounting_db", JSON.stringify(parsed));
          toast.success(t("تم استيراد البيانات بنجاح! جاري تحديث الصفحة...", "Data imported! Refreshing..."));
          setTimeout(() => window.location.reload(), 1000);
        }
      } catch {
        toast.error(t("الملف المرفوع غير صالح للنسخ الاحتياطي", "Invalid backup file"));
      }
    };
    reader.readAsText(file);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    toast.success(t("تم نسخ رابط التطبيق للحافظة!", "App URL copied to clipboard!"));
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `رابط نظام كاف برو المحاسبي الذكي:\n${window.location.origin}\nيعمل على الجوال والكمبيوتر ومحلياً بدون إنترنت.`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6" dir={isRtl ? "rtl" : "ltr"}>
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Smartphone className="h-6 w-6 text-emerald-600" />
            <span>{t("تثبيت وتحميل التطبيق (الجوال، الكمبيوتر، والنسخة المحلية)", "Install & Offline Download")}</span>
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {t(
              "استخدم كاف برو كتطبيق رسمي على جهازك أو حمّل نسخة مستقلة بالكامل لإرسالها لأي عميل لتعمل محلياً دون الحاجة لاتصال بالإنترنت",
              "Use KAF PRO as a native app on your device, or download a standalone offline copy for any client"
            )}
          </p>
        </DialogHeader>

        <div className="space-y-6 pt-3">
          {/* ── 1. One-Click PWA Installation ── */}
          <Card className="border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent">
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-emerald-600/30 shrink-0">
                    ك
                  </div>
                  <div>
                    <h3 className="font-bold text-base flex items-center gap-2">
                      {t("تثبيت التطبيق على هذا الجهاز", "Install on this device")}
                      <Badge className="bg-emerald-600 text-white text-[10px] font-medium">PWA App</Badge>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isInstalled
                        ? t("التطبيق مثبت بالفعل ويعمل كنافذة مستقلة ✅", "App is already installed in standalone mode ✅")
                        : t("يعمل كبرنامج أصلي بدون شريط المتصفح مع وصول فوري من الشاشة الرئيسية", "Runs as a native standalone app without browser bars")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  onClick={handleInstallClick}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 h-11 px-5 shadow-sm shadow-emerald-600/30"
                >
                  <Download className="h-4 w-4" />
                  {isInstalled
                    ? t("التطبيق مثبت لديك (فتح)", "Open Installed App")
                    : t("📲 تثبيت التطبيق الآن بنقرة واحدة", "📲 Install App Now")}
                </Button>

                <Button onClick={handleCopyLink} variant="outline" className="gap-2 h-11">
                  {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  {t("نسخ رابط التطبيق", "Copy Link")}
                </Button>

                <Button onClick={handleShareWhatsApp} variant="outline" className="gap-2 h-11 text-emerald-700 border-emerald-200">
                  <Share2 className="h-4 w-4" />
                  {t("مشاركة عبر واتساب", "Share via WhatsApp")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ── 2. Download Standalone Offline Portable Copy for Client ── */}
          <Card className="border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-transparent">
            <CardContent className="p-4 sm:p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5 shadow-sm shadow-blue-600/30">
                  <FileDown className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-foreground">
                    {t("تحميل نسخة التشغيل المحلي للعميل (Offline Bundle)", "Download Offline Standalone Bundle")}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t(
                      "ملف مستقل تماماً (Standalone HTML) مدمج به كامل النظام المحاسبي وقاعدة البيانات المحلية، يمكنك تحميله وإرساله لأي عميل بالواتساب أو عبر فلاشة USB ليعمل لديه محلياً بنقرة زر واحدة ودون الحاجة لأي اتصال بالإنترنت أو خادم خارجي!",
                      "A single self-contained offline HTML file with embedded database and full ERP modules. Send it to any client to run locally with zero internet required!"
                    )}
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleDownloadOfflineBundle}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 h-11 px-5 shadow-sm shadow-blue-600/30 w-full sm:w-auto"
                >
                  <Download className="h-4 w-4" />
                  {t("📥 تحميل نسخة العميل المستقلة (HTML Offline)", "📥 Download Offline Client Package")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ── 3. Step-by-Step Device Guides ── */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              {t("طريقة التثبيت السريع على الأجهزة المختلفة:", "Installation steps per device:")}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Windows / Mac */}
              <div className="border rounded-xl p-3 bg-muted/30 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-foreground">
                  <Laptop className="h-4 w-4 text-blue-600" />
                  <span>{t("الكمبيوتر (Windows / Mac)", "Desktop / Laptop")}</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {t(
                    "في متصفح Chrome أو Edge، اضغط على أيقونة التثبيت (🖥️) في أقصى شريط العنوان بالأعلى، وسيتم إنشاء اختصار على سطح المكتب فوراً.",
                    "In Chrome or Edge, click the Install icon (🖥️) in the address bar to add to desktop."
                  )}
                </p>
              </div>

              {/* Android */}
              <div className="border rounded-xl p-3 bg-muted/30 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-foreground">
                  <Smartphone className="h-4 w-4 text-emerald-600" />
                  <span>{t("هواتف أندرويد (Android)", "Android Phones")}</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {t(
                    "اضغط زر (تثبيت التطبيق) بالأعلى، أو اضغط على النقاط الثلاث (⋮) في متصفح كروم ثم اختر (تثبيت التطبيق أو إضافة للشاشة الرئيسية).",
                    "Click install button above or tap menu (⋮) in Chrome and select 'Install app'."
                  )}
                </p>
              </div>

              {/* iOS / iPhone */}
              <div className="border rounded-xl p-3 bg-muted/30 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-foreground">
                  <Apple className="h-4 w-4 text-slate-800 dark:text-white" />
                  <span>{t("الآيفون والآيباد (iOS)", "iPhone / iPad")}</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {t(
                    "في متصفح Safari، اضغط على زر المشاركة (Share ⎋) في الأسفل، ثم مرر للأسفل واختر (إضافة إلى الشاشة الرئيسية ➕).",
                    "In Safari, tap Share (⎋), scroll down and tap 'Add to Home Screen ➕'."
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* ── 4. Full Data Backup & Transfer ── */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <Database className="h-4 w-4 text-amber-600" />
                  {t("النسخ الاحتياطي ونقل بيانات العميل", "Backup & Transfer Data")}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {t("تصدير أو استيراد كامل قاعدة البيانات لنقل الحسابات لأي جهاز آخر", "Export or import full database to transfer accounts to another device")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleExportBackup} variant="outline" size="sm" className="gap-1.5 text-xs h-9">
                <Download className="h-3.5 w-3.5" />
                {t("تصدير نسخة احتياطية (.json)", "Export Backup (.json)")}
              </Button>

              <label className="cursor-pointer">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-9 pointer-events-none"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  {t("استيراد واستعادة بيانات (.json)", "Import Backup (.json)")}
                </Button>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportBackup}
                />
              </label>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
