import io
import math
from typing import Any, Literal

import pandas as pd

from app.models.schemas import ColumnStats, ExcelAnalysisResult, NumericStats

EXCEL_MIME_TYPES = frozenset({
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
})
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


class ExcelParseError(Exception):
    """Raised when the Excel file cannot be parsed."""


class FileTooLargeError(ValueError):
    """Raised when the file exceeds MAX_FILE_SIZE."""


class UnsupportedExcelTypeError(ValueError):
    """Raised when the MIME type is not an Excel type."""


class ExcelAnalysisService:

    @staticmethod
    def _normalize_headers(df: pd.DataFrame) -> pd.DataFrame:
        """Rename columns matching 'Unnamed: N' pattern to 'Column_{N+1}' (1-based)."""
        new_columns = {}
        for col in df.columns:
            if isinstance(col, str) and col.startswith("Unnamed: "):
                try:
                    n = int(col.split("Unnamed: ", 1)[1])
                    new_columns[col] = f"Column_{n + 1}"
                except ValueError:
                    pass
        if new_columns:
            df = df.rename(columns=new_columns)
        return df

    @staticmethod
    def _infer_dtype(series: pd.Series) -> Literal["numeric", "text", "date", "boolean", "mixed"]:
        """Infer the logical dtype of a pandas Series."""
        if pd.api.types.is_bool_dtype(series):
            return "boolean"
        if pd.api.types.is_numeric_dtype(series):
            return "numeric"
        if pd.api.types.is_datetime64_any_dtype(series):
            return "date"
        non_null = series.dropna()
        if len(non_null) == 0 or all(isinstance(v, str) for v in non_null):
            return "text"
        return "mixed"

    @staticmethod
    def _compute_stats(df: pd.DataFrame) -> list[ColumnStats]:
        """Compute per-column statistics for the DataFrame."""
        stats = []
        for col in df.columns:
            series = df[col]
            dtype = ExcelAnalysisService._infer_dtype(series)
            missing_count = int(series.isna().sum())
            unique_count = int(series.dropna().nunique())

            numeric_stats = None
            if dtype == "numeric":
                non_null = series.dropna()
                if len(non_null) > 0:
                    numeric_stats = NumericStats(
                        min=round(float(non_null.min()), 2),
                        max=round(float(non_null.max()), 2),
                        mean=round(float(non_null.mean()), 2),
                    )

            stats.append(ColumnStats(
                name=str(col),
                dtype=dtype,
                missing_count=missing_count,
                unique_count=unique_count,
                numeric_stats=numeric_stats,
            ))
        return stats

    @staticmethod
    def _build_ai_prompt(df: pd.DataFrame, stats: list[ColumnStats]) -> str:
        """Build a prompt for the AI to summarize the dataset."""
        col_summary_lines = []
        for s in stats:
            line = (
                f"  - {s.name}: dtype={s.dtype}, missing={s.missing_count}, unique={s.unique_count}"
            )
            if s.numeric_stats:
                ns = s.numeric_stats
                line += f", min={ns.min}, max={ns.max}, mean={ns.mean}"
            col_summary_lines.append(line)
        col_summary = "\n".join(col_summary_lines)

        preview = df.head(20).to_string(index=False)

        prompt = (
            f"You are a data analyst. Below is a summary of an Excel dataset.\n\n"
            f"Columns ({len(stats)}):\n{col_summary}\n\n"
            f"First {min(len(df), 20)} rows:\n{preview}\n\n"
            "Please write a single narrative paragraph summarizing the key patterns, "
            "notable statistics, and any interesting insights from this dataset."
        )
        return prompt

    @staticmethod
    def _parse(data: bytes) -> pd.DataFrame:
        """Parse Excel bytes into a DataFrame using the first sheet."""
        try:
            df = pd.read_excel(io.BytesIO(data), sheet_name=0)
        except Exception as exc:
            raise ExcelParseError(
                "Could not parse the Excel file. Ensure it is a valid .xlsx or .xls file."
            ) from exc
        return ExcelAnalysisService._normalize_headers(df)

    async def analyze(
        self,
        filename: str,
        content_type: str,
        data: bytes,
    ) -> ExcelAnalysisResult:
        """
        Parse the Excel file, compute statistics, call AI for summary.
        Raises UnsupportedExcelTypeError if content_type not in EXCEL_MIME_TYPES.
        Raises FileTooLargeError if len(data) > MAX_FILE_SIZE.
        Raises ExcelParseError on corrupt/unsupported files.
        AI errors are caught and ai_summary is set to None (graceful degradation).
        """
        if content_type not in EXCEL_MIME_TYPES:
            raise UnsupportedExcelTypeError(
                "Only Excel files (.xlsx, .xls) are supported."
            )
        if len(data) > MAX_FILE_SIZE:
            raise FileTooLargeError("File exceeds the 10 MB size limit.")

        df = self._parse(data)
        stats = self._compute_stats(df)
        duplicate_row_count = int(df.duplicated().sum())
        headers = [str(c) for c in df.columns.tolist()]

        def _safe_value(v: Any) -> Any:
            if v is None:
                return None
            try:
                if isinstance(v, float) and math.isnan(v):
                    return None
            except TypeError:
                pass
            try:
                # Handle pandas NaT
                if pd.isna(v):
                    return None
            except (TypeError, ValueError):
                pass
            return v

        rows = [
            [_safe_value(cell) for cell in row]
            for row in df.itertuples(index=False, name=None)
        ]

        ai_summary: str | None = None
        try:
            from app.services.anthropic_client import call_anthropic
            prompt = self._build_ai_prompt(df, stats)
            ai_summary = await call_anthropic(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
            )
        except Exception:
            ai_summary = None

        return ExcelAnalysisResult(
            headers=headers,
            rows=rows,
            column_stats=stats,
            duplicate_row_count=duplicate_row_count,
            ai_summary=ai_summary,
        )


excel_analysis_service = ExcelAnalysisService()
