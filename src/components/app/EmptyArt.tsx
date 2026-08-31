import { cn } from "@/lib/utils";

type Variant = "tasks" | "notes" | "plan" | "search" | "rewards";

/** Minimalist vector illustrations used in empty states. */
export function EmptyArt({ variant = "tasks", className }: { variant?: Variant; className?: string }) {
  return (
    <svg
      viewBox="0 0 160 120"
      aria-hidden="true"
      className={cn("h-28 w-40", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`ea-${variant}`} x1="20" y1="10" x2="140" y2="110" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--primary)" stopOpacity="0.22" />
          <stop offset="1" stopColor="var(--primary-glow)" stopOpacity="0.06" />
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="103" rx="52" ry="7" fill="var(--primary)" fillOpacity="0.08" />
      <rect x="34" y="18" width="92" height="76" rx="16" fill={`url(#ea-${variant})`} stroke="var(--primary)" strokeOpacity="0.28" strokeWidth="2" />

      {variant === "tasks" ? (
        <>
          <path d="M52 44h30M52 58h44M52 72h22" stroke="var(--primary)" strokeOpacity="0.45" strokeWidth="4" strokeLinecap="round" />
          <circle cx="112" cy="74" r="15" fill="var(--success)" fillOpacity="0.16" />
          <path d="M105 74.5l5 5 9-11" stroke="var(--success)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : null}

      {variant === "notes" ? (
        <>
          <path d="M52 40h56M52 54h44M52 68h34" stroke="var(--primary)" strokeOpacity="0.4" strokeWidth="4" strokeLinecap="round" />
          <path d="M96 84l24-24 8 8-24 24-10 2 2-10Z" fill="var(--warning)" fillOpacity="0.25" stroke="var(--warning)" strokeWidth="2.5" strokeLinejoin="round" />
        </>
      ) : null}

      {variant === "plan" ? (
        <>
          <path d="M34 40h92" stroke="var(--primary)" strokeOpacity="0.3" strokeWidth="2.5" />
          <rect x="50" y="52" width="24" height="14" rx="5" fill="var(--primary)" fillOpacity="0.3" />
          <rect x="82" y="52" width="30" height="14" rx="5" fill="var(--success)" fillOpacity="0.3" />
          <rect x="50" y="72" width="36" height="14" rx="5" fill="var(--warning)" fillOpacity="0.32" />
          <circle cx="112" cy="30" r="4" fill="var(--primary)" />
        </>
      ) : null}

      {variant === "search" ? (
        <>
          <circle cx="76" cy="54" r="18" stroke="var(--primary)" strokeOpacity="0.5" strokeWidth="4" />
          <path d="M89 67l16 16" stroke="var(--primary)" strokeOpacity="0.5" strokeWidth="5" strokeLinecap="round" />
        </>
      ) : null}

      {variant === "rewards" ? (
        <>
          <path d="M80 34l7 14 15 2-11 11 3 15-14-8-14 8 3-15-11-11 15-2 7-14Z" fill="var(--warning)" fillOpacity="0.3" stroke="var(--warning)" strokeWidth="3" strokeLinejoin="round" />
        </>
      ) : null}
    </svg>
  );
}
