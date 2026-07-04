import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { Achievement } from '../types';

interface AchievementsPanelProps {
  unlockedIds?: string[];
  showOnlyUnlocked?: boolean;
}

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ai-whisperer',
    title: 'AI Whisperer',
    description: 'Get an AI prediction confidence of over 95% on a single drawing.',
    badge: '🔮',
    unlocked: false,
    color: 'from-purple-500 to-indigo-500'
  },
  {
    id: 'sketch-master',
    title: 'Sketch Master',
    description: 'Successfully pass Level 3 drawing challenges.',
    badge: '🎨',
    unlocked: false,
    color: 'from-amber-500 to-orange-500'
  },
  {
    id: 'perfect-draw',
    title: 'Perfect Draw',
    description: 'Earn a Perfect 100-point score for drawing precision on any object.',
    badge: '🎯',
    unlocked: false,
    color: 'from-emerald-500 to-teal-500'
  },
  {
    id: 'speed-artist',
    title: 'Speed Artist',
    description: 'Get the AI to correctly recognize your doodle in under 10 seconds.',
    badge: '⚡',
    unlocked: false,
    color: 'from-blue-500 to-cyan-500'
  }
];

export default function AchievementsPanel({ unlockedIds = [], showOnlyUnlocked = false }: AchievementsPanelProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    // Load achievements state from local storage or combine with default ones
    const stored = localStorage.getItem('sketchmind_achievements');
    let loaded: Achievement[] = [];
    if (stored) {
      try {
        loaded = JSON.parse(stored) as Achievement[];
      } catch (e) {
        loaded = [...DEFAULT_ACHIEVEMENTS];
      }
    } else {
      loaded = [...DEFAULT_ACHIEVEMENTS];
    }

    // Sync in-memory achievements with newly passed prop ones
    const synced = loaded.map(ach => {
      const isPropUnlocked = unlockedIds.includes(ach.id);
      if (isPropUnlocked && !ach.unlocked) {
        return { ...ach, unlocked: true, unlockedAt: new Date().toLocaleDateString() };
      }
      return ach;
    });

    setAchievements(synced);
    localStorage.setItem('sketchmind_achievements', JSON.stringify(synced));
  }, [unlockedIds]);

  const displayList = showOnlyUnlocked 
    ? achievements.filter(a => a.unlocked) 
    : achievements;

  if (displayList.length === 0 && showOnlyUnlocked) {
    return null;
  }

  return (
    <div className="bg-white/60 backdrop-blur-md border border-white/60 shadow-sm rounded-[2rem] p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <Award className="w-5 h-5 text-indigo-600 animate-bounce" />
        <div>
          <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Achievements</h3>
          <p className="text-xs text-slate-500 font-medium">Gamified Orientation Milestones</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {displayList.map(ach => (
          <div
            key={ach.id}
            className={`flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all ${
              ach.unlocked
                ? 'bg-white/40 border-white/60 shadow-sm hover:bg-white/60'
                : 'bg-white/10 border-white/20 opacity-50'
            }`}
          >
            {/* Badge Indicator */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border shadow-inner relative overflow-hidden ${
              ach.unlocked
                ? `bg-gradient-to-br ${ach.color} text-white border-white/10`
                : 'bg-slate-200/40 border-slate-300/20 text-slate-400'
            }`}>
              {ach.unlocked ? (
                <>
                  <span className="text-2xl z-10 select-none">{ach.badge}</span>
                  <div className="absolute top-0 right-0 w-4 h-4 bg-white/25 rounded-bl-lg flex items-center justify-center">
                    <Sparkles className="w-2.5 h-2.5 text-white animate-pulse" />
                  </div>
                </>
              ) : (
                <Lock className="w-5 h-5 stroke-[1.5]" />
              )}
            </div>

            {/* Achievement details */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1.5 mb-0.5">
                <h4 className={`text-xs font-black tracking-tight truncate ${
                  ach.unlocked ? 'text-slate-800' : 'text-slate-500'
                }`}>
                  {ach.title}
                </h4>
                {ach.unlocked && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                )}
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                {ach.description}
              </p>
              {ach.unlocked && ach.unlockedAt && (
                <span className="text-[9px] font-mono font-semibold text-slate-400 block mt-1">
                  Unlocked {ach.unlockedAt}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Global unlocked checker helper
export function checkAndUnlockAchievements(
  currentUnlockedIds: string[],
  stats: {
    maxProbability: number;
    levelCompleted: number;
    pointsScored: number;
    secondsRemaining: number;
  },
  onUnlock: (badgeId: string) => void
): string[] {
  const newlyUnlocked = [...currentUnlockedIds];
  let didUnlock = false;

  const triggerUnlock = (id: string) => {
    if (!newlyUnlocked.includes(id)) {
      newlyUnlocked.push(id);
      didUnlock = true;
      onUnlock(id);
    }
  };

  // 1. AI Whisperer: probability over 95%
  if (stats.maxProbability >= 95) {
    triggerUnlock('ai-whisperer');
  }

  // 2. Sketch Master: pass level 3
  if (stats.levelCompleted >= 3) {
    triggerUnlock('sketch-master');
  }

  // 3. Perfect Draw: pointsScored is exactly 100
  if (stats.pointsScored === 100) {
    triggerUnlock('perfect-draw');
  }

  // 4. Speed Artist: time remaining was over 20 seconds (30s limit, so took < 10s to identify!)
  if (stats.secondsRemaining > 20 && stats.pointsScored >= 40) {
    triggerUnlock('speed-artist');
  }

  if (didUnlock) {
    // Persist immediately in localStorage if in client
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('sketchmind_achievements');
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Achievement[];
          const updated = parsed.map(ach => {
            if (newlyUnlocked.includes(ach.id) && !ach.unlocked) {
              return { ...ach, unlocked: true, unlockedAt: new Date().toLocaleDateString() };
            }
            return ach;
          });
          localStorage.setItem('sketchmind_achievements', JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }

  return newlyUnlocked;
}
