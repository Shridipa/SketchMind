import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Bug, X, Terminal, Cpu, CheckCircle, AlertCircle } from 'lucide-react';
import { DrawingFeatures, Prediction } from '../types';

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

  // Render 28x28 matrix onto a debug preview canvas
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
        // Draw inverted black stroke on white background for preview clarity
        imgData.data[idx] = 255 - val;     // R
        imgData.data[idx + 1] = 255 - val; // G
        imgData.data[idx + 2] = 255 - val; // B
        imgData.data[idx + 3] = 255;       // Alpha
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }, [grayscale28, isOpen]);

  if (!isOpen) return null;

  const targetPrediction = predictions.find(
    p => p.className.toLowerCase().trim() === targetWord.toLowerCase().trim()
  );
  const currentConfidence = targetPrediction ? Math.round(targetPrediction.probability * 100) : 0;
  const isEvaluatedTrue = currentConfidence >= targetThreshold;

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
          <span className="font-bold text-slate-200">ML Inference Pipeline Debugger</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
        {/* Section 1: Preprocessed Tensor Preview */}
        <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 flex gap-4 items-center">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              Cropped & Centered Tensor (28×28)
            </span>
            <div className="relative border border-slate-700 rounded p-1 bg-white inline-block">
              <canvas
                ref={canvasRef}
                width={28}
                height={28}
                className="w-20 h-20 image-rendering-pixelated"
              />
            </div>
          </div>

          <div className="space-y-1 text-[11px] flex-1">
            <div className="flex justify-between border-b border-slate-800/80 pb-1">
              <span className="text-slate-400">Total Ink Pixels:</span>
              <span className="font-bold text-emerald-400">{totalInkPixels}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-1">
              <span className="text-slate-400">Tensor Grid:</span>
              <span className="font-bold text-slate-200">28 × 28 grayscale</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/80 pb-1">
              <span className="text-slate-400">Polarity:</span>
              <span className="font-bold text-amber-300">White background / Ink = 255</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Debounce:</span>
              <span className="font-bold text-blue-400">250ms active</span>
            </div>
          </div>
        </div>

        {/* Section 2: Extracted Features */}
        {features && (
          <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 space-y-1.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              Extracted Geometry Metrics
            </span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Aspect Ratio:</span>
                <span className="font-bold text-cyan-300">{features.aspectRatio.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Circularity:</span>
                <span className="font-bold text-cyan-300">{features.circularity.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Density:</span>
                <span className="font-bold text-cyan-300">{(features.density * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Corners:</span>
                <span className="font-bold text-amber-400">{features.cornerCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Closed Loop:</span>
                <span className={`font-bold ${features.hasClosedLoop ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {features.hasClosedLoop ? 'YES' : 'NO'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Symm H/V:</span>
                <span className="font-bold text-purple-300">
                  {features.symmetryHorizontal.toFixed(2)} / {features.symmetryVertical.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Target Match Status */}
        <div className={`rounded-xl p-3 border flex items-center justify-between ${
          isEvaluatedTrue
            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
            : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
        }`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {isEvaluatedTrue ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              )}
              <span className="font-bold">
                Target: {targetWord} ({currentConfidence}% / {targetThreshold}%)
              </span>
            </div>
            <div className="text-[10px] opacity-80">
              Normalized match: "<span className="text-white">{targetWord.toLowerCase().trim()}</span>"
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            isEvaluatedTrue ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'
          }`}>
            {isEvaluatedTrue ? 'PASSED' : 'EVALUATING'}
          </span>
        </div>

        {/* Section 4: Top 5 Softmax Predictions */}
        <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 space-y-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
            Top 5 Softmax Predictions
          </span>
          <div className="space-y-1.5">
            {predictions.slice(0, 5).map((p, idx) => {
              const isTarget = p.className.toLowerCase().trim() === targetWord.toLowerCase().trim();
              const probPct = Math.round(p.probability * 100);

              return (
                <div key={p.className} className="flex items-center justify-between text-[11px]">
                  <span className={`flex items-center gap-1.5 ${isTarget ? 'text-blue-400 font-bold' : 'text-slate-300'}`}>
                    <span className="text-slate-500">{idx + 1}.</span>
                    {p.className}
                    {isTarget && <span className="bg-blue-900/80 text-blue-200 text-[9px] px-1 rounded">GOAL</span>}
                  </span>
                  <span className={`font-bold ${isTarget ? 'text-blue-400' : 'text-slate-400'}`}>
                    {probPct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
