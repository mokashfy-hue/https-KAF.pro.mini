import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { LOGIN_PATH } from "@/const";
import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Home,
  LogOut,
  Plus,
  Settings,
  Wallet,
  Receipt,
  Globe,
  Users,
  FileSpreadsheet,
  FileText,
  Smartphone,
  Building2,
  Menu,
  ShieldCheck,
  ChevronRight,
  Layers,
} from "lucide-react";
import { InstallOfflineDialog } from "@/components/InstallOfflineDialog";
import { ClientSwitcherDialog } from "@/components/ClientSwitcherDialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const NAV = [
  { path: "/", arLabel: "الرئيسية", enLabel: "Dashboard", icon: Home, descAr: "لوحة المؤشرات والملخص المالي", descEn: "Overview & key metrics" },
  { path: "/vouchers", arLabel: "سندات القبض والصرف", enLabel: "Vouchers", icon: FileText, descAr: "إصدار وطباعة سندات القبض والصرف", descEn: "Payment & receipt vouchers" },
  { path: "/transactions", arLabel: "الحركات المالية", enLabel: "Transactions", icon: Receipt, descAr: "سجل العمليات والإيرادات والمصروفات", descEn: "Income & expense records" },
  { path: "/journal", arLabel: "قيود اليومية", enLabel: "Journal", icon: BookOpen, descAr: "القيود المزدوجة وموازينها وترحيلها", descEn: "Double-entry journal records" },
  { path: "/accounts", arLabel: "دليل الحسابات", enLabel: "Accounts", icon: Wallet, descAr: "شجرة الحسابات والأرصدة والتحويلات", descEn: "Chart of accounts & balances" },
  { path: "/contacts", arLabel: "العملاء والموردين", enLabel: "Contacts", icon: Users, descAr: "إدارة بيانات وأرصدة العملاء والموردين", descEn: "Customers & suppliers directory" },
  { path: "/reports", arLabel: "التقارير المالية", enLabel: "Reports", icon: FileSpreadsheet, descAr: "ميزان المراجعة، الأرباح والميزانية", descEn: "Trial balance, P&L, balance sheet" },
  { path: "/settings", arLabel: "بيانات المنشأة", enLabel: "Settings", icon: Settings, descAr: "معلومات الشركة، السجل التجاري والضريبة", descEn: "Company info, CR & tax IDs" },
];

