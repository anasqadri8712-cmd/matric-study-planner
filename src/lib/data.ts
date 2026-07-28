import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type Subject = Tables<"subjects">;
export type Task = Tables<"tasks">;
export type Note = Tables<"notes">;
export type Exam = Tables<"exams">;
export type StudyPlan = Tables<"study_plans">;
export type StudySession = Tables<"study_sessions">;
export type Quiz = Tables<"quizzes">;

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

export function useProfile(userId?: string) {
  return useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () =>
      unwrap(await supabase.from("profiles").select("*").eq("id", userId!).maybeSingle()) as Profile | null,
  });
}

export function useUpdateProfile(userId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: TablesUpdate<"profiles">) =>
      unwrap(await supabase.from("profiles").update(patch).eq("id", userId!).select().single()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useSubjects(userId?: string) {
  return useQuery({
    queryKey: ["subjects", userId],
    enabled: !!userId,
    queryFn: async () =>
      unwrap(await supabase.from("subjects").select("*").order("created_at")) as Subject[],
  });
}

export function useTasks(userId?: string) {
  return useQuery({
    queryKey: ["tasks", userId],
    enabled: !!userId,
    queryFn: async () =>
      unwrap(
        await supabase.from("tasks").select("*").order("completed").order("due_date", { nullsFirst: false }),
      ) as Task[],
  });
}

export function useNotes(userId?: string) {
  return useQuery({
    queryKey: ["notes", userId],
    enabled: !!userId,
    queryFn: async () =>
      unwrap(await supabase.from("notes").select("*").order("updated_at", { ascending: false })) as Note[],
  });
}

export function useExams(userId?: string) {
  return useQuery({
    queryKey: ["exams", userId],
    enabled: !!userId,
    queryFn: async () => unwrap(await supabase.from("exams").select("*").order("exam_date")) as Exam[],
  });
}

export function usePlans(userId?: string) {
  return useQuery({
    queryKey: ["plans", userId],
    enabled: !!userId,
    queryFn: async () =>
      unwrap(
        await supabase.from("study_plans").select("*").order("created_at", { ascending: false }),
      ) as StudyPlan[],
  });
}

export function useSessions(userId?: string) {
  return useQuery({
    queryKey: ["sessions", userId],
    enabled: !!userId,
    queryFn: async () =>
      unwrap(
        await supabase.from("study_sessions").select("*").order("session_date", { ascending: false }),
      ) as StudySession[],
  });
}

export function useQuizzes(userId?: string) {
  return useQuery({
    queryKey: ["quizzes", userId],
    enabled: !!userId,
    queryFn: async () =>
      unwrap(
        await supabase.from("quizzes").select("*").order("created_at", { ascending: false }),
      ) as Quiz[],
  });
}

export function useTaskHistory(userId?: string) {
  return useQuery({
    queryKey: ["task_history", userId],
    enabled: !!userId,
    queryFn: async () =>
      unwrap(
        await supabase.from("task_history").select("*").order("completed_at", { ascending: false }),
      ) as Tables<"task_history">[],
  });
}

type TableName =
  | "subjects"
  | "tasks"
  | "notes"
  | "exams"
  | "study_plans"
  | "study_sessions"
  | "quizzes"
  | "task_history";

export function useInsert(table: TableName, key: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Record<string, unknown>) => {
      const { error } = await supabase.from(table).insert(row as never);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
  });
}

export function useUpdate(table: TableName, key: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { error } = await supabase.from(table).update(patch as never).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
  });
}

export function useRemove(table: TableName, key: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
  });
}
