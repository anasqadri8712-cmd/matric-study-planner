import type { GeneratedPlan } from "@/lib/ai.functions";
import type { StudyPlan } from "@/lib/data";

export function planOf(row?: StudyPlan | null) {
  return (row?.plan as unknown as GeneratedPlan | undefined) ?? undefined;
}

export function subjectMinutes(plan?: GeneratedPlan) {
  const map = new Map<string, number>();
  for (const day of plan?.days ?? []) {
    for (const b of day.blocks ?? []) {
      map.set(b.subject, (map.get(b.subject) ?? 0) + (Number(b.minutes) || 0));
    }
  }
  return map;
}

export function totalMinutes(plan?: GeneratedPlan) {
  let total = 0;
  for (const m of subjectMinutes(plan).values()) total += m;
  return total;
}

export function planSubjects(plan?: GeneratedPlan) {
  return [...subjectMinutes(plan).keys()];
}

export type PlanDiff = { subject: string; before: number; after: number; change: string; direction: "up" | "down" | "same" | "new" | "dropped" };

export function comparePlans(current?: GeneratedPlan, previous?: GeneratedPlan): PlanDiff[] {
  const now = subjectMinutes(current);
  const before = subjectMinutes(previous);
  const names = new Set([...now.keys(), ...before.keys()]);
  const diffs: PlanDiff[] = [];
  for (const subject of names) {
    const a = before.get(subject) ?? 0;
    const b = now.get(subject) ?? 0;
    if (a === 0 && b > 0) {
      diffs.push({ subject, before: a, after: b, direction: "new", change: `Newly added — ${b} min this week` });
    } else if (b === 0 && a > 0) {
      diffs.push({ subject, before: a, after: b, direction: "dropped", change: `Not scheduled this week (was ${a} min)` });
    } else if (b > a) {
      diffs.push({ subject, before: a, after: b, direction: "up", change: `Study time increased by ${b - a} min` });
    } else if (b < a) {
      diffs.push({ subject, before: a, after: b, direction: "down", change: `Study time decreased by ${a - b} min` });
    } else {
      diffs.push({ subject, before: a, after: b, direction: "same", change: "Same study time" });
    }
  }
  return diffs.sort((x, y) => Math.abs(y.after - y.before) - Math.abs(x.after - x.before));
}

export function weekLabel(row: StudyPlan) {
  const start = new Date(`${row.week_start ?? String(row.created_at).slice(0, 10)}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}

/** 1 = most study time in the plan. Subjects not in the plan are absent. */
export function priorityRanks(plan?: GeneratedPlan) {
  const sorted = [...subjectMinutes(plan).entries()].sort((a, b) => b[1] - a[1]);
  const ranks = new Map<string, number>();
  sorted.forEach(([subject], i) => ranks.set(subject, i + 1));
  return ranks;
}

export type ChangeContext = {
  weak: string[];
  strong: string[];
  quizScores: Record<string, number>;
  examDaysLeft: Record<string, number>;
  pendingCounts: Record<string, number>;
  why?: string[];
};

/** Plain-English reason for a subject's week-over-week change, built from the student's own data. */
export function reasonFor(diff: PlanDiff, ctx: ChangeContext): string {
  const s = diff.subject;
  const lower = s.toLowerCase();
  const fromAi = ctx.why?.find((w) => w.toLowerCase().includes(lower));
  if (fromAi) return fromAi;

  const parts: string[] = [];
  const days = ctx.examDaysLeft[s];
  const score = ctx.quizScores[s];
  const pending = ctx.pendingCounts[s] ?? 0;
  const isWeak = ctx.weak.some((w) => w.toLowerCase() === lower);
  const isStrong = ctx.strong.some((w) => w.toLowerCase() === lower);

  if (typeof days === "number") parts.push(`your ${s} exam is ${days} day${days === 1 ? "" : "s"} away`);
  if (typeof score === "number") parts.push(`your last ${s} quiz was ${score}%`);
  if (pending > 0) parts.push(`${pending} pending ${s} task${pending === 1 ? "" : "s"} still need time`);
  if (isWeak) parts.push(`${s} is marked as a weak subject`);
  if (isStrong) parts.push(`${s} is marked strong, so it only needs revision blocks`);

  const because = parts.length ? parts.join(", and ") : null;
  const delta = Math.abs(diff.after - diff.before);

  switch (diff.direction) {
    case "up":
      return because
        ? `Study time went up by ${delta} min because ${because}.`
        : `Study time went up by ${delta} min to balance the week against your other subjects.`;
    case "down":
      return because
        ? `Study time dropped by ${delta} min because ${because}.`
        : `Study time dropped by ${delta} min so weaker subjects and closer exams could take those hours.`;
    case "new":
      return because
        ? `Added to this week's plan because ${because}.`
        : `Added to this week's plan because it is now part of your selected subjects.`;
    case "dropped":
      return because
        ? `Not scheduled this week because ${because}.`
        : `Not scheduled this week — the available hours went to subjects with a nearer exam or weaker results.`;
    default:
      return because ? `Kept at the same ${diff.after} min because ${because}.` : `Kept at the same ${diff.after} min.`;
  }
}
