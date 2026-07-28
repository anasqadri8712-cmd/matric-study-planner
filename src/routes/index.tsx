import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, BrainCircuit, CalendarCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";
import heroImage from "@/assets/welcome-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Study Planner for Matric Students" },
      {
        name: "description",
        content:
          "Class 9 and 10 study companion: AI-generated timetables, doubt solving, quizzes, notes and progress tracking.",
      },
      { property: "og:title", content: "AI Study Planner for Matric Students" },
      {
        property: "og:description",
        content: "Plan smarter, study calmer and track every chapter with your AI study coach.",
      },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const { session, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) navigate({ to: "/home", replace: true });
  }, [loading, session, navigate]);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-6 py-10">
        <div className="animate-rise flex items-center gap-2">
          <span className="gradient-primary flex size-9 items-center justify-center rounded-xl text-primary-foreground">
            <BrainCircuit className="size-5" />
          </span>
          <span className="font-display text-sm font-semibold tracking-tight">AI Study Planner</span>
        </div>

        <div className="animate-rise mt-8 overflow-hidden rounded-3xl border border-border">
          <img
            src={heroImage}
            alt="Student studying with an AI assistant organising their timetable"
            width={1024}
            height={1024}
            className="w-full object-cover"
          />
        </div>

        <div className="animate-rise mt-8 flex-1">
          <h1 className="text-3xl leading-tight font-semibold">
            Study smarter for <span className="text-gradient">matric</span>, not longer.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Your personal AI coach builds the timetable, answers your doubts, quizzes you and keeps every
            chapter on track — built for Class 9 & 10.
          </p>

          <ul className="mt-6 space-y-3">
            {[
              { icon: CalendarCheck, text: "Weekly plans made around your free hours" },
              { icon: Sparkles, text: "Instant doubt solving, quizzes and note summaries" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="surface-card flex items-center gap-3 p-4">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <Icon className="size-4" />
                </span>
                <span className="text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-rise mt-8 space-y-3">
          <Button asChild className="press h-13 w-full rounded-2xl text-base">
            <Link to="/auth">
              Get Started <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link to="/auth" className="font-semibold text-primary">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
