"""
SketchMind Training Pipeline — Central Configuration
=====================================================
All hyperparameters, paths, and category definitions in one place.
"""

import os

# ──────────────────────────────────────────────
# Paths
# ──────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASETS_DIR = os.path.join(BASE_DIR, "datasets")
RAW_DIR = os.path.join(DATASETS_DIR, "raw")
PROCESSED_DIR = os.path.join(DATASETS_DIR, "processed")
AUGMENTED_DIR = os.path.join(DATASETS_DIR, "augmented")
UNKNOWN_DIR = os.path.join(DATASETS_DIR, "unknown")
CHECKPOINTS_DIR = os.path.join(BASE_DIR, "checkpoints")
LOGS_DIR = os.path.join(BASE_DIR, "logs")
EMBEDDINGS_DIR = os.path.join(BASE_DIR, "embeddings")
EXPORTS_DIR = os.path.join(BASE_DIR, "exports")
TFJS_DIR = os.path.join(EXPORTS_DIR, "tfjs_model")
TFLITE_DIR = os.path.join(EXPORTS_DIR, "tflite")
SAVEDMODEL_DIR = os.path.join(EXPORTS_DIR, "savedmodel")
ONNX_DIR = os.path.join(EXPORTS_DIR, "onnx")
BENCHMARK_DIR = os.path.join(BASE_DIR, "benchmark_results")

# Ensure all directories exist
for d in [RAW_DIR, PROCESSED_DIR, AUGMENTED_DIR, UNKNOWN_DIR,
          CHECKPOINTS_DIR, LOGS_DIR, EMBEDDINGS_DIR, EXPORTS_DIR,
          TFJS_DIR, TFLITE_DIR, SAVEDMODEL_DIR, ONNX_DIR, BENCHMARK_DIR]:
    os.makedirs(d, exist_ok=True)

# ──────────────────────────────────────────────
# 20 SketchMind Categories (all in Quick, Draw!)
# ──────────────────────────────────────────────
CATEGORIES = [
    "airplane",
    "apple",
    "bicycle",
    "book",
    "car",
    "cat",
    "circle",
    "clock",
    "cloud",
    "cup",
    "fish",
    "flower",
    "house",
    "moon",
    "rocket",
    "star",
    "sun",
    "tree",
    "triangle",
    "square",
]

# Display-friendly names (used in the game UI)
CATEGORY_DISPLAY_NAMES = {
    "airplane": "Airplane",
    "apple": "Apple",
    "bicycle": "Bicycle",
    "book": "Book",
    "car": "Car",
    "cat": "Cat",
    "circle": "Circle",
    "clock": "Clock",
    "cloud": "Cloud",
    "cup": "Cup",
    "fish": "Fish",
    "flower": "Flower",
    "house": "House",
    "moon": "Moon",
    "rocket": "Rocket",
    "star": "Star",
    "sun": "Sun",
    "tree": "Tree",
    "triangle": "Triangle",
    "square": "Square",
}

NUM_CLASSES = len(CATEGORIES)         # 20
NUM_CLASSES_WITH_UNKNOWN = NUM_CLASSES + 1  # 21 (includes Unknown)
UNKNOWN_LABEL = NUM_CLASSES           # Index 20 = Unknown

# ──────────────────────────────────────────────
# Quick, Draw! Download Configuration
# ──────────────────────────────────────────────
QUICKDRAW_BASE_URL = (
    "https://storage.googleapis.com/quickdraw_dataset/full/simplified/"
)
# Max samples to load per category (None = all)
MAX_SAMPLES_PER_CATEGORY = 15000
# Only keep drawings that were recognized by the Quick Draw game
FILTER_RECOGNIZED_ONLY = True

# ──────────────────────────────────────────────
# Image Sizes
# ──────────────────────────────────────────────
IMG_SIZE_SMALL = 28
IMG_SIZE_MEDIUM = 64    # Primary training size
IMG_SIZE_LARGE = 224

