import { apiClient, extractError } from "./client";

export interface SimilarityMatch {
  title: string;
  score: number;
}

export interface SimilarityResult {
  query: string;
  score: number;
  status: "Unique" | "Similar" | "Duplicate";
  matches: SimilarityMatch[];
}

export interface SimilarityHistoryEntry {
  query: string;
  score: number;
  status: string;
  checked_at: string;
}

export async function checkTitleSimilarity(
  title: string,
  top_n = 5
): Promise<SimilarityResult> {
  try {
    const res = await apiClient.post<SimilarityResult>("/api/check-title-similarity", {
      title,
      top_n,
    });
    return res.data;
  } catch (e) {
    throw new Error(extractError(e, "Similarity check failed."));
  }
}

export async function fetchSimilarityHistory(limit = 10): Promise<SimilarityHistoryEntry[]> {
  try {
    const res = await apiClient.get<SimilarityHistoryEntry[]>("/api/similarity-history", {
      params: { limit },
    });
    return res.data;
  } catch (e) {
    throw new Error(extractError(e, "Failed to fetch similarity history."));
  }
}

export async function addTitleToCorpus(title: string): Promise<void> {
  try {
    await apiClient.post("/api/add-title", { title });
  } catch {
    // Non-critical — silently ignore
  }
}
