import { useRef, useState } from "react";
import { uploadFile } from "../api/uploadApi";
import { NeonButton } from "./ui/NeonButton";
import type { UploaderState } from "../types";

const SUPPORTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
] as const;

const EXCEL_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
]);

const ACCEPTED_EXTENSIONS = ".pdf,.docx,.txt,.csv,.xls,.xlsx";

interface FileUploaderProps {
  onPopulate: (text: string) => void;
  onAnalyze: (text: string, fallbackTitle: string) => void;
  isAnalyzing: boolean;
  onDeduplicate: (text: string, contentType: string, filename: string) => void;
  isDeduplicating: boolean;
  deduplicationError?: string | null;
  onAnalyzeExcel?: (file: File) => void;
  isAnalyzingExcel?: boolean;
  onChatWithFile?: (extractedText: string, filename: string) => void;
}

export default function FileUploader({ onPopulate, onAnalyze, isAnalyzing, onDeduplicate, isDeduplicating, deduplicationError, onAnalyzeExcel, isAnalyzingExcel, onChatWithFile }: FileUploaderProps) {
  const [state, setState] = useState<UploaderState>({ status: "idle" });
  const [rawFile, setRawFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function validateAndUpload(file: File) {
    if (!SUPPORTED_MIME_TYPES.includes(file.type as (typeof SUPPORTED_MIME_TYPES)[number])) {
      setState({
        status: "error",
        message: "Unsupported file type. Please upload a PDF, DOCX, TXT, XLS, or XLSX file.",
      });
      return;
    }
    handleUpload(file);
  }

  async function handleUpload(file: File) {
    setRawFile(file);
    setState({ status: "uploading" });
    try {
      const result = await uploadFile(file);
      setState({ status: "success", result });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Upload failed.",
      });
    }
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (state.status === "uploading") return;
    setState({ status: "dragging" });
  }

  function onDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (state.status === "uploading") return;
    setState({ status: "idle" });
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (state.status === "uploading") return;
    const file = e.dataTransfer.files[0];
    if (file) validateAndUpload(file);
  }

  function onClickDropZone() {
    if (state.status === "uploading") return;
    fileInputRef.current?.click();
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) validateAndUpload(file);
    // Reset input so the same file can be re-selected after an error
    e.target.value = "";
  }

  const isDragging = state.status === "dragging";

  return (
    <div>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        className="hidden"
        onChange={onFileInputChange}
        aria-hidden="true"
      />

      {/* Idle / Dragging state */}
      {(state.status === "idle" || state.status === "dragging") && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload file drop zone"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onClickDropZone}
          onKeyDown={(e) => e.key === "Enter" && onClickDropZone()}
          className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors ${
            isDragging
              ? "border-neon-blue bg-blue-500/10"
              : "border-white/20 bg-white/5 hover:border-neon-blue hover:bg-blue-500/10"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-10 w-10 ${isDragging ? "text-neon-blue" : "text-slate-400"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-200">
              Drag &amp; drop your file here
            </p>
            <p className="text-xs text-slate-400 mt-1">
              or <span className="text-neon-blue cursor-pointer hover:underline">click to browse</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">Supported: .xlsx, .xls, .csv, .txt, .pdf, .docx</p>
          </div>
        </div>
      )}

      {/* Uploading state — animated progress bar */}
      {state.status === "uploading" && (
        <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 px-6 py-8">
          <p className="text-sm font-medium text-slate-300 text-center">Extracting text…</p>
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-neon-blue animate-pulse" style={{ width: '70%', transition: 'width 0.5s ease' }} />
          </div>
        </div>
      )}

      {/* Success state */}
      {state.status === "success" && (
        <div className="flex flex-col gap-4">
          {/* Filename */}
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-600 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
              {state.result.filename}
            </span>
          </div>

          {/* Text preview */}
          <pre className="max-h-32 overflow-y-auto rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-2 text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap break-words font-mono">
            {state.result.extracted_text.slice(0, 300)}
          </pre>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <NeonButton
              type="button"
              variant="secondary"
              disabled={isAnalyzing || isDeduplicating}
              tooltip="Fill the analysis form with extracted text"
              onClick={() => onPopulate(state.result.extracted_text)}
              className="flex-1"
            >
              Populate Form
            </NeonButton>
            <NeonButton
              type="button"
              variant="primary"
              isLoading={isAnalyzing}
              loadingLabel="Analyzing…"
              disabled={isDeduplicating}
              tooltip="Analyze file content for meaning, tone & clarity"
              onClick={() => onAnalyze(state.result.extracted_text, state.result.filename)}
              className="flex-1"
            >
              Analyze
            </NeonButton>
            <NeonButton
              type="button"
              variant="secondary"
              isLoading={isDeduplicating}
              loadingLabel="Removing…"
              disabled={isAnalyzing}
              tooltip="Detect and remove duplicate entries"
              onClick={() => onDeduplicate(state.result.extracted_text, state.result.content_type, state.result.filename)}
              className="flex-1"
            >
              Remove Duplicates
            </NeonButton>
          </div>

          {/* Deduplication error */}
          {deduplicationError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {deduplicationError}
            </div>
          )}

          {/* Analyze Excel button — only for Excel files */}
          {onAnalyzeExcel && EXCEL_MIME_TYPES.has(state.result.content_type) && (
            <NeonButton
              type="button"
              variant="success"
              isLoading={isAnalyzingExcel}
              loadingLabel="Analyzing Excel…"
              disabled={isAnalyzing || isDeduplicating}
              tooltip="Generate statistical summary of Excel data"
              onClick={() => rawFile && onAnalyzeExcel(rawFile)}
              className="w-full"
            >
              Analyze Excel
            </NeonButton>
          )}

          {/* Chat with File button */}
          {onChatWithFile && (
            <NeonButton
              type="button"
              variant="secondary"
              tooltip="Start an AI conversation about this file"
              onClick={() => onChatWithFile(state.result.extracted_text, state.result.filename)}
              className="w-full"
            >
              Chat with File
            </NeonButton>
          )}
        </div>
      )}

      {/* Error state */}
      {state.status === "error" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
            <div className="flex items-start gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-red-400 shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
              <p className="text-sm font-medium text-red-300">{state.message}</p>
            </div>
          </div>
          <NeonButton
            type="button"
            variant="secondary"
            onClick={() => setState({ status: "idle" })}
            className="self-start"
          >
            Try Again
          </NeonButton>
        </div>
      )}
    </div>
  );
}
