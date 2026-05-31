from __future__ import annotations
import io
from pathlib import Path


class FileGenerationError(Exception):
    """Raised when a file builder fails."""


class UnsupportedContentTypeError(ValueError):
    """Raised when content_type is not in the supported set."""


SUPPORTED_MIME_TYPES = frozenset({
    "text/plain",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
})


class FileGeneratorService:
    def generate(
        self, text: str, content_type: str, original_filename: str
    ) -> tuple[bytes, str, str]:
        """Returns (file_bytes, media_type, cleaned_filename).

        Raises UnsupportedContentTypeError for unknown MIME types.
        Raises FileGenerationError on builder failure.
        """
        if content_type not in SUPPORTED_MIME_TYPES:
            raise UnsupportedContentTypeError(
                f"Unsupported content type: {content_type!r}"
            )

        stem = Path(original_filename).stem
        suffix = Path(original_filename).suffix

        try:
            if content_type == "text/plain":
                file_bytes = self._build_txt(text)
                media_type = "text/plain; charset=utf-8"
                cleaned_filename = f"cleaned_{original_filename}"

            elif content_type == "application/pdf":
                file_bytes = self._build_txt(text)
                media_type = "text/plain; charset=utf-8"
                cleaned_filename = f"cleaned_{stem}.txt"

            elif content_type == (
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ):
                file_bytes = self._build_docx(text)
                media_type = (
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                )
                cleaned_filename = f"cleaned_{original_filename}"

            else:  # xlsx / xls
                file_bytes = self._build_xlsx(text)
                media_type = (
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                )
                cleaned_filename = f"cleaned_{original_filename}"

        except (UnsupportedContentTypeError, FileGenerationError):
            raise
        except Exception as exc:
            raise FileGenerationError(
                f"Failed to generate file for content type {content_type!r}: {exc}"
            ) from exc

        return file_bytes, media_type, cleaned_filename

    def _build_txt(self, text: str) -> bytes:
        return text.encode("utf-8")

    def _build_docx(self, text: str) -> bytes:
        from docx import Document

        doc = Document()
        for line in text.splitlines():
            if line:
                doc.add_paragraph(line)
        buf = io.BytesIO()
        doc.save(buf)
        return buf.getvalue()

    def _build_xlsx(self, text: str) -> bytes:
        """
        Rebuild an Excel file from the tab-separated row format produced by
        extraction_service._extract_excel().

        Each line = one row; columns are separated by tab characters.
        If a line has no tabs (plain text file), it goes into column A.
        """
        from openpyxl import Workbook

        wb = Workbook()
        ws = wb.active
        for line in text.splitlines():
            if not line.strip():
                continue
            if "\t" in line:
                # Multi-column row — split on tab and write each cell separately
                ws.append(line.split("\t"))
            else:
                # Single-column content (TXT file deduplication result)
                ws.append([line])
        buf = io.BytesIO()
        wb.save(buf)
        return buf.getvalue()


file_generator_service = FileGeneratorService()
