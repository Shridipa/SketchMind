import React, { useEffect, useState } from 'react';
import { Trophy, Calendar, Sparkles, Trash2, ArrowLeft, Search, Clock, Award, ShieldAlert } from 'lucide-react';
import { LeaderboardEntry } from '../types';
import { soundManager } from './SoundManager';

interface LeaderboardPanelProps {
  onBack?: () => void;
  highlightId?: string;
}

export default function LeaderboardPanel({ onBack, highlightId }: LeaderboardPanelProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = () => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('sketchmind_leaderboard_20');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as LeaderboardEntry[];
        // Sort primary by Completion Time (lowest/fastest first), then Score (highest first), then Accuracy (highest first)
        const sorted = parsed.sort((a, b) => {
          if (a.completionTime !== b.completionTime) {
            return a.completionTime - b.completionTime;
          }
          if (b.score !== a.score) {
            return b.score - a.score;
          }
          return b.accuracy - a.accuracy;
        });
        setEntries(sorted.slice(0, 15));
      } catch (e) {
        console.error('Error loading leaderboard', e);
      }
    } else {
      // Seed default orientation records
      const defaultEntries: LeaderboardEntry[] = [
        { id: 'seed1', name: 'Zack (CS)', completionTime: 112, formattedTime: '01:52', score: 1920, date: '2026-07-27', accuracy: 96, skipsUsed: 0, difficultyCompleted: 'Completed 20' },
        { id: 'seed2', name: 'Maya (EE)', completionTime: 128, formattedTime: '02:08', score: 1840, date: '2026-07-27', accuracy: 94, skipsUsed: 0, difficultyCompleted: 'Completed 20' },
        { id: 'seed3', name: 'Alex (Design)', completionTime: 145, formattedTime: '02:25', score: 1760, date: '2026-07-26', accuracy: 90, skipsUsed: 1, difficultyCompleted: 'Completed 20' },
        { id: 'seed4', name: 'Prof. Chen', completionTime: 168, formattedTime: '02:48', score: 1680, date: '2026-07-25', accuracy: 88, skipsUsed: 1, difficultyCompleted: 'Completed 20' },
        { id: 'seed5', name: 'Leo (ME)', completionTime: 190, formattedTime: '03:10', score: 1550, date: '2026-07-24', accuracy: 85, skipsUsed: 2, difficultyCompleted: 'Completed 20' }
      ];
      localStorage.setItem('sketchmind_leaderboard_20', JSON.stringify(defaultEntries));
      setEntries(defaultEntries);
    }
  };

  const clearLeaderboard = () => {
    localStorage.removeItem('sketchmind_leaderboard_20');
    setEntries([]);
    setShowConfirmReset(false);
    soundManager.playClick();
  };

  const filteredEntries = entries.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/80 shadow-2xl rounded-[2.5rem] p-6 sm:p-8 w-full max-w-xl mx-auto relative z-10">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-white/60 hover:bg-white text-slate-600 transition-all border border-white/80 shadow-sm cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
            <Trophy className="w-5 h-5 fill-current" />
          </div>

          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">20-Sketch Leaderboard</h3>
            <p className="text-xs text-slate-500 font-medium">Ranked by Completion Speed & Accuracy</p>
          </div>
        </div>

        {entries.length > 0 && (
          <button
            onClick={() => setShowConfirmReset(true)}
            className="cursor-pointer text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-100"
            title="Reset Leaderboard"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative mb-5">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search orientation participant..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/60 hover:bg-white focus:bg-white border border-white/80 focus:border-blue-500 rounded-xl font-bold transition-all outline-none shadow-sm"
        />
      </div>

      {/* Leaderboard List */}
      <div className="space-y-2.5 mb-6 max-h-[380px] overflow-y-auto pr-1">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 border border-white/60 bg-white/40 rounded-2xl text-slate-400">
            <Trophy className="w-10 h-10 stroke-[1] mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold text-slate-600">No matching records found.</p>
            <p className="text-xs text-slate-400">Complete the 20-Sketch Challenge to record a time!</p>
          </div>
        ) : (
          filteredEntries.map((entry, idx) => {
            const isHighlighted = entry.id === highlightId;
            const rankBadges = ['🥇 Gold', '🥈 Silver', '🥉 Bronze'];
            const rankColors = [
              'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md border-amber-400',
              'bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-sm border-slate-300',
              'bg-gradient-to-r from-amber-700 to-amber-800 text-white shadow-sm border-amber-600'
            ];

            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  isHighlighted
                    ? 'bg-blue-500/10 border-blue-500/30 shadow-[0_4px_16px_rgb(59,130,246,0.12)]'
                    : 'bg-white/50 border-white/80 hover:bg-white/80 shadow-xs'
                }`}
              >
                {/* Left: Rank & Name */}
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-xl text-xs font-black flex items-center justify-center border shrink-0 ${
                    idx < 3 ? rankColors[idx] : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {idx < 3 ? idx + 1 : idx + 1}
                  </div>

                  <div>
                    <span className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                      {entry.name}
                      {idx < 3 && (
                        <span className="text-[10px] font-mono font-bold text-amber-600">
                          {rankBadges[idx]}
                        </span>
                      )}
                      {isHighlighted && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-600 text-white text-[9px] font-mono rounded font-black uppercase shadow-xs">
                          <Sparkles className="w-2.5 h-2.5 fill-current" />
                          <span>NEW RECORD</span>
                        </span>
                      )}
                    </span>

                    <span className="text-[10px] text-slate-400 flex items-center gap-2 font-medium font-mono mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {entry.formattedTime}
                      </span>
                      <span>•</span>
                      <span>{entry.date}</span>
                    </span>
                  </div>
                </div>

                {/* Right: Accuracy & Score */}
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="text-xs font-bold text-slate-600 font-mono block">
                      Acc: {entry.accuracy}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Skips: {entry.skipsUsed}/3
                    </span>
                  </div>

                  <div className="font-mono text-right min-w-[60px]">
                    <span className="text-base font-black text-blue-600 tracking-tight block leading-tight">
                      {entry.score}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-widest">
                      PTS
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirm Reset Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center border border-slate-200 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-black text-slate-800 mb-1">Reset Leaderboard?</h4>
            <p className="text-xs text-slate-500 mb-6">
              This will erase all recorded orientation scores permanently. Are you sure?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={clearLeaderboard}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
