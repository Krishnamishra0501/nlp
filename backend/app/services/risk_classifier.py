from typing import List, Dict, Any
import torch
from sentence_transformers import SentenceTransformer, util
from backend.app.services.nli_validator import NLIValidator


class RiskClassifier:
    def __init__(self, model=None):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        self.model = model or SentenceTransformer(
            "all-MiniLM-L6-v2",
            device=self.device
        )

        self.nli = NLIValidator()

        self.risk_definitions = {
            "Broad Liability Obligation": {
                "severity": "HIGH",
                "threshold": 0.55,
                "nli_threshold": 0.70,
                "description": (
                    "The contract appears to impose broad or potentially "
                    "unlimited responsibility for losses or damages."
                ),
                "recommendation": (
                    "Review the scope of liability and consider appropriate limitations."
                ),
                "concept": (
                    "a party is responsible for any and all losses or damages, "
                    "unlimited liability, broad financial responsibility "
                    "for losses or damages"
                ),
                "hypothesis": (
                    "The Customer is responsible for any and all losses and damages."
                )
            },

            "Broad Indemnification": {
                "severity": "HIGH",
                "threshold": 0.60,
                "nli_threshold": 0.70,
                "description": (
                    "The contract appears to contain a broad obligation "
                    "to indemnify or hold another party harmless."
                ),
                "recommendation": (
                    "Review the scope of indemnification and consider limiting "
                    "it to defined claims and circumstances."
                ),
                "concept": (
                    "a party must indemnify, defend and hold harmless another "
                    "party from claims, losses, damages, liabilities or expenses"
                ),
                "hypothesis": (
                    "The Customer must indemnify and hold the Supplier harmless "
                    "from claims and losses."
                )
            },

            "Automatic Renewal": {
                "severity": "MEDIUM",
                "threshold": 0.60,
                "nli_threshold": 0.70,
                "description": (
                    "The agreement appears to contain an automatic renewal provision."
                ),
                "recommendation": (
                    "Confirm that renewal terms and cancellation notice periods are acceptable."
                ),
                "concept": (
                    "the agreement automatically renews for another term unless "
                    "a party provides notice of cancellation"
                ),
                "hypothesis": (
                    "This agreement automatically renews for successive one year "
                    "periods unless either party gives notice."
                )
            },

            "Non-Compete Restriction": {
                "severity": "MEDIUM",
                "threshold": 0.50,
                "nli_threshold": 0.70,
                "description": (
                    "A restriction on competing activities appears to be present."
                ),
                "recommendation": (
                    "Review its duration, geographic scope, and enforceability."
                ),
                "concept": (
                    "an employee or party is prohibited from competing with "
                    "the company or engaging in competing business activities"
                ),
                "hypothesis": (
                    "The employee is prohibited from competing with the company."
                )
            },

            "Termination Without Cause": {
                "severity": "MEDIUM",
                "threshold": 0.50,
                "nli_threshold": 0.70,
                "description": (
                    "The agreement may allow termination without a specified cause."
                ),
                "recommendation": (
                    "Review notice requirements and the commercial impact of termination."
                ),
                "concept": (
                    "either party may terminate the agreement at any time "
                    "without cause, reason or justification"
                ),
                "hypothesis": (
                    "Either party may terminate this agreement without cause."
                )
            },

            "Uncapped Damages": {
                "severity": "HIGH",
                "threshold": 0.65,
                "nli_threshold": 0.70,
                "description": (
                    "The contract may expose a party to damages without a defined cap."
                ),
                "recommendation": (
                    "Consider defining a reasonable liability or damages cap."
                ),
                "concept": (
                    "a party may recover unlimited or uncapped monetary damages "
                    "with no maximum liability amount"
                ),
                "hypothesis": (
                    "The party has unlimited liability for monetary damages "
                    "with no maximum cap."
                )
            }
        }

        self.risk_names = list(self.risk_definitions.keys())

        self.risk_embeddings = self.model.encode(
            [
                self.risk_definitions[name]["concept"]
                for name in self.risk_names
            ],
            convert_to_tensor=True,
            normalize_embeddings=True
        )

    def _validate_with_nli(
        self,
        sentence: str,
        risk_name: str
    ) -> Dict[str, Any]:

        risk = self.risk_definitions[risk_name]

        return self.nli.validate(
            sentence,
            risk["hypothesis"]
        )

    def classify_sentence(
        self,
        sentence: str
    ) -> List[Dict[str, Any]]:

        embedding = self.model.encode(
            sentence,
            convert_to_tensor=True,
            normalize_embeddings=True
        )

        similarities = util.cos_sim(
            embedding,
            self.risk_embeddings
        )[0]

        candidates = []

        for index, score in enumerate(similarities):

            risk_name = self.risk_names[index]
            risk = self.risk_definitions[risk_name]

            similarity = float(score.item())

            if similarity < risk["threshold"]:
                continue

            nli_result = self._validate_with_nli(
                sentence,
                risk_name
            )

            if (
                nli_result["label"] != "entailment"
                or nli_result["entailment"] < risk["nli_threshold"]
            ):
                continue

            confidence = (
                similarity * 0.5
                + nli_result["entailment"] * 0.5
            )

            candidates.append({
                "title": risk_name,
                "severity": risk["severity"],
                "confidence": round(confidence, 4),
                "semantic_similarity": round(similarity, 4),
                "nli_confidence": round(
                    nli_result["entailment"],
                    4
                ),
                "explanation": risk["description"],
                "recommendation": risk["recommendation"],
                "evidence": sentence
            })

        candidates.sort(
            key=lambda item: item["confidence"],
            reverse=True
        )

        if not candidates:
            return []

        best = candidates[0]

        filtered = [best]

        for candidate in candidates[1:]:
            if candidate["confidence"] >= best["confidence"] - 0.08:
                filtered.append(candidate)

        return filtered

    def classify_sentences(
        self,
        sentences: List[str]
    ) -> List[Dict[str, Any]]:

        if not sentences:
            return []

        results = []

        for sentence in sentences:
            risks = self.classify_sentence(sentence)
            results.extend(risks)

        return results

    def analyze(
        self,
        sentences: List[str]
    ) -> Dict[str, Any]:

        risks = self.classify_sentences(sentences)

        return {
            "risks": risks,
            "risk_count": len(risks),
            "device": self.device,
            "nli_device": self.nli.device
        }