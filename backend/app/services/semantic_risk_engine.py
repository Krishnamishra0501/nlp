from typing import List, Dict, Any
import numpy as np
import spacy
import torch
from sentence_transformers import SentenceTransformer, util


class SemanticRiskEngine:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        self.nlp = spacy.load("en_core_web_sm")

        self.model = SentenceTransformer(
            "all-MiniLM-L6-v2",
            device=self.device
        )

        self.clause_definitions = {
            "Payment": (
                "payment terms, fees, compensation, price, invoices, "
                "billing, payment obligations and payment schedule"
            ),
            "Termination": (
                "termination of the agreement, cancellation, ending the contract, "
                "termination rights, notice period and termination conditions"
            ),
            "Liability": (
                "liability, responsibility for losses, damages, limitations of liability, "
                "financial responsibility and liability caps"
            ),
            "Indemnification": (
                "indemnification, indemnity, holding harmless, reimbursement for losses "
                "or claims caused by another party"
            ),
            "Confidentiality": (
                "confidential information, confidentiality obligations, "
                "non-disclosure, protecting confidential business information"
            ),
            "Intellectual Property": (
                "intellectual property, ownership of software, copyrights, patents, "
                "trademarks, source code and intellectual property rights"
            ),
            "Governing Law": (
                "governing law, applicable law, jurisdiction and laws that govern "
                "the agreement"
            ),
            "Dispute Resolution": (
                "dispute resolution, arbitration, mediation, courts, legal disputes "
                "and procedures for resolving disagreements"
            ),
            "Renewal": (
                "automatic renewal, contract renewal, extension of the agreement, "
                "renewal period and renewal notice"
            ),
            "Non-Compete": (
                "non-compete restrictions, restrictions on competing businesses, "
                "competitive activities and post-employment competition"
            )
        }

        self.clause_names = list(self.clause_definitions.keys())

        self.clause_embeddings = self.model.encode(
            list(self.clause_definitions.values()),
            convert_to_tensor=True,
            normalize_embeddings=True
        )

    def split_into_sentences(self, text: str) -> List[str]:
        doc = self.nlp(text)

        sentences = []

        for sentence in doc.sents:
            cleaned = sentence.text.strip()

            if len(cleaned) >= 20:
                sentences.append(cleaned)

        return sentences

    def detect_clauses(
        self,
        text: str,
        threshold: float = 0.40
    ) -> Dict[str, Any]:

        sentences = self.split_into_sentences(text)

        if not sentences:
            return {
                "clauses": [],
                "sentences_processed": 0,
                "device": self.device
            }

        sentence_embeddings = self.model.encode(
            sentences,
            convert_to_tensor=True,
            normalize_embeddings=True
        )

        similarity_matrix = util.cos_sim(
            sentence_embeddings,
            self.clause_embeddings
        )

        detected_clauses = []

        for clause_index, clause_name in enumerate(self.clause_names):

            scores = similarity_matrix[:, clause_index]

            best_score, best_sentence_index = torch.max(scores, dim=0)

            confidence = float(best_score.item())

            if confidence >= threshold:
                evidence = sentences[int(best_sentence_index.item())]

                detected_clauses.append({
                    "name": clause_name,
                    "status": "found",
                    "confidence": round(confidence, 4),
                    "evidence": evidence
                })
            else:
                detected_clauses.append({
                    "name": clause_name,
                    "status": "not_found",
                    "confidence": round(confidence, 4),
                    "evidence": None
                })

        return {
            "clauses": detected_clauses,
            "sentences_processed": len(sentences),
            "device": self.device
        }

    def analyze(self, text: str) -> Dict[str, Any]:
        return self.detect_clauses(text)