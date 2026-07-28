#!/usr/bin/env python3
"""
SketchMind — Unknown Dataset Generator
=========================================
Generates negative/Unknown class samples:
- Random scribbles (random walk paths)
- Random lines & intersecting grids
- Random curves (Bezier noise)
- Noise, spirals, and partial unidentifiable sketches
Ensures the model outputs "Unknown" instead of forcing guesses on non-objects.
"""

import os
import sys
import numpy as np
from PIL import Image, ImageDraw

from config import (
    UNKNOWN_DIR, UNKNOWN_NUM_SAMPLES,
    IMG_SIZE_MEDIUM, FEATURE_VECTOR_DIM
)
from feature_extractor import extract_single_feature_vector


def generate_random_scribble(size: int = 64) -> np.ndarray:
    """Generate a random walk scribble."""
    img = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(img)

    num_steps = np.random.randint(20, 80)
    x, y = np.random.randint(10, size - 10), np.random.randint(10, size - 10)
    points = [(x, y)]

    for _ in range(num_steps):
        dx = np.random.randint(-12, 13)
        dy = np.random.randint(-12, 13)
        x = int(np.clip(x + dx, 5, size - 5))
        y = int(np.clip(y + dy, 5, size - 5))
        points.append((x, y))

    lw = np.random.randint(1, 4)
    for i in range(len(points) - 1):
        draw.line([points[i], points[i + 1]], fill=255, width=lw)

    return np.array(img, dtype=np.uint8)


def generate_random_lines(size: int = 64) -> np.ndarray:
    """Generate random straight intersecting lines."""
    img = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(img)

    num_lines = np.random.randint(2, 8)
    for _ in range(num_lines):
        x1, y1 = np.random.randint(0, size), np.random.randint(0, size)
        x2, y2 = np.random.randint(0, size), np.random.randint(0, size)
        lw = np.random.randint(1, 3)
        draw.line([(x1, y1), (x2, y2)], fill=255, width=lw)

    return np.array(img, dtype=np.uint8)


def generate_noise_pattern(size: int = 64) -> np.ndarray:
    """Generate random dot noise."""
    arr = np.zeros((size, size), dtype=np.uint8)
    num_dots = np.random.randint(15, 60)
    for _ in range(num_dots):
        x = np.random.randint(0, size)
        y = np.random.randint(0, size)
        r = np.random.randint(1, 3)
        arr[max(0, y-r):min(size, y+r), max(0, x-r):min(size, x+r)] = 255
    return arr


def main():
    print("=" * 60)
    print("  SketchMind — Unknown Dataset Generator")
    print("=" * 60)

    os.makedirs(UNKNOWN_DIR, exist_ok=True)
    images = []
    features = []

    generators = [generate_random_scribble, generate_random_lines, generate_noise_pattern]

    for i in range(UNKNOWN_NUM_SAMPLES):
        gen = np.random.choice(generators)
        img = gen(IMG_SIZE_MEDIUM)
        feat = extract_single_feature_vector(img)

        images.append(img)
        features.append(feat)

    img_arr = np.array(images, dtype=np.uint8)
    feat_arr = np.array(features, dtype=np.float32)

    np.save(os.path.join(UNKNOWN_DIR, "images_64.npy"), img_arr)
    np.save(os.path.join(UNKNOWN_DIR, "features.npy"), feat_arr)

    print(f"  ✓ Successfully generated {UNKNOWN_NUM_SAMPLES:,} Unknown class samples.")
    print("=" * 60)


if __name__ == "__main__":
    main()
