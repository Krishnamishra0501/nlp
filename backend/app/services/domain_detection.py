import os
import json
from typing import Dict, Any, Optional, List
from backend.app.config import settings
from backend.app.services.document_processor import DocumentProcessor
from backend.app.models.domain_classifier import get_domain_classifier, DomainClassifier
from backend.app.schemas.domain_schema import (
    DomainPredictionResponse,
    TopPrediction,
    DomainConfirmationRequest,
    DomainConfirmationResponse,
    DomainListResponse,
    DomainInfo
)

class DomainDetectionService:
    """Service layer managing domain classification, file processing, and user domain confirmation."""
    
    def __init__(self):
        self.confirmed_domains_store: Dict[str, Dict[str, Any]] = {}
        with open(settings.DOMAIN_CONFIG_PATH, "r") as f:
            self.domain_config = json.load(f)
            
    def get_configured_domains(self) -> DomainListResponse:
        """Return full metadata of configured contract domains."""
        domain_list = [DomainInfo(**d) for d in self.domain_config["domains"]]
        return DomainListResponse(
            total_domains=len(domain_list),
            domains=domain_list
        )

    def detect_domain_from_text(
        self,
        text: str,
        use_baseline: bool = False,
        use_chunk_aggregation: bool = True
    ) -> DomainPredictionResponse:
        """Classify contract domain directly from text input."""
        classifier = get_domain_classifier()
        prediction = classifier.predict_contract(
            raw_text=text,
            use_chunk_aggregation=use_chunk_aggregation,
            top_k=3,
            use_baseline=use_baseline
        )

        top_preds = [TopPrediction(**p) for p in prediction["top_predictions"]]
        return DomainPredictionResponse(
            domain=prediction["primary_domain"],
            confidence=prediction["confidence"],
            top_predictions=top_preds,
            num_chunks_processed=prediction["num_chunks_processed"],
            model_used=prediction["model_used"],
            status="Domain detected successfully."
        )

    def detect_domain_from_file(
        self,
        filename: str,
        content: bytes,
        use_baseline: bool = False,
        use_chunk_aggregation: bool = True
    ) -> DomainPredictionResponse:
        """Extract text from file (.txt, .pdf, .docx) and run domain prediction."""
        raw_text, file_type = DocumentProcessor.process_file(filename, content)
        res = self.detect_domain_from_text(
            text=raw_text,
            use_baseline=use_baseline,
            use_chunk_aggregation=use_chunk_aggregation
        )
        return res

    def confirm_user_domain(self, request: DomainConfirmationRequest) -> DomainConfirmationResponse:
        """
        Record user's confirmed contract domain choice.
        The confirmed domain takes precedence over auto-prediction in the ContractGuard Risk Engine pipeline.
        """
        valid_domains = [d["name"] for d in self.domain_config["domains"]]
        if request.confirmed_domain not in valid_domains:
            raise ValueError(f"Domain '{request.confirmed_domain}' is not a valid domain. Valid domains: {valid_domains}")

        # Store confirmation
        self.confirmed_domains_store[request.contract_id] = {
            "contract_id": request.contract_id,
            "active_domain": request.confirmed_domain,
            "notes": request.notes,
            "is_override": True
        }

        return DomainConfirmationResponse(
            status="Domain confirmed successfully and locked for ContractGuard Risk Engine.",
            contract_id=request.contract_id,
            active_domain=request.confirmed_domain,
            is_override=True
        )

    def verify_user_claimed_domain(
        self,
        text: str,
        claimed_domain: str,
        use_baseline: bool = False
    ) -> Dict[str, Any]:
        """
        Verify if the user's claimed domain matches the AI model's contract classification.
        Compares claimed domain probability against top predictions and generates verification feedback.
        """
        valid_domains = [d["name"] for d in self.domain_config["domains"]]
        if claimed_domain not in valid_domains:
            raise ValueError(f"Claimed domain '{claimed_domain}' is not valid. Choose from: {valid_domains}")

        classifier = get_domain_classifier()
        prediction = classifier.predict_contract(
            raw_text=text,
            use_chunk_aggregation=True,
            top_k=11, # Fetch all 11 probabilities to find claimed domain score
            use_baseline=use_baseline
        )

        primary_domain = prediction["primary_domain"]
        confidence = prediction["confidence"]
        top_preds = prediction["top_predictions"]

        # Find claimed domain probability score
        claimed_prob = 0.0
        for p in top_preds:
            if p["domain"] == claimed_domain:
                claimed_prob = p["probability"]
                break

        # Verification Logic
        if claimed_domain == primary_domain:
            match_status = "MATCH"
            is_verified = True
            message = f"✓ Verified! The AI model agrees this contract belongs to the '{claimed_domain}' domain ({int(claimed_prob*100)}% confidence)."
        elif claimed_prob >= 0.15:
            match_status = "PARTIAL_MATCH"
            is_verified = True
            message = f"⚡ Secondary Match: You selected '{claimed_domain}' ({int(claimed_prob*100)}%), but AI primary prediction is '{primary_domain}' ({int(confidence*100)}%)."
        else:
            match_status = "MISMATCH"
            is_verified = False
            message = f"⚠️ Domain Mismatch Warning: You selected '{claimed_domain}' ({int(claimed_prob*100)}%), but AI strongly identifies this contract as '{primary_domain}' ({int(confidence*100)}%)."

        return {
            "claimed_domain": claimed_domain,
            "is_verified": is_verified,
            "match_status": match_status,
            "message": message,
            "primary_domain": primary_domain,
            "claimed_domain_probability": round(claimed_prob, 4),
            "confidence": round(confidence, 4),
            "top_predictions": top_preds[:3] # Return top 3 for presentation
        }

# Global service instance
domain_service = DomainDetectionService()
