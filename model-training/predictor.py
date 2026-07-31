import tensorflow as tf
import numpy as np
from PIL import Image
import os


class Predictor:

    def __init__(self):

        self.model = None
        self.labels = []

        self.load_labels()
        self.load_model()

    # -------------------------
    # Load Labels
    # -------------------------

    def load_labels(self):

        if os.path.exists("labels.txt"):

            with open("labels.txt", "r") as f:

                self.labels = [
                    line.strip().lower()
                    for line in f.readlines()
                    ]

        else:

            raise FileNotFoundError(
                "labels.txt not found."
            )

    # -------------------------
    # Load Model
    # -------------------------

    def load_model(self):

        model_path = "sketchmind_model.keras"

        if not os.path.exists(model_path):

            raise FileNotFoundError(
                "sketchmind_model.keras not found."
            )

        self.model = tf.keras.models.load_model(
            model_path
        )

    # -------------------------
    # Image Preprocessing
    # -------------------------

    def preprocess(self, image):

        image = image.convert("L")

        image = image.resize((28, 28))

        img = np.array(image)

        # White drawing on black canvas
        img = img.astype(np.float32) / 255.0

        img = np.expand_dims(img, axis=-1)

        img = np.expand_dims(img, axis=0)

        return img

    # -------------------------
    # Predict
    # -------------------------

    def predict(self, image):

        img = self.preprocess(image)

        prediction = self.model.predict(
            img,
            verbose=0
        )[0]

        index = np.argmax(prediction)

        confidence = float(prediction[index])

        label = self.labels[index].lower()

        return label, confidence