import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, FileText, Home, ListTodo, User } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EmptyArt } from "@/components/app/EmptyArt";

const NAV = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
  { to: "/tasks", label: "Tasks", icon: ListTodo },
  { to: "/notes", label: "Notes", icon: FileText },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="relative min-h-screen bg-background">
      {/* ambient brand light */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-72 opacity-70"
        style={{
          background:
            "radial-gradient(70% 100% at 50% 0%, color-mix(in oklab, var(--primary) 16%, transparent), transparent 70%)",
        }}
      />
      <div className="mx-auto w-full max-w-lg px-5 pt-7 pb-32 sm:px-7">{children}</div>

      <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
        <ul className="glass-panel mx-auto grid max-w-lg grid-cols-5 rounded-3xl px-1.5 py-2">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || pathname.startsWith(`${to}/`);
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={cn(
                    "press flex flex-col items-center gap-1 rounded-2xl py-1.5 text-[10px] font-semibold tracking-tight",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-2xl transition-all duration-300",
                      active && "gradient-primary glow-shadow text-primary-foreground",
                    )}
                  >
                    <Icon className="size-[18px]" strokeWidth={1.75} />
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="animate-rise mb-7 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
      <div className="min-w-0">
        <h1 className="truncate font-display text-[26px] font-bold tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="mt-1.5 text-sm leading-snug text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </header>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  art = "tasks",
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  art?: "tasks" | "notes" | "plan" | "search" | "rewards";
  action?: ReactNode;
}) {
  return (
    <div className="surface-card animate-pop flex flex-col items-center gap-3 px-6 py-10 text-center">
      <EmptyArt variant={art} className="animate-ring-pulse" />
      {icon ? (
        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </span>
      ) : null}
      <p className="font-display text-base font-bold tracking-tight">{title}</p>
      <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}


export function Loader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
      <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      {label}...
    </div>
  );
}

export function CountBadge({ count, className }: { count: number; className?: string }) {
  if (!count) return null;
  return (
    <span
      aria-label={`${count} pending`}
      className={cn(
        "inline-flex min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[11px] font-bold leading-none text-destructive-foreground shadow-sm",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function SkeletonCard() {
  return <div className="surface-card shimmer h-24 bg-muted/40" />;
}

export function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn("shimmer h-3 rounded-full bg-muted/60", className)} />;
}

/** Rich shimmer placeholder used while AI content or lists load. */
export function SkeletonBlock({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="surface-card space-y-3 p-4">
          <SkeletonLine className="w-1/3" />
          <SkeletonLine className="w-full" />
          <SkeletonLine className="w-2/3" />
        </div>
      ))}
    </div>
  );
}
