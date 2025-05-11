import os
import tempfile
from typing import List
from fastapi import UploadFile
import pypdf
from app.schemas.document import ExtractedPDFData, PageContent
# Add OCR imports
import pdfplumber
try:
    import pytesseract
except ImportError:
    pytesseract = None
import logging
logger = logging.getLogger(__name__)

async def extract_pdf_content(file: UploadFile) -> ExtractedPDFData:
    """
    Extract text content from PDF file
    
    Args:
        file: Uploaded PDF file
        
    Returns:
        ExtractedPDFData containing page contents and metadata
    """
    # Create a temporary file to store the uploaded PDF
    with tempfile.NamedTemporaryFile(delete=False) as temp_file:
        # Read and write file content
        content = await file.read()
        temp_file.write(content)
        temp_file_path = temp_file.name
    
    try:
        # Process the PDF file
        extracted_text = ""
        page_contents: List[PageContent] = []
        
        # Open PDF with pypdf
        with open(temp_file_path, "rb") as pdf_file:
            pdf_reader = pypdf.PdfReader(pdf_file)
            total_pages = len(pdf_reader.pages)
            
            # Extract text from each page
            for i, page in enumerate(pdf_reader.pages):
                page_text = page.extract_text()
                used_ocr = False
                # If no text, try OCR
                if not page_text:
                    try:
                        with pdfplumber.open(temp_file_path) as plumber_pdf:
                            plumber_page = plumber_pdf.pages[i]
                            if pytesseract:
                                ocr_text = pytesseract.image_to_string(plumber_page.to_image().original)
                                if ocr_text.strip():
                                    page_text = ocr_text
                                    used_ocr = True
                                    logger.warning(f"OCR used for page {i+1} of {file.filename}")
                            else:
                                logger.warning("pytesseract not installed, cannot OCR scanned PDFs.")
                    except Exception as e:
                        logger.warning(f"OCR failed for page {i+1} of {file.filename}: {e}")
                if not page_text:
                    logger.warning(f"No text extracted from page {i+1} of {file.filename}")
                else:
                    extracted_text += f"\n--- Page {i+1} ---\n{page_text}"
                    
                    # Get page title (first line of the page)
                    title = None
                    if page_text:
                        lines = page_text.split('\n')
                        if lines and lines[0].strip():
                            title = lines[0].strip()
                    
                    # Create page content object
                    page_contents.append(
                        PageContent(
                            page_number=i+1,
                            text=page_text or "",
                            title=title,
                        )
                    )
        
        return ExtractedPDFData(
            total_pages=total_pages,
            extracted_text=extracted_text,
            page_contents=page_contents,
        )
    
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

def extract_text_from_page(document_path: str, page_number: int) -> str:
    """
    Extract text from a specific page of a PDF document
    
    Args:
        document_path: Path to the PDF file
        page_number: 1-indexed page number
        
    Returns:
        Text content of the specified page
    """
    with open(document_path, "rb") as pdf_file:
        pdf_reader = pypdf.PdfReader(pdf_file)
        
        # Check if page number is valid
        if page_number <= 0 or page_number > len(pdf_reader.pages):
            return ""
        
        # Extract text from the specified page (0-indexed in pypdf)
        page = pdf_reader.pages[page_number - 1]
        return page.extract_text() or "" 