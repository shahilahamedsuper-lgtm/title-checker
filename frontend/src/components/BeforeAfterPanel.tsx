import { useState } from "react";
import type { DeduplicationResult } from "../types";
import { NeonButton } from "./ui/NeonButton";
import { apiClient } from "../api/client";

interface BeforeAfterPanelProps {
  result: DeduplicationResult;
  onUseCleanedText: (text: string) => void;
  isDeduplicating: boolean;
  originalFilename: string;
}

function countLines(text: string): number {
  return text ? text.split("\n").length : 0;
}

function countRows(text: string): number {
  return text ? text.split("\n").filter((line) => line.trim().length > 0).length : 0;
}

function inferContentType(fileTypeCategory: "text" | "tabular", filename: string): string {
  if (fileTypeCategory === "tabular") {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return "text/plain";
}

export default function BeforeAfterPanel({
  result,
  onUseCleanedText,
  isDeduplicating,
  originalFilename,
}: BeforeAfterPanelProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const isTabular = result.file_type_category === "tabular";
  const originalCount = isTabular
    ? countRows(result.original_text)
    : countLines(result.original_text);
  const cleanedCount = isTabular
    ? countRows(result.deduplicated_text)
    : countLines(result.deduplicated_text);
  const countLabel = isTabular ? "rows" : "lines";

  async function handleDownload() {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const response = await apiClient.post(
        "/api/download",
        {
          deduplicated_text: result.deduplicated_text,
          content_type: inferContentType(result.file_type_category, originalFilename),
          original_filename: originalFilename,
        },
        { responseType: "blob" }
      );
      const disposition = (response.headers["content-disposition"] as string) ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `cleaned_${originalFilename}`;
      const url = URL.createObjectURL(response.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      // apiClient returns Blob on error too — parse it
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: Blob } };
        if (axiosErr.response?.data instanceof Blob) {
          try {
            const text = await axiosErr.response.data.text();
            const json = JSON.parse(text);
            setDownloadError(json.detail || "Download failed.");
          } catch {
            setDownloadError("Download failed.");
          }
        } else {
          setDownloadError("Download failed.");
        }
      } else {
        setDownloadError(err instanceof Error ? err.message : "Download failed.");
      }
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary section */}
      <div className="flex items-center gap-3 flex-wrap">
        {result.duplicates_removed > 0 ? (
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-full px-3 py-1 border border-emerald-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {result.duplicates_removed} duplicate{result.duplicates_removed !== 1 ? "s" : ""} removed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 bg-white/10 text-slate-300 text-sm rounded-lg px-3 py-1">
            No duplicates found in this content.
          </span>
        )}
        <span className="inline-block bg-white/10 text-slate-400 text-xs font-medium rounded-full px-2.5 py-0.5">
          {isTabular ? "Tabular data" : "Text document"}
        </span>
      </div>

      {/* Side-by-side panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original panel */}
        <div className="flex flex-col gap-1">
          <div className="rounded-t-xl bg-white/5 border border-white/10 px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Original</span>
          </div>
          <pre className="max-h-64 overflow-y-auto rounded-b-xl border border-t-0 border-white/10 bg-white/5 p-3 whitespace-pre-wrap break-words text-xs font-mono text-slate-300">
            {result.original_text}
          </pre>
          <p className="text-xs text-slate-500 mt-0.5">{originalCount} {countLabel}</p>
        </div>

        {/* Cleaned panel */}
        <div className="flex flex-col gap-1">
          <div className="rounded-t-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Cleaned</span>
          </div>
          <pre className="max-h-64 overflow-y-auto rounded-b-xl border border-t-0 border-emerald-500/30 bg-emerald-500/5 p-3 whitespace-pre-wrap break-words text-xs font-mono text-slate-300">
            {result.deduplicated_text}
          </pre>
          <p className="text-xs text-slate-500 mt-0.5">{cleanedCount} {countLabel}</p>
        </div>
      </div>

      {/* Use Cleaned Text button */}
      {result.duplicates_removed > 0 && (
        <NeonButton
          variant="primary"
          disabled={isDeduplicating}
          onClick={() => onUseCleanedText(result.deduplicated_text)}
          className="w-full"
        >
          Use Cleaned Text
        </NeonButton>
      )}

      {/* Download button */}
      <NeonButton
        variant="success"
        isLoading={isDownloading}
        loadingLabel="Generating file…"
        disabled={isDeduplicating}
        onClick={handleDownload}
        className="w-full"
      >
        Download Cleaned File
      </NeonButton>

      {/* Download error */}
      {downloadError && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-300">
          {downloadError}
        </div>
      )}
    </div>
  );
}
