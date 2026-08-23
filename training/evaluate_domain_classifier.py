import os
import sys

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report,
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    confusion_matrix
)
import matplotlib.pyplot as plt
import seaborn as sns

from training.preprocessing import clean_contract_text, chunk_contract_text, DomainLabelEncoder

DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "domain_dataset.csv")
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "domain_classifier")
ROBERTA_PATH = os.path.join(MODEL_DIR, "roberta_model")
BASELINE_PATH = os.path.join(MODEL_DIR, "baseline_tfidf.joblib")
CONFUSION_MATRIX_PATH = os.path.join(MODEL_DIR, "confusion_matrix.png")
METRICS_JSON_PATH = os.path.join(MODEL_DIR, "evaluation_results.json")

def load_test_dataset(label_encoder: DomainLabelEncoder):
    """Load stratified 20% test dataset reserved strictly for evaluation."""
    df = pd.read_csv(DATA_PATH)
    df["cleaned_text"] = df["text"].apply(clean_contract_text)
    df["label_id"] = df["domain"].apply(label_encoder.encode)

    _, test_df = train_test_split(
        df, test_size=0.20, random_state=42, stratify=df["label_id"]
    )
    return test_df

def evaluate_baseline(test_df: pd.DataFrame, label_encoder: DomainLabelEncoder):
    """Evaluate Experiment A: TF-IDF + Logistic Regression Baseline."""
    if not os.path.exists(BASELINE_PATH):
        print(f"Warning: Baseline model file not found at {BASELINE_PATH}")
        return None

    baseline_data = joblib.load(BASELINE_PATH)
    vectorizer = baseline_data["vectorizer"]
    classifier = baseline_data["classifier"]

    X_test_vec = vectorizer.transform(test_df["cleaned_text"])
    y_test = test_df["label_id"].values
    y_pred = classifier.predict(X_test_vec)

    acc = accuracy_score(y_test, y_pred)
    macro_f1 = f1_score(y_test, y_pred, average="macro")
    weighted_f1 = f1_score(y_test, y_pred, average="weighted")
    precision = precision_score(y_test, y_pred, average="macro")
    recall = recall_score(y_test, y_pred, average="macro")

    return {
        "experiment": "Experiment A: TF-IDF + Logistic Regression",
        "accuracy": acc,
        "precision": precision,
        "recall": recall,
        "macro_f1": macro_f1,
        "weighted_f1": weighted_f1,
        "y_true": y_test,
        "y_pred": y_pred
    }

def evaluate_roberta_modes(test_df: pd.DataFrame, label_encoder: DomainLabelEncoder):
    """Evaluate Experiment C (Truncated First Part) vs Experiment D (Chunk-Based Aggregation)."""
    if not os.path.exists(ROBERTA_PATH):
        print(f"Warning: RoBERTa model not found at {ROBERTA_PATH}")
        return None, None

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    tokenizer = AutoTokenizer.from_pretrained(ROBERTA_PATH)
    model = AutoModelForSequenceClassification.from_pretrained(ROBERTA_PATH)
    model.to(device)
    model.eval()

    y_test = test_df["label_id"].values
    
    # ----------------------------------------------------
    # Experiment C: Truncated (First 512 tokens / ~250 words)
    # ----------------------------------------------------
    y_pred_truncated = []
    with torch.no_grad():
        for text in test_df["cleaned_text"]:
            inputs = tokenizer(
                text,
                truncation=True,
                max_length=256,
                padding="max_length",
                return_tensors="pt"
            ).to(device)
            outputs = model(**inputs)
            pred_id = torch.argmax(outputs.logits, dim=-1).item()
            y_pred_truncated.append(pred_id)

    exp_c_res = {
        "experiment": "Experiment C: RoBERTa (Truncated First 256 Tokens)",
        "accuracy": accuracy_score(y_test, y_pred_truncated),
        "precision": precision_score(y_test, y_pred_truncated, average="macro"),
        "recall": recall_score(y_test, y_pred_truncated, average="macro"),
        "macro_f1": f1_score(y_test, y_pred_truncated, average="macro"),
        "weighted_f1": f1_score(y_test, y_pred_truncated, average="weighted"),
        "y_true": y_test,
        "y_pred": np.array(y_pred_truncated)
    }

    # ----------------------------------------------------
    # Experiment D: Section/Chunk-Based Full-Document Aggregation
    # ----------------------------------------------------
    y_pred_chunked = []
    with torch.no_grad():
        for text in test_df["cleaned_text"]:
            chunks = chunk_contract_text(text, max_words_per_chunk=200, overlap_words=40)
            if not chunks:
                chunks = [text]

            chunk_logits = []
            for chunk in chunks:
                inputs = tokenizer(
                    chunk,
                    truncation=True,
                    max_length=256,
                    padding="max_length",
                    return_tensors="pt"
                ).to(device)
                outputs = model(**inputs)
                chunk_logits.append(outputs.logits.squeeze(0).cpu())

            avg_logits = torch.mean(torch.stack(chunk_logits, dim=0), dim=0)
            pred_id = torch.argmax(avg_logits, dim=-1).item()
            y_pred_chunked.append(pred_id)

    exp_d_res = {
        "experiment": "Experiment D: RoBERTa (Section/Chunk Aggregation)",
        "accuracy": accuracy_score(y_test, y_pred_chunked),
        "precision": precision_score(y_test, y_pred_chunked, average="macro"),
        "recall": recall_score(y_test, y_pred_chunked, average="macro"),
        "macro_f1": f1_score(y_test, y_pred_chunked, average="macro"),
        "weighted_f1": f1_score(y_test, y_pred_chunked, average="weighted"),
        "y_true": y_test,
        "y_pred": np.array(y_pred_chunked)
    }

    return exp_c_res, exp_d_res

