import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Play, Sparkles, BrainCircuit, Pencil, Trophy, HelpCircle, Zap, ShieldCheck } from 'lucide-react';
import { soundManager } from './SoundManager';

interface LandingScreenProps {
  onStartGame: () => void;
  onOpenLeaderboard: () => void;
  onOpenTutorial: () => void;
}

export default function LandingScreen({ onStartGame, onOpenLeaderboard, onOpenTutorial }: LandingScreenProps) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; duration: number }[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 10 + 10
    }));
    setParticles(generated);
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-73px)] text-slate-800 flex flex-col items-center justify-center overflow-hidden px-4 py-8 z-10">
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-blue-400/30"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size
            }}
            animate={{
              y: ['0px', '-120px', '0px'],
              x: ['0px', '40px', '0px'],
              opacity: [0.15, 0.6, 0.15]
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-2xl w-full flex flex-col items-center text-center">
        {/* Animated Badge */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 bg-white/80 border border-white/80 shadow-xs rounded-full text-xs font-bold text-blue-600 tracking-wide uppercase backdrop-blur-md"
        >
          <BrainCircuit className="w-4 h-4 text-purple-500 animate-pulse" />
          <span>College Orientation AI Showcase</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight leading-none mb-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent"
        >
          SketchMind
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-xl sm:text-2xl font-bold text-slate-700 mb-6"
        >
          20-Sketch AI Drawing Race
        </motion.p>

        {/* Animation Illustration Canvas */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="relative w-full max-w-sm h-[180px] bg-white/70 border border-white/80 shadow-xl rounded-[2rem] mb-8 flex items-center justify-center p-6 backdrop-blur-md"
        >
          <svg className="w-full h-full absolute inset-0 pointer-events-none" viewBox="0 0 320 180">
            <motion.path
              d="M 160,35 L 185,85 L 240,93 L 200,132 L 210,187 L 160,160 L 110,187 L 120,132 L 80,93 L 135,85 Z"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <motion.path
              d="M 160,35 L 185,85 L 240,93 L 200,132 L 210,187 L 160,160 L 110,187 L 120,132 L 80,93 L 135,85 Z"
              fill="url(#goldGrad)"
              fillOpacity="0.05"
              stroke="url(#bluePurpleGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: [0, 1, 0] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
            <defs>
              <linearGradient id="bluePurpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fed7aa" />
                <stop offset="100%" stopColor="#fde047" />
              </linearGradient>
            </defs>
          </svg>

          <motion.div
            className="absolute text-slate-800 pointer-events-none"
            animate={{
              x: [0, 25, 80, 40, 50, 0, -50, -40, -80, -25, 0],
              y: [-55, -5, 3, 42, 97, 70, 97, 42, 3, -5, -55],
              rotate: [15, 35, 10, 45, 15, -15, -45, -10, -35, -15, 15]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <div className="bg-white border border-white/80 p-2 rounded-full shadow-md text-blue-600 backdrop-blur-sm">
              <Pencil className="w-4 h-4" />
            </div>
          </motion.div>

          <div className="flex flex-col items-center z-10 pointer-events-none">
            <span className="text-xs font-bold text-slate-600 bg-white/90 px-3 py-1 rounded-full shadow-xs border border-slate-200/60">
              ⚡ Real-time 300ms Prediction Active
            </span>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mb-8">
          <button
            onClick={() => { soundManager.playClick(); onStartGame(); }}
            className="w-full sm:flex-1 cursor-pointer py-4 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-black text-base rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 select-none"
            id="btn-start-game"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Start 20-Sketch Race</span>
            <Sparkles className="w-4 h-4 text-amber-300" />
          </button>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => { soundManager.playClick(); onOpenLeaderboard(); }}
              className="flex-1 sm:flex-initial cursor-pointer py-3.5 px-4 bg-white/80 hover:bg-white text-slate-800 font-extrabold text-xs rounded-2xl border border-white/80 shadow-sm transition-all flex items-center justify-center gap-1.5 select-none"
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Leaderboard</span>
            </button>

            <button
              onClick={() => { soundManager.playClick(); onOpenTutorial(); }}
              className="flex-1 sm:flex-initial cursor-pointer py-3.5 px-4 bg-white/80 hover:bg-white text-slate-800 font-extrabold text-xs rounded-2xl border border-white/80 shadow-sm transition-all flex items-center justify-center gap-1.5 select-none"
            >
              <HelpCircle className="w-4 h-4 text-blue-500" />
              <span>Tutorial</span>
            </button>
          </div>
        </div>

        {/* Orientation Feature Highlights */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-lg text-left">
          <div className="p-3 bg-white/50 border border-white/80 rounded-2xl backdrop-blur-sm">
            <Zap className="w-4 h-4 text-amber-500 mb-1" />
            <h4 className="text-xs font-black text-slate-800">20 Sketches</h4>
            <p className="text-[10px] text-slate-500 leading-snug">4 Tiers: Very Easy to Hard</p>
          </div>

          <div className="p-3 bg-white/50 border border-white/80 rounded-2xl backdrop-blur-sm">
            <BrainCircuit className="w-4 h-4 text-purple-500 mb-1" />
            <h4 className="text-xs font-black text-slate-800">In-Browser ML</h4>
            <p className="text-[10px] text-slate-500 leading-snug">Zero delay, local execution</p>
          </div>

          <div className="p-3 bg-white/50 border border-white/80 rounded-2xl backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-500 mb-1" />
            <h4 className="text-xs font-black text-slate-800">Orientation Ready</h4>
            <p className="text-[10px] text-slate-500 leading-snug">No login, fast & fun</p>
          </div>
        </div>
      </div>
    </div>
  );
}
