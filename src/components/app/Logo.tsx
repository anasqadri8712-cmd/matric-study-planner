import { cn } from "@/lib/utils";

/**
 * Bespoke brand mark: a geometric graduation cap fused with a rising growth
 * vector and an AI neural core. Optically tuned to stay legible at 16px.
 */
export function LogoMark({ className, title = "AI Study Planner" }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label={title}
      className={cn("size-8", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="lm-a" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.65" />
        </linearGradient>
      </defs>
      {/* graduation cap — sharp geometric rhombus */}
      <path d="M24 5 44 15.5 24 26 4 15.5 24 5Z" fill="url(#lm-a)" />
      <path
        d="M12 20.5v9.2c0 1.1.6 2.2 1.6 2.8 3.1 1.9 6.8 2.9 10.4 2.9s7.3-1 10.4-2.9c1-.6 1.6-1.7 1.6-2.8v-9.2"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeOpacity="0.55"
      />
      {/* growth vector */}
      <path
        d="M17 41.5l6.5-7.4 5.2 4.3 8.8-11"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* neural core */}
      <circle cx="40.2" cy="26.4" r="3.6" fill="currentColor" />
    </svg>
  );
}

export function LogoLockup({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <span className="gradient-primary glow-shadow flex size-9 shrink-0 items-center justify-center rounded-2xl text-primary-foreground">
        <LogoMark className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-display text-[15px] font-bold tracking-tight">
          AI Study Planner
        </span>
        {compact ? null : (
          <span className="block truncate text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Matric Intelligence
          </span>
        )}
      </span>
    </span>
  );
}
