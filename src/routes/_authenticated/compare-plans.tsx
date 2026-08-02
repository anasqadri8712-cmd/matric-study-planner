import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, GitCompareArrows, Minus, Plus, X } from "lucide-react";
import { AppShell, EmptyState, Loader, PageHeader } from "@/components/app/AppShell";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session";
import { useExams, usePlans, useProfile, useQuizzes, useTasks } from "@/lib/data";
import {
  comparePlans,
  planOf,
  priorityRanks,
  reasonFor,
  totalMinutes,
  weekLabel,
  type ChangeContext,
} from "@/lib/plan";

export const Route = createFileRoute("/_authenticated/compare-plans")({
  head: () => ({
    meta: [
      { title: "Compare Plans | AI Study Planner" },
      {
        name: "description",
        content: "See exactly how subject priority and study hours changed between two weekly plans, and why.",
      },
      { property: "og:title", content: "Compare Study Plans" },
      { property: "og:description", content: "Priority and study-hour changes between weekly plans, with reasons." },
    ],
  }),
  component: ComparePlansPage,
});

const fmtHours = (m: number) => `${(m / 60).toFixed(1)}h`;

function ComparePlansPage() {
  const { user } = useSession();
  const { data: plans = [], isLoading } = usePlans(user?.id);
  const { data: profile } = useProfile(user?.id);
  const { data: tasks = [] } = useTasks(user?.id);
  const { data: exams = [] } = useExams(user?.id);
  const { data: quizzes = [] } = useQuizzes(user?.id);

  const [currentId, setCurrentId] = useState<string | null>(null);
  const [previousId, setPreviousId] = useState<string | null>(null);

  const currentRow = plans.find((p) => p.id === currentId) ?? plans[0];
  const previousRow = plans.find((p) => p.id === previousId) ?? plans.find((p) => p.id !== currentRow?.id);

  const current = planOf(currentRow);
  const previous = planOf(previousRow);

  const ranksNow = priorityRanks(current);
  const ranksBefore = priorityRanks(previous);
  const diffs = comparePlans(current, previous);

  const ctx: ChangeContext = useMemo(() => {
    const quizScores: Record<string, number> = {};
    for (const q of quizzes) {
      if (typeof q.score === "number" && quizScores[q.subject] === undefined) quizScores[q.subject] = Number(q.score);
    }
    const examDaysLeft: Record<string, number> = {};
    for (const e of exams) {
      const key = e.subject || e.title;
      const days = Math.max(0, Math.ceil((new Date(e.exam_date).getTime() - Date.now()) / 86400000));
      if (examDaysLeft[key] === undefined) examDaysLeft[key] = days;
    }
    const pendingCounts: Record<string, number> = {};
    for (const t of tasks) {
      if (t.completed || !t.subject) continue;
      pendingCounts[t.subject] = (pendingCounts[t.subject] ?? 0) + 1;
    }
    return {
      weak: profile?.weak_subjects ?? [],
      strong: profile?.strong_subjects ?? [],
      quizScores,
      examDaysLeft,
      pendingCounts,
      why: current?.why,
    };
  }, [quizzes, exams, tasks, profile, current]);

  const totalNow = totalMinutes(current);
  const totalBefore = totalMinutes(previous);
  const totalDelta = totalNow - totalBefore;

  return (
    <AppShell>
      <PageHeader title="Compare Plans" subtitle="Exact priority and study-hour changes, with the reason behind each" />

      {isLoading ? (
        <Loader label="Loading plans" />
      ) : plans.length < 2 ? (
        <EmptyState
          icon={<GitCompareArrows className="size-5" />}
          title="Need two plans to compare"
          description="Generate another weekly plan from the Planner and the week-to-week comparison will appear here."
        />
      ) : (
        <div className="space-y-4">
          <div className="surface-card grid grid-cols-2 gap-3 p-4">
            <label className="block text-xs font-semibold text-muted-foreground">
              This plan
              <select
                value={currentRow?.id ?? ""}
                onChange={(e) => setCurrentId(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-2 text-sm font-medium text-foreground"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {weekLabel(p)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-muted-foreground">
              Compared with
              <select
                value={previousRow?.id ?? ""}
                onChange={(e) => setPreviousId(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-2 text-sm font-medium text-foreground"
              >
                {plans
                  .filter((p) => p.id !== currentRow?.id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {weekLabel(p)}
                    </option>
                  ))}
              </select>
            </label>
          </div>

          <div className="surface-card grid grid-cols-3 gap-2 p-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Previous</p>
              <p className="text-lg font-semibold tabular-nums">{fmtHours(totalBefore)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current</p>
              <p className="text-lg font-semibold tabular-nums">{fmtHours(totalNow)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Change</p>
              <p
                className={cn(
                  "text-lg font-semibold tabular-nums",
                  totalDelta > 0 ? "text-success" : totalDelta < 0 ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {totalDelta > 0 ? "+" : ""}
                {(totalDelta / 60).toFixed(1)}h
              </p>
            </div>
          </div>

          <ul className="space-y-3">
            {diffs.map((d) => {
              const rankNow = ranksNow.get(d.subject);
              const rankBefore = ranksBefore.get(d.subject);
              const rankShift =
                rankNow && rankBefore ? rankBefore - rankNow : null; // positive = moved up in priority
              const Icon =
                d.direction === "up"
                  ? ArrowUp
                  : d.direction === "down"
                    ? ArrowDown
                    : d.direction === "new"
                      ? Plus
                      : d.direction === "dropped"
                        ? X
                        : Minus;
              const tone =
                d.direction === "up" || d.direction === "new"
                  ? "bg-success/12 text-success"
                  : d.direction === "down" || d.direction === "dropped"
                    ? "bg-destructive/12 text-destructive"
                    : "bg-muted text-muted-foreground";
              return (
                <li key={d.subject} className="surface-card animate-rise p-4">
                  <div className="flex items-start gap-3">
                    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", tone)}>
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{d.subject}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                        {fmtHours(d.before)} → {fmtHours(d.after)}
                        {d.after !== d.before ? (
                          <span className={cn("ml-1 font-semibold", d.after > d.before ? "text-success" : "text-destructive")}>
                            ({d.after > d.before ? "+" : "−"}
                            {Math.abs(d.after - d.before)} min)
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-xs">
                        <span className="font-medium text-muted-foreground">Priority: </span>
                        {rankBefore ? `#${rankBefore}` : "not scheduled"} → {rankNow ? `#${rankNow}` : "not scheduled"}
                        {rankShift ? (
                          <span className={cn("ml-1 font-semibold", rankShift > 0 ? "text-success" : "text-destructive")}>
                            {rankShift > 0 ? `▲ up ${rankShift}` : `▼ down ${Math.abs(rankShift)}`}
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 rounded-xl bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">Why: </span>
                    {reasonFor(d, ctx)}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </AppShell>
  );
}