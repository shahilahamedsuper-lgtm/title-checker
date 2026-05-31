import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "../components/ui/GlassCard";
import FileUploader from "../components/FileUploader";
import BeforeAfterPanel from "../components/BeforeAfterPanel";
import { deduplicateText } from "../api/deduplicateApi";
import { analyzeExcel } from "../api/analyzeExcelApi";
import { analyzeText } from "../api/analyzeApi";
import { sectionVariants } from "../styles/tokens";
import { useAIAssistant } from "../context/AIAssistantContext";
import type { DeduplicationResult, ExcelAnalysisState, PanelState } from "../types";

export default function UploadFilePage() {
  const [state, setState] = useState<PanelState>({ status: "idle" });
  const [excelAnalysisState, setExcelAnalysisState] = useState<ExcelAnalysisState>({ status: "idle" });
  const [deduplicationResult, setDeduplicationResult] = useState<DeduplicationResult | null>(null);
  const [isDeduplicating, setIsDeduplicating] = useState(false);
  const [deduplicationError, setDeduplicationError] = useState<string | null>(null);
  const [originalFilename, setOriginalFilename] = useState("");

  const { setFileContext, clearFileContext } = useAIAssistant();

  // Clear assistant context on unmount
  useEffect(() => {
    return () => clearFileContext();
  }, [clearFileContext]);

  async function handleAnalyze(text: string, fallbackTitle: string) {
    setState({ status: "loading" });
    try {
      const result = await analyzeText(fallbackTitle, text.slice(0, 5000));
      setState({ status: "success", result });
      // Share with the global AI assistant widget
      setFileContext(text, fallbackTitle);
    } catch (err) {
      setState({ status: "error", message: err instanceof Error ? err.message : "Analysis failed." });
    }
  }

  async function handleDeduplicate(text: string, contentType: string, filename: string) {
    setOriginalFilename(filename);
    setIsDeduplicating(true);
    setDeduplicationError(null);
    setDeduplicationResult(null);
    try {
      const result = await deduplicateText(text, contentType);
      setDeduplicationResult(result);
    } catch (err) {
      setDeduplicationError(err instanceof Error ? err.message : "Deduplication failed.");
    } finally {
      setIsDeduplicating(false);
    }
  }

  async function handleAnalyzeExcel(file: File) {
    setExcelAnalysisState({ status: "loading" });
    try {
      const result = await analyzeExcel(file);
      setExcelAnalysisState({ status: "success", result });
    } catch (err) {
      setExcelAnalysisState({ status: "error", message: err instanceof Error ? err.message : "Excel analysis failed." });
    }
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-4xl mx-auto">
      <motion.div variants={sectionVariants} initial="hidden" animate="visible" className="mb-8">
        <h1 className="text-2xl font-bold text-white">Upload File</h1>
        <p className="text-slate-400 text-sm mt-1">Upload your Excel or document files for analysis</p>
      </motion.div>

      <motion.div variants={sectionVariants} initial="hidden" animate="visible" className="mb-6">
        <GlassCard className="p-6">
          <FileUploader
            onPopulate={() => {}}
            onAnalyze={handleAnalyze}
            onDeduplicate={handleDeduplicate}
            isAnalyzing={state.status === "loading"}
            isDeduplicating={isDeduplicating}
            deduplicationError={deduplicationError}
            onAnalyzeExcel={handleAnalyzeExcel}
            isAnalyzingExcel={excelAnalysisState.status === "loading"}
            onChatWithFile={() => {}}
          />
        </GlassCard>
      </motion.div>

      {deduplicationResult && (
        <motion.div variants={sectionVariants} initial="hidden" animate="visible" className="mb-6">
          <GlassCard className="p-6">
            <BeforeAfterPanel
              result={deduplicationResult}
              onUseCleanedText={() => {}}
              isDeduplicating={isDeduplicating}
              originalFilename={originalFilename}
            />
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
}


