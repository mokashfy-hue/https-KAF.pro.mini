import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { LOGIN_PATH } from "@/const";
import { cn } from "@/lib/utils";
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
} from "lucide-react";
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const NAV = [
  { path: "/", arLabel: "الرئيسية", enLabel: "Dashboard", icon: Home },
  { path: "/vouchers", arLabel: "سندات القبض والصرف", enLabel: "Vouchers", icon: FileText },
  { path: "/transactions", arLabel: "الحركات", enLabel: "Transactions", icon: Receipt },
  { path: "/journal", arLabel: "القيود", enLabel: "Journal", icon: BookOpen },
  { path: "/accounts", arLabel: "الحسابات", enLabel: "Accounts", icon: Wallet },
  { path: "/contacts", arLabel: "العملاء والموردين", enLabel: "Contacts", icon: Users },
  { path: "/reports", arLabel: "التقارير المالية", enLabel: "Reports", icon: FileSpreadsheet },
  { path: "/settings", arLabel: "بيانات الشركة", enLabel: "Settings", icon: Settings },
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
        <div className="max-w-3xl lg:max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-emerald-600/30">
              ك
            </div>
            <span className="font-bold text-lg tracking-tight">كاف برو (KAF PRO)</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-card hover:bg-accent text-xs font-semibold transition-colors shadow-sm"
              title={isRtl ? "Switch to English (Left side menu)" : "التبديل إلى العربية (القائمة يمين)"}
            >
              <Globe className="h-4 w-4 text-emerald-600" />
              <span>{lang === "ar" ? "English" : "عربي"}</span>
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

      {/* Mobile bottom nav */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t"
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
              className="h-14 w-14 -mt-8 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center active:scale-95 transition-transform"
              aria-label={t("إضافة حركة", "Add Transaction")}
            >
              <Plus className="h-7 w-7" />
            </button>
          </div>
          <MobileNavItem
            item={NAV[4]}
            active={location.pathname === NAV[4].path}
            label={t(NAV[4].arLabel, NAV[4].enLabel)}
          />
          <MobileNavItem
            item={NAV[5]}
            active={location.pathname === NAV[5].path}
            label={t(NAV[5].arLabel, NAV[5].enLabel)}
          />
        </div>
      </nav>
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
