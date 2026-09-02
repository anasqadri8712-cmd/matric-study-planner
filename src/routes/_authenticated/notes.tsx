import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Pin, Plus, Search, Sparkles, Trash2 } from "lucide-react";
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
import { NOTE_LABELS } from "@/lib/matric";
import { cn } from "@/lib/utils";

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
  const [topic, setTopic] = useState("");
  const [label, setLabel] = useState<string>("none");
  const [query, setQuery] = useState("");
  const [content, setContent] = useState("");
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function create() {
    if (!title.trim()) return toast.error("Give your note a title.");
    await add.mutateAsync({
      user_id: user!.id,
      title: title.trim(),
      topic: topic.trim() || null,
      label,
      content,
    });
    setTitle("");
    setTopic("");
    setLabel("none");
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

  const visible = notes
    .filter((n) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return `${n.title} ${n.topic ?? ""} ${n.content}`.toLowerCase().includes(q);
    })
    .sort((a, b) => Number(b.pinned) - Number(a.pinned));

  return (
    <AppShell>
      <PageHeader
        title="Notes"
        subtitle="Write once, revise in seconds"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="press size-11 rounded-2xl">
                <Plus className="size-5" strokeWidth={1.75} />
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
                <div className="space-y-2">
                  <Label>Topic</Label>
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Newton's laws"
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Label</Label>
                  <div className="flex flex-wrap gap-2">
                    {NOTE_LABELS.map((l) => (
                      <button
                        key={l.value}
                        onClick={() => setLabel(l.value)}
                        className={cn(
                          "press rounded-xl border px-3 py-2 text-xs font-medium",
                          label === l.value
                            ? "border-primary bg-primary/12 text-primary"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={create} className="h-12 w-full rounded-2xl">
                  Save note
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative mb-4">
        <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes"
          className="h-12 rounded-2xl pl-11"
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<FileText className="size-5" strokeWidth={1.75} />}
          title={notes.length ? "No matching notes" : "No notes yet"}
          description="Save chapter notes and let AI turn them into short revision points."
          art="notes"
        />
      ) : (
        <div className="space-y-4">
          {visible.map((n) => (
            <article key={n.id} className="surface-card card-highlight lift animate-rise p-6">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  {n.pinned ? (
                    <span className="mb-1.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                      <Pin className="size-3" strokeWidth={1.75} /> Pinned
                    </span>
                  ) : null}
                  <h2 className="font-display text-lg font-bold tracking-tight">{n.title}</h2>
                  {n.topic ? <p className="text-xs text-muted-foreground">{n.topic}</p> : null}
                </div>
                <button
                  onClick={() => update.mutate({ id: n.id, patch: { pinned: !n.pinned } })}
                  aria-label={n.pinned ? `Unpin ${n.title}` : `Pin ${n.title}`}
                  className={cn("press", n.pinned ? "text-primary" : "text-muted-foreground")}
                >
                  <Pin className="size-4" strokeWidth={1.75} />
                </button>
                <button
                  onClick={() => remove.mutate(n.id)}
                  aria-label={`Delete ${n.title}`}
                  className="press text-muted-foreground"
                >
                  <Trash2 className="size-4" strokeWidth={1.75} />
                </button>
              </div>
              {n.label && n.label !== "none" ? (
                <span className="mt-3 inline-block rounded-full bg-primary/12 px-2.5 py-1 text-[11px] font-medium text-primary">
                  {NOTE_LABELS.find((l) => l.value === n.label)?.label ?? n.label}
                </span>
              ) : null}
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {n.content || "Empty note"}
              </p>
              {n.summary ? (
                <div className="mt-4 rounded-2xl bg-primary/8 p-4 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                  {n.summary}
                </div>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                disabled={busyId === n.id}
                onClick={() => makeSummary(n.id, n.title, n.content)}
                className="press mt-4 h-10 rounded-xl"
              >
                <Sparkles className="mr-1 size-3.5" strokeWidth={1.75} />
                {busyId === n.id ? "Summarising..." : n.summary ? "Regenerate summary" : "Summarise with AI"}
              </Button>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
