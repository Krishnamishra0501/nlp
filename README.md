# ContractGuard — Model 1: Contract Domain Detection

ContractGuard is an NLP-Based Legal Contract Risk Analysis System. **Model 1: Contract Domain Detection** serves as the initial domain-aware classification stage of the ContractGuard pipeline.

---

## 1. Pipeline Architecture

```text
Uploaded Contract (.txt / .pdf / .docx)
       ↓
Backend Text Extraction (PyMuPDF / python-docx)
       ↓
Paragraph / Section Chunk Segmentation
       ↓
Preprocessed Text Normalization
       ↓
RoBERTa Fine-Tuned Transformer Model
       ↓
Chunk-Level Logit Aggregation (Mean Pooling + Softmax)
       ↓
Domain Prediction (Primary Domain + Confidence % + Top 3 Probabilities)
       ↓
User Confirmation UI Override (/api/v1/confirm-domain)
       ↓
Locked Contract Domain Passed to ContractGuard Risk Engine
```

---

## 2. Supported Contract Domains

The 11 configurable legal contract domains are defined in [`data/domain_config.json`](file:///c:/Users/Sameera%20Bhoyar/OneDrive/Desktop/ContractGuard/data/domain_config.json):

1. **Employment**: Offers, executive agreements, non-competes, work-for-hire terms.
2. **NDA / Confidentiality**: Mutual non-disclosure, secrecy agreements, trade secrets.
3. **Vendor / Supplier**: Goods supply, procurement, purchase orders, inventory.
4. **Service Agreement**: Master service agreements (MSA), statement of work (SOW).
5. **Software / IT**: SaaS terms, software licensing, source code agreements.
6. **Lease / Rental**: Commercial property leases, residential rent, equipment lease.
7. **Construction**: Contractor contracts, architectural blueprints, site development.
8. **Partnership**: Joint ventures, partnership deeds, capital contribution.
9. **Loan / Financial**: Credit facilities, promissory notes, mortgages.
10. **General Commercial**: Distribution agreements, agency contracts, franchising.
11. **Other**: Settlements, liability waivers, indemnity releases.

---

## 3. Directory Structure

```text
ContractGuard/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── domain.py          # FastAPI endpoints (detect-domain, confirm-domain, domains)
│   │   ├── models/
│   │   │   └── domain_classifier.py # Inference wrapper (RoBERTa & TF-IDF Baseline)
│   │   ├── services/
│   │   │   ├── document_processor.py # TXT, PDF, DOCX text extraction
│   │   │   └── domain_detection.py # Domain detection service & state manager
│   │   ├── schemas/
│   │   │   └── domain_schema.py   # Pydantic schemas
│   │   ├── config.py              # Application settings & model paths
│   │   └── main.py                # FastAPI application entry point
│   ├── requirements.txt           # Python dependencies
│   └── test_api.py                # Automated FastAPI test suite
├── data/
│   ├── domain_config.json         # Configurable 11 domain specifications
│   ├── dataset_generator.py       # Programmatic legal dataset generator
│   └── domain_dataset.csv         # 440 multi-paragraph legal contract samples
├── training/
│   ├── preprocessing.py           # Legal text cleaning & paragraph chunking
│   ├── train_baseline.py          # TF-IDF + Logistic Regression baseline
│   ├── train_roberta.py           # RoBERTa fine-tuning script
│   ├── evaluate_domain_classifier.py # Comprehensive evaluation suite
│   └── error_analysis.py          # Error diagnostic report generator
├── models/
│   └── domain_classifier/
│       ├── baseline_tfidf.joblib  # Trained baseline vectorizer & model
│       ├── roberta_model/         # Fine-tuned RoBERTa weights & tokenizer
│       ├── confusion_matrix.png   # Heatmap visualization
│       ├── evaluation_results.json # Metrics output
│       └── error_analysis_report.md # Structured error diagnostic report
├── test_contracts/                # Sample TXT, DOCX, and PDF legal contracts
└── README.md                      # Documentation
```

---

## 4. Experimental Results & Ablation Study

Evaluation performed on a stratified 20% test split (88 contracts across all 11 domains):

| Experiment | Model Architecture | Document Strategy | Accuracy | Macro F1 | Weighted F1 |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Experiment A** | TF-IDF + Logistic Regression | Full Text Vectorization | **100.00%** | **100.00%** | **100.00%** |
| **Experiment C** | Fine-Tuned RoBERTa | Truncated First 256 Tokens | 96.59% | 96.36% | 96.36% |
| **Experiment D** | Fine-Tuned RoBERTa | **Section/Chunk Logit Aggregation** | **97.73%** | **97.78%** | **97.78%** |

### Key Research Insight
Section/chunk-based logit aggregation (**97.78% Macro F1**) outperforms simple 256-token truncation (**96.36% Macro F1**) by **+1.42% Macro F1**, proving that legal document classification requires scanning operative covenants throughout long contracts rather than relying solely on preamble text.

---

## 5. Running the Backend Server

To start the FastAPI development server:

```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation available at: `http://localhost:8000/docs`

---

## 6. Sample API Request & Response

### Endpoint: `POST /api/v1/detect-domain`

#### Sample File Upload / Form Request:
```bash
curl -X POST "http://localhost:8000/api/v1/detect-domain" \
  -F "file=@test_contracts/sample_employment.txt"
```

#### Sample JSON Response:
```json
{
  "domain": "Employment",
  "confidence": 0.9425,
  "top_predictions": [
    {
      "domain": "Employment",
      "probability": 0.9425
    },
    {
      "domain": "Service Agreement",
      "probability": 0.0341
    },
    {
      "domain": "Vendor / Supplier",
      "probability": 0.0152
    }
  ],
  "num_chunks_processed": 3,
  "model_used": "RoBERTa (Chunk Aggregated)",
  "status": "Domain detected successfully."
}
```

---

## 7. Frontend User Confirmation Integration

In ContractGuard, auto-detected contract domains are presented to the user for explicit confirmation before risk analysis:

```text
Detected Contract Domain: Employment Contract
Confidence: 94.25%

Alternative Predictions:
- Service Agreement (3.41%)
- Vendor / Supplier (1.52%)

Is this domain correct?
[ Confirm Domain ]    [ Change Domain ]
```

When confirmed or changed, the frontend sends:

### Endpoint: `POST /api/v1/confirm-domain`
```json
{
  "contract_id": "CTR-0042",
  "confirmed_domain": "Employment",
  "notes": "User verified employment contract terms."
}
```

The confirmed domain locks the active domain tag and guarantees domain-aware clause analysis in subsequent ContractGuard modules.
