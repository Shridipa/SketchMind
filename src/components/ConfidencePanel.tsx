import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Brain, Sparkles, CheckCircle2, Activity, Search, Target, Zap } from 'lucide-react';
import { Prediction } from '../types';

interface ConfidencePanelProps {
  predictions: Prediction[];
  targetWord: string;
  isThinking: boolean;
  totalInkPixels: number;
  targetThreshold?: number;
  partialCreditMessage?: string;
  isAdaptiveActive?: boolean;
}

export default function ConfidencePanel({
  predictions,
  targetWord,
  isThinking,
  totalInkPixels,
  targetThreshold = 65,
  partialCreditMessage = '',
  isAdaptiveActive = false
}: ConfidencePanelProps) {
  const targetPrediction = predictions.find(
    p => p.className.toLowerCase().trim() === targetWord.toLowerCase().trim()
  );
  const targetConfidence = targetPrediction ? Math.round(targetPrediction.probability * 100) : 0;
  const top4 = predictions.slice(0, 4);

  // Determine Visual Recognition Meter stage
  const getRecognitionStage = (confidence: number) => {
    if (confidence >= targetThreshold) {
      return { stage: '✅ Sketch recognized!', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    }
    if (confidence >= Math.max(50, targetThreshold - 10)) {
      return { stage: '🎯 Almost recognized...', icon: Target, color: 'text-blue-600 bg-blue-50 border-blue-200' };
    }
    if (confidence >= 35) {
      return { stage: '✨ Matching patterns...', icon: Sparkles, color: 'text-purple-600 bg-purple-50 border-purple-200' };
    }
    if (confidence >= 15) {
      return { stage: '🧠 Understanding shapes...', icon: Brain, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
    }
    return { stage: '🔍 Looking...', icon: Search, color: 'text-slate-600 bg-slate-50 border-slate-200' };
  };

  const currentMeter = getRecognitionStage(targetConfidence);
  const StageIcon = currentMeter.icon;

  // Friendly AI Feedback message
  const getAiFeedbackText = (confidence: number) => {
    if (totalInkPixels < 35) return "Draw something to start...";
    if (confidence >= targetThreshold) return `That looks like a great ${targetWord}! Perfect!`;
    if (confidence >= Math.max(50, targetThreshold - 10)) return `I think I see a ${targetWord}! Almost there!`;
    if (confidence >= 35) return `Good progress! Keep adding essential shapes...`;
    if (confidence >= 15) return `Analyzing stroke patterns...`;
    return "Start drawing basic outlines...";
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/80 shadow-lg rounded-[2rem] p-5 flex flex-col justify-between h-full">
      <div>
        {/* Header bar */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Brain className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 tracking-tight">AI Neural Classifier</h3>
              <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <Activity className="w-2.5 h-2.5 text-emerald-500 animate-ping" />
                <span>Smoothed Live Inference</span>
              </p>
            </div>
          </div>

          <div className="text-right font-mono">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Goal Object</span>
            <span className="text-xs font-black text-blue-600">{targetWord}</span>
          </div>
        </div>

        {/* Adaptive Assistance Alert Banner if active */}
        {isAdaptiveActive && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2 mb-3 flex items-center gap-2 text-amber-800 text-xs font-bold">
            <Zap className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
            <span>Encouraging AI Active: Reduced Threshold ({targetThreshold}%)</span>
          </div>
        )}

        {/* Visual Recognition Progress Meter Stage & Friendly Feedback */}
        <div className={`border rounded-xl p-3 mb-4 transition-all flex items-center justify-between ${
          isThinking ? 'bg-indigo-50/60 border-indigo-200 text-indigo-700' : currentMeter.color
        }`}>
          <div className="flex items-center gap-2.5">
            <StageIcon className="w-4 h-4 shrink-0 animate-pulse" />
            <div>
              <div className="text-xs font-black tracking-wide flex items-center gap-1.5">
                <span>{isThinking ? '🧠 Inferring Features...' : currentMeter.stage}</span>
              </div>
              <p className="text-[11px] font-medium opacity-90 leading-tight">
                {isThinking ? 'Calculating feature vectors & probabilities...' : getAiFeedbackText(targetConfidence)}
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-white/80 shadow-2xs border border-black/5">
            {targetConfidence}%
          </span>
        </div>

        {/* Partial Credit Notification if detected */}
        {partialCreditMessage && !isThinking && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-2 mb-3 text-xs font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{partialCreditMessage} (+Bonus Points)</span>
          </div>
        )}

        {/* Live Top Predictions Confidence Bars or Skeleton Loader */}
        <div className="space-y-3">
          {isThinking || (totalInkPixels >= 35 && predictions.length === 0) ? (
            <div className="space-y-3 py-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium pb-1">
                <span className="flex items-center gap-1.5 text-indigo-600 font-bold">
                  <Brain className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                  <span>Neural Model Processing...</span>
                </span>
                <span className="text-[10px] font-mono animate-pulse text-indigo-500 font-bold">28x28 Tensor</span>
              </div>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <motion.div
                      className="h-3.5 bg-slate-200/80 rounded-md"
                      style={{ width: `${80 - i * 14}%` }}
                      animate={{ opacity: [0.3, 0.7, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.12 }}
                    />
                    <motion.div
                      className="h-3 w-8 bg-slate-200/80 rounded-md"
                      animate={{ opacity: [0.3, 0.7, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.12 }}
                    />
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden relative border border-slate-200/50">
                    <motion.div
                      className="h-full bg-gradient-to-r from-indigo-300 via-blue-400 to-indigo-300 rounded-full"
                      style={{ width: `${75 - i * 15}%` }}
                      animate={{ opacity: [0.4, 0.9, 0.4] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.12 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : totalInkPixels < 35 ? (
            <div className="text-center py-8 text-slate-400">
              <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-pulse" />
              <p className="text-xs font-medium">Add more strokes to trigger prediction</p>
            </div>
          ) : (
            top4.map((pred) => {
              const probPct = Math.round(pred.probability * 100);
              const isTarget = pred.className.toLowerCase().trim() === targetWord.toLowerCase().trim();

              return (
                <div key={pred.className} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold flex items-center gap-1.5 ${
                      isTarget ? 'text-blue-600 font-black' : 'text-slate-700'
                    }`}>
                      {pred.className}
                      {isTarget && (
                        <span className="text-[9px] font-mono font-black text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                          GOAL ({targetThreshold}%)
                        </span>
                      )}
                    </span>
                    <span className={`font-mono font-bold ${
                      isTarget ? 'text-blue-600 font-black' : 'text-slate-500'
                    }`}>
                      {probPct}%
                    </span>
                  </div>

                  {/* Animated Gradient Bar */}
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${probPct}%` }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        isTarget
                          ? probPct >= targetThreshold
                            ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-sm'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                          : 'bg-gradient-to-r from-slate-300 to-slate-400'
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Threshold Status Banner */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
          targetConfidence >= targetThreshold
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-slate-50 border-slate-200/60 text-slate-600'
        }`}>
          <div className="flex items-center gap-2">
            {targetConfidence >= targetThreshold ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <Brain className="w-4 h-4 text-slate-400" />
            )}
            <span>
              {targetConfidence >= targetThreshold
                ? "Target Recognized! 🎉"
                : `Reach ${targetThreshold}% to auto-advance`}
            </span>
          </div>

          <span className="font-mono text-[10px] uppercase font-black tracking-wider">
            {targetConfidence}/{targetThreshold}%
          </span>
        </div>
      </div>
    </div>
  );
}
