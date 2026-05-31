import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileSpreadsheet, MoreVertical, RefreshCw, FileText, File } from "lucide-react";
import { GlassCard } from "../components/ui/GlassCard";
import { sectionVariants } from "../styles/tokens";
import { useAuth } from "../context/AuthContext";
import { fetchHistory, type HistoryEntry } from "../api/dashboardApi";
import toast from "react-hot-toast";const statusStyle: Record<string, string> = {
  analyzed:    "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  pending:     "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  failed:      "text-red-400 bg-red-400/10 border-red-400/20",
};

const operationLabel: Record<string, string> = {
  upload:      "Uploaded",
  analyze:     "Analyzed",
  deduplicate: "Deduplicated",
  excel:       "Excel Analysis",
};

function FileIcon({ filename }: { filename: string }) {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "xlsx" || ext === "xls") return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
  if (ext === "pdf") return <FileText className="w-4 h-4 text-red-400" />;
  return <File className="w-4 h-4 text-blue-400" />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function HistoryPage() {
  const { token } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchHistory();
      setHistory(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [token]);

  return (
    <div className="px-4 sm:px-6 py-8 max-w-5xl mx-auto">
      <motion.div variants={sectionVariants} initial="hidden" animate="visible" className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">History</h1>
            <p className="text-slate-400 text-sm mt-1">View your previously uploaded and processed files</p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg px-3 py-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </motion.div>

      <motion.div variants={sectionVariants} initial="hidden" animate="visible">
        <GlassCard className="overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-white font-semibold">File Activity</h2>
            <span className="text-slate-400 text-xs">{history.length} entries</span>
          </div>

          {loading && history.length === 0 ? (
            <div className="px-6 py-12 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-slate-500 animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No files yet. Upload a file to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {history.map((file, i) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.03] transition-colors group"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <FileIcon filename={file.filename} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{file.filename}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {formatDate(file.uploaded_at)} · {formatBytes(file.size_bytes)} · {operationLabel[file.operation] ?? file.operation}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusStyle[file.status] ?? statusStyle.pending} shrink-0`}>
                    {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                  </span>
                  <button className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-white">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}
