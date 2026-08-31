import { createFileRoute, Link } from "@tanstack/react-router";
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
  Sparkles,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell, CountBadge, SkeletonBlock, EmptyState } from "@/components/app/AppShell";
import { LogoLockup } from "@/components/app/Logo";
import { ProgressRing } from "@/components/app/ProgressRing";
import { StudyReportActions } from "@/components/app/StudyReportActions";

import { useSession } from "@/lib/session";
import { getGreeting, formatToday } from "@/lib/greeting";
import { useExams, useProfile, useQuizzes, useSessions, useSubjects, useTasks } from "@/lib/data";
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
  const { data: profile, isLoading } = useProfile(user?.id);
  const { data: tasks = [] } = useTasks(user?.id);
  const { data: subjects = [] } = useSubjects(user?.id);
  const { data: exams = [] } = useExams(user?.id);
  const { data: sessions = [] } = useSessions(user?.id);
  const { data: quizzes = [] } = useQuizzes(user?.id);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(id);
  }, []);

  const greeting = getGreeting(now);
  const today = formatToday(now);
  const clock = now.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });

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
    { to: "/rewards", emoji: "🏆", icon: Trophy, title: "Rewards", desc: "Badges you earned", badge: 0 },
    { to: "/plan-history", emoji: "🗂", icon: CalendarClock, title: "Plan History", desc: "Past weekly plans", badge: 0 },
  ];

  const firstName = (profile?.full_name || user?.email?.split("@")[0] || "Student").split(" ")[0];

  const dailyGoalMinutes = Math.round(Number(profile?.daily_hours ?? 3) * 60);
  const studiedToday = sessions
    .filter((s) => s.session_date === todayStr)
    .reduce((sum, s) => sum + (Number(s.minutes) || 0), 0);
  const goalPct = dailyGoalMinutes ? Math.min(100, Math.round((studiedToday / dailyGoalMinutes) * 100)) : 0;

  const focus = useMemo(() => {
    const weak = (profile?.weak_subjects ?? []).map((w) => w.toLowerCase());
    const strong = (profile?.strong_subjects ?? []).map((w) => w.toLowerCase());
    const scored = subjects.map((s) => {
      const lower = s.name.toLowerCase();
      const exam = upcomingExams.find((e) => (e.subject ?? "").toLowerCase() === lower);
      const daysLeft = exam
        ? Math.max(0, Math.ceil((new Date(exam.exam_date).getTime() - now.getTime()) / 86_400_000))
        : null;
      const quiz = quizzes.find((q) => (q.subject ?? "").toLowerCase() === lower);
      const pendingCount = pending.filter((t) => t.subject_id === s.id || t.subject === s.name).length;

      let score = 0;
      const reasons: string[] = [];
      if (weak.includes(lower)) {
        score += 45;
        reasons.push("marked weak");
      }
      if (strong.includes(lower)) score -= 20;
      if (daysLeft !== null) {
        score += Math.max(10, 60 - daysLeft * 4);
        reasons.push(`exam in ${daysLeft}d`);
      }
      if (quiz && typeof quiz.score === "number") {
        score += Math.max(0, 70 - Number(quiz.score)) / 2;
        reasons.push(`last quiz ${Math.round(Number(quiz.score))}%`);
      }
      if (pendingCount) {
        score += pendingCount * 6;
        reasons.push(`${pendingCount} pending task${pendingCount === 1 ? "" : "s"}`);
      }
      return { name: s.name, score, reason: reasons.slice(0, 2).join(" · ") || "keep the streak going" };
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, 2);
  }, [subjects, profile, upcomingExams, quizzes, pending, now]);

  return (
    <AppShell>
      <header className="animate-rise glass-panel mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 p-6">
        <div className="min-w-0">
          <LogoLockup compact />
          <p className="mt-4 text-xs font-medium tracking-normal text-muted-foreground">
            {greeting.text} {greeting.emoji}
          </p>
          <p className="mt-0.5 truncate font-display text-xl font-bold tracking-tight">Hi, {firstName}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {today.day} · {today.date}
          </p>
          <p className="text-xs font-semibold tabular-nums text-primary">{clock}</p>
        </div>
        <ProgressRing value={goalPct} size={78} stroke={8} tone="success" sublabel="Goal" />
      </header>

      {isLoading ? (
        <SkeletonBlock rows={3} />
      ) : (

        <>
          <section className="card-highlight animate-pop mb-5 rounded-3xl border p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Sparkles className="size-4" /> AI Daily Quick Summary
              </p>
              <span className="flex items-center gap-1 rounded-full bg-primary/12 px-2.5 py-1 text-[11px] font-semibold text-primary">
                <Flame className="size-3.5" /> {streak}d
              </span>
            </div>

            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Today's top focus
            </p>
            {focus.length ? (
              <ul className="mt-2 space-y-2">
                {focus.map((f, i) => (
                  <li key={f.name} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {subjectIcon(f.name)} {f.name}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">{f.reason}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                Pick your subjects in My Subjects and the AI will highlight what to study first.
              </p>
            )}

            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                <span>Daily goal</span>
                <span className="tabular-nums">
                  {studiedToday}/{dailyGoalMinutes} min
                </span>
              </div>
              <Progress value={goalPct} className="mt-1.5 h-2" />
            </div>
          </section>

          <div className="animate-rise surface-card mb-5 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Overall progress</p>
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
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <card.icon className="size-5" strokeWidth={1.9} />
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

          <h2 className="mb-3 mt-6 text-sm font-semibold text-muted-foreground">Share your progress</h2>
          <StudyReportActions />
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