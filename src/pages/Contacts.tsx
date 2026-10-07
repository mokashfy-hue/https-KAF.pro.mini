import { useState } from "react";
import Layout from "@/components/Layout";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney } from "@/lib/finance";
import {
  Users,
  Truck,
  Plus,
  Phone,
  Mail,
  FileText,
  Trash2,
  Edit2,
  Wallet,
  TrendingUp,
  TrendingDown,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import type { LocalContact } from "@/lib/localStore";

export default function ContactsPage() {
  const { isRtl, t } = useLanguage();
  const utils = trpc.useUtils();

  const [activeTab, setActiveTab] = useState<"all" | "customer" | "supplier">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statementContact, setStatementContact] = useState<LocalContact | null>(null);
  const [editing, setEditing] = useState<LocalContact | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState<"customer" | "supplier">("customer");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [balance, setBalance] = useState("0");
  const [custodyBalance, setCustodyBalance] = useState("0");
  const [notes, setNotes] = useState("");

  const { data: contacts = [], isLoading } = (trpc as any).contacts.list.useQuery();

  const createMut = (trpc as any).contacts.create.useMutation({
    onSuccess: () => {
      toast.success(t("تمت إضافة جهة الاتصال بنجاح", "Contact added successfully"));
      (utils as any).contacts.list.invalidate();
      (utils as any).finance.dashboard.invalidate();
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateMut = (trpc as any).contacts.update.useMutation({
    onSuccess: () => {
      toast.success(t("تم تحديث البيانات بنجاح", "Contact updated successfully"));
      (utils as any).contacts.list.invalidate();
      setDialogOpen(false);
      resetForm();
    },
  });

  const delMut = (trpc as any).contacts.delete.useMutation({
    onSuccess: () => {
      toast.success(t("تم حذف جهة الاتصال", "Contact deleted"));
      (utils as any).contacts.list.invalidate();
    },
  });

  const resetForm = () => {
    setEditing(null);
    setName("");
    setType("customer");
    setPhone("");
    setEmail("");
    setTaxNumber("");
    setBalance("0");
    setCustodyBalance("0");
    setNotes("");
  };

  const handleOpenAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (c: LocalContact) => {
    setEditing(c);
    setName(c.name);
    setType(c.type);
    setPhone(c.phone || "");
    setEmail(c.email || "");
    setTaxNumber(c.taxNumber || "");
    setBalance(String(c.balance || 0));
    setCustodyBalance(String(c.custodyBalance || 0));
    setNotes(c.notes || "");
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      return toast.error(t("الرجاء إدخال الاسم", "Please enter a name"));
    }

    if (editing) {
      updateMut.mutate({
        id: editing.id,
        name,
        type,
        phone,
        email,
        taxNumber,
        balance: Number(balance) || 0,
        custodyBalance: Number(custodyBalance) || 0,
        notes,
      });
    } else {
      createMut.mutate({
        name,
        type,
        phone,
        email,
        taxNumber,
        balance: Number(balance) || 0,
        custodyBalance: Number(custodyBalance) || 0,
        notes,
      });
    }
  };

  const filtered = contacts.filter((c: LocalContact) => {
    if (activeTab === "all") return true;
    return c.type === activeTab;
  });

  const customers = contacts.filter((c: LocalContact) => c.type === "customer");
  const suppliers = contacts.filter((c: LocalContact) => c.type === "supplier");

  const totalCustomerDebts = customers.reduce((s: number, c: LocalContact) => s + (c.balance || 0), 0);
  const totalSupplierDebts = suppliers.reduce((s: number, c: LocalContact) => s + (c.balance || 0), 0);
  const totalCustody = customers.reduce((s: number, c: LocalContact) => s + (c.custodyBalance || 0), 0);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-7 w-7 text-emerald-600" />
              {t("العملاء والموردين", "Customers & Suppliers")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("إدارة حسابات وأرصدة العملاء والموردين والعهد المالية", "Manage accounts, balances, and custodies")}
            </p>
          </div>
          <Button onClick={handleOpenAdd} className="bg-emerald-600 hover:bg-emerald-700 gap-2 h-11 px-5 shadow-sm">
            <Plus className="h-5 w-5" />
            {t("إضافة جهة جديدة", "Add Contact")}
          </Button>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="border-emerald-100 bg-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t("إجمالي العملاء", "Total Customers")}</p>
                <p className="text-2xl font-bold mt-1">{customers.length}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-sky-100 bg-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t("إجمالي الموردين", "Total Suppliers")}</p>
                <p className="text-2xl font-bold mt-1">{suppliers.length}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                <Truck className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 bg-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t("مستحقات على العملاء", "Customer Receivables")}</p>
                <p className="text-xl font-bold text-emerald-600 mt-1" dir="ltr">
                  {formatMoney(totalCustomerDebts)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-rose-100 bg-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t("مستحقات للموردين", "Supplier Payables")}</p>
                <p className="text-xl font-bold text-rose-600 mt-1" dir="ltr">
                  {formatMoney(totalSupplierDebts)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <TrendingDown className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 border-b pb-2">
          <Button
            variant={activeTab === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("all")}
            className={activeTab === "all" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          >
            {t("الكل", "All")} ({contacts.length})
          </Button>
          <Button
            variant={activeTab === "customer" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("customer")}
            className={activeTab === "customer" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          >
            {t("العملاء", "Customers")} ({customers.length})
          </Button>
          <Button
            variant={activeTab === "supplier" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("supplier")}
            className={activeTab === "supplier" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          >
            {t("الموردين", "Suppliers")} ({suppliers.length})
          </Button>
        </div>

        {/* Contacts Table / Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c: LocalContact) => {
            const isCustomer = c.type === "customer";
            return (
              <Card key={c.id} className="hover:shadow-md transition-shadow relative overflow-hidden border">
                <div
                  className={`absolute top-0 inset-x-0 h-1.5 ${
                    isCustomer ? "bg-emerald-500" : "bg-sky-500"
                  }`}
                />
                <CardHeader className="pt-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isCustomer
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-sky-100 text-sky-800"
                        }`}
                      >
                        {isCustomer ? <Users className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold leading-tight">{c.name}</CardTitle>
                        <span
                          className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-medium mt-1 ${
                            isCustomer
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-sky-50 text-sky-700 border border-sky-200"
                          }`}
                        >
                          {isCustomer ? t("عميل", "Customer") : t("مورد", "Supplier")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => handleOpenEdit(c)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-rose-500 hover:bg-rose-50"
                        onClick={() => {
                          if (confirm(t("هل أنت متأكد من الحذف؟", "Are you sure you want to delete?"))) {
                            delMut.mutate({ id: c.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-2 text-sm">
                  <div className="bg-muted/40 p-2.5 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{isCustomer ? t("الرصيد المستحق (لنا)", "Receivable") : t("الرصيد المستحق (له)", "Payable")}</span>
                      <span className="font-bold text-foreground text-sm" dir="ltr">
                        {formatMoney(c.balance || 0)}
                      </span>
                    </div>
                    {c.custodyBalance ? (
                      <div className="flex items-center justify-between text-xs text-emerald-600 font-medium">
                        <span>{t("رصيد العهدة المستلمة:", "Custody Balance:")}</span>
                        <span dir="ltr">{formatMoney(c.custodyBalance)}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    {c.phone ? (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground/70" />
                        <span dir="ltr">{c.phone}</span>
                      </div>
                    ) : null}
                    {c.email ? (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground/70" />
                        <span>{c.email}</span>
                      </div>
                    ) : null}
                    {c.taxNumber ? (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground/70" />
                        <span>{t("الضريبي: ", "Tax ID: ")}{c.taxNumber}</span>
                      </div>
                    ) : null}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs gap-1.5 border-dashed"
                    onClick={() => setStatementContact(c)}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {t("كشف حساب مختصر", "Account Statement")}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filtered.length === 0 && !isLoading && (
          <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-muted/20">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="font-medium">{t("لا توجد جهات اتصال مسجلة بعد", "No contacts registered yet")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("اضغط زر إضافة جهة جديدة لإضافة أول عميل أو مورد", "Click 'Add Contact' to add your first client or supplier")}
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("تعديل بيانات الجهة", "Edit Contact") : t("إضافة عميل أو مورد جديد", "Add New Contact")}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>{t("النوع", "Type")}</Label>
              <Select value={type} onValueChange={(val: any) => setType(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">{t("عميل (Customer)", "Customer")}</SelectItem>
                  <SelectItem value="supplier">{t("مورد (Supplier)", "Supplier")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("الاسم الكامل / اسم المنشأة", "Full Name / Company Name")} *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("مثال: شركة الأفق للتجارة", "e.g. Apex Trading Co.")}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("رقم الهاتف / الجوال", "Phone Number")}</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05xxxxxxxx"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t("الرقم الضريبي", "Tax / VAT ID")}</Label>
                <Input
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                  placeholder="300xxxxxxxxx"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("البريد الإلكتروني", "Email Address")}</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@company.com"
                dir="ltr"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("الرصيد الافتتاحي (ر.س)", "Opening Balance")}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t("رصيد العهدة المستلمة", "Custody Balance")}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={custodyBalance}
                  onChange={(e) => setCustodyBalance(e.target.value)}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("ملاحظات إضافية", "Notes")}</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("أي تفاصيل أو بنود اتفاق...", "Any details...")}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t("إلغاء", "Cancel")}
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                {editing ? t("حفظ التعديلات", "Save Changes") : t("إضافة الآن", "Add Now")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Account Statement Dialog */}
      <Dialog open={!!statementContact} onOpenChange={(open) => !open && setStatementContact(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              {t("كشف حساب", "Account Statement")}: {statementContact?.name}
            </DialogTitle>
          </DialogHeader>

          {statementContact && (
            <div className="space-y-4 pt-2">
              <div className="p-3 bg-muted/40 rounded-xl space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("نوع الحساب:", "Type:")}</span>
                  <span className="font-semibold">
                    {statementContact.type === "customer" ? t("عميل معتمد", "Customer") : t("مورد خدمات", "Supplier")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("الرصيد القائم:", "Current Balance:")}</span>
                  <span className="font-bold text-emerald-600" dir="ltr">
                    {formatMoney(statementContact.balance)}
                  </span>
                </div>
                {statementContact.custodyBalance ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("عهدة مالية مستلمة:", "Custody Received:")}</span>
                    <span className="font-bold text-sky-600" dir="ltr">
                      {formatMoney(statementContact.custodyBalance)}
                    </span>
                  </div>
                ) : null}
                {statementContact.taxNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("الرقم الضريبي:", "Tax ID:")}</span>
                    <span dir="ltr">{statementContact.taxNumber}</span>
                  </div>
                )}
              </div>

              <div className="border rounded-xl p-3 text-xs space-y-1.5 text-muted-foreground">
                <p className="font-semibold text-foreground">{t("ملاحظات وسجل الحركة:", "Notes & History:")}</p>
                <p>{statementContact.notes || t("لا توجد ملاحظات مسجلة على هذا الحساب.", "No notes registered.")}</p>
                <p className="text-[11px] pt-1 border-t">{t("تاريخ التسجيل بالمنظومة: ", "Created: ")}{statementContact.createdAt}</p>
              </div>

              <Button
                onClick={() => {
                  window.print();
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {t("طباعة كشف الحساب 🖨️", "Print Statement 🖨️")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
