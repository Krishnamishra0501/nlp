from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from typing import Optional

from backend.app.services.document_processor import DocumentProcessor
from backend.app.services.risk_classifier import RiskClassifier
from backend.app.services.risk_scoring import RiskScorer


router = APIRouter()

risk_classifier = RiskClassifier()
risk_scorer = RiskScorer()


def split_sentences(text: str):
    sentences = []

    for part in text.replace("\n", " ").split("."):
        sentence = part.strip()

        if sentence:
            sentences.append(sentence + ".")

    return sentences


@router.post(
    "/analyze-risk",
    summary="Analyze contractual risks"
)
async def analyze_risk(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None)
):
    try:

        if file is not None and file.filename:

            content = await file.read()

            raw_text, metadata = DocumentProcessor.process_file(
                file.filename,
                content
            )

        elif text and text.strip():

            raw_text = text.strip()
            metadata = {}

        else:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Must provide either an uploaded file "
                    "(.txt, .pdf, .docx) or raw contract text."
                )
            )

        sentences = split_sentences(raw_text)

        risks = risk_classifier.classify_sentences(
            sentences
        )

        score = risk_scorer.calculate_score(
            risks
        )

        return {
            "status": "success",
            "sentences_processed": len(sentences),
            "risks": risks,
            "risk_count": len(risks),
            "risk_score": score["risk_score"],
            "risk_level": score["risk_level"],
            "risk_contributions": score["risk_contributions"],
            "device": risk_classifier.device,
            "metadata": metadata
        }

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Risk analysis error: {str(e)}"
        )