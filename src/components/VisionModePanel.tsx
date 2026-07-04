import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { DrawingFeatures, Prediction } from '../types';
import { Eye, ShieldAlert, Cpu, Sparkles, Orbit } from 'lucide-react';

interface VisionModePanelProps {
  grayscale28: number[][];
  features: DrawingFeatures;
  predictions: Prediction[];
  targetObject: string;
}

export default function VisionModePanel({
  grayscale28,
  features,
  predictions,
  targetObject
}: VisionModePanelProps) {
  const pixelCanvasRef = useRef<HTMLCanvasElement>(null);

  // Render the 28x28 grayscale image onto a canvas for sharp pixel-perfect rendering
  useEffect(() => {
    const canvas = pixelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 196; // 196x196 display size (7x scaling for each of the 28x28 pixels)
    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, size, size);

    const pixelSize = size / 28;

    for (let y = 0; y < 28; y++) {
      for (let x = 0; x < 28; x++) {
        const val = grayscale28[y][x];
        
        // Draw the pixel in grayscale
        ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);

        // Draw a very faint pixel boundary
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      }
    }
  }, [grayscale28]);

  const activePred = predictions[0] || { className: 'None', probability: 0 };
  const targetProb = predictions.find(p => p.className === targetObject)?.probability || 0;

  return (
    <div className="bg-slate-900/85 backdrop-blur-md text-white border border-slate-800/80 shadow-2xl rounded-[2.5rem] p-6 h-full flex flex-col justify-between overflow-hidden relative">
      {/* High-tech tech ambient glow background */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <Eye className="w-5 h-5 text-indigo-400 animate-pulse" />
            <div>
              <h3 className="text-base font-extrabold tracking-tight text-slate-100 flex items-center gap-1.5">
                <span>AI Vision Active</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 font-mono rounded border border-indigo-500/30">
                  REAL-TIME
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">Inside the Computer's Neural Processor</p>
            </div>
          </div>
          <Cpu className="w-5 h-5 text-indigo-500" />
        </div>

        {/* Downsampled Matrix and Structural Features split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          
          {/* Left: Pixel Matrix */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold font-mono text-indigo-400 uppercase tracking-widest mb-2">
              1. Pixel Grid Matrix (28×28)
            </span>
            <div className="relative p-1.5 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
              <canvas
                ref={pixelCanvasRef}
                className="rounded-lg shadow-inner block"
              />
              {/* Highlight bounding bounds helper */}
              <div className="absolute inset-0 border border-dashed border-blue-500/20 pointer-events-none" />
            </div>
            <p className="text-[10px] text-slate-500 text-center mt-2 leading-relaxed max-w-[200px]">
              The drawing is isolated, padded, and resized to standard 28×28 grayscale.
            </p>
          </div>

          {/* Right: Extracted Features metrics */}
          <div className="space-y-3.5">
            <span className="text-[10px] font-bold font-mono text-indigo-400 uppercase tracking-widest block mb-1">
              2. Structural Descriptors
            </span>

            {/* Circularity */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-300 font-mono">
                <span>Circularity (Roundness)</span>
                <span className="text-blue-400">{(features.circularity || 0).toFixed(2)}</span>
              </div>
              <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <motion.div
                  className="h-full bg-blue-500 rounded-full"
                  animate={{ width: `${Math.min(100, (features.circularity || 0) * 100)}%` }}
                  transition={{ duration: 0.15 }}
                />
              </div>
            </div>

            {/* Bounding box aspect ratio */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-300 font-mono">
                <span>Aspect Ratio (W:H)</span>
                <span className="text-purple-400">{(features.aspectRatio || 0).toFixed(2)}</span>
              </div>
              <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <motion.div
                  className="h-full bg-purple-500 rounded-full"
                  animate={{ 
                    width: `${Math.min(100, Math.max(10, (features.aspectRatio || 0) * 35))}%` 
                  }}
                  transition={{ duration: 0.15 }}
                />
              </div>
            </div>

            {/* Density */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-300 font-mono">
                <span>Ink Density</span>
                <span className="text-indigo-400">{Math.round((features.density || 0) * 100)}%</span>
              </div>
              <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <motion.div
                  className="h-full bg-indigo-500 rounded-full"
                  animate={{ width: `${(features.density || 0) * 100}%` }}
                  transition={{ duration: 0.15 }}
                />
              </div>
            </div>

            {/* Symmetry */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-300 font-mono">
                <span>Symmetry Index (H / V)</span>
                <span className="text-teal-400">
                  {Math.round((features.symmetryHorizontal || 0) * 100)}% / {Math.round((features.symmetryVertical || 0) * 100)}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <motion.div
                    className="h-full bg-teal-500 rounded-full"
                    animate={{ width: `${(features.symmetryHorizontal || 0) * 100}%` }}
                    transition={{ duration: 0.15 }}
                  />
                </div>
                <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <motion.div
                    className="h-full bg-teal-400 rounded-full"
                    animate={{ width: `${(features.symmetryVertical || 0) * 100}%` }}
                    transition={{ duration: 0.15 }}
                  />
                </div>
              </div>
            </div>

            {/* Special loop / Corner Flags */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">Closed Loops:</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                  features.hasClosedLoop ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                }`}>
                  {features.hasClosedLoop ? 'DETECTED' : 'NONE'}
                </span>
              </div>
              <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">Sharp Corners:</span>
                <span className="text-[10px] font-black text-indigo-300">
                  {features.cornerCount}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* 3. Deep Neural Net Activation flow illustration */}
        <div className="mt-6 p-4 bg-slate-950 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-bold font-mono text-indigo-400 uppercase tracking-widest block mb-3 text-center">
            3. Live Neural Net Activation Paths
          </span>
          
          <div className="relative flex items-center justify-between px-2 h-14 overflow-hidden">
            {/* Input Feature Nodes */}
            <div className="flex flex-col gap-1 z-10">
              <div className="w-3.5 h-3.5 rounded-full bg-blue-500 animate-ping absolute" />
              <div className="w-3.5 h-3.5 rounded-full bg-blue-500 border border-white/20 shadow-lg relative flex items-center justify-center text-[7px]" title="Circularity" />
              <div className="w-3.5 h-3.5 rounded-full bg-purple-500 border border-white/20 shadow-lg relative flex items-center justify-center text-[7px]" title="Aspect Ratio" />
              <div className="w-3.5 h-3.5 rounded-full bg-indigo-500 border border-white/20 shadow-lg relative flex items-center justify-center text-[7px]" title="Symmetry" />
            </div>

            {/* Neural weights lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 350 56">
              {/* Star/Apple weights drawing flows */}
              <motion.path
                d="M 25,12 L 175,28 L 325,12"
                fill="none"
                stroke="url(#weightGradBlue)"
                strokeWidth={activePred.className === 'Apple' ? 2 : 0.5}
                strokeDasharray="4 4"
                animate={activePred.className === 'Apple' ? { strokeDashoffset: [-20, 0] } : {}}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <motion.path
                d="M 25,28 L 175,28 L 325,28"
                fill="none"
                stroke="url(#weightGradPurple)"
                strokeWidth={targetProb > 50 ? 2.5 : 0.5}
                strokeDasharray="4 4"
                animate={targetProb > 50 ? { strokeDashoffset: [-20, 0] } : {}}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
              <motion.path
                d="M 25,44 L 175,28 L 325,44"
                fill="none"
                stroke="url(#weightGradPink)"
                strokeWidth={activePred.className === 'Star' ? 2 : 0.5}
                strokeDasharray="4 4"
                animate={activePred.className === 'Star' ? { strokeDashoffset: [-20, 0] } : {}}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />

              <defs>
                <linearGradient id="weightGradBlue" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#6366f1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="weightGradPurple" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#6366f1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="weightGradPink" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#6366f1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="0.8" />
                </linearGradient>
              </defs>
            </svg>

            {/* Hidden Neural Layers Nodes */}
            <div className="flex gap-1.5 z-10 bg-slate-900 border border-slate-800 rounded-lg py-1 px-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700 border border-slate-600 animate-pulse" />
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 border border-indigo-400 animate-pulse" />
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500 border border-purple-400 animate-pulse" />
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700 border border-slate-600" />
            </div>

            {/* Target and Active outputs */}
            <div className="flex flex-col gap-1 items-end z-10 text-[9px] font-mono">
              <div className={`px-1.5 py-0.5 rounded font-black flex items-center gap-1 ${
                activePred.probability > 0.5 ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-900 text-slate-500'
              }`}>
                <span>Best Guess:</span>
                <span className="text-white font-bold">{activePred.className}</span>
              </div>
              <div className={`px-1.5 py-0.5 rounded font-black flex items-center gap-1 ${
                targetProb > 40 ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-900 text-slate-500'
              }`}>
                <span>Target Match:</span>
                <span className="text-white font-bold">{targetObject} ({targetProb}%)</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="mt-5 text-[10px] text-slate-500 flex items-center gap-1.5 border-t border-slate-800/60 pt-3">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        <span>Your hand-drawn strokes are converted mathematically into vector inputs that fire corresponding classifier outputs.</span>
      </div>
    </div>
  );
}
