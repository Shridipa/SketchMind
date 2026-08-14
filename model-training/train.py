import os
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models


# ============================================================
# PATH CONFIGURATION
# ============================================================

PROJECT_ROOT = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

PROCESSED_PATH = os.path.join(
    PROJECT_ROOT,
    "model-training",
    "processed"
)

MODEL_PATH = os.path.join(
    PROJECT_ROOT,
    "model-training",
    "models"
)

os.makedirs(MODEL_PATH, exist_ok=True)


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 60)
print("Loading processed Quick Draw dataset...")
print("=" * 60)

X_train_path = os.path.join(
    PROCESSED_PATH,
    "X_train.npy"
)

X_test_path = os.path.join(
    PROCESSED_PATH,
    "X_test.npy"
)

y_train_path = os.path.join(
    PROCESSED_PATH,
    "y_train.npy"
)

y_test_path = os.path.join(
    PROCESSED_PATH,
    "y_test.npy"
)

X_train = np.load(X_train_path)
X_test = np.load(X_test_path)

y_train = np.load(y_train_path)
y_test = np.load(y_test_path)

print("\nDataset loaded successfully!")

print("X_train:", X_train.shape)
print("X_test :", X_test.shape)
print("y_train:", y_train.shape)
print("y_test :", y_test.shape)


# ============================================================
# NUMBER OF CLASSES
# ============================================================

labels_path = os.path.join(
    PROCESSED_PATH,
    "labels.txt"
)

if os.path.exists(labels_path):

    with open(
        labels_path,
        "r",
        encoding="utf-8"
    ) as f:

        class_names = [
            line.strip()
            for line in f
            if line.strip()
        ]

else:

    # Fallback: infer number of classes
    num_classes = len(
        np.unique(y_train)
    )

    class_names = [
        str(i)
        for i in range(num_classes)
    ]

num_classes = len(class_names)

print("\nNumber of classes:", num_classes)

print("\nClasses:")

for index, name in enumerate(class_names):
    print(f"{index:2d} -> {name}")


# ============================================================
# MODEL
# ============================================================

print("\n" + "=" * 60)
print("Building CNN...")
print("=" * 60)

model = models.Sequential([
    
    layers.Input(
        shape=(28, 28, 1)
    ),

    layers.Conv2D(
        32,
        (3, 3),
        activation="relu",
        padding="same"
    ),

    layers.MaxPooling2D(
        (2, 2)
    ),

    layers.Conv2D(
        64,
        (3, 3),
        activation="relu",
        padding="same"
    ),

    layers.MaxPooling2D(
        (2, 2)
    ),

    layers.Conv2D(
        128,
        (3, 3),
        activation="relu",
        padding="same"
    ),

    layers.MaxPooling2D(
        (2, 2)
    ),

    layers.Flatten(),

    layers.Dense(
        256,
        activation="relu"
    ),

    layers.Dropout(
        0.4
    ),

    layers.Dense(
        num_classes,
        activation="softmax"
    )
])


# ============================================================
# COMPILE
# ============================================================

model.compile(
    optimizer=tf.keras.optimizers.Adam(
        learning_rate=0.001
    ),

    loss="sparse_categorical_crossentropy",

    metrics=["accuracy"]
)


# ============================================================
# MODEL SUMMARY
# ============================================================

model.summary()


# ============================================================
# CALLBACKS
# ============================================================

best_model_path = os.path.join(
    MODEL_PATH,
    "quickdraw_best.keras"
)

final_model_path = os.path.join(
    MODEL_PATH,
    "quickdraw_model.keras"
)

callbacks = [

    tf.keras.callbacks.ModelCheckpoint(
        best_model_path,
        monitor="val_accuracy",
        save_best_only=True,
        verbose=1
    ),

    tf.keras.callbacks.EarlyStopping(
        monitor="val_accuracy",
        patience=5,
        restore_best_weights=True,
        verbose=1
    ),

    tf.keras.callbacks.ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.5,
        patience=2,
        min_lr=1e-6,
        verbose=1
    )
]


# ============================================================
# TRAIN
# ============================================================

print("\n" + "=" * 60)
print("Starting training...")
print("=" * 60)

history = model.fit(
    X_train,
    y_train,

    validation_split=0.1,

    epochs=25,

    batch_size=128,

    callbacks=callbacks,

    shuffle=True,

    verbose=1
)


# ============================================================
# EVALUATE
# ============================================================

print("\n" + "=" * 60)
print("Evaluating model...")
print("=" * 60)

test_loss, test_accuracy = model.evaluate(
    X_test,
    y_test,
    verbose=1
)

print("\nTest Loss:", test_loss)
print("Test Accuracy:", test_accuracy)


# ============================================================
# SAVE FINAL MODEL
# ============================================================

model.save(
    final_model_path
)

print("\nFinal model saved:")
print(final_model_path)


# ============================================================
# SAVE CLASS NAMES
# ============================================================

class_names_path = os.path.join(
    MODEL_PATH,
    "class_names.json"
)

with open(
    class_names_path,
    "w",
    encoding="utf-8"
) as f:

    json.dump(
        class_names,
        f,
        indent=4
    )

print("Class names saved:")
print(class_names_path)


# ============================================================
# SAVE TRAINING HISTORY
# ============================================================

history_path = os.path.join(
    MODEL_PATH,
    "training_history.json"
)

history_data = {
    key: [
        float(value)
        for value in values
    ]

    for key, values
    in history.history.items()
}

with open(
    history_path,
    "w",
    encoding="utf-8"
) as f:

    json.dump(
        history_data,
        f,
        indent=4
    )

print("Training history saved:")
print(history_path)


# ============================================================
# FINAL OUTPUT
# ============================================================

print("\n" + "=" * 60)
print("TRAINING COMPLETE!")
print("=" * 60)

print(f"\nTest Accuracy: {test_accuracy * 100:.2f}%")

print("\nBest model:")
print(best_model_path)

print("\nFinal model:")
print(final_model_path)

print("\nClasses:")
for index, name in enumerate(class_names):
    print(f"{index:2d} -> {name}")

print("\n" + "=" * 60)
