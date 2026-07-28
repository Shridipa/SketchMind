import { Point, processStrokes, ProcessedStrokes } from './StrokeProcessor';
import { normalizeDrawingImages, MultiResGrids } from './ImageNormalizer';
import { extractRichFeatures, ExtendedDrawingFeatures } from './FeatureExtractor';
import { generateCandidateCategories, CandidateResult } from './CandidateGenerator';
import { validateHardGeometryRules, HardRuleResult } from './GeometryValidator';
import { matchReferenceExemplars, ExemplarMatchResult } from './ReferenceMatcher';
import { computeHybridSimilarity, SimilarityBreakdown } from './SimilarityEngine';
import { evaluateNeuralTieBreaker, TieBreakerResult } from './NeuralTieBreaker';
import { calibrateConfidence, CalibrationResult } from './ConfidenceCalibrator';
import { detectUnknownOrScribble, UnknownCheckResult } from './UnknownDetector';
import { formatDebugReport, PipelineDebugReport } from './DebugVisualizer';
import { Prediction, RecognitionState } from '../types';

export interface FinalEngineDecision {
  targetCategory: string;
  isSuccess: boolean;
  finalScore: number;
  targetThreshold: number;
  recognitionState: RecognitionState;
  stateMessage: string;
  isLocked: boolean;
  geometryScore: number;
  featureScore: number;
  shapeSimilarity: number;
  mlConfidence: number;
  strokeQuality: number;
  structuralPassed: boolean;
  missingFeatures: string[];
  smartHint?: string;
  debugReport: PipelineDebugReport;
}

/**
 * Main Modular Recognition Engine Orchestrator
 */
export function evaluatePipelineDecision(
  targetCategory: string,
  rawStrokes: Point[][],
  targetThreshold = 70,
  predictions: Prediction[] = []
): FinalEngineDecision {
  const startTime = performance.now();

  // Stage 1: Stroke Processor
  const processed = processStrokes(rawStrokes);

  // Stage 2: Image Normalizer
  const grids = normalizeDrawingImages(processed.cleanedStrokes);

  // Stage 3: Feature Extractor
  const features = extractRichFeatures(processed, grids);

  // Stage 4: Candidate Generator
  const candidates = generateCandidateCategories(targetCategory, features);

  // Stage 5: Hard Geometry Validator
  const hardRule = validateHardGeometryRules(targetCategory, features, grids.totalInkPixels28);

  // Stage 6: Reference Matcher
  const refMatch = matchReferenceExemplars(targetCategory, features, grids.grid28);

  // Stage 7: Similarity Engine
  const rawNeuralConf = predictions.find(p => p.className.toLowerCase() === targetCategory.toLowerCase())?.probability
    ? Math.round(predictions.find(p => p.className.toLowerCase() === targetCategory.toLowerCase())!.probability * 100)
    : 30;

  const similarityBreakdown = computeHybridSimilarity(refMatch, hardRule, features, rawNeuralConf);

  // Stage 8: Neural Tie Breaker
  const neuralTieBreaker = evaluateNeuralTieBreaker(targetCategory, predictions, candidates.candidateList);

  // Stage 9: Confidence Calibrator
  const rawScoreWithTie = Math.min(100, Math.max(0, similarityBreakdown.weightedTotalScore + neuralTieBreaker.tieBreakerAdjustment));
  const calibration = calibrateConfidence(rawScoreWithTie, targetCategory);

  // Stage 10: Unknown / Scribble Detector
  const unknownCheck = detectUnknownOrScribble(features, candidates, hardRule, refMatch.topSimilarityScore, grids.totalInkPixels28);

  // Final Decision Synthesis
  let isSuccess = false;
  let recognitionState: RecognitionState = 'READY_FOR_RECOGNITION';
  let stateMessage = 'Validating sketch...';
  let isLocked = false;
  let finalScore = calibration.calibratedConfidence;

  if (unknownCheck.isUnknownOrScribble) {
    isSuccess = false;
    isLocked = true;
    finalScore = Math.min(finalScore, 15);

    if (unknownCheck.isTinyOrEmpty) {
      recognitionState = 'EMPTY_CANVAS';
      stateMessage = 'Canvas empty or drawing too small. Start drawing...';
    } else if (unknownCheck.isSingleLine) {
      recognitionState = 'INSUFFICIENT_INFORMATION';
      stateMessage = 'Rejected: Single straight line detected (not a full object)';
    } else {
      recognitionState = 'INSUFFICIENT_INFORMATION';
      stateMessage = 'Rejected: Unrecognized scribble / random noise pattern';
    }
  } else {
    if (finalScore >= targetThreshold && hardRule.passed) {
      isSuccess = true;
      recognitionState = 'RECOGNIZED';
      stateMessage = `Recognized ${targetCategory}! 🎉 (${finalScore}%)`;
    } else {
      isSuccess = false;
      recognitionState = 'VALIDATING_OBJECT';
      const hintMsg = hardRule.smartHint ? ` ${hardRule.smartHint}` : '';
      stateMessage = `🎯 Almost there! (${finalScore}% / ${targetThreshold}% goal).${hintMsg}`;
      finalScore = Math.min(finalScore, Math.max(20, targetThreshold - 3));
    }
  }

  const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

  const debugReport = formatDebugReport(
    targetCategory,
    processed,
    grids,
    features,
    candidates,
    hardRule,
    refMatch,
    similarityBreakdown,
    neuralTieBreaker,
    calibration,
    unknownCheck,
    isSuccess,
    stateMessage,
    executionTimeMs
  );

  return {
    targetCategory,
    isSuccess,
    finalScore,
    targetThreshold,
    recognitionState,
    stateMessage,
    isLocked,
    geometryScore: similarityBreakdown.geometryScore,
    featureScore: hardRule.structuralScore,
    shapeSimilarity: similarityBreakdown.refSimilarity,
    mlConfidence: rawNeuralConf,
    strokeQuality: similarityBreakdown.huMomentsScore,
    structuralPassed: hardRule.passed,
    missingFeatures: hardRule.missingFeatures,
    smartHint: hardRule.smartHint,
    debugReport
  };
}
