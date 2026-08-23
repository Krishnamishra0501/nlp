from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends
from typing import Optional
import json

from backend.app.schemas.domain_schema import (
    DomainPredictionResponse,
    TextDomainDetectionRequest,
    DomainConfirmationRequest,
    DomainConfirmationResponse,
    DomainVerificationResponse,
    DomainListResponse
)
from backend.app.services.domain_detection import domain_service

router = APIRouter()

@router.get("/domains", response_model=DomainListResponse, summary="Get all configured contract domains")
def get_domains():
    """Returns the list of 11 supported legal contract domains with metadata and keywords."""
    return domain_service.get_configured_domains()

@router.post("/detect-domain", response_model=DomainPredictionResponse, summary="Detect contract domain from text or file upload")
async def detect_domain(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    use_baseline: bool = Form(False),
    use_chunk_aggregation: bool = Form(True)
):
    """
    Detect contract domain given an uploaded file (.txt, .pdf, .docx) or raw contract text.
    Returns primary domain prediction, confidence score, and top 3 predicted domain probabilities.
    """
    try:
        if file is not None and file.filename:
            content = await file.read()
            return domain_service.detect_domain_from_file(
                filename=file.filename,
                content=content,
                use_baseline=use_baseline,
                use_chunk_aggregation=use_chunk_aggregation
            )
        elif text and text.strip():
            return domain_service.detect_domain_from_text(
                text=text,
                use_baseline=use_baseline,
                use_chunk_aggregation=use_chunk_aggregation
            )
        else:
            raise HTTPException(
                status_code=400,
                detail="Must provide either an uploaded file (.txt, .pdf, .docx) or raw contract text."
            )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal domain detection error: {str(e)}")

@router.post("/detect-domain/json", response_model=DomainPredictionResponse, summary="Detect contract domain from JSON payload")
def detect_domain_json(request: TextDomainDetectionRequest):
    """JSON endpoint for detecting contract domain from text payload."""
    try:
        return domain_service.detect_domain_from_text(
            text=request.text,
            use_baseline=request.use_baseline,
            use_chunk_aggregation=request.use_chunk_aggregation
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal domain detection error: {str(e)}")

@router.post("/confirm-domain", response_model=DomainConfirmationResponse, summary="Confirm or override detected domain")
def confirm_domain(request: DomainConfirmationRequest):
    """
    Allows user/frontend to confirm or override the predicted contract domain.
    The confirmed domain is locked and takes priority in downstream ContractGuard Risk Analysis modules.
    """
    try:
        return domain_service.confirm_user_domain(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/verify-domain", response_model=DomainVerificationResponse, summary="Verify user-selected contract domain with AI model")
async def verify_domain(
    claimed_domain: str = Form(..., description="Legal domain claimed by user"),
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    use_baseline: bool = Form(False)
):
    """
    User-guided Verification Mode: Allows the user to select their claimed domain and upload a contract document.
    The AI model verifies if the selected domain is MATCH, PARTIAL_MATCH, or MISMATCH, returning detailed reasoning.
    """
    try:
        if file is not None and file.filename:
            content = await file.read()
            raw_text, _ = domain_service.detect_domain_from_file(file.filename, content)
            # extract text from file
            from backend.app.services.document_processor import DocumentProcessor
            raw_text, _ = DocumentProcessor.process_file(file.filename, content)
        elif text and text.strip():
            raw_text = text.strip()
        else:
            raise HTTPException(
                status_code=400,
                detail="Must provide either an uploaded file (.txt, .pdf, .docx) or raw contract text."
            )

        res = domain_service.verify_user_claimed_domain(
            text=raw_text,
            claimed_domain=claimed_domain,
            use_baseline=use_baseline
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Domain verification error: {str(e)}")
