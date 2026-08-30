import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { useReportData } from "@/lib/report";
import { buildStudyReportPdf, downloadBlob, reportFileName, shareOrDownloadPdf } from "@/lib/pdf";

export const Route = createFileRoute("/_authenticated/report-preview")({
  head: () => ({
    meta: [
      { title: "Report Preview | AI Study Planner" },
      { name: "description", content: "Preview your study report PDF before downloading or sharing it." },
      { property: "og:title", content: "Report Preview" },
      { property: "og:description", content: "Review your AI study plan, tasks and progress report before sharing." },
    ],
  }),
  component: ReportPreviewPage,
});

function ReportPreviewPage() {
  const navigate = useNavigate();
  const data = useReportData();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState<"download" | "share" | null>(null);
  const blobRef = useRef<Blob | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    setError(false);
    buildStudyReportPdf(data)
      .then((blob) => {
        if (cancelled) return;
        blobRef.current = blob;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify([data.tasks.length, data.quizzes.length, data.subjects.length, data.weekLabel])]);

  async function act(mode: "download" | "share") {
    const blob = blobRef.current;
    if (!blob) return;
    setBusy(mode);
    try {
      const filename = reportFileName(data.profile);
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
    <AppShell>
      <PageHeader
        title="Report preview"
        subtitle="Check everything looks right before you send it"
        action={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/settings" })}
            className="press rounded-xl"
            aria-label="Back"
          >
            <ArrowLeft className="size-5" />
          </Button>
        }
      />

      <div className="surface-card animate-rise overflow-hidden p-1">
        {error ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Could not build the preview. Please try again.
          </p>
        ) : url ? (
          <object data={url} type="application/pdf" className="h-[62vh] min-h-[380px] w-full rounded-2xl">
            <div className="space-y-3 p-6 text-center text-sm text-muted-foreground">
              <p>Inline preview isn't supported on this device.</p>
              <a href={url} target="_blank" rel="noreferrer" className="font-semibold text-primary underline">
                Open the PDF in a new tab
              </a>
            </div>
          </object>
        ) : (
          <div className="shimmer h-[62vh] min-h-[380px] w-full rounded-2xl bg-muted/40" />
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={() => act("download")}
          disabled={!url || busy !== null}
          className="press h-12 rounded-2xl"
        >
          <Download className="mr-1 size-4" />
          Download PDF
        </Button>
        <Button onClick={() => act("share")} disabled={!url || busy !== null} className="press h-12 rounded-2xl">
          <Share2 className="mr-1 size-4" />
          {busy === "share" ? "Preparing..." : "Share"}
        </Button>
      </div>
    </AppShell>
  );
}
