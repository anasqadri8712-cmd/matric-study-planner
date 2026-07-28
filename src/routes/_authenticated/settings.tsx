import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Moon, ShieldCheck, Sun } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/lib/theme";
import { useSession } from "@/lib/session";
import { friendlyAuthError } from "@/lib/validation";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings | AI Study Planner" },
      { name: "description", content: "Switch between dark and light mode, reset your password or sign out." },
      { property: "og:title", content: "Settings" },
      { property: "og:description", content: "Theme, account and security settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isDark = theme === "dark";

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function sendReset() {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(friendlyAuthError(error.message));
    else toast.success("Password reset link sent to your email.");
  }

  return (
    <AppShell>
      <PageHeader title="Settings" subtitle="Make the app yours" />

      <section className="surface-card animate-rise flex items-center gap-4 p-5">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
          {isDark ? <Moon className="size-5" /> : <Sun className="size-5" />}
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold">Dark mode</p>
          <p className="text-xs text-muted-foreground">Pure black, easy on late-night eyes</p>
        </div>
        <Switch checked={isDark} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
      </section>

      <section className="surface-card animate-rise mt-3 p-5">
        <div className="flex items-center gap-4">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <ShieldCheck className="size-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold">Password</p>
            <p className="text-xs text-muted-foreground">Send a secure reset link to {user?.email}</p>
          </div>
        </div>
        <Button variant="outline" onClick={sendReset} className="press mt-4 h-11 w-full rounded-xl">
          Send reset link
        </Button>
      </section>

      <Button
        variant="outline"
        onClick={signOut}
        className="press mt-6 h-12 w-full rounded-2xl text-destructive"
      >
        <LogOut className="mr-1 size-4" /> Log out
      </Button>

      <p className="mt-6 text-center text-xs text-muted-foreground">AI Study Planner • Built for matric students</p>
    </AppShell>
  );
}
