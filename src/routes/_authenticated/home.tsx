import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarClock,
  CalendarRange,
  ClipboardList,
  FileText,
  Flame,
  LineChart,
  ListTodo,
  Settings,
  Sparkles,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell, CountBadge, SkeletonCard } from "@/components/app/AppShell";
import { useSession } from "@/lib/session";
import { getGreeting, formatToday } from "@/lib/greeting";
import { useExams, useProfile, useSessions, useSubjects, useTasks } from "@/lib/data";
import { countdownText, subjectIcon } from "@/lib/matric";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Your Study Dashboard | AI Study Planner" },
      { name: "description", content: "Today's tasks, exam countdown, subject progress and AI tools in one place." },
      { property: "og:title", content: "Your Study Dashboard" },
      { property: "og:description", content: "Today's tasks, streak and AI study tools at a glance." },
    ],
  }),
  component: Home,
});

type Card = {
  to: string;
  params?: Record<string, string>;
  search?: Record<string, string>;
  emoji: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  badge: number;
};

function Home() {
  const { user } = useSession();
  const navigate = useNavigate();
  const { data: profile, isLoading } = useProfile(user?.id);
  const { data: tasks = [] } = useTasks(user?.id);
  const { data: subjects = [] } = useSubjects(user?.id);
  const { data: exams = [] } = useExams(user?.id);
  const { data: sessions = [] } = useSessions(user?.id);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!isLoading && profile && !profile.onboarded) navigate({ to: "/onboarding" });
  }, [isLoading, profile, navigate]);

  const greeting = getGreeting(now);
  const today = formatToday(now);
  const clock = now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  const pending = tasks.filter((t) => t.status !== "completed");
  const homework = pending.filter((t) => t.kind === "homework");
  const subjectsWithPending = subjects.filter((s) =>
    pending.some((t) => t.subject_id === s.id || t.subject === s.name),
  ).length;
  const todayStr = now.toISOString().slice(0, 10);
  const dueToday = pending.filter((t) => t.due_date === todayStr);
  const upcomingExams = exams.filter((e) => new Date(`${e.exam_date}T23:59:59`) >= now);
  const done = tasks.length - pending.length;
  const overall = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  const streak = useMemo(() => {
    const days = new Set(sessions.map((s) => s.session_date));
    let count = 0;
    const cursor = new Date(now);
    while (days.has(cursor.toISOString().slice(0, 10))) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [sessions, now]);

  const cards: Card[] = [
    { to: "/subjects", emoji: "📚", icon: BookOpen, title: "Subjects", desc: "Chapters & topics", badge: subjectsWithPending },
    { to: "/planner", emoji: "🤖", icon: Sparkles, title: "AI Study Planner", desc: "Personalised plan", badge: 0 },
    { to: "/planner", emoji: "📅", icon: CalendarRange, title: "Daily Schedule", desc: "Today's timetable", badge: dueToday.length },
    { to: "/tasks", emoji: "✅", icon: ListTodo, title: "Tasks", desc: "Study to-dos", badge: pending.length },
    { to: "/exams", emoji: "⏳", icon: CalendarClock, title: "Exam Countdown", desc: "Days remaining", badge: upcomingExams.length },
    { to: "/progress", emoji: "📈", icon: LineChart, title: "Progress", desc: "Analytics & stats", badge: 0 },
    { to: "/notes", emoji: "📝", icon: FileText, title: "Notes", desc: "Revision material", badge: 0 },
    { to: "/tasks", search: { kind: "homework" }, emoji: "📖", icon: ClipboardList, title: "Homework", desc: "Pending homework", badge: homework.length },
    { to: "/settings", emoji: "⚙️", icon: Settings, title: "Settings", desc: "Theme & reminders", badge: 0 },
    { to: "/profile", emoji: "👤", icon: User, title: "Profile", desc: "Your study identity", badge: 0 },
  ];

  const firstName = (profile?.full_name || user?.email?.split("@")[0] || "Student").split(" ")[0];

  return (
    <AppShell>
      <header className="animate-rise mb-6">
        <p className="text-sm text-muted-foreground">
          {today.day} · {today.date} · {clock}
        </p>
        <h1 className="mt-1 text-2xl font-semibold leading-tight">
          {greeting.text}, {firstName} {greeting.emoji}
        </h1>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <>
          <div className="animate-rise surface-card mb-5 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Overall progress</p>
                <p className="mt-1 text-3xl font-semibold">{overall}%</p>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-primary/12 px-3 py-2 text-primary">
                <Flame className="size-4" />
                <span className="text-sm font-semibold">{streak} day streak</span>
              </div>
            </div>
            <Progress value={overall} className="mt-4" />
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <Mini label="Pending" value={pending.length} />
              <Mini label="Completed" value={done} />
              <Mini label="Due today" value={dueToday.length} />
            </div>
          </div>

          {upcomingExams.length > 0 ? (
            <Link to="/exams" className="surface-card press mb-5 flex items-center gap-3 p-4">
              <span className="text-2xl">{subjectIcon(upcomingExams[0].subject)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{upcomingExams[0].subject} exam</p>
                <p className="text-xs text-muted-foreground">{countdownText(upcomingExams[0].exam_date)}</p>
              </div>
              <CountBadge count={upcomingExams.length} />
            </Link>
          ) : null}

          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Everything you need</h2>
          <div className="grid grid-cols-2 gap-3">
            {cards.map((card, i) => (
              <Link
                key={`${card.title}-${i}`}
                to={card.to}
                search={card.search as never}
                className={cn(
                  "surface-card press relative flex flex-col gap-2 p-4",
                  "transition-transform duration-200 hover:-translate-y-0.5",
                )}
              >
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/12 text-xl">
                  {card.emoji}
                </span>
                <p className="text-sm font-semibold leading-tight">{card.title}</p>
                <p className="text-[11px] leading-snug text-muted-foreground">{card.desc}</p>
                <CountBadge count={card.badge} className="absolute right-3 top-3" />
              </Link>
            ))}
          </div>

          <h2 className="mb-3 mt-6 text-sm font-semibold text-muted-foreground">Today's tasks</h2>
          {dueToday.length === 0 && pending.length === 0 ? (
            <div className="surface-card p-6 text-center">
              <p className="text-3xl">🌱</p>
              <p className="mt-2 font-semibold">No study tasks available yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a task or generate an AI plan to fill today's schedule.
              </p>
              <Link to="/planner" className="mt-3 inline-block text-sm font-medium text-primary">
                Generate my plan
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {(dueToday.length ? dueToday : pending).slice(0, 5).map((t) => (
                <li key={t.id}>
                  <Link
                    to="/tasks/$taskId"
                    params={{ taskId: t.id }}
                    className="surface-card press flex items-center gap-3 p-4"
                  >
                    <span className="text-lg">{subjectIcon(t.subject)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.title}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {[t.subject, t.topic].filter(Boolean).join(" · ")} · ⏱ {t.estimated_minutes} min
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {t.status === "in_progress" ? "🟡" : "⭕"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </AppShell>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-muted/40 px-2 py-3">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}