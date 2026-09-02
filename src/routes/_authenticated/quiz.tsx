import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BookOpenCheck, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { ProgressRing } from "@/components/app/ProgressRing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session";
import { useInsert, useProfile, useSubjects } from "@/lib/data";
import { generateQuiz, type QuizQuestion } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/quiz")({
  head: () => ({
    meta: [
      { title: "AI Quiz Generator | AI Study Planner" },
      { name: "description", content: "Generate instant MCQ practice tests for any matric chapter and check your score." },
      { property: "og:title", content: "AI Quiz Generator" },
      { property: "og:description", content: "Instant MCQ practice for any matric chapter." },
    ],
  }),
  component: QuizPage,
});

function QuizPage() {
  const { user } = useSession();
  const { data: profile } = useProfile(user?.id);
  const { data: subjects = [] } = useSubjects(user?.id);
  const create = useServerFn(generateQuiz);
  const saveQuiz = useInsert("quizzes", "quizzes");

  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = questions
    ? questions.reduce((acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0), 0)
    : 0;

  async function start() {
    if (!subject) return toast.error("Choose a subject.");
    if (!topic.trim()) return toast.error("Enter a topic or chapter.");
    setBusy(true);
    try {
      const result = await create({
        data: { subject, topic: topic.trim(), studentClass: profile?.student_class ?? "Class 9", count: 5 },
      });
      setQuestions(result.questions);
      setAnswers({});
      setSubmitted(false);
    } catch {
      toast.error("Could not create the quiz. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!questions) return;
    setSubmitted(true);
    await saveQuiz.mutateAsync({
      user_id: user!.id,
      subject,
      topic: topic.trim(),
      questions: questions as unknown as Record<string, unknown>,
      score: Math.round((score / questions.length) * 100),
    });
  }

  return (
    <AppShell>
      <PageHeader title="Quiz me" subtitle="Practice MCQs generated for your chapter" />

      {!questions ? (
        <div className="glass-panel animate-rise space-y-4 rounded-3xl p-6">
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
              {subjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">Add subjects first from the Subjects tab.</p>
              ) : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Topic or chapter</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ch 3 — Dynamics"
              className="h-12 rounded-xl"
            />
          </div>
          <Button onClick={start} disabled={busy} className="press h-13 w-full rounded-2xl gradient-primary">
            <Sparkles strokeWidth={1.75} className="mr-1 size-4" />
            {busy ? "Writing questions..." : "Generate quiz"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {!submitted ? (
            <div className="flex items-center justify-center">
              <ProgressRing
                value={(Object.keys(answers).length / Math.max(1, questions.length)) * 100}
                size={80}
                stroke={7}
                tone="primary"
                label={`${Object.keys(answers).length}/${questions.length}`}
                sublabel="Answered"
              />
            </div>
          ) : null}
          {submitted ? (
            <div className="gradient-primary animate-rise rounded-3xl p-5 text-primary-foreground">
              <p className="text-xs opacity-80">Your score</p>
              <p className="mt-1 text-3xl font-semibold">
                {score}/{questions.length}
              </p>
              <p className="mt-1 text-sm opacity-90">
                {score === questions.length
                  ? "Perfect! Move to the next chapter."
                  : score >= questions.length / 2
                    ? "Good going — review the misses below."
                    : "Revise this chapter once more, then retry."}
              </p>
            </div>
          ) : null}

          {questions.map((q, i) => (
            <div key={i} className="surface-card lift animate-rise p-4" style={{ animationDelay: `${i * 60}ms` }}>
              <p className="text-sm font-medium">
                {i + 1}. {q.question}
              </p>
              <div className="mt-3 space-y-2">
                {q.options.map((opt, oi) => {
                  const picked = answers[i] === oi;
                  const correct = submitted && oi === q.answer;
                  const wrong = submitted && picked && oi !== q.answer;
                  return (
                    <button
                      key={oi}
                      disabled={submitted}
                      onClick={() => setAnswers((a) => ({ ...a, [i]: oi }))}
                      className={cn(
                        "press animate-pop w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                        correct
                          ? "border-success bg-success/12 text-success"
                          : wrong
                            ? "border-destructive bg-destructive/12 text-destructive"
                            : picked
                              ? "border-primary bg-primary/12 text-primary"
                              : "border-border",
                      )}
                      style={{ animationDelay: `${oi * 40}ms` }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {submitted ? (
                <p className="mt-3 text-xs text-muted-foreground">{q.explanation}</p>
              ) : null}
            </div>
          ))}

          {submitted ? (
            <Button
              variant="outline"
              onClick={() => setQuestions(null)}
              className="press h-12 w-full rounded-2xl"
            >
              <RotateCcw strokeWidth={1.75} className="mr-1 size-4" /> New quiz
            </Button>
          ) : (
            <Button
              onClick={submit}
              disabled={Object.keys(answers).length !== questions.length}
              className="press h-13 w-full rounded-2xl"
            >
              <BookOpenCheck strokeWidth={1.75} className="mr-1 size-4" /> Submit answers
            </Button>
          )}
        </div>
      )}
    </AppShell>
  );
}
