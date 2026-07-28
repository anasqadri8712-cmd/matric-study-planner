import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session";
import { useProfile, useUpdateProfile } from "@/lib/data";
import { validateName } from "@/lib/validation";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile | AI Study Planner" },
      { name: "description", content: "Update your class, board, study goal and daily hours to refine AI plans." },
      { property: "og:title", content: "Your Profile" },
      { property: "og:description", content: "Update your class, board and study goal." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useSession();
  const { data: profile } = useProfile(user?.id);
  const update = useUpdateProfile(user?.id);

  const [fullName, setFullName] = useState("");
  const [studentClass, setStudentClass] = useState("Class 9");
  const [board, setBoard] = useState("Punjab Board");
  const [goal, setGoal] = useState("");
  const [hours, setHours] = useState([3]);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name);
    setStudentClass(profile.student_class);
    setBoard(profile.board);
    setGoal(profile.study_goal);
    setHours([Number(profile.daily_hours)]);
  }, [profile]);

  async function save() {
    const nameError = validateName(fullName);
    if (nameError) return toast.error(nameError);
    await update.mutateAsync({
      full_name: fullName.trim(),
      student_class: studentClass,
      board,
      study_goal: goal,
      daily_hours: hours[0],
    });
    toast.success("Profile updated.");
  }

  return (
    <AppShell>
      <PageHeader title="Profile" subtitle="Keep your plan tuned to you" />

      <div className="surface-card animate-rise flex items-center gap-4 p-5">
        <span className="gradient-primary flex size-14 items-center justify-center rounded-2xl text-primary-foreground">
          <UserRound className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold">{profile?.full_name || "Student"}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div className="animate-rise mt-5 space-y-5">
        <div className="space-y-2">
          <Label>Full name</Label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-12 rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label>Class</Label>
          <div className="grid grid-cols-2 gap-2">
            {["Class 9", "Class 10"].map((c) => (
              <Pick key={c} active={studentClass === c} onClick={() => setStudentClass(c)}>
                {c}
              </Pick>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Board</Label>
          <div className="grid grid-cols-2 gap-2">
            {["Punjab Board", "Sindh Board", "KPK Board", "Federal Board"].map((b) => (
              <Pick key={b} active={board === b} onClick={() => setBoard(b)}>
                {b}
              </Pick>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Study goal</Label>
          <Input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Score above 90%"
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

        <Button onClick={save} disabled={update.isPending} className="press h-13 w-full rounded-2xl">
          <Save className="mr-1 size-4" />
          {update.isPending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </AppShell>
  );
}

function Pick({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "press rounded-xl border py-3 text-sm font-medium",
        active ? "border-primary bg-primary/12 text-primary" : "border-border text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}
