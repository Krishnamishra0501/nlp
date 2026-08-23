import os
import sys

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_get_domains():
    print("Testing GET /api/v1/domains...")
    response = client.get("/api/v1/domains")
    assert response.status_code == 200, f"Failed: {response.text}"
    data = response.json()
    print(f"  Success! Returned {data['total_domains']} configured domains.")
    assert data["total_domains"] == 11

def test_detect_domain_text():
    print("\nTesting POST /api/v1/detect-domain (Text Payload)...")
    payload = {
        "text": "THIS EMPLOYMENT AGREEMENT is made between Acme Corp and John Doe for Senior Engineer position with $140,000 base salary.",
        "use_baseline": "true",
        "use_chunk_aggregation": "true"
    }
    response = client.post("/api/v1/detect-domain", data=payload)
    assert response.status_code == 200, f"Failed: {response.text}"
    data = response.json()
    print(f"  Primary Domain : {data['domain']}")
    print(f"  Confidence     : {data['confidence']*100:.1f}%")
    print(f"  Top Predictions: {data['top_predictions']}")
    assert data["domain"] == "Employment"

def test_detect_domain_file_txt():
    print("\nTesting POST /api/v1/detect-domain (Uploaded .txt File)...")
    txt_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "test_contracts", "sample_employment.txt")
    with open(txt_path, "rb") as f:
        files = {"file": ("sample_employment.txt", f, "text/plain")}
        data = {"use_baseline": "true"}
        response = client.post("/api/v1/detect-domain", files=files, data=data)
    assert response.status_code == 200, f"Failed: {response.text}"
    res = response.json()
    print(f"  File TXT Domain Detected: {res['domain']} (Confidence: {res['confidence']*100:.1f}%)")
    assert res["domain"] == "Employment"

def test_detect_domain_file_docx():
    print("\nTesting POST /api/v1/detect-domain (Uploaded .docx File)...")
    docx_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "test_contracts", "sample_nda.docx")
    with open(docx_path, "rb") as f:
        files = {"file": ("sample_nda.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
        data = {"use_baseline": "true"}
        response = client.post("/api/v1/detect-domain", files=files, data=data)
    assert response.status_code == 200, f"Failed: {response.text}"
    res = response.json()
    print(f"  File DOCX Domain Detected: {res['domain']} (Confidence: {res['confidence']*100:.1f}%)")
    assert res["domain"] == "NDA / Confidentiality"

def test_detect_domain_file_pdf():
    print("\nTesting POST /api/v1/detect-domain (Uploaded .pdf File)...")
    pdf_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "test_contracts", "sample_software_license.pdf")
    with open(pdf_path, "rb") as f:
        files = {"file": ("sample_software_license.pdf", f, "application/pdf")}
        data = {"use_baseline": "true"}
        response = client.post("/api/v1/detect-domain", files=files, data=data)
    assert response.status_code == 200, f"Failed: {response.text}"
    res = response.json()
    print(f"  File PDF Domain Detected: {res['domain']} (Confidence: {res['confidence']*100:.1f}%)")
    assert res["domain"] == "Software / IT"

def test_confirm_domain():
    print("\nTesting POST /api/v1/confirm-domain (User Domain Selection Override)...")
    payload = {
        "contract_id": "CTR-9999",
        "confirmed_domain": "Software / IT",
        "notes": "Contract contains mixed employment and software IP terms, user selected Software / IT."
    }
    response = client.post("/api/v1/confirm-domain", json=payload)
    assert response.status_code == 200, f"Failed: {response.text}"
    res = response.json()
    print(f"  Status        : {res['status']}")
    print(f"  Active Domain : {res['active_domain']}")
    print(f"  Is Override   : {res['is_override']}")
    assert res["active_domain"] == "Software / IT"

def test_verify_domain():
    print("\nTesting POST /api/v1/verify-domain (User-Guided Domain Verification Mode)...")
    payload = {
        "claimed_domain": "Employment",
        "text": "THIS EMPLOYMENT AGREEMENT is made between Acme Corp and John Doe for Senior Engineer position with $140,000 base salary.",
        "use_baseline": "true"
    }
    response = client.post("/api/v1/verify-domain", data=payload)
    assert response.status_code == 200, f"Failed: {response.text}"
    res = response.json()
    print(f"  Claimed Domain : {res['claimed_domain']}")
    print(f"  Match Status   : {res['match_status']}")
    print(f"  Is Verified    : {res['is_verified']}")
    safe_msg = res['message'].encode('ascii', errors='ignore').decode('ascii')
    print(f"  Message        : {safe_msg}")
    assert res["is_verified"] is True
    assert res["match_status"] == "MATCH"

if __name__ == "__main__":
    print("="*60)
    print("RUNNING CONTRACTGUARD API ENDPOINT VERIFICATION SUITE")
    print("="*60)
    test_get_domains()
    test_detect_domain_text()
    test_detect_domain_file_txt()
    test_detect_domain_file_docx()
    test_detect_domain_file_pdf()
    test_confirm_domain()
    test_verify_domain()
    print("="*60)
    print("ALL CONTRACTGUARD API ENDPOINTS VERIFIED SUCCESSFULLY!")
    print("="*60)
