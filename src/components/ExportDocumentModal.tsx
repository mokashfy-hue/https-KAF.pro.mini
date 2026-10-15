import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/finance";
import { numberToArabicWords } from "@/lib/tafqeet";
import { cn } from "@/lib/utils";
import {
  Printer,
  FileDown,
  Share2,
  Copy,
  Check,
  Send,
  MessageSquare,
  Building2,
  FileText,
  ExternalLink,
  ShieldCheck,
  Phone,
  User,
  Calendar,
  CreditCard,
  QrCode,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export type ExportableDocumentType = "voucher" | "transaction" | "journal_entry";

export interface ExportableFinancialDoc {
  type: ExportableDocumentType;
  id: number | string;
  subType?: "receipt" | "payment" | "income" | "expense" | "journal" | string;
  title?: string;
  number: string;
  referenceNo?: string;
  date: string;
  amount: number | string;
  currency?: string;
  partyName?: string;
  partyPhone?: string;
  contactId?: number | null;
  accountName?: string;
  category?: string;
  paymentMethod?: string;
  description: string;
  receivedBy?: string;
  lines?: Array<{
    accountName?: string;
    debit?: number | string;
    credit?: number | string;
    description?: string;
  }>;
}

interface ExportDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: ExportableFinancialDoc | null;
}

const COUNTRY_CODES = [
  { code: "966", label: "السعودية (+966)", flag: "🇸🇦" },
  { code: "20", label: "مصر (+20)", flag: "🇪🇬" },
  { code: "971", label: "الإمارات (+971)", flag: "🇦🇪" },
  { code: "965", label: "الكويت (+965)", flag: "🇰🇼" },
  { code: "249", label: "السودان (+249)", flag: "🇸🇩" },
  { code: "968", label: "عمان (+968)", flag: "🇴🇲" },
  { code: "973", label: "البحرين (+973)", flag: "🇧🇭" },
  { code: "974", label: "قطر (+974)", flag: "🇶🇦" },
  { code: "962", label: "الأردن (+962)", flag: "🇯🇴" },
];

