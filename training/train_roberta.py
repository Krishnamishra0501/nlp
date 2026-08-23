import os
import sys

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from transformers import AutoTokenizer, AutoModelForSequenceClassification, get_linear_schedule_with_warmup
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.utils.class_weight import compute_class_weight
import time

from training.preprocessing import clean_contract_text, chunk_contract_text, DomainLabelEncoder

# Configuration
MODEL_NAME = "distilroberta-base"
DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "domain_dataset.csv")
SAVE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "domain_classifier", "roberta_model")

# Hyperparameters
BATCH_SIZE = 16
EPOCHS = 5
LEARNING_RATE = 1e-3
MAX_LEN = 128
SEED = 42

def set_seed(seed: int = 42):
    torch.manual_seed(seed)
    np.random.seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

class ContractDataset(Dataset):
    """PyTorch Dataset for Contract Text Chunks."""
    def __init__(self, texts, labels, tokenizer, max_len=128):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_len = max_len

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = str(self.texts[idx])
        label = self.labels[idx]

        encoding = self.tokenizer(
            text,
            truncation=True,
            max_length=self.max_len,
            padding="max_length",
            return_tensors="pt"
        )

        return {
            "input_ids": encoding["input_ids"].squeeze(0),
            "attention_mask": encoding["attention_mask"].squeeze(0),
            "label": torch.tensor(label, dtype=torch.long)
        }

def prepare_chunked_data(df: pd.DataFrame, label_encoder: DomainLabelEncoder):
    """Expand document contracts into chunk-level samples for fine-tuning."""
    chunk_texts = []
    chunk_labels = []
    doc_ids = []

    for idx, row in df.iterrows():
        cleaned = clean_contract_text(row["text"])
        label_id = label_encoder.encode(row["domain"])
        # Select representative section chunks per document
        chunks = chunk_contract_text(cleaned, max_words_per_chunk=150, overlap_words=20)
        # Keep top 2 representative chunks for fast CPU training
        selected_chunks = chunks[:2] if len(chunks) >= 2 else chunks
        
        for chunk in selected_chunks:
            chunk_texts.append(chunk)
            chunk_labels.append(label_id)
            doc_ids.append(row["contract_id"])

    return chunk_texts, chunk_labels, doc_ids

def train_roberta_model():
    print("="*60)
    print(f"TRAINING MAIN MODEL: FINE-TUNING {MODEL_NAME.upper()}")
    print("="*60)
    set_seed(SEED)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Execution Device: {device}")

    # 1. Load Data
    df = pd.read_csv(DATA_PATH)
    label_encoder = DomainLabelEncoder()
    print(f"Loaded {len(df)} contracts across {label_encoder.num_classes} classes.")

    # Stratified Train/Val Split on document level
    df["label_id"] = df["domain"].apply(label_encoder.encode)
    train_df, val_df = train_test_split(
        df, test_size=0.20, random_state=SEED, stratify=df["label_id"]
    )
    print(f"Document level split - Train docs: {len(train_df)} | Val docs: {len(val_df)}")

    # Chunk expansion
    train_texts, train_labels, _ = prepare_chunked_data(train_df, label_encoder)
    val_texts, val_labels, _ = prepare_chunked_data(val_df, label_encoder)
    print(f"Chunk level dataset - Train chunks: {len(train_texts)} | Val chunks: {len(val_texts)}")

    # Compute class weights for loss function
    class_weights = compute_class_weight(
        class_weight="balanced",
        classes=np.unique(train_labels),
        y=train_labels
    )
    class_weights_tensor = torch.tensor(class_weights, dtype=torch.float).to(device)

    # Tokenizer & Model setup
    print(f"Loading pretrained tokenizer & model: {MODEL_NAME}...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=label_encoder.num_classes,
        id2label=label_encoder.id2label,
        label2id=label_encoder.label2id
    )

    # Freeze transformer encoder backbone for ultra-fast, robust CPU fine-tuning
    for param in model.roberta.parameters():
        param.requires_grad = False
        
    model.to(device)

    train_dataset = ContractDataset(train_texts, train_labels, tokenizer, max_len=MAX_LEN)
    val_dataset = ContractDataset(val_texts, val_labels, tokenizer, max_len=MAX_LEN)

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)

    # Train classification head parameters
    optimizer = torch.optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=1e-3, weight_decay=0.01)
    total_steps = len(train_loader) * EPOCHS
    scheduler = get_linear_schedule_with_warmup(
        optimizer, num_warmup_steps=int(0.1 * total_steps), num_training_steps=total_steps
    )
    criterion = nn.CrossEntropyLoss(weight=class_weights_tensor)

    best_macro_f1 = 0.0
    best_model_state = None

    print("\nStarting Fine-Tuning Loop...")
    print("-" * 50)

    for epoch in range(1, EPOCHS + 1):
        start_time = time.time()
        model.train()
        total_train_loss = 0.0

        for step, batch in enumerate(train_loader):
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["label"].to(device)

            optimizer.zero_grad()
            outputs = model(input_ids=input_ids, attention_mask=attention_mask)
            logits = outputs.logits

            loss = criterion(logits, labels)
            total_train_loss += loss.item()

            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            scheduler.step()

        avg_train_loss = total_train_loss / len(train_loader)

        # Validation phase
        model.eval()
        val_preds = []
        val_targets = []
        total_val_loss = 0.0

        with torch.no_grad():
            for batch in val_loader:
                input_ids = batch["input_ids"].to(device)
                attention_mask = batch["attention_mask"].to(device)
                labels = batch["label"].to(device)

                outputs = model(input_ids=input_ids, attention_mask=attention_mask)
                logits = outputs.logits
                loss = criterion(logits, labels)
                total_val_loss += loss.item()

                preds = torch.argmax(logits, dim=1).cpu().numpy()
                val_preds.extend(preds)
                val_targets.extend(labels.cpu().numpy())

        avg_val_loss = total_val_loss / len(val_loader)
        val_acc = accuracy_score(val_targets, val_preds)
        val_macro_f1 = f1_score(val_targets, val_preds, average="macro")
        elapsed = time.time() - start_time

        print(f"Epoch {epoch:2d}/{EPOCHS} [{elapsed:.1f}s] | "
              f"Train Loss: {avg_train_loss:.4f} | Val Loss: {avg_val_loss:.4f} | "
              f"Val Acc: {val_acc*100:.2f}% | Val Macro F1: {val_macro_f1*100:.2f}%")

        if val_macro_f1 > best_macro_f1:
            best_macro_f1 = val_macro_f1
            os.makedirs(SAVE_DIR, exist_ok=True)
            model.save_pretrained(SAVE_DIR)
            tokenizer.save_pretrained(SAVE_DIR)
            print(f"  --> Saved new best checkpoint to {SAVE_DIR} (Macro F1: {val_macro_f1*100:.2f}%)")

    print("-" * 50)
    print(f"Fine-tuning complete. Best Validation Macro F1: {best_macro_f1*100:.2f}%")
    print("="*60 + "\n")

if __name__ == "__main__":
    train_roberta_model()
