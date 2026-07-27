import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lightbulb, ChevronDown, ChevronUp, Sparkles, HelpCircle } from 'lucide-react';
import { soundManager } from './SoundManager';

interface HintCardProps {
  hints: [string, string, string];
  word: string;
  timeSpent: number; // Seconds spent on current sketch
}

export default function HintCard({ hints, word, timeSpent }: HintCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Hints unlock at 0s, 10s, 20s
  const unlockedStage = timeSpent >= 20 ? 2 : timeSpent >= 10 ? 1 : 0;

  const toggleExpand = () => {
    setIsExpanded(prev => !prev);
    soundManager.playClick();
  };

  return (
    <div className="bg-white/80 backdrop-blur-md border border-white/80 shadow-md rounded-2xl overflow-hidden transition-all mb-3">
      {/* Header bar */}
      <div 
        onClick={toggleExpand}
        className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-white/50 transition-colors select-none"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
            <Lightbulb className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <span className="text-xs font-bold text-slate-800">Sketching Hints for <strong>"{word}"</strong></span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
            Hint {unlockedStage + 1} / 3
          </span>
        </div>

        <button className="text-slate-400 hover:text-slate-600 p-1">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded hint body */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-3 pt-1 border-t border-slate-100"
          >
            <div className="flex flex-col gap-2">
              {hints.map((hintText, idx) => {
                const isUnlocked = idx <= unlockedStage;
                return (
                  <div 
                    key={idx}
                    className={`p-2.5 rounded-xl border text-xs transition-all flex items-start gap-2.5 ${
                      isUnlocked
                        ? idx === unlockedStage
                          ? 'bg-amber-50/70 border-amber-200/80 text-amber-900 font-medium shadow-xs'
                          : 'bg-slate-50/80 border-slate-200/60 text-slate-600'
                        : 'bg-slate-50/30 border-slate-100 text-slate-300 opacity-60'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-mono font-bold ${
                      isUnlocked ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      {idx + 1}
                    </div>

                    <div className="flex-1">
                      {isUnlocked ? (
                        <p className="leading-snug">{hintText}</p>
                      ) : (
                        <p className="italic text-slate-400">
                          Unlocks at {idx === 1 ? '10' : '20'} seconds...
                        </p>
                      )}
                    </div>

                    {isUnlocked && idx === unlockedStage && (
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
