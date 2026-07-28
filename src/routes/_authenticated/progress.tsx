import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { AppShell, EmptyState, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session";
import { useInsert, useQuizzes, useSessions, useSubjects } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({
    meta: [
      { title: "Study Progress | AI Study Planner" },
      { name: "description", content: "See weekly study hours, quiz scores and chapter completion trends." },
      { property: "og:title", content: "Study Progress" },
      { property: "og:description", content: "Weekly study hours, quiz scores and chapter trends." },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const { user } = useSession();
  const { data: sessions = [] } = useSessions(user?.id);
  const { data: subjects = [] } = useSubjects(user?.id);
  const { data: quizzes = [] } = useQuizzes(user?.id);
  const log = useInsert("study_sessions", "sessions");

  const [subject, setSubject] = useState("");
  const [minutes, setMinutes] = useState("45");
  const [open, setOpen] = useState(false);

  const week = useMemo(() => {
    const days: { label: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        label: d.toLocaleDateString(undefined, { weekday: "narrow" }),
        minutes: sessions.filter((s) => s.session_date === key).reduce((a, s) => a + s.minutes, 0),
      });
    }
    return days;
  }, [sessions]);

  const maxMinutes = Math.max(60, ...week.map((d) => d.minutes));
  const totalChapters = subjects.reduce((a, s) => a + s.total_chapters, 0);
  const doneChapters = subjects.reduce((a, s) => a + s.completed_chapters, 0);
  const avgQuiz = quizzes.length
    ? Math.round(quizzes.reduce((a, q) => a + (q.score ?? 0), 0) / quizzes.length)
    : 0;

  async function addSession() {
    if (!subject) return toast.error("Pick a subject.");
    await log.mutateAsync({ user_id: user!.id, subject, minutes: Math.max(1, Number(minutes) || 30) });
    setOpen(false);
    toast.success("Study session logged.");
  }

  return (
    <AppShell>
      <PageHeader
        title="Progress"
        subtitle="Consistency beats cramming"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="press size-11 rounded-2xl">
                <Plus className="size-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader>
                <DialogTitle>Log study session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSubject(s.name)}
                        className={cn(
                          "press rounded-xl border px-3 py-2 text-xs font-medium",
                          subject === s.name
                            ? "border-primary bg-primary/12 text-primary"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Minutes studied</Label>
                  <Input
                    type="number"
                    min={1}
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>
                <Button onClick={addSession} className="h-12 w-full rounded-2xl">
                  Save session
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <section className="surface-card animate-rise p-5">
        <p className="text-sm font-semibold">Last 7 days</p>
        <div className="mt-5 flex h-36 items-end justify-between gap-2">
          {week.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="gradient-primary w-full rounded-t-lg transition-all"
                style={{ height: `${Math.max(4, (d.minutes / maxMinutes) * 100)}%` }}
              />
              <span className="text-[10px] text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="animate-rise mt-4 grid grid-cols-2 gap-3">
        <div className="surface-card p-4">
          <p className="text-xs text-muted-foreground">Chapters completed</p>
          <p className="mt-1 text-2xl font-semibold">
            {doneChapters}
            <span className="text-sm text-muted-foreground">/{totalChapters}</span>
          </p>
        </div>
        <div className="surface-card p-4">
          <p className="text-xs text-muted-foreground">Average quiz score</p>
          <p className="mt-1 text-2xl font-semibold">{avgQuiz}%</p>
        </div>
      </section>

      <section className="animate-rise mt-6">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Recent quizzes</h2>
        {quizzes.length === 0 ? (
          <EmptyState
            icon={<TrendingUp className="size-5" />}
            title="No quiz history"
            description="Take an AI quiz to start tracking your accuracy per chapter."
          />
        ) : (
          <div className="space-y-2">
            {quizzes.slice(0, 6).map((q) => (
              <div key={q.id} className="surface-card flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">{q.subject}</p>
                  <p className="text-xs text-muted-foreground">{q.topic}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    (q.score ?? 0) >= 70
                      ? "bg-success/15 text-success"
                      : (q.score ?? 0) >= 40
                        ? "bg-warning/15 text-warning"
                        : "bg-destructive/15 text-destructive",
                  )}
                >
                  {q.score ?? 0}%
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
