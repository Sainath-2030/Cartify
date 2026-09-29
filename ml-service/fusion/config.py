import os

# Base Directories
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ML_SERVICE_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
ARTIFACTS_DIR = os.path.join(ML_SERVICE_DIR, "artifacts")

# Pretrained Base Model Checkpoints & Artifacts
NCF_MODEL_PATH = os.path.join(ARTIFACTS_DIR, "ncf_model.pt")
NCF_ID_MAP_PATH = os.path.join(ARTIFACTS_DIR, "ncf_id_maps.json")

CNN_MODEL_PATH = os.path.join(ARTIFACTS_DIR, "cnn_model.pt")
CNN_ID_MAP_PATH = os.path.join(ARTIFACTS_DIR, "cnn_id_map.json")
CNN_EMBEDDINGS_PATH = os.path.join(ARTIFACTS_DIR, "cnn_embeddings.npy")

GRU_MODEL_PATH = os.path.join(ARTIFACTS_DIR, "gru_model.pt")
GRU_ID_MAP_PATH = os.path.join(ARTIFACTS_DIR, "gru_id_map.json")

AUTOENCODER_MODEL_PATH = os.path.join(ARTIFACTS_DIR, "autoencoder_model.pt")
AUTOENCODER_ID_MAP_PATH = os.path.join(ARTIFACTS_DIR, "autoencoder_id_map.json")
AUTOENCODER_LATENT_PATH = os.path.join(ARTIFACTS_DIR, "autoencoder_latent_embeddings.npy")

# Attention Fusion Artifacts
FUSION_MODEL_PATH = os.path.join(ARTIFACTS_DIR, "fusion_model.pt")
FUSION_METADATA_PATH = os.path.join(ARTIFACTS_DIR, "fusion_metadata.json")

# Dimension Hyperparameters
NCF_DIM = 64          # GMF 32d + MLP 32d
CNN_DIM = 256         # ResNet18 Visual Projection
GRU_DIM = 64          # Sequential Hidden Representation
AUTOENCODER_DIM = 64  # Bottleneck CDAE Latent Representation

PROJECTION_DIM = 64   # Unified projection dimension across all 4 modalities
ATTENTION_DIM = 32    # Dimension of the attention scoring query/key space
DROPOUT = 0.2

# Training Hyperparameters
BATCH_SIZE = 64
LEARNING_RATE = 0.002
WEIGHT_DECAY = 1e-4
EPOCHS = 35
RANDOM_SEED = 42

# Modality labels
MODALITIES = ["NCF", "CNN", "GRU", "AUTOENCODER"]
MODALITY_DESCRIPTIONS = {
    "NCF": "Collaborative Filtering (Long-Term User-Item Affinity)",
    "CNN": "Deep Visual Aesthetics (Visual Feature Matching)",
    "GRU": "Recurrent Session Sequence (Immediate Browsing Velocity)",
    "AUTOENCODER": "Denoising Autoencoder (Latent Interaction Manifold)"
}
