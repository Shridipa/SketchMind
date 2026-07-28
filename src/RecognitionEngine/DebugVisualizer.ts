import { ProcessedStrokes } from './StrokeProcessor';
import { MultiResGrids } from './ImageNormalizer';
import { ExtendedDrawingFeatures } from './FeatureExtractor';
import { CandidateResult } from './CandidateGenerator';
import { HardRuleResult } from './GeometryValidator';
import { ExemplarMatchResult } from './ReferenceMatcher';
import { SimilarityBreakdown } from './SimilarityEngine';
import { TieBreakerResult } from './NeuralTieBreaker';
import { CalibrationResult } from './ConfidenceCalibrator';
import { UnknownCheckResult } from './UnknownDetector';

export interface PipelineDebugReport {
  targetCategory: string;
  processedStrokes: ProcessedStrokes;
  gridsSummary: { boxWidth: number; boxHeight: number; inkPixels28: number; inkPixels224: number };
  features: ExtendedDrawingFeatures;
  candidates: CandidateResult;
  hardRule: HardRuleResult;
  refMatch: ExemplarMatchResult;
  similarityBreakdown: SimilarityBreakdown;
  neuralTieBreaker: TieBreakerResult;
  calibration: CalibrationResult;
  unknownCheck: UnknownCheckResult;
  isAccepted: boolean;
  decisionMessage: string;
  executionTimeMs: number;
}

/**
 * Stage 11: Debug Visualizer
 * Formats full diagnostic telemetry report across all 10 engine stages.
 */
export function formatDebugReport(
  targetCategory: string,
  processed: ProcessedStrokes,
  grids: MultiResGrids,
  features: ExtendedDrawingFeatures,
  candidates: CandidateResult,
  hardRule: HardRuleResult,
  refMatch: ExemplarMatchResult,
  similarityBreakdown: SimilarityBreakdown,
  neuralTieBreaker: TieBreakerResult,
  calibration: CalibrationResult,
  unknownCheck: UnknownCheckResult,
  isAccepted: boolean,
  decisionMessage: string,
  executionTimeMs: number
): PipelineDebugReport {
  return {
    targetCategory,
    processedStrokes: processed,
    gridsSummary: {
      boxWidth: grids.box.width,
      boxHeight: grids.box.height,
      inkPixels28: grids.totalInkPixels28,
      inkPixels224: grids.totalInkPixels224
    },
    features,
    candidates,
    hardRule,
    refMatch,
    similarityBreakdown,
    neuralTieBreaker,
    calibration,
    unknownCheck,
    isAccepted,
    decisionMessage,
    executionTimeMs
  };
}
