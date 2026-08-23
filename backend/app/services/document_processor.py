import io
import os
import re
import fitz  # PyMuPDF
import docx
from typing import Tuple

class DocumentProcessor:
    """Extracts raw text from uploaded files (TXT, PDF, DOCX) and normalizes formatting."""

    @staticmethod
    def extract_text_from_txt(file_content: bytes) -> str:
        """Extract text from raw TXT bytes with UTF-8 encoding handling."""
        try:
            return file_content.decode("utf-8")
        except UnicodeDecodeError:
            return file_content.decode("latin-1", errors="ignore")

    @staticmethod
    def extract_text_from_pdf(file_content: bytes) -> str:
        """Extract text from PDF file bytes using PyMuPDF."""
        doc = fitz.open(stream=file_content, filetype="pdf")
        text_pages = []
        for page in doc:
            page_text = page.get_text("text")
            if page_text:
                text_pages.append(page_text)
        return "\n\n".join(text_pages)

    @staticmethod
    def extract_text_from_docx(file_content: bytes) -> str:
        """Extract text from DOCX file bytes using python-docx."""
        doc_stream = io.BytesIO(file_content)
        doc = docx.Document(doc_stream)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n\n".join(paragraphs)

    @classmethod
    def process_file(cls, filename: str, content: bytes) -> Tuple[str, str]:
        """
        Process file based on extension and return (extracted_text, file_type).
        """
        ext = os.path.splitext(filename)[1].lower()
        if ext == ".txt":
            raw_text = cls.extract_text_from_txt(content)
            file_type = "TXT"
        elif ext == ".pdf":
            raw_text = cls.extract_text_from_pdf(content)
            file_type = "PDF"
        elif ext in [".docx", ".doc"]:
            raw_text = cls.extract_text_from_docx(content)
            file_type = "DOCX"
        else:
            raise ValueError(f"Unsupported file format '{ext}'. Supported formats: .txt, .pdf, .docx")

        if not raw_text or not raw_text.strip():
            raise ValueError("The provided file contains no extractable text.")

        return raw_text.strip(), file_type
