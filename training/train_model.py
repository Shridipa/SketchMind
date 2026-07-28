#!/usr/bin/env python3
"""
SketchMind — Dual-Branch Hybrid Sketch Recognition Model
==========================================================
Architecture:
- Branch A (CNN): 64×64×1 input → Conv2D/BatchNorm/Residual Blocks → GlobalAveragePooling2D
- Branch B (MLP): 15-dim feature vector input → Dense/BatchNorm → Dense
- Merged: Concatenation → Dense(128) → Dropout → Dense(21, Softmax) (20 categories + Unknown)
Target size: <10MB, <20ms inference time in TensorFlow.js.
"""

import os
import sys
import numpy as np

import tensorflow as tf
from tensorflow.keras import layers, models, optimizers, callbacks, losses

from config import (
    CATEGORIES, PROCESSED_DIR, UNKNOWN_DIR, CHECKPOINTS_DIR, LOGS_DIR,
    NUM_CLASSES_WITH_UNKNOWN, UNKNOWN_LABEL, FEATURE_VECTOR_DIM,
    IMG_SIZE_MEDIUM, TRAIN_BATCH_SIZE, TRAIN_EPOCHS, TRAIN_LEARNING_RATE,
    TRAIN_VAL_SPLIT, TRAIN_TEST_SPLIT, UNKNOWN_CLASS_WEIGHT
)


