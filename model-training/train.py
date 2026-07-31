import tensorflow as tf
import numpy as np
import os

# Load processed dataset
X_train = np.load("processed/X_train.npy")
X_test = np.load("processed/X_test.npy")
y_train = np.load("processed/y_train.npy")
y_test = np.load("processed/y_test.npy")

NUM_CLASSES = 20

print("=" * 50)
print("Dataset Loaded")
print("=" * 50)

print("Training:", X_train.shape)
print("Testing :", X_test.shape)

# Build CNN
model = tf.keras.Sequential([

    tf.keras.layers.Conv2D(
        32,
        (3,3),
        activation="relu",
        input_shape=(28,28,1)
    ),

    tf.keras.layers.MaxPooling2D((2,2)),

    tf.keras.layers.Conv2D(
        64,
        (3,3),
        activation="relu"
    ),

    tf.keras.layers.MaxPooling2D((2,2)),

    tf.keras.layers.Flatten(),

    tf.keras.layers.Dense(
        128,
        activation="relu"
    ),

    tf.keras.layers.Dropout(0.3),

    tf.keras.layers.Dense(
        NUM_CLASSES,
        activation="softmax"
    )
])

model.compile(
    optimizer="adam",
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)

model.summary()

print("\nTraining...\n")

history = model.fit(
    X_train,
    y_train,
    epochs=10,
    batch_size=64,
    validation_data=(X_test, y_test)
)

print("\nEvaluating...\n")

loss, accuracy = model.evaluate(
    X_test,
    y_test,
    verbose=1
)

print("=" * 50)
print("Final Accuracy:", accuracy)
print("=" * 50)

import os

# Save Keras model (needed for TensorFlow.js LayersModel)
model.save("sketchmind_model.keras")

# Also save SavedModel if you still want it
os.makedirs("saved_model", exist_ok=True)
model.export("saved_model")

print("Both models saved successfully!")