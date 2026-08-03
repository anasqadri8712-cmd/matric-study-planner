import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ChevronLeft, ShieldCheck, Sparkles, Target } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/about")({
  head: () => ({
    meta: [
      { title: "About Us | AI Study Planner" },
      {
        name: "description",
        content: "AI Study Planner helps 9th and 10th class matric students plan smarter with AI-built weekly schedules.",
      },
      { property: "og:title", content: "About AI Study Planner" },
      { property: "og:description", content: "Built to help matric students optimise their board exam preparation." },
    ],
  }),
  component: AboutPage,
});

const POINTS = [
  {
    icon: Target,
    title: "Built for matric students",
    body: "Made specifically for 9th and 10th class students preparing for Punjab, Federal and other board exams.",
  },
  {
    icon: Sparkles,
    title: "AI-driven schedules",
    body: "Your weekly timetable is weighted by weak and strong subjects, pending tasks, quiz results and exam countdowns — never split equally.",
  },
  {
    icon: BookOpen,
    title: "Everything in one place",
    body: "Subjects, tasks, homework, notes, quizzes, progress analytics and rewards live together so nothing slips.",
  },
  {
    icon: ShieldCheck,
    title: "Your data stays yours",
    body: "Your study data is tied to your own account, and you can export or restore a full backup any time.",
  },
];

function AboutPage() {
  return (
    <AppShell>
      <PageHeader title="About Us" subtitle="Why this app exists" />

      <section className="surface-card animate-rise p-5">
        <p className="text-sm font-semibold">AI Study Planner for Matric Students</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          AI Study Planner was created to help 9th and 10th class students optimise their board exam preparation. Instead
          of guessing what to study next, students get a realistic weekly plan that adapts to the subjects they struggle
          with, the tasks they still owe and the exams that are closest.
        </p>
      </section>

      <div className="mt-3 space-y-3">
        {POINTS.map(({ icon: Icon, title, body }) => (
          <section key={title} className="surface-card animate-rise flex gap-4 p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <Icon className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
            </div>
          </section>
        ))}
      </div>

      <Button asChild variant="outline" className="press mt-6 h-12 w-full rounded-2xl">
        <Link to="/settings">
          <ChevronLeft className="mr-1 size-4" /> Back to settings
        </Link>
      </Button>
    </AppShell>
  );
}
