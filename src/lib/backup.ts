import { supabase } from "@/integrations/supabase/client";

export const BACKUP_FORMAT = "ai-study-planner-backup";
export const BACKUP_VERSION = 1;

const TABLES = [
  "subjects",
  "tasks",
  "notes",
  "exams",
  "study_plans",
  "study_sessions",
  "quizzes",
  "task_history",
  "achievements",
] as const;

type TableName = (typeof TABLES)[number];
type Row = Record<string, unknown>;

export type BackupFile = {
  format: string;
  version: number;
  exported_at: string;
  profile: Row | null;
  data: Record<string, Row[]>;
};

export async function exportStudyData(userId: string): Promise<BackupFile> {
  const profile = (await supabase.from("profiles").select("*").eq("id", userId).maybeSingle()).data;
  const data: Record<string, Row[]> = {};
  for (const table of TABLES) {
    const { data: rows, error } = await supabase.from(table).select("*");
    if (error) throw new Error(error.message);
    data[table] = (rows ?? []) as Row[];
  }
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    profile: (profile as Row) ?? null,
    data,
  };
}

export function validateBackup(raw: unknown): BackupFile {
  if (!raw || typeof raw !== "object") throw new Error("invalid");
  const file = raw as Partial<BackupFile>;
  if (file.format !== BACKUP_FORMAT || typeof file.version !== "number" || !file.data) {
    throw new Error("invalid");
  }
  for (const table of TABLES) {
    const rows = file.data[table];
    if (rows !== undefined && !Array.isArray(rows)) throw new Error("invalid");
  }
  return file as BackupFile;
}

export function backupCounts(file: BackupFile) {
  return TABLES.map((t) => ({ table: t, count: file.data[t]?.length ?? 0 })).filter((r) => r.count > 0);
}

const PROFILE_FIELDS = [
  "full_name",
  "username",
  "phone",
  "student_class",
  "board",
  "study_goal",
  "daily_hours",
  "weak_subjects",
  "strong_subjects",
  "preferred_study_time",
  "avatar_url",
  "language",
  "reminders",
] as const;

/** Merges a backup into the current account. Existing rows are kept (upsert by id). */
export async function restoreStudyData(userId: string, file: BackupFile) {
  if (file.profile) {
    const patch: Row = {};
    for (const field of PROFILE_FIELDS) {
      const value = (file.profile as Row)[field];
      if (value !== undefined && value !== null) patch[field] = value;
    }
    if (Object.keys(patch).length) {
      const { error } = await supabase.from("profiles").update(patch as never).eq("id", userId);
      if (error) throw new Error(error.message);
    }
  }

  let restored = 0;
  for (const table of TABLES) {
    const rows = (file.data[table] ?? []).map((row) => ({ ...row, user_id: userId }));
    if (!rows.length) continue;
    const { error } = await supabase
      .from(table as TableName)
      .upsert(rows as never, { onConflict: "id", ignoreDuplicates: false });
    if (error) throw new Error(error.message);
    restored += rows.length;
  }
  return restored;
}

export function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
