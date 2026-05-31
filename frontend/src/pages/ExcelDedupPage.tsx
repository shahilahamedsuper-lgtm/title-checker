import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSpreadsheet, CheckCircle2, Trash2,
  Download, RefreshCw, Loader2, AlertCircle, Info,
} from "lucide-react";
import toast from "react-hot-toast";
import { GlassCard } from "../components/ui/GlassCard";
import { NeonButton } from "../components/ui/NeonButton";
import { deduplicateExcelFile, type ExcelDedupResult } from "../api/excelDedupApi";

function useSpotlight<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const onMouseMove = useCallback((e: React.MouseEvent<T>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spotlight-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--spotlight-y", `${e.clientY - rect.top}px`);
    el.style.setProperty("--spotlight-opacity", "1");
  }, []);
  const onMouseLeave = useCallback(() => {
    ref.current?.style.setProperty("--spotlight-opacity", "0");
  }, []);
  return { ref, onMouseMove, onMouseLeave };
}

type Stage = "idle" | "uploading" | "done" | "error";

export default function ExcelDedupPage() {
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ExcelDedupResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { ref: dropRef, onMouseMove, onMouseLeave } = useSpotlight<HTMLDivElement>();

  async function processFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls"].includes(ext ?? "")) {
      toast.error("Please upload an Excel file (.xlsx or .xls)");
      return;
    }
    setSelectedFile(file);
    setStage("uploading");
    setProgress(0);
    setResult(null);
    setErrorMsg("");

    try {
      const res = await deduplicateExcelFile(file, setProgress);
      setResult(res);
      setStage("done");
      if (res.duplicatesRemoved === 0) {
        toast("No duplicates found — file is already clean!", { icon: "✅" });
      } else {
        toast.success(`${res.duplicatesRemoved} duplicate row${res.duplicatesRemoved !== 1 ? "s" : ""} removed!`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Processing failed";
      setErrorMsg(msg);
      setStage("error");
      toast.error(msg);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleDownload() {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.cleanedFileUrl;
    a.download = result.cleanedFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Download started!");
  }

  function reset() {
    if (result?.cleanedFileUrl) URL.revokeObjectURL(result.cleanedFileUrl);
    setStage("idle");
    setResult(null);
    setSelectedFile(null);
    setErrorMsg("");
    setProgress(0);
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/30 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Remove Duplicates</h1>
            <p className="text-slate-400 text-sm">Upload an Excel file — get back a clean file with duplicate rows removed</p>
          </div>
        </div>
      </motion.div>

      {/* How it works */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="mb-6">
        <GlassCard className="p-4" disableSpotlight>
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-400 space-y-1">
              <p><span className="text-white font-medium">How it works:</span> Upload your Excel file → duplicate rows are detected and removed → download the cleaned file with the exact same column structure.</p>
              <p>Comparison is <span className="text-white">case-insensitive</span> and ignores extra spaces. The first occurrence of each row is kept. The header row is always preserved.</p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Upload zone */}
      <AnimatePresence mode="wait">
        {stage === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
            <GlassCard className="overflow-hidden" spotlightColor="rgba(236,72,153,0.15)">
              <div
                ref={dropRef}
                onMouseMove={onMouseMove}
                onMouseLeave={onMouseLeave}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-5 px-8 py-14 cursor-pointer transition-all ${
                  dragging ? "bg-pink-500/5" : "hover:bg-white/[0.02]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ""; }}
                />
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border-2 border-dashed transition-all ${
                  dragging ? "border-pink-400 bg-pink-500/10" : "border-white/20 bg-white/5"
                }`}>
                  <FileSpreadsheet className={`w-9 h-9 transition-colors ${dragging ? "text-pink-400" : "text-slate-400"}`} />
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold text-lg">Drop your Excel file here</p>
                  <p className="text-slate-400 text-sm mt-1">
                    or <span className="text-pink-400 hover:underline">click to browse</span>
                  </p>
                  <p className="text-slate-500 text-xs mt-2">Supported: .xlsx, .xls · Max 10 MB</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {stage === "uploading" && (
          <motion.div key="uploading" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
            <GlassCard className="p-8 flex flex-col items-center gap-5" disableSpotlight>
              <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
              </div>
              <div className="text-center w-full max-w-xs">
                <p className="text-white font-semibold mb-3">Processing {selectedFile?.name}…</p>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(progress, 15)}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-slate-400 text-xs mt-2">{progress > 0 ? `${progress}% uploaded` : "Uploading…"}</p>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {stage === "done" && result && (
          <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="space-y-4">
            {/* Result summary */}
            <GlassCard className="p-6" spotlightColor="rgba(16,185,129,0.15)">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">Processing complete!</p>
                  <p className="text-slate-400 text-sm">{selectedFile?.name}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: "Original Rows", value: result.originalRows, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
                  { label: "Duplicates Removed", value: result.duplicatesRemoved, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
                  { label: "Unique Rows", value: result.originalRows - result.duplicatesRemoved, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                ].map(s => (
                  <div key={s.label} className={`rounded-xl border ${s.bg} p-3 text-center`}>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {result.duplicatesRemoved === 0 ? (
                <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-3 flex items-center gap-2.5 mb-4">
                  <Info className="w-4 h-4 text-blue-400 shrink-0" />
                  <p className="text-blue-300 text-sm">No duplicate rows were found. The file is already clean.</p>
                </div>
              ) : (
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 flex items-center gap-2.5 mb-4">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <p className="text-emerald-300 text-sm">
                    <span className="font-semibold">{result.duplicatesRemoved} duplicate row{result.duplicatesRemoved !== 1 ? "s" : ""}</span> removed. Column structure preserved.
                  </p>
                </div>
              )}

              {/* Download button */}
              <NeonButton
                variant="success"
                onClick={handleDownload}
                className="w-full justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Cleaned File ({result.cleanedFilename})
              </NeonButton>
            </GlassCard>

            {/* Process another */}
            <button
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded-xl py-2.5 transition text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Process another file
            </button>
          </motion.div>
        )}

        {stage === "error" && (
          <motion.div key="error" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="space-y-4">
            <GlassCard className="p-6" disableSpotlight>
              <div className="flex items-start gap-3 mb-5">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-semibold">Processing failed</p>
                  <p className="text-red-300 text-sm mt-1">{errorMsg}</p>
                </div>
              </div>
              <NeonButton variant="secondary" onClick={reset} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Try again
              </NeonButton>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


