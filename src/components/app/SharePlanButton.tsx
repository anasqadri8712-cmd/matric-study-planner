import { useState } from "react";
import { Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { GeneratedPlan } from "@/lib/ai.functions";
import { downloadPlanPdf, sharePlanPdf, type SharePlanMeta } from "@/lib/share-plan";

export function SharePlanButton({ plan, meta }: { plan: GeneratedPlan; meta: SharePlanMeta }) {
  const [busy, setBusy] = useState<"share" | "pdf" | null>(null);

  async function share() {
    setBusy("share");
    try {
      const result = await sharePlanPdf(plan, meta);
      if (result === "shared") toast.success("Schedule shared.");
      else toast.success("PDF downloaded — attach it in the WhatsApp chat that just opened.");
    } catch (err) {
      if ((err as DOMException)?.name !== "AbortError") toast.error("Could not share the schedule. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    setBusy("pdf");
    try {
      await downloadPlanPdf(plan, meta);
      toast.success("Schedule PDF downloaded.");
    } catch {
      toast.error("Could not create the PDF. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button onClick={share} disabled={busy !== null} className="press h-12 w-full rounded-2xl">
        <Share2 className="mr-1 size-4" /> {busy === "share" ? "Preparing..." : "Share on WhatsApp"}
      </Button>
      <Button onClick={save} disabled={busy !== null} variant="outline" className="press h-12 w-full rounded-2xl">
        <Download className="mr-1 size-4" /> {busy === "pdf" ? "Building..." : "Download PDF"}
      </Button>
    </div>
  );
}
