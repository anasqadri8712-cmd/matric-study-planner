type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const MODEL = "google/gemini-3.6-flash";

export async function chat(messages: ChatMessage[], jsonMode = false): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI is not configured yet.");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      messages,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (res.status === 429) throw new Error("Too many requests right now. Please try again in a minute.");
  if (res.status === 402) throw new Error("AI credits are exhausted. Please add credits to continue.");
  if (!res.ok) {
    const detail = await res.text();
    console.error("AI gateway error", res.status, detail);
    throw new Error("The AI service is unavailable right now. Please try again.");
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

export function parseJson<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  return JSON.parse(start >= 0 ? cleaned.slice(start, end + 1) : cleaned) as T;
}
