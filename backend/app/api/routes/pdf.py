from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from app.services.pdf import extract_pdf_content
from app.schemas.document import ExtractedPDFData
from app.core.config import settings

router = APIRouter()

@router.post("/extract", response_model=ExtractedPDFData)
async def extract_pdf_data(file: UploadFile = File(...)):
    """
    Extract content from PDF
    
    This endpoint extracts text content from a PDF file.
    """
    # Check file size
    file_size = 0
    content = await file.read()
    file_size = len(content)
    await file.seek(0)  # Reset file position
    
    if file_size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE / 1024 / 1024} MB",
        )
    
    # Check file type
    if not file.content_type.startswith("application/pdf"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only PDF files are supported",
        )
    
    # Extract PDF content
    try:
        return await extract_pdf_content(file)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to process PDF: {str(e)}",
        ) 