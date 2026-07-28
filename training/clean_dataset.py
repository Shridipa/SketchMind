#!/usr/bin/env python3
"""
SketchMind — Clean Quick, Draw! Dataset
========================================
Automatic quality scoring and cleaning for stroke and image data:
- Removes empty/corrupted sketches
- Filters out extremely tiny doodles or single accidental taps
- Rejects drawings with almost no ink or extreme aspect ratios
- Keeps messy human drawings while removing low-quality noise
"""

import os
import sys
import pickle
import numpy as np
from pathlib import Path

from config import (
    CATEGORIES, PROCESSED_DIR,
    CLEAN_MIN_STROKES, CLEAN_MIN_POINTS_PER_DRAWING,
    CLEAN_MIN_STROKE_LENGTH, CLEAN_MIN_BBOX_AREA,
    CLEAN_MAX_ASPECT_RATIO, CLEAN_MIN_INK_PIXELS_28
)

try:
    from tqdm import tqdm
except ImportError:
    def tqdm(iterable, **kwargs):
        return iterable


def compute_stroke_metrics(strokes: list[list[tuple[int, int]]]) -> dict:
    """Calculate physical and stroke quality metrics from raw stroke points."""
    if not strokes:
        return {
            "total_points": 0,
            "total_length": 0.0,
            "stroke_count": 0,
            "bbox_area": 0,
            "aspect_ratio": 1.0,
            "valid": False
        }

    total_points = 0
    total_length = 0.0
    all_x, all_y = [], []

    for stroke in strokes:
        total_points += len(stroke)
        for i in range(len(stroke)):
            x, y = stroke[i]
            all_x.append(x)
            all_y.append(y)
            if i > 0:
                prev_x, prev_y = stroke[i - 1]
                dx = x - prev_x
                dy = y - prev_y
                total_length += np.sqrt(dx * dx + dy * dy)

    if not all_x:
        return {
            "total_points": 0,
            "total_length": 0.0,
            "stroke_count": 0,
            "bbox_area": 0,
            "aspect_ratio": 1.0,
            "valid": False
        }

    min_x, max_x = min(all_x), max(all_x)
    min_y, max_y = min(all_y), max(all_y)

    w = max(1, max_x - min_x)
    h = max(1, max_y - min_y)
    bbox_area = w * h
    aspect_ratio = max(w / h, h / w)

    return {
        "total_points": total_points,
        "total_length": total_length,
        "stroke_count": len(strokes),
        "bbox_area": bbox_area,
        "aspect_ratio": aspect_ratio,
        "valid": True
    }


def evaluate_sample_quality(metrics: dict, img_28: np.ndarray) -> tuple[bool, str]:
    """
    Score quality of a sketch sample.
    Returns (keep: bool, reason: str).
    """
    if not metrics["valid"]:
        return False, "invalid_strokes"

    if metrics["stroke_count"] < CLEAN_MIN_STROKES:
        return False, "no_strokes"

    if metrics["total_points"] < CLEAN_MIN_POINTS_PER_DRAWING:
        return False, "too_few_points"

    if metrics["total_length"] < CLEAN_MIN_STROKE_LENGTH:
        return False, "stroke_length_too_short"

    if metrics["bbox_area"] < CLEAN_MIN_BBOX_AREA:
        return False, "bbox_area_too_small"

    if metrics["aspect_ratio"] > CLEAN_MAX_ASPECT_RATIO:
        return False, "extreme_aspect_ratio"

    # Check ink pixel count on 28x28 grid
    ink_pixels = np.sum(img_28 > 40)
    if ink_pixels < CLEAN_MIN_INK_PIXELS_28:
        return False, "insufficient_ink"

    return True, "passed"


def clean_category_data(category: str) -> dict:
    """Load, filter, and save clean dataset for a category."""
    cat_dir = os.path.join(PROCESSED_DIR, category)
    img28_path = os.path.join(cat_dir, "images_28.npy")
    img64_path = os.path.join(cat_dir, "images_64.npy")
    strokes_path = os.path.join(cat_dir, "strokes.pkl")

    if not (os.path.exists(img28_path) and os.path.exists(img64_path) and os.path.exists(strokes_path)):
        return {"total": 0, "kept": 0}

    images_28 = np.load(img28_path)
    images_64 = np.load(img64_path)
    with open(strokes_path, "rb") as f:
        strokes_list = pickle.load(f)

    n_samples = len(images_28)
    keep_indices = []
    reasons = {}

    for idx in range(n_samples):
        strokes = strokes_list[idx]
        img_28 = images_28[idx]
        metrics = compute_stroke_metrics(strokes)
        keep, reason = evaluate_sample_quality(metrics, img_28)

        if keep:
            keep_indices.append(idx)
        else:
            reasons[reason] = reasons.get(reason, 0) + 1

    clean_28 = images_28[keep_indices]
    clean_64 = images_64[keep_indices]
    clean_strokes = [strokes_list[i] for i in keep_indices]

    # Save cleaned arrays back
    np.save(os.path.join(cat_dir, "clean_images_28.npy"), clean_28)
    np.save(os.path.join(cat_dir, "clean_images_64.npy"), clean_64)
    with open(os.path.join(cat_dir, "clean_strokes.pkl"), "wb") as f:
        pickle.dump(clean_strokes, f)

    return {
        "total": n_samples,
        "kept": len(keep_indices),
        "rejected": n_samples - len(keep_indices),
        "reasons": reasons
    }


def main():
    print("=" * 60)
    print("  SketchMind — Dataset Quality Cleaner")
    print("=" * 60)

    total_input = 0
    total_kept = 0

    for i, category in enumerate(CATEGORIES, 1):
        stats = clean_category_data(category)
        n_in = stats.get("total", 0)
        n_out = stats.get("kept", 0)
        total_input += n_in
        total_kept += n_out

        pct = (n_out / n_in * 100) if n_in > 0 else 0
        print(f"[{i:2d}/{len(CATEGORIES)}] {category:12s}: {n_in:,} → {n_out:,} clean ({pct:.1f}% kept)")

    print("=" * 60)
    print(f"  Summary: {total_input:,} total → {total_kept:,} cleaned samples retained")
    print("=" * 60)


if __name__ == "__main__":
    main()
