import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Quiz, StudyPlan, StudySession, Task } from "@/lib/data";

export type RewardDef = {
  code: string;
  title: string;
  description: string;
  emoji: string;
  progress: (d: RewardData) => { value: number; target: number };
};

export type RewardData = {
  tasks: Task[];
  quizzes: Quiz[];
  sessions: StudySession[];
  plans: StudyPlan[];
};

function completedTasks(d: RewardData) {
  return d.tasks.filter((t) => t.status === "completed" || t.completed).length;
}

export function studyStreak(sessions: StudySession[], now = new Date()) {
  const days = new Set(sessions.map((s) => s.session_date));
  let count = 0;
  const cursor = new Date(now);
  while (days.has(cursor.toISOString().slice(0, 10))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export const REWARDS: RewardDef[] = [
  {
    code: "first_step",
    title: "First Step",
    description: "Complete your very first study task",
    emoji: "🌱",
    progress: (d) => ({ value: Math.min(completedTasks(d), 1), target: 1 }),
  },
  {
    code: "quiz_master",
    title: "Quiz Master",
    description: "Score 80% or higher in 3 quizzes",
    emoji: "🧠",
    progress: (d) => ({
      value: Math.min(d.quizzes.filter((q) => (q.score ?? 0) >= 80).length, 3),
      target: 3,
    }),
  },
  {
    code: "streak_7",
    title: "7 Day Streak",
    description: "Study every day for 7 days in a row",
    emoji: "🔥",
    progress: (d) => ({ value: Math.min(studyStreak(d.sessions), 7), target: 7 }),
  },
  {
    code: "study_star",
    title: "Study Star",
    description: "Log 10 hours of focused study time",
    emoji: "⭐",
    progress: (d) => ({
      value: Math.min(d.sessions.reduce((a, s) => a + s.minutes, 0), 600),
      target: 600,
    }),
  },
  {
    code: "consistent_learner",
    title: "Consistent Learner",
    description: "Complete 15 study tasks",
    emoji: "🏅",
    progress: (d) => ({ value: Math.min(completedTasks(d), 15), target: 15 }),
  },
  {
    code: "plan_pro",
    title: "Plan Pro",
    description: "Generate 3 AI weekly study plans",
    emoji: "🤖",
    progress: (d) => ({ value: Math.min(d.plans.length, 3), target: 3 }),
  },
];

/** Awards any newly-earned achievement rows for real activity (never on clicks). */
export function useRewardSync(userId: string | undefined, data: RewardData, earnedCodes: string[]) {
  const qc = useQueryClient();
  const key = earnedCodes.slice().sort().join(",");

  useEffect(() => {
    if (!userId) return;
    const owed = REWARDS.filter((r) => {
      const { value, target } = r.progress(data);
      return value >= target && !earnedCodes.includes(r.code);
    });
    if (owed.length === 0) return;
    let cancelled = false;
    (async () => {
      await supabase.from("achievements").upsert(
        owed.map((r) => ({
          user_id: userId,
          code: r.code,
          title: r.title,
          description: r.description,
        })),
        { onConflict: "user_id,code" },
      );
      if (!cancelled) qc.invalidateQueries({ queryKey: ["achievements"] });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, key, data.tasks.length, data.quizzes.length, data.sessions.length, data.plans.length]);
}
