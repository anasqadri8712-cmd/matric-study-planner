import { useId } from "react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "success" | "warning";

const TONE: Record<Tone, [string, string]> = {
  primary: ["var(--primary)", "var(--primary-glow)"],
  success: ["var(--success)", "var(--primary-glow)"],
  warning: ["var(--warning)", "var(--destructive)"],
};

/** Glowing animated SVG progress ring with a gradient sweep. */
export function ProgressRing({
  value,
  size = 96,
  stroke = 9,
  tone = "primary",
  label,
  sublabel,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  tone?: Tone;
  label?: string;
  sublabel?: string;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [from, to] = TONE[tone];

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id={`pr-${id}`} x1="0" y1="0" x2={size} y2={size} gradientUnits="userSpaceOnUse">
            <stop stopColor={from} />
            <stop offset="1" stopColor={to} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          stroke="currentColor"
          className="text-muted opacity-60"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={`url(#pr-${id})`}
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-lg font-bold leading-none tracking-tight tabular-nums">
          {label ?? `${pct}%`}
        </span>
        {sublabel ? (
          <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {sublabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
