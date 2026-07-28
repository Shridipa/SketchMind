import { ExtendedDrawingFeatures } from './FeatureExtractor';
import { REFERENCE_LIBRARY, ReferenceExemplar, calculateCosineSimilarity, calculateHuMoments } from '../utils/referenceSketches';

export interface ExemplarMatchResult {
  category: string;
  bestVariantMatch: string;
  topSimilarityScore: number;
  averageTop5Similarity: number;
  matchedExemplarCount: number;
}

/**
 * Stage 6: Reference Matcher
 * Compares player's drawing features specifically against reference exemplars of the candidate categories.
 */
export function matchReferenceExemplars(
  targetCategory: string,
  features: ExtendedDrawingFeatures,
  grid28: number[][]
): ExemplarMatchResult {
  const exemplars = REFERENCE_LIBRARY[targetCategory];
  if (!exemplars || exemplars.length === 0) {
    return {
      category: targetCategory,
      bestVariantMatch: 'Standard Template',
      topSimilarityScore: 60,
      averageTop5Similarity: 60,
      matchedExemplarCount: 0
    };
  }

  const playerHu = calculateHuMoments(grid28);

  const playerEmbedding = [
    features.aspectRatio || 1.0,
    features.circularity || 0.3,
    features.symmetryHorizontal || 0.5,
    features.symmetryVertical || 0.5,
    (features.cornerCount || 0) / 10,
    features.hasClosedLoop ? 1.0 : 0.0,
    (features.density || 0.02) * 50,
    features.topHeavyRatio || 0.5,
    features.leftHeavyRatio || 0.5,
    ((features.aspectRatio || 1.0) > 0.8 && (features.aspectRatio || 1.0) < 1.2) ? 1.0 : 0.0,
    ((features.circularity || 0.3) > 0.6) ? 1.0 : 0.0,
    ((features.symmetryHorizontal || 0.5) > 0.4) ? 1.0 : 0.0,
    (features.cornerCount === 3) ? 1.0 : 0.0,
    (features.cornerCount === 4) ? 1.0 : 0.0,
    ((features.cornerCount || 0) >= 5) ? 1.0 : 0.0,
    (features.density || 0.02) > 0.02 ? 1.0 : 0.0
  ];

  const scores: { score: number; variant: string }[] = [];

  for (const ref of exemplars) {
    const cosSim = calculateCosineSimilarity(playerEmbedding, ref.embedding);

    let featScore = 0;
    if (ref.features.aspectRatio && features.aspectRatio) {
      featScore += Math.max(0, 1 - Math.abs(ref.features.aspectRatio - features.aspectRatio));
    }
    if (ref.features.circularity && features.circularity) {
      featScore += Math.max(0, 1 - Math.abs(ref.features.circularity - features.circularity));
    }
    if (ref.features.hasClosedLoop === features.hasClosedLoop) {
      featScore += 1.0;
    }
    featScore /= 3.0;

    const matchScore = Math.round((cosSim * 0.60 + featScore * 0.40) * 100);
    scores.push({ score: matchScore, variant: ref.variantName });
  }

  scores.sort((a, b) => b.score - a.score);

  const topScore = scores[0]?.score || 50;
  const top5 = scores.slice(0, 5);
  const avgTop5 = Math.round(top5.reduce((acc, s) => acc + s.score, 0) / top5.length);

  return {
    category: targetCategory,
    bestVariantMatch: scores[0]?.variant || 'Hand-drawn pattern',
    topSimilarityScore: topScore,
    averageTop5Similarity: avgTop5,
    matchedExemplarCount: exemplars.length
  };
}
