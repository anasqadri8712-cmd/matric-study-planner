import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Seeds a brand-new account with a few sample items so the app is never empty
 * on first launch. Runs at most once per user (localStorage flag) and never
 * touches accounts that already have tasks or notes.
 */
export function useFirstRunSeed(userId?: string) {
  const qc = useQueryClient();
  const ran = useRef<string | null>(null);

  useEffect(() => {
    if (!userId || ran.current === userId) return;
    ran.current = userId;

    const flag = `sp-seeded-${userId}`;
    if (typeof window !== "undefined" && window.localStorage.getItem(flag)) return;

    let cancelled = false;
    (async () => {
      const [tasks, notes] = await Promise.all([
        supabase.from("tasks").select("id").limit(1),
        supabase.from("notes").select("id").limit(1),
      ]);
      if (cancelled || tasks.error || notes.error) return;

      // Existing user with real data — mark as seeded and leave everything alone.
      if ((tasks.data?.length ?? 0) > 0 || (notes.data?.length ?? 0) > 0) {
        window.localStorage.setItem(flag, "1");
        return;
      }

      const today = new Date().toISOString().slice(0, 10);

      await Promise.all([
        supabase.from("tasks").insert([
          {
            user_id: userId,
            title: "Review Math Chapter 1 Formulas",
            subject: "Mathematics",
            topic: "Chapter 1 formulas",
            kind: "revision",
            priority: "high",
            due_date: today,
            estimated_minutes: 30,
            description: "Sample task — edit or delete it anytime.",
          },
          {
            user_id: userId,
            title: "Complete Today's AI Study Plan",
            subject: "General",
            kind: "task",
            priority: "medium",
            due_date: today,
            estimated_minutes: 45,
            description: "Your daily goal. Generate a plan in the Planner and follow it.",
          },
        ]),
        supabase.from("notes").insert({
          user_id: userId,
          title: "Welcome to your Notes",
          topic: "Getting started",
          content:
            "Welcome! Use this Notes section to write down important board exam short questions or key points.\n\nTap the + button to add your own note, and use “Summarise with AI” to turn long notes into quick revision bullets.",
        }),
      ]);

      if (cancelled) return;
      window.localStorage.setItem(flag, "1");
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["notes"] });
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, qc]);
}