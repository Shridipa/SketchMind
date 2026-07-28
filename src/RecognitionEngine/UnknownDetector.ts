import { ExtendedDrawingFeatures } from './FeatureExtractor';
import { CandidateResult } from './CandidateGenerator';
import { HardRuleResult } from './GeometryValidator';

export interface UnknownCheckResult {
  isUnknownOrScribble: boolean;
  rejectionReason?: string;
  isTinyOrEmpty: boolean;
  isSingleLine: boolean;
  isUnrecognizedScribble: boolean;
}

/**
 * Stage 10: Unknown / Scribble Detector
 * Detects whether the drawing is a random scribble, straight line, tiny noise, or unrecognizable pattern.
 */
export function detectUnknownOrScribble(
  features: ExtendedDrawingFeatures,
  candidateRes: CandidateResult,
  hardRuleRes: HardRuleResult,
  refSimilarity: number,
  totalInkPixels28: number
): UnknownCheckResult {
  const { totalStrokeLength, boxWidth, boxHeight, strokeCount, isStraightLine } = features;

  // 1. Tiny or empty
  if (totalInkPixels28 < 15 || strokeCount === 0) {
    return {
      isUnknownOrScribble: true,
      rejectionReason: 'Canvas is empty or has insufficient ink pixels.',
      isTinyOrEmpty: true,
      isSingleLine: false,
      isUnrecognizedScribble: false
    };
  }

  // 2. Small incomplete stroke or dot
  if (totalStrokeLength < 70 || boxWidth < 25 || boxHeight < 25 || totalInkPixels28 < 25) {
    return {
      isUnknownOrScribble: true,
      rejectionReason: `Drawing too small or incomplete (${totalStrokeLength}px length, ${boxWidth}x${boxHeight}px box).`,
      isTinyOrEmpty: true,
      isSingleLine: false,
      isUnrecognizedScribble: false
    };
  }

  // 3. Single straight line
  if (isStraightLine && strokeCount === 1) {
    return {
      isUnknownOrScribble: true,
      rejectionReason: 'Single straight line detected (not a full object).',
      isTinyOrEmpty: false,
      isSingleLine: true,
      isUnrecognizedScribble: false
    };
  }

  // 4. Random scribble or non-candidate
  if (!candidateRes.isCandidate && refSimilarity < 45 && !hardRuleRes.passed) {
    return {
      isUnknownOrScribble: true,
      rejectionReason: 'Unrecognized scribble or random noise pattern.',
      isTinyOrEmpty: false,
      isSingleLine: false,
      isUnrecognizedScribble: true
    };
  }

  return {
    isUnknownOrScribble: false,
    isTinyOrEmpty: false,
    isSingleLine: false,
    isUnrecognizedScribble: false
  };
}