def plot_and_save_confusion_matrix(y_true, y_pred, label_encoder: DomainLabelEncoder):
    """Plot and save confusion matrix heatmap."""
    labels = [label_encoder.decode(i) for i in range(label_encoder.num_classes)]
    cm = confusion_matrix(y_true, y_pred)

    plt.figure(figsize=(10, 8))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=labels,
        yticklabels=labels,
        cbar=True
    )
    plt.title("Contract Domain Classifier Confusion Matrix (RoBERTa Chunk Aggregation)")
    plt.xlabel("Predicted Domain")
    plt.ylabel("True Legal Domain")
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()
    
    os.makedirs(os.path.dirname(CONFUSION_MATRIX_PATH), exist_ok=True)
    plt.savefig(CONFUSION_MATRIX_PATH, dpi=300)
    plt.close()
    print(f"Confusion matrix plot saved to {CONFUSION_MATRIX_PATH}")

def run_evaluation():
    print("="*70)
    print("CONTRACTGUARD MODEL EVALUATION & EXPERIMENTAL COMPARISON")
    print("="*70)

    label_encoder = DomainLabelEncoder()
    test_df = load_test_dataset(label_encoder)
    print(f"Evaluation Test Set Size: {len(test_df)} contracts across {label_encoder.num_classes} domains.")

    # 1. Run Baseline Eval
    res_a = evaluate_baseline(test_df, label_encoder)

    # 2. Run RoBERTa Evals
    res_c, res_d = evaluate_roberta_modes(test_df, label_encoder)

    results = []
    if res_a: results.append(res_a)
    if res_c: results.append(res_c)
    if res_d: results.append(res_d)

    # Print Comparison Table
    print("\n" + "="*80)
    print(f"{'Experiment':<50} | {'Accuracy':<8} | {'Macro F1':<8} | {'Weighted F1':<11}")
    print("="*80)
    
    saved_metrics = {}
    for r in results:
        exp_name = r["experiment"]
        acc = r["accuracy"] * 100
        macro_f1 = r["macro_f1"] * 100
        weighted_f1 = r["weighted_f1"] * 100
        print(f"{exp_name:<50} | {acc:6.2f}%  | {macro_f1:6.2f}%  | {weighted_f1:9.2f}%")
        
        saved_metrics[exp_name] = {
            "accuracy": round(r["accuracy"], 4),
            "precision": round(r["precision"], 4),
            "recall": round(r["recall"], 4),
            "macro_f1": round(r["macro_f1"], 4),
            "weighted_f1": round(r["weighted_f1"], 4)
        }
    print("="*80 + "\n")

    # Plot confusion matrix for main RoBERTa Chunk model (Experiment D)
    if res_d:
        plot_and_save_confusion_matrix(res_d["y_true"], res_d["y_pred"], label_encoder)
        
        target_names = [label_encoder.decode(i) for i in range(label_encoder.num_classes)]
        print("Per-Class Performance Report (RoBERTa Chunk Aggregation):")
        print(classification_report(res_d["y_true"], res_d["y_pred"], target_names=target_names, digits=4))

    # Save metrics JSON
    with open(METRICS_JSON_PATH, "w") as f:
        json.dump(saved_metrics, f, indent=2)
    print(f"Evaluation metrics JSON saved to {METRICS_JSON_PATH}")
    print("="*70 + "\n")

if __name__ == "__main__":
    run_evaluation()
