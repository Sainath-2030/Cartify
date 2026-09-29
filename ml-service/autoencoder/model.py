import torch
import torch.nn as nn

class DenoisingAutoencoder(nn.Module):
    """
    Collaborative Denoising Autoencoder (CDAE) for sparse user-item interaction reduction.
    Combines user preference embeddings with corrupted item interaction projections into a 64-dim latent bottleneck.
    Output layer has bias=False to prevent dataset-wide popularity mode collapse.
    """
    def __init__(self, num_users: int, num_items: int, hidden_dim: int = 256, latent_dim: int = 64, corruption_prob: float = 0.3):
        super(DenoisingAutoencoder, self).__init__()
        self.num_users = num_users
        self.num_items = num_items
        self.hidden_dim = hidden_dim
        self.latent_dim = latent_dim
        self.corruption_prob = corruption_prob

        # User node embedding: num_users index is used as fallback for unknown/guest users
        self.user_embedding = nn.Embedding(num_users + 1, latent_dim)
        nn.init.normal_(self.user_embedding.weight, mean=0.0, std=0.02)
        with torch.no_grad():
            self.user_embedding.weight[num_users].fill_(0.0) # neutral default for guest

        # Input corruption layer (active during training)
        self.input_dropout = nn.Dropout(p=corruption_prob)

        # Encoder Network (Item interaction projection to latent bottleneck)
        self.encoder = nn.Sequential(
            nn.Linear(num_items, hidden_dim),
            nn.Tanh(),
            nn.Dropout(p=0.1),
            nn.Linear(hidden_dim, latent_dim),
            nn.Tanh()
        )

        # Decoder Network (bias=False ensures predictions strictly stem from user latent vectors)
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, hidden_dim),
            nn.Tanh(),
            nn.Dropout(p=0.1),
            nn.Linear(hidden_dim, num_items, bias=False)
        )

    def encode(self, x: torch.Tensor, user_indices: torch.Tensor = None) -> torch.Tensor:
        """
        Encodes interaction vector + user embedding into the 64-dim latent representation.
        x: (batch_size, num_items)
        user_indices: (batch_size,) optional
        returns: (batch_size, latent_dim)
        """
        enc = self.encoder(x)
        if user_indices is not None:
            # Clamp unknown indices to fallback neutral index
            clamped_u = torch.clamp(user_indices, 0, self.num_users)
            u_emb = self.user_embedding(clamped_u)
            return enc + u_emb
        return enc

    def decode(self, latent: torch.Tensor) -> torch.Tensor:
        """
        Decodes 64-dim latent representation into reconstructed product logits.
        latent: (batch_size, latent_dim)
        returns: (batch_size, num_items) logits
        """
        return self.decoder(latent)

    def forward(self, x: torch.Tensor, user_indices: torch.Tensor = None, corrupt: bool = True):
        """
        Forward pass with input corruption for denoising.
        returns: (logits, latent)
        """
        corrupted_x = self.input_dropout(x) if (self.training and corrupt) else x
        latent = self.encode(corrupted_x, user_indices)
        logits = self.decode(latent)
        return logits, latent
