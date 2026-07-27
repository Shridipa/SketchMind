import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Paintbrush, Zap, Trophy, ArrowRight, Check, X } from 'lucide-react';
import { soundManager } from './SoundManager';

interface TutorialModalProps {
  onClose: () => void;
}

export default function TutorialModal({ onClose }: TutorialModalProps) {
  const [step, setStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const steps = [
    {
      title: "20-Sketch Challenge",
      icon: <Brain className="w-8 h-8 text-blue-600" />,
      description: "Welcome to SketchMind! You will draw 20 objects progressively from Very Easy to Hard. The goal is to finish as fast and accurately as possible.",
      color: "from-blue-500/10 to-indigo-500/10"
    },
    {
      title: "Real-Time AI Prediction",
      icon: <Zap className="w-8 h-8 text-amber-500" />,
      description: "Our in-browser Machine Learning neural network scans your drawing every 300ms. As soon as recognition confidence hits 80%+, you auto-advance!",
      color: "from-amber-500/10 to-orange-500/10"
    },
    {
      title: "Drawing Tools & Hints",
      icon: <Paintbrush className="w-8 h-8 text-emerald-500" />,
      description: "Use Pencil [B], Eraser [E], Undo [Ctrl+Z], and Progressive Hints. You have up to 3 Skips if you get stuck on a difficult prompt.",
      color: "from-emerald-500/10 to-teal-500/10"
    },
    {
      title: "Orientation Leaderboard",
      icon: <Trophy className="w-8 h-8 text-purple-600" />,
      description: "Compete against other orientation visitors! Players are ranked by Completion Time, Score, and AI Accuracy. Good luck!",
      color: "from-purple-500/10 to-pink-500/10"
    }
  ];

  const handleFinish = () => {
    if (dontShowAgain && typeof localStorage !== 'undefined') {
      localStorage.setItem('sketchmind_skip_tutorial', 'true');
    }
    soundManager.playClick();
    onClose();
  };

  const handleNext = () => {
    soundManager.playClick();
    if (step < steps.length - 1) {
      setStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white/90 backdrop-blur-xl border border-white/80 shadow-2xl rounded-[2rem] max-w-md w-full overflow-hidden p-6 relative"
      >
        {/* Close Button */}
        <button
          onClick={handleFinish}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step Indicator dots */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === step ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Card Content */}
        <div className="text-center flex flex-col items-center">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${steps[step].color} border border-white flex items-center justify-center mb-4 shadow-sm`}>
            {steps[step].icon}
          </div>

          <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-widest block mb-1">
            Step {step + 1} of {steps.length}
          </span>

          <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">
            {steps[step].title}
          </h3>

          <p className="text-sm text-slate-500 leading-relaxed max-w-xs mb-8">
            {steps[step].description}
          </p>

          {/* Don't show again checkbox */}
          <label className="flex items-center gap-2 cursor-pointer mb-6 text-xs text-slate-500 hover:text-slate-700 select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={e => setDontShowAgain(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <span>Don't show tutorial on launch</span>
          </label>

          {/* Action Button */}
          <button
            onClick={handleNext}
            className="w-full cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all select-none"
          >
            <span>{step === steps.length - 1 ? "Start Challenge" : "Next Tip"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
