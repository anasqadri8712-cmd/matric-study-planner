import { useState } from "react";
import { Download, Eye, FileText, Share2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useReportData } from "@/lib/report";
import { buildStudyReportPdf, downloadBlob, reportFileName, shareOrDownloadPdf } from "@/lib/pdf";

/** Download / share the student's live study report as a styled A4 PDF. */
export function StudyReportActions({ compact = false }: { compact?: boolean }) {
  const data = useReportData();
  const profile = data.profile;
  const [busy, setBusy] = useState<"download" | "share" | null>(null);

  function buildData() {
    return data;
  }


  async function run(mode: "download" | "share") {
    setBusy(mode);
    try {
      const blob = await buildStudyReportPdf(buildData());
      const filename = reportFileName(profile);
      if (mode === "download") {
        downloadBlob(blob, filename);
        toast.success("PDF saved to your downloads.");
      } else {
        const result = await shareOrDownloadPdf(blob, filename, "My Study Report");
        if (result === "downloaded") toast.success("Sharing isn't available here — the PDF was downloaded instead.");
        else if (result === "shared") toast.success("Report shared.");
      }
    } catch {
      toast.error("Could not create the PDF. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={compact ? "grid grid-cols-2 gap-3" : "surface-card space-y-3 p-4"}>
      {compact ? null : (
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <FileText className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Study report PDF</p>
            <p className="text-xs text-muted-foreground">Plan, tasks and progress in one A4 document</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => run("download")}
          disabled={busy !== null}
          variant="outline"
          className="press h-12 w-full rounded-2xl"
        >
          <Download className="mr-1 size-4" />
          {busy === "download" ? "Building..." : "Download PDF"}
        </Button>
        <Button onClick={() => run("share")} disabled={busy !== null} className="press h-12 w-full rounded-2xl">
          <Share2 className="mr-1 size-4" />
          {busy === "share" ? "Preparing..." : "Share"}
        </Button>
      </div>
    </div>
  );
}