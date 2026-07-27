import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { Achievement } from '../types';

interface AchievementsPanelProps {
  unlockedIds?: string[];
  showOnlyUnlocked?: boolean;
}

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-sketch',
    title: 'First Sketch',
    description: 'Get your very first doodle recognized by the AI.',
    badge: '✏️',
    unlocked: false,
    color: 'from-blue-500 to-indigo-500'
  },
  {
    id: 'perfect-draw',
    title: 'Perfect Draw',
    description: 'Achieve over 95% AI confidence on a single sketch.',
    badge: '🎯',
    unlocked: false,
    color: 'from-emerald-500 to-teal-500'
  },
  {
    id: 'fast-artist',
    title: 'Fast Artist',
    description: 'Get a sketch recognized in under 8 seconds.',
    badge: '⚡',
    unlocked: false,
    color: 'from-amber-500 to-orange-500'
  },
  {
    id: 'combo-king',
    title: 'Combo King',
    description: 'Complete 5 sketches in a row without using skips.',
    badge: '🔥',
    unlocked: false,
    color: 'from-rose-500 to-pink-500'
  },
  {
    id: 'ai-whisperer',
    title: 'AI Whisperer',
    description: 'Reach 98%+ prediction confidence on any object.',
    badge: '🔮',
    unlocked: false,
    color: 'from-purple-500 to-indigo-500'
  },
  {
    id: 'sketch-master',
    title: '20-Sketch Master',
    description: 'Successfully complete all 20 challenges in one run.',
    badge: '🎨',
    unlocked: false,
    color: 'from-amber-400 to-yellow-600'
  },
  {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Finish the entire 20-sketch challenge in under 3 minutes.',
    badge: '🚀',
    unlocked: false,
    color: 'from-cyan-500 to-blue-600'
  },
  {
    id: 'no-mistakes',
    title: 'Flawless Artist',
    description: 'Complete all 20 sketches with 0 skips used.',
    badge: '👑',
    unlocked: false,
    color: 'from-yellow-500 to-amber-600'
  }
];

export default function AchievementsPanel({ unlockedIds = [], showOnlyUnlocked = false }: AchievementsPanelProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
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
          <p className="text-xs text-slate-500 font-medium">Gamified Orientation Badges</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {displayList.map(ach => (
          <div
            key={ach.id}
            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
              ach.unlocked
                ? 'bg-white/50 border-white/80 shadow-xs hover:bg-white/70'
                : 'bg-white/10 border-white/20 opacity-50'
            }`}
          >
            {/* Badge Indicator */}
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-inner relative overflow-hidden ${
              ach.unlocked
                ? `bg-gradient-to-br ${ach.color} text-white border-white/10`
                : 'bg-slate-200/40 border-slate-300/20 text-slate-400'
            }`}>
              {ach.unlocked ? (
                <>
                  <span className="text-xl z-10 select-none">{ach.badge}</span>
                  <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-white/25 rounded-bl-lg flex items-center justify-center">
                    <Sparkles className="w-2 h-2 text-white animate-pulse" />
                  </div>
                </>
              ) : (
                <Lock className="w-4 h-4 stroke-[1.5]" />
              )}
            </div>

            {/* Details */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <h4 className={`text-xs font-black tracking-tight truncate ${
                  ach.unlocked ? 'text-slate-800' : 'text-slate-500'
                }`}>
                  {ach.title}
                </h4>
                {ach.unlocked && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                )}
              </div>
              <p className="text-[10px] text-slate-500 leading-snug font-medium">
                {ach.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function checkAndUnlockAchievements(
  currentUnlockedIds: string[],
  stats: {
    maxProbability: number;
    sketchesCompleted: number;
    skipsUsed: number;
    timeSpentOnSketch: number;
    totalGameTimeSeconds: number;
    currentComboStreak: number;
  },
  onUnlock: (badgeId: string) => void
): string[] {
  const newlyUnlocked = [...currentUnlockedIds];

  const triggerUnlock = (id: string) => {
    if (!newlyUnlocked.includes(id)) {
      newlyUnlocked.push(id);
      onUnlock(id);
    }
  };

  // 1. First Sketch
  if (stats.sketchesCompleted >= 1) triggerUnlock('first-sketch');

  // 2. Perfect Draw (>95%)
  if (stats.maxProbability >= 95) triggerUnlock('perfect-draw');

  // 3. Fast Artist (<8s)
  if (stats.timeSpentOnSketch <= 8 && stats.maxProbability >= 70) triggerUnlock('fast-artist');

  // 4. Combo King (5 streak)
  if (stats.currentComboStreak >= 5) triggerUnlock('combo-king');

  // 5. AI Whisperer (98%+)
  if (stats.maxProbability >= 98) triggerUnlock('ai-whisperer');

  // 6. 20-Sketch Master (20 finished)
  if (stats.sketchesCompleted >= 20) triggerUnlock('sketch-master');

  // 7. Speed Demon (<3 min / 180s total)
  if (stats.sketchesCompleted >= 20 && stats.totalGameTimeSeconds <= 180) triggerUnlock('speed-demon');

  // 8. Flawless Artist (0 skips used)
  if (stats.sketchesCompleted >= 20 && stats.skipsUsed === 0) triggerUnlock('no-mistakes');

  return newlyUnlocked;
}
