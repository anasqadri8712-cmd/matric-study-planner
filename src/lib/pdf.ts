import type { GeneratedPlan } from "@/lib/ai.functions";
import type { Profile, Quiz, Subject, Task } from "@/lib/data";

export type ReportData = {
  profile: Profile | null;
  email?: string;
  plan?: GeneratedPlan;
  weekLabel?: string;
  subjects: Subject[];
  tasks: Task[];
  quizzes: Quiz[];
  streak: number;
  studiedMinutes: number;
};

const NAVY: [number, number, number] = [37, 78, 196];
const INK: [number, number, number] = [22, 24, 32];
const GREY: [number, number, number] = [110, 116, 130];

function subjectOf(task: Task, subjects: Subject[]) {
  return task.subject || subjects.find((s) => s.id === task.subject_id)?.name || "General";
}

/** Builds a styled, paginated A4 study report from the student's live data. */
export async function buildStudyReportPdf(data: ReportData): Promise<Blob> {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 42;
  let y = 0;

  const name = data.profile?.full_name?.trim() || data.email?.split("@")[0] || "Student";
  const studentClass = data.profile?.student_class || "—";
  const board = data.profile?.board || "—";

  // ---- Header band
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageW, 104, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold").setFontSize(19);
  doc.text("AI Study Planner", M, 44);
  doc.setFont("helvetica", "normal").setFontSize(10.5);
  doc.text(`${name}  |  ${studentClass}  |  ${board}`, M, 64);
  doc.text(
    `Generated ${new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}${
      data.weekLabel ? `  |  Week ${data.weekLabel}` : ""
    }`,
    M,
    82,
  );
  y = 132;

  const ensure = (needed: number) => {
    if (y + needed > pageH - 56) {
      doc.addPage();
      y = 56;
    }
  };

  const heading = (text: string) => {
    ensure(46);
    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "bold").setFontSize(13);
    doc.text(text, M, y);
    doc.setDrawColor(...NAVY);
    doc.setLineWidth(1.2);
    doc.line(M, y + 6, pageW - M, y + 6);
    y += 24;
  };

  const paragraph = (text: string, size = 10) => {
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "normal").setFontSize(size);
    const lines = doc.splitTextToSize(text, pageW - M * 2);
    for (const line of lines) {
      ensure(16);
      doc.text(line, M, y);
      y += 14;
    }
    y += 6;
  };

  const table = (head: string[], body: (string | number)[][]) => {
    ensure(70);
    autoTable(doc, {
      startY: y,
      head: [head],
      body: body.length ? body : [head.map(() => "—")],
      margin: { left: M, right: M, top: 56, bottom: 48 },
      styles: { font: "helvetica", fontSize: 9.5, cellPadding: 6, textColor: INK, overflow: "linebreak" },
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9.5 },
      alternateRowStyles: { fillColor: [243, 246, 253] },
      theme: "grid",
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 22;
  };

  // ---- Snapshot
  const pending = data.tasks.filter((t) => t.status !== "completed" && !t.completed);
  const completed = data.tasks.filter((t) => t.status === "completed" || t.completed);
  const overall = data.tasks.length ? Math.round((completed.length / data.tasks.length) * 100) : 0;

  heading("Snapshot");
  table(
    ["Overall progress", "Pending tasks", "Completed tasks", "Study streak", "Study time logged"],
    [[`${overall}%`, pending.length, completed.length, `${data.streak} day(s)`, `${Math.round(data.studiedMinutes / 60 * 10) / 10} hrs`]],
  );

  // ---- Weekly schedule
  heading("AI Weekly Study Plan");
  if (data.plan?.summary) paragraph(data.plan.summary);
  const minutesBySubject = new Map<string, number>();
  for (const day of data.plan?.days ?? []) {
    for (const b of day.blocks ?? []) {
      minutesBySubject.set(b.subject, (minutesBySubject.get(b.subject) ?? 0) + (Number(b.minutes) || 0));
    }
  }
  const ranks = new Map(
    [...minutesBySubject.entries()].sort((a, b) => b[1] - a[1]).map(([s], i) => [s, i + 1] as const),
  );

  if (data.plan?.days?.length) {
    for (const day of data.plan.days) {
      ensure(80);
      doc.setTextColor(...INK);
      doc.setFont("helvetica", "bold").setFontSize(11);
      doc.text(day.day, M, y);
      y += 10;
      table(
        ["Time", "Subject", "Priority", "Topic", "Minutes"],
        (day.blocks ?? []).map((b) => [
          b.time,
          b.subject,
          `#${ranks.get(b.subject) ?? "-"}`,
          b.topic,
          `${b.minutes}m`,
        ]),
      );
    }
    heading("Subject Priority & Weekly Time");
    table(
      ["Priority", "Subject", "Weekly time"],
      [...minutesBySubject.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([s, m], i) => [`#${i + 1}`, s, `${Math.round((m / 60) * 10) / 10} hrs`]),
    );
  } else {
    paragraph("No AI weekly plan has been generated yet. Open the Planner tab and tap 'Generate weekly plan'.");
  }

  // ---- Why this plan
  if (data.plan?.why?.length) {
    heading("Why This Plan?");
    data.plan.why.forEach((w) => paragraph(`•  ${w}`));
  }
  if (data.plan?.tips?.length) {
    heading("Coach Tips");
    data.plan.tips.forEach((t) => paragraph(`•  ${t}`));
  }

  // ---- Tasks checklist
  heading("Tasks Checklist");
  const bySubject = new Map<string, Task[]>();
  for (const t of data.tasks) {
    const key = subjectOf(t, data.subjects);
    bySubject.set(key, [...(bySubject.get(key) ?? []), t]);
  }
  if (bySubject.size) {
    for (const [subject, list] of bySubject) {
      ensure(80);
      doc.setTextColor(...INK);
      doc.setFont("helvetica", "bold").setFontSize(11);
      doc.text(subject, M, y);
      y += 10;
      table(
        ["", "Task", "Due", "Status"],
        list.map((t) => [
          t.completed || t.status === "completed" ? "[x]" : "[ ]",
          [t.title, t.topic].filter(Boolean).join(" — "),
          t.due_date ?? "—",
          t.completed || t.status === "completed" ? "Completed" : t.status === "in_progress" ? "In progress" : "Pending",
        ]),
      );
    }
  } else {
    paragraph("No tasks added yet.");
  }

  // ---- Progress
  heading("Progress & Performance");
  table(
    ["Subject", "Marked", "Tasks done", "Pending", "Completion"],
    data.subjects.map((s) => {
      const list = data.tasks.filter((t) => t.subject_id === s.id || t.subject === s.name);
      const doneCount = list.filter((t) => t.completed || t.status === "completed").length;
      const weak = (data.profile?.weak_subjects ?? []).some((w) => w.toLowerCase() === s.name.toLowerCase());
      const strong = (data.profile?.strong_subjects ?? []).some((w) => w.toLowerCase() === s.name.toLowerCase());
      return [
        s.name,
        weak ? "Weak" : strong ? "Strong" : "Average",
        doneCount,
        list.length - doneCount,
        list.length ? `${Math.round((doneCount / list.length) * 100)}%` : "0%",
      ];
    }),
  );

  heading("Recent Quiz Scores");
  table(
    ["Date", "Subject", "Topic", "Score"],
    data.quizzes
      .slice(0, 15)
      .map((q) => [
        new Date(q.created_at).toLocaleDateString(),
        q.subject ?? "—",
        q.topic ?? "—",
        `${Math.round(Number(q.score ?? 0))}%`,
      ]),
  );

  // ---- Footer on every page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal").setFontSize(8.5);
    doc.setTextColor(...GREY);
    doc.text(`${name} · AI Study Planner`, M, pageH - 24);
    doc.text(`Page ${i} of ${pages}`, pageW - M, pageH - 24, { align: "right" });
  }

  return doc.output("blob");
}

export function reportFileName(profile: Profile | null) {
  const slug = (profile?.full_name || "student").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `study-report-${slug}-${new Date().toISOString().slice(0, 10)}.pdf`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function canShareFiles(file: File) {
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  return typeof nav.share === "function" && (!nav.canShare || nav.canShare({ files: [file] }));
}

export async function shareOrDownloadPdf(blob: Blob, filename: string, title: string) {
  const file = new File([blob], filename, { type: "application/pdf" });
  if (canShareFiles(file)) {
    try {
      await navigator.share({ files: [file], title, text: "My AI study plan & progress report" });
      return "shared" as const;
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return "cancelled" as const;
    }
  }
  downloadBlob(blob, filename);
  return "downloaded" as const;
}