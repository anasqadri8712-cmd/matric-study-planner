import type { GeneratedPlan } from "@/lib/ai.functions";
import { subjectMinutes, totalMinutes } from "@/lib/plan";

export type SharePlanMeta = {
  studentName?: string | null;
  studentClass?: string | null;
  board?: string | null;
  weekLabel?: string;
  exams?: { subject: string; daysLeft: number }[];
};

const BLUE = [37, 99, 235] as const;
const INK = [17, 24, 39] as const;
const MUTED = [107, 114, 128] as const;

/** Builds a formatted A4 PDF of the weekly study schedule. Browser only. */
export async function buildPlanPdf(plan: GeneratedPlan, meta: SharePlanMeta): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  let y = 0;

  const newPage = () => {
    doc.addPage();
    y = M;
  };
  const space = (need: number) => {
    if (y + need > H - 50) newPage();
  };

  // Header band
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, W, 92, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold").setFontSize(20);
  doc.text("AI Study Planner", M, 40);
  doc.setFont("helvetica", "normal").setFontSize(11);
  doc.text("Weekly Study Schedule for Matric Students", M, 58);
  const who = [meta.studentName, meta.studentClass, meta.board].filter(Boolean).join("  |  ");
  if (who) doc.text(who, M, 76);
  if (meta.weekLabel) {
    doc.setFontSize(11);
    doc.text(meta.weekLabel, W - M, 40, { align: "right" });
  }
  y = 118;

  // Summary
  if (plan.summary) {
    doc.setTextColor(...INK).setFont("helvetica", "italic").setFontSize(11);
    const lines = doc.splitTextToSize(plan.summary, W - M * 2);
    doc.text(lines, M, y);
    y += lines.length * 14 + 10;
  }

  // Subject priorities
  const mins = [...subjectMinutes(plan).entries()].sort((a, b) => b[1] - a[1]);
  if (mins.length) {
    space(40);
    doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(...INK);
    doc.text("Subject priorities this week", M, y);
    y += 16;
    const max = mins[0][1] || 1;
    doc.setFontSize(10);
    for (const [subject, m] of mins) {
      space(20);
      doc.setFont("helvetica", "normal").setTextColor(...INK);
      doc.text(subject, M, y + 8);
      const barX = M + 150;
      const barW = W - M - 70 - barX;
      doc.setFillColor(229, 231, 235);
      doc.roundedRect(barX, y, barW, 10, 5, 5, "F");
      doc.setFillColor(...BLUE);
      doc.roundedRect(barX, y, Math.max(6, (barW * m) / max), 10, 5, 5, "F");
      doc.setTextColor(...MUTED);
      doc.text(`${Math.round((m / 60) * 10) / 10}h`, W - M, y + 8, { align: "right" });
      y += 18;
    }
    y += 6;
    doc.setFont("helvetica", "bold").setTextColor(...INK).setFontSize(11);
    doc.text(`Total planned study time: ${Math.round((totalMinutes(plan) / 60) * 10) / 10} hours`, M, y);
    y += 20;
  }

  // Exam countdown
  if (meta.exams?.length) {
    space(40);
    doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(...INK);
    doc.text("Exam countdown", M, y);
    y += 16;
    doc.setFont("helvetica", "normal").setFontSize(10);
    for (const e of meta.exams) {
      space(16);
      doc.setTextColor(...INK);
      doc.text(e.subject, M, y);
      doc.setTextColor(...MUTED);
      doc.text(e.daysLeft <= 0 ? "Today" : `${e.daysLeft} day${e.daysLeft === 1 ? "" : "s"} left`, W - M, y, {
        align: "right",
      });
      y += 14;
    }
    y += 10;
  }

  // Daily schedule
  space(40);
  doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(...INK);
  doc.text("Daily schedule", M, y);
  y += 12;

  for (const day of plan.days ?? []) {
    space(60);
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(M, y, W - M * 2, 22, 6, 6, "F");
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...BLUE);
    doc.text(day.day, M + 10, y + 15);
    const dayMins = (day.blocks ?? []).reduce((a, b) => a + (Number(b.minutes) || 0), 0);
    doc.setFont("helvetica", "normal").setTextColor(...MUTED);
    doc.text(`${dayMins} min`, W - M - 10, y + 15, { align: "right" });
    y += 30;

    for (const b of day.blocks ?? []) {
      space(28);
      doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...MUTED);
      doc.text(String(b.time ?? ""), M + 10, y);
      doc.setFont("helvetica", "bold").setTextColor(...INK);
      doc.text(String(b.subject ?? ""), M + 90, y);
      doc.setFont("helvetica", "normal").setTextColor(...MUTED);
      doc.text(`${b.minutes ?? 0}m`, W - M - 10, y, { align: "right" });
      const topic = doc.splitTextToSize(String(b.topic ?? ""), W - M * 2 - 140);
      if (topic.length) {
        doc.text(topic, M + 90, y + 12);
        y += 12 + (topic.length - 1) * 11;
      }
      y += 20;
    }
    y += 4;
  }

  if (plan.tips?.length) {
    space(50);
    doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(...INK);
    doc.text("Coach tips", M, y);
    y += 16;
    doc.setFont("helvetica", "normal").setFontSize(10);
    for (const t of plan.tips) {
      const lines = doc.splitTextToSize(`• ${t}`, W - M * 2);
      space(lines.length * 13 + 6);
      doc.setTextColor(...MUTED);
      doc.text(lines, M, y);
      y += lines.length * 13 + 4;
    }
  }

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...MUTED);
    doc.text("Generated with AI Study Planner", M, H - 24);
    doc.text(`Page ${p} of ${pages}`, W - M, H - 24, { align: "right" });
  }

  return doc.output("blob");
}

