import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ListTodo, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { AppShell, EmptyState, PageHeader, SkeletonCard } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSession } from "@/lib/session";
import { useInsert, useSubjects, useTasks } from "@/lib/data";
import {
  DIFFICULTIES,
  KIND_LABEL,
  STATUS_META,
  TASK_KINDS,
  subjectIcon,
} from "@/lib/matric";
import { cn } from "@/lib/utils";

type Search = { kind?: string; status?: string; subject?: string };

export const Route = createFileRoute("/_authenticated/tasks/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    kind: typeof search.kind === "string" ? search.kind : undefined,
    status: typeof search.status === "string" ? search.status : undefined,
    subject: typeof search.subject === "string" ? search.subject : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Study Tasks & Homework | AI Study Planner" },
      { name: "description", content: "Search, filter and open every study task, homework and revision item." },
      { property: "og:title", content: "Study Tasks & Homework" },
      { property: "og:description", content: "Search and filter every study task and homework item." },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const { kind, status, subject: subjectParam } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { user } = useSession();
  const { data: tasks = [], isLoading } = useTasks(user?.id);
  const { data: subjects = [] } = useSubjects(user?.id);
  const add = useInsert("tasks", "tasks");

  const [q, setQ] = useState("");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    subject: "" as string,
    topic: "",
    chapter: "",
    kind: "task" as string,
    difficulty: "medium" as string,
    estimated: "30",
    due: "",
    description: "",
    objective: "",
    material: "",
  });

  const subjectNames = useMemo(
    () => Array.from(new Set(subjects.map((s) => s.name))),
    [subjects],
  );

  useEffect(() => {
    if (!subjectNames.length) return;
    if (!form.subject || !subjectNames.includes(form.subject)) {
      setForm((f) => ({ ...f, subject: subjectNames[0] }));
    }
  }, [subjectNames, form.subject]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return tasks.filter((t) => {
      if (kind && t.kind !== kind) return false;
      if (status && t.status !== status) return false;
      if (subjectParam && t.subject !== subjectParam) return false;
      if (difficulty !== "all" && t.difficulty !== difficulty) return false;
      if (!term) return true;
      return [t.title, t.subject, t.topic, t.chapter].some((v) => (v ?? "").toLowerCase().includes(term));
    });
  }, [tasks, kind, status, subjectParam, difficulty, q]);

  function setFilter(patch: Search) {
    navigate({ search: (prev: Search) => ({ ...prev, ...patch }) });
  }

  async function create() {
    if (!form.title.trim()) return toast.error("Give the task a title.");
    const linked = subjects.find((s) => s.name === form.subject);
    await add.mutateAsync({
      user_id: user!.id,
      title: form.title.trim(),
      subject: form.subject,
      subject_id: linked?.id ?? null,
      topic: form.topic.trim() || null,
      chapter: form.chapter.trim() || null,
      kind: form.kind,
      difficulty: form.difficulty,
      estimated_minutes: Math.max(5, Number(form.estimated) || 30),
      due_date: form.due || null,
      description: form.description.trim(),
      objective: form.objective.trim(),
      material: form.material.trim(),
      status: "not_started",
    });
    setForm({ ...form, title: "", topic: "", description: "", objective: "", material: "" });
    setOpen(false);
    toast.success("Task added.");
  }

  const chip = (active: boolean) =>
    cn(
      "press rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap",
      active ? "border-primary bg-primary/12 text-primary" : "border-border text-muted-foreground",
    );

  return (
    <AppShell>
      <PageHeader
        title="Tasks"
        subtitle="Every study task, homework and revision item"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="press size-11 rounded-2xl">
                <Plus strokeWidth={1.75} className="size-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl">
              <DialogHeader>
                <DialogTitle>New task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Solve Ch 3 numericals"
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <select
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="h-12 w-full rounded-xl border border-border bg-background px-3 text-sm"
                    >
                      {subjectNames.map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <select
                      value={form.kind}
                      onChange={(e) => setForm({ ...form, kind: e.target.value })}
                      className="h-12 w-full rounded-xl border border-border bg-background px-3 text-sm"
                    >
                      {TASK_KINDS.map((k) => (
                        <option key={k} value={k}>
                          {KIND_LABEL[k]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Topic</Label>
                    <Input
                      value={form.topic}
                      onChange={(e) => setForm({ ...form, topic: e.target.value })}
                      placeholder="Dynamics"
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Chapter</Label>
                    <Input
                      value={form.chapter}
                      onChange={(e) => setForm({ ...form, chapter: e.target.value })}
                      placeholder="Chapter 3"
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <select
                      value={form.difficulty}
                      onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                      className="h-12 w-full rounded-xl border border-border bg-background px-3 text-sm"
                    >
                      {DIFFICULTIES.map((d) => (
                        <option key={d} value={d}>
                          {d[0].toUpperCase() + d.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Minutes</Label>
                    <Input
                      type="number"
                      min={5}
                      value={form.estimated}
                      onChange={(e) => setForm({ ...form, estimated: e.target.value })}
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Due date</Label>
                  <Input
                    type="date"
                    value={form.due}
                    onChange={(e) => setForm({ ...form, due: e.target.value })}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="What exactly needs to be done?"
                    className="min-h-20 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Learning objective</Label>
                  <Input
                    value={form.objective}
                    onChange={(e) => setForm({ ...form, objective: e.target.value })}
                    placeholder="Be able to solve motion numericals"
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Study material</Label>
                  <Input
                    value={form.material}
                    onChange={(e) => setForm({ ...form, material: e.target.value })}
                    placeholder="Textbook pg 45-52, class notes"
                    className="h-12 rounded-xl"
                  />
                </div>
                <Button onClick={create} disabled={add.isPending} className="press h-12 w-full rounded-xl">
                  Add task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative mb-3">
        <Search strokeWidth={1.75} className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tasks, topics, chapters"
          className="h-12 rounded-2xl pl-11"
        />
      </div>

      <div className="-mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-1">
        <button className={chip(!status)} onClick={() => setFilter({ status: undefined })}>
          All
        </button>
        {(["not_started", "in_progress", "completed"] as const).map((s) => (
          <button key={s} className={chip(status === s)} onClick={() => setFilter({ status: s })}>
            {STATUS_META[s].dot} {STATUS_META[s].label}
          </button>
        ))}
        <button className={chip(!!kind)} onClick={() => setFilter({ kind: kind ? undefined : "homework" })}>
          📖 Homework
        </button>
        <select
          value={subjectParam ?? "all"}
          onChange={(e) => setFilter({ subject: e.target.value === "all" ? undefined : e.target.value })}
          className="rounded-full border border-border bg-background px-3 py-1.5 text-xs"
        >
          <option value="all">All subjects</option>
          {subjectNames.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="rounded-full border border-border bg-background px-3 py-1.5 text-xs"
        >
          <option value="all">Any difficulty</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d[0].toUpperCase() + d.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ListTodo strokeWidth={1.75} className="size-6" />}
          title="No study tasks available yet"
          description="Add a task, or let the AI planner create this week's tasks for you."
          art="tasks"
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((t) => {
            const statusMeta = STATUS_META[t.status];
            const accent =
              t.status === "completed" ? "border-l-success" : t.status === "in_progress" ? "border-l-warning" : "border-l-border";
            return (
              <li key={t.id}>
                <Link
                  to="/tasks/$taskId"
                  params={{ taskId: t.id }}
                  className={cn("surface-card lift flex items-center gap-3 border-l-4 p-4", accent)}
                >
                  <span className="text-xl">{subjectIcon(t.subject)}</span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate font-semibold", t.status === "completed" && "line-through opacity-60")}>
                      {t.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[t.subject, t.topic, KIND_LABEL[t.kind] ?? t.kind].filter(Boolean).join(" · ")}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      ⏱ {t.estimated_minutes} min · {t.difficulty}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                      statusMeta?.className,
                      t.status === "completed"
                        ? "border-success/40 bg-success/10"
                        : t.status === "in_progress"
                          ? "border-warning/40 bg-warning/10"
                          : "border-border bg-muted/40",
                    )}
                  >
                    {statusMeta?.dot} {statusMeta?.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}