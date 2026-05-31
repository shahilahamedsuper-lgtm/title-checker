import { useEffect, useRef, useState } from "react";
import { chatWithFile } from "../api/chatApi";
import { NeonButton } from "./ui/NeonButton";
import type { ChatMessage, ChatState } from "../types";

interface FileChatProps {
  filename: string;
  fileContext: string;
  conversationHistory: ChatMessage[];
  onHistoryUpdate: (updated: ChatMessage[]) => void;
}

export default function FileChat({
  filename,
  fileContext,
  conversationHistory,
  onHistoryUpdate,
}: FileChatProps) {
  const [input, setInput] = useState("");
  const [chatState, setChatState] = useState<ChatState>({ status: "idle" });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isLoading = chatState.status === "loading";

  // Auto-scroll to bottom when history changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationHistory, chatState]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const updatedHistory = [...conversationHistory, userMessage];
    onHistoryUpdate(updatedHistory);
    setInput("");
    setChatState({ status: "loading" });

    try {
      const answer = await chatWithFile(trimmed, fileContext, conversationHistory);
      const assistantMessage: ChatMessage = { role: "assistant", content: answer };
      onHistoryUpdate([...updatedHistory, assistantMessage]);
      setChatState({ status: "idle" });
    } catch (err) {
      setChatState({
        status: "error",
        message: err instanceof Error ? err.message : "Chat request failed.",
      });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: "520px" }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(168,85,247,0.2)", background: "linear-gradient(90deg, rgba(168,85,247,0.08), rgba(99,102,241,0.05))" }}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neon-blue shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Chat with File</p>
          <p className="text-xs text-slate-500 truncate">{filename}</p>
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {conversationHistory.length === 0 && chatState.status !== "loading" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-sm text-slate-400">Ask a question about <span className="font-medium text-slate-300">{filename}</span></p>
          </div>
        )}

        {conversationHistory.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-sm"
                : "bg-white/10 text-slate-200 rounded-bl-sm border border-white/10"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Loading bubble */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        {/* Inline error */}
        {chatState.status === "error" && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm bg-red-500/10 border border-red-500/30 text-red-300">
              {chatState.message}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 px-4 py-3" style={{ borderTop: "1px solid rgba(168,85,247,0.15)", background: "rgba(168,85,247,0.04)" }}>
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask a question… (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ maxHeight: "120px", overflowY: "auto" }}
          />
          <NeonButton
            type="button"
            variant="primary"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
            className="shrink-0 px-3 py-2.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </NeonButton>
        </div>
        <p className="text-xs text-slate-500 mt-1.5">AI answers based on file content only</p>
      </div>
    </div>
  );
}

