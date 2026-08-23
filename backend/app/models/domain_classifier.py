import os
import json
import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import joblib
import numpy as np
from typing import List, Dict, Any, Optional

from backend.app.config import settings
from training.preprocessing import clean_contract_text, chunk_contract_text, DomainLabelEncoder

class DomainClassifier:
    """
    Inference Engine for Contract Domain Classification.
    Supports fine-tuned RoBERTa with section/chunk aggregation as well as TF-IDF Baseline.
    """
    def __init__(self, model_path: Optional[str] = None):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.label_encoder = DomainLabelEncoder(settings.DOMAIN_CONFIG_PATH)
        
        # RoBERTa Model setup
        self.roberta_model_path = model_path or settings.ROBERTA_MODEL_PATH
        self.tokenizer = None
        self.model = None
        
        # Baseline setup
        self.baseline_path = settings.BASELINE_MODEL_PATH
        self.baseline_data = None
        
        self.load_models()

    def load_models(self):
        """Load fine-tuned RoBERTa transformer and baseline TF-IDF model."""
        # 1. Load RoBERTa
        if os.path.exists(self.roberta_model_path):
            try:
                print(f"[DomainClassifier] Loading fine-tuned RoBERTa model from {self.roberta_model_path}...")
                self.tokenizer = AutoTokenizer.from_pretrained(self.roberta_model_path)
                self.model = AutoModelForSequenceClassification.from_pretrained(self.roberta_model_path)
                self.model.to(self.device)
                self.model.eval()
                print("[DomainClassifier] RoBERTa model loaded successfully.")
            except Exception as e:
                print(f"[DomainClassifier] Warning: Could not load RoBERTa model: {e}")

        # 2. Load Baseline
        if os.path.exists(self.baseline_path):
            try:
                print(f"[DomainClassifier] Loading baseline model from {self.baseline_path}...")
                self.baseline_data = joblib.load(self.baseline_path)
                print("[DomainClassifier] Baseline model loaded successfully.")
            except Exception as e:
                print(f"[DomainClassifier] Warning: Could not load baseline model: {e}")

    def predict_contract(
        self,
        raw_text: str,
        use_chunk_aggregation: bool = True,
        top_k: int = 3,
        use_baseline: bool = False
    ) -> Dict[str, Any]:
        """
        Classify contract text and return structured prediction output.
        
        Args:
            raw_text: Raw or extracted text of the legal contract.
            use_chunk_aggregation: If True, uses section/paragraph chunking strategy.
            top_k: Number of top alternative predicted domains to return.
            use_baseline: If True, uses TF-IDF + LogReg baseline model instead of RoBERTa.
            
        Returns:
            Dict containing primary_domain, confidence score, top_predictions list, and chunk count.
        """
        cleaned_text = clean_contract_text(raw_text)
        if not cleaned_text:
            raise ValueError("Contract text is empty or invalid after preprocessing.")

        # Baseline inference branch
        if use_baseline or self.model is None:
            if self.baseline_data is None:
                raise RuntimeError("No trained model available (both RoBERTa and Baseline are missing).")
            return self._predict_baseline(cleaned_text, top_k=top_k)

        # Transformer inference branch
        if use_chunk_aggregation:
            chunks = chunk_contract_text(cleaned_text, max_words_per_chunk=200, overlap_words=40)
        else:
            # Truncated single chunk mode (first part of document)
            chunks = [cleaned_text[:1200]]

        if not chunks:
            chunks = [cleaned_text]

        chunk_logits_list = []

        with torch.no_grad():
            for chunk in chunks:
                inputs = self.tokenizer(
                    chunk,
                    truncation=True,
                    max_length=256,
                    padding="max_length",
                    return_tensors="pt"
                ).to(self.device)

                outputs = self.model(**inputs)
                logits = outputs.logits.squeeze(0).cpu() # [num_classes]
                chunk_logits_list.append(logits)

        # Aggregate logits across chunks via mean pooling
        stacked_logits = torch.stack(chunk_logits_list, dim=0) # [num_chunks, num_classes]
        avg_logits = torch.mean(stacked_logits, dim=0) # [num_classes]
        
        # Softmax to get probability distribution
        probabilities = F.softmax(avg_logits, dim=-1).numpy()

        # Extract top k predictions
        top_indices = np.argsort(probabilities)[::-1][:top_k]
        
        primary_idx = top_indices[0]
        primary_domain = self.label_encoder.decode(primary_idx)
        confidence = float(probabilities[primary_idx])

        top_predictions = []
        for idx in top_indices:
            top_predictions.append({
                "domain": self.label_encoder.decode(idx),
                "probability": round(float(probabilities[idx]), 4)
            })

        return {
            "primary_domain": primary_domain,
            "confidence": round(confidence, 4),
            "top_predictions": top_predictions,
            "num_chunks_processed": len(chunks),
            "model_used": "RoBERTa (Chunk Aggregated)" if use_chunk_aggregation else "RoBERTa (Truncated)"
        }

    def _predict_baseline(self, text: str, top_k: int = 3) -> Dict[str, Any]:
        """Inference using TF-IDF + Logistic Regression baseline."""
        vectorizer = self.baseline_data["vectorizer"]
        classifier = self.baseline_data["classifier"]
        
        vec = vectorizer.transform([text])
        probabilities = classifier.predict_proba(vec)[0]
        
        top_indices = np.argsort(probabilities)[::-1][:top_k]
        primary_idx = top_indices[0]
        primary_domain = self.label_encoder.decode(primary_idx)
        confidence = float(probabilities[primary_idx])

        top_predictions = []
        for idx in top_indices:
            top_predictions.append({
                "domain": self.label_encoder.decode(idx),
                "probability": round(float(probabilities[idx]), 4)
            })

        return {
            "primary_domain": primary_domain,
            "confidence": round(confidence, 4),
            "top_predictions": top_predictions,
            "num_chunks_processed": 1,
            "model_used": "TF-IDF + Logistic Regression Baseline"
        }

# Global singleton instance
_classifier_instance: Optional[DomainClassifier] = None

def get_domain_classifier() -> DomainClassifier:
    """Retrieve global singleton DomainClassifier instance."""
    global _classifier_instance
    if _classifier_instance is None:
        _classifier_instance = DomainClassifier()
    return _classifier_instance
