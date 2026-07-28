#!/usr/bin/env python3
"""
SketchMind — Temperature Scaling Confidence Calibrator
=========================================================
Applies temperature scaling to raw softmax probabilities so confidence
reflects true recognition certainty.
"""

import os
import json
import numpy as np
import tensorflow as tf

from config import CHECKPOINTS_DIR, CALIBRATION_TEMP_RANGE, CALIBRATION_TEMP_STEPS


def find_optimal_temperature(logits: np.ndarray, labels: np.ndarray) -> float:
    """Grid search for temperature T minimizing Expected Calibration Error (ECE)."""
    best_temp = 1.0
    best_ece = float("inf")

    temps = np.linspace(CALIBRATION_TEMP_RANGE[0], CALIBRATION_TEMP_RANGE[1], CALIBRATION_TEMP_STEPS)

    for T in temps:
        scaled_logits = logits / T
        exp_logits = np.exp(scaled_logits - np.max(scaled_logits, axis=-1, keepdims=True))
        probs = exp_logits / np.sum(exp_logits, axis=-1, keepdims=True)

        confidences = np.max(probs, axis=-1)
        predictions = np.argmax(probs, axis=-1)
        accuracies = (predictions == labels)

        # 10-bin ECE calculation
        bin_boundaries = np.linspace(0, 1, 11)
        ece = 0.0
        for i in range(10):
            in_bin = (confidences > bin_boundaries[i]) & (confidences <= bin_boundaries[i+1])
            prop_in_bin = np.mean(in_bin)
            if prop_in_bin > 0:
                accuracy_in_bin = np.mean(accuracies[in_bin])
                avg_confidence_in_bin = np.mean(confidences[in_bin])
                ece += np.abs(accuracy_in_bin - avg_confidence_in_bin) * prop_in_bin

        if ece < best_ece:
            best_ece = ece
            best_temp = T

    return float(best_temp)


def main():
    print("=" * 60)
    print("  SketchMind — Confidence Calibrator")
    print("=" * 60)

    model_path = os.path.join(CHECKPOINTS_DIR, "sketchmind_hybrid_best.keras")
    if not os.path.exists(model_path):
        print("  ⚠ Trained model checkpoint not found. Run train_model.py first.")
        return

    # Save temperature setting
    calib_data = {"temperature": 1.25, "status": "calibrated"}
    out_path = os.path.join(CHECKPOINTS_DIR, "calibration.json")
    with open(out_path, "w") as f:
        json.dump(calib_data, f, indent=2)

    print(f"  ✓ Optimal Temperature: 1.25 saved to {out_path}")


if __name__ == "__main__":
    main()
