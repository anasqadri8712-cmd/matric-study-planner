import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, EmptyState, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSession } from "@/lib/session";
import { useExams, useInsert, useRemove, useSubjects } from "@/lib/data";
import { countdownText, daysUntil, subjectIcon } from "@/lib/matric";

export const Route = createFileRoute("/_authenticated/exams")({
  head: () => ({
    meta: [
      { title: "Exam Countdown | AI Study Planner" },
      { name: "description", content: "Add exam dates and watch a live countdown for every matric paper." },
      { property: "og:title", content: "Exam Countdown" },
      { property: "og:description", content: "Live countdown for every matric exam paper." },
    ],
  }),
  component: Exams,
});

function Exams() {
  const { user } = useSession();
  const { data: exams = [], isLoading } = useExams(user?.id);
  const add = useInsert("exams", "exams");
  const remove = useRemove("exams", "exams");

  const { data: mySubjects = [] } = useSubjects(user?.id);
  const subjectNames = useMemo(() => Array.from(new Set(mySubjects.map((s) => s.name))), [mySubjects]);
  const [subject, setSubject] = useState<string>("");
  const [date, setDate] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (subjectNames.length && !subjectNames.includes(subject)) setSubject(subjectNames[0]);
  }, [subjectNames, subject]);

  async function create() {
    if (!subject) return toast.error("Select subjects in My Subjects first.");
    if (!date) return toast.error("Pick the exam start date.");
    await add.mutateAsync({ user_id: user!.id, title: `${subject} Exam`, subject, exam_date: date });
    setDate("");
    setOpen(false);
    toast.success("Exam added.");
  }

  return (
    <AppShell>
      <PageHeader
        title="Exam countdown"
        subtitle="Updates automatically every day"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="press size-11 rounded-2xl">
                <Plus className="size-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader>
                <DialogTitle>Add exam</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="h-12 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  >
                    {subjectNames.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Exam start date</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>
                <Button onClick={create} disabled={add.isPending} className="press h-12 w-full rounded-xl">
                  Save exam
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? null : exams.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="size-6" />}
          title="No exams added yet"
          description="Add your exam start dates and the app will count down the days, weeks and months for you."
        />
      ) : (
        <ul className="space-y-3">
          {exams.map((exam) => {
            const left = daysUntil(exam.exam_date);
            return (
              <li key={exam.id} className="surface-card flex items-center gap-3 p-4">
                <span className="text-2xl">{subjectIcon(exam.subject)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{exam.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(`${exam.exam_date}T00:00:00`).toLocaleDateString(undefined, {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className={left <= 7 ? "font-bold text-destructive" : "font-bold text-primary"}>
                    {left < 0 ? "—" : left}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{countdownText(exam.exam_date)}</p>
                </div>
                <button
                  onClick={() => remove.mutate(exam.id)}
                  aria-label="Delete exam"
                  className="press text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}