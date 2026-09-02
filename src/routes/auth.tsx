import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { LogoLockup } from "@/components/app/Logo";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session";
import {
  friendlyAuthError,
  passwordStrength,
  validateEmail,
  validateLoginPassword,
  validateName,
  validateSignupPassword,
} from "@/lib/validation";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Login or Sign Up | AI Study Planner" },
      {
        name: "description",
        content: "Create your free student account to unlock AI study plans, quizzes and progress tracking.",
      },
      { property: "og:title", content: "Login or Sign Up | AI Study Planner" },
      { property: "og:description", content: "Create your free matric student account in seconds." },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "signup" | "forgot";
type Errors = Record<string, string | undefined>;

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const [mode, setMode] = useState<Mode>("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState(() =>
    typeof window === "undefined" ? "" : (localStorage.getItem("sp-remember-email") ?? ""),
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/home", replace: true });
  }, [loading, session, navigate]);

  const strength = passwordStrength(password);

  function switchMode(next: Mode) {
    setMode(next);
    setErrors({});
    setPassword("");
    setConfirm("");
  }

  async function handleLogin() {
    const next: Errors = {
      email: validateEmail(email) ?? undefined,
      password: validateLoginPassword(password) ?? undefined,
    };
    setErrors(next);
    if (next.email || next.password) return;

    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      toast.error(friendlyAuthError(error.message));
      return;
    }
    if (remember) localStorage.setItem("sp-remember-email", email.trim());
    else localStorage.removeItem("sp-remember-email");
    toast.success("Welcome back!");
    navigate({ to: "/home", replace: true });
  }

  async function handleSignup() {
    const next: Errors = {
      name: validateName(name) ?? undefined,
      email: validateEmail(email) ?? undefined,
      password: validateSignupPassword(password) ?? undefined,
      confirm: password !== confirm ? "Passwords do not match." : undefined,
    };
    setErrors(next);
    if (next.name || next.email || next.password || next.confirm) return;

    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name.trim() },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(friendlyAuthError(error.message));
      return;
    }
    toast.success("🎉 Your account has been created successfully.");
    navigate({ to: "/home", replace: true });
  }

  async function handleForgot() {
    const emailError = validateEmail(email);
    setErrors({ email: emailError ?? undefined });
    if (emailError) return;
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error(friendlyAuthError(error.message));
      return;
    }
    toast.success("Recovery link sent. Please check your inbox.");
    switchMode("login");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "login") void handleLogin();
    else if (mode === "signup") void handleSignup();
    else void handleForgot();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-96 opacity-80"
        style={{
          background:
            "radial-gradient(70% 100% at 50% 0%, color-mix(in oklab, var(--primary) 20%, transparent), transparent 70%)",
        }}
      />
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-10">
        <Link
          to="/"
          className="press glass-panel absolute top-6 left-6 inline-flex size-10 items-center justify-center rounded-xl text-muted-foreground"
          aria-label="Back to welcome"
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} />
        </Link>

        <div className="glass-panel animate-rise elevated-shadow p-7 sm:p-8">
          <div className="flex justify-center">
            <LogoLockup />
          </div>

          <h1 className="mt-6 text-center font-display text-2xl font-bold tracking-tight">
            {mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset password"}
          </h1>
          <p className="mt-1.5 text-center text-sm text-muted-foreground">
            {mode === "login"
              ? "Log in to continue your matric preparation."
              : mode === "signup"
                ? "Join thousands of Class 9 & 10 students studying smarter."
                : "We will email you a secure link to set a new password."}
          </p>

          {mode !== "forgot" ? (
            <div className="mt-6 grid grid-cols-2 gap-1 rounded-2xl border border-border bg-card p-1">
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={cn(
                    "press rounded-xl py-2.5 text-sm font-semibold transition-colors",
                    mode === m ? "gradient-primary text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  {m === "login" ? "Login" : "Sign Up"}
                </button>
              ))}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {mode === "signup" ? (
              <Field label="Full name" error={errors.name}>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Muhammad Anas"
                  autoComplete="name"
                  className="h-12 rounded-xl"
                />
              </Field>
            ) : null}

            <Field label="Email address" error={errors.email}>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@gmail.com"
                  autoComplete="email"
                  className="h-12 rounded-xl pl-10"
                />
              </div>
            </Field>

            {mode !== "forgot" ? (
              <Field label="Password" error={errors.password}>
                <div className="relative">
                  <Input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className="h-12 rounded-xl pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? "Hide password" : "Show password"}
                    className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground"
                  >
                    {show ? <EyeOff className="size-4" strokeWidth={1.75} /> : <Eye className="size-4" strokeWidth={1.75} />}
                  </button>
                </div>
              </Field>
            ) : null}

            {mode === "signup" && password ? (
              <div className="space-y-1.5">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      strength.label === "Weak"
                        ? "bg-destructive"
                        : strength.label === "Medium"
                          ? "bg-warning"
                          : "bg-success",
                    )}
                    style={{ width: `${strength.score}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Password strength: {strength.label}</p>
              </div>
            ) : null}

            {mode === "signup" ? (
              <Field label="Confirm password" error={errors.confirm}>
                <Input
                  type={show ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className="h-12 rounded-xl"
                />
              </Field>
            ) : null}

            {mode === "login" ? (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox checked={remember} onCheckedChange={(v) => setRemember(v === true)} />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="text-sm font-semibold text-primary"
                >
                  Forgot password?
                </button>
              </div>
            ) : null}

            <Button type="submit" disabled={busy} className="press glow-shadow h-13 w-full rounded-2xl text-base">
              {busy
                ? "Please wait..."
                : mode === "login"
                  ? "Login"
                  : mode === "signup"
                    ? "Create account"
                    : "Send recovery link"}
            </Button>

            {mode === "forgot" ? (
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-full rounded-2xl"
                onClick={() => switchMode("login")}
              >
                Back to login
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full rounded-2xl"
                onClick={() => switchMode(mode === "login" ? "signup" : "login")}
              >
                {mode === "login" ? "Create New Account" : "I already have an account"}
              </Button>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      {children}
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
