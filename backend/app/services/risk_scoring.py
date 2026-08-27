from typing import List, Dict, Any
import math


class RiskScorer:
    def __init__(self):
        self.severity_weights = {
            "HIGH": 1.0,
            "MEDIUM": 0.6,
            "LOW": 0.3
        }

        self.risk_groups = {
            "liability": {
                "Broad Liability Obligation",
                "Uncapped Damages"
            },
            "indemnification": {
                "Broad Indemnification"
            },
            "contract_terms": {
                "Automatic Renewal",
                "Termination Without Cause",
                "Non-Compete Restriction"
            }
        }

    def find_group(self, risk_name: str) -> str:
        for group, risk_names in self.risk_groups.items():
            if risk_name in risk_names:
                return group

        return risk_name

    def calculate_risk_strength(
        self,
        risk: Dict[str, Any]
    ) -> float:

        severity = risk.get("severity", "LOW")

        severity_weight = self.severity_weights.get(
            severity,
            0.3
        )

        confidence = float(
            risk.get("confidence", 0.0)
        )

        return severity_weight * confidence

    def calculate_score(
        self,
        risks: List[Dict[str, Any]]
    ) -> Dict[str, Any]:

        if not risks:
            return {
                "risk_score": 0.0,
                "risk_level": "LOW",
                "risk_count": 0,
                "risk_contributions": []
            }

        contributions = []

        for risk in risks:

            strength = self.calculate_risk_strength(risk)

            title = risk.get(
                "title",
                "Unknown Risk"
            )

            contributions.append({
                "title": title,
                "severity": risk.get(
                    "severity",
                    "LOW"
                ),
                "strength": round(
                    strength,
                    4
                ),
                "group": self.find_group(title)
            })

        grouped = {}

        for contribution in contributions:

            group = contribution["group"]

            if group not in grouped:
                grouped[group] = []

            grouped[group].append(
                contribution["strength"]
            )

        group_strengths = []

        for values in grouped.values():

            values.sort(reverse=True)

            group_strength = values[0]

            for index, value in enumerate(
                values[1:],
                start=1
            ):
                group_strength += (
                    value * (0.35 ** index)
                )

            group_strengths.append(
                group_strength
            )

        total_strength = sum(
            group_strengths
        )

        score = 100 * (
            1 - math.exp(
                -total_strength / 2.5
            )
        )

        score = min(
            100.0,
            max(0.0, score)
        )

        high_risks = sum(
            1
            for risk in risks
            if risk.get("severity") == "HIGH"
        )

        if score >= 85 and high_risks >= 2:
            level = "CRITICAL"
        elif score >= 65:
            level = "HIGH"
        elif score >= 30:
            level = "MEDIUM"
        else:
            level = "LOW"

        return {
            "risk_score": round(
                score,
                2
            ),
            "risk_level": level,
            "risk_count": len(risks),
            "risk_contributions": contributions
        }