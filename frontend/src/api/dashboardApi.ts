import { apiClient, extractError } from "./client";

export interface DashboardStats {
  total_rows: number;
  total_columns: number;
  missing_values: number;
  duplicate_rows: number;
  files_analyzed: number;
  last_updated: string;
}

export interface HistoryEntry {
  id: string;
  filename: string;
  uploaded_at: string;
  size_bytes: number;
  status: "analyzed" | "pending" | "failed";
  operation: "upload" | "analyze" | "deduplicate" | "excel";
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const res = await apiClient.get<DashboardStats>("/api/dashboard-stats");
    return res.data;
  } catch (e) {
    throw new Error(extractError(e, "Failed to fetch dashboard stats."));
  }
}

export async function fetchHistory(): Promise<HistoryEntry[]> {
  try {
    const res = await apiClient.get<HistoryEntry[]>("/api/history");
    return res.data;
  } catch (e) {
    throw new Error(extractError(e, "Failed to fetch history."));
  }
}
