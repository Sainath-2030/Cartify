import math
import torch
import torch.nn as nn
import torch.nn.functional as F

from fusion.config import (
    NCF_DIM,
    CNN_DIM,
    GRU_DIM,
    AUTOENCODER_DIM,
    PROJECTION_DIM,
    ATTENTION_DIM,
    DROPOUT,
)

class ModalityProjection(nn.Module):
    """Projects modality-specific embeddings to a common dimension."""
    def __init__(self, in_dim: int, out_dim: int):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_dim, out_dim),
            nn.LayerNorm(out_dim),
            nn.ReLU(),
            nn.Dropout(p=DROPOUT * 0.5),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)


class AttentionFusion(nn.Module):
    """
    Multi-Modal Attention Fusion Network (Section 9).
    Dynamically computes softmax attention weights across 4 recommendation models:
    - NCF (Collaborative Filtering)
    - CNN (Visual Product Features)
    - GRU (Sequential Session Intent)
    - Autoencoder (Latent Interaction Manifold)

    Outputs:
    - affinity_score: Sigmoid-bounded prediction [0, 1]
    - attention_weights: Normalized Softmax weights [alpha_ncf, alpha_cnn, alpha_gru, alpha_ae]
    """
    def __init__(
        self,
        ncf_dim: int = NCF_DIM,
        cnn_dim: int = CNN_DIM,
        gru_dim: int = GRU_DIM,
        ae_dim: int = AUTOENCODER_DIM,
        proj_dim: int = PROJECTION_DIM,
        att_dim: int = ATTENTION_DIM,
        dropout: float = DROPOUT,
    ):
        super().__init__()
        self.proj_dim = proj_dim
        self.att_dim = att_dim

        # 1. Modality-specific projection layers
        self.proj_ncf = ModalityProjection(ncf_dim, proj_dim)
        self.proj_cnn = ModalityProjection(cnn_dim, proj_dim)
        self.proj_gru = ModalityProjection(gru_dim, proj_dim)
        self.proj_ae = ModalityProjection(ae_dim, proj_dim)

        # 2. Context-conditioned query & key transformation
        self.query_proj = nn.Linear(proj_dim, att_dim, bias=False)
        self.key_proj = nn.Linear(proj_dim, att_dim, bias=False)

        # Modality self-salience bias network
        self.salience_net = nn.Sequential(
            nn.Linear(proj_dim, att_dim),
            nn.Tanh(),
            nn.Linear(att_dim, 1),
        )

        # 3. Prediction Head (Fused multi-modal representation -> Interaction affinity)
        self.prediction_head = nn.Sequential(
            nn.Linear(proj_dim, proj_dim),
            nn.ReLU(),
            nn.Dropout(p=dropout),
            nn.Linear(proj_dim, proj_dim // 2),
            nn.ReLU(),
            nn.Linear(proj_dim // 2, 1),
        )

        self._init_weights()

    def _init_weights(self):
        for m in self.modules():
            if isinstance(m, nn.Linear):
                nn.init.xavier_uniform_(m.weight)
                if m.bias is not None:
                    nn.init.constant_(m.bias, 0.0)

    def forward(
        self,
        ncf_feat: torch.Tensor,
        cnn_feat: torch.Tensor,
        gru_feat: torch.Tensor,
        ae_feat: torch.Tensor,
    ):
        """
        Forward pass computing attention-fused affinity score.
        Args:
            ncf_feat: (B, 64)
            cnn_feat: (B, 256)
            gru_feat: (B, 64)
            ae_feat:  (B, 64)
        Returns:
            scores: (B,) float in [0, 1]
            attention_weights: (B, 4) float summing to 1 across modalities
        """
        # 1. Project all modalities to common space (B, D)
        v_ncf = self.proj_ncf(ncf_feat)
        v_cnn = self.proj_cnn(cnn_feat)
        v_gru = self.proj_gru(gru_feat)
        v_ae  = self.proj_ae(ae_feat)

        # Stack into (B, 4, D)
        V = torch.stack([v_ncf, v_cnn, v_gru, v_ae], dim=1)

        # 2. Compute dynamic query from user/session state (NCF + GRU + AE)
        context_user = (v_ncf + v_gru + v_ae) / 3.0  # (B, D)
        query = self.query_proj(context_user).unsqueeze(1) # (B, 1, att_dim)

        # Compute keys for each modality
        keys = self.key_proj(V) # (B, 4, att_dim)

        # Scaled dot-product query-key attention: (B, 1, att_dim) x (B, att_dim, 4) -> (B, 1, 4)
        scale = math.sqrt(self.att_dim)
        qk_energy = torch.matmul(query, keys.transpose(1, 2)) / scale
        qk_energy = qk_energy.squeeze(1) # (B, 4)

        # Add modality salience energy
        salience = self.salience_net(V).squeeze(-1) # (B, 4)

        total_energy = qk_energy + salience # (B, 4)

        # 3. Softmax Attention Weights: sums to 1 across [NCF, CNN, GRU, AE]
        attention_weights = F.softmax(total_energy, dim=-1) # (B, 4)

        # 4. Fused Representation: weighted sum of projected modality vectors
        # (B, 1, 4) x (B, 4, D) -> (B, 1, D) -> (B, D)
        v_fused = torch.bmm(attention_weights.unsqueeze(1), V).squeeze(1)

        # 5. Prediction logit and Sigmoid affinity
        logits = self.prediction_head(v_fused).squeeze(-1)
        scores = torch.sigmoid(logits)

        return scores, attention_weights
