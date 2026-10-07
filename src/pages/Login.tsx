import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-emerald-50 to-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl font-bold">
            م
          </div>
          <CardTitle className="text-2xl">مكاشفي</CardTitle>
          <p className="text-sm text-muted-foreground leading-relaxed">
            نظامك الشخصي البسيط لإدارة مصروفاتك وحساباتك.
            <br />
            بياناتك محفوظة سحابياً وتتبعك على أي جهاز.
          </p>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full h-12 text-base"
            size="lg"
            onClick={() => {
              window.location.href = getOAuthUrl();
            }}
          >
            تسجيل الدخول عبر Kimi
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
