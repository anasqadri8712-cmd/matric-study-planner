import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowLeft, ListTodo } from "lucide-react";
import { AppShell, CountBadge, EmptyState, Loader } from "@/components/app/AppShell";
import { Progress } from "@/components/ui/progress";
import { useSession } from "@/lib/session";
import { useSubjects, useTasks } from "@/lib/data";
import { KIND_LABEL, STATUS_META, subjectIcon } from "@/lib/matric";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/subjects/$subjectId")({
  head: () => ({
    meta: [
      { title: "Subject Details | AI Study Planner" },
      { name: "description", content: "Chapters, topics, assignments, revision and MCQs for this subject." },
      { property: "og:title", content: "Subject Details" },
      { property: "og:description", content: "Chapters, topics, revision and MCQs for this subject." },
    ],
  }),
  component: SubjectDetail,
});

const GROUPS = [
  { kind: "task", title: "Topics & chapters" },
  { kind: "homework", title: "Assignments & homework" },
  { kind: "revision", title: "Revision" },
  { kind: "mcqs", title: "MCQs" },
  { kind: "practice", title: "Practice tests" },
] as const;

function SubjectDetail() {
  const { subjectId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useSession();
  const { data: subjects = [], isLoading } = useSubjects(user?.id);
  const { data: tasks = [] } = useTasks(user?.id);

  const subject = subjects.find((s) => s.id === subjectId);
  const subjectTasks = useMemo(
    () => tasks.filter((t) => t.subject_id === subjectId || (subject && t.subject === subject.name)),
    [tasks, subjectId, subject],
  );

  if (isLoading) {
    return (
      <AppShell>
        <Loader label="Loading subject" />
      </AppShell>
    );
  }

  if (!subject) {
    return (
      <AppShell>
        <div className="surface-card p-8 text-center">
          <p className="font-semibold">Subject not found</p>
          <Link to="/subjects" className="mt-3 inline-block text-sm text-primary">
            Back to subjects
          </Link>
        </div>
      </AppShell>
    );
  }

  const total = subjectTasks.length;
  const done = subjectTasks.filter((t) => t.status === "completed").length;
  const inProgress = subjectTasks.filter((t) => t.status === "in_progress").length;
  const pending = total - done;
  const chapterPct = Math.round((subject.completed_chapters / Math.max(1, subject.total_chapters)) * 100);
  const taskPct = total ? Math.round((done / total) * 100) : chapterPct;

  return (
    <AppShell>
      <button
        onClick={() => navigate({ to: "/subjects" })}
        className="press mb-4 flex items-center gap-2 text-sm text-muted-foreground"
      >
        <ArrowLeft className="size-4" /> Subjects
      </button>

      <div className="animate-rise surface-card mb-4 p-5">
        <div className="flex items-center gap-3">
          <span
            className="flex size-12 items-center justify-center rounded-2xl text-2xl"
            style={{ backgroundColor: `${subject.color}22` }}
          >
            {subject.icon || subjectIcon(subject.name)}
          </span>
          <div>
            <h1 className="text-xl font-semibold">{subject.name}</h1>
            <p className="text-xs text-muted-foreground">
              Chapters {subject.completed_chapters}/{subject.total_chapters} · {chapterPct}% covered
            </p>
          </div>
        </div>
        <Progress value={taskPct} className="mt-4" />
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          <Tile label="Total" value={total} />
          <Tile label="Done" value={done} />
          <Tile label="Pending" value={pending} />
          <Tile label="Active" value={inProgress} />
        </div>
      </div>

      {total === 0 ? (
        <EmptyState
          icon={<ListTodo className="size-6" />}
          title="No study tasks available yet"
          description={`Add tasks for ${subject.name} or generate a plan and the AI will fill this page.`}
        />
      ) : (
        <div className="space-y-5">
          {GROUPS.map((group) => {
            const items = subjectTasks.filter((t) => t.kind === group.kind);
            if (items.length === 0) return null;
            const pendingCount = items.filter((t) => t.status !== "completed").length;
            return (
              <section key={group.kind}>
                <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  {group.title}
                  <CountBadge count={pendingCount} />
                </h2>
                <ul className="space-y-2">
                  {items.map((t) => (
                    <li key={t.id}>
                      <Link
                        to="/tasks/$taskId"
                        params={{ taskId: t.id }}
                        className="surface-card press flex items-center gap-3 p-4"
                      >
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "truncate text-sm font-medium",
                              t.status === "completed" && "line-through opacity-60",
                            )}
                          >
                            {t.title}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {[t.chapter, t.topic, KIND_LABEL[t.kind]].filter(Boolean).join(" · ")} · ⏱{" "}
                            {t.estimated_minutes} min
                          </p>
                        </div>
                        <span className={cn("text-xs", STATUS_META[t.status]?.className)}>
                          {STATUS_META[t.status]?.dot}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-muted/40 px-2 py-3">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}