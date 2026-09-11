"""
Configuration settings for the GRU Sequence model.
"""

# Maximum length of interaction sequence to consider per session
MAX_SEQUENCE_LENGTH = 10

# Model architecture dimensions
EMBEDDING_DIM = 64
HIDDEN_DIM = 64
NUM_LAYERS = 1

# Training parameters
BATCH_SIZE = 64
LEARNING_RATE = 0.001
EPOCHS = 30
DROPOUT = 0.2

RANDOM_SEED = 42

# Paths
ID_MAP_PATH = "artifacts/gru_id_map.json"
MODEL_PATH = "artifacts/gru_model.pt"
