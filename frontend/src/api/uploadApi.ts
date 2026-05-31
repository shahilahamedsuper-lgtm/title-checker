import { apiClient, extractError } from "./client";
import type { UploadResult } from "../types";

export async function uploadFile(
  file: File,
  onProgress?: (pct: number) => void
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await apiClient.post<UploadResult>("/api/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(extractError(error, "Upload failed."));
  }
}
