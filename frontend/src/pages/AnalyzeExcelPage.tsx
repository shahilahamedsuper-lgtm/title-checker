import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import { GlassCard } from "../components/ui/GlassCard";
import ExcelDashboard from "../components/ExcelDashboard";
import { analyzeExcel } from "../api/analyzeExcelApi";
import { sectionVariants } from "../styles/tokens";
import { useAIAssistant } from "../context/AIAssistantContext";
import type { ExcelAnalysisState } from "../types";

export default function AnalyzeExcelPage() {
  const [state, setState] = useState<ExcelAnalysisState>({ status: "idle" });
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { setFileContext, setAnalysisResult, clearFileContext } = useAIAssistant();

  // Clear assistant context on unmount
  useEffect(() => {
    return () => clearFileContext();
  }, [clearFileContext]);

  async function handleFile(file: File) {
    setState({ status: "loading" });
    try {
      const result = await analyzeExcel(file);
      setState({ status: "success", result });
      // Share file context with the AI assistant widget
      if (result.ai_summary) {
        setFileContext(result.ai_summary, file.name);
        // Map Excel result to AnalysisResult shape for "Explain Results" quick action
        setAnalysisResult({
          meaning: result.ai_summary,
          tone: "analytical",
          clarity_score: Math.round(
            100 - (result.duplicate_row_count / Math.max(result.rows.length, 1)) * 100
          ),
          suggestions: [
            result.duplicate_row_count > 0
              ? `${result.duplicate_row_count} duplicate rows detected — consider deduplication.`
              : "No duplicate rows found.",
            `${result.column_stats.filter((c) => c.missing_count > 0).length} columns have missing values.`,
          ].filter(Boolean),
        });
      }
    } catch (err) {
      setState({ status: "error", message: err instanceof Error ? err.message : "Analysis failed." });
    }
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-6xl mx-auto">
      <motion.div variants={sectionVariants} initial="hidden" animate="visible" className="mb-8">
        <h1 className="text-2xl font-bold text-white">Analyze Excel</h1>
        <p className="text-slate-400 text-sm mt-1">Upload an Excel file to get statistical analysis and AI insights</p>
      </motion.div>

      {state.status === "idle" && (
        <motion.div variants={sectionVariants} initial="hidden" animate="visible">
          <GlassCard className="p-8">
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed py-16 cursor-pointer transition-all ${
                dragging ? "border-neon-blue bg-blue-500/10" : "border-white/20 hover:border-neon-blue hover:bg-blue-500/5"
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
                <Upload className="w-7 h-7 text-neon-blue" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-lg">Drop your Excel file here</p>
                <p className="text-slate-400 text-sm mt-1">or <span className="text-neon-blue">click to browse</span></p>
                <p className="text-slate-500 text-xs mt-2">Supported: .xlsx, .xls</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {state.status !== "idle" && (
        <motion.div variants={sectionVariants} initial="hidden" animate="visible">
          <GlassCard className="p-6">
            <ExcelDashboard state={state} onDismissError={() => setState({ status: "idle" })} />
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
}


