"""
CNN config.

Cartify's `products.main_image` is a URL (see database/schema_section2.sql),
not a local file path, and images are not currently downloaded anywhere in
the codebase. This scaffold introduces a local image cache under
ml-service/data/images/ so re-runs don't re-download.
"""

IMAGE_SIZE = 224  # standard ImageNet-pretrained backbone input size
IMAGE_CACHE_DIR = "data/images"
EMBEDDING_DIM = 256  # output dim after the projection head, fed to Attention Fusion later

BACKBONE = "resnet18"  # ImageNet-pretrained; small enough to run on CPU for scaffolding
FREEZE_BACKBONE = True  # only train the projection head initially

BATCH_SIZE = 32
REQUEST_TIMEOUT_SECONDS = 10