/** Short WhatsApp-friendly text summary of the plan. */
export function planShareText(plan: GeneratedPlan, meta: SharePlanMeta) {
  const mins = [...subjectMinutes(plan).entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const lines = [
    "*My Weekly Study Plan*",
    [meta.studentName, meta.studentClass, meta.board].filter(Boolean).join(" | "),
    meta.weekLabel ? `Week: ${meta.weekLabel}` : "",
    "",
    "*Subject priorities*",
    ...mins.map(([s, m], i) => `${i + 1}. ${s} — ${Math.round((m / 60) * 10) / 10}h`),
    "",
    ...(meta.exams?.length
      ? ["*Exam countdown*", ...meta.exams.map((e) => `• ${e.subject}: ${e.daysLeft <= 0 ? "today" : `${e.daysLeft} days left`}`), ""]
      : []),
    ...(plan.days ?? []).map(
      (d) => `*${d.day}*\n${(d.blocks ?? []).map((b) => `  ${b.time} — ${b.subject} (${b.minutes}m): ${b.topic}`).join("\n")}`,
    ),
    "",
    `Total: ${Math.round((totalMinutes(plan) / 60) * 10) / 10} hours this week`,
    "Made with AI Study Planner",
  ];
  return lines.filter((l) => l !== undefined).join("\n");
}

export type ShareResult = "shared" | "whatsapp-text" | "downloaded";

/** Generates the PDF, then shares it (Web Share API) or downloads it and opens WhatsApp with formatted text. */
export async function sharePlanPdf(plan: GeneratedPlan, meta: SharePlanMeta): Promise<ShareResult> {
  const blob = await buildPlanPdf(plan, meta);
  const filename = `study-plan-${new Date().toISOString().slice(0, 10)}.pdf`;
  const file = new File([blob], filename, { type: "application/pdf" });
  const text = planShareText(plan, meta);

  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: "My Weekly Study Plan", text: "My weekly study schedule 📚" });
      return "shared";
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") throw err;
    }
  }

  downloadBlob(blob, filename);
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  return "whatsapp-text";
}

export function downloadPlanPdf(plan: GeneratedPlan, meta: SharePlanMeta) {
  return buildPlanPdf(plan, meta).then((blob) =>
    downloadBlob(blob, `study-plan-${new Date().toISOString().slice(0, 10)}.pdf`),
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
