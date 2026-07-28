export interface CalibrationResult {
  rawScore: number;
  calibratedConfidence: number;
  confidenceGrade: 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'EXCELLENT';
  temperature: number;
}

/**
 * Stage 9: Confidence Calibrator
 * Applies temperature scaling and sigmoid probability calibration to raw weighted decision scores.
 */
export function calibrateConfidence(
  rawScore: number,
  targetCategory: string,
  temperature = 1.15
): CalibrationResult {
  // Temperature scaling transform
  const logits = (rawScore - 50) / (10 * temperature);
  const calibratedSigmoid = 1 / (1 + Math.exp(-logits));
  const calibratedConfidence = Math.min(100, Math.max(0, Math.round(calibratedSigmoid * 100)));

  let confidenceGrade: 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'EXCELLENT' = 'VERY_LOW';

  if (calibratedConfidence >= 85) confidenceGrade = 'EXCELLENT';
  else if (calibratedConfidence >= 72) confidenceGrade = 'HIGH';
  else if (calibratedConfidence >= 55) confidenceGrade = 'MODERATE';
  else if (calibratedConfidence >= 35) confidenceGrade = 'LOW';

  return {
    rawScore,
    calibratedConfidence,
    confidenceGrade,
    temperature
  };
}
