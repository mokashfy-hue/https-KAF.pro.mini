import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/providers/trpc";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Lock,
  UserPlus,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ClientSwitcherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientSwitcherDialog({ open, onOpenChange }: ClientSwitcherDialogProps) {
  const { isRtl, t } = useLanguage();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const [activeTab, setActiveTab] = useState<"switch" | "register">("switch");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [pin, setPin] = useState("1234");

  // Register new client state
  const [newName, setNewName] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPin, setNewPin] = useState("1234");

  // Queries
  const { data: clientsList = [] } = (trpc as any).auth.clients.list.useQuery();
  const { data: activeInfo } = (trpc as any).auth.clients.getActive.useQuery();

  // Mutations
  const switchMutation = (trpc as any).auth.clients.switch.useMutation({
    onSuccess: (data: any) => {
      toast.success(t(`تم الانتقال إلى مساحة العمل الخاصة: ${data.client.name}`, `Switched to ${data.client.name}`));
      utils.invalidate();
      onOpenChange(false);
      // reload to refresh all caches and states cleanly
      setTimeout(() => window.location.reload(), 300);
    },
    onError: (err: any) => {
      toast.error(err.message || t("رمز المرور غير صحيح", "Invalid PIN"));
    },
  });

  const registerMutation = (trpc as any).auth.clients.register.useMutation({
    onSuccess: (data: any) => {
      toast.success(t(`تم تسجيل العميل الجديد (${data.client.name}) ومساحته المعزولة!`, "New client registered!"));
      utils.invalidate();
      onOpenChange(false);
      setTimeout(() => window.location.reload(), 300);
    },
    onError: (err: any) => {
      toast.error(err.message || t("حدث خطأ أثناء التسجيل", "Registration error"));
    },
  });

  const handleSwitchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      toast.error(t("يرجى اختيار العميل أولاً", "Please select a client"));
      return;
    }
    switchMutation.mutate({
      clientId: selectedClientId,
      pin: pin.trim(),
    });
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error(t("يرجى إدخال اسم المنشأة / العميل", "Please enter client name"));
      return;
    }
    registerMutation.mutate({
      name: newName.trim(),
      ownerName: newOwner.trim() || newName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim(),
      pin: newPin.trim() || "1234",
    });
  };

  const currentClientId = activeInfo?.clientId || "client_main";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6" dir={isRtl ? "rtl" : "ltr"}>
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-600" />
            <span>{t("مساحات عمل العملاء والخصوصية", "Client Workspaces & Privacy")}</span>
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(
              "كل عميل يمتلك قاعدة بيانات خاصة ومستقلة تماماً لحساباته وسنداته وقيوده.",
              "Each client has their own isolated private database."
            )}
          </p>
        </DialogHeader>

        {/* Tab Toggle */}
        <div className="flex rounded-xl bg-muted p-1 my-1">
          <button
            type="button"
            onClick={() => setActiveTab("switch")}
            className={cn(
              "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
              activeTab === "switch" ? "bg-emerald-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("تبديل مساحة العميل", "Switch Workspace")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("register")}
            className={cn(
              "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
              activeTab === "register" ? "bg-emerald-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("+ تسجيل عميل جديد", "+ New Client")}
          </button>
        </div>

        {activeTab === "switch" ? (
          <form onSubmit={handleSwitchSubmit} className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label className="text-xs font-bold">{t("اختر حساب العميل المطلوب:", "Select Client:")}</Label>
              <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto pr-1">
                {clientsList.map((c: any) => {
                  const isCurrent = c.id === currentClientId;
                  const isSelected = selectedClientId ? selectedClientId === c.id : isCurrent;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedClientId(c.id)}
                      className={cn(
                        "p-3 rounded-xl border text-right cursor-pointer transition-all flex items-center justify-between",
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/70 shadow-xs"
                          : "hover:bg-accent border-border"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                          {c.code?.slice(0, 3)}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                            <span>{c.name}</span>
                            {isCurrent && (
                              <Badge variant="outline" className="text-[10px] bg-emerald-100 text-emerald-800 border-emerald-300 py-0">
                                {t("الحالي", "Active")}
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {c.ownerName} ({c.code})
                          </div>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">{t("رمز المرور (PIN):", "Client PIN:")}</Label>
              <Input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="1234"
                className="h-10 font-mono tracking-widest text-center"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  navigate("/login");
                }}
                className="gap-1.5 text-xs text-rose-600"
              >
                <LogOut className="h-3.5 w-3.5" />
                {t("قفل وخروج", "Lock & Exit")}
              </Button>
              <Button
                type="submit"
                disabled={switchMutation.isPending}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10"
              >
                <Lock className="h-4 w-4 mr-1" />
                {switchMutation.isPending ? t("جاري التحويل...", "Switching...") : t("الانتقال لمساحة العميل", "Switch Workspace")}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-3 pt-1">
            <div>
              <Label className="text-xs font-bold">{t("اسم المنشأة / العميل *", "Company / Client Name *")}</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="مثال: شركة التطوير الحديث"
                required
                className="mt-1 h-9"
              />
            </div>

            <div>
              <Label className="text-xs font-bold">{t("اسم المسؤول *", "Owner Name *")}</Label>
              <Input
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                placeholder="مثال: خالد المنصور"
                required
                className="mt-1 h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-bold">{t("رقم الجوال", "Phone")}</Label>
                <Input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">{t("رمز المرور (PIN) *", "PIN *")}</Label>
                <Input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="1234"
                  required
                  className="mt-1 h-9 font-mono tracking-widest text-center"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 mt-2"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              {registerMutation.isPending ? t("جاري الإنشاء...", "Registering...") : t("إنشاء وتفعيل المساحة الخاصة فوراً", "Create Private Workspace")}
            </Button>
          </form>
        )}

        <div className="border-t pt-3 text-[11px] text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{t("جميع السجلات والحركات المالية تظل معزولة تماماً في مساحة العميل.", "All financial records remain strictly isolated to this client.")}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
