import torch
import torch.nn as nn

class GRURecommender(nn.Module):
    def __init__(self, num_items, embedding_dim=64, hidden_dim=64, num_layers=1, dropout=0.2, padding_idx=0):
        super(GRURecommender, self).__init__()
        # num_items includes the padding token (so vocab size is num_items + 1)
        self.item_embedding = nn.Embedding(
            num_embeddings=num_items + 1, 
            embedding_dim=embedding_dim, 
            padding_idx=padding_idx
        )
        
        self.gru = nn.GRU(
            input_size=embedding_dim, 
            hidden_size=hidden_dim, 
            num_layers=num_layers, 
            batch_first=True, 
            dropout=dropout if num_layers > 1 else 0
        )
        
        self.out_proj = nn.Linear(hidden_dim, embedding_dim, bias=False)
        self.layer_norm = nn.LayerNorm(embedding_dim)
        
    def forward(self, sequences, seq_lengths):
        # sequences: (batch_size, max_len)
        embedded = self.item_embedding(sequences) # (batch_size, max_len, embedding_dim)
        
        # Pack the sequences
        seq_lengths_cpu = seq_lengths.cpu()
        sorted_lengths, sorted_indices = torch.sort(seq_lengths_cpu, descending=True)
        sorted_embedded = embedded[sorted_indices]
        
        packed_input = nn.utils.rnn.pack_padded_sequence(sorted_embedded, sorted_lengths, batch_first=True)
        packed_output, hidden = self.gru(packed_input)
        
        # Take hidden state from last layer
        last_hidden = hidden[-1]
        
        # Unsort to restore original batch ordering
        _, unsorted_indices = torch.sort(sorted_indices)
        last_hidden = last_hidden[unsorted_indices]
        
        # Project hidden state to embedding space & normalize
        session_vec = self.layer_norm(self.out_proj(last_hidden))
        
        # Compute logits via weight-tying against candidate item embeddings
        logits = torch.matmul(session_vec, self.item_embedding.weight.t())
        return logits
