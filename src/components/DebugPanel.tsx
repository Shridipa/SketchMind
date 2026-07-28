import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Bug, X, CheckCircle, AlertCircle, ShieldCheck, Layers, Lock, Unlock, Eye } from 'lucide-react';
import { DrawingFeatures, Prediction } from '../types';
import { evaluateDecisionEngine, RecognitionDecision, OBJECT_PROFILES } from '../utils/mlEngine';

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
  grayscale28: number[][];
  features: DrawingFeatures | null;
  totalInkPixels: number;
  predictions: Prediction[];
  targetWord: string;
  targetThreshold: number;
}

export default function DebugPanel({
  isOpen,
  onClose,
  grayscale28,
  features,
  totalInkPixels,
  predictions,
  targetWord,
  targetThreshold
}: DebugPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !grayscale28 || grayscale28.length !== 28) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.createImageData(28, 28);
    for (let y = 0; y < 28; y++) {
      for (let x = 0; x < 28; x++) {
        const val = grayscale28[y]?.[x] || 0;
        const idx = (y * 28 + x) * 4;
        imgData.data[idx] = 255 - val;
        imgData.data[idx + 1] = 255 - val;
        imgData.data[idx + 2] = 255 - val;
        imgData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }, [grayscale28, isOpen]);

  if (!isOpen) return null;

  const targetPrediction = predictions.find(
    p => p.className.toLowerCase().trim() === targetWord.toLowerCase().trim()
  );
  const tfConfidence = targetPrediction ? Math.round(targetPrediction.probability * 100) : 0;

  const decision: RecognitionDecision = features
    ? evaluateDecisionEngine(targetWord, features, totalInkPixels, tfConfidence, targetThreshold, grayscale28)
    : {
        targetWord,
        categoryType: 'simple',
        recognitionState: 'EMPTY_CANVAS',
        stateMessage: 'Start drawing...',
        isLocked: true,
        geometryScore: 0,
        featureScore: 0,
        shapeSimilarity: 0,
        mlConfidence: tfConfidence,
        strokeQuality: 0,
        structuralPassed: false,
        missingFeatures: ['Awaiting drawing...'],
        totalStrokeLength: 0,
        boxWidth: 0,
        boxHeight: 0,
        finalScore: 0,
        targetThreshold,
        isSuccess: false,
        essentialMatched: false,
        primaryReason: 'Awaiting drawing...'
      };

  const profile = OBJECT_PROFILES[targetWord] || OBJECT_PROFILES['Cup'];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed bottom-4 right-4 z-50 w-96 bg-slate-900/95 backdrop-blur-xl text-slate-100 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden font-mono text-xs"
    >
      {/* Panel Header */}
      <div className="bg-slate-800/90 px-4 py-2.5 flex items-center justify-between border-b border-slate-700/80">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-slate-200">Recognition Decision Engine</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3.5 max-h-[80vh] overflow-y-auto">
        {/* Stage 1: Recognition State Machine */}
        <div className={`rounded-xl p-3 border space-y-2 ${
          decision.isLocked
            ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
            : decision.isSuccess
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
            : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              State Machine Status
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                decision.isLocked
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {decision.recognitionState}
              </span>
              {decision.isLocked ? (
                <Lock className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </div>
          </div>

          <div className="text-[11px] font-medium bg-slate-950/60 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Message:</span>
            <span className="text-slate-200 font-bold">{decision.stateMessage}</span>
          </div>

          {/* Drawing Metrics */}
          <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
            <div className="bg-slate-950/50 p-1.5 rounded border border-slate-800/80 flex justify-between">
              <span className="text-slate-400">Stroke Length:</span>
              <span className={`font-bold ${decision.totalStrokeLength >= profile.minimumStrokeLength ? 'text-emerald-400' : 'text-amber-400'}`}>
                {decision.totalStrokeLength} / {profile.minimumStrokeLength}px
              </span>
            </div>
            <div className="bg-slate-950/50 p-1.5 rounded border border-slate-800/80 flex justify-between">
              <span className="text-slate-400">Box Dimensions:</span>
              <span className={`font-bold ${decision.boxWidth >= profile.minimumBoxWidth && decision.boxHeight >= profile.minimumBoxHeight ? 'text-emerald-400' : 'text-amber-400'}`}>
                {decision.boxWidth}×{decision.boxHeight}px
              </span>
            </div>
            <div className="bg-slate-950/50 p-1.5 rounded border border-slate-800/80 flex justify-between">
              <span className="text-slate-400">Ink Pixels:</span>
              <span className={`font-bold ${totalInkPixels >= profile.minimumInkPixels ? 'text-emerald-400' : 'text-amber-400'}`}>
                {totalInkPixels} / {profile.minimumInkPixels}px
              </span>
            </div>
            <div className="bg-slate-950/50 p-1.5 rounded border border-slate-800/80 flex justify-between">
              <span className="text-slate-400">Straight Line:</span>
              <span className={`font-bold ${features?.isStraightLine ? 'text-rose-400' : 'text-emerald-400'}`}>
                {features?.isStraightLine ? 'YES (REJECTED)' : 'NO'}
              </span>
            </div>
          </div>
        </div>

        {/* Tensor Preview */}
        <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 flex gap-4 items-center">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              Centered Grid (28×28)
            </span>
            <div className="relative border border-slate-700 rounded p-1 bg-white inline-block">
              <canvas
                ref={canvasRef}
                width={28}
                height={28}
                className="w-16 h-16 image-rendering-pixelated"
              />
            </div>
          </div>

          <div className="space-y-1 text-[11px] flex-1">
            <div className="flex justify-between border-b border-slate-800/80 pb-1">
              <span className="text-slate-400">Target Object:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-cyan-300">{targetWord}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase font-semibold">
                  {decision.categoryType}
                </span>
              </div>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-1">
              <span className="text-slate-400">TensorFlow Conf:</span>
              <span className="font-bold text-blue-400">{tfConfidence}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Target Threshold:</span>
              <span className="font-bold text-amber-300">{targetThreshold}%</span>
            </div>
          </div>
        </div>

        {/* Stage 2: Structural Validation Gatekeeper */}
        <div className={`rounded-xl p-3 border space-y-1.5 ${
          decision.structuralPassed
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
            : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
              <ShieldCheck className={`w-3.5 h-3.5 ${decision.structuralPassed ? 'text-emerald-400' : 'text-rose-400'}`} />
              Stage 2: Structural Gatekeeper
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              decision.structuralPassed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {decision.structuralPassed ? 'PASSED' : 'FAILED'}
            </span>
          </div>

          {!decision.structuralPassed && decision.missingFeatures.length > 0 && (
            <div className="mt-1 pt-1 border-t border-rose-800/50 space-y-0.5">
              <span className="text-[10px] text-rose-300 font-semibold block">Missing Required Features:</span>
              <ul className="list-disc list-inside text-[10px] text-rose-200/90 pl-1 space-y-0.5">
                {decision.missingFeatures.map((feat, i) => (
                  <li key={i}>{feat}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Multi-Signal Score Breakdown */}
        <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center border-b border-slate-800 pb-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3 text-purple-400" /> Multi-Signal Score Breakdown
            </span>
            <span className="text-[10px] text-slate-500">Weight</span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">TensorFlow Confidence</span>
              <div className="flex gap-2 items-center">
                <span className="text-[10px] text-slate-500">35%</span>
                <span className="font-bold text-blue-400">{decision.mlConfidence}%</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-300">Structural Feature Check</span>
              <div className="flex gap-2 items-center">
                <span className="text-[10px] text-slate-500">30%</span>
                <span className="font-bold text-cyan-400">{decision.featureScore}%</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-300">Shape Similarity</span>
              <div className="flex gap-2 items-center">
                <span className="text-[10px] text-slate-500">20%</span>
                <span className="font-bold text-purple-400">{decision.shapeSimilarity}%</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-300">Geometry Score</span>
              <div className="flex gap-2 items-center">
                <span className="text-[10px] text-slate-500">10%</span>
                <span className="font-bold text-emerald-400">{decision.geometryScore}%</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-300">Stroke Quality</span>
              <div className="flex gap-2 items-center">
                <span className="text-[10px] text-slate-500">5%</span>
                <span className="font-bold text-amber-400">{decision.strokeQuality}%</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-1 border-t border-slate-800 font-bold">
              <span className="text-white">Final Decision Score</span>
              <span className={decision.isSuccess ? 'text-emerald-400' : 'text-amber-400'}>
                {decision.finalScore}%
              </span>
            </div>
          </div>
        </div>

        {/* Decision Banner */}
        <div className={`rounded-xl p-3 border space-y-1 ${
          decision.isSuccess
            ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
            : 'bg-slate-950/80 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold">
              {decision.isSuccess ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              )}
              <span>Decision: {decision.isSuccess ? 'SUCCESS' : 'EVALUATING'}</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              decision.isSuccess ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              {decision.isSuccess ? 'ACCEPTED' : 'IN PROGRESS'}
            </span>
          </div>

          <div className="text-[10px] text-slate-400 leading-snug">
            Reason: <span className="text-slate-200 font-medium">{decision.primaryReason}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
