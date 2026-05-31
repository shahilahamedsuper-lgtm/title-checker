import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, FileText, Sparkles, Search, Lightbulb, AlertCircle, Bot } from "lucide-react";
import { useAIAssistant } from "../../context/AIAssistantContext";
import { chatWithAssistant } from "../../api/chatApi";
import type { AssistantMessage, ChatMessage } from "../../types";

// ---------------------------------------------------------------------------
// Typing indicator
// ---------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
        style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)" }}
      >
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>
      <div
        className="px-4 py-3 rounded-2xl rounded-tl-sm"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-purple-400"
              style={{
                animation: "typingBounce 1.2s ease-in-out infinite",
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

function MessageBubble({ msg }: { msg: AssistantMessage }) {
  const isUser = msg.role === "user";
  const isError = msg.role === "error";

  if (isUser) {
    return (
      <div className="flex justify-end mb-3">
        <div
          className="px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] text-sm text-white leading-relaxed"
          style={{
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            boxShadow: "0 2px 12px rgba(37,99,235,0.3)",
          }}
        >
          {msg.content}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-start gap-2 mb-3">
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-red-500/20 border border-red-500/30">
          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
        </div>
        <div
          className="px-4 py-2.5 rounded-2xl rounded-tl-sm max-w-[85%] text-sm text-red-400 leading-relaxed"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
          }}
        >
          {msg.content}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex items-start gap-2 mb-3">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
        style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)" }}
      >
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>
      <div
        className="px-4 py-2.5 rounded-2xl rounded-tl-sm max-w-[85%] text-sm text-slate-200 leading-relaxed whitespace-pre-wrap"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {msg.content}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quick action pill button
// ---------------------------------------------------------------------------

function QuickAction({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(168,85,247,0.3)",
        color: "#c084fc",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(168,85,247,0.15)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(168,85,247,0.6)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(168,85,247,0.3)";
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

interface AIAssistantPanelProps {
  // reserved for future focus-return behaviour
}

export function AIAssistantPanel(_props: AIAssistantPanelProps) {
  const {
    fileContext,
    filename,
    analysisResult,
    messages,
    addMessage,
  } = useAIAssistant();

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Focus textarea when panel opens
  useEffect(() => {
    const timer = setTimeout(() => textareaRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  };

  const buildHistory = useCallback((): ChatMessage[] => {
    return messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      const userMsg: AssistantMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };
      addMessage(userMsg);
      setIsLoading(true);

      try {
        const history = buildHistory();
        const answer = await chatWithAssistant(trimmed, fileContext, history);
        addMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content: answer,
          timestamp: Date.now(),
        });
      } catch (err) {
        addMessage({
          id: crypto.randomUUID(),
          role: "error",
          content: err instanceof Error ? err.message : "Something went wrong. Please try again.",
          timestamp: Date.now(),
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, fileContext, addMessage, buildHistory]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleSummarize = () => sendMessage("Please summarize this file.");
  const handleAnalyze = () =>
    sendMessage(
      "Please analyze this file: describe its meaning, tone, clarity, and provide improvement suggestions."
    );
  const handleExplainResults = () => {
    if (!analysisResult) return;
    const payload = JSON.stringify(
      {
        meaning: analysisResult.meaning,
        tone: analysisResult.tone,
        clarity_score: analysisResult.clarity_score,
        suggestions: analysisResult.suggestions,
      },
      null,
      2
    );
    sendMessage(
      `Please explain these analysis results in plain language:\n\`\`\`json\n${payload}\n\`\`\``
    );
  };

  const showQuickActions = !!fileContext;
  const canSend = input.trim().length > 0 && !isLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.97 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="fixed bottom-24 right-6 z-50 flex flex-col"
      style={{
        width: "380px",
        height: "520px",
        borderRadius: "20px",
        background: "rgba(8,10,24,0.92)",
        border: "1px solid rgba(168,85,247,0.25)",
        boxShadow:
          "0 0 0 1px rgba(168,85,247,0.12), 0 0 40px rgba(168,85,247,0.15), 0 0 80px rgba(99,102,241,0.08), 0 24px 48px rgba(0,0,0,0.6)",
        backdropFilter: "blur(20px)",
        overflow: "hidden",
      }}
      role="dialog"
      aria-label="AI Assistant"
      aria-modal="false"
    >
      {/* Holographic shimmer overlay */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[20px]"
        style={{
          background:
            "linear-gradient(135deg, rgba(168,85,247,0.04) 0%, transparent 40%, rgba(99,102,241,0.03) 100%)",
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      {/* ── Header ── */}
      <div
        className="relative z-10 flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-2.5">
          {/* Gradient icon */}
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)" }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2
              className="text-sm font-semibold leading-none"
              style={{
                background: "linear-gradient(90deg,#c084fc,#818cf8,#22d3ee)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              AI Assistant
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-none">
              {fileContext ? "File context active" : "General mode"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filename pill */}
          {filename && (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] text-cyan-400 max-w-[120px]"
              style={{
                background: "rgba(6,182,212,0.1)",
                border: "1px solid rgba(6,182,212,0.3)",
              }}
              title={filename}
            >
              <FileText className="w-3 h-3 shrink-0" />
              <span className="truncate">{filename}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick actions ── */}
      {showQuickActions && (
        <div
          className="relative z-10 flex items-center gap-1.5 px-4 py-2 shrink-0 overflow-x-auto"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <QuickAction
            icon={<Sparkles className="w-3 h-3" />}
            label="Summarize"
            onClick={handleSummarize}
            disabled={isLoading}
          />
          <QuickAction
            icon={<Search className="w-3 h-3" />}
            label="Analyze"
            onClick={handleAnalyze}
            disabled={isLoading}
          />
          {analysisResult && (
            <QuickAction
              icon={<Lightbulb className="w-3 h-3" />}
              label="Explain Results"
              onClick={handleExplainResults}
              disabled={isLoading}
            />
          )}
        </div>
      )}

      {/* ── Message list ── */}
      <div
        className="relative z-10 flex-1 overflow-y-auto px-4 py-3"
        aria-live="polite"
        aria-atomic="false"
        aria-label="Conversation"
      >
        {/* Welcome message */}
        {messages.length === 0 && (
          <div className="flex items-start gap-2 mb-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)" }}
            >
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div
              className="px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm text-slate-300 leading-relaxed"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              Hello! I'm your AI assistant. I can answer general questions about the Semantic
              Validator, or — when you have a file open — help you summarize, analyze, or explain
              its contents.
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {isLoading && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area ── */}
      <div
        className="relative z-10 flex items-end gap-2 px-3 py-3 shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={1}
          placeholder="Type a message…"
          aria-label="Message input"
          className="flex-1 resize-none text-sm text-slate-200 placeholder-slate-500 rounded-xl px-3 py-2.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 disabled:opacity-50 transition-colors"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            maxHeight: "96px",
            lineHeight: "1.5",
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!canSend}
          aria-label="Send message"
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          style={{
            background: canSend
              ? "linear-gradient(135deg,#7c3aed,#2563eb)"
              : "rgba(255,255,255,0.08)",
            boxShadow: canSend ? "0 0 16px rgba(124,58,237,0.4)" : "none",
          }}
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Typing bounce keyframes injected inline */}
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </motion.div>
  );
}
