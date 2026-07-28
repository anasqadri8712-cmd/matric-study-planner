import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, GraduationCap, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session";
import { useProfile, useUpdateProfile, useInsert } from "@/lib/data";

const SUBJECTS = ["Physics", "Chemistry", "Biology", "Mathematics", "English", "Urdu", "Computer", "Islamiat", "Pak Studies"];
const COLORS = ["#2563eb", "#7c3aed", "#0ea5e9", "#16a34a", "#f59e0b", "#ef4444", "#14b8a6", "#ec4899", "#64748b"];

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set Up Your Study Profile | AI Study Planner" },
      { name: "description", content: "Tell us your class, board, goal and study hours so your AI plan fits you." },
      { property: "og:title", content: "Set Up Your Study Profile" },
      { property: "og:description", content: "Personalise your matric study plan in under a minute." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const { user } = useSession();
  const navigate = useNavigate();
  const { data: profile } = useProfile(user?.id);
  const update = useUpdateProfile(user?.id);
  const addSubject = useInsert("subjects", "subjects");

  const [studentClass, setStudentClass] = useState("Class 9");
  const [board, setBoard] = useState("Punjab Board");
  const [goal, setGoal] = useState("");
  const [hours, setHours] = useState([3]);
  const [picked, setPicked] = useState<string[]>(["Physics", "Chemistry", "Mathematics", "English"]);
  const [weak, setWeak] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  function toggle(list: string[], set: (v: string[]) => void, value: string) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function finish() {
    if (picked.length === 0) return toast.error("Pick at least one subject.");
    setBusy(true);
    try {
      await update.mutateAsync({
        full_name: profile?.full_name || (user?.user_metadata?.full_name as string) || "Student",
        student_class: studentClass,
        board,
        study_goal: goal,
        daily_hours: hours[0],
        weak_subjects: weak,
        strong_subjects: picked.filter((s) => !weak.includes(s)),
        onboarded: true,
      });
      await Promise.all(
        picked.map((name, i) =>
          addSubject.mutateAsync({ user_id: user!.id, name, color: COLORS[i % COLORS.length] }),
        ),
      );
      toast.success("Profile ready. Let's study!");
      navigate({ to: "/home", replace: true });
    } catch {
      toast.error("Could not save your profile. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-lg px-6 py-10 pb-24">
      <span className="gradient-primary flex size-12 items-center justify-center rounded-2xl text-primary-foreground">
        <GraduationCap className="size-6" />
      </span>
      <h1 className="animate-rise mt-5 text-2xl font-semibold">Let's personalise your plan</h1>
      <p className="animate-rise mt-1 text-sm text-muted-foreground">
        This takes under a minute and makes every AI suggestion fit your routine.
      </p>

      <div className="animate-rise mt-7 space-y-6">
        <div className="space-y-2">
          <Label>Your class</Label>
          <div className="grid grid-cols-2 gap-2">
            {["Class 9", "Class 10"].map((c) => (
              <Chip key={c} active={studentClass === c} onClick={() => setStudentClass(c)}>
                {c}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Board</Label>
          <div className="grid grid-cols-2 gap-2">
            {["Punjab Board", "Sindh Board", "KPK Board", "Federal Board"].map((b) => (
              <Chip key={b} active={board === b} onClick={() => setBoard(b)}>
                {b}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="goal">Your goal</Label>
          <Input
            id="goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Score above 90% in board exams"
            className="h-12 rounded-xl"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Daily study hours</Label>
            <span className="text-sm font-semibold text-primary">{hours[0]} hrs</span>
          </div>
          <Slider value={hours} onValueChange={setHours} min={1} max={10} step={1} />
        </div>

        <div className="space-y-2">
          <Label>Subjects you study</Label>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map((s) => (
              <Chip key={s} active={picked.includes(s)} onClick={() => toggle(picked, setPicked, s)} inline>
                {s}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Which feel hardest?</Label>
          <div className="flex flex-wrap gap-2">
            {picked.map((s) => (
              <Chip key={s} active={weak.includes(s)} onClick={() => toggle(weak, setWeak, s)} inline>
                {s}
              </Chip>
            ))}
          </div>
        </div>

        <Button onClick={finish} disabled={busy} className="press h-13 w-full rounded-2xl text-base">
          <Sparkles className="mr-1 size-4" />
          {busy ? "Saving..." : "Finish setup"}
        </Button>
      </div>
    </main>
  );
}

function Chip({
  active,
  onClick,
  children,
  inline,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  inline?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "press rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
        inline ? "" : "w-full",
        active
          ? "border-primary bg-primary/12 text-primary"
          : "border-border bg-card text-muted-foreground",
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        {active ? <Check className="size-3.5" /> : null}
        {children}
      </span>
    </button>
  );
}
