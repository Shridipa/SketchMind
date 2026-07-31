import * as tf from "@tensorflow/tfjs";

let model: tf.LayersModel | null = null;
let modelPromise: Promise<tf.LayersModel> | null = null;

export const LABELS = [
  "airplane",
  "apple",
  "bicycle",
  "book",
  "car",
  "cat",
  "circle",
  "clock",
  "cloud",
  "cup",
  "fish",
  "flower",
  "house",
  "moon",
  "cactus",
  "square",
  "star",
  "sun",
  "tree",
  "triangle"
];

export async function loadModel() {
  if (model) {
    return model;
  }

  if (!modelPromise) {
    console.log("Loading model...");

    modelPromise = tf.loadLayersModel("/models/model.json")
      .then((loadedModel) => {
        model = loadedModel;
        console.log("Model loaded!");
        return loadedModel;
      })
      .catch((err) => {
        modelPromise = null;
        console.error("MODEL LOAD ERROR:", err);
        throw err;
      });
  }

  return modelPromise;
}

export async function predictCanvas(
  canvas: HTMLCanvasElement
): Promise<{ label: string; confidence: number }> {

  const m = await loadModel();

  const tensor = tf.tidy(() => {

    let img = tf.browser.fromPixels(canvas, 1);

    img = tf.image.resizeBilinear(img, [28, 28]);

    img = img.toFloat().div(255);

    img = img.expandDims(0);

    return img;
  });

  const prediction = m.predict(tensor) as tf.Tensor;

  const probabilities = await prediction.data();

  tensor.dispose();
  prediction.dispose();

  let best = 0;

  for (let i = 1; i < probabilities.length; i++) {
    if (probabilities[i] > probabilities[best]) {
      best = i;
    }
  }

  return {
    label: LABELS[best],
    confidence: probabilities[best]
  };
}