import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Upload } from "lucide-react";
import { GlassCard } from "../components/ui/GlassCard";
import { NeonButton } from "../components/ui/NeonButton";
import FileChat from "../components/FileChat";
import { uploadFile } from "../api/uploadApi";
import { sectionVariants } from "../styles/tokens";
import { useAIAssistant } from "../context/AIAssistantContext";
import type { ChatMessage } from "../types";

export default function ChatWithAIPage() {
  const [fileContextLocal, setFileContextLocal] = useState<string | null>(null);
  const [filename, setFilename] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { setFileContext, clearFileContext } = useAIAssistant();

  // Clear assistant context on unmount
  useEffect(() => {
    return () => clearFileContext();
  }, [clearFileContext]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadFile(file);
      setFileContextLocal(result.extracted_text);
      setFilename(result.filename);
      setChatHistory([]);
      // Share with the global AI assistant widget
      setFileContext(result.extracted_text, result.filename);
    } catch {
      // ignore
    } finally {
      setUploading(false);
    }
    e.target.value = "";
  }

  function handleChangeFile() {
    setFileContextLocal(null);
    setFilename("");
    setChatHistory([]);
    clearFileContext();
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-4xl mx-auto">
      <motion.div variants={sectionVariants} initial="hidden" animate="visible" className="mb-8">
        <h1 className="text-2xl font-bold text-white">Chat with AI</h1>
        <p className="text-slate-400 text-sm mt-1">Upload a file and ask questions about its content</p>
      </motion.div>

      {!fileContextLocal ? (
        <motion.div variants={sectionVariants} initial="hidden" animate="visible">
          <GlassCard className="p-8 flex flex-col items-center gap-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center">
              <MessageCircle className="w-9 h-9 text-neon-purple" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-xl">Start a conversation</h2>
              <p className="text-slate-400 text-sm mt-2 max-w-sm">Upload a file first, then ask the AI anything about its content</p>
            </div>
            {/* Hidden file input triggered programmatically — button inside label doesn't work */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.xlsx,.xls"
              className="hidden"
              onChange={handleFileUpload}
            />
            <NeonButton
              variant="primary"
              isLoading={uploading}
              loadingLabel="Uploading…"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload File to Chat
            </NeonButton>
          </GlassCard>
        </motion.div>
      ) : (
        <motion.div variants={sectionVariants} initial="hidden" animate="visible">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 text-sm">Chatting about: <span className="text-white font-medium">{filename}</span></span>
            </div>
            <NeonButton variant="secondary" onClick={handleChangeFile} className="text-xs py-1.5 px-3">
              Change File
            </NeonButton>
          </div>
          <GlassCard className="p-0 overflow-hidden">
            <FileChat filename={filename} fileContext={fileContextLocal ?? ""} conversationHistory={chatHistory} onHistoryUpdate={setChatHistory} />
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
}


