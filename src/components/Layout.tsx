import { useAuth } from "@/hooks/useAuth";
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
  { path: "/", label: "الرئيسية", icon: Home },
  { path: "/transactions", label: "الحركات", icon: Receipt },
  { path: "/journal", label: "القيود", icon: BookOpen },
  { path: "/accounts", label: "الحسابات", icon: Wallet },
  { path: "/settings", label: "الإعدادات", icon: Settings },
];

export default function Layout({
  children,
  onAdd,
}: {
  children: ReactNode;
  onAdd?: () => void;
}) {
  const { user, isLoading, logout } = useAuth();
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
        <Avatar className="h-9 w-9 border">
          <AvatarImage src={user.avatar ?? undefined} />
          <AvatarFallback>{user.name?.slice(0, 1) ?? "م"}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => logout()} className="gap-2">
          <LogOut className="h-4 w-4" /> تسجيل الخروج
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b">
        <div className="max-w-3xl lg:max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              ك
            </div>
            <span className="font-bold text-lg">كاف برو (KAF PRO)</span>
          </div>
          {UserMenu}
        </div>
      </header>

      <div className="max-w-3xl lg:max-w-6xl mx-auto lg:flex lg:flex-row-reverse lg:gap-6">
        {/* Desktop side nav (right side in RTL) */}
        <aside className="hidden lg:block w-56 shrink-0 py-6">
          <nav className="sticky top-20 space-y-1">
            {NAV.map((item) => {
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl px-4 h-11 text-sm transition-colors",
                    active
                      ? "bg-emerald-600 text-white font-semibold"
                      : "hover:bg-accent text-muted-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
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
          {NAV.slice(0, 2).map((item) => (
            <MobileNavItem key={item.path} item={item} active={location.pathname === item.path} />
          ))}
          <div className="flex justify-center">
            <button
              onClick={onAdd ?? (() => navigate("/transactions?add=1"))}
              className="h-14 w-14 -mt-8 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center active:scale-95 transition-transform"
              aria-label="إضافة حركة"
            >
              <Plus className="h-7 w-7" />
            </button>
          </div>
          {NAV.slice(2).map((item) => (
            <MobileNavItem key={item.path} item={item} active={location.pathname === item.path} />
          ))}
        </div>
      </nav>
    </div>
  );
}

function MobileNavItem({
  item,
  active,
}: {
  item: (typeof NAV)[number];
  active: boolean;
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
      {item.label}
    </button>
  );
}
