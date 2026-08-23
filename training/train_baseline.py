import os
import sys

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score, f1_score, precision_score, recall_score

from training.preprocessing import clean_contract_text, DomainLabelEncoder

DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "domain_dataset.csv")
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "domain_classifier")

def train_baseline_model():
    print("="*60)
    print("TRAINING BASELINE MODEL: TF-IDF + LOGISTIC REGRESSION")
    print("="*60)
    
    # 1. Load dataset
    df = pd.read_csv(DATA_PATH)
    print(f"Loaded dataset from {DATA_PATH} ({len(df)} total contracts)")
    
    # 2. Preprocess text
    df["cleaned_text"] = df["text"].apply(clean_contract_text)
    
    # 3. Encode labels
    label_encoder = DomainLabelEncoder()
    df["label_id"] = df["domain"].apply(label_encoder.encode)
    
    # 4. Train / Test Split (Stratified 80/20 for baseline training/eval)
    X_train, X_test, y_train, y_test = train_test_split(
        df["cleaned_text"],
        df["label_id"],
        test_size=0.20,
        random_state=42,
        stratify=df["label_id"]
    )
    
    print(f"Train set: {len(X_train)} samples | Test set: {len(X_test)} samples")
    
    # 5. TF-IDF Vectorization
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=5000,
        sublinear_tf=True
    )
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    
    # 6. Logistic Regression Classifier
    classifier = LogisticRegression(
        class_weight="balanced",
        max_iter=1000,
        random_state=42,
        C=1.0
    )
    classifier.fit(X_train_vec, y_train)
    
    # 7. Predictions & Evaluation
    y_pred = classifier.predict(X_test_vec)
    y_prob = classifier.predict_proba(X_test_vec)
    
    acc = accuracy_score(y_test, y_pred)
    macro_f1 = f1_score(y_test, y_pred, average="macro")
    weighted_f1 = f1_score(y_test, y_pred, average="weighted")
    precision = precision_score(y_test, y_pred, average="macro")
    recall = recall_score(y_test, y_pred, average="macro")
    
    print("\nBaseline Model Performance Results:")
    print("-" * 40)
    print(f"  • Accuracy    : {acc*100:.2f}%")
    print(f"  • Precision   : {precision*100:.2f}%")
    print(f"  • Recall      : {recall*100:.2f}%")
    print(f"  • Macro F1    : {macro_f1*100:.2f}%")
    print(f"  • Weighted F1 : {weighted_f1*100:.2f}%")
    print("-" * 40)
    
    target_names = [label_encoder.decode(i) for i in range(label_encoder.num_classes)]
    print("\nDetailed Per-Class Classification Report:")
    print(classification_report(y_test, y_pred, target_names=target_names, digits=4))
    
    # 8. Save artifacts
    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib_path = os.path.join(MODEL_DIR, "baseline_tfidf.joblib")
    artifacts = {
        "vectorizer": vectorizer,
        "classifier": classifier,
        "label_encoder": label_encoder,
        "metrics": {
            "accuracy": acc,
            "macro_f1": macro_f1,
            "weighted_f1": weighted_f1
        }
    }
    joblib.dump(artifacts, joblib_path)
    print(f"Baseline model artifacts successfully saved to {joblib_path}")
    print("="*60 + "\n")
    return artifacts

if __name__ == "__main__":
    train_baseline_model()
