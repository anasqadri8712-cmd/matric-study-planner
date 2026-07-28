export const MATRIC_SUBJECTS = [
  { name: "Mathematics", icon: "📘", color: "#2563eb" },
  { name: "Physics", icon: "🔭", color: "#7c3aed" },
  { name: "Chemistry", icon: "⚗️", color: "#0ea5e9" },
  { name: "Biology", icon: "🧬", color: "#16a34a" },
  { name: "Computer", icon: "💻", color: "#14b8a6" },
  { name: "English", icon: "📖", color: "#f59e0b" },
  { name: "Urdu", icon: "🕌", color: "#ef4444" },
  { name: "Islamiyat", icon: "🕋", color: "#10b981" },
  { name: "Pakistan Studies", icon: "🇵🇰", color: "#ec4899" },
] as const;

export function subjectIcon(name?: string | null) {
  return MATRIC_SUBJECTS.find((s) => s.name.toLowerCase() === (name ?? "").toLowerCase())?.icon ?? "📚";
}

export const TASK_KINDS = ["task", "homework", "revision", "mcqs", "practice"] as const;
export type TaskKind = (typeof TASK_KINDS)[number];

export const KIND_LABEL: Record<string, string> = {
  task: "Chapter task",
  homework: "Homework",
  revision: "Revision",
  mcqs: "MCQs",
  practice: "Practice test",
};

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export const STATUSES = ["not_started", "in_progress", "completed"] as const;
export type TaskStatus = (typeof STATUSES)[number];

export const STATUS_META: Record<string, { label: string; dot: string; className: string }> = {
  not_started: { label: "Not started", dot: "⭕", className: "text-muted-foreground" },
  in_progress: { label: "In progress", dot: "🟡", className: "text-amber-500" },
  completed: { label: "Completed", dot: "✅", className: "text-emerald-500" },
};

export const NOTE_LABELS = [
  { value: "none", label: "No label", dot: "⚪" },
  { value: "important", label: "Important", dot: "🔴" },
  { value: "revision", label: "Revision", dot: "🟡" },
  { value: "completed", label: "Completed", dot: "🟢" },
  { value: "homework", label: "Homework", dot: "🔵" },
] as const;

export function daysUntil(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

export function countdownText(dateStr: string) {
  const d = daysUntil(dateStr);
  if (d < 0) return "Completed";
  if (d === 0) return "Today";
  if (d === 1) return "1 day left";
  if (d < 14) return `${d} days left`;
  if (d < 60) return `${d} days · ${Math.round(d / 7)} weeks left`;
  return `${d} days · ${Math.round(d / 30)} months left`;
}

export function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(mm)}:${pad(s)}` : `${pad(mm)}:${pad(s)}`;
}