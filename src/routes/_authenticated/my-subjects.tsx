import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Save } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Loader, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session";
import { useAllSubjects, useProfile, useUpdateProfile } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { MATRIC_SUBJECTS } from "@/lib/matric";

export const Route = createFileRoute("/_authenticated/my-subjects")({
  head: () => ({
    meta: [
      { title: "My Subjects | AI Study Planner" },
      { name: "description", content: "Choose the subjects you actually study so plans, tasks and quizzes stay personal." },
      { property: "og:title", content: "My Subjects" },
      { property: "og:description", content: "Pick the matric subjects you actually study." },
    ],
  }),
  component: MySubjectsPage,
});

function MySubjectsPage() {
  const { user } = useSession();
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useAllSubjects(user?.id);
  const { data: profile } = useProfile(user?.id);
  const updateProfile = useUpdateProfile(user?.id);
  const [saving, setSaving] = useState(false);
  const [picked, setPicked] = useState<string[] | null>(null);

  const initial = useMemo(
    () => rows.filter((r) => r.selected !== false).map((r) => r.name),
    [rows],
  );
  const selected = picked ?? initial;

  const options = useMemo(() => {
    const names = new Set(rows.map((r) => r.name.toLowerCase()));
    const extras = MATRIC_SUBJECTS.filter((m) => !names.has(m.name.toLowerCase())).map((m) => ({
      name: m.name,
      icon: m.icon,
      color: m.color,
      existing: false,
    }));
    return [
      ...rows.map((r) => ({ name: r.name, icon: r.icon, color: r.color, existing: true })),
      ...extras,
    ];
  }, [rows]);

  function toggle(name: string) {
    setSelected(selected.includes(name) ? selected.filter((n) => n !== name) : [...selected, name]);
  }
  function setSelected(next: string[]) {
    setPicked(next);
  }

  async function save() {
    if (selected.length === 0) return toast.error("Select at least one subject.");
    setSaving(true);
    try {
      for (const row of rows) {
        const want = selected.includes(row.name);
        if ((row.selected !== false) !== want) {
          const { error } = await supabase.from("subjects").update({ selected: want }).eq("id", row.id);
          if (error) throw new Error(error.message);
        }
      }
      const newNames = selected.filter((n) => !rows.some((r) => r.name === n));
      if (newNames.length) {
        const { error } = await supabase.from("subjects").insert(
          newNames.map((name) => {
            const preset = MATRIC_SUBJECTS.find((m) => m.name === name);
            return {
              user_id: user!.id,
              name,
              icon: preset?.icon ?? "📚",
              color: preset?.color ?? "#2563eb",
              total_chapters: 10,
              selected: true,
            };
          }),
        );
        if (error) throw new Error(error.message);
      }

      const weak = (profile?.weak_subjects ?? []).filter((s) => selected.includes(s));
      const strong = (profile?.strong_subjects ?? []).filter((s) => selected.includes(s));
      if (
        weak.length !== (profile?.weak_subjects ?? []).length ||
        strong.length !== (profile?.strong_subjects ?? []).length
      ) {
        await updateProfile.mutateAsync({ weak_subjects: weak, strong_subjects: strong });
      }

      await qc.invalidateQueries({ queryKey: ["subjects"] });
      setPicked(null);
      toast.success("Your subjects are saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save your subjects.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <PageHeader title="My Subjects" subtitle="Only selected subjects appear across the app" />

      {isLoading ? (
        <Loader label="Loading subjects" />
      ) : (
        <>
          <div className="space-y-3">
            {options.map((o) => {
              const active = selected.includes(o.name);
              return (
                <button
                  key={o.name}
                  type="button"
                  onClick={() => toggle(o.name)}
                  className={cn(
                    "surface-card press flex w-full items-center gap-3 p-4 text-left",
                    active && "border-primary",
                  )}
                >
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-xl"
                    style={{ backgroundColor: `${o.color}22` }}
                  >
                    {o.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{o.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {active ? "Included in your study plan" : "Not studying this"}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-lg border",
                      active ? "border-primary bg-primary text-primary-foreground" : "border-border",
                    )}
                  >
                    {active ? <Check className="size-3.5" /> : null}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            De-selecting a subject only hides it — your tasks, notes and progress for it are kept safely.
          </p>

          <Button onClick={save} disabled={saving} className="press mt-4 h-13 w-full rounded-2xl">
            <Save className="mr-1 size-4" />
            {saving ? "Saving..." : `Save ${selected.length} subjects`}
          </Button>
        </>
      )}
    </AppShell>
  );
}
