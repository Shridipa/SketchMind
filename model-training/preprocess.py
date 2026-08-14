import os
import numpy as np
from sklearn.model_selection import train_test_split

# ============================================================
# PATH CONFIGURATION
# ============================================================

# Project root = parent directory of model-training/
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# QuickDraw raw dataset
DATASET_PATH = os.path.join(
    PROJECT_ROOT,
    "data",
    "quickdraw",
    "raw"
)

# Processed dataset will be stored here
PROCESSED_PATH = os.path.join(
    PROJECT_ROOT,
    "model-training",
    "processed"
)

# ============================================================
# QUICK DRAW CATEGORIES
# ============================================================

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
    "cactus",
    "square",
    "star",
    "sun",
    "tree",
    "triangle"
]

# Maximum number of drawings per category
MAX_SAMPLES_PER_CLASS = 10000

# ============================================================
# LOAD DATASET
# ============================================================

images = []
labels = []

print("=" * 60)
print("Loading Quick Draw Dataset...")
print("=" * 60)

print(f"\nDataset path:")
print(DATASET_PATH)

print(f"\nNumber of categories: {len(CATEGORIES)}")
print(f"Maximum samples per category: {MAX_SAMPLES_PER_CLASS}")

# ============================================================
# LOAD EACH CATEGORY
# ============================================================

for idx, category in enumerate(CATEGORIES):

    filename = f"{category}.npy"
    path = os.path.join(DATASET_PATH, filename)

    print("\n" + "-" * 60)
    print(f"Category {idx + 1}/{len(CATEGORIES)}: {category}")
    print(f"File: {filename}")

    if not os.path.exists(path):
        raise FileNotFoundError(
            f"\nDataset file not found:\n{path}\n\n"
            f"Make sure {filename} exists inside:\n"
            f"{DATASET_PATH}"
        )

    try:
        print("Loading...")

        data = np.load(path)

        print(f"Original shape: {data.shape}")
        print(f"Original dtype: {data.dtype}")

    except Exception as e:
        raise RuntimeError(
            f"\nCould not load dataset file:\n{path}\n\n"
            f"The file may be incomplete or corrupted.\n"
            f"Original error: {e}"
        )

    # --------------------------------------------------------
    # Limit number of samples
    # --------------------------------------------------------

    if len(data) > MAX_SAMPLES_PER_CLASS:
        data = data[:MAX_SAMPLES_PER_CLASS]

    print(f"Using samples: {len(data)}")

    # --------------------------------------------------------
    # Verify shape
    # --------------------------------------------------------

    if data.ndim != 2 or data.shape[1] != 784:
        raise ValueError(
            f"\nInvalid shape for {filename}: {data.shape}\n"
            f"Expected: (N, 784)"
        )

    # Add images
    images.append(data)

    # Create numeric labels
    labels.extend([idx] * len(data))

# ============================================================
# COMBINE ALL CLASSES
# ============================================================

print("\n" + "=" * 60)
print("Combining all categories...")
print("=" * 60)

images = np.concatenate(images, axis=0)
labels = np.array(labels)

print("\nDataset Loaded Successfully!")
print("Images Shape :", images.shape)
print("Labels Shape :", labels.shape)

# ============================================================
# RESHAPE
# ============================================================

print("\nReshaping images...")

# Original:
# (N, 784)
#
# New:
# (N, 28, 28, 1)

images = images.reshape((-1, 28, 28, 1))

print("New Image Shape:", images.shape)

# ============================================================
# NORMALIZATION
# ============================================================

print("\nNormalizing pixel values...")

# uint8:
# 0 - 255
#
# float32:
# 0.0 - 1.0

images = images.astype(np.float32) / 255.0

print("Image dtype:", images.dtype)
print("Minimum pixel value:", images.min())
print("Maximum pixel value:", images.max())

# ============================================================
# TRAIN / TEST SPLIT
# ============================================================

print("\n" + "=" * 60)
print("Creating Train/Test Split...")
print("=" * 60)

X_train, X_test, y_train, y_test = train_test_split(
    images,
    labels,
    test_size=0.2,
    random_state=42,
    stratify=labels,
    shuffle=True
)

print("\nTraining samples:", X_train.shape[0])
print("Testing samples :", X_test.shape[0])

# ============================================================
# CREATE OUTPUT DIRECTORY
# ============================================================

os.makedirs(PROCESSED_PATH, exist_ok=True)

print("\nProcessed data directory:")
print(PROCESSED_PATH)

# ============================================================
# SAVE PROCESSED DATA
# ============================================================

print("\nSaving processed datasets...")

np.save(
    os.path.join(PROCESSED_PATH, "X_train.npy"),
    X_train
)

np.save(
    os.path.join(PROCESSED_PATH, "X_test.npy"),
    X_test
)

np.save(
    os.path.join(PROCESSED_PATH, "y_train.npy"),
    y_train
)

np.save(
    os.path.join(PROCESSED_PATH, "y_test.npy"),
    y_test
)

# ============================================================
# SAVE CLASS NAMES
# ============================================================

# Save the category order so the model's numeric predictions
# can later be converted back into class names.

labels_path = os.path.join(
    PROCESSED_PATH,
    "labels.txt"
)

with open(labels_path, "w", encoding="utf-8") as f:
    for category in CATEGORIES:
        f.write(category + "\n")

# ============================================================
# FINAL SUMMARY
# ============================================================

print("\n" + "=" * 60)
print("PREPROCESSING COMPLETE!")
print("=" * 60)

print("\nCategories:")
for idx, category in enumerate(CATEGORIES):
    print(f"{idx:2d} -> {category}")

print("\nFinal Dataset:")
print("X_train:", X_train.shape)
print("X_test :", X_test.shape)
print("y_train:", y_train.shape)
print("y_test :", y_test.shape)

print("\nFiles Saved:")

print(
    os.path.join(
        PROCESSED_PATH,
        "X_train.npy"
    )
)

print(
    os.path.join(
        PROCESSED_PATH,
        "X_test.npy"
    )
)

print(
    os.path.join(
        PROCESSED_PATH,
        "y_train.npy"
    )
)

print(
    os.path.join(
        PROCESSED_PATH,
        "y_test.npy"
    )
)

print(labels_path)

print("\n" + "=" * 60)
print("Ready for model training!")
print("=" * 60)

