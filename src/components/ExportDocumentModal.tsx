import { useState, useRef } from "react";
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
  FileText,
  Phone,
  User,
  Sparkles,
  Download,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { generatePdfFromElement, downloadFile } from "@/lib/pdfGenerator";

export type ExportableDocumentType = "voucher" | "transaction" | "journal_entry" | "report";

export interface ExportableFinancialDoc {
  type: ExportableDocumentType;
  id: number | string;
  subType?: "receipt" | "payment" | "income" | "expense" | "journal" | "report" | string;
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
  reportData?: {
    headers: string[];
    rows: Array<Array<string | number>>;
    summary?: { label: string; value: string | number };
  };
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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadSuccessNotice, setDownloadSuccessNotice] = useState(false);

  // WhatsApp form state
  const [countryCode, setCountryCode] = useState("966");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [customNotes, setCustomNotes] = useState("");

  const printDocRef = useRef<HTMLDivElement>(null);

  const { data: company } = trpc.company.get.useQuery();
  const { data: contacts = [] } = trpc.contacts.list.useQuery();

  if (!doc) return null;

  const companyName = company?.name || "شركة كاف برو للحلول الإدارية والمالية";
  const companyNameEn = company?.nameEn || "KAF PRO ERP & Financial Solutions Co.";
  const currencyStr = doc.currency || company?.currency || "ر.س (SAR)";
  const tafqeetText = numberToArabicWords(doc.amount);

  // Normalize document type labels
  let docBadgeText = doc.title || "سند مالي معتمد";
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
  } else if (doc.type === "report") {
    docBadgeText = doc.title || "تقرير مالي معتمد";
    docBadgeEn = "FINANCIAL REPORT STATEMENT";
    isReceiptOrIncome = true;
  }

  // Pre-fill phone if available from document or matched contact
  const matchedContact = contacts.find(
    (c) =>
      (doc.contactId && c.id === doc.contactId) ||
      (doc.partyName && c.name.toLowerCase() === doc.partyName.toLowerCase())
  );

  const effectivePhone = phoneNumber || doc.partyPhone || matchedContact?.phone || "";

  // Prepare formatted WhatsApp text summary
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
      lines.push(`📌 *ملاحظات:* ${customNotes.trim()}`);
    }

    lines.push(`----------------------------------------`);
    lines.push(`📎 مرفق أدناه ملف السند بصيغة (PDF) المعتمدة`);
    lines.push(`✅ تم استخراج هذا السند إلكترونياً وباعتماد رسمي`);
    lines.push(`✨ *المصمم والمالك للنظام: شركة المكاشفى*`);

    return lines.join("\n");
  };

  const cleanPhoneForWhatsApp = (raw: string, country: string): string => {
    let digits = raw.replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("00")) digits = digits.slice(2);
    if (digits.startsWith(country)) return digits;
    if (country === "966" && digits.startsWith("05")) {
      return `966${digits.slice(1)}`;
    }
    if (country === "20" && digits.startsWith("01")) {
      return `20${digits.slice(1)}`;
    }
    if (digits.startsWith("0")) digits = digits.slice(1);
    return `${country}${digits}`;
  };

  const getSafeFileName = () => {
    const safeType = doc.subType || doc.type;
    const safeNum = doc.number.replace(/[^a-zA-Z0-9-_]/g, "_");
    return `${safeType}_${safeNum}.pdf`;
  };

  // Direct Binary PDF Download
  const handleDownloadPdf = async () => {
    const elem = printDocRef.current || document.getElementById("printable-financial-doc");
    if (!elem) return;

    try {
      setIsGeneratingPdf(true);
      toast.info("جاري إنشاء ملف PDF وتنسيق السند...");
      const { blob } = await generatePdfFromElement(elem, getSafeFileName());
      downloadFile(blob, getSafeFileName());
      toast.success("تم تحميل ملف PDF للسند بنجاح!");
      setDownloadSuccessNotice(true);
    } catch (err: any) {
      console.error("PDF generation error", err);
      toast.error("حدث خطأ أثناء إنشاء PDF، جاري التحويل للطباعة المباشرة...");
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Send PDF via WhatsApp / Web Share
  const handleSendWhatsAppWithPdf = async () => {
    const elem = printDocRef.current || document.getElementById("printable-financial-doc");
    const text = generateWhatsAppMessage();
    const finalPhone = cleanPhoneForWhatsApp(effectivePhone, countryCode);
    const fileName = getSafeFileName();

    setIsGeneratingPdf(true);
    let pdfFile: File | null = null;
    let pdfBlob: Blob | null = null;

    if (elem) {
      try {
        const res = await generatePdfFromElement(elem, fileName);
        pdfFile = res.file;
        pdfBlob = res.blob;
      } catch (e) {
        console.warn("Could not generate pdf file", e);
      }
    }

    setIsGeneratingPdf(false);

    // If browser supports sharing files (Mobile Chrome, Safari, Android, iOS):
    if (pdfFile && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({
          title: `${docBadgeText} - ${doc.number}`,
          text: text,
          files: [pdfFile],
        });
        toast.success("تمت مشاركة ملف PDF بنجاح!");
        return;
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.warn("Share failed, falling back to WhatsApp link", err);
        } else {
          return; // user cancelled share modal
        }
      }
    }

    // Fallback for Desktop / non-file share:
    // 1. Download the real PDF file
    if (pdfBlob) {
      downloadFile(pdfBlob, fileName);
      setDownloadSuccessNotice(true);
      toast.success("تم تنزيل ملف PDF (السند الرسمي) لجهازك!");
    }

    // 2. Open WhatsApp conversation
    let waUrl = "";
    if (finalPhone) {
      waUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`;
    } else {
      waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    }

    window.open(waUrl, "_blank");
  };

  const handleCopyMessage = () => {
    const text = generateWhatsAppMessage();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("تم نسخ تفاصيل السند إلى الحافظة بنجاح!");
    setTimeout(() => setCopied(false), 2500);
  };

  // Native Browser Print: Triggered directly from current window so all styles are active
  const handlePrint = () => {
    window.print();
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
              <span>{t("تصدير ومشاركة السند والعملية المالية (PDF)", "Export & Share Financial Slip (PDF)")}</span>
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
                <span>{t("إرسال ملف PDF عبر واتساب", "WhatsApp PDF")}</span>
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

        {/* Notice after generating and downloading PDF */}
        {downloadSuccessNotice && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs flex items-center justify-between gap-2 print:hidden animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                <strong>تم تنزيل ملف السند (PDF) بنجاح:</strong> يمكنك الآن إرفاقه 📎 أو سحبه إلى محادثة الواتساب المفتوحة للعميل.
              </span>
            </div>
            <button
              onClick={() => setDownloadSuccessNotice(false)}
              className="text-xs text-emerald-700 hover:underline font-bold"
            >
              إغلاق
            </button>
          </div>
        )}

        {/* ── Tab 2: WhatsApp PDF Sharing Form ── */}
        {activeTab === "whatsapp" && (
          <div className="space-y-4 py-2 print:hidden">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">إرسال ملف السند (PDF) ورسالته المعتمدة للعميل عبر الواتساب:</p>
                <p className="text-emerald-800 text-[11px] mt-0.5">
                  يتم تجهيز ملف السند بصيغة PDF الرسمية بكامل الألوان والشعار والجداول لإرسالها مباشرة إلى العميل.
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
                      (رقم العميل المعتمد: {matchedContact.name})
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
                  {t("اختر جهة اتصال لملء الرقم فوراً:", "Or pick a contact:")}
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
              <Label className="text-xs font-bold">{t("ملاحظة إضافية (اختياري)", "Optional Custom Note")}</Label>
              <Input
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="مثال: نرجو التكرم بالاطلاع واعتماد الاستلام"
                className="mt-1 h-9 text-xs"
              />
            </div>

            {/* Live Message Preview */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-muted-foreground">
                {t("معاينة الرسالة المرفقة مع ملف PDF:", "Message Preview:")}
              </Label>
              <pre className="p-3 bg-muted/70 rounded-xl text-[11px] font-sans leading-relaxed text-foreground whitespace-pre-wrap border max-h-36 overflow-y-auto">
                {generateWhatsAppMessage()}
              </pre>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                onClick={handleSendWhatsAppWithPdf}
                disabled={isGeneratingPdf}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 gap-2 shadow-sm"
              >
                <Send className="h-4 w-4" />
                <span>
                  {isGeneratingPdf
                    ? t("جاري تجهيز ملف PDF...", "Preparing PDF...")
                    : t("إرسال ملف PDF عبر الواتساب للعميل 🟢", "Send PDF via WhatsApp Now 🟢")}
                </span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="gap-1.5 h-11 text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-50"
              >
                <Download className="h-4 w-4 text-emerald-600" />
                <span>{t("تحميل ملف PDF 📥", "Download PDF 📥")}</span>
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
                <h3 className="font-bold text-sm">مشاركة ملف السند (PDF) عبر التطبيقات</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                يمكنك مشاركة ملف السند مباشرة كملف PDF رسمي أو إرساله عبر تيليجرام، الإيميل، وتطبيقات التواصل الأخرى.
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  onClick={handleSendWhatsAppWithPdf}
                  disabled={isGeneratingPdf}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 h-10"
                >
                  <Share2 className="h-4 w-4" />
                  <span>{t("مشاركة ملف PDF عبر التطبيقات 🚀", "Share PDF File")}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="gap-2 font-semibold h-10"
                >
                  <Download className="h-4 w-4 text-emerald-600" />
                  <span>{t("تحميل ملف PDF", "Download PDF")}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopyMessage}
                  className="gap-2 font-semibold h-10"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? t("تم النسخ!", "Copied!") : t("نسخ الإشعار", "Copy Text")}</span>
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground">نص السند الملخص:</Label>
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
              جاهز للطباعة والحفظ كملف PDF بكامل الألوان والجداول:
            </span>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={handlePrint}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm font-bold h-9 text-xs"
              >
                <Printer className="h-4 w-4" />
                <span>{t("طباعة / حفظ كملف PDF 📄", "Print / Save as PDF 📄")}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-bold h-9 text-xs"
              >
                <Download className="h-3.5 w-3.5 text-emerald-600" />
                <span>{isGeneratingPdf ? t("جاري التحميل...", "Loading...") : t("تحميل ملف PDF 📥", "Download PDF 📥")}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab("whatsapp")}
                className="gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-bold h-9 text-xs"
              >
                <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                <span>{t("إرسال واتساب 💬", "Send WhatsApp 💬")}</span>
              </Button>
            </div>
          </div>

          {/* ── Official Printable Document Box (Exact styling of Image 2 with explicit inline CSS) ── */}
          <div
            id="printable-financial-doc"
            ref={printDocRef}
            className="print-document-container text-right font-sans relative"
            style={{
              backgroundColor: "#ffffff",
              color: "#0f172a",
              border: "2px solid #334155",
              borderRadius: "14px",
              padding: "24px 28px",
              maxWidth: "800px",
              margin: "0 auto",
              direction: "rtl",
              fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          >
            {/* Header: Company Info & Slip Badge */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "2px solid #0f172a",
                paddingBottom: "16px",
                marginBottom: "18px",
              }}
            >
              <div style={{ textAlign: "right" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      backgroundColor: "#059669",
                      color: "#ffffff",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      fontWeight: "bold",
                    }}
                  >
                    ك
                  </div>
                  <div>
                    <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#0f172a", margin: "0", lineHeight: "1.2" }}>
                      {companyName}
                    </h2>
                    <p style={{ fontSize: "11px", color: "#64748b", fontWeight: "500", margin: "2px 0 0 0" }}>
                      {companyNameEn}
                    </p>
                  </div>
                </div>

                <div style={{ fontSize: "11px", color: "#475569", lineHeight: "1.6" }}>
                  <div>
                    السجل التجاري: <strong style={{ fontFamily: "monospace" }}>{company?.crNumber || "1010789456"}</strong> | 
                    الرقم الضريبي: <strong style={{ fontFamily: "monospace" }}>{company?.taxNumber || "310456789000003"}</strong>
                  </div>
                  <div>{company?.address || "طريق الملك فهد، حي الصحافة"} - {company?.city || "المملكة العربية السعودية"}</div>
                  <div>
                    هاتف: <span style={{ fontFamily: "monospace" }}>{company?.phone || "+966 50 123 4567"}</span> | 
                    بريد: {company?.email || "finance@kaf-pro.com"}
                  </div>
                </div>
              </div>

              {/* Document Badge & Metadata */}
              <div style={{ textAlign: "center", minWidth: "160px" }}>
                <div
                  style={{
                    border: isReceiptOrIncome ? "2px solid #059669" : "2px solid #e11d48",
                    backgroundColor: isReceiptOrIncome ? "#ecfdf5" : "#fff1f2",
                    color: isReceiptOrIncome ? "#065f46" : "#9f1239",
                    padding: "8px 18px",
                    borderRadius: "8px",
                    textAlign: "center",
                    fontWeight: "800",
                    fontSize: "14px",
                  }}
                >
                  <div>{docBadgeText}</div>
                  <div style={{ fontSize: "9px", fontWeight: "normal", letterSpacing: "1px", opacity: "0.85" }}>
                    {docBadgeEn}
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    backgroundColor: "#f8fafc",
                    fontSize: "11px",
                    fontFamily: "monospace",
                    marginTop: "8px",
                    textAlign: "center",
                  }}
                >
                  <div>رقم السند: <strong style={{ color: "#0f172a", fontSize: "12px" }}>{doc.number}</strong></div>
                  <div>التاريخ: <strong>{doc.date}</strong></div>
                </div>
              </div>
            </div>

            {/* Amount Highlight Card (Matching Image 2 exactly) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderRadius: "12px",
                border: isReceiptOrIncome ? "2px solid #6ee7b7" : "2px solid #fda4af",
                backgroundColor: isReceiptOrIncome ? "#f0fdf4" : "#fff1f2",
                marginBottom: "18px",
              }}
            >
              <div>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#475569", display: "block", marginBottom: "4px" }}>
                  المبلغ المالي المستحق:
                </span>
                <span style={{ fontSize: "28px", fontWeight: "900", fontFamily: "monospace", color: "#0f172a" }}>
                  {formatMoney(doc.amount)}{" "}
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#334155" }}>{currencyStr}</span>
                </span>
              </div>
              <div style={{ textAlign: "left" }}>
                <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>طريقة السداد / الحساب:</span>
                <span style={{ fontSize: "14px", fontWeight: "bold", color: "#1e293b" }}>
                  {doc.paymentMethod || doc.accountName || "نقداً / حساب بنكي"}
                </span>
              </div>
            </div>

            {/* Document Details Table (Solid borders matching Image 2) */}
            <div
              style={{
                border: "2px solid #cbd5e1",
                borderRadius: "12px",
                overflow: "hidden",
                marginBottom: "20px",
                fontSize: "13px",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "right" }}>
                <tbody>
                  {/* Beneficiary Row */}
                  <tr style={{ borderBottom: "1px solid #cbd5e1", backgroundColor: "#f8fafc" }}>
                    <th style={{ width: "25%", padding: "12px 16px", fontWeight: "700", color: "#334155", borderLeft: "1px solid #cbd5e1", verticalAlign: "middle" }}>
                      {isReceiptOrIncome ? "استلمنا من المكرم:" : "يُصرف إلى المكرم:"}
                    </th>
                    <td style={{ width: "75%", padding: "12px 16px", fontWeight: "700", color: "#0f172a", fontSize: "14px" }}>
                      {doc.partyName || "عميل / طرف معتمد"}
                    </td>
                  </tr>

                  {/* Tafqeet words */}
                  <tr style={{ borderBottom: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}>
                    <th style={{ width: "25%", padding: "12px 16px", fontWeight: "700", color: "#334155", borderLeft: "1px solid #cbd5e1", verticalAlign: "middle" }}>
                      المبلغ كتابة:
                    </th>
                    <td style={{ width: "75%", padding: "12px 16px", fontWeight: "800", color: "#065f46", fontSize: "14px" }}>
                      {tafqeetText}
                    </td>
                  </tr>

                  {/* Description / Reason */}
                  <tr style={{ borderBottom: "1px solid #cbd5e1", backgroundColor: "#f8fafc" }}>
                    <th style={{ width: "25%", padding: "12px 16px", fontWeight: "700", color: "#334155", borderLeft: "1px solid #cbd5e1", verticalAlign: "middle" }}>
                      وذلك عن / البيان:
                    </th>
                    <td style={{ width: "75%", padding: "12px 16px", fontWeight: "500", color: "#0f172a", lineHeight: "1.5" }}>
                      {doc.description || "سداد مستحقات مالية معتمدة"}
                    </td>
                  </tr>

                  {/* Financial Account & Reference */}
                  <tr style={{ backgroundColor: "#ffffff" }}>
                    <th style={{ width: "25%", padding: "12px 16px", fontWeight: "700", color: "#334155", borderLeft: "1px solid #cbd5e1", verticalAlign: "middle" }}>
                      الحساب والمرجع:
                    </th>
                    <td style={{ width: "75%", padding: "12px 16px", color: "#1e293b" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                        {doc.accountName && (
                          <span><strong>الحساب:</strong> {doc.accountName}</span>
                        )}
                        {doc.category && (
                          <span><strong>التصنيف:</strong> {doc.category}</span>
                        )}
                        {doc.referenceNo && (
                          <span><strong>رقم المرجع:</strong> {doc.referenceNo}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Optional: Journal entry lines if journal voucher */}
              {doc.lines && doc.lines.length > 0 && (
                <div style={{ padding: "12px 16px", backgroundColor: "#ffffff", borderTop: "2px solid #cbd5e1" }}>
                  <span style={{ fontWeight: "bold", color: "#334155", display: "block", marginBottom: "8px", fontSize: "12px" }}>
                    أسطر وحسابات القيد المالي:
                  </span>
                  <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #cbd5e1", fontSize: "12px", textAlign: "center" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f1f5f9", fontWeight: "bold", color: "#334155" }}>
                        <th style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "right" }}>الحساب</th>
                        <th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "110px" }}>مدين</th>
                        <th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "110px" }}>دائن</th>
                        <th style={{ border: "1px solid #cbd5e1", padding: "8px" }}>البيان</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doc.lines.map((l, idx) => (
                        <tr key={idx} style={{ borderTop: "1px solid #e2e8f0" }}>
                          <td style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "right", fontWeight: "600" }}>{l.accountName}</td>
                          <td style={{ border: "1px solid #cbd5e1", padding: "8px", fontFamily: "monospace", color: "#065f46", fontWeight: "bold" }}>
                            {Number(l.debit) > 0 ? formatMoney(l.debit) : "-"}
                          </td>
                          <td style={{ border: "1px solid #cbd5e1", padding: "8px", fontFamily: "monospace", color: "#9f1239", fontWeight: "bold" }}>
                            {Number(l.credit) > 0 ? formatMoney(l.credit) : "-"}
                          </td>
                          <td style={{ border: "1px solid #cbd5e1", padding: "8px", color: "#64748b" }}>{l.description || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Optional: Report Table Data if Report */}
              {doc.reportData && doc.reportData.rows.length > 0 && (
                <div style={{ padding: "12px 16px", backgroundColor: "#ffffff", borderTop: "2px solid #cbd5e1" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #cbd5e1", fontSize: "11px", textAlign: "center" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f1f5f9", fontWeight: "bold", color: "#334155" }}>
                        {doc.reportData.headers.map((h, idx) => (
                          <th key={idx} style={{ border: "1px solid #cbd5e1", padding: "8px" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {doc.reportData.rows.map((row, rIdx) => (
                        <tr key={rIdx} style={{ borderTop: "1px solid #e2e8f0" }}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} style={{ border: "1px solid #cbd5e1", padding: "6px 8px" }}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Signatures & Official Stamp (Matching Image 2 exactly) */}
            <div
              style={{
                borderTop: "2px solid #cbd5e1",
                paddingTop: "18px",
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "14px",
                textAlign: "center",
                marginTop: "16px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "70px" }}>
                <p style={{ fontSize: "11px", fontWeight: "bold", color: "#334155", margin: 0 }}>المستلم</p>
                <p style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", borderBottom: "1px dashed #94a3b8", paddingBottom: "4px", margin: 0 }}>
                  {doc.receivedBy || "مكاشفي"}
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "70px" }}>
                <p style={{ fontSize: "11px", fontWeight: "bold", color: "#334155", margin: 0 }}>أمين الصندوق / المحاسب</p>
                <p style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", borderBottom: "1px dashed #94a3b8", paddingBottom: "4px", margin: 0 }}>
                  قسم الحسابات
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "70px" }}>
                <p style={{ fontSize: "11px", fontWeight: "bold", color: "#334155", margin: 0 }}>المدير المالي / الاعتماد</p>
                <p style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", borderBottom: "1px dashed #94a3b8", paddingBottom: "4px", margin: 0 }}>
                  معتمد رسمي
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <p style={{ fontSize: "11px", fontWeight: "bold", color: "#334155", margin: "0 0 4px 0" }}>الختم الرسمي</p>
                <div
                  style={{
                    width: "55px",
                    height: "55px",
                    borderRadius: "50%",
                    border: "2px dashed #059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "9px",
                    fontWeight: "bold",
                    color: "#059669",
                  }}
                >
                  ختم الاعتماد
                </div>
              </div>
            </div>

            {/* Bottom Notice & Designer / Owner Branding Footer */}
            <div
              style={{
                borderTop: "1px solid #e2e8f0",
                paddingTop: "10px",
                marginTop: "16px",
                textAlign: "center",
                fontSize: "10px",
                color: "#64748b",
                lineHeight: "1.6",
              }}
            >
              <p style={{ margin: "0" }}>
                تم استخراج هذا السند إلكترونياً من نظام كاف برو المالي والمحاسبي (KAF PRO ERP) - يعتبر السند سارياً بالاعتماد الرسمي.
              </p>
              <p style={{ margin: "4px 0 0 0", color: "#065f46", fontWeight: "bold", fontSize: "11px" }}>
                المصمم والمالك للنظام: <span style={{ fontWeight: "800" }}>شركة المكاشفى</span>
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