# ──────────────────────────────────────────────
# Data Cleaning Thresholds
# ──────────────────────────────────────────────
CLEAN_MIN_STROKES = 1
CLEAN_MIN_POINTS_PER_DRAWING = 5
CLEAN_MIN_STROKE_LENGTH = 20.0       # Minimum total stroke length in pixels
CLEAN_MIN_BBOX_AREA = 100            # Minimum bounding box area (pixels²)
CLEAN_MAX_ASPECT_RATIO = 8.0         # Reject extreme aspect ratios
CLEAN_MIN_INK_PIXELS_28 = 8          # Minimum ink pixels on 28×28 grid

# ──────────────────────────────────────────────
# Data Augmentation Parameters
# ──────────────────────────────────────────────
AUG_ROTATION_RANGE = 15              # ±15 degrees
AUG_TRANSLATION_RANGE = 0.08         # ±8% of canvas
AUG_SCALE_MIN = 0.90
AUG_SCALE_MAX = 1.10
AUG_JITTER_SIGMA = 1.5              # Stroke point jitter (pixels)
AUG_THICKNESS_RANGE = (1.5, 3.5)    # Stroke thickness variation
AUG_MULTIPLIER = 3                   # Augment training set by 3x

# ──────────────────────────────────────────────
# Unknown Class Generation
# ──────────────────────────────────────────────
UNKNOWN_NUM_SAMPLES = 8000
UNKNOWN_TYPES = [
    "random_scribble",
    "random_lines",
    "random_curves",
    "partial_sketch",
    "noise",
    "grid_pattern",
    "spiral",
]

# ──────────────────────────────────────────────
# Feature Extraction (Branch B)
# ──────────────────────────────────────────────
FEATURE_VECTOR_DIM = 15  # Number of engineered features

# ──────────────────────────────────────────────
# Model Architecture
# ──────────────────────────────────────────────
MODEL_INPUT_SIZE = IMG_SIZE_MEDIUM    # 64×64
MODEL_CNN_FILTERS = [32, 64, 128]
MODEL_DENSE_UNITS = 256
MODEL_FEATURE_DENSE = [64, 32]
MODEL_DROPOUT_RATE = 0.3
MODEL_FEATURE_DROPOUT = 0.2

# ──────────────────────────────────────────────
# Training Hyperparameters
# ──────────────────────────────────────────────
TRAIN_BATCH_SIZE = 128
TRAIN_EPOCHS = 50
TRAIN_LEARNING_RATE = 1e-3
TRAIN_WEIGHT_DECAY = 1e-4
TRAIN_LABEL_SMOOTHING = 0.1
TRAIN_VAL_SPLIT = 0.15               # 15% validation
TRAIN_TEST_SPLIT = 0.15              # 15% test
TRAIN_EARLY_STOPPING_PATIENCE = 8
TRAIN_LR_REDUCE_PATIENCE = 4
TRAIN_LR_REDUCE_FACTOR = 0.5
TRAIN_MIN_LR = 1e-6

# Class weight for Unknown (lower to avoid over-predicting Unknown)
UNKNOWN_CLASS_WEIGHT = 0.6

# ──────────────────────────────────────────────
# Confidence Calibration
# ──────────────────────────────────────────────
CALIBRATION_TEMP_RANGE = (0.5, 5.0)
CALIBRATION_TEMP_STEPS = 100

# ──────────────────────────────────────────────
# Inference
# ──────────────────────────────────────────────
INFERENCE_INTERVAL_MS = 100           # Predict every 100ms
INFERENCE_MAX_LATENCY_MS = 20        # Target max latency

# ──────────────────────────────────────────────
# Benchmark Acceptance Criteria
# ──────────────────────────────────────────────
BENCHMARK_TARGETS = {
    "overall_accuracy": 0.96,
    "top3_accuracy": 0.99,
    "scribble_false_positive_rate": 0.01,
    "wrong_class_false_positive_rate": 0.02,
    "avg_inference_ms": 20.0,
}
