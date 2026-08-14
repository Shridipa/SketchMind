import os
import requests

CATEGORIES = [
    "airplane",
    "apple",
    "banana",
    "bicycle",
    "car",
    "cat",
    "dog",
    "fish",
    "flower",
    "house",
    "moon",
    "pizza",
    "star",
    "tree",
    "cup",
]

BASE_URL = (
    "https://storage.googleapis.com/"
    "quickdraw_dataset/full/numpy_bitmap/"
)

OUTPUT_DIR = "data/quickdraw/raw"

os.makedirs(OUTPUT_DIR, exist_ok=True)

for category in CATEGORIES:

    filename = f"{category}.npy"
    url = BASE_URL + filename
    output_path = os.path.join(OUTPUT_DIR, filename)

    if os.path.exists(output_path):
        print(f"[SKIP] {category}")
        continue

    print(f"[DOWNLOAD] {category}")

    response = requests.get(url, stream=True)
    response.raise_for_status()

    with open(output_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=1024 * 1024):
            if chunk:
                f.write(chunk)

    print(f"[DONE] {category}")