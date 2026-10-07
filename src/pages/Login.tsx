import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/providers/trpc";
import {
  ShieldCheck,
  ArrowRight,
  Building2,
  Lock,
  UserPlus,
  LogIn,
  Users,
  CheckCircle2,
  KeyRound,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Login() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Login form state
  const [selectedClientId, setSelectedClientId] = useState("client_main");
  const [customIdentifier, setCustomIdentifier] = useState("");
  const [pin, setPin] = useState("1234");
  const [useCustomId, setUseCustomId] = useState(false);

  // Register form state
  const [newClientName, setNewClientName] = useState("");
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPin, setNewPin] = useState("1234");
  const [newCurrency, setNewCurrency] = useState("ر.س (SAR)");
  const [newCrNumber, setNewCrNumber] = useState("");
  const [newTaxNumber, setNewTaxNumber] = useState("");

  // Queries
  const { data: clientsList = [] } = (trpc as any).auth.clients.list.useQuery();

  // Mutations
  const loginMutation = (trpc as any).auth.clients.login.useMutation({
    onSuccess: (data: any) => {
      toast.success(`مرحباً بك! تم الدخول إلى مساحة: ${data.client.name}`);
      utils.invalidate();
      navigate("/");
    },
    onError: (err: any) => {
      toast.error(err.message || "فشل تسجيل الدخول، يرجى التأكد من البيانات ورمز المرور");
    },
  });

  const registerMutation = (trpc as any).auth.clients.register.useMutation({
    onSuccess: (data: any) => {
      toast.success(`تم إنشاء حساب ومساحة العمل الخاصة للعميل (${data.client.name}) بنجاح!`);
      utils.invalidate();
      navigate("/");
    },
    onError: (err: any) => {
      toast.error(err.message || "حدث خطأ أثناء تسجيل العميل");
    },
  });

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const identifier = useCustomId ? customIdentifier.trim() : selectedClientId;
    if (!identifier) {
      toast.error("يرجى اختيار العميل أو إدخال كود/بريد العميل");
      return;
    }
    loginMutation.mutate({
      identifier,
      pin: pin.trim(),
    });
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) {
      toast.error("يرجى إدخال اسم المنشأة / العميل");
      return;
    }
    registerMutation.mutate({
      name: newClientName.trim(),
      ownerName: newOwnerName.trim() || newClientName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim(),
      pin: newPin.trim() || "1234",
      currency: newCurrency.trim(),
      crNumber: newCrNumber.trim(),
      taxNumber: newTaxNumber.trim(),
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-background to-teal-50" dir="rtl">
      <Card className="w-full max-w-lg shadow-2xl border-emerald-100 overflow-hidden">
        {/* Header */}
        <CardHeader className="text-center space-y-3 pb-3 bg-gradient-to-b from-white to-muted/20 border-b">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-emerald-500/20">
            ك
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">
              نظام كاف برو المحاسبي (KAF PRO)
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              بوابة العملاء المستقلة — بيانات خاصة ومعزولة 100% لكل عميل
            </p>
          </div>

          {/* Tabs Toggle */}
          <div className="flex rounded-xl bg-muted p-1 max-w-xs mx-auto">
            <button
              type="button"
              onClick={() => setActiveTab("login")}
              className={cn(
                "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                activeTab === "login"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>دخول العميل</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("register")}
              className={cn(
                "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                activeTab === "register"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>تسجيل عميل جديد</span>
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          {activeTab === "login" ? (
            /* ── Tab 1: Client Login ── */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold">اختيار مساحة عمل العميل:</Label>
                  <button
                    type="button"
                    onClick={() => setUseCustomId(!useCustomId)}
                    className="text-xs text-emerald-600 hover:underline font-semibold"
                  >
                    {useCustomId ? "اختيار من القائمة" : "أو إدخال كود العميل يدوياً"}
                  </button>
                </div>

                {!useCustomId ? (
                  <div className="space-y-2">
                    {/* Quick selection list */}
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                      {clientsList.map((c: any) => (
                        <div
                          key={c.id}
                          onClick={() => setSelectedClientId(c.id)}
                          className={cn(
                            "p-3 rounded-xl border text-right cursor-pointer transition-all flex items-center justify-between",
                            selectedClientId === c.id
                              ? "border-emerald-600 bg-emerald-50/70 shadow-xs"
                              : "hover:bg-accent border-border"
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                              {c.code?.slice(0, 3)}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-foreground">{c.name}</div>
                              <div className="text-[11px] text-muted-foreground">
                                المسؤول: {c.ownerName} ({c.code})
                              </div>
                            </div>
                          </div>
                          {selectedClientId === c.id && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <Input
                      value={customIdentifier}
                      onChange={(e) => setCustomIdentifier(e.target.value)}
                      placeholder="أدخل كود العميل (مثال: C-101) أو البريد الإلكتروني"
                      className="h-11 text-sm font-medium"
                      required
                    />
                  </div>
                )}
              </div>

              {/* PIN Code */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold">رمز الحماية / كلمة المرور (PIN):</Label>
                  <span className="text-[11px] text-muted-foreground font-mono">الافتراضي: 1234</span>
                </div>
                <div className="relative">
                  <Input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="رمز المرور (PIN)"
                    className="h-11 font-mono tracking-widest text-center text-lg pr-9"
                    required
                  />
                  <KeyRound className="h-4 w-4 text-muted-foreground absolute right-3 top-3.5" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 gap-2"
              >
                <Lock className="h-4 w-4" />
                <span>{loginMutation.isPending ? "جاري الدخول..." : "الدخول إلى مساحة العميل الخاصة"}</span>
                <ArrowRight className="h-4 w-4 rotate-180" />
              </Button>
            </form>
          ) : (
            /* ── Tab 2: Register New Client ── */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <Label className="text-xs font-bold">اسم المنشأة / العميل *</Label>
                <Input
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="مثال: مؤسسة الأمل للتجارة والمقاولات"
                  required
                  className="mt-1 h-10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold">اسم المسؤول / المالك *</Label>
                  <Input
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    placeholder="مثال: محمد السعيد"
                    required
                    className="mt-1 h-10"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">رقم الجوال</Label>
                  <Input
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    className="mt-1 h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold">البريد الإلكتروني</Label>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="mt-1 h-10"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">رمز الحماية الخاص (PIN) *</Label>
                  <Input
                    type="password"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="مثال: 1234"
                    required
                    className="mt-1 h-10 font-mono tracking-widest text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold">السجل التجاري (اختياري)</Label>
                  <Input
                    value={newCrNumber}
                    onChange={(e) => setNewCrNumber(e.target.value)}
                    placeholder="1010XXXXXX"
                    className="mt-1 h-10"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold">الرقم الضريبي (اختياري)</Label>
                  <Input
                    value={newTaxNumber}
                    onChange={(e) => setNewTaxNumber(e.target.value)}
                    placeholder="3000XXXXXXXX003"
                    className="mt-1 h-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 gap-2 mt-2"
              >
                <Sparkles className="h-4 w-4" />
                <span>
                  {registerMutation.isPending ? "جاري إنشاء الحساب..." : "إنشاء الحساب وتفعيل المساحة الخاصة فوراً"}
                </span>
              </Button>
            </form>
          )}

          {/* Privacy Guarantee Note */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-emerald-800">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>خصوصية تامة وعزل كامل للبيانات (Private Data Isolation)</span>
            </div>
            <p className="text-[11px] text-emerald-700 leading-relaxed">
              كل عميل يتم تخصيص قاعدة بيانات مستقلة له تماماً، بحيث لا يستطيع أي عميل آخر رؤية حساباتك أو قيودك أو سنداتك.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
