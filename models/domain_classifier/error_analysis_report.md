# ContractGuard Model 1: Error Analysis Report

## 1. Executive Summary

- **Total Test Contracts Evaluated**: 88
- **Correct Classifications**: 86
- **Misclassified Contracts**: 2
- **Overall Model Accuracy**: 97.73%

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

### Error #1: Contract `CTR-0440`

- **True Domain**: `Other`
- **Predicted Domain**: `General Commercial` (Confidence: 18.6%)
- **Top 3 Alternatives**: General Commercial (18.6%), Service Agreement (14.5%), Other (14.0%)
- **Diagnosis**: Low Confidence / Ambiguous Legal Terminology
- **Snippet**:
  > THIS CONTRACT is made effective as of 2023-02-19, by and among Atlas Construction Group, having its principal place of business at 923 Commercial Blvd, Suite 386, New York, NY 10001, and Nexus Consulting Partners, residing at or having offices at 443 Enterprise Way, Floor 15, San Francisco, CA 94105...

---
### Error #2: Contract `CTR-0171`

- **True Domain**: `Software / IT`
- **Predicted Domain**: `General Commercial` (Confidence: 17.5%)
- **Top 3 Alternatives**: General Commercial (17.5%), Software / IT (13.3%), Service Agreement (13.1%)
- **Diagnosis**: Low Confidence / Ambiguous Legal Terminology
- **Snippet**:
  > THIS CONTRACT is made effective as of 2025-05-12, by and among Horizon Commercial Properties, having its principal place of business at 388 Commercial Blvd, Suite 401, New York, NY 10001, and Beacon Logistics Ltd., residing at or having offices at 548 Enterprise Way, Floor 13, San Francisco, CA 9410...

---

## 4. Recommendations for Next Iterations

1. **Domain Confirmation Workflow**: The frontend user confirmation step (`/confirm-domain`) successfully mitigates edge-case ambiguity by allowing human domain lock-in.
2. **Multi-Label Model Expansion**: Refactor classification layer to multi-label BCE loss in Model 2 to explicitly support hybrid contracts (e.g., Software + NDA).
3. **Domain Specificity Loss Weighting**: Increase penalty for cross-domain confusion between closely related commercial domains (Service vs Vendor).
