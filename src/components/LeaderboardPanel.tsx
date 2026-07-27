import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Clock, Search, ArrowLeft, Sparkles, Trash2, ShieldAlert, Zap, CheckCircle, Flame, UserCheck } from 'lucide-react';
import { DailyLeaderboardEntry } from '../types';
import { getLeaderboard, cleanupExpiredScores, clearLeaderboard, seedSampleEntriesIfEmpty } from '../utils/leaderboardService';
import { soundManager } from './SoundManager';

interface LeaderboardPanelProps {
  onBack?: () => void;
  highlightId?: string;
}

export default function LeaderboardPanel({ onBack, highlightId }: LeaderboardPanelProps) {
  const [entries, setEntries] = useState<DailyLeaderboardEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [timeNow, setTimeNow] = useState(Date.now());
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clean up expired scores on mount and load valid entries
    loadData();

    // Live clock update every 30s to update relative expiration timers
    const interval = setInterval(() => {
      setTimeNow(Date.now());
      cleanupExpiredScores();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    // Seed sample entries if totally empty so orientation mode looks populated on first launch
    seedSampleEntriesIfEmpty();
    const active = getLeaderboard();
    setEntries(active);
  };

  // Auto-scroll to highlighted player card if highlightId is passed
  useEffect(() => {
    if (highlightId && highlightRef.current) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [highlightId, entries]);

  const handleClear = () => {
    clearLeaderboard();
    setEntries([]);
    setShowConfirmReset(false);
    soundManager.playClick();
  };

  const filteredEntries = entries.filter(e =>
    e.playerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getRemainingTimeString = (expiresAt: number) => {
    const diffMs = expiresAt - timeNow;
    if (diffMs <= 0) return 'Expiring';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/80 shadow-2xl rounded-[2.5rem] p-5 sm:p-8 w-full max-w-xl mx-auto relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 rounded-2xl bg-white/80 hover:bg-white text-slate-600 transition-all border border-white/80 shadow-xs cursor-pointer active:scale-95"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
            <Trophy className="w-6 h-6 fill-current" />
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none">
              🏆 Today's Champions
            </h3>
            <p className="text-[11px] text-amber-700/80 font-bold mt-1 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-500 fill-current" />
              <span>Live 24-Hour Event Leaderboard</span>
            </p>
          </div>
        </div>

        {entries.length > 0 && (
          <button
            onClick={() => setShowConfirmReset(true)}
            className="cursor-pointer text-slate-400 hover:text-rose-600 p-2.5 rounded-2xl hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-100"
            title="Reset Event Leaderboard"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Subtitle Banner */}
      <div className="bg-amber-50/80 border border-amber-200/60 rounded-2xl p-3 mb-5 flex items-start gap-2.5">
        <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[11px] font-semibold text-amber-900/80 leading-relaxed">
          Only scores from the last 24 hours are shown. The leaderboard refreshes automatically every day to keep the competition fresh!
        </p>
      </div>

      {/* Search Input */}
      {entries.length > 0 && (
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search event participant..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/80 focus:bg-white border border-white/80 focus:border-amber-500 rounded-2xl font-bold transition-all outline-none shadow-xs"
          />
        </div>
      )}

      {/* Leaderboard Entries List */}
      <div className="space-y-3 mb-4 max-h-[420px] overflow-y-auto pr-1">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 px-4 border border-white/80 bg-white/50 rounded-3xl text-slate-400 flex flex-col items-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-100/60 border border-amber-200/80 flex items-center justify-center text-amber-500 mb-3 shadow-inner">
              <Trophy className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h4 className="text-base font-extrabold text-slate-700 mb-1">
              No one has played today's challenge yet.
            </h4>
            <p className="text-xs text-slate-500 font-medium max-w-xs mb-4">
              Be the first SketchMind Champion! Complete the 20-Sketch Challenge to top the event board.
            </p>
            {onBack && (
              <button
                onClick={onBack}
                className="cursor-pointer bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-95 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Flame className="w-4 h-4" />
                <span>Start Challenge Now</span>
              </button>
            )}
          </div>
        ) : (
          filteredEntries.map((entry, idx) => {
            const isHighlighted = entry.id === highlightId;
            const rankBadges = ['🥇 Gold', '🥈 Silver', '🥉 Bronze'];
            const rankGradients = [
              'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20 border-amber-300',
              'bg-gradient-to-r from-slate-400 via-slate-500 to-slate-600 text-white shadow-sm border-slate-300',
              'bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white shadow-sm border-amber-600'
            ];

            return (
              <motion.div
                key={entry.id}
                ref={isHighlighted ? highlightRef : undefined}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.03 }}
                className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  isHighlighted
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-500/40 shadow-[0_4px_20px_rgba(59,130,246,0.2)] scale-[1.02] ring-2 ring-blue-500/30'
                    : idx < 3
                    ? 'bg-white/80 border-white shadow-xs hover:bg-white'
                    : 'bg-white/60 border-white/80 hover:bg-white/80 shadow-xs'
                }`}
              >
                {/* Left Section: Rank & Details */}
                <div className="flex items-center gap-3">
                  {/* Rank Badge */}
                  <div
                    className={`w-8 h-8 rounded-2xl text-xs font-black flex items-center justify-center border shrink-0 ${
                      idx < 3 ? rankGradients[idx] : 'bg-slate-100 text-slate-700 border-slate-200 font-mono'
                    }`}
                  >
                    {idx + 1}
                  </div>

                  {/* Player Info */}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-extrabold text-slate-800">
                        {entry.playerName}
                      </span>

                      {idx < 3 && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                          {rankBadges[idx]}
                        </span>
                      )}

                      {isHighlighted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white text-[9px] font-extrabold rounded-full shadow-xs animate-pulse">
                          <Sparkles className="w-2.5 h-2.5 fill-current" />
                          <span>YOU</span>
                        </span>
                      )}
                    </div>

                    {/* Metadata Row */}
                    <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500 font-bold mt-1">
                      <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                        {entry.totalSketchesCompleted || 20}/20 Sketches
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatSeconds(entry.completionTime)}
                      </span>
                      <span>•</span>
                      <span className="text-amber-600 font-sans font-semibold">
                        {getRemainingTimeString(entry.expiresAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Section: Score & Accuracy */}
                <div className="flex items-center gap-3 text-right shrink-0">
                  <div className="hidden sm:block">
                    <span className="text-xs font-bold text-slate-700 font-mono block">
                      Acc: {entry.accuracy}%
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono font-bold block">
                      Conf: {entry.averageConfidence || entry.accuracy}%
                    </span>
                  </div>

                  <div className="bg-white/80 border border-slate-200/70 px-3 py-1.5 rounded-xl font-mono text-right min-w-[70px]">
                    <span className="text-base font-black text-amber-600 tracking-tight block leading-tight">
                      {entry.score}
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">
                      PTS
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Confirm Clear Modal */}
      <AnimatePresence>
        {showConfirmReset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full text-center border border-slate-200 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto mb-3">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black text-slate-800 mb-1">Clear Event Board?</h4>
              <p className="text-xs text-slate-500 mb-6 font-medium">
                This will wipe all active scores from today's challenge. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClear}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Confirm Clear
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
