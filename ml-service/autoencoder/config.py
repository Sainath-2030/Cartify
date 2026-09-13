"""
Configuration settings for the Collaborative Denoising Autoencoder (CDAE).
"""

# Latent bottleneck dimension (for representation reduction and Attention Fusion)
LATENT_DIM = 64

# Hidden layer dimension between sparse input and bottleneck
HIDDEN_DIM = 256

# Input corruption probability for Denoising Autoencoder
DROPOUT_CORRUPTION = 0.3

# Training parameters
BATCH_SIZE = 32
LEARNING_RATE = 0.001
WEIGHT_DECAY = 1e-5
EPOCHS = 35
POSITIVE_LOSS_WEIGHT = 4.0

RANDOM_SEED = 42

# Interaction telemetry weights for building the implicit feedback interaction matrix
INTERACTION_WEIGHTS = {
    "PURCHASE": 5.0,
    "ADD_TO_CART": 4.0,
    "WISHLIST": 3.0,
    "SEARCH": 1.5,
    "VIEW": 1.0,
}

# Artifact file paths (relative to ml-service root)
ID_MAP_PATH = "artifacts/autoencoder_id_map.json"
MODEL_PATH = "artifacts/autoencoder_model.pt"
LATENT_PATH = "artifacts/autoencoder_latent_embeddings.npy"
