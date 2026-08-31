"""
Neural Collaborative Filtering (He et al., 2017): a GMF branch (element-wise
embedding product, like matrix factorization) fused with an MLP branch
(concatenated embeddings through fully-connected layers), combined at the
output layer. Produces a single implicit-feedback score per (user, item).

This module has NO dependency on Cartify's Express/React code — it only
knows about dense integer user/item indices, exactly as required by
CLAUDE.MD's "ML system should eventually be modular" rule.
"""
import torch
import torch.nn as nn

from ncf.config import EMBEDDING_DIM_GMF, EMBEDDING_DIM_MLP, MLP_LAYER_SIZES, DROPOUT


class NCF(nn.Module):
    def __init__(self, num_users: int, num_items: int,
                 gmf_dim: int = EMBEDDING_DIM_GMF,
                 mlp_dim: int = EMBEDDING_DIM_MLP,
                 mlp_layers=MLP_LAYER_SIZES,
                 dropout: float = DROPOUT):
        super().__init__()

        # GMF branch
        self.user_embedding_gmf = nn.Embedding(num_users, gmf_dim)
        self.item_embedding_gmf = nn.Embedding(num_items, gmf_dim)

        # MLP branch
        self.user_embedding_mlp = nn.Embedding(num_users, mlp_dim)
        self.item_embedding_mlp = nn.Embedding(num_items, mlp_dim)

        mlp_input_dim = mlp_dim * 2
        layers = []
        in_dim = mlp_input_dim
        for out_dim in mlp_layers:
            layers.append(nn.Linear(in_dim, out_dim))
            layers.append(nn.ReLU())
            layers.append(nn.Dropout(dropout))
            in_dim = out_dim
        self.mlp = nn.Sequential(*layers)

        # NeuMF fusion: concat(GMF output, last MLP layer output) -> single logit
        self.output_layer = nn.Linear(gmf_dim + mlp_layers[-1], 1)

        self._init_weights()

    def _init_weights(self):
        for emb in [self.user_embedding_gmf, self.item_embedding_gmf,
                    self.user_embedding_mlp, self.item_embedding_mlp]:
            nn.init.normal_(emb.weight, std=0.01)
        for layer in self.mlp:
            if isinstance(layer, nn.Linear):
                nn.init.xavier_uniform_(layer.weight)
        nn.init.xavier_uniform_(self.output_layer.weight)

    def forward(self, user_idx: torch.Tensor, item_idx: torch.Tensor) -> torch.Tensor:
        # GMF path
        gmf_user = self.user_embedding_gmf(user_idx)
        gmf_item = self.item_embedding_gmf(item_idx)
        gmf_out = gmf_user * gmf_item  # element-wise product

        # MLP path
        mlp_user = self.user_embedding_mlp(user_idx)
        mlp_item = self.item_embedding_mlp(item_idx)
        mlp_out = self.mlp(torch.cat([mlp_user, mlp_item], dim=-1))

        fused = torch.cat([gmf_out, mlp_out], dim=-1)
        logit = self.output_layer(fused).squeeze(-1)
        return torch.sigmoid(logit)

    def user_embedding(self, user_idx: torch.Tensor) -> torch.Tensor:
        """Concatenated GMF+MLP user embedding, useful for the future
        Attention Fusion stage (Section 9) which combines NCF/CNN/GRU/AE
        signals per user/item."""
        return torch.cat(
            [self.user_embedding_gmf(user_idx), self.user_embedding_mlp(user_idx)], dim=-1
        )

    def item_embedding(self, item_idx: torch.Tensor) -> torch.Tensor:
        return torch.cat(
            [self.item_embedding_gmf(item_idx), self.item_embedding_mlp(item_idx)], dim=-1
        )
