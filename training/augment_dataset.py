#!/usr/bin/env python3
"""
SketchMind — Data Augmenter
============================
Applies realistic human drawing variations to clean sketches:
- Random rotation (±15°)
- Random scaling (90–110%)
- Random translation (±8%)
- Stroke jitter & thickness variations
- Noise & small stroke gap simulation
"""

import os
import sys
import pickle
import numpy as np
from PIL import Image, ImageDraw

from config import (
    CATEGORIES, PROCESSED_DIR, AUGMENTED_DIR,
    AUG_ROTATION_RANGE, AUG_TRANSLATION_RANGE,
    AUG_SCALE_MIN, AUG_SCALE_MAX,
    AUG_JITTER_SIGMA, AUG_MULTIPLIER, IMG_SIZE_MEDIUM
)

try:
    from tqdm import tqdm
except ImportError:
    def tqdm(iterable, **kwargs):
        return iterable


def augment_stroke(stroke: list[tuple[int, int]],
                   angle_deg: float,
                   scale: float,
                   trans_x: float,
                   trans_y: float,
                   jitter: float) -> list[tuple[float, float]]:
    """Transform stroke coordinates using rotation, scale, translation, and jitter."""
    rad = np.radians(angle_deg)
    cos_a, sin_a = np.cos(rad), np.sin(rad)

    new_stroke = []
    for x, y in stroke:
        # Rotation around center (assuming 256 canvas originally)
        cx, cy = 128.0, 128.0
        rx = x - cx
        ry = y - cy
        rot_x = rx * cos_a - ry * sin_a + cx
        rot_y = rx * sin_a + ry * cos_a + cy

        # Scaling
        s_x = (rot_x - cx) * scale + cx
        s_y = (rot_y - cy) * scale + cy

        # Translation & Jitter
        j_x = np.random.normal(0, jitter)
        j_y = np.random.normal(0, jitter)

        final_x = s_x + trans_x + j_x
        final_y = s_y + trans_y + j_y
        new_stroke.append((final_x, final_y))

    return new_stroke


def render_augmented_strokes(strokes: list[list[tuple[float, float]]], target_size: int = 64) -> np.ndarray:
    """Render transformed stroke list to grayscale canvas."""
    img = Image.new("L", (target_size, target_size), 0)
    draw = ImageDraw.Draw(img)

    all_x = [p[0] for s in strokes for p in s]
    all_y = [p[1] for s in strokes for p in s]

    if not all_x:
        return np.zeros((target_size, target_size), dtype=np.uint8)

    min_x, max_x = min(all_x), max(all_x)
    min_y, max_y = min(all_y), max(all_y)
    bw, bh = max(1, max_x - min_x), max(1, max_y - min_y)

    padding = 6
    draw_area = target_size - 2 * padding
    scale = draw_area / max(bw, bh)
    offset_x = (target_size - bw * scale) / 2
    offset_y = (target_size - bh * scale) / 2

    lw = np.random.choice([1, 2, 3])

    for stroke in strokes:
        if len(stroke) < 2:
            continue
        pts = [((x - min_x) * scale + offset_x, (y - min_y) * scale + offset_y) for x, y in stroke]
        for i in range(len(pts) - 1):
            draw.line([pts[i], pts[i + 1]], fill=255, width=lw)

    return np.array(img, dtype=np.uint8)


def augment_category(category: str):
    """Generate augmented samples for a category."""
    cat_dir = os.path.join(PROCESSED_DIR, category)
    strokes_path = os.path.join(cat_dir, "clean_strokes.pkl")
    img64_path = os.path.join(cat_dir, "clean_images_64.npy")

    if not (os.path.exists(strokes_path) and os.path.exists(img64_path)):
        return 0

    with open(strokes_path, "rb") as f:
        strokes_list = pickle.load(f)
    clean_images = np.load(img64_path)

    aug_images = [clean_images]

    for m in range(AUG_MULTIPLIER - 1):
        gen_imgs = []
        for strokes in strokes_list:
            angle = np.random.uniform(-AUG_ROTATION_RANGE, AUG_ROTATION_RANGE)
            scale = np.random.uniform(AUG_SCALE_MIN, AUG_SCALE_MAX)
            tx = np.random.uniform(-AUG_TRANSLATION_RANGE * 256, AUG_TRANSLATION_RANGE * 256)
            ty = np.random.uniform(-AUG_TRANSLATION_RANGE * 256, AUG_TRANSLATION_RANGE * 256)

            aug_strokes = [
                augment_stroke(stk, angle, scale, tx, ty, AUG_JITTER_SIGMA)
                for stk in strokes
            ]
            img = render_augmented_strokes(aug_strokes, IMG_SIZE_MEDIUM)
            gen_imgs.append(img)

        aug_images.append(np.array(gen_imgs, dtype=np.uint8))

    full_dataset = np.concatenate(aug_images, axis=0)

    out_dir = os.path.join(AUGMENTED_DIR, category)
    os.makedirs(out_dir, exist_ok=True)
    np.save(os.path.join(out_dir, "augmented_images_64.npy"), full_dataset)

    return len(full_dataset)


def main():
    print("=" * 60)
    print("  SketchMind — Data Augmentation")
    print("=" * 60)
    os.makedirs(AUGMENTED_DIR, exist_ok=True)

    total_aug = 0
    for i, cat in enumerate(CATEGORIES, 1):
        count = augment_category(cat)
        total_aug += count
        print(f"[{i:2d}/{len(CATEGORIES)}] {cat:12s}: {count:,} total augmented samples")

    print("=" * 60)
    print(f"  Summary: {total_aug:,} augmented training images ready.")
    print("=" * 60)


if __name__ == "__main__":
    main()
