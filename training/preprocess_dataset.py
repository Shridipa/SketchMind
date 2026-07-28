#!/usr/bin/env python3
"""
SketchMind — Preprocess Quick, Draw! Dataset
==============================================
Converts raw NDJSON stroke data into normalized raster images at
28×28, 64×64, and 224×224 resolutions. Preserves stroke ordering.
"""

import os
import sys
import json
import numpy as np
from pathlib import Path
from PIL import Image, ImageDraw

from config import (
    CATEGORIES, RAW_DIR, PROCESSED_DIR,
    MAX_SAMPLES_PER_CATEGORY, FILTER_RECOGNIZED_ONLY,
    IMG_SIZE_SMALL, IMG_SIZE_MEDIUM, IMG_SIZE_LARGE,
)

try:
    from tqdm import tqdm
except ImportError:
    def tqdm(iterable, **kwargs):
        return iterable


def parse_ndjson_file(filepath: str, max_samples: int | None = None,
                      recognized_only: bool = True) -> list[dict]:
    """Parse an NDJSON file and return list of drawing records."""
    drawings = []
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                continue

            if recognized_only and not record.get("recognized", False):
                continue

            drawing = record.get("drawing", [])
            if not drawing:
                continue

            drawings.append({
                "word": record.get("word", ""),
                "drawing": drawing,
                "key_id": record.get("key_id", ""),
                "countrycode": record.get("countrycode", ""),
            })

            if max_samples and len(drawings) >= max_samples:
                break

    return drawings


def strokes_to_points(drawing: list) -> list[list[tuple[int, int]]]:
    """Convert Quick Draw stroke format [[xs], [ys]] to [(x,y), ...] per stroke."""
    strokes = []
    for stroke in drawing:
        if len(stroke) < 2:
            continue
        xs, ys = stroke[0], stroke[1]
        points = list(zip(xs, ys))
        if len(points) >= 2:
            strokes.append(points)
    return strokes


def compute_bounding_box(strokes: list[list[tuple[int, int]]]) -> tuple:
    """Compute tight bounding box of all stroke points."""
    all_x = []
    all_y = []
    for stroke in strokes:
        for x, y in stroke:
            all_x.append(x)
            all_y.append(y)

    if not all_x:
        return 0, 0, 1, 1

    min_x, max_x = min(all_x), max(all_x)
    min_y, max_y = min(all_y), max(all_y)

    # Ensure non-zero dimensions
    if max_x == min_x:
        max_x = min_x + 1
    if max_y == min_y:
        max_y = min_y + 1

    return min_x, min_y, max_x, max_y


