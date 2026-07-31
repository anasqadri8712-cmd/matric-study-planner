import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, Check, ChevronRight, Pencil, Save, Settings, Trophy, UserRound } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session";
import { useProfile, useSubjects, useUpdateProfile } from "@/lib/data";

const STUDY_TIMES = ["Morning", "Afternoon", "Evening", "Night"];

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile | AI Study Planner" },
      { name: "description", content: "Your student profile, subjects, rewards and study preferences." },
      { property: "og:title", content: "Your Profile" },
      { property: "og:description", content: "Student profile, subjects, rewards and study preferences." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useSession();
  const { data: profile } = useProfile(user?.id);
  const { data: subjects = [] } = useSubjects(user?.id);
  const update = useUpdateProfile(user?.id);

  const [hours, setHours] = useState([3]);
  const [weak, setWeak] = useState<string[]>([]);
  const [strong, setStrong] = useState<string[]>([]);
  const [studyTime, setStudyTime] = useState("Evening");

  useEffect(() => {
    if (!profile) return;
    setHours([Number(profile.daily_hours)]);
    setWeak(profile.weak_subjects ?? []);
    setStrong(profile.strong_subjects ?? []);
    setStudyTime(profile.preferred_study_time ?? "Evening");
  }, [profile]);

  const selectedNames = subjects.map((s) => s.name);

  function toggle(
    list: string[],
    set: (v: string[]) => void,
    other: string[],
    setOther: (v: string[]) => void,
    value: string,
  ) {
    if (list.includes(value)) set(list.filter((v) => v !== value));
    else {
      set([...list, value]);
      setOther(other.filter((v) => v !== value));
    }
  }

  async function savePreferences() {
    await update.mutateAsync({
      daily_hours: hours[0],
      weak_subjects: weak.filter((s) => selectedNames.includes(s)),
      strong_subjects: strong.filter((s) => selectedNames.includes(s)),
      preferred_study_time: studyTime,
    });
    toast.success("Study preferences saved.");
  }

  const avatar = profile?.avatar_url;

  return (
    <AppShell>
      <PageHeader title="Profile" subtitle="Your study identity" />

      <section className="surface-card animate-rise p-5">
        <div className="flex items-center gap-4">
          {avatar ? (
            <img
              src={avatar}
              alt={`${profile?.full_name || "Student"} profile photo`}
              className="size-16 shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <span className="gradient-primary flex size-16 shrink-0 items-center justify-center rounded-2xl text-primary-foreground">
              <UserRound className="size-7" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold">{profile?.full_name || "Student"}</p>
            {profile?.username ? (
              <p className="truncate text-xs text-primary">@{profile.username}</p>
            ) : null}
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <Field label="Phone" value={profile?.phone || "Not added"} />
          <Field label="Class" value={profile?.student_class || "—"} />
          <Field label="Board" value={profile?.board || "—"} />
          <Field label="Subjects" value={`${subjects.length} selected`} />
        </dl>

        <Button asChild variant="outline" className="press mt-4 h-11 w-full rounded-xl">
          <Link to="/edit-profile">
            <Pencil className="mr-1 size-4" /> Edit profile
          </Link>
        </Button>
      </section>

      <nav className="animate-rise mt-4 space-y-3">
        <Row to="/my-subjects" icon={<BookOpen className="size-5" />} title="My Subjects" desc="Choose what you study" />
        <Row to="/rewards" icon={<Trophy className="size-5" />} title="My Rewards" desc="Badges and achievements" />
        <Row to="/settings" icon={<Settings className="size-5" />} title="Settings" desc="Theme, backup and account" />
      </nav>

      <h2 className="mb-3 mt-6 text-sm font-semibold text-muted-foreground">Study preferences</h2>
      <div className="surface-card animate-rise space-y-5 p-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Daily study hours</Label>
            <span className="text-sm font-semibold text-primary">{hours[0]} hrs</span>
          </div>
          <Slider value={hours} onValueChange={setHours} min={1} max={10} step={1} />
        </div>

        <div className="space-y-2">
          <Label>Preferred study time</Label>
          <div className="grid grid-cols-2 gap-2">
            {STUDY_TIMES.map((t) => (
              <Pick key={t} active={studyTime === t} onClick={() => setStudyTime(t)}>
                {t}
              </Pick>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Weak subjects</Label>
          <p className="text-xs text-muted-foreground">The AI gives these extra study time.</p>
          <SubjectTags
            options={subjects.map((s) => ({ name: s.name, icon: s.icon }))}
            active={weak}
            onToggle={(name) => toggle(weak, setWeak, strong, setStrong, name)}
          />
        </div>

        <div className="space-y-2">
          <Label>Strong subjects</Label>
          <p className="text-xs text-muted-foreground">These get shorter revision sessions.</p>
          <SubjectTags
            options={subjects.map((s) => ({ name: s.name, icon: s.icon }))}
            active={strong}
            onToggle={(name) => toggle(strong, setStrong, weak, setWeak, name)}
          />
        </div>

        <Button onClick={savePreferences} disabled={update.isPending} className="press h-12 w-full rounded-2xl">
          <Save className="mr-1 size-4" />
          {update.isPending ? "Saving..." : "Save preferences"}
        </Button>
      </div>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/40 px-3 py-2">
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm font-medium">{value}</dd>
    </div>
  );
}

function Row({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link to={to} className="surface-card press flex items-center gap-3 p-4">
      <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{desc}</span>
      </span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}

function SubjectTags({
  options,
  active,
  onToggle,
}: {
  options: { name: string; icon: string }[];
  active: string[];
  onToggle: (name: string) => void;
}) {
  if (options.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Pick your subjects in{" "}
        <Link to="/my-subjects" className="font-medium text-primary">
          My Subjects
        </Link>{" "}
        first.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((s) => (
        <button
          key={s.name}
          type="button"
          onClick={() => onToggle(s.name)}
          className={cn(
            "press inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium",
            active.includes(s.name)
              ? "border-primary bg-primary/12 text-primary"
              : "border-border text-muted-foreground",
          )}
        >
          {active.includes(s.name) ? <Check className="size-3.5" /> : null}
          {s.icon} {s.name}
        </button>
      ))}
    </div>
  );
}

function Pick({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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
