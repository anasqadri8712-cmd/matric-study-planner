import { useSession } from "@/lib/session";
import { usePlans, useProfile, useQuizzes, useSessions, useSubjects, useTasks } from "@/lib/data";
import { planOf, weekLabel } from "@/lib/plan";
import type { ReportData } from "@/lib/pdf";

/** Collects the student's live data into the shape the PDF builder expects. */
export function useReportData(): ReportData {
  const { user } = useSession();
  const { data: profile = null } = useProfile(user?.id);
  const { data: subjects = [] } = useSubjects(user?.id);
  const { data: tasks = [] } = useTasks(user?.id);
  const { data: quizzes = [] } = useQuizzes(user?.id);
  const { data: plans = [] } = usePlans(user?.id);
  const { data: sessions = [] } = useSessions(user?.id);

  const days = new Set(sessions.map((s) => s.session_date));
  let streak = 0;
  const cursor = new Date();
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    profile,
    email: user?.email ?? undefined,
    plan: planOf(plans[0]),
    weekLabel: plans[0] ? weekLabel(plans[0]) : undefined,
    subjects,
    tasks,
    quizzes,
    streak,
    studiedMinutes: sessions.reduce((sum, s) => sum + (Number(s.minutes) || 0), 0),
  };
}