def render_strokes_to_image(
    strokes: list[list[tuple[int, int]]],
    target_size: int,
    line_width: int = 2,
    padding_ratio: float = 0.1,
) -> np.ndarray:
    """
    Render stroke data to a grayscale image of target_size × target_size.
    Centers and uniformly scales the drawing while maintaining aspect ratio.
    """
    if not strokes:
        return np.zeros((target_size, target_size), dtype=np.uint8)

    min_x, min_y, max_x, max_y = compute_bounding_box(strokes)

    bbox_w = max_x - min_x
    bbox_h = max_y - min_y

    # Uniform scaling (maintain aspect ratio)
    padding = int(target_size * padding_ratio)
    draw_area = target_size - 2 * padding
    scale = draw_area / max(bbox_w, bbox_h)

    # Center offset
    scaled_w = bbox_w * scale
    scaled_h = bbox_h * scale
    offset_x = (target_size - scaled_w) / 2
    offset_y = (target_size - scaled_h) / 2

    # Create image and draw strokes
    img = Image.new("L", (target_size, target_size), 0)
    draw = ImageDraw.Draw(img)

    # Scale line width proportionally
    if target_size <= 28:
        lw = max(1, line_width // 2)
    elif target_size <= 64:
        lw = line_width
    else:
        lw = max(2, int(line_width * target_size / 64))

    for stroke in strokes:
        if len(stroke) < 2:
            continue

        scaled_points = []
        for x, y in stroke:
            sx = (x - min_x) * scale + offset_x
            sy = (y - min_y) * scale + offset_y
            scaled_points.append((sx, sy))

        # Draw line segments
        for i in range(len(scaled_points) - 1):
            draw.line(
                [scaled_points[i], scaled_points[i + 1]],
                fill=255,
                width=lw,
            )

        # Draw circles at each point for smoother lines
        r = max(0, lw // 2 - 1)
        if r > 0:
            for px, py in scaled_points:
                draw.ellipse([px - r, py - r, px + r, py + r], fill=255)

    return np.array(img, dtype=np.uint8)


def process_category(category: str, max_samples: int | None = None) -> dict:
    """Process a single category: load NDJSON → render images at all sizes."""
    filepath = os.path.join(RAW_DIR, f"{category}.ndjson")
    if not os.path.exists(filepath):
        print(f"  ⚠ File not found: {filepath}")
        return {"count": 0}

    # Parse raw data
    drawings = parse_ndjson_file(
        filepath,
        max_samples=max_samples,
        recognized_only=FILTER_RECOGNIZED_ONLY,
    )

    if not drawings:
        print(f"  ⚠ No valid drawings found for {category}")
        return {"count": 0}

    # Prepare output arrays
    images_28 = []
    images_64 = []
    images_224 = []
    stroke_data = []  # Preserve raw strokes for feature extraction

    for record in tqdm(drawings, desc=f"  Rendering {category}", leave=False):
        strokes = strokes_to_points(record["drawing"])
        if not strokes:
            continue

        # Render at all three sizes
        img_28 = render_strokes_to_image(strokes, IMG_SIZE_SMALL, line_width=1)
        img_64 = render_strokes_to_image(strokes, IMG_SIZE_MEDIUM, line_width=2)
        img_224 = render_strokes_to_image(strokes, IMG_SIZE_LARGE, line_width=3)

        images_28.append(img_28)
        images_64.append(img_64)
        images_224.append(img_224)
        stroke_data.append(strokes)

    return {
        "count": len(images_28),
        "images_28": np.array(images_28, dtype=np.uint8),
        "images_64": np.array(images_64, dtype=np.uint8),
        "images_224": np.array(images_224, dtype=np.uint8),
        "strokes": stroke_data,
    }


def main():
    print("=" * 60)
    print("  SketchMind — Dataset Preprocessor")
    print("=" * 60)
    print(f"\n  Source: {RAW_DIR}")
    print(f"  Output: {PROCESSED_DIR}")
    print(f"  Max samples per category: {MAX_SAMPLES_PER_CATEGORY or 'all'}")
    print(f"  Image sizes: {IMG_SIZE_SMALL}, {IMG_SIZE_MEDIUM}, {IMG_SIZE_LARGE}")
    print()

    os.makedirs(PROCESSED_DIR, exist_ok=True)

    total_samples = 0
    category_counts = {}

    for i, category in enumerate(CATEGORIES, 1):
        print(f"[{i:2d}/{len(CATEGORIES)}] Processing {category}...")

        result = process_category(category, MAX_SAMPLES_PER_CATEGORY)
        count = result["count"]
        category_counts[category] = count
        total_samples += count

        if count == 0:
            print(f"  ⚠ Skipped {category} (no valid samples)")
            continue

        # Save NumPy arrays
        cat_dir = os.path.join(PROCESSED_DIR, category)
        os.makedirs(cat_dir, exist_ok=True)

        np.save(os.path.join(cat_dir, "images_28.npy"), result["images_28"])
        np.save(os.path.join(cat_dir, "images_64.npy"), result["images_64"])
        # Save 224 only if needed (large files)
        np.save(os.path.join(cat_dir, "images_224.npy"), result["images_224"])

        # Save stroke data as JSON for feature extraction
        import pickle
        with open(os.path.join(cat_dir, "strokes.pkl"), "wb") as f:
            pickle.dump(result["strokes"], f)

        print(f"  ✓ {category}: {count:,} samples saved")
        print()

    # Summary
    print("=" * 60)
    print("  Preprocessing Summary")
    print("=" * 60)
    print(f"  Total samples: {total_samples:,}")
    print()
    for cat, cnt in sorted(category_counts.items()):
        print(f"    {cat:15s}: {cnt:>7,}")
    print()


if __name__ == "__main__":
    main()
