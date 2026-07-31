import os
import numpy as np
from sklearn.model_selection import train_test_split

# Dataset folder
DATASET_PATH = "../dataset"

# Categories (must match your labels.txt)
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

images = []
labels = []

print("=" * 50)
print("Loading Quick Draw Dataset...")
print("=" * 50)

for idx, category in enumerate(CATEGORIES):

    filename = f"full_numpy_bitmap_{category}.npy"
    path = os.path.join(DATASET_PATH, filename)

    if not os.path.exists(path):
        raise FileNotFoundError(f"Dataset not found: {path}")

    print(f"Loading {filename}")

    data = np.load(path)

    # Use only the first 10000 drawings from each category
    data = data[:10000]

    images.append(data)
    labels.extend([idx] * len(data))

# Combine all classes
images = np.concatenate(images, axis=0)
labels = np.array(labels)

print("\nDataset Loaded Successfully!")
print("Images Shape :", images.shape)
print("Labels Shape :", labels.shape)

# Reshape from (N,784) to (N,28,28,1)
images = images.reshape((-1, 28, 28, 1))

# Normalize pixel values
images = images.astype(np.float32) / 255.0

# Train-Test Split
X_train, X_test, y_train, y_test = train_test_split(
    images,
    labels,
    test_size=0.2,
    random_state=42,
    stratify=labels
)

# Create output folder
os.makedirs("processed", exist_ok=True)

# Save processed data
np.save("processed/X_train.npy", X_train)
np.save("processed/X_test.npy", X_test)
np.save("processed/y_train.npy", y_train)
np.save("processed/y_test.npy", y_test)

print("\n" + "=" * 50)
print("Preprocessing Complete!")
print("=" * 50)
print("Training Samples :", X_train.shape[0])
print("Testing Samples  :", X_test.shape[0])

print("\nFiles Saved:")
print("processed/X_train.npy")
print("processed/X_test.npy")
print("processed/y_train.npy")
print("processed/y_test.npy")