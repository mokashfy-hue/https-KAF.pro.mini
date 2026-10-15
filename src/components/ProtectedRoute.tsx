import { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background" dir="rtl">
        <div className="flex flex-col items-center gap-4 p-6 text-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-emerald-500/20 animate-pulse">
            ك
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
            <span>جاري التحقق من جلسة العميل والمساحة المحاسبية...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
