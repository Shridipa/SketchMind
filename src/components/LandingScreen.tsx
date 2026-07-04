import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Play, Sparkles, BrainCircuit, Pencil } from 'lucide-react';

interface LandingScreenProps {
  onStartGame: () => void;
}

export default function LandingScreen({ onStartGame }: LandingScreenProps) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; duration: number }[]>([]);

  useEffect(() => {
    // Generate floating particles
    const generated = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 10 + 10
    }));
    setParticles(generated);
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-73px)] text-slate-800 flex flex-col items-center justify-center overflow-hidden px-4 py-12 z-10">
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-blue-300/40"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size
            }}
            animate={{
              y: ['0px', '-100px', '0px'],
              x: ['0px', '40px', '0px'],
              opacity: [0.2, 0.7, 0.2]
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-xl w-full flex flex-col items-center text-center">
        {/* Animated Icon Badge */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
          className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 bg-white/60 border border-white/40 shadow-sm rounded-full text-xs font-semibold text-blue-600 tracking-wide uppercase backdrop-blur-md"
        >
          <BrainCircuit className="w-4 h-4 text-purple-500 animate-pulse" />
          <span>Real-time In-Browser Computer Vision</span>
        </motion.div>

        {/* Brand Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-6xl font-black text-slate-900 tracking-tight leading-none mb-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent"
        >
          SketchMind
        </motion.h1>

        {/* Slogan */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-2xl font-medium text-slate-700 mb-8 font-display"
        >
          "Can AI understand your doodles?"
        </motion.p>

        {/* Animated Pencil Sketching Illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="relative w-[340px] h-[200px] bg-white/60 border border-white/60 shadow-2xl shadow-slate-200/40 rounded-[2rem] mb-10 flex items-center justify-center p-6 backdrop-blur-md"
        >
          {/* Mock Drawing Track */}
          <svg className="w-full h-full absolute inset-0 pointer-events-none" viewBox="0 0 320 180">
            {/* Draw a subtle dashed star track */}
            <motion.path
              d="M 160,35 L 185,85 L 240,93 L 200,132 L 210,187 L 160,160 L 110,187 L 120,132 L 80,93 L 135,85 Z"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {/* Draw an elegant colored path being drawn */}
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
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
            {/* Definitions for Gradients */}
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

          {/* Floating Pencil Icon moving with the drawing */}
          <motion.div
            className="absolute text-slate-800 pointer-events-none"
            animate={{
              x: [0, 25, 80, 40, 50, 0, -50, -40, -80, -25, 0],
              y: [-55, -5, 3, 42, 97, 70, 97, 42, 3, -5, -55],
              rotate: [15, 35, 10, 45, 15, -15, -45, -10, -35, -15, 15]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <div className="bg-white/80 border border-white/60 p-2.5 rounded-full shadow-md text-blue-600 backdrop-blur-sm">
              <Pencil className="w-5 h-5" />
            </div>
          </motion.div>

          <div className="flex flex-col items-center">
            <span className="text-xs font-mono text-slate-400 mt-28">AI Real-time Predictor Active</span>
          </div>
        </motion.div>

        {/* Start Game Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          onClick={onStartGame}
          className="group relative cursor-pointer px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-[0_10px_25px_-5px_rgba(99,102,241,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(99,102,241,0.6)] transition-all duration-300 transform hover:-translate-y-0.5 select-none"
          id="btn-start-game"
        >
          <div className="flex items-center gap-2.5">
            <Play className="w-5 h-5 fill-current" />
            <span>Start Playing</span>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
            </motion.div>
          </div>
        </motion.button>

        {/* Quick Orientation Footer Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.6 }}
          className="text-xs text-slate-500 font-medium mt-12 tracking-wide"
        >
          Perfect for College Orientation • No Downloads or Accounts Required • 100% Offline AI
        </motion.p>
      </div>
    </div>
  );
}
