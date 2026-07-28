import { Prediction } from '../types';

export interface TieBreakerResult {
  topPredictions: Prediction[];
  targetRank: number;
  targetProbability: number;
  isAgreedWithCandidates: boolean;
  tieBreakerAdjustment: number; // -5 to +5 boost
}

/**
 * Stage 8: Neural Tie-Breaker
 * Evaluates neural predictions to break ties among close candidates without overriding hard geometry.
 */
export function evaluateNeuralTieBreaker(
  targetCategory: string,
  predictions: Prediction[],
  candidateList: string[]
): TieBreakerResult {
  if (!predictions || predictions.length === 0) {
    return {
      topPredictions: [],
      targetRank: 99,
      targetProbability: 0,
      isAgreedWithCandidates: false,
      tieBreakerAdjustment: 0
    };
  }

  const sorted = [...predictions].sort((a, b) => b.probability - a.probability);
  const targetPred = sorted.find(p => p.className.toLowerCase() === targetCategory.toLowerCase());
  const targetRank = targetPred ? sorted.indexOf(targetPred) + 1 : 99;
  const targetProbability = targetPred ? Math.round(targetPred.probability * 100) : 0;

  const top1 = sorted[0]?.className;
  const isAgreedWithCandidates = candidateList.includes(top1);

  let tieBreakerAdjustment = 0;
  if (targetRank === 1 && targetProbability > 60) {
    tieBreakerAdjustment = 5;
  } else if (targetRank <= 3 && targetProbability > 35) {
    tieBreakerAdjustment = 2;
  } else if (targetRank > 10 || targetProbability < 10) {
    tieBreakerAdjustment = -3;
  }

  return {
    topPredictions: sorted.slice(0, 5),
    targetRank,
    targetProbability,
    isAgreedWithCandidates,
    tieBreakerAdjustment
  };
}