export default function Layout({
  children,
  onAdd,
}: {
  children: ReactNode;
  onAdd?: () => void;
}) {
  const { user, isLoading, logout } = useAuth();
  const { lang, isRtl, toggleLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const [clientSwitcherOpen, setClientSwitcherOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 space-y-4 max-w-3xl mx-auto">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!user) {
    navigate(LOGIN_PATH);
    return null;
  }

  const UserMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        <Avatar className="h-9 w-9 border cursor-pointer hover:ring-2 hover:ring-emerald-500/30 transition-all">
          <AvatarImage src={user.avatar ?? undefined} />
          <AvatarFallback className="bg-emerald-100 text-emerald-800 font-bold">
            {user.name?.slice(0, 1) ?? "م"}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isRtl ? "start" : "end"}>
        <DropdownMenuItem onClick={() => setClientSwitcherOpen(true)} className="gap-2 text-emerald-700 font-semibold">
          <Building2 className="h-4 w-4" /> {t("تبديل مساحة العميل", "Switch Client Workspace")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => logout()} className="gap-2 text-rose-600 focus:text-rose-600">
          <LogOut className="h-4 w-4" /> {t("تسجيل الخروج", "Log Out")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen bg-background text-foreground" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b">
        <div className="max-w-3xl lg:max-w-6xl mx-auto flex items-center justify-between px-3 sm:px-4 h-14">
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-accent text-foreground flex items-center justify-center transition-colors active:scale-95"
              aria-label={t("قائمة الوحدات", "Modules Menu")}
            >
              <Menu className="h-5 w-5 text-foreground" />
            </button>

            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-sm shadow-emerald-600/30 shrink-0">
              ك
            </div>
            <span className="font-bold text-sm sm:text-lg tracking-tight shrink-0">كاف برو</span>

            {/* Client Private Workspace Badge - visible on ALL screen sizes */}
            <button
              onClick={() => setClientSwitcherOpen(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs font-semibold transition-all cursor-pointer mr-1 sm:mr-2 active:scale-95"
              title={t("مساحة عمل العميل الخاصة - اضغط للتبديل", "Private client workspace - click to switch")}
            >
              <Building2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="font-bold text-emerald-950 max-w-[70px] sm:max-w-[140px] truncate">
                {(user as any)?.clientName || user?.name || "مساحة العميل"}
              </span>
              <span className="text-[10px] bg-white text-emerald-800 px-1 py-0.2 rounded border border-emerald-300 font-mono shrink-0">
                🔒 خاص
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Install / Download App Button */}
            <button
              onClick={() => setInstallDialogOpen(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all shadow-xs active:scale-95"
              title={t("تثبيت التطبيق على الجوال أو الكمبيوتر أو تحميل النسخة المحلية", "Install app or download offline version")}
            >
              <Smartphone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-700" />
              <span className="hidden sm:inline">{t("تحميل / تثبيت التطبيق", "Install / Download")}</span>
              <span className="sm:hidden text-[11px]">{t("تثبيت", "Install")}</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl border bg-card hover:bg-accent text-xs font-semibold transition-colors shadow-sm"
              title={isRtl ? "Switch to English" : "التبديل إلى العربية"}
            >
              <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
              <span className="text-[11px] sm:text-xs">{lang === "ar" ? "EN" : "عربي"}</span>
            </button>
            {UserMenu}
          </div>
        </div>
      </header>

      {/* Main Container: in RTL aside is on RIGHT, in LTR aside is on LEFT */}
      <div className="max-w-3xl lg:max-w-6xl mx-auto lg:flex lg:gap-6">
        {/* Desktop side nav: naturally follows document direction */}
        <aside className="hidden lg:block w-56 shrink-0 py-6">
          <nav className="sticky top-20 space-y-1">
            {NAV.map((item) => {
              const active = location.pathname === item.path;
              const label = t(item.arLabel, item.enLabel);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl px-4 h-11 text-sm transition-colors",
                    active
                      ? "bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-600/20"
                      : "hover:bg-accent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 px-4 pt-4 pb-28 lg:pb-10 min-w-0">{children}</main>
      </div>

      {/* Mobile Drawer (Sheet) listing ALL Units on mobile */}
      <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <SheetContent side={isRtl ? "right" : "left"} className="w-[85vw] max-w-sm p-0 flex flex-col">
          <SheetHeader className="p-4 border-b bg-muted/30">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                ك
              </div>
              <div className="text-right">
                <SheetTitle className="text-base font-bold">كاف برو المحاسبي</SheetTitle>
                <div className="text-xs text-muted-foreground">KAF PRO Cloud & Local ERP</div>
              </div>
            </div>

            {/* Active Client Workspace Info inside Mobile Drawer */}
            <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="min-w-0 pr-1 text-right">
                <div className="text-[11px] text-emerald-700 font-medium">العميل الحالي (مساحة خاصة):</div>
                <div className="font-bold text-xs sm:text-sm text-emerald-950 truncate">
                  {(user as any)?.clientName || user?.name}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  setClientSwitcherOpen(true);
                }}
                className="h-7 text-xs bg-white border-emerald-300 text-emerald-800 shrink-0 font-bold"
              >
                تبديل
              </Button>
            </div>
          </SheetHeader>

          {/* List of ALL Units */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">
              {t("جميع وحدات وأقسام النظام", "All System Modules")}
            </div>

            {NAV.map((item) => {
              const active = location.pathname === item.path;
              const label = t(item.arLabel, item.enLabel);
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileDrawerOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl text-sm transition-all text-right",
                    active
                      ? "bg-emerald-600 text-white font-bold shadow-sm"
                      : "hover:bg-accent text-foreground hover:text-foreground border border-transparent hover:border-border"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                        active ? "bg-white/20 text-white" : "bg-muted text-emerald-600"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-xs sm:text-sm">{label}</div>
                      <div className={cn("text-[11px]", active ? "text-white/80" : "text-muted-foreground")}>
                        {t(item.descAr, item.descEn)}
                      </div>
                    </div>
                  </div>
                  {active && (
                    <span className="text-[10px] bg-white text-emerald-800 px-1.5 py-0.5 rounded font-bold shrink-0">
                      نشط
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-3 border-t bg-muted/20 space-y-2">
            <button
              onClick={() => {
                setMobileDrawerOpen(false);
                setInstallDialogOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold active:scale-95 transition-transform"
            >
              <Smartphone className="h-4 w-4 text-emerald-600" />
              <span>{t("تحميل / تثبيت التطبيق والنسخة المحلية", "Install / Download App")}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={toggleLanguage}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl border bg-card text-xs font-semibold"
              >
                <Globe className="h-3.5 w-3.5 text-emerald-600" />
                <span>{lang === "ar" ? "English" : "عربي"}</span>
              </button>
              <button
                onClick={() => logout()}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold"
              >
                <LogOut className="h-3.5 w-3.5 text-rose-600" />
                <span>{t("خروج", "Log Out")}</span>
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile bottom nav: 4 primary shortcuts + All Modules button */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t shadow-lg"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-5 h-16 items-center">
          <MobileNavItem
            item={NAV[0]}
            active={location.pathname === NAV[0].path}
            label={t(NAV[0].arLabel, NAV[0].enLabel)}
          />
          <MobileNavItem
            item={NAV[1]}
            active={location.pathname === NAV[1].path}
            label={t(NAV[1].arLabel, NAV[1].enLabel)}
          />
          <div className="flex justify-center">
            <button
              onClick={onAdd ?? (() => navigate("/transactions?add=1"))}
              className="h-14 w-14 -mt-8 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center active:scale-95 transition-transform ring-4 ring-background"
              aria-label={t("إضافة حركة", "Add Transaction")}
            >
              <Plus className="h-7 w-7" />
            </button>
          </div>
          <MobileNavItem
            item={NAV[6]}
            active={location.pathname === NAV[6].path}
            label={t(NAV[6].arLabel, NAV[6].enLabel)}
          />
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 h-full min-h-[44px] text-[11px] text-muted-foreground hover:text-emerald-600 transition-colors"
          >
            <div className="relative">
              <Menu className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-600 ring-2 ring-background animate-pulse" />
            </div>
            <span className="font-bold text-foreground">{t("كل الوحدات", "All Units")}</span>
          </button>
        </div>
      </nav>

      {/* Install & Offline Package Dialog */}
      <InstallOfflineDialog open={installDialogOpen} onOpenChange={setInstallDialogOpen} />
      <ClientSwitcherDialog open={clientSwitcherOpen} onOpenChange={setClientSwitcherOpen} />
    </div>
  );
}

function MobileNavItem({
  item,
  active,
  label,
}: {
  item: (typeof NAV)[number];
  active: boolean;
  label: string;
}) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(item.path)}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 h-full min-h-[44px] text-[11px]",
        active ? "text-emerald-600 font-semibold" : "text-muted-foreground",
      )}
    >
      <item.icon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  );
}
