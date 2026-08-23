import re
import json
import os
from typing import List, Dict, Tuple, Optional
import numpy as np

def clean_contract_text(text: str) -> str:
    """
    Clean contract text while preserving legally meaningful terms, formatting hierarchy,
    and clause numbers. Does NOT remove legal stopwords or legal punctuation aggressively.
    """
    if not text or not isinstance(text, str):
        return ""
    
    # 1. Normalize line breaks and tabs
    text = text.replace('\r\n', '\n').replace('\r', '\n').replace('\t', ' ')
    
    # 2. Collapse excessive horizontal spaces (preserve single spaces)
    text = re.sub(r'[ ]{2,}', ' ', text)
    
    # 3. Normalize excessive vertical spacing (keep max 2 newlines for section separation)
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # 4. Remove unprintable/control characters
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', text)
    
    return text.strip()

def chunk_contract_text(
    text: str,
    max_words_per_chunk: int = 250,
    overlap_words: int = 50
) -> List[str]:
    """
    Splits long legal document text into overlapping paragraph/section-aware chunks.
    Prefers splitting on paragraph breaks ('\n\n' or '\n') to maintain clause context.
    
    Args:
        text: Preprocessed contract text.
        max_words_per_chunk: Approximate maximum word length per chunk.
        overlap_words: Overlap in words between consecutive chunks.
        
    Returns:
        List of text chunks representing sections of the contract.
    """
    cleaned_text = clean_contract_text(text)
    if not cleaned_text:
        return []
        
    # First attempt paragraph-based splitting
    paragraphs = [p.strip() for p in cleaned_text.split('\n\n') if p.strip()]
    
    # If no double newlines, try single line splits
    if len(paragraphs) == 1:
        paragraphs = [p.strip() for p in cleaned_text.split('\n') if p.strip()]
        
    chunks = []
    current_words = []
    
    for para in paragraphs:
        para_words = para.split()
        if not para_words:
            continue
            
        # If single paragraph exceeds max words, break it by words
        if len(para_words) > max_words_per_chunk:
            start = 0
            while start < len(para_words):
                end = min(start + max_words_per_chunk, len(para_words))
                sub_chunk = " ".join(para_words[start:end])
                chunks.append(sub_chunk)
                start += (max_words_per_chunk - overlap_words)
            continue
            
        # Accumulate paragraph words
        if len(current_words) + len(para_words) <= max_words_per_chunk:
            current_words.extend(para_words)
        else:
            if current_words:
                chunks.append(" ".join(current_words))
            # Start new chunk with overlap from previous
            overlap = current_words[-overlap_words:] if len(current_words) >= overlap_words else current_words
            current_words = overlap + para_words
            
    if current_words:
        chunks.append(" ".join(current_words))
        
    # Fallback if document was extremely short
    if not chunks:
        chunks = [cleaned_text]
        
    return chunks

class DomainLabelEncoder:
    """Manages string to integer domain label encoding based on domain_config.json."""
    
    def __init__(self, config_path: Optional[str] = None):
        if config_path is None:
            config_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)), "data", "domain_config.json"
            )
            
        with open(config_path, "r") as f:
            self.config = json.load(f)
            
        self.domains = [d["name"] for d in self.config["domains"]]
        self.label2id = {domain: idx for idx, domain in enumerate(self.domains)}
        self.id2label = {idx: domain for idx, domain in enumerate(self.domains)}
        
    @property
    def num_classes(self) -> int:
        return len(self.domains)
        
    def encode(self, domain_name: str) -> int:
        return self.label2id.get(domain_name, self.label2id["Other"])
        
    def decode(self, label_id: int) -> str:
        return self.id2label.get(label_id, "Other")

if __name__ == "__main__":
    sample = """
    EMPLOYMENT AGREEMENT
    
    THIS AGREEMENT is made between Acme Corp and John Doe.
    
    SECTION 1. POSITION
    Employee shall serve as Software Engineer.
    
    SECTION 2. COMPENSATION
    Salary shall be $120,000 per year.
    """
    cleaned = clean_contract_text(sample)
    chunks = chunk_contract_text(cleaned, max_words_per_chunk=20, overlap_words=5)
    encoder = DomainLabelEncoder()
    print("Cleaned text:", cleaned[:50])
    print(f"Generated {len(chunks)} chunks:")
    for idx, c in enumerate(chunks):
        print(f"  Chunk {idx+1}: {c}")
    print(f"Num classes: {encoder.num_classes}, Employment code: {encoder.encode('Employment')}")
