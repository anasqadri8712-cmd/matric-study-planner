import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CalendarRange, Check, GitCompareArrows, History, Lightbulb, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, EmptyState, SkeletonBlock } from "@/components/app/AppShell";
import { ProgressRing } from "@/components/app/ProgressRing";
import { StudyReportActions } from "@/components/app/StudyReportActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session";
import {
  useExams,
  useInsert,
  usePlans,
  useProfile,
  useQuizzes,
  useRemove,
  useSubjects,
  useTasks,
  useUpdate,
} from "@/lib/data";
import { generateStudyPlan, type GeneratedPlan } from "@/lib/ai.functions";
import { comparePlans, planOf, totalMinutes } from "@/lib/plan";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({
    meta: [
      { title: "Study Planner & Tasks | AI Study Planner" },
      { name: "description", content: "Generate an AI weekly timetable and manage your matric study tasks." },
      { property: "og:title", content: "Study Planner & Tasks" },
      { property: "og:description", content: "AI weekly timetable plus a simple task list for every subject." },
    ],
  }),
  component: Planner,
});

function Planner() {
  const { user } = useSession();
  const { data: profile } = useProfile(user?.id);
  const { data: subjects = [] } = useSubjects(user?.id);
  const { data: tasks = [] } = useTasks(user?.id);
  const { data: plans = [] } = usePlans(user?.id);
  const { data: exams = [] } = useExams(user?.id);
  const { data: quizzes = [] } = useQuizzes(user?.id);
  const addTask = useInsert("tasks", "tasks");
  const updateTask = useUpdate("tasks", "tasks");
  const removeTask = useRemove("tasks", "tasks");
  const savePlan = useInsert("study_plans", "plans");
  const generate = useServerFn(generateStudyPlan);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState("medium");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const latestPlan = plans[0]?.plan as unknown as GeneratedPlan | undefined;
  const previousPlanRow = plans[1];
  const diffs = previousPlanRow ? comparePlans(latestPlan, planOf(previousPlanRow)).filter((d) => d.direction !== "same") : [];

  async function createTask() {
    if (!title.trim()) return toast.error("Give the task a title.");
    await addTask.mutateAsync({
      user_id: user!.id,
      title: title.trim(),
      subject: subject || null,
      due_date: due || null,
      priority,
    });
    setTitle("");
    setDue("");
    setOpen(false);
    toast.success("Task added.");
  }

  async function makePlan() {
    setBusy(true);
    try {
      const pendingTasks = tasks
        .filter((t) => !t.completed)
        .slice(0, 12)
        .map((t) => [t.subject, t.title, t.due_date ? `due ${t.due_date}` : null].filter(Boolean).join(" - "));
      const completedTasks = tasks
        .filter((t) => t.completed || t.status === "completed")
        .slice(0, 10)
        .map((t) => [t.subject, t.title].filter(Boolean).join(" - "));
      const quizPerformance = quizzes
        .filter((q) => typeof q.score === "number")
        .slice(0, 10)
        .map((q) => ({ subject: q.subject, score: Number(q.score) }));
      const examNote = exams.length
        ? `Upcoming exams (days left): ${exams
            .map(
              (e) =>
                `${e.subject || e.title} in ${Math.max(
                  0,
                  Math.ceil((new Date(e.exam_date).getTime() - Date.now()) / 86400000),
                )} days`,
            )
            .join(", ")}`
        : "";
      const result = await generate({
        data: {
          studentClass: profile?.student_class ?? "Class 9",
          board: profile?.board ?? "Punjab Board",
          goal: profile?.study_goal ?? "",
          dailyHours: Number(profile?.daily_hours ?? 3),
          weak: profile?.weak_subjects ?? [],
          strong: profile?.strong_subjects ?? [],
          subjects: subjects.map((s) => s.name),
          examNote,
          pendingTasks,
          completedTasks,
          quizPerformance,
          previousPlan: latestPlan
            ? JSON.stringify(latestPlan.days ?? []).slice(0, 2000)
            : undefined,
          variation: Math.floor(Math.random() * 1000000),
        },
      });
      const monday = new Date();
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
      await savePlan.mutateAsync({
        user_id: user!.id,
        plan: result,
        week_start: monday.toISOString().slice(0, 10),
        status: "active",
        total_hours: Math.round((totalMinutes(result) / 60) * 10) / 10,
      });
      toast.success("Your weekly plan is ready!");
    } catch {
      toast.error("Could not generate the plan. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="glass-panel animate-rise mb-1 rounded-3xl p-6">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          <Sparkles strokeWidth={1.75} className="size-4" /> AI Planner Studio
        </p>
        <h1 className="mt-2 text-2xl font-display font-bold tracking-tight text-gradient">Planner</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Your weekly plan and daily tasks, tuned by AI.</p>
      </div>

      <Tabs defaultValue="plan">
        <TabsList className="grid w-full grid-cols-2 rounded-2xl p-1">
          <TabsTrigger value="plan" className="rounded-xl">
            AI Plan
          </TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-xl">
            Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plan" className="mt-5 space-y-4">
          <Button onClick={makePlan} disabled={busy} className="press h-13 w-full rounded-2xl gradient-primary">
            <Sparkles strokeWidth={1.75} className="mr-1 size-4" />
            {busy ? "Building your plan..." : latestPlan ? "Regenerate weekly plan" : "Generate weekly plan"}
          </Button>

          {busy ? (
            <div className="glass-panel animate-rise flex flex-col items-center gap-3 rounded-3xl p-8 text-center">
              <ProgressRing value={72} size={88} tone="primary" label="AI" sublabel="Thinking" className="animate-ring-pulse" />
              <p className="text-sm font-medium">Crafting your weekly timetable…</p>
              <SkeletonBlock rows={3} />
            </div>
          ) : null}

          {latestPlan && !busy ? (
            <>
              <p className="surface-card p-4 text-sm text-muted-foreground">{latestPlan.summary}</p>

              {latestPlan.why?.length ? (
                <div className="surface-card animate-rise border-primary/40 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Lightbulb className="size-4" /> Why this plan?
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                    {latestPlan.why.map((w) => (
                      <li key={w}>• {w}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {diffs.length ? (
                <div className="surface-card p-4">
                  <p className="text-sm font-semibold">What changed since last week</p>
                  <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                    {diffs.slice(0, 6).map((d) => (
                      <li key={d.subject}>
                        {d.direction === "up" ? "🔼" : d.direction === "down" ? "🔽" : d.direction === "new" ? "🆕" : "⛔"}{" "}
                        <span className="font-medium text-foreground">{d.subject}</span> — {d.change}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {latestPlan.days?.map((day) => (
                <div key={day.day} className="surface-card animate-rise p-4">
                  <p className="text-sm font-semibold">{day.day}</p>
                  <ul className="mt-3 space-y-3">
                    {day.blocks?.map((b, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="w-16 shrink-0 text-xs text-muted-foreground">{b.time}</span>
                        <span className="flex-1">
                          <span className="block text-sm font-medium">{b.subject}</span>
                          <span className="text-xs text-muted-foreground">{b.topic}</span>
                        </span>
                        <span className="text-xs text-primary">{b.minutes}m</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {latestPlan.tips?.length ? (
                <div className="surface-card p-4">
                  <p className="text-sm font-semibold">Coach tips</p>
                  <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                    {latestPlan.tips.map((t) => (
                      <li key={t}>• {t}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                <Button asChild variant="outline" className="press h-12 w-full rounded-2xl">
                  <Link to="/plan-history">
                    <History className="mr-1 size-4" /> History
                  </Link>
                </Button>
                <Button asChild variant="outline" className="press h-12 w-full rounded-2xl">
                  <Link to="/compare-plans">
                    <GitCompareArrows className="mr-1 size-4" /> Compare
                  </Link>
                </Button>
              </div>
              <StudyReportActions />
            </>
          ) : busy ? null : (
            <EmptyState
              icon={<CalendarRange strokeWidth={1.75} className="size-5" />}
              title="No plan yet"
              description="Generate a 7-day timetable built around your class, weak subjects and free hours."
              art="plan"
            />
          )}
        </TabsContent>

        <TabsContent value="tasks" className="mt-5 space-y-3">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="press h-12 w-full rounded-2xl">
                <Plus className="mr-1 size-4" /> Add task
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader>
                <DialogTitle>New task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Revise Ch 4 numericals"
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSubject(s.name === subject ? "" : s.name)}
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
                  <Label>Due date</Label>
                  <Input
                    type="date"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {["low", "medium", "high"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={cn(
                          "press rounded-xl border py-2.5 text-xs font-semibold capitalize",
                          priority === p
                            ? "border-primary bg-primary/12 text-primary"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={createTask} className="h-12 w-full rounded-2xl">
                  Add task
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {tasks.length === 0 ? (
            <EmptyState
              icon={<Check className="size-5" />}
              title="Nothing planned"
              description="Add your first task and tick it off as you study."
              art="tasks"
            />
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  "surface-card lift flex items-center gap-3 border-l-4 p-4",
                  task.completed ? "border-l-success" : "border-l-primary/50",
                )}
              >
                <button
                  onClick={() => updateTask.mutate({ id: task.id, patch: { completed: !task.completed } })}
                  aria-label="Toggle task"
                  className={cn(
                    "press flex size-6 shrink-0 items-center justify-center rounded-lg border",
                    task.completed ? "border-success bg-success text-background" : "border-border",
                  )}
                >
                  {task.completed ? <Check strokeWidth={1.75} className="size-3.5" /> : null}
                </button>
                <div className="flex-1">
                  <p className={cn("text-sm font-medium", task.completed && "text-muted-foreground line-through")}>
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[task.subject, task.due_date].filter(Boolean).join(" • ") || "No subject"}
                  </p>
                </div>
                <button
                  onClick={() => removeTask.mutate(task.id)}
                  aria-label="Delete task"
                  className="press text-muted-foreground"
                >
                  <Trash2 strokeWidth={1.75} className="size-4" />
                </button>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
