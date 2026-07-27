import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Award, RefreshCw, Trophy, Sparkles, User, HelpCircle, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';
import AchievementsPanel from './AchievementsPanel';
import { soundManager } from './SoundManager';
import { LeaderboardEntry } from '../types';

interface EndScreenProps {
  score: number;
  accuracy: number;
  totalTimeSeconds: number;
  sketchesCompleted: number;
  skipsUsed: number;
  bestDrawing: {
    category: string;
    level: number;
    strokes: { x: number; y: number }[][];
    dimensions: { width: number; height: number };
    confidence?: number;
  } | null;
  unlockedAchievements: string[];
  onPlayAgain: () => void;
  onViewLeaderboard: (newHighlightId?: string) => void;
}

export default function EndScreen({
  score,
  accuracy,
  totalTimeSeconds,
  sketchesCompleted,
  skipsUsed,
  bestDrawing,
  unlockedAchievements,
  onPlayAgain,
  onViewLeaderboard
}: EndScreenProps) {
  const [playerName, setPlayerName] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const bestCanvasRef = useRef<HTMLCanvasElement>(null);

  // Format total seconds into MM:SS
  const mins = Math.floor(totalTimeSeconds / 60);
  const secs = totalTimeSeconds % 60;
  const formattedTime = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

  // Confetti burst on mount!
  useEffect(() => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      soundManager.playAchievement();
    } catch (e) {
      console.error('Confetti error:', e);
    }
  }, []);

  // Redraw best drawing thumbnail in frame
  useEffect(() => {
    if (!bestDrawing || !bestCanvasRef.current) return;

    const canvas = bestCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 180;
    canvas.height = 150;
    ctx.clearRect(0, 0, 180, 150);

    const strokes = bestDrawing.strokes;
    if (strokes.length === 0) return;

    let minX = bestDrawing.dimensions.width;
    let maxX = 0;
    let minY = bestDrawing.dimensions.height;
    let maxY = 0;

    strokes.forEach(stroke => {
      stroke.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      });
    });

    const boxW = maxX - minX + 1;
    const boxH = maxY - minY + 1;
    if (boxW <= 0 || boxH <= 0) return;

    const pad = Math.max(boxW, boxH) * 0.12;
    const paddedMinX = Math.max(0, minX - pad);
    const paddedMaxX = Math.min(bestDrawing.dimensions.width, maxX + pad);
    const paddedMinY = Math.max(0, minY - pad);
    const paddedMaxY = Math.min(bestDrawing.dimensions.height, maxY + pad);
    const paddedW = paddedMaxX - paddedMinX;
    const paddedH = paddedMaxY - paddedMinY;

    const scale = Math.min(160 / paddedW, 130 / paddedH);
    const offsetX = (180 - paddedW * scale) / 2;
    const offsetY = (150 - paddedH * scale) / 2;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;

    strokes.forEach(stroke => {
      if (stroke.length === 0) return;
      ctx.beginPath();
      const firstX = (stroke[0].x - paddedMinX) * scale + offsetX;
      const firstY = (stroke[0].y - paddedMinY) * scale + offsetY;
      ctx.moveTo(firstX, firstY);

      for (let i = 1; i < stroke.length; i++) {
        const x = (stroke[i].x - paddedMinX) * scale + offsetX;
        const y = (stroke[i].y - paddedMinY) * scale + offsetY;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
  }, [bestDrawing]);

  const handleSubmitScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || isSaved) return;

    const newId = `score_${Date.now()}`;
    const entry: LeaderboardEntry = {
      id: newId,
      name: playerName.trim(),
      completionTime: totalTimeSeconds,
      formattedTime,
      score,
      date: new Date().toISOString().split('T')[0],
      accuracy,
      skipsUsed,
      difficultyCompleted: `Completed ${sketchesCompleted}/20`
    };

    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('sketchmind_leaderboard_20');
      let parsed: LeaderboardEntry[] = [];
      if (stored) {
        try {
          parsed = JSON.parse(stored);
        } catch (err) {
          console.error(err);
        }
      }
      parsed.push(entry);
      localStorage.setItem('sketchmind_leaderboard_20', JSON.stringify(parsed));
    }

    setIsSaved(true);
    soundManager.playCorrect();

    setTimeout(() => {
      onViewLeaderboard(newId);
    }, 600);
  };

  return (
    <div className="relative min-h-[calc(100vh-73px)] text-slate-800 flex flex-col items-center justify-center py-8 px-4 overflow-hidden z-10">
      <div className="max-w-2xl w-full z-10 flex flex-col items-center">
        {/* Triumphant Cup Badge */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="w-16 h-16 rounded-2xl bg-white/80 border border-white/80 backdrop-blur-md flex items-center justify-center text-blue-600 shadow-lg mb-4"
        >
          <Award className="w-8 h-8 text-blue-600" />
        </motion.div>

        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none mb-2 text-center">
          20-Sketch Challenge Complete!
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium text-center max-w-md mb-6">
          Congratulations! You finished the orientation AI drawing race. Check your performance stats below:
        </p>

        {/* Scorecard Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-6">
          
          {/* Left: Score & Time Stats */}
          <div className="bg-white/70 backdrop-blur-md border border-white/80 rounded-[2rem] p-5 flex flex-col justify-between shadow-sm">
            <div>
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest block mb-3">
                Final Performance
              </span>
              
              <div className="grid grid-cols-2 gap-2.5 mb-3">
                <div className="bg-white/80 border border-slate-200/60 p-3 rounded-xl font-mono">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Time Taken</span>
                  <span className="text-2xl font-black text-blue-600">{formattedTime}</span>
                </div>
                
                <div className="bg-white/80 border border-slate-200/60 p-3 rounded-xl font-mono">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Points</span>
                  <span className="text-2xl font-black text-indigo-600">{score}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mb-3">
                <div className="bg-white/80 border border-slate-200/60 p-3 rounded-xl font-mono">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">AI Accuracy</span>
                  <span className="text-lg font-black text-emerald-600">{accuracy}%</span>
                </div>

                <div className="bg-white/80 border border-slate-200/60 p-3 rounded-xl font-mono">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Skips Used</span>
                  <span className="text-lg font-black text-slate-700">{skipsUsed} / 3</span>
                </div>
              </div>
            </div>

            {/* Save High Score Form */}
            {!isSaved ? (
              <form onSubmit={handleSubmitScore} className="mt-3 pt-3 border-t border-slate-100">
                <label className="text-[10px] font-bold font-mono text-blue-600 uppercase tracking-wider block mb-1.5">
                  Save Score to Leaderboard
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      maxLength={18}
                      placeholder="Name (e.g. Zack - CS)"
                      value={playerName}
                      onChange={e => setPlayerName(e.target.value)}
                      className="w-full pl-8 pr-2 py-2 text-xs bg-white focus:bg-white border border-slate-200 focus:border-blue-500 focus:outline-none rounded-xl font-bold transition-all shadow-xs"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl transition-all shadow-sm"
                  >
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 mt-3 flex items-center justify-center text-emerald-700 text-xs font-bold gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Score logged to 20-Sketch Leaderboard!</span>
              </div>
            )}
          </div>

          {/* Right: Best Drawing Frame */}
          <div className="bg-white/70 backdrop-blur-md border border-white/80 rounded-[2rem] p-5 flex flex-col items-center justify-center text-center shadow-sm">
            <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest block mb-3">
              Masterpiece Drawing
            </span>

            {bestDrawing ? (
              <div className="flex flex-col items-center">
                <div className="p-2.5 bg-white border-8 border-slate-800 shadow-xl rounded-sm mb-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-sm overflow-hidden flex items-center justify-center">
                    <canvas ref={bestCanvasRef} className="block" />
                  </div>
                </div>

                <div className="bg-white/80 border border-slate-200 px-3 py-1 rounded-lg text-center shadow-xs">
                  <span className="text-xs font-bold text-slate-800 block italic leading-tight">
                    "{bestDrawing.category}"
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono font-bold block mt-0.5">
                    Artist: You • {bestDrawing.confidence}% Match
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-slate-300 flex flex-col items-center py-6">
                <HelpCircle className="w-10 h-10 stroke-[1] mb-2 text-slate-200" />
                <p className="text-xs font-medium">No drawings recorded</p>
              </div>
            )}
          </div>
        </div>

        {/* Unlocked Achievements list */}
        <div className="w-full mb-6">
          <AchievementsPanel unlockedIds={unlockedAchievements} />
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={onPlayAgain}
            className="cursor-pointer flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-500/20 hover:opacity-95 transition-all select-none"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Play Again</span>
          </button>

          <button
            onClick={() => onViewLeaderboard()}
            className="cursor-pointer flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/80 border border-white/80 hover:bg-white text-slate-700 font-extrabold text-sm rounded-2xl transition-all select-none shadow-xs"
          >
            <Trophy className="w-4 h-4 text-amber-500 fill-current" />
            <span>View Leaderboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
