import { apiClient, extractError } from "./client";
import type { ExcelAnalysisResult } from "../types";

export async function analyzeExcel(file: File): Promise<ExcelAnalysisResult> {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const response = await apiClient.post<ExcelAnalysisResult>(
      "/api/analyze-excel",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  } catch (error) {
    throw new Error(extractError(error, "Excel analysis failed."));
  }
}
