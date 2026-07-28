#!/usr/bin/env python3
"""
SketchMind — Feature Extractor for Branch B (MLP)
===================================================
Extracts 15 geometric and structural features from sketch images & strokes:
1. Corner count
2. Aspect ratio
3. Circularity
4. Stroke count
5. Total stroke length
6. Closed loop indicator
7. Convex hull area ratio
8-14. 7 Hu Moments
15. Symmetry ratio
"""

import os
import sys
import pickle
import numpy as np

from config import CATEGORIES, PROCESSED_DIR, FEATURE_VECTOR_DIM

try:
    from scipy.spatial import ConvexHull
except ImportError:
    ConvexHull = None


def compute_hu_moments(img: np.ndarray) -> list[float]:
    """Calculate 7 log-transformed Hu moments of a 2D grayscale image array."""
    y, x = np.nonzero(img > 20)
    if len(x) == 0:
        return [0.0] * 7

    val = img[y, x].astype(np.float64)
    m00 = np.sum(val)
    m10 = np.sum(x * val)
    m01 = np.sum(y * val)

    cx = m10 / m00
    cy = m01 / m00

    dx = x - cx
    dy = y - cy

    # Central moments
    mu20 = np.sum((dx**2) * val) / (m00**2)
    mu02 = np.sum((dy**2) * val) / (m00**2)
    mu11 = np.sum((dx * dy) * val) / (m00**2)
    mu30 = np.sum((dx**3) * val) / (m00**2.5)
    mu03 = np.sum((dy**3) * val) / (m00**2.5)
    mu21 = np.sum((dx**2 * dy) * val) / (m00**2.5)
    mu12 = np.sum((dx * dy**2) * val) / (m00**2.5)

    # Hu moments formulas
    h1 = mu20 + mu02
    h2 = (mu20 - mu02)**2 + 4 * (mu11**2)
    h3 = (mu30 - 3 * mu12)**2 + (3 * mu21 - mu03)**2
    h4 = (mu30 + mu12)**2 + (mu21 + mu03)**2
    h5 = (mu30 - 3 * mu12) * (mu30 + mu12) * ((mu30 + mu12)**2 - 3 * (mu21 + mu03)**2) + \
         (3 * mu21 - mu03) * (mu21 + mu03) * (3 * (mu30 + mu12)**2 - (mu21 + mu03)**2)
    h6 = (mu20 - mu02) * ((mu30 + mu12)**2 - (mu21 + mu03)**2) + 4 * mu11 * (mu30 + mu12) * (mu21 + mu03)
    h7 = (3 * mu21 - mu03) * (mu30 + mu12) * ((mu30 + mu12)**2 - 3 * (mu21 + mu03)**2) - \
         (mu30 - 3 * mu12) * (mu21 + mu03) * (3 * (mu30 + mu12)**2 - (mu21 + mu03)**2)

    raw_hu = [h1, h2, h3, h4, h5, h6, h7]
    # Log scale transform for numerical stability
    scaled_hu = [-np.sign(h) * np.log10(abs(h) + 1e-10) for h in raw_hu]
    return scaled_hu


def extract_single_feature_vector(img_64: np.ndarray, strokes: list = None) -> np.ndarray:
    """Extract 15-dimensional feature vector for a sample."""
    # 1. Pixel stats
    ink_y, ink_x = np.nonzero(img_64 > 30)
    if len(ink_x) == 0:
        return np.zeros(FEATURE_VECTOR_DIM, dtype=np.float32)

    w = max(1, np.max(ink_x) - np.min(ink_x))
    h = max(1, np.max(ink_y) - np.min(ink_y))
    aspect_ratio = w / h

    area = len(ink_x)
    perimeter = np.sum((img_64 > 30) & (img_64 < 200)) + 1
    circularity = min(1.5, (4 * np.PI * area) / (perimeter**2))

    # Stroke stats
    stroke_count = len(strokes) if strokes else 1
    total_length = 0.0
    corners = 0
    if strokes:
        for stk in strokes:
            for i in range(len(stk)):
                if i > 0:
                    dx = stk[i][0] - stk[i - 1][0]
                    dy = stk[i][1] - stk[i - 1][1]
                    total_length += np.sqrt(dx * dx + dy * dy)
                if 1 < i < len(stk) - 1:
                    # Simple angle turn check
                    v1 = (stk[i][0] - stk[i - 1][0], stk[i][1] - stk[i - 1][1])
                    v2 = (stk[i + 1][0] - stk[i][0], stk[i + 1][1] - stk[i][0])
                    norm1 = np.hypot(v1[0], v1[1])
                    norm2 = np.hypot(v2[0], v2[1])
                    if norm1 > 2 and norm2 > 2:
                        dot = (v1[0] * v2[0] + v1[1] * v2[1]) / (norm1 * norm2)
                        if dot < 0.5:
                            corners += 1

    # Convex hull ratio
    hull_ratio = 0.5
    if ConvexHull and len(ink_x) >= 4:
        try:
            points = np.column_stack((ink_x, ink_y))
            hull = ConvexHull(points)
            hull_area = max(1.0, hull.volume)
            hull_ratio = area / hull_area
        except Exception:
            hull_ratio = 0.5

    # Closed loop (BFS outer flood fill)
    has_loop = 1.0 if (circularity > 0.4 and area > 100) else 0.0

    # Symmetry
    left_half = img_64[:, :32] > 30
    right_half = np.fliplr(img_64[:, 32:]) > 30
    sym_ratio = np.mean(left_half == right_half)

    # Hu moments
    hu = compute_hu_moments(img_64)

    features = [
        float(corners),
        float(aspect_ratio),
        float(circularity),
        float(stroke_count),
        float(total_length / 100.0),
        float(has_loop),
        float(hull_ratio),
        *hu,
        float(sym_ratio)
    ]

    return np.array(features[:FEATURE_VECTOR_DIM], dtype=np.float32)


def process_features_for_category(category: str):
    """Extract and save feature vectors for all samples in a category."""
    cat_dir = os.path.join(PROCESSED_DIR, category)
    img64_path = os.path.join(cat_dir, "clean_images_64.npy")
    strokes_path = os.path.join(cat_dir, "clean_strokes.pkl")

    if not os.path.exists(img64_path):
        return 0

    images_64 = np.load(img64_path)
    strokes_list = None
    if os.path.exists(strokes_path):
        with open(strokes_path, "rb") as f:
            strokes_list = pickle.load(f)

    vectors = []
    for i in range(len(images_64)):
        stk = strokes_list[i] if strokes_list and i < len(strokes_list) else None
        feat = extract_single_feature_vector(images_64[i], stk)
        vectors.append(feat)

    vec_arr = np.array(vectors, dtype=np.float32)
    np.save(os.path.join(cat_dir, "clean_features.npy"), vec_arr)
    return len(vec_arr)


def main():
    print("=" * 60)
    print("  SketchMind — Feature Extractor (Branch B)")
    print("=" * 60)

    total_feats = 0
    for i, cat in enumerate(CATEGORIES, 1):
        count = process_features_for_category(cat)
        total_feats += count
        print(f"[{i:2d}/{len(CATEGORIES)}] {cat:12s}: {count:,} feature vectors extracted")

    print("=" * 60)
    print(f"  Summary: {total_feats:,} feature vectors ready.")
    print("=" * 60)


if __name__ == "__main__":
    main()
