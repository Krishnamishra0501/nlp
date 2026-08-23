import os
import sys

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import pandas as pd
import numpy as np
from typing import List, Dict, Any

from training.preprocessing import clean_contract_text, DomainLabelEncoder
from training.evaluate_domain_classifier import load_test_dataset, ROBERTA_PATH, BASELINE_PATH
from backend.app.models.domain_classifier import DomainClassifier

ERROR_REPORT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "models", "domain_classifier", "error_analysis_report.md"
)

def perform_error_analysis():
    print("="*70)
    print("CONTRACTGUARD ERROR ANALYSIS REPORT GENERATOR")
    print("="*70)

    label_encoder = DomainLabelEncoder()
    test_df = load_test_dataset(label_encoder)

    # Initialize classifier
    classifier = DomainClassifier()

    errors = []
    correct_count = 0

    print(f"Analyzing predictions across {len(test_df)} test contracts...")

    for idx, row in test_df.iterrows():
        contract_id = row["contract_id"]
        true_domain = row["domain"]
        text = row["cleaned_text"]

        prediction = classifier.predict_contract(
            raw_text=text,
            use_chunk_aggregation=True,
            top_k=3,
            use_baseline=False
        )

        pred_domain = prediction["primary_domain"]
        confidence = prediction["confidence"]
        top_preds = prediction["top_predictions"]

        if pred_domain == true_domain:
            correct_count += 1
        else:
            # Diagnose root cause category
            if true_domain in ["Vendor / Supplier", "Service Agreement"] and pred_domain in ["Vendor / Supplier", "Service Agreement"]:
                cause = "Domain Overlap (Service vs Supplier commercial terms)"
            elif true_domain in ["Software / IT", "NDA / Confidentiality"] and pred_domain in ["Software / IT", "NDA / Confidentiality"]:
                cause = "Mixed-Domain / Hybrid Clause (Software IP & Confidentiality overlap)"
            elif confidence < 0.40:
                cause = "Low Confidence / Ambiguous Legal Terminology"
            else:
                cause = "Chunk Aggregation / Boundary Noise"

            errors.append({
                "contract_id": contract_id,
                "true_domain": true_domain,
                "predicted_domain": pred_domain,
                "confidence": confidence,
                "top_predictions": top_preds,
                "diagnosis": cause,
                "text_snippet": text[:300] + "..."
            })

    accuracy = (correct_count / len(test_df)) * 100
    print(f"\nAnalysis Summary:")
    print(f"  • Total Contracts Tested : {len(test_df)}")
    print(f"  • Correct Classifications: {correct_count}")
    print(f"  • Total Errors Found     : {len(errors)}")
    print(f"  • Overall Test Accuracy  : {accuracy:.2f}%")

    # Generate Markdown Report
    report_md = f"""# ContractGuard Model 1: Error Analysis Report

## 1. Executive Summary

- **Total Test Contracts Evaluated**: {len(test_df)}
- **Correct Classifications**: {correct_count}
- **Misclassified Contracts**: {len(errors)}
- **Overall Model Accuracy**: {accuracy:.2f}%

---

## 2. Root Cause Categories Identified

| Category | Description | Primary Affected Domains |
| :--- | :--- | :--- |
| **Domain Overlap** | High semantic similarity in commercial clauses, deliverables, and fee terms | Service Agreement ↔ Vendor / Supplier |
| **Mixed-Domain Contracts** | Contracts containing heavy secondary obligations (e.g. SaaS with confidentiality) | Software / IT ↔ NDA / Confidentiality |
| **Ambiguous Language** | Boilerplate legal recitals overpowering domain-specific covenants | General Commercial ↔ Other |
| **Chunking Boundary Noise** | Section splits separating operative definitions from governing terms | Long Multi-Section Leases / Loans |

---

## 3. Detailed Misclassification Log

"""
    if not errors:
        report_md += "_No classification errors were recorded on the test dataset. Model achieved 100% test accuracy._\n"
    else:
        for idx, err in enumerate(errors, 1):
            top_str = ", ".join([f"{p['domain']} ({p['probability']*100:.1f}%)" for p in err['top_predictions']])
            report_md += f"""### Error #{idx}: Contract `{err['contract_id']}`

- **True Domain**: `{err['true_domain']}`
- **Predicted Domain**: `{err['predicted_domain']}` (Confidence: {err['confidence']*100:.1f}%)
- **Top 3 Alternatives**: {top_str}
- **Diagnosis**: {err['diagnosis']}
- **Snippet**:
  > {err['text_snippet']}

---
"""

    report_md += """
## 4. Recommendations for Next Iterations

1. **Domain Confirmation Workflow**: The frontend user confirmation step (`/confirm-domain`) successfully mitigates edge-case ambiguity by allowing human domain lock-in.
2. **Multi-Label Model Expansion**: Refactor classification layer to multi-label BCE loss in Model 2 to explicitly support hybrid contracts (e.g., Software + NDA).
3. **Domain Specificity Loss Weighting**: Increase penalty for cross-domain confusion between closely related commercial domains (Service vs Vendor).
"""

    os.makedirs(os.path.dirname(ERROR_REPORT_PATH), exist_ok=True)
    with open(ERROR_REPORT_PATH, "w", encoding="utf-8") as f:
        f.write(report_md)

    print(f"\nError analysis report saved to {ERROR_REPORT_PATH}")
    print("="*70 + "\n")

if __name__ == "__main__":
    perform_error_analysis()
