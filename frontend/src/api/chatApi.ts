import { apiClient, extractError } from "./client";
import type { ChatMessage } from "../types";
import axios from "axios";

export async function chatWithFile(
  message: string,
  fileContext: string,
  conversationHistory: ChatMessage[]
): Promise<string> {
  try {
    const response = await apiClient.post<{ answer: string }>("/api/chat", {
      message,
      file_context: fileContext,
      conversation_history: conversationHistory,
    });
    return response.data.answer;
  } catch (error) {
    throw new Error(extractError(error, "Chat request failed."));
  }
}

/**
 * Send a message to the AI assistant widget endpoint.
 * Supports both general-purpose mode (no fileContext) and file-aware mode.
 * Maps specific HTTP status codes to user-friendly error messages.
 */
export async function chatWithAssistant(
  message: string,
  fileContext: string | null,
  conversationHistory: ChatMessage[]
): Promise<string> {
  try {
    const response = await apiClient.post<{ answer: string }>("/api/assistant/chat", {
      message,
      file_context: fileContext ?? undefined,
      conversation_history: conversationHistory,
    });
    return response.data.answer;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (!error.response) {
        throw new Error("Network error. Please check your connection.");
      }
      const status = error.response.status;
      if (status === 504) throw new Error("The AI took too long to respond. Please try again.");
      if (status === 502) throw new Error("The AI service is temporarily unavailable. Please try again.");
    }
    throw new Error("Something went wrong. Please try again.");
  }
}
