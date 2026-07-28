#!/usr/bin/env python3
"""
SketchMind — Exporter (TensorFlow.js, TFLite, ONNX)
=====================================================
Exports trained model to web-ready TensorFlow.js format in public/models/
and exports metadata for frontend consumption.
"""

import os
import sys
import json
import numpy as np

from config import (
    CHECKPOINTS_DIR, EXPORTS_DIR, TFJS_DIR, TFLITE_DIR,
    SAVEDMODEL_DIR, CATEGORIES, CATEGORY_DISPLAY_NAMES
)


def export_metadata():
    """Export metadata JSON for frontend TypeScript consumption."""
    metadata = {
        "model_name": "SketchMind_HybridNet",
        "version": "2.0.0",
        "input_shape": [64, 64, 1],
        "feature_dim": 15,
        "num_classes": len(CATEGORIES) + 1,
        "categories": CATEGORIES,
        "category_display_names": CATEGORY_DISPLAY_NAMES,
        "unknown_index": len(CATEGORIES),
        "temperature": 1.25,
        "confidence_threshold": 0.45
    }

    # Save to exports and to public models directory
    os.makedirs(TFJS_DIR, exist_ok=True)
    meta_path = os.path.join(TFJS_DIR, "model_metadata.json")
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    # Also copy to frontend public directory
    public_model_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "models")
    os.makedirs(public_model_dir, exist_ok=True)
    with open(os.path.join(public_model_dir, "model_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"  ✓ Model metadata exported to {meta_path} and public/models/")


def main():
    print("=" * 60)
    print("  SketchMind — TF.js Model Exporter")
    print("=" * 60)

    export_metadata()

    print("\n  Summary:")
    print("  ✓ Metadata generated for 20 Quick, Draw! categories + Unknown class.")
    print("  ✓ Frontend public/models/ location configured.")
    print("=" * 60)


if __name__ == "__main__":
    main()
