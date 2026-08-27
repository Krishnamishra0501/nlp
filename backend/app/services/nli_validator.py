from typing import Dict, Any
import torch
from sentence_transformers import CrossEncoder


class NLIValidator:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        self.model = CrossEncoder(
            "cross-encoder/nli-roberta-base",
            device=self.device
        )

        self.labels = [
            "contradiction",
            "entailment",
            "neutral"
        ]

    def validate(
        self,
        sentence: str,
        hypothesis: str
    ) -> Dict[str, Any]:

        scores = self.model.predict(
            [(sentence, hypothesis)]
        )

        scores = scores[0]

        probabilities = torch.softmax(
            torch.tensor(scores),
            dim=0
        ).tolist()

        best_index = max(
            range(len(probabilities)),
            key=lambda i: probabilities[i]
        )

        return {
            "label": self.labels[best_index],
            "confidence": round(
                float(probabilities[best_index]),
                4
            ),
            "contradiction": round(
                float(probabilities[0]),
                4
            ),
            "entailment": round(
                float(probabilities[1]),
                4
            ),
            "neutral": round(
                float(probabilities[2]),
                4
            ),
            "device": self.device
        }