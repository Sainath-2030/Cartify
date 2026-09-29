import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from common.db import get_db_connection

from gru.config import (
    MAX_SEQUENCE_LENGTH,
    EMBEDDING_DIM,
    HIDDEN_DIM,
    NUM_LAYERS,
    BATCH_SIZE,
    LEARNING_RATE,
    EPOCHS,
    DROPOUT,
    RANDOM_SEED,
    ID_MAP_PATH,
    MODEL_PATH,
)
from gru.dataset import (
    build_id_maps,
    save_id_maps,
    prepare_session_sequences,
    train_test_split_sequences,
    GRUSessionDataset,
)
from gru.model import GRURecommender

import numpy as np
import pandas as pd

def get_interactions():
    conn = get_db_connection()
    query = """
    SELECT user_id, product_id, session_id, created_at
    FROM interactions
    WHERE user_id IS NOT NULL AND product_id IS NOT NULL AND session_id IS NOT NULL
    ORDER BY created_at
    """
    df = pd.read_sql(query, conn)
    conn.close()
    return df

def train():
    torch.manual_seed(RANDOM_SEED)
    np.random.seed(RANDOM_SEED)

    print("Fetching interactions from database...")
    interactions = get_interactions()
    
    print(f"Loaded {len(interactions)} interactions.")
    
    user_to_idx, item_to_idx = build_id_maps(interactions)
    os.makedirs(os.path.dirname(ID_MAP_PATH), exist_ok=True)
    save_id_maps(user_to_idx, item_to_idx, ID_MAP_PATH)
    
    # Num items = max idx
    num_items = len(item_to_idx)
    print(f"Unique products mapping size: {num_items}")
    
    sequences = prepare_session_sequences(interactions, item_to_idx)
    print(f"Total valid session sequences (length >= 2): {len(sequences)}")
    
    if len(sequences) == 0:
        print("No valid sequences found. Exiting.")
        return
        
    train_seqs, test_seqs = train_test_split_sequences(sequences)
    print(f"Training sequences: {len(train_seqs)}, Test sequences: {len(test_seqs)}")
    
    train_dataset = GRUSessionDataset(train_seqs, MAX_SEQUENCE_LENGTH)
    test_dataset = GRUSessionDataset(test_seqs, MAX_SEQUENCE_LENGTH)
    
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False)
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    model = GRURecommender(
        num_items=num_items,
        embedding_dim=EMBEDDING_DIM,
        hidden_dim=HIDDEN_DIM,
        num_layers=NUM_LAYERS,
        dropout=DROPOUT
    ).to(device)
    
    criterion = nn.CrossEntropyLoss(ignore_index=0) # Ignore padding
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
    
    print("Starting training...")
    best_loss = float('inf')
    
    for epoch in range(EPOCHS):
        model.train()
        total_loss = 0
        for seqs, targets, lengths in train_loader:
            seqs, targets = seqs.to(device), targets.to(device)
            lengths = torch.clamp(lengths, min=1) # Prevent 0 length
            
            optimizer.zero_grad()
            logits = model(seqs, lengths)
            loss = criterion(logits, targets)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
            
        train_loss = total_loss / len(train_loader)
        
        model.eval()
        test_loss = 0
        correct_top5 = 0
        total_test = 0
        
        with torch.no_grad():
            for seqs, targets, lengths in test_loader:
                seqs, targets = seqs.to(device), targets.to(device)
                lengths = torch.clamp(lengths, min=1)
                
                logits = model(seqs, lengths)
                loss = criterion(logits, targets)
                test_loss += loss.item()
                
                # Calculate Top-5 Hit Rate
                _, top5_indices = torch.topk(logits, k=5, dim=1)
                correct_top5 += torch.sum(top5_indices == targets.unsqueeze(1)).item()
                total_test += targets.size(0)
                
        test_loss = test_loss / len(test_loader)
        hit_rate = correct_top5 / total_test if total_test > 0 else 0
        
        print(f"Epoch {epoch+1}/{EPOCHS} | Train Loss: {train_loss:.4f} | Test Loss: {test_loss:.4f} | HR@5: {hit_rate:.4f}")
        
        if test_loss < best_loss:
            best_loss = test_loss
            torch.save(model.state_dict(), MODEL_PATH)
            
    print(f"Training completed. Best model saved to {MODEL_PATH}")

if __name__ == "__main__":
    train()
