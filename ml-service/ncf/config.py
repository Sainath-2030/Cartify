"""
NCF config.

Confirmed against server/services/interactionService.js VALID_TYPES (Section
4 data pipeline audit) — these are the only interaction_type values Cartify
actually records today:

    product_view, product_click, search, category_view

There is NO cart/wishlist/purchase/rating signal yet (planned in Section 3,
not built). All four current types are browse-intent signals, not
purchase-intent — NCF trained on this data reflects "looked at", not
"wanted to buy". Re-run this once Section 3 lands and re-check
server/scripts/validateInteractions.js output before assuming these weights
are still complete.

'search' and 'category_view' rows have product_id = NULL (see
server/scripts/exportRecommendationData.js manifest) and are therefore
skipped entirely by ncf/dataset.py, which only builds pairs from rows that
have a product_id.
"""

INTERACTION_WEIGHTS = {
    "purchase": 5,
    "review": 4,
    "rating": 4,
    "cart_add": 3,
    "cart": 3,
    "wishlist_add": 3,
    "wishlist": 3,
    "product_click": 2,
    "click": 2,
    "product_view": 1,
    "view": 1,
}

# Any interaction_type not listed above still counts as a positive signal
# with this fallback weight, rather than being silently dropped.
DEFAULT_WEIGHT = 1

# Implicit-feedback negative sampling ratio (negatives per positive)
NEGATIVE_SAMPLES_PER_POSITIVE = 4

EMBEDDING_DIM_GMF = 32
EMBEDDING_DIM_MLP = 32
MLP_LAYER_SIZES = [64, 32, 16, 8]
DROPOUT = 0.2

BATCH_SIZE = 256
EPOCHS = 20
LEARNING_RATE = 1e-3
WEIGHT_DECAY = 1e-6

TRAIN_TEST_SPLIT = "leave_one_out"  # last interaction per user held out for eval
RANDOM_SEED = 42
