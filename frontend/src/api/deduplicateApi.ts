import { apiClient, extractError } from "./client";
import type { DeduplicationResult } from "../types";

export async function deduplicateText(
  text: string,
  contentType: string
): Promise<DeduplicationResult> {
  try {
    const response = await apiClient.post<DeduplicationResult>("/api/deduplicate", {
      text,
      content_type: contentType,
    });
    return response.data;
  } catch (error) {
    throw new Error(extractError(error, "Deduplication failed."));
  }
}
