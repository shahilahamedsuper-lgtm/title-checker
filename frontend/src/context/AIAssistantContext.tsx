import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { AnalysisResult, AssistantMessage } from "../types";
import { useAuth } from "./AuthContext";

// ---------------------------------------------------------------------------
// Context value interface
// ---------------------------------------------------------------------------

export interface AIAssistantContextValue {
  // File context (set by pages when a file is loaded)
  fileContext: string | null;
  filename: string | null;
  analysisResult: AnalysisResult | null;
  setFileContext: (text: string, filename: string) => void;
  clearFileContext: () => void;
  setAnalysisResult: (result: AnalysisResult) => void;

  // Conversation
  messages: AssistantMessage[];
  addMessage: (msg: AssistantMessage) => void;
  clearMessages: () => void;

  // Panel open/close state
  isOpen: boolean;
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
}

// ---------------------------------------------------------------------------
// Context + hook
// ---------------------------------------------------------------------------

const AIAssistantContext = createContext<AIAssistantContextValue | null>(null);

export function useAIAssistant(): AIAssistantContextValue {
  const ctx = useContext(AIAssistantContext);
  if (!ctx) throw new Error("useAIAssistant must be used within AIAssistantProvider");
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AIAssistantProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();

  const [fileContext, setFileContextState] = useState<string | null>(null);
  const [filename, setFilenameState] = useState<string | null>(null);
  const [analysisResult, setAnalysisResultState] = useState<AnalysisResult | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Clear conversation when the user logs out
  useEffect(() => {
    if (!token) {
      setMessages([]);
      setFileContextState(null);
      setFilenameState(null);
      setAnalysisResultState(null);
      setIsOpen(false);
    }
  }, [token]);

  const setFileContext = useCallback((text: string, name: string) => {
    setFileContextState(text);
    setFilenameState(name);
  }, []);

  const clearFileContext = useCallback(() => {
    setFileContextState(null);
    setFilenameState(null);
    setAnalysisResultState(null);
  }, []);

  const setAnalysisResult = useCallback((result: AnalysisResult) => {
    setAnalysisResultState(result);
  }, []);

  const addMessage = useCallback((msg: AssistantMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const togglePanel = useCallback(() => setIsOpen((v) => !v), []);
  const openPanel = useCallback(() => setIsOpen(true), []);
  const closePanel = useCallback(() => setIsOpen(false), []);

  return (
    <AIAssistantContext.Provider
      value={{
        fileContext,
        filename,
        analysisResult,
        setFileContext,
        clearFileContext,
        setAnalysisResult,
        messages,
        addMessage,
        clearMessages,
        isOpen,
        togglePanel,
        openPanel,
        closePanel,
      }}
    >
      {children}
    </AIAssistantContext.Provider>
  );
}
