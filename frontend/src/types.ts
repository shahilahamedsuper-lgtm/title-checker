export interface AnalysisResult {
  meaning: string;
  tone: string;
  clarity_score: number; // 0–100
  suggestions: string[]; // 1–5 items
}

export interface AnalyzeRequest {
  title: string;
  text: string;
}

export type PanelState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: AnalysisResult }
  | { status: "error"; message: string };

export interface UploadResult {
  extracted_text: string;
  filename: string;
  content_type: string;
}

export interface DeduplicationResult {
  original_text: string;
  deduplicated_text: string;
  duplicates_removed: number;
  file_type_category: "text" | "tabular";
}

export type UploaderState =
  | { status: "idle" }
  | { status: "dragging" }
  | { status: "uploading" }
  | { status: "success"; result: UploadResult }
  | { status: "error"; message: string };

export interface NumericStats {
  min: number;
  max: number;
  mean: number;
}

export interface ColumnStats {
  name: string;
  dtype: "numeric" | "text" | "date" | "boolean" | "mixed";
  missing_count: number;
  unique_count: number;
  numeric_stats?: NumericStats;
}

export interface ExcelAnalysisResult {
  headers: string[];
  rows: (string | number | boolean | null)[][];
  column_stats: ColumnStats[];
  duplicate_row_count: number;
  ai_summary: string | null;
}

export type ExcelAnalysisState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: ExcelAnalysisResult }
  | { status: "error"; message: string };

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type ChatState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string };

/** In-memory message representation used by the AI Assistant widget. */
export interface AssistantMessage {
  id: string;                              // crypto.randomUUID()
  role: "user" | "assistant" | "error";
  content: string;
  timestamp: number;                       // Date.now()
}
