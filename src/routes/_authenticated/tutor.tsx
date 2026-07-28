import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session";
import { useProfile } from "@/lib/data";
import { askTutor } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/tutor")({
  head: () => ({
    meta: [
      { title: "AI Doubt Solver | AI Study Planner" },
      { name: "description", content: "Ask any Class 9 or 10 question and get a clear step-by-step explanation." },
      { property: "og:title", content: "AI Doubt Solver" },
      { property: "og:description", content: "Step-by-step answers for every matric doubt." },
    ],
  }),
  component: Tutor,
});

const STARTERS = [
  "Explain Newton's second law with an example",
  "Solve: factorise x² + 7x + 12",
  "Difference between mitosis and meiosis",
];

type Msg = { role: "user" | "assistant"; content: string };

function Tutor() {
  const { user } = useSession();
  const { data: profile } = useProfile(user?.id);
  const ask = useServerFn(askTutor);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setBusy(true);
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
    try {
      const { answer } = await ask({
        data: { messages: next.slice(-8), studentClass: profile?.student_class ?? "Class 9" },
      });
      setMessages([...next, { role: "assistant", content: answer }]);
    } catch {
      toast.error("The tutor is unavailable right now. Please try again.");
    } finally {
      setBusy(false);
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
    }
  }

  return (
    <AppShell>
      <PageHeader title="Ask a doubt" subtitle="Your 24/7 AI tutor for every subject" />

      {messages.length === 0 ? (
        <div className="space-y-3">
          <div className="surface-card flex items-start gap-3 p-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <Sparkles className="size-4" />
            </span>
            <p className="text-sm text-muted-foreground">
              Ask anything from your syllabus — concepts, numericals, definitions or exam tricks.
            </p>
          </div>
          {STARTERS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="surface-card press w-full p-4 text-left text-sm"
            >
              {s}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "animate-rise max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap",
                m.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "surface-card mr-auto",
              )}
            >
              {m.content}
            </div>
          ))}
          {busy ? (
            <div className="surface-card mr-auto w-fit rounded-2xl px-4 py-3 text-sm text-muted-foreground">
              Thinking...
            </div>
          ) : null}
          <div ref={endRef} />
        </div>
      )}

      <div className="fixed inset-x-0 bottom-[68px] z-30 border-t border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-end gap-2 px-5 py-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            rows={1}
            placeholder="Type your question..."
            className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl"
          />
          <Button
            size="icon"
            onClick={() => void send(input)}
            disabled={busy || !input.trim()}
            aria-label="Send question"
            className="press size-11 shrink-0 rounded-2xl"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