def build_dual_branch_model(input_shape=(64, 64, 1), feature_dim=15, num_classes=21) -> models.Model:
    """Build dual-branch hybrid CNN + MLP model."""
    # Branch A: Image Input (CNN)
    image_input = layers.Input(shape=input_shape, name="image_input")

    # Conv Block 1
    x = layers.Conv2D(32, (3, 3), padding="same", use_bias=False)(image_input)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.MaxPooling2D((2, 2))(x)  # 32x32

    # Residual Block 1
    res = x
    x = layers.Conv2D(32, (3, 3), padding="same", use_bias=False)(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.Conv2D(32, (3, 3), padding="same", use_bias=False)(x)
    x = layers.BatchNormalization()(x)
    x = layers.Add()([res, x])
    x = layers.Activation("relu")(x)

    # Conv Block 2
    x = layers.Conv2D(64, (3, 3), padding="same", use_bias=False)(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.MaxPooling2D((2, 2))(x)  # 16x16

    # Conv Block 3
    x = layers.Conv2D(128, (3, 3), padding="same", use_bias=False)(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.GlobalAveragePooling2D()(x)
    cnn_out = layers.Dense(256, activation="relu")(x)
    cnn_out = layers.Dropout(0.3)(cnn_out)

    # Branch B: Feature Vector Input (MLP)
    feature_input = layers.Input(shape=(feature_dim,), name="feature_input")
    fx = layers.Dense(64, use_bias=False)(feature_input)
    fx = layers.BatchNormalization()(fx)
    fx = layers.Activation("relu")(fx)
    fx = layers.Dropout(0.2)(fx)
    mlp_out = layers.Dense(32, activation="relu")(fx)

    # Fusion
    merged = layers.Concatenate()([cnn_out, mlp_out])
    dense = layers.Dense(128, activation="relu")(merged)
    dense = layers.Dropout(0.3)(dense)
    output = layers.Dense(num_classes, activation="softmax", name="softmax_output")(dense)

    model = models.Model(inputs=[image_input, feature_input], outputs=output, name="SketchMind_HybridNet")
    return model


def load_dataset() -> tuple:
    """Load images and feature vectors for all 20 categories + Unknown."""
    X_imgs, X_feats, Y_labels = [], [], []

    for label_idx, cat in enumerate(CATEGORIES):
        cat_dir = os.path.join(PROCESSED_DIR, cat)
        img_path = os.path.join(cat_dir, "clean_images_64.npy")
        feat_path = os.path.join(cat_dir, "clean_features.npy")

        if os.path.exists(img_path) and os.path.exists(feat_path):
            imgs = np.load(img_path)
            feats = np.load(feat_path)
            n = min(len(imgs), len(feats))
            X_imgs.append(imgs[:n])
            X_feats.append(feats[:n])
            Y_labels.append(np.full(n, label_idx, dtype=np.int32))

    # Load Unknown class
    unk_img_path = os.path.join(UNKNOWN_DIR, "images_64.npy")
    unk_feat_path = os.path.join(UNKNOWN_DIR, "features.npy")
    if os.path.exists(unk_img_path) and os.path.exists(unk_feat_path):
        imgs = np.load(unk_img_path)
        feats = np.load(unk_feat_path)
        n = min(len(imgs), len(feats))
        X_imgs.append(imgs[:n])
        X_feats.append(feats[:n])
        Y_labels.append(np.full(n, UNKNOWN_LABEL, dtype=np.int32))

    X_img_all = np.concatenate(X_imgs, axis=0)[..., np.newaxis].astype(np.float32) / 255.0
    X_feat_all = np.concatenate(X_feats, axis=0).astype(np.float32)
    Y_all = np.concatenate(Y_labels, axis=0)

    return X_img_all, X_feat_all, Y_all


def main():
    print("=" * 60)
    print("  SketchMind — Model Training")
    print("=" * 60)

    X_img, X_feat, Y = load_dataset()
    print(f"  Dataset Loaded: {len(Y):,} samples, {NUM_CLASSES_WITH_UNKNOWN} classes")

    # Train / Val / Test split
    from sklearn.model_selection import train_test_split
    indices = np.arange(len(Y))
    idx_train, idx_temp = train_test_split(indices, test_size=(TRAIN_VAL_SPLIT + TRAIN_TEST_SPLIT), stratify=Y, random_state=42)
    val_prop = TRAIN_VAL_SPLIT / (TRAIN_VAL_SPLIT + TRAIN_TEST_SPLIT)
    idx_val, idx_test = train_test_split(idx_temp, test_size=(1.0 - val_prop), stratify=Y[idx_temp], random_state=42)

    X_img_tr, X_feat_tr, Y_tr = X_img[idx_train], X_feat[idx_train], Y[idx_train]
    X_img_va, X_feat_va, Y_va = X_img[idx_val], X_feat[idx_val], Y[idx_val]
    X_img_te, X_feat_te, Y_te = X_img[idx_test], X_feat[idx_test], Y[idx_test]

    model = build_dual_branch_model(input_shape=(64, 64, 1), feature_dim=FEATURE_VECTOR_DIM, num_classes=NUM_CLASSES_WITH_UNKNOWN)
    model.summary()

    optimizer = optimizers.AdamW(learning_rate=TRAIN_LEARNING_RATE)
    loss_fn = losses.SparseCategoricalCrossentropy()
    model.compile(optimizer=optimizer, loss=loss_fn, metrics=["accuracy"])

    os.makedirs(CHECKPOINTS_DIR, exist_ok=True)
    best_model_path = os.path.join(CHECKPOINTS_DIR, "sketchmind_hybrid_best.keras")

    cbs = [
        callbacks.ModelCheckpoint(best_model_path, save_best_only=True, monitor="val_accuracy"),
        callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=3, min_lr=1e-6),
        callbacks.EarlyStopping(monitor="val_accuracy", patience=7, restore_best_weights=True)
    ]

    print("\n  Starting Training...")
    history = model.fit(
        x={"image_input": X_img_tr, "feature_input": X_feat_tr},
        y=Y_tr,
        validation_data=({"image_input": X_img_va, "feature_input": X_feat_va}, Y_va),
        epochs=TRAIN_EPOCHS,
        batch_size=TRAIN_BATCH_SIZE,
        callbacks=cbs
    )

    test_loss, test_acc = model.evaluate(
        {"image_input": X_img_te, "feature_input": X_feat_te},
        Y_te
    )
    print(f"\n  ✓ Training complete. Test Accuracy: {test_acc*100:.2f}%")


if __name__ == "__main__":
    main()