export function ExportDocumentModal({
  open,
  onOpenChange,
  document: doc,
}: ExportDocumentModalProps) {
  const { isRtl, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"preview" | "whatsapp" | "share">("preview");
  const [copied, setCopied] = useState(false);

  // WhatsApp form state
  const [countryCode, setCountryCode] = useState("966");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [customNotes, setCustomNotes] = useState("");

  const { data: company } = trpc.company.get.useQuery();
  const { data: contacts = [] } = trpc.contacts.list.useQuery();

  if (!doc) return null;

  const companyName = company?.name || "شركة كاف برو للحلول الإدارية والمالية";
  const companyNameEn = company?.nameEn || "KAF PRO ERP & Financial Solutions Co.";
  const currencyStr = doc.currency || company?.currency || "ر.س (SAR)";
  const tafqeetText = numberToArabicWords(doc.amount);

  // Normalize document type labels
  let docBadgeText = "سند مالي معتمد";
  let docBadgeEn = "OFFICIAL FINANCIAL SLIP";
  let isReceiptOrIncome = true;

  if (doc.type === "voucher") {
    if (doc.subType === "receipt") {
      docBadgeText = "سند قبض مالي";
      docBadgeEn = "RECEIPT VOUCHER";
      isReceiptOrIncome = true;
    } else {
      docBadgeText = "سند صرف مالي";
      docBadgeEn = "PAYMENT VOUCHER";
      isReceiptOrIncome = false;
    }
  } else if (doc.type === "transaction") {
    if (doc.subType === "income") {
      docBadgeText = "إشعار تحصيل مالي (إيراد)";
      docBadgeEn = "INCOME TRANSACTION SLIP";
      isReceiptOrIncome = true;
    } else {
      docBadgeText = "إشعار صرف مالي (مصروف)";
      docBadgeEn = "EXPENSE TRANSACTION SLIP";
      isReceiptOrIncome = false;
    }
  } else if (doc.type === "journal_entry") {
    docBadgeText = "سند قيد يومية محاسبي";
    docBadgeEn = "JOURNAL VOUCHER SLIP";
    isReceiptOrIncome = true;
  }

  // Pre-fill phone if available from document or matched contact
  const matchedContact = contacts.find(
    (c) =>
      (doc.contactId && c.id === doc.contactId) ||
      (doc.partyName && c.name.toLowerCase() === doc.partyName.toLowerCase())
  );

  const effectivePhone = phoneNumber || doc.partyPhone || matchedContact?.phone || "";

  // Prepare formatted WhatsApp message
  const generateWhatsAppMessage = () => {
    const lines = [
      `🧾 *${docBadgeText} معتمد*`,
      `🏢 *${companyName}*`,
      `----------------------------------------`,
      `🔢 *رقم المستند:* ${doc.number}`,
      `📅 *التاريخ:* ${doc.date}`,
      `👤 *المكرم / الجهة:* ${doc.partyName || "العميل المحترم"}`,
      `💰 *المبلغ:* ${formatMoney(doc.amount)} ${currencyStr}`,
      `✍️ *المبلغ كتابة:* ${tafqeetText}`,
    ];

    if (doc.description) {
      lines.push(`📝 *البيان:* ${doc.description}`);
    }

    if (doc.paymentMethod) {
      lines.push(`💳 *طريقة السداد:* ${doc.paymentMethod}`);
    } else if (doc.accountName) {
      lines.push(`🏦 *الحساب المالي:* ${doc.accountName}`);
    }

    if (doc.referenceNo) {
      lines.push(`🔖 *رقم المرجع / الشيك:* ${doc.referenceNo}`);
    }

    if (customNotes.trim()) {
      lines.push(`📌 *ملاحظات إضافية:* ${customNotes.trim()}`);
    }

    lines.push(`----------------------------------------`);
    lines.push(`✅ تم استخراج هذا السند إلكترونياً وباعتماد رسمي`);
    lines.push(`✨ *المصمم والمالك للنظام: شركة المكاشفى*`);

    return lines.join("\n");
  };

  const cleanPhoneForWhatsApp = (raw: string, country: string): string => {
    let digits = raw.replace(/\D/g, "");
    if (!digits) return "";
    // If user already included country code like 96650... or 201...
    if (digits.startsWith("00")) digits = digits.slice(2);
    if (digits.startsWith(country)) return digits;
    // Saudi local format: 0501234567 -> 966501234567
    if (country === "966" && digits.startsWith("05")) {
      return `966${digits.slice(1)}`;
    }
    // Egypt local format: 01012345678 -> 201012345678
    if (country === "20" && digits.startsWith("01")) {
      return `20${digits.slice(1)}`;
    }
    // General case: strip leading zero and prepend country code
    if (digits.startsWith("0")) digits = digits.slice(1);
    return `${country}${digits}`;
  };

  const handleSendWhatsApp = () => {
    const text = generateWhatsAppMessage();
    const finalPhone = cleanPhoneForWhatsApp(effectivePhone, countryCode);

    let url = "";
    if (finalPhone) {
      url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`;
    } else {
      url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    }

    window.open(url, "_blank");
    toast.success("تم فتح تطبيق الواتساب لإرسال السند للعميل!");
  };

  const handleCopyMessage = () => {
    const text = generateWhatsAppMessage();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("تم نسخ تفاصيل السند إلى الحافظة بنجاح!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    const text = generateWhatsAppMessage();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${docBadgeText} - ${doc.number}`,
          text: text,
        });
        toast.success("تمت المشاركة بنجاح!");
      } catch (err: any) {
        if (err.name !== "AbortError") {
          handleCopyMessage();
        }
      }
    } else {
      handleCopyMessage();
    }
  };

  // Open standalone clean printable window ready to save as PDF
  const handlePrintOrSavePdf = () => {
    const printContent = window.document.getElementById("printable-financial-doc");
    if (!printContent) {
      window.print();
      return;
    }

    // Open dedicated print window for perfect PDF rendering without any app interference
    const printWindow = window.open("", "_blank", "width=850,height=1100");
    if (!printWindow) {
      window.print();
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>${docBadgeText} - ${doc.number}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            body {
              font-family: 'Tajawal', 'Segoe UI', Tahoma, Arial, sans-serif;
              direction: rtl;
              margin: 0;
              padding: 10px;
              color: #0f172a;
              background: #ffffff;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .slip-container {
              border: 2px solid #334155;
              border-radius: 12px;
              padding: 24px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 16px;
              margin-bottom: 20px;
            }
            .logo-box {
              width: 44px;
              height: 44px;
              background: #059669;
              color: #ffffff;
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 24px;
              font-weight: 900;
              float: right;
              margin-left: 12px;
            }
            .badge-box {
              border: 2px solid ${isReceiptOrIncome ? "#059669" : "#e11d48"};
              background: ${isReceiptOrIncome ? "#ecfdf5" : "#fff1f2"};
              color: ${isReceiptOrIncome ? "#065f46" : "#9f1239"};
              padding: 6px 16px;
              border-radius: 8px;
              font-weight: 800;
              font-size: 15px;
              text-align: center;
            }
            .meta-box {
              border: 1px solid #cbd5e1;
              background: #f8fafc;
              border-radius: 6px;
              padding: 8px 12px;
              margin-top: 6px;
              font-size: 12px;
              font-family: monospace;
              text-align: center;
            }
            .amount-card {
              border: 2px solid ${isReceiptOrIncome ? "#6ee7b7" : "#fda4af"};
              background: ${isReceiptOrIncome ? "#f0fdf4" : "#fff1f2"};
              padding: 16px;
              border-radius: 12px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
            }
            .amount-val {
              font-size: 26px;
              font-weight: 900;
              font-family: monospace;
              color: #0f172a;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              overflow: hidden;
              margin-bottom: 24px;
              font-size: 13px;
            }
            th, td {
              border: 1px solid #e2e8f0;
              padding: 10px 14px;
              text-align: right;
            }
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
            .th-label {
              width: 25%;
              font-weight: 700;
              color: #475569;
              background: #f1f5f9;
            }
            .signatures {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 16px;
              border-top: 2px solid #cbd5e1;
              padding-top: 20px;
              text-align: center;
              margin-top: 24px;
            }
            .sig-title {
              font-size: 12px;
              font-weight: 700;
              color: #475569;
              margin-bottom: 30px;
            }
            .sig-line {
              border-bottom: 1px dashed #94a3b8;
              padding-bottom: 4px;
              font-size: 12px;
              color: #64748b;
            }
            .seal-box {
              width: 65px;
              height: 65px;
              border: 2px dashed #059669;
              border-radius: 50%;
              margin: 0 auto;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 11px;
              font-weight: 700;
              color: #059669;
            }
            .footer-branding {
              margin-top: 20px;
              border-top: 1px solid #e2e8f0;
              padding-top: 10px;
              text-align: center;
              font-size: 10px;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div class="slip-container">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.focus();
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl max-h-[94vh] overflow-y-auto p-4 sm:p-6"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <DialogHeader className="border-b pb-3 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
              <FileDown className="h-5 w-5 text-emerald-600" />
              <span>{t("تصدير ومشاركة السند والعملية المالية", "Export & Share Financial Slip")}</span>
            </DialogTitle>

            {/* Quick Action Tabs */}
            <div className="flex rounded-lg bg-muted p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={cn(
                  "px-3 py-1 font-bold rounded-md transition-all flex items-center gap-1.5",
                  activeTab === "preview"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>{t("معاينة السند و PDF", "Preview & PDF")}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("whatsapp")}
                className={cn(
                  "px-3 py-1 font-bold rounded-md transition-all flex items-center gap-1.5",
                  activeTab === "whatsapp"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{t("إرسال واتساب", "WhatsApp")}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("share")}
                className={cn(
                  "px-3 py-1 font-bold rounded-md transition-all flex items-center gap-1.5",
                  activeTab === "share"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>{t("مشاركة ونسخ", "Share & Copy")}</span>
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* ── Tab 2: WhatsApp Sharing Form ── */}
        {activeTab === "whatsapp" && (
          <div className="space-y-4 py-2 print:hidden">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">إرسال إشعار السند المالي مباشرة للعميل عبر الواتساب:</p>
                <p className="text-emerald-800 text-[11px] mt-0.5">
                  سيتم فتح محادثة الواتساب مع العميل ومرفق بها تفاصيل السند الرسمية، المبلغ رقماً وكتابة، واسم المنشأة.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-bold">{t("رمز الدولة", "Country Code")}</Label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <Label className="text-xs font-bold flex items-center justify-between">
                  <span>{t("رقم جوال العميل / المستلم", "Client Mobile Number")}</span>
                  {matchedContact?.phone && !phoneNumber && (
                    <span className="text-[10px] text-emerald-700 font-normal">
                      (تم التعرف تلقائياً على رقم: {matchedContact.name})
                    </span>
                  )}
                </Label>
                <div className="relative mt-1">
                  <Input
                    value={phoneNumber || effectivePhone}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="مثال: 0501234567 أو 01012345678"
                    className="h-9 text-xs font-mono"
                    dir="ltr"
                  />
                  <Phone className="h-4 w-4 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Quick Contact Picker */}
            {contacts.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground font-semibold">
                  {t("أو اختر عميل من الدليل لملء الرقم فوراً:", "Or pick a contact:")}
                </Label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-muted/40 rounded-lg border">
                  {contacts.slice(0, 10).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setPhoneNumber(c.phone || "")}
                      className={cn(
                        "text-[11px] px-2.5 py-1 rounded-md border font-medium transition-all flex items-center gap-1",
                        effectivePhone === c.phone
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-background hover:bg-accent border-border"
                      )}
                    >
                      <User className="h-3 w-3" />
                      <span>{c.name}</span>
                      {c.phone && <span className="font-mono text-[10px] opacity-75">({c.phone})</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs font-bold">{t("ملاحظة إضافية في رسالة الواتساب (اختياري)", "Optional Custom Note")}</Label>
              <Input
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="مثال: نرجو التكرم بالاطلاع واعتماد الاستلام، شاكرين ومقدرين حسن تعاونكم"
                className="mt-1 h-9 text-xs"
              />
            </div>

            {/* Live Message Preview */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-muted-foreground">
                {t("معاينة نص رسالة الواتساب:", "WhatsApp Message Preview:")}
              </Label>
              <pre className="p-3 bg-muted/70 rounded-xl text-[11px] font-sans leading-relaxed text-foreground whitespace-pre-wrap border max-h-40 overflow-y-auto">
                {generateWhatsAppMessage()}
              </pre>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                onClick={handleSendWhatsApp}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 gap-2 shadow-sm"
              >
                <Send className="h-4 w-4" />
                <span>{t("إرسال السند عبر الواتساب الآن 🟢", "Send via WhatsApp Now 🟢")}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyMessage}
                className="gap-1.5 h-10 text-xs"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? t("تم النسخ!", "Copied!") : t("نسخ نص الإشعار", "Copy Text")}</span>
              </Button>
            </div>
          </div>
        )}

        {/* ── Tab 3: Universal Share & Copy ── */}
        {activeTab === "share" && (
          <div className="space-y-4 py-2 print:hidden">
            <div className="p-4 rounded-xl bg-muted/50 border space-y-3">
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-sm">مشاركة السند عبر أي وسيلة تواصل</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                يمكنك مشاركة نص ورابط السند مباشرة عبر تطبيقات التواصل (البريد الإلكتروني، تيليجرام، الرسائل النصية، أو تطبيقات المراسلة الأخرى)، أو نسخ التفاصيل بنقرة واحدة.
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  onClick={handleNativeShare}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  <span>{t("مشاركة السند (تيليجرام / بريد / تطبيقات) 🚀", "Share via Apps")}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopyMessage}
                  className="gap-2 font-semibold"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? t("تم النسخ بنجاح!", "Copied!") : t("نسخ الإشعار للحافظة", "Copy Details")}</span>
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">ملخص السند الجاهز للمشاركة:</Label>
              <pre className="p-3 bg-muted/60 rounded-xl text-xs font-sans leading-relaxed text-foreground whitespace-pre-wrap border">
                {generateWhatsAppMessage()}
              </pre>
            </div>
          </div>
        )}

        {/* ── Tab 1: Printable Slip Preview (Always rendered for Print) ── */}
        <div className={cn("space-y-4", activeTab !== "preview" && "print:block hidden")}>
          {/* Top toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 print:hidden">
            <span className="text-xs text-muted-foreground font-semibold">
              جاهز للطباعة والتصدير بجودة A4 عالية:
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handlePrintOrSavePdf}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm font-bold h-9 text-xs"
              >
                <Printer className="h-4 w-4" />
                <span>{t("طباعة / حفظ كملف PDF 📄", "Print / Save as PDF 📄")}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab("whatsapp")}
                className="gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-bold h-9 text-xs"
              >
                <MessageSquare className="h-4 w-4 text-emerald-600" />
                <span>{t("إرسال واتساب 💬", "Send WhatsApp 💬")}</span>
              </Button>
            </div>
          </div>

          {/* Printable Document Box */}
          <div
            id="printable-financial-doc"
            className="print-document-container bg-white text-slate-900 p-5 sm:p-7 rounded-xl border-2 border-slate-300 shadow-sm space-y-5 my-1 text-right relative font-sans"
          >
            {/* Header: Company Info & Slip Badge */}
            <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
              <div className="space-y-1 text-right">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-xl bg-emerald-700 text-white font-bold flex items-center justify-center text-xl shadow-xs shrink-0">
                    ك
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                      {companyName}
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {companyNameEn}
                    </p>
                  </div>
                </div>
                <div className="text-[11px] text-slate-600 space-y-0.5 pt-1">
                  <p>
                    السجل التجاري: <span className="font-mono font-semibold">{company?.crNumber || "1010789456"}</span> | 
                    الرقم الضريبي: <span className="font-mono font-semibold">{company?.taxNumber || "310456789000003"}</span>
                  </p>
                  <p>{company?.address || "طريق الملك فهد، حي الصحافة"} - {company?.city || "الرياض، المملكة العربية السعودية"}</p>
                  <p>هاتف: <span className="font-mono">{company?.phone || "+966 50 123 4567"}</span> | بريد: {company?.email || "finance@kaf-pro.com"}</p>
                </div>
              </div>

              <div className="text-left space-y-1.5 shrink-0">
                <div
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-extrabold uppercase border-2 text-center",
                    isReceiptOrIncome
                      ? "bg-emerald-50 text-emerald-800 border-emerald-600"
                      : "bg-rose-50 text-rose-800 border-rose-600"
                  )}
                >
                  <div>{docBadgeText}</div>
                  <div className="text-[9px] font-normal tracking-wider opacity-80">
                    {docBadgeEn}
                  </div>
                </div>
                <div className="border border-slate-300 rounded p-1.5 text-center bg-slate-50 text-[11px] font-mono space-y-0.5">
                  <div>رقم السند: <strong className="text-xs font-bold text-slate-900">{doc.number}</strong></div>
                  <div>التاريخ: <strong>{doc.date}</strong></div>
                </div>
              </div>
            </div>

            {/* Highlight Amount Card */}
            <div
              className={cn(
                "flex items-center justify-between p-3.5 sm:p-4 rounded-xl border-2",
                isReceiptOrIncome
                  ? "bg-emerald-50/70 border-emerald-300"
                  : "bg-rose-50/70 border-rose-300"
              )}
            >
              <div>
                <span className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                  المبلغ المالي المستحق:
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">
                  {formatMoney(doc.amount)}{" "}
                  <span className="text-xs sm:text-sm font-bold text-slate-700">{currencyStr}</span>
                </span>
              </div>
              <div className="text-left">
                <span className="text-[11px] text-slate-500 block">طريقة السداد / الحساب:</span>
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  {doc.paymentMethod || doc.accountName || "نقداً / حساب بنكي"}
                </span>
              </div>
            </div>

            {/* Document Details Table */}
            <div className="border-2 border-slate-300 rounded-xl overflow-hidden text-xs sm:text-sm">
              <div className="grid grid-cols-1 divide-y divide-slate-200">
                {/* Beneficiary / Party */}
                <div className="grid grid-cols-4 p-2.5 sm:p-3 bg-slate-50/60">
                  <span className="font-bold text-slate-700 col-span-1">
                    {isReceiptOrIncome ? "استلمنا من المكرم:" : "يُصرف إلى المكرم:"}
                  </span>
                  <span className="col-span-3 font-semibold text-slate-900">
                    {doc.partyName || "عميل / طرف معتمد"}
                  </span>
                </div>

                {/* Tafqeet words */}
                <div className="grid grid-cols-4 p-2.5 sm:p-3">
                  <span className="font-bold text-slate-700 col-span-1">المبلغ كتابة:</span>
                  <span className="col-span-3 font-bold text-emerald-800">
                    {tafqeetText}
                  </span>
                </div>

                {/* Description */}
                <div className="grid grid-cols-4 p-2.5 sm:p-3 bg-slate-50/60">
                  <span className="font-bold text-slate-700 col-span-1">وذلك عن / البيان:</span>
                  <span className="col-span-3 text-slate-900 leading-relaxed font-medium">
                    {doc.description || "سداد مستحقات مالية معتمدة"}
                  </span>
                </div>

                {/* Account & Reference details */}
                <div className="grid grid-cols-4 p-2.5 sm:p-3">
                  <span className="font-bold text-slate-700 col-span-1">الحساب والمرجع:</span>
                  <div className="col-span-3 flex flex-wrap gap-4 text-slate-800">
                    {doc.accountName && <span><strong>الحساب:</strong> {doc.accountName}</span>}
                    {doc.category && <span><strong>التصنيف:</strong> {doc.category}</span>}
                    {doc.referenceNo && <span><strong>رقم المرجع:</strong> {doc.referenceNo}</span>}
                  </div>
                </div>

                {/* Optional: Journal lines if journal entry */}
                {doc.lines && doc.lines.length > 0 && (
                  <div className="p-3 bg-white">
                    <span className="font-bold text-slate-700 block mb-2">أسطر وحسابات القيد المالي:</span>
                    <table className="w-full text-center border-collapse border border-slate-300 text-xs">
                      <thead>
                        <tr className="bg-slate-100 font-bold text-slate-800">
                          <th className="border border-slate-300 p-1.5">الحساب</th>
                          <th className="border border-slate-300 p-1.5 w-24">مدين</th>
                          <th className="border border-slate-300 p-1.5 w-24">دائن</th>
                          <th className="border border-slate-300 p-1.5">البيان</th>
                        </tr>
                      </thead>
                      <tbody>
                        {doc.lines.map((l, idx) => (
                          <tr key={idx} className="border-t border-slate-200">
                            <td className="border border-slate-300 p-1.5 text-right font-medium">{l.accountName}</td>
                            <td className="border border-slate-300 p-1.5 font-mono text-emerald-700 font-bold">
                              {Number(l.debit) > 0 ? formatMoney(l.debit) : "-"}
                            </td>
                            <td className="border border-slate-300 p-1.5 font-mono text-rose-700 font-bold">
                              {Number(l.credit) > 0 ? formatMoney(l.credit) : "-"}
                            </td>
                            <td className="border border-slate-300 p-1.5 text-slate-600">{l.description || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Signatures & Official Stamp */}
            <div className="pt-5 border-t-2 border-slate-300 grid grid-cols-4 gap-3 text-center">
              <div className="space-y-6">
                <p className="text-[11px] font-bold text-slate-700">المستلم</p>
                <p className="text-[11px] font-medium text-slate-500 border-b border-dashed border-slate-400 pb-1">
                  {doc.receivedBy || "مكاشفي"}
                </p>
              </div>
              <div className="space-y-6">
                <p className="text-[11px] font-bold text-slate-700">أمين الصندوق / المحاسب</p>
                <p className="text-[11px] font-medium text-slate-500 border-b border-dashed border-slate-400 pb-1">
                  قسم الحسابات
                </p>
              </div>
              <div className="space-y-6">
                <p className="text-[11px] font-bold text-slate-700">المدير المالي / الاعتماد</p>
                <p className="text-[11px] font-medium text-slate-500 border-b border-dashed border-slate-400 pb-1">
                  معتمد رسمي
                </p>
              </div>
              <div className="space-y-2 flex flex-col items-center">
                <p className="text-[11px] font-bold text-slate-700">الختم الرسمي</p>
                <div className="h-14 w-14 rounded-full border-2 border-emerald-600/40 border-dashed flex items-center justify-center text-[9px] text-emerald-800 font-bold p-1">
                  ختم الاعتماد
                </div>
              </div>
            </div>

            {/* Designer and Owner Branding Footer */}
            <div className="text-[10px] text-center text-slate-500 border-t pt-2.5 space-y-0.5">
              <p>
                تم استخراج هذا السند إلكترونياً من نظام كاف برو المالي والمحاسبي (KAF PRO ERP) - يعتبر السند سارياً بالاعتماد الرسمي.
              </p>
              <p className="text-emerald-800 font-bold flex items-center justify-center gap-1">
                <span>المصمم والمالك للنظام:</span>
                <span className="font-extrabold">شركة المكاشفى</span>
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
