import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Download, Info, Lock, LogOut, Moon, ShieldCheck, Sun, Upload } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/lib/theme";
import { useSession } from "@/lib/session";
import { friendlyAuthError } from "@/lib/validation";
import {
  backupCounts,
  downloadJson,
  exportStudyData,
  restoreStudyData,
  validateBackup,
  type BackupFile,
} from "@/lib/backup";

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
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [busy, setBusy] = useState(false);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function exportData() {
    if (!user) return;
    setBusy(true);
    try {
      const file = await exportStudyData(user.id);
      downloadJson(`study-data-${new Date().toISOString().slice(0, 10)}.json`, file);
      toast.success("Backup downloaded.");
    } catch {
      toast.error("Could not export your study data. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function pickBackup(file?: File) {
    if (!file) return;
    try {
      setPending(validateBackup(JSON.parse(await file.text())));
    } catch {
      toast.error("Unable to restore this backup. Please select a valid study data file.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function confirmRestore() {
    if (!user || !pending) return;
    setBusy(true);
    try {
      const count = await restoreStudyData(user.id, pending);
      await queryClient.invalidateQueries();
      toast.success(`Restored ${count} records into your account.`);
      setPending(null);
    } catch {
      toast.error("Unable to restore this backup. Please select a valid study data file.");
    } finally {
      setBusy(false);
    }
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

      <section className="surface-card animate-rise mt-3 divide-y divide-border p-0">
        <Link to="/about" className="press flex items-center gap-4 p-5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <Info className="size-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold">About Us</p>
            <p className="text-xs text-muted-foreground">What this app is and who it is built for</p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
        <Link to="/privacy-policy" className="press flex items-center gap-4 p-5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <Lock className="size-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold">Privacy Policy</p>
            <p className="text-xs text-muted-foreground">How your study data is stored and protected</p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      </section>

      <Button
        variant="outline"
        onClick={signOut}
        className="press mt-6 h-12 w-full rounded-2xl text-destructive"
      >
        <LogOut className="mr-1 size-4" /> Log out
      </Button>

      <section className="surface-card animate-rise mt-3 p-5">
        <div className="flex items-center gap-4">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <Download className="size-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold">Study data backup</p>
            <p className="text-xs text-muted-foreground">
              Export tasks, notes, progress, plans, exams, subjects and rewards as a JSON file.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={exportData} disabled={busy} className="press h-11 rounded-xl">
            <Download className="mr-1 size-4" /> Export
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={busy} className="press h-11 rounded-xl">
            <Upload className="mr-1 size-4" /> Restore
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => pickBackup(e.target.files?.[0])}
        />
      </section>

      <AlertDialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Restore this backup?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-left">
                <p>
                  This backup will be merged into your account. Records with the same id are updated, everything else is
                  added. Nothing is deleted.
                </p>
                <ul className="text-xs">
                  {pending
                    ? backupCounts(pending).map((c) => (
                        <li key={c.table}>
                          • {c.count} {c.table.replace(/_/g, " ")}
                        </li>
                      ))
                    : null}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestore} disabled={busy} className="rounded-xl">
              {busy ? "Restoring..." : "Restore data"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <p className="mt-6 text-center text-xs text-muted-foreground">AI Study Planner • Built for matric students</p>
    </AppShell>
  );
}
