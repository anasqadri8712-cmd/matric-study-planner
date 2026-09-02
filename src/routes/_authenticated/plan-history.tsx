import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarRange, ChevronDown, GitCompareArrows } from "lucide-react";
import { AppShell, EmptyState, Loader, PageHeader } from "@/components/app/AppShell";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session";
import { usePlans } from "@/lib/data";
import { comparePlans, planOf, planSubjects, totalMinutes, weekLabel } from "@/lib/plan";

export const Route = createFileRoute("/_authenticated/plan-history")({
  head: () => ({
    meta: [
      { title: "Plan History | AI Study Planner" },
      { name: "description", content: "Open your previous AI weekly study plans and compare what changed week to week." },
      { property: "og:title", content: "Plan History" },
      { property: "og:description", content: "Previous AI weekly plans and week-to-week changes." },
    ],
  }),
  component: PlanHistoryPage,
});

function PlanHistoryPage() {
  const { user } = useSession();
  const { data: plans = [], isLoading } = usePlans(user?.id);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <AppShell>
      <PageHeader title="Plan History" subtitle="Every weekly plan is kept — nothing is overwritten" />

      {plans.length > 1 ? (
        <Link
          to="/compare-plans"
          className="lift press card-highlight surface-card mb-5 flex items-center gap-3 p-4 text-sm font-semibold"
        >
          <span className="gradient-primary flex size-10 shrink-0 items-center justify-center rounded-xl text-primary-foreground">
            <GitCompareArrows className="size-4" strokeWidth={1.75} />
          </span>
          Compare two plans in detail
        </Link>
      ) : null}

      {isLoading ? (
        <Loader label="Loading plans" />
      ) : plans.length === 0 ? (
        <EmptyState
          icon={<CalendarRange className="size-5" strokeWidth={1.75} />}
          title="No plans yet"
          description="Generate your first AI weekly plan from the Planner and it will be saved here."
        />
      ) : (
        <ul className="space-y-4">
          {plans.map((row, index) => {
            const plan = planOf(row);
            const previous = planOf(plans[index + 1]);
            const minutes = totalMinutes(plan);
            const open = openId === row.id;
            const diffs = previous ? comparePlans(plan, previous).filter((d) => d.direction !== "same") : [];
            return (
              <li key={row.id} className="surface-card lift animate-rise overflow-hidden">
                <button
                  onClick={() => setOpenId(open ? null : row.id)}
                  className="press flex w-full items-center gap-3 p-4 text-left"
                >
                  <span className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                    index === 0 ? "gradient-primary text-primary-foreground" : "bg-primary/12 text-primary",
                  )}>
                    <CalendarRange className="size-5" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">Week of {weekLabel(row)}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          index === 0 ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {index === 0 ? "Active" : "Completed"}
                      </span>
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {new Date(row.created_at).toLocaleDateString()} · {(minutes / 60).toFixed(1)} hrs ·{" "}
                      {planSubjects(plan).length} subjects
                    </span>
                  </span>
                  <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")} strokeWidth={1.75} />
                </button>

                {open ? (
                  <div className="animate-rise border-t border-border p-4">
                    <p className="text-xs text-muted-foreground">{plan?.summary}</p>
                    <p className="mt-3 text-xs font-semibold text-muted-foreground">Subjects</p>
                    <p className="text-sm">{planSubjects(plan).join(", ") || "—"}</p>

                    {plan?.why?.length ? (
                      <>
                        <p className="mt-4 text-xs font-semibold text-muted-foreground">Why this plan?</p>
                        <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                          {plan.why.map((w) => (
                            <li key={w}>• {w}</li>
                          ))}
                        </ul>
                      </>
                    ) : null}

                    <p className="mt-4 text-xs font-semibold text-muted-foreground">Study schedule</p>
                    <div className="mt-2 space-y-3">
                      {plan?.days?.map((day) => (
                        <div key={day.day} className="rounded-xl bg-muted/50 p-3">
                          <p className="text-sm font-semibold">{day.day}</p>
                          <ul className="mt-1.5 space-y-1.5">
                            {day.blocks?.map((b, i) => (
                              <li key={i} className="flex gap-2 text-xs">
                                <span className="w-16 shrink-0 text-muted-foreground tabular-nums">{b.time}</span>
                                <span className="flex-1">
                                  <span className="font-medium">{b.subject}</span>
                                  <span className="block text-muted-foreground">{b.topic}</span>
                                </span>
                                <span className="font-semibold text-primary tabular-nums">{b.minutes}m</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>

                    {diffs.length ? (
                      <>
                        <p className="mt-4 text-xs font-semibold text-muted-foreground">
                          What changed vs the previous plan
                        </p>
                        <ul className="mt-2 space-y-1.5 text-xs">
                          {diffs.slice(0, 8).map((d) => (
                            <li key={d.subject} className="flex items-start gap-2">
                              <span>
                                {d.direction === "up" ? "🔼" : d.direction === "down" ? "🔽" : d.direction === "new" ? "🆕" : "⛔"}
                              </span>
                              <span>
                                <span className="font-medium">{d.subject}</span> — {d.change}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : previous ? (
                      <p className="mt-4 text-xs text-muted-foreground">No major changes from the previous plan.</p>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
