import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import {
  BookOpenCheck,
  CalendarRange,
  CheckCircle2,
  Circle,
  FileText,
  Flame,
  ListTodo,
  MessageCircleQuestion,
  Sparkles,
  Timer,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { useSession } from "@/lib/session";
import { getGreeting, formatToday } from "@/lib/greeting";
import { useExams, useProfile, useSessions, useSubjects, useTasks, useUpdate } from "@/lib/data";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Your Study Dashboard | AI Study Planner" },
      { name: "description", content: "Today's tasks, study streak, subject progress and AI tools in one place." },
      { property: "og:title", content: "Your Study Dashboard" },
      { property: "og:description", content: "Today's tasks, streak and AI study tools at a glance." },
    ],
  }),
  component: Home,
});

const AI_TOOLS = [
  { to: "/planner", label: "Study Plan", icon: CalendarRange, hint: "Weekly timetable" },
  { to: "/tutor", label: "Ask Doubt", icon: MessageCircleQuestion, hint: "AI tutor chat" },
  { to: "/quiz", label: "Quiz Me", icon: BookOpenCheck, hint: "Practice MCQs" },
  { to: "/notes", label: "Notes", icon: FileText, hint: "Summarise fast" },
] as const;

function Home() {
  const { user } = useSession();
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile(user?.id);
  const { data: tasks = [] } = useTasks(user?.id);
  const { data: subjects = [] } = useSubjects(user?.id);
  const { data: exams = [] } = useExams(user?.id);
  const { data: sessions = [] } = useSessions(user?.id);
  const toggleTask = useUpdate("tasks", "tasks");

  useEffect(() => {
    if (!isLoading && profile && !profile.onboarded) navigate({ to: "/onboarding", replace: true });
  }, [isLoading, profile, navigate]);

  const greeting = getGreeting();
  const today = formatToday();
  const firstName = (profile?.full_name || "Student").split(" ")[0];

  const todayTasks = tasks.filter((t) => !t.completed).slice(0, 4);
  const doneToday = tasks.filter((t) => t.completed).length;

  const streak = useMemo(() => {
    const dates = new Set(sessions.map((s) => s.session_date));
    let count = 0;
    const cursor = new Date();
    for (let i = 0; i < 365; i++) {
      const key = cursor.toISOString().slice(0, 10);
      if (dates.has(key)) count++;
      else if (i > 0) break;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [sessions]);

  const minutesThisWeek = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    return sessions
      .filter((s) => new Date(s.session_date) >= weekAgo)
      .reduce((sum, s) => sum + s.minutes, 0);
  }, [sessions]);

  const nextExam = exams.find((e) => new Date(e.exam_date) >= new Date());
  const daysLeft = nextExam
    ? Math.max(0, Math.ceil((new Date(nextExam.exam_date).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <AppShell>
      <header className="animate-rise">
        <p className="text-sm text-muted-foreground">
          {greeting.text} {greeting.emoji}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">{firstName}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {today.day}, {today.date}
        </p>
      </header>

      <section className="animate-rise mt-5 grid grid-cols-3 gap-3">
        <Stat icon={Flame} value={`${streak}`} label="Day streak" />
        <Stat icon={Timer} value={`${Math.round(minutesThisWeek / 60)}h`} label="This week" />
        <Stat icon={CheckCircle2} value={`${doneToday}`} label="Tasks done" />
      </section>

      {nextExam ? (
        <section className="animate-rise gradient-primary mt-4 rounded-3xl p-5 text-primary-foreground">
          <p className="text-xs opacity-80">Next exam</p>
          <p className="mt-1 text-lg font-semibold">{nextExam.title}</p>
          <p className="mt-1 text-sm opacity-90">
            {daysLeft === 0 ? "Today — you've got this!" : `${daysLeft} days left`}
          </p>
        </section>
      ) : null}

      <section className="animate-rise mt-6">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">AI tools</h2>
        <div className="grid grid-cols-2 gap-3">
          {AI_TOOLS.map(({ to, label, icon: Icon, hint }) => (
            <Link key={to} to={to} className="surface-card press flex flex-col gap-2 p-4">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <Icon className="size-5" />
              </span>
              <span className="text-sm font-semibold">{label}</span>
              <span className="text-xs text-muted-foreground">{hint}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="animate-rise mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Today's tasks</h2>
          <Link to="/planner" className="text-xs font-semibold text-primary">
            View all
          </Link>
        </div>
        {todayTasks.length === 0 ? (
          <div className="surface-card flex items-center gap-3 p-4 text-sm text-muted-foreground">
            <ListTodo className="size-4" /> No pending tasks. Add one from the Planner.
          </div>
        ) : (
          <ul className="space-y-2">
            {todayTasks.map((task) => (
              <li key={task.id}>
                <button
                  onClick={() => toggleTask.mutate({ id: task.id, patch: { completed: true } })}
                  className="surface-card press flex w-full items-center gap-3 p-4 text-left"
                >
                  <Circle className="size-5 shrink-0 text-muted-foreground" />
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{task.title}</span>
                    {task.subject ? (
                      <span className="text-xs text-muted-foreground">{task.subject}</span>
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                      task.priority === "high"
                        ? "bg-destructive/15 text-destructive"
                        : task.priority === "low"
                          ? "bg-success/15 text-success"
                          : "bg-warning/15 text-warning",
                    )}
                  >
                    {task.priority}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="animate-rise mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Subject progress</h2>
          <Link to="/subjects" className="text-xs font-semibold text-primary">
            Manage
          </Link>
        </div>
        <div className="space-y-3">
          {subjects.slice(0, 4).map((s) => {
            const pct = s.total_chapters ? Math.round((s.completed_chapters / s.total_chapters) * 100) : 0;
            return (
              <div key={s.id} className="surface-card p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </span>
                  <span className="text-muted-foreground">{pct}%</span>
                </div>
                <Progress value={pct} className="mt-3 h-2" />
              </div>
            );
          })}
          {subjects.length === 0 ? (
            <div className="surface-card flex items-center gap-3 p-4 text-sm text-muted-foreground">
              <Sparkles className="size-4" /> Add your subjects to start tracking chapters.
            </div>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}

function Stat({ icon: Icon, value, label }: { icon: typeof Flame; value: string; label: string }) {
  return (
    <div className="surface-card flex flex-col items-center gap-1 px-2 py-4">
      <Icon className="size-4 text-primary" />
      <span className="text-lg font-semibold">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
