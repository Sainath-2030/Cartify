"""
ResNet-based image feature extractor for Cartify CNN module (Section 6).
Outputs 256-dim embeddings per product image.
"""
import torch
import torch.nn as nn
import torchvision.models as models
from torchvision import transforms

EMBEDDING_DIM = 256


class ImageEmbeddingNet(nn.Module):
    """
    Pretrained ResNet18 backbone -> projection head -> 256-dim embedding.
    Backbone is frozen; only the projection head is trainable
    (fine-tuning can be enabled later once Section 6 needs it).
    """

    def __init__(self, freeze_backbone: bool = True):
        super().__init__()
        resnet = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
        # Drop the final classification layer, keep the 512-dim pooled features
        self.backbone = nn.Sequential(*list(resnet.children())[:-1])
        self.backbone_out_dim = resnet.fc.in_features  # 512 for resnet18

        if freeze_backbone:
            for param in self.backbone.parameters():
                param.requires_grad = False

        self.projection = nn.Sequential(
            nn.Linear(self.backbone_out_dim, EMBEDDING_DIM),
            nn.ReLU(),
            nn.LayerNorm(EMBEDDING_DIM),
        )

    def forward(self, x):
        with torch.no_grad() if not self.backbone.training else torch.enable_grad():
            feats = self.backbone(x)              # (B, 512, 1, 1)
        feats = torch.flatten(feats, 1)            # (B, 512)
        embedding = self.projection(feats)         # (B, 256)
        return embedding


def get_transform():
    """Standard ImageNet preprocessing pipeline."""
    return transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225],
        ),
    ])
