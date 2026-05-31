import axios from "axios";
import type { AnalysisResult } from "../types";

export async function analyzeText(title: string, text: string): Promise<AnalysisResult> {
  try {
    const response = await axios.post<AnalysisResult>("/api/analyze", { title, text });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (!error.response) {
        throw new Error("Service unavailable. Please check your connection and try again.");
      }
      throw new Error(
        (error.response.data as { detail?: string })?.detail ||
          "An unexpected error occurred."
      );
    }
    throw error;
  }
}
