import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, EmptyState, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSession } from "@/lib/session";
import { useInsert, useNotes, useRemove, useUpdate } from "@/lib/data";
import { summarizeNote } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/notes")({
  head: () => ({
    meta: [
      { title: "Smart Notes | AI Study Planner" },
      { name: "description", content: "Write chapter notes and turn them into short AI revision points instantly." },
      { property: "og:title", content: "Smart Notes" },
      { property: "og:description", content: "Turn long notes into quick revision bullets." },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const { user } = useSession();
  const { data: notes = [] } = useNotes(user?.id);
  const add = useInsert("notes", "notes");
  const update = useUpdate("notes", "notes");
  const remove = useRemove("notes", "notes");
  const summarize = useServerFn(summarizeNote);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function create() {
    if (!title.trim()) return toast.error("Give your note a title.");
    await add.mutateAsync({ user_id: user!.id, title: title.trim(), content });
    setTitle("");
    setContent("");
    setOpen(false);
    toast.success("Note saved.");
  }

  async function makeSummary(id: string, noteTitle: string, noteContent: string) {
    if (noteContent.trim().length < 20) return toast.error("Write a bit more before summarising.");
    setBusyId(id);
    try {
      const { summary } = await summarize({ data: { title: noteTitle, content: noteContent } });
      await update.mutateAsync({ id, patch: { summary } });
      toast.success("Revision points ready.");
    } catch {
      toast.error("Could not summarise this note.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Notes"
        subtitle="Write once, revise in seconds"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="press size-11 rounded-2xl">
                <Plus className="size-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader>
                <DialogTitle>New note</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Physics Ch 3 — Dynamics"
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                    placeholder="Paste or type your chapter notes here..."
                    className="rounded-2xl"
                  />
                </div>
                <Button onClick={create} className="h-12 w-full rounded-2xl">
                  Save note
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {notes.length === 0 ? (
        <EmptyState
          icon={<FileText className="size-5" />}
          title="No notes yet"
          description="Save chapter notes and let AI turn them into short revision points."
        />
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <article key={n.id} className="surface-card animate-rise p-4">
              <div className="flex items-start gap-3">
                <h2 className="flex-1 font-semibold">{n.title}</h2>
                <button
                  onClick={() => remove.mutate(n.id)}
                  aria-label={`Delete ${n.title}`}
                  className="press text-muted-foreground"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{n.content || "Empty note"}</p>
              {n.summary ? (
                <div className="mt-3 rounded-2xl bg-primary/8 p-3 text-sm whitespace-pre-wrap text-foreground">
                  {n.summary}
                </div>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                disabled={busyId === n.id}
                onClick={() => makeSummary(n.id, n.title, n.content)}
                className="press mt-3 h-10 rounded-xl"
              >
                <Sparkles className="mr-1 size-3.5" />
                {busyId === n.id ? "Summarising..." : n.summary ? "Regenerate summary" : "Summarise with AI"}
              </Button>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
