import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, CheckCircle2, Clock, Play, Sparkles, Target } from "lucide-react";
import { toast } from "sonner";
import { AppShell, EmptyState, Loader } from "@/components/app/AppShell";
import { ProgressRing } from "@/components/app/ProgressRing";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";
import { useInsert, useProfile, useSubjects, useTasks, useUpdate } from "@/lib/data";
import { generateQuiz, type QuizQuestion } from "@/lib/ai.functions";
import { KIND_LABEL, STATUS_META, formatDuration, subjectIcon } from "@/lib/matric";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tasks/$taskId")({
  head: () => ({
    meta: [
      { title: "Task Details | AI Study Planner" },
      { name: "description", content: "Study material, timer and quiz verification for this study task." },
      { property: "og:title", content: "Task Details" },
      { property: "og:description", content: "Study timer and quiz verification for your task." },
    ],
  }),
  component: TaskDetail,
});

function TaskDetail() {
  const { taskId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useSession();
  const { data: profile } = useProfile(user?.id);
  const { data: tasks = [], isLoading } = useTasks(user?.id);
  const { data: subjects = [] } = useSubjects(user?.id);
  const updateTask = useUpdate("tasks", "tasks");
  const updateSubject = useUpdate("subjects", "subjects");
  const addHistory = useInsert("task_history", "task_history");
  const addSession = useInsert("study_sessions", "study_sessions");
  const runQuiz = useServerFn(generateQuiz);

  const task = tasks.find((t) => t.id === taskId);

  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState<"detail" | "quiz" | "passed" | "failed">("detail");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const score = useMemo(
    () => questions.reduce((acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0), 0),
    [questions, answers],
  );

  if (isLoading) {
    return (
      <AppShell>
        <Loader label="Loading task" />
      </AppShell>
    );
  }

  if (!task) {
    return (
      <AppShell>
        <EmptyState
          icon={<Target strokeWidth={1.75} className="size-5" />}
          title="This task no longer exists"
          description="It may have been removed. Head back to your task list."
          art="tasks"
          action={
            <Link to="/tasks" className="text-sm font-medium text-primary">
              Back to tasks
            </Link>
          }
        />
      </AppShell>
    );
  }

  async function startTask() {
    setRunning(true);
    if (task!.status === "not_started") {
      await updateTask.mutateAsync({
        id: task!.id,
        patch: { status: "in_progress", started_at: new Date().toISOString() },
      });
    }
    toast.success("Study timer started. Focus time!");
  }

  async function openVerification() {
    setRunning(false);
    setLoadingQuiz(true);
    setStage("quiz");
    try {
      const res = await runQuiz({
        data: {
          subject: task!.subject ?? "General",
          topic: task!.topic || task!.chapter || task!.title,
          studentClass: profile?.student_class ?? "Class 10",
          count: 3,
        },
      });
      setQuestions((res.questions ?? []).slice(0, 3));
      setAnswers({});
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create the verification quiz.");
      setStage("detail");
    } finally {
      setLoadingQuiz(false);
    }
  }

  async function submitQuiz() {
    if (Object.keys(answers).length < questions.length) {
      return toast.error("Answer all questions first.");
    }
    if (score < 2) {
      setStage("failed");
      return;
    }
    const minutes = Math.max(1, Math.round(seconds / 60));
    await updateTask.mutateAsync({
      id: task!.id,
      patch: {
        status: "completed",
        completed: true,
        completed_at: new Date().toISOString(),
        quiz_score: score,
        study_minutes: (task!.study_minutes ?? 0) + minutes,
      },
    });
    await addHistory.mutateAsync({
      user_id: user!.id,
      task_id: task!.id,
      title: task!.title,
      subject: task!.subject,
      topic: task!.topic,
      quiz_score: score,
      quiz_total: questions.length,
      study_minutes: minutes,
    });
    await addSession.mutateAsync({
      user_id: user!.id,
      subject: task!.subject ?? "General",
      minutes,
    });
    const linked = subjects.find((s) => s.id === task!.subject_id || s.name === task!.subject);
    if (linked && linked.completed_chapters < linked.total_chapters) {
      await updateSubject.mutateAsync({
        id: linked.id,
        patch: { completed_chapters: linked.completed_chapters + 1 },
      });
    }
    qc.invalidateQueries();
    setStage("passed");
  }

  const meta = STATUS_META[task.status] ?? STATUS_META.not_started;

  return (
    <AppShell>
      <button onClick={() => navigate({ to: "/tasks" })} className="press mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft strokeWidth={1.75} className="size-4" /> Back
      </button>

      {stage === "detail" && (
        <div className="animate-rise space-y-4">
          <div className="surface-card p-5">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{subjectIcon(task.subject)}</span>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold leading-tight">{task.title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[task.subject, task.topic, task.chapter].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <Stat label="Type" value={KIND_LABEL[task.kind] ?? task.kind} />
              <Stat label="Time" value={`${task.estimated_minutes} min`} />
              <Stat label="Difficulty" value={task.difficulty} />
            </div>
            <p className={cn("mt-3 text-center text-sm font-medium", meta.className)}>
              {meta.dot} {meta.label}
            </p>
          </div>

          <Section icon={<BookOpen strokeWidth={1.75} className="size-4" />} title="Description">
            {task.description || "No extra description added for this task."}
          </Section>
          <Section icon={<Target strokeWidth={1.75} className="size-4" />} title="Learning objective">
            {task.objective || `Understand and master ${task.topic || task.title}.`}
          </Section>
          <Section icon={<Sparkles strokeWidth={1.75} className="size-4" />} title="Study material">
            {task.material || "Use your textbook chapter, class notes and past paper questions."}
          </Section>

          <div className="surface-card animate-rise p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Study timer</p>
            <div className="mt-4 flex justify-center">
              <ProgressRing
                value={Math.min(100, (seconds / (task.estimated_minutes * 60)) * 100)}
                size={140}
                stroke={11}
                tone={running ? "success" : "primary"}
                label={formatDuration(seconds)}
                sublabel={running ? "Focusing" : "Paused"}
                className={running ? "animate-ring-pulse" : ""}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Saved so far: {task.study_minutes ?? 0} min · Target {task.estimated_minutes} min
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button
                variant={running ? "secondary" : "default"}
                onClick={() => (running ? setRunning(false) : startTask())}
                className="press h-12 rounded-xl"
                disabled={task.status === "completed"}
              >
                <Play strokeWidth={1.75} className="mr-1 size-4" /> {running ? "Pause" : "Start task"}
              </Button>
              <Button
                onClick={openVerification}
                className="press h-12 rounded-xl"
                disabled={task.status === "completed"}
              >
                <CheckCircle2 strokeWidth={1.75} className="mr-1 size-4" /> Complete task
              </Button>
            </div>
            {task.status === "completed" ? (
              <p className="mt-3 text-xs text-success">
                Verified with {task.quiz_score ?? 0}/3 quiz score.
              </p>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                Completing needs a 3-question topic quiz — at least 2 correct.
              </p>
            )}
          </div>
        </div>
      )}

      {stage === "quiz" && (
        <div className="animate-rise space-y-4">
          <h1 className="text-xl font-semibold">Quiz verification</h1>
          <p className="text-sm text-muted-foreground">
            Answer at least 2 of 3 correctly to mark “{task.title}” completed.
          </p>
          {loadingQuiz ? (
            <Loader label="AI is writing your questions" />
          ) : (
            <>
              <div className="flex items-center justify-center">
                <ProgressRing
                  value={(Object.keys(answers).length / Math.max(1, questions.length)) * 100}
                  size={72}
                  stroke={7}
                  tone="primary"
                  label={`${Object.keys(answers).length}/${questions.length}`}
                  sublabel="Answered"
                />
              </div>
              {questions.map((q, i) => (
                <div key={i} className="surface-card animate-rise space-y-2 p-4">
                  <p className="font-medium">
                    {i + 1}. {q.question}
                  </p>
                  {q.options.map((opt, oi) => (
                    <button
                      key={oi}
                      onClick={() => setAnswers({ ...answers, [i]: oi })}
                      className={cn(
                        "press w-full rounded-xl border px-3 py-2.5 text-left text-sm",
                        answers[i] === oi ? "border-primary bg-primary/12" : "border-border",
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ))}
              <Button onClick={submitQuiz} className="press h-12 w-full rounded-xl">
                Submit answers
              </Button>
            </>
          )}
        </div>
      )}

      {stage === "passed" && (
        <div className="animate-rise surface-card space-y-3 p-8 text-center">
          <p className="text-5xl">🎉</p>
          <h1 className="text-xl font-semibold">Congratulations!</h1>
          <p className="text-sm text-muted-foreground">
            Task completed successfully with {score}/{questions.length}. Progress, badges and weekly stats are updated.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="secondary" className="press h-12 rounded-xl" onClick={() => navigate({ to: "/tasks" })}>
              All tasks
            </Button>
            <Button className="press h-12 rounded-xl" onClick={() => navigate({ to: "/home" })}>
              Dashboard
            </Button>
          </div>
        </div>
      )}

      {stage === "failed" && (
        <div className="animate-rise surface-card space-y-3 p-8 text-center">
          <p className="text-5xl">📚</p>
          <h1 className="text-xl font-semibold">Almost there</h1>
          <p className="text-sm text-muted-foreground">
            You scored {score}/{questions.length}. You should revise this topic again before marking it completed.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="secondary" className="press h-12 rounded-xl" onClick={() => setStage("detail")}>
              Back to task
            </Button>
            <Button className="press h-12 rounded-xl" onClick={openVerification}>
              Try again
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/40 px-2 py-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold capitalize">{value}</p>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="surface-card p-5">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <span className="text-primary">{icon}</span>
        {title}
      </p>
      <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}