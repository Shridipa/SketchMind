import React, { useEffect, useState } from 'react';
import { Trophy, Calendar, Sparkles, Trash2, ArrowLeft } from 'lucide-react';
import { LeaderboardEntry } from '../types';

interface LeaderboardPanelProps {
  onBack?: () => void;
  highlightId?: string;
}

export default function LeaderboardPanel({ onBack, highlightId }: LeaderboardPanelProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = () => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('sketchmind_leaderboard');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as LeaderboardEntry[];
        // Sort by score descending, then date descending
        const sorted = parsed.sort((a, b) => b.score - a.score || new Date(b.date).getTime() - new Date(a.date).getTime());
        setEntries(sorted.slice(0, 10)); // Keep top 10
      } catch (e) {
        console.error('Error loading leaderboard', e);
      }
    } else {
      // Seed leaderboard with some mock orientation records if empty
      const defaultEntries: LeaderboardEntry[] = [
        { id: 'seed1', name: 'Zack (CS)', score: 620, date: '2026-07-03', accuracy: 91, levelReached: 3 },
        { id: 'seed2', name: 'Maya (EE)', score: 540, date: '2026-07-03', accuracy: 88, levelReached: 3 },
        { id: 'seed3', name: 'Prof. Chen', score: 480, date: '2026-07-02', accuracy: 84, levelReached: 2 },
        { id: 'seed4', name: 'Leo (ME)', score: 390, date: '2026-07-01', accuracy: 81, levelReached: 2 },
        { id: 'seed5', name: 'Sophia', score: 300, date: '2026-06-30', accuracy: 78, levelReached: 1 }
      ];
      localStorage.setItem('sketchmind_leaderboard', JSON.stringify(defaultEntries));
      setEntries(defaultEntries);
    }
  };

  const clearLeaderboard = () => {
    if (confirm('Are you sure you want to reset the leaderboard scores?')) {
      localStorage.removeItem('sketchmind_leaderboard');
      setEntries([]);
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-md border border-white/40 shadow-2xl shadow-slate-200/40 rounded-[2.5rem] p-8 w-full max-w-lg mx-auto relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
            <Trophy className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Leaderboard</h3>
            <p className="text-xs text-slate-500 font-medium">Top 10 Orientation Scores</p>
          </div>
        </div>

        {entries.length > 0 && (
          <button
            onClick={clearLeaderboard}
            className="cursor-pointer text-slate-400 hover:text-rose-500 p-2 rounded-lg transition-colors"
            title="Reset Leaderboard"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-2.5 mb-6 max-h-[360px] overflow-y-auto pr-1">
        {entries.length === 0 ? (
          <div className="text-center py-12 border border-white/60 bg-white/40 rounded-2xl text-slate-400">
            <Trophy className="w-10 h-10 stroke-[1] mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">No scores logged yet.</p>
            <p className="text-xs text-slate-400">Be the first to record a top score!</p>
          </div>
        ) : (
          entries.map((entry, idx) => {
            const isHighlighted = entry.id === highlightId;
            const rankColors = [
              'bg-amber-500 text-white border-amber-400 shadow-md', // Gold
              'bg-slate-400 text-white border-slate-300 shadow-sm',  // Silver
              'bg-amber-700 text-white border-amber-600 shadow-sm',  // Bronze
            ];
            
            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  isHighlighted
                    ? 'bg-blue-500/10 border-blue-500/20 shadow-[0_4px_12px_rgb(59,130,246,0.06)]'
                    : 'bg-white/40 border-white/60 hover:bg-white/60'
                }`}
              >
                {/* Left: Rank & Name */}
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center border ${
                    idx < 3 ? rankColors[idx] : 'bg-white/60 text-slate-600 border-white/80'
                  }`}>
                    {idx + 1}
                  </div>
                  
                  <div>
                    <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      {entry.name}
                      {isHighlighted && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-mono rounded font-black uppercase">
                          <Sparkles className="w-2.5 h-2.5 fill-current" />
                          <span>NEW</span>
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium font-mono">
                      <Calendar className="w-3 h-3 text-slate-300" />
                      {entry.date}
                    </span>
                  </div>
                </div>

                {/* Right: Accuracy & Score */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-500 font-mono block">
                      Acc: {entry.accuracy}%
                    </span>
                    <span className="text-[10px] text-blue-600 font-medium font-mono">
                      Lvl {entry.levelReached} reached
                    </span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-base font-black text-blue-600 tracking-tight">
                      {entry.score}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold block leading-none">
                      PTS
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {onBack && (
        <button
          onClick={onBack}
          className="cursor-pointer w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-white/60 border border-white/60 hover:bg-white text-slate-700 text-sm font-extrabold rounded-xl transition-all select-none shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Back to Landing Screen</span>
        </button>
      )}
    </div>
  );
}
export function saveScoreToLeaderboard(name: string, score: number, accuracy: number, levelReached: number): LeaderboardEntry {
  const newEntry: LeaderboardEntry = {
    id: 'score_' + Date.now(),
    name: name.trim() || 'Anonymous Doodler',
    score,
    date: new Date().toISOString().split('T')[0],
    accuracy,
    levelReached
  };

  try {
    const existing = localStorage.getItem('sketchmind_leaderboard');
    const parsed = existing ? JSON.parse(existing) : [];
    parsed.push(newEntry);
    localStorage.setItem('sketchmind_leaderboard', JSON.stringify(parsed));
  } catch (e) {
    console.error('Error saving score to leaderboard', e);
  }

  return newEntry;
}
