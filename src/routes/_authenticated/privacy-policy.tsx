import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | AI Study Planner" },
      { name: "description", content: "How AI Study Planner collects, stores and protects your study data." },
      { property: "og:title", content: "Privacy Policy" },
      { property: "og:description", content: "Your study data is private to your account and never sold." },
    ],
  }),
  component: PrivacyPage,
});

const SECTIONS: { title: string; body: string }[] = [
  {
    title: "What we store",
    body: "Only what you enter in the app: your profile details (name, username, phone, class, board, photo), subjects, tasks, notes, exams, quizzes, study plans and progress records.",
  },
  {
    title: "Where it is stored",
    body: "Your data is saved in your own account on the app's secure backend, protected by row-level access rules so only you can read or change your records. Your theme choice and session are kept on your device.",
  },
  {
    title: "AI features",
    body: "When you generate a plan, ask the tutor, create a quiz or summarise a note, the relevant text is sent to the AI provider to produce the answer. It is used only to generate that response and is not used to identify you.",
  },
  {
    title: "What we never do",
    body: "We never sell your data, never share it with advertisers, and never show your study records to other students.",
  },
  {
    title: "Your control",
    body: "You can edit or delete any task, note, plan or subject at any time. Settings lets you export a full JSON backup of your study data and restore it later.",
  },
  {
    title: "Account and contact",
    body: "Signing in uses your Gmail address for identification only. If you want your account and data removed, contact us from the email linked to your account and we will delete it.",
  },
];

function PrivacyPage() {
  return (
    <AppShell>
      <PageHeader title="Privacy Policy" subtitle="Your data, handled with care" />

      <section className="surface-card animate-rise p-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          AI Study Planner is a study tool for matric students. We keep data collection to the minimum needed to run your
          planner, and everything you save stays private to your account.
        </p>
      </section>

      <div className="mt-3 space-y-3">
        {SECTIONS.map((s) => (
          <section key={s.title} className="surface-card animate-rise p-5">
            <p className="text-sm font-semibold">{s.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
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
