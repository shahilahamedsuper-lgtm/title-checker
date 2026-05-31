import { apiClient, extractError } from "./client";

export interface ExcelDedupResult {
  originalRows: number;
  duplicatesRemoved: number;
  cleanedFileUrl: string;
  cleanedFilename: string;
}

/**
 * Upload an Excel file to /api/deduplicate-excel.
 * Returns the cleaned file as a Blob plus stats from response headers.
 */
export async function deduplicateExcelFile(
  file: File,
  onProgress?: (pct: number) => void
): Promise<ExcelDedupResult> {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await apiClient.post("/api/deduplicate-excel", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      responseType: "blob",
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      },
    });

    const originalRows = parseInt(response.headers["x-original-rows"] ?? "0", 10);
    const duplicatesRemoved = parseInt(response.headers["x-duplicates-removed"] ?? "0", 10);

    // Extract filename from Content-Disposition header
    const disposition = (response.headers["content-disposition"] as string) ?? "";
    const match = disposition.match(/filename="([^"]+)"/);
    const cleanedFilename = match?.[1] ?? `cleaned_${file.name}`;

    // Create a download URL from the blob
    const blob = response.data as Blob;
    const cleanedFileUrl = URL.createObjectURL(blob);

    return { originalRows, duplicatesRemoved, cleanedFileUrl, cleanedFilename };
  } catch (error) {
    throw new Error(extractError(error, "Excel deduplication failed."));
  }
}
