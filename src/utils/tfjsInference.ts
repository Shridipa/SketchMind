/**
 * SketchMind — TensorFlow.js Model Loader and Real-Time Inference Engine
 * Loads the trained dual-branch model and performs real-time classification.
 */

import * as tf from '@tensorflow/tfjs';
import { Prediction } from '../types';
import { CATEGORIES } from './mlEngine';

let cachedModel: tf.LayersModel | null = null;
let isLoading = false;

export interface InferenceResult {
  predictions: Prediction[];
  topCategory: string;
  topConfidence: number;
  inferenceTimeMs: number;
}

/**
 * Loads the trained TensorFlow.js model from public/models/
 */
export async function loadTFJSModel(): Promise<tf.LayersModel | null> {
  if (cachedModel) return cachedModel;
  if (isLoading) return null;

  isLoading = true;

  try {
    // Attempt loading TF.js model artifacts if available
    const model = await tf.loadLayersModel('/models/model.json');
    cachedModel = model;
    console.log('✓ SketchMind TensorFlow.js model loaded successfully.');
    isLoading = false;
    return model;
  } catch (err) {
    // Fallback if model binary is not yet generated
    console.warn('TF.js model file not found at /models/model.json. Hybrid fallback active.');
    isLoading = false;
    return null;
  }
}

/**
 * Preprocesses a 28x28 or 64x64 grayscale array into a normalized 64x64x1 TF Tensor.
 */
export function preprocessGrayscaleToTensor(grayscale: number[][]): tf.Tensor4D {
  const size = grayscale.length;
  const flat = new Float32Array(64 * 64);

  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const srcY = Math.floor((y / 64) * size);
      const srcX = Math.floor((x / 64) * size);
      const val = grayscale[srcY]?.[srcX] || 0;
      flat[y * 64 + x] = val / 255.0;
    }
  }

  return tf.tensor4d(flat, [1, 64, 64, 1]);
}

/**
 * Preprocesses 15-dimensional feature vector into TF Tensor.
 */
export function preprocessFeatureVectorToTensor(features: number[]): tf.Tensor2D {
  const padded = new Float32Array(15);
  for (let i = 0; i < Math.min(15, features.length); i++) {
    padded[i] = features[i] || 0;
  }
  return tf.tensor2d(padded, [1, 15]);
}

/**
 * Runs real-time inference on the dual-branch model.
 */
export async function predictWithTFJSModel(
  grayscale28: number[][],
  featureVector: number[] = []
): Promise<InferenceResult | null> {
  const startTime = performance.now();
  const model = await loadTFJSModel();

  if (!model) return null;

  try {
    const imgTensor = preprocessGrayscaleToTensor(grayscale28);
    const featTensor = preprocessFeatureVectorToTensor(featureVector);

    const outputTensor = model.predict([imgTensor, featTensor]) as tf.Tensor;
    const probabilities = await outputTensor.data();

    // Clean up tensors
    imgTensor.dispose();
    featTensor.dispose();
    outputTensor.dispose();

    const predictions: Prediction[] = CATEGORIES.map((cat, idx) => ({
      className: cat,
      probability: Math.round((probabilities[idx] || 0) * 100) / 100
    })).sort((a, b) => b.probability - a.probability);

    const inferenceTimeMs = Number((performance.now() - startTime).toFixed(2));

    return {
      predictions,
      topCategory: predictions[0]?.className || 'Unknown',
      topConfidence: Math.round((predictions[0]?.probability || 0) * 100),
      inferenceTimeMs
    };
  } catch (e) {
    console.error('Inference error:', e);
    return null;
  }
}
