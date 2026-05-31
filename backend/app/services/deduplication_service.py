from __future__ import annotations

import re
from typing import Literal

from app.models.schemas import DeduplicationResult


class UnsupportedContentTypeError(ValueError):
    """Raised when the content_type is not one of the five supported MIME types."""


EXCEL_MIME_TYPES = frozenset({
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
})

TEXT_MIME_TYPES = frozenset({
    "text/plain",
    "text/csv",
    "application/csv",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
})

SUPPORTED_MIME_TYPES = EXCEL_MIME_TYPES | TEXT_MIME_TYPES

# Matches leading numbering patterns:
#   "1. "  "12. "  "(3) "  "3) "  "III. "  "a) "  "A. "
_LEADING_NUMBER_RE = re.compile(
    r"^\s*(?:\d+[\.\)]\s*|[a-zA-Z]{1,4}[\.\)]\s*|\([^)]{1,4}\)\s*)"
)


def _strip_numbering(text: str) -> str:
    """Remove leading list numbering from a string, e.g. '1. Title' → 'Title'."""
    return _LEADING_NUMBER_RE.sub("", text).strip()


def _normalize(text: str) -> str:
    """
    Full normalisation for duplicate comparison:
    1. Strip leading numbering  (e.g. "1. ", "6. ", "(a) ")
    2. Collapse internal whitespace
    3. Lowercase
    """
    stripped = _strip_numbering(text)
    return re.sub(r"\s+", " ", stripped).lower().strip()


class DeduplicationService:

    def _deduplicate_lines(self, text: str) -> tuple[str, int]:
        """Deduplicate a newline-separated text file, one title per line."""
        lines = text.split("\n")
        seen: set[str] = set()
        kept: list[str] = []
        removed = 0

        for line in lines:
            key = _normalize(line)
            if key == "":
                # Preserve blank lines as-is
                kept.append(line)
            elif key in seen:
                removed += 1
            else:
                seen.add(key)
                kept.append(line)   # preserve original formatting

        return "\n".join(kept), removed

    def _deduplicate_rows(self, text: str) -> tuple[str, int]:
        """
        Deduplicate tab-separated rows (Excel extracted via extraction_service).
        Each line is one row; columns are separated by tabs.

        Strategy:
        - First non-empty line is the header — always kept.
        - Find the title column (header containing "title", "name", etc.).
        - If found, deduplicate on that column only (strips numbering).
        - If not found, deduplicate on all columns.
        - Original lines are preserved in the output.
        """
        rows = text.split("\n")
        seen: set[str] = set()
        kept: list[str] = []
        removed = 0
        header_done = False
        title_col_idx: int | None = None

        _TITLE_KEYWORDS = ("title", "name", "topic", "subject", "content", "heading", "label")

        for row in rows:
            cells = row.split("\t") if "\t" in row else [row]

            # ── Header row ────────────────────────────────────────────────────
            if not header_done and row.strip():
                kept.append(row)
                header_done = True
                # Detect title column
                for i, h in enumerate(cells):
                    if any(kw in h.lower() for kw in _TITLE_KEYWORDS):
                        title_col_idx = i
                        break
                continue

            # Fully empty row — preserve
            if all(_normalize(c) == "" for c in cells):
                kept.append(row)
                continue

            # Build comparison key
            if title_col_idx is not None and title_col_idx < len(cells):
                key = _normalize(cells[title_col_idx])
            else:
                key = "\x00".join(_normalize(c) for c in cells)

            if key in seen:
                removed += 1
            else:
                seen.add(key)
                kept.append(row)

        return "\n".join(kept), removed

    def deduplicate(self, text: str, content_type: str) -> DeduplicationResult:
        # Normalise the content type (strip charset params, lowercase)
        ct = (content_type or "").strip().lower().split(";")[0].strip()

        if ct not in SUPPORTED_MIME_TYPES:
            # Unknown / empty type — fall back gracefully
            if ct in ("application/vnd.ms-excel",
                      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"):
                ct = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            else:
                ct = "text/plain"

        if not text or not text.strip():
            category: Literal["text", "tabular"] = (
                "tabular" if ct in EXCEL_MIME_TYPES else "text"
            )
            return DeduplicationResult(
                original_text=text,
                deduplicated_text=text,
                duplicates_removed=0,
                file_type_category=category,
            )

        if ct in EXCEL_MIME_TYPES:
            deduplicated_text, duplicates_removed = self._deduplicate_rows(text)
            file_type_category: Literal["text", "tabular"] = "tabular"
        else:
            deduplicated_text, duplicates_removed = self._deduplicate_lines(text)
            file_type_category = "text"

        return DeduplicationResult(
            original_text=text,
            deduplicated_text=deduplicated_text,
            duplicates_removed=duplicates_removed,
            file_type_category=file_type_category,
        )


deduplication_service = DeduplicationService()
