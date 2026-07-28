import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PlanInput = z.object({
  studentClass: z.string(),
  board: z.string(),
  goal: z.string(),
  dailyHours: z.number(),
  weak: z.array(z.string()),
  strong: z.array(z.string()),
  subjects: z.array(z.string()),
  examNote: z.string().optional(),
});

export type PlanBlock = { time: string; subject: string; topic: string; minutes: number };
export type PlanDay = { day: string; blocks: PlanBlock[] };
export type GeneratedPlan = { summary: string; days: PlanDay[]; tips: string[] };

export const generateStudyPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PlanInput.parse(input))
  .handler(async ({ data }) => {
    const { chat, parseJson } = await import("./ai.server");
    const raw = await chat(
      [
        {
          role: "system",
          content:
            "You are an expert Pakistani matric (Class 9 & 10) study coach. Build realistic weekly study plans. Reply with JSON only, no markdown.",
        },
        {
          role: "user",
          content: `Create a 7-day study plan.
Class: ${data.studentClass}
Board: ${data.board}
Goal: ${data.goal || "Score high marks"}
Daily study hours available: ${data.dailyHours}
Weak subjects (give more time): ${data.weak.join(", ") || "none given"}
Strong subjects (revision only): ${data.strong.join(", ") || "none given"}
Subjects being studied: ${data.subjects.join(", ") || "standard matric subjects"}
${data.examNote ?? ""}

Return JSON shaped exactly like:
{"summary":"one motivating sentence","days":[{"day":"Monday","blocks":[{"time":"5:00 PM","subject":"Physics","topic":"Ch 3 - Dynamics numericals","minutes":45}]}],"tips":["short actionable tip"]}
Rules: exactly 7 days starting Monday, total minutes per day must be close to ${Math.round(data.dailyHours * 60)}, 2-4 blocks per day, include one revision block, 3 tips maximum.`,
        },
      ],
      true,
    );
    return parseJson<GeneratedPlan>(raw);
  });

const TutorInput = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })),
  studentClass: z.string().optional(),
});

export const askTutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => TutorInput.parse(input))
  .handler(async ({ data }) => {
    const { chat } = await import("./ai.server");
    const answer = await chat([
      {
        role: "system",
        content: `You are a friendly matric study tutor for ${data.studentClass ?? "Class 9/10"} students in Pakistan. Explain concepts step by step in simple English, use short paragraphs and bullet points, show working for numericals, and end with one quick practice question. Keep answers under 250 words.`,
      },
      ...data.messages,
    ]);
    return { answer };
  });

const QuizInput = z.object({
  subject: z.string().min(1),
  topic: z.string().min(1),
  studentClass: z.string(),
  count: z.number().min(3).max(10),
});

export type QuizQuestion = { question: string; options: string[]; answer: number; explanation: string };

export const generateQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => QuizInput.parse(input))
  .handler(async ({ data }) => {
    const { chat, parseJson } = await import("./ai.server");
    const raw = await chat(
      [
        { role: "system", content: "You write matric-level MCQs. Reply with JSON only." },
        {
          role: "user",
          content: `Write ${data.count} multiple choice questions for ${data.studentClass} ${data.subject}, topic: ${data.topic}.
Return JSON: {"questions":[{"question":"...","options":["a","b","c","d"],"answer":0,"explanation":"why"}]}
"answer" is the zero-based index of the correct option. Exactly 4 options each.`,
        },
      ],
      true,
    );
    return parseJson<{ questions: QuizQuestion[] }>(raw);
  });

const SummaryInput = z.object({ title: z.string(), content: z.string().min(20) });

export const summarizeNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SummaryInput.parse(input))
  .handler(async ({ data }) => {
    const { chat } = await import("./ai.server");
    const summary = await chat([
      { role: "system", content: "You turn student notes into crisp revision points. Plain text only." },
      {
        role: "user",
        content: `Summarise these notes titled "${data.title}" into 4-6 short revision bullet points starting with "• ". Keep each point under 18 words.\n\n${data.content.slice(0, 6000)}`,
      },
    ]);
    return { summary };
  });
