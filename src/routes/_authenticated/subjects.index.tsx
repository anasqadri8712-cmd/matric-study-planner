import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookOpen, ChevronRight, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { AppShell, CountBadge, EmptyState, PageHeader, SkeletonCard } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSession } from "@/lib/session";
import { useAllSubjects, useInsert, useSubjects, useTasks } from "@/lib/data";
import { MATRIC_SUBJECTS, subjectIcon } from "@/lib/matric";

export const Route = createFileRoute("/_authenticated/subjects/")({
  head: () => ({
    meta: [
      { title: "Subjects & Chapters | AI Study Planner" },
      { name: "description", content: "Track chapter-by-chapter progress across every matric subject." },
      { property: "og:title", content: "Subjects & Chapters" },
      { property: "og:description", content: "Track chapter progress across every matric subject." },
    ],
  }),
  component: Subjects,
});

function Subjects() {
  const { user } = useSession();
  const { data: subjects = [], isLoading } = useSubjects(user?.id);
  const { data: allSubjects = [] } = useAllSubjects(user?.id);
  const { data: tasks = [] } = useTasks(user?.id);
  const add = useInsert("subjects", "subjects");

  const [name, setName] = useState<string>(MATRIC_SUBJECTS[0].name);
  const [chapters, setChapters] = useState("10");
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const missing = useMemo(
    () => MATRIC_SUBJECTS.filter((m) => !allSubjects.some((s) => s.name.toLowerCase() === m.name.toLowerCase())),
    [allSubjects],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return subjects;
    return subjects.filter((s) => s.name.toLowerCase().includes(term));
  }, [subjects, q]);

  async function create() {
    if (!name.trim()) return toast.error("Enter a subject name.");
    const preset = MATRIC_SUBJECTS.find((m) => m.name === name.trim());
    await add.mutateAsync({
      user_id: user!.id,
      name: name.trim(),
      color: preset?.color ?? "#2563eb",
      icon: preset?.icon ?? "📚",
      total_chapters: Math.max(1, Number(chapters) || 10),
    });
    setOpen(false);
    toast.success("Subject added.");
  }

  async function addAllMatricSubjects() {
    for (const m of missing) {
      await add.mutateAsync({
        user_id: user!.id,
        name: m.name,
        color: m.color,
        icon: m.icon,
        total_chapters: 10,
      });
    }
    toast.success("Matric subjects added.");
  }

  return (
    <AppShell>
      <PageHeader
        title="Subjects"
        subtitle="Tap a subject to open chapters, tasks and revision"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="press size-11 rounded-2xl">
                <Plus className="size-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader>
                <DialogTitle>Add subject</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    list="matric-subjects"
                    placeholder="Physics"
                    className="h-12 rounded-xl"
                  />
                  <datalist id="matric-subjects">
                    {MATRIC_SUBJECTS.map((m) => (
                      <option key={m.name} value={m.name} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label>Total chapters</Label>
                  <Input
                    type="number"
                    min={1}
                    value={chapters}
                    onChange={(e) => setChapters(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>
                <Button onClick={create} disabled={add.isPending} className="press h-12 w-full rounded-xl">
                  Add subject
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search subjects"
          className="h-12 rounded-2xl pl-11"
        />
      </div>

      {missing.length > 0 ? (
        <button
          onClick={addAllMatricSubjects}
          disabled={add.isPending}
          className="surface-card press mb-4 w-full p-4 text-left text-sm"
        >
          <span className="font-semibold text-primary">Add all matric subjects</span>
          <span className="block text-xs text-muted-foreground">{missing.map((m) => m.name).join(", ")}</span>
        </button>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="size-6" />}
          title="No subjects yet"
          description="Add your matric subjects to start tracking chapters, tasks and progress."
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((s) => {
            const subjectTasks = tasks.filter((t) => t.subject_id === s.id || t.subject === s.name);
            const pending = subjectTasks.filter((t) => t.status !== "completed").length;
            const done = subjectTasks.filter((t) => t.status === "completed").length;
            const pct = subjectTasks.length
              ? Math.round((done / subjectTasks.length) * 100)
              : Math.round((s.completed_chapters / Math.max(1, s.total_chapters)) * 100);
            return (
              <li key={s.id}>
                <Link to="/subjects/$subjectId" params={{ subjectId: s.id }} className="surface-card press block p-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex size-11 items-center justify-center rounded-2xl text-xl"
                      style={{ backgroundColor: `${s.color}22` }}
                    >
                      {s.icon || subjectIcon(s.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate font-semibold">
                        {s.name}
                        <CountBadge count={pending} />
                      </p>
                      <p className="text-xs text-muted-foreground">Progress {pct}%</p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                  <Progress value={pct} className="mt-3" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}