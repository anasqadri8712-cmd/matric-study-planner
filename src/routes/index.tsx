import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, CalendarCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoLockup } from "@/components/app/Logo";
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
    <main className="relative h-[100dvh] overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80"
        style={{
          background:
            "radial-gradient(75% 100% at 50% 0%, color-mix(in oklab, var(--primary) 18%, transparent), transparent 72%)",
        }}
      />
      <div className="relative mx-auto flex h-full w-full max-w-lg flex-col px-6 py-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="animate-rise shrink-0">
          <LogoLockup compact />
        </div>

        <div className="animate-rise glass-panel mx-auto mt-3 w-full max-w-[220px] shrink overflow-hidden rounded-3xl p-1.5">
          <img
            src={heroImage}
            alt="Student studying with an AI assistant organising their timetable"
            width={1024}
            height={1024}
            className="aspect-square w-full rounded-[1.15rem] object-cover"
          />
        </div>


        <div className="animate-rise mt-4 min-h-0 flex-1">
          <h1 className="text-[clamp(1.35rem,6vw,1.9rem)] font-semibold leading-tight">
            Study smarter for <span className="text-gradient">matric</span>, not longer.
          </h1>
          <p className="mt-2 text-[13px] leading-snug text-muted-foreground">
            Your AI coach builds the timetable, answers doubts and keeps every chapter on track — for
            Class 9 &amp; 10.
          </p>

          <ul className="mt-3 space-y-2">
            {[
              { icon: CalendarCheck, text: "Weekly plans made around your free hours" },
              { icon: Sparkles, text: "Doubt solving, quizzes and note summaries" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="surface-card flex items-center gap-3 px-3 py-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <Icon className="size-4" />
                </span>
                <span className="text-[13px] leading-snug">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-rise mt-3 shrink-0 space-y-2">
          <Button asChild className="press h-12 w-full rounded-2xl text-base">
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
