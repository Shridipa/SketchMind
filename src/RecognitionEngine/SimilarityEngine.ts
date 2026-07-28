import { ExtendedDrawingFeatures } from './FeatureExtractor';
import { ExemplarMatchResult } from './ReferenceMatcher';
import { HardRuleResult } from './GeometryValidator';

export interface SimilarityBreakdown {
  refSimilarity: number;
  contourMatch: number;
  geometryScore: number;
  huMomentsScore: number;
  neuralSignal: number;
  weightedTotalScore: number;
}

/**
 * Stage 7: Similarity Engine
 * Combines multi-metric similarities into a unified weighted score.
 */
export function computeHybridSimilarity(
  refMatch: ExemplarMatchResult,
  hardRule: HardRuleResult,
  features: ExtendedDrawingFeatures,
  rawNeuralConfidence: number
): SimilarityBreakdown {
  const refSimilarity = refMatch.topSimilarityScore;
  const contourMatch = hardRule.passed ? 92 : Math.max(25, hardRule.structuralScore);
  const geometryScore = Math.min(100, Math.round(hardRule.structuralScore));
  const huMomentsScore = Math.min(100, Math.round(refMatch.averageTop5Similarity));
  const neuralSignal = Math.min(100, Math.round(rawNeuralConfidence));

  const weightedTotalScore = Math.round(
    refSimilarity * 0.40 +
    contourMatch * 0.20 +
    geometryScore * 0.15 +
    huMomentsScore * 0.15 +
    neuralSignal * 0.10
  );

  return {
    refSimilarity,
    contourMatch,
    geometryScore,
    huMomentsScore,
    neuralSignal,
    weightedTotalScore
  };
}
