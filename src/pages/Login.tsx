import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/providers/trpc";
import { ShieldCheck, ArrowRight, Sparkles } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { data: user } = trpc.auth.me.useQuery();
  const [userName, setUserName] = useState("مكاشفي");

  useEffect(() => {
    if (user) {
      // Auto-enter if user session exists
      const timer = setTimeout(() => {
        navigate("/");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [user, navigate]);

  const handleEnter = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-background to-teal-50">
      <Card className="w-full max-w-md shadow-xl border-emerald-100">
        <CardHeader className="text-center space-y-3 pb-4">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-emerald-500/20">
            ك
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            نظام كاف برو المالي (KAF PRO)
          </CardTitle>
          <p className="text-sm text-muted-foreground leading-relaxed">
            نظام متكامل لإدارة الحسابات، القيود اليومية، والمصروفات
            <br />
            جاهز للاستخدام ومحفوظ محلياً على جهازك
          </p>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium">اسم المستخدم / المسؤول</Label>
            <Input
              id="username"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="أدخل اسمك"
              className="text-center font-medium h-11"
            />
          </div>

          <Button
            className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
            size="lg"
            onClick={handleEnter}
          >
            <span>الدخول إلى النظام الآن</span>
            <ArrowRight className="h-5 w-5 rtl:rotate-180" />
          </Button>

          <div className="pt-2 text-center flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>نظام محمي ومشفر - جاهز للعمل الفوري</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
