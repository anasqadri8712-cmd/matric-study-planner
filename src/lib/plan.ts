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
