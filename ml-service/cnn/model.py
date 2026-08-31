"""
Product visual-feature extractor: ImageNet-pretrained ResNet18 backbone
(frozen by default) + a trainable projection head down to EMBEDDING_DIM.

This produces per-product visual embeddings for content-based similarity /
cold-start recommendations, and is one of the four signals the future
Attention Fusion stage (Section 9) combines with NCF, GRU, and Autoencoder
outputs. It has no knowledge of users or interactions — purely image -> vector.
"""
import torch
import torch.nn as nn
from torchvision import models

from cnn.config import EMBEDDING_DIM, FREEZE_BACKBONE


class ProductCNN(nn.Module):
    def __init__(self, embedding_dim: int = EMBEDDING_DIM, freeze_backbone: bool = FREEZE_BACKBONE):
        super().__init__()

        backbone = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
        backbone_out_dim = backbone.fc.in_features  # 512 for resnet18
        backbone.fc = nn.Identity()  # strip the ImageNet classification head
        self.backbone = backbone

        if freeze_backbone:
            for param in self.backbone.parameters():
                param.requires_grad = False

        self.projection = nn.Sequential(
            nn.Linear(backbone_out_dim, embedding_dim),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(embedding_dim, embedding_dim),
        )

    def forward(self, images: torch.Tensor) -> torch.Tensor:
        """images: (batch, 3, H, W) normalized tensor -> (batch, embedding_dim)"""
        features = self.backbone(images)
        embedding = self.projection(features)
        return nn.functional.normalize(embedding, p=2, dim=-1)  # unit-norm for cosine similarity
