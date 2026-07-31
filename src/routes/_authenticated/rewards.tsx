import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session";
import { useAchievements, usePlans, useQuizzes, useSessions, useTasks } from "@/lib/data";
import { REWARDS, studyStreak, useRewardSync } from "@/lib/rewards";

export const Route = createFileRoute("/_authenticated/rewards")({
  head: () => ({
    meta: [
      { title: "My Rewards | AI Study Planner" },
      { name: "description", content: "Badges earned from real study activity: tasks, quizzes, streaks and plans." },
      { property: "og:title", content: "My Rewards" },
      { property: "og:description", content: "Badges earned from real study activity." },
    ],
  }),
  component: RewardsPage,
});

function RewardsPage() {
  const { user } = useSession();
  const { data: tasks = [] } = useTasks(user?.id);
  const { data: quizzes = [] } = useQuizzes(user?.id);
  const { data: sessions = [] } = useSessions(user?.id);
  const { data: plans = [] } = usePlans(user?.id);
  const { data: earned = [] } = useAchievements(user?.id);

  const data = { tasks, quizzes, sessions, plans };
  const earnedCodes = earned.map((e) => e.code);
  useRewardSync(user?.id, data, earnedCodes);

  const unlocked = REWARDS.filter((r) => earnedCodes.includes(r.code) || r.progress(data).value >= r.progress(data).target);

  return (
    <AppShell>
      <PageHeader title="My Rewards" subtitle="Earned from real study activity only" />

      <div className="gradient-primary animate-rise mb-5 rounded-3xl p-5 text-primary-foreground">
        <p className="text-xs opacity-80">Badges unlocked</p>
        <p className="mt-1 text-3xl font-semibold">
          {unlocked.length}/{REWARDS.length}
        </p>
        <p className="mt-1 text-sm opacity-90">🔥 {studyStreak(sessions)} day study streak</p>
      </div>

      <ul className="space-y-3">
        {REWARDS.map((r) => {
          const { value, target } = r.progress(data);
          const done = value >= target || earnedCodes.includes(r.code);
          const earnedAt = earned.find((e) => e.code === r.code)?.earned_at;
          return (
            <li key={r.code} className={cn("surface-card p-4", !done && "opacity-70")}>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-2xl text-2xl",
                    done ? "bg-primary/12" : "bg-muted/50 grayscale",
                  )}
                >
                  {r.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{r.description}</p>
                </div>
                {done ? <span className="text-xs font-semibold text-success">Unlocked</span> : null}
              </div>
              {done ? (
                earnedAt ? (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Earned on {new Date(earnedAt).toLocaleDateString()}
                  </p>
                ) : null
              ) : (
                <>
                  <Progress value={Math.round((value / target) * 100)} className="mt-3" />
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {value} / {target}
                  </p>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}
