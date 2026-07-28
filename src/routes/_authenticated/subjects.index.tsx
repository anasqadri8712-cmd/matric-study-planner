import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, EmptyState, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session";
import { useInsert, useRemove, useSubjects, useUpdate } from "@/lib/data";

const COLORS = ["#2563eb", "#7c3aed", "#0ea5e9", "#16a34a", "#f59e0b", "#ef4444", "#14b8a6", "#ec4899"];

export const Route = createFileRoute("/_authenticated/subjects")({
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
  const { data: subjects = [] } = useSubjects(user?.id);
  const add = useInsert("subjects", "subjects");
  const update = useUpdate("subjects", "subjects");
  const remove = useRemove("subjects", "subjects");

  const [name, setName] = useState("");
  const [chapters, setChapters] = useState("10");
  const [color, setColor] = useState(COLORS[0]);
  const [open, setOpen] = useState(false);

  async function create() {
    if (!name.trim()) return toast.error("Enter a subject name.");
    await add.mutateAsync({
      user_id: user!.id,
      name: name.trim(),
      color,
      total_chapters: Math.max(1, Number(chapters) || 10),
    });
    setName("");
    setOpen(false);
    toast.success("Subject added.");
  }

  return (
    <AppShell>
      <PageHeader
        title="Subjects"
        subtitle="Chapter progress at a glance"
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
                    placeholder="Physics"
                    className="h-12 rounded-xl"
                  />
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
                <div className="space-y-2">
                  <Label>Colour</Label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label={`Colour ${c}`}
                        onClick={() => setColor(c)}
                        style={{ backgroundColor: c }}
                        className={cn("size-8 rounded-xl", color === c && "ring-2 ring-foreground ring-offset-2 ring-offset-background")}
                      />
                    ))}
                  </div>
                </div>
                <Button onClick={create} className="h-12 w-full rounded-2xl">
                  Add subject
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {subjects.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="size-5" />}
          title="No subjects yet"
          description="Add the subjects you're studying to track chapters and get better AI plans."
        />
      ) : (
        <div className="space-y-3">
          {subjects.map((s) => {
            const pct = s.total_chapters ? Math.round((s.completed_chapters / s.total_chapters) * 100) : 0;
            return (
              <div key={s.id} className="surface-card animate-rise p-4">
                <div className="flex items-center gap-3">
                  <span className="size-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <p className="flex-1 font-semibold">{s.name}</p>
                  <button
                    onClick={() => remove.mutate(s.id)}
                    aria-label={`Delete ${s.name}`}
                    className="press text-muted-foreground"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <Progress value={pct} className="mt-4 h-2" />
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {s.completed_chapters} of {s.total_chapters} chapters • {pct}%
                  </p>
                  <div className="flex gap-2">
                    <button
                      aria-label="Decrease chapters done"
                      onClick={() =>
                        update.mutate({
                          id: s.id,
                          patch: { completed_chapters: Math.max(0, s.completed_chapters - 1) },
                        })
                      }
                      className="press flex size-8 items-center justify-center rounded-xl border border-border"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <button
                      aria-label="Increase chapters done"
                      onClick={() =>
                        update.mutate({
                          id: s.id,
                          patch: {
                            completed_chapters: Math.min(s.total_chapters, s.completed_chapters + 1),
                          },
                        })
                      }
                      className="press flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
