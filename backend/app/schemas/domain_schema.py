from pydantic import BaseModel, Field
from typing import List, Optional

class TopPrediction(BaseModel):
    domain: str = Field(..., description="Name of predicted contract domain")
    probability: float = Field(..., description="Estimated probability score (0.0 to 1.0)")

class DomainPredictionResponse(BaseModel):
    domain: str = Field(..., description="Primary predicted contract domain")
    confidence: float = Field(..., description="Confidence score of primary prediction")
    top_predictions: List[TopPrediction] = Field(..., description="Top N predicted domains with probabilities")
    num_chunks_processed: Optional[int] = Field(default=1, description="Number of text chunks aggregated")
    model_used: Optional[str] = Field(default="RoBERTa", description="Classifier model used for prediction")
    status: str = Field(default="Domain detected successfully.", description="Status message")

class TextDomainDetectionRequest(BaseModel):
    text: str = Field(..., description="Raw or cleaned contract text to classify")
    use_baseline: Optional[bool] = Field(default=False, description="Whether to use TF-IDF baseline model")
    use_chunk_aggregation: Optional[bool] = Field(default=True, description="Whether to use section chunking strategy")

class DomainConfirmationRequest(BaseModel):
    contract_id: str = Field(..., description="Unique contract identifier")
    confirmed_domain: str = Field(..., description="User confirmed or manually selected domain")
    notes: Optional[str] = Field(default=None, description="Optional user reason or feedback for domain selection")

class DomainConfirmationResponse(BaseModel):
    status: str = Field(..., description="Confirmation status message")
    contract_id: str = Field(..., description="Contract ID")
    active_domain: str = Field(..., description="Final active domain to be passed to ContractGuard Risk Engine")
    is_override: bool = Field(..., description="True if user overrode automatic prediction")

class DomainVerificationResponse(BaseModel):
    claimed_domain: str = Field(..., description="Domain selected by the user")
    is_verified: bool = Field(..., description="True if AI model verifies/agrees with user selection")
    match_status: str = Field(..., description="MATCH, PARTIAL_MATCH, or MISMATCH")
    message: str = Field(..., description="Verification explanation message")
    primary_domain: str = Field(..., description="Top AI predicted domain")
    claimed_domain_probability: float = Field(..., description="AI estimated probability for user claimed domain")
    confidence: float = Field(..., description="Confidence score of top AI prediction")
    top_predictions: List[TopPrediction] = Field(..., description="Top predicted domains with probabilities")

class DomainInfo(BaseModel):
    id: str
    name: str
    description: str
    keywords: List[str]

class DomainListResponse(BaseModel):
    total_domains: int
    domains: List[DomainInfo]
