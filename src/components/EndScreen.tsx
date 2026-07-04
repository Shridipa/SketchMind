import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Award, RefreshCw, Trophy, Sparkles, User, HelpCircle } from 'lucide-react';
import { saveScoreToLeaderboard } from './LeaderboardPanel';
import AchievementsPanel from './AchievementsPanel';
import { soundManager } from './SoundManager';

interface EndScreenProps {
  score: number;
  accuracy: number;
  bestDrawing: {
    category: string;
    level: number;
    strokes: { x: number; y: number }[][];
    dimensions: { width: number; height: number };
  } | null;
  unlockedAchievements: string[];
  levelReached: number;
  onPlayAgain: () => void;
  onViewLeaderboard: (newHighlightId?: string) => void;
}

export default function EndScreen({
  score,
  accuracy,
  bestDrawing,
  unlockedAchievements,
  levelReached,
  onPlayAgain,
  onViewLeaderboard
}: EndScreenProps) {
  const [playerName, setPlayerName] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const bestCanvasRef = useRef<HTMLCanvasElement>(null);

  // Redraw best drawing thumbnail inside the visual art frame
  useEffect(() => {
    if (!bestDrawing || !bestCanvasRef.current) return;

    const canvas = bestCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fixed drawing thumbnail dimensions
    canvas.width = 160;
    canvas.height = 140;
    ctx.clearRect(0, 0, 160, 140);

    const strokes = bestDrawing.strokes;
    if (strokes.length === 0) return;

    // Find bounding box to scale drawing to fit 160x140 perfectly
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

    // Add padding around original boundaries before scaling
    const pad = Math.max(boxW, boxH) * 0.12;
    const paddedMinX = Math.max(0, minX - pad);
    const paddedMaxX = Math.min(bestDrawing.dimensions.width, maxX + pad);
    const paddedMinY = Math.max(0, minY - pad);
    const paddedMaxY = Math.min(bestDrawing.dimensions.height, maxY + pad);
    const paddedW = paddedMaxX - paddedMinX;
    const paddedH = paddedMaxY - paddedMinY;

    // Compute scale and offsets
    const scale = Math.min(140 / paddedW, 120 / paddedH);
    const offsetX = (160 - paddedW * scale) / 2;
    const offsetY = (140 - paddedH * scale) / 2;

    // Draw the scaled paths on thumbnail canvas
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e293b'; // slate-800
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

    // Save to local storage leaderboard
    const newEntry = saveScoreToLeaderboard(playerName, score, accuracy, levelReached);
    setIsSaved(true);
    soundManager.playCorrect();

    // Go to leaderboard and highlight newly saved score
    setTimeout(() => {
      onViewLeaderboard(newEntry.id);
    }, 600);
  };

  return (
    <div className="relative min-h-[calc(100vh-73px)] text-slate-800 flex flex-col items-center justify-center py-12 px-4 overflow-hidden z-10">
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Soft floating blur circles */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-300/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-2xl w-full z-10 flex flex-col items-center">
        {/* Triumphant Cup Badge */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="w-16 h-16 rounded-2xl bg-white/60 border border-white/80 backdrop-blur-md flex items-center justify-center text-blue-600 shadow-md mb-5"
        >
          <Award className="w-8 h-8 text-blue-600" />
        </motion.div>

        <h2 className="text-4xl font-black text-slate-800 tracking-tight leading-none mb-2">
          Orientation Completed!
        </h2>
        <p className="text-slate-500 font-medium text-center max-w-sm mb-8">
          Excellent work sketching for the machine learning classifier. See your finalized performance scorecard below:
        </p>

        {/* Scorecard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8">
          
          {/* Left: Score Card */}
          <div className="bg-white/60 backdrop-blur-md border border-white/60 rounded-[2rem] p-6 flex flex-col justify-between shadow-sm">
            <div>
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest block mb-2">Performance stats</span>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/40 border border-white/60 p-3.5 rounded-xl">
                  <span className="text-xs text-slate-400 font-semibold block mb-0.5">Final Score</span>
                  <span className="text-3xl font-black text-blue-600 font-mono tracking-tight">{score}</span>
                  <span className="text-[10px] text-slate-400 font-bold font-mono ml-1">pts</span>
                </div>
                
                <div className="bg-white/40 border border-white/60 p-3.5 rounded-xl">
                  <span className="text-xs text-slate-400 font-semibold block mb-0.5">Accuracy Score</span>
                  <span className="text-3xl font-black text-emerald-500 font-mono tracking-tight">{accuracy}%</span>
                  <span className="text-[10px] text-slate-400 font-bold font-mono ml-1">avg</span>
                </div>
              </div>

              <div className="bg-white/40 border border-white/60 p-3.5 rounded-xl mt-4 flex items-center justify-between shadow-sm">
                <span className="text-xs font-bold text-slate-500">Highest Level Cleared:</span>
                <span className="text-xs font-black text-white px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-sm">Level {levelReached}</span>
              </div>
            </div>

            {/* Save High Score Form */}
            {!isSaved ? (
              <form onSubmit={handleSubmitScore} className="mt-5 pt-4 border-t border-slate-100">
                <label className="text-[10px] font-bold font-mono text-indigo-600 uppercase tracking-wider block mb-2">
                  Log Score to local leaderboard
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      maxLength={18}
                      placeholder="Your Name (e.g. Zack - CS)"
                      value={playerName}
                      onChange={e => setPlayerName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 text-xs bg-white/40 hover:bg-white/60 focus:bg-white border border-white/60 focus:border-blue-500 focus:outline-none rounded-xl font-bold transition-all shadow-sm"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white text-xs font-extrabold px-4.5 py-2.5 rounded-xl transition-all shadow-md"
                  >
                    Save Score
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 mt-5 flex items-center justify-center text-emerald-700 text-xs font-bold gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Score logged successfully to local records!</span>
              </div>
            )}
          </div>

          {/* Right: Best Drawing Art Framed */}
          <div className="bg-white/60 backdrop-blur-md border border-white/60 rounded-[2rem] p-5 flex flex-col items-center justify-center text-center shadow-sm">
            <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest block mb-4">
              Your curatorial Masterpiece
            </span>

            {bestDrawing ? (
              <div className="flex flex-col items-center">
                {/* Museum Style Frame */}
                <div className="p-3 bg-white border-[10px] border-slate-800 shadow-2xl rounded-sm mb-4 transform hover:scale-102 transition-transform duration-300">
                  <div className="bg-slate-50 border border-slate-200 shadow-inner rounded-sm overflow-hidden flex items-center justify-center p-1">
                    <canvas ref={bestCanvasRef} className="block opacity-85" />
                  </div>
                </div>

                {/* Frame Caption plaque */}
                <div className="bg-white/40 border border-white/60 backdrop-blur-sm px-3 py-1.5 rounded text-center shadow-sm">
                  <span className="text-xs font-bold text-slate-800 block italic leading-tight">
                    "{bestDrawing.category}"
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono font-bold block mt-0.5">
                    Artist: You • Level {bestDrawing.level} Match
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-slate-300 flex flex-col items-center py-6">
                <HelpCircle className="w-12 h-12 stroke-[1] mb-2 text-slate-200" />
                <p className="text-xs font-medium">No drawings recorded</p>
              </div>
            )}
          </div>
        </div>

        {/* Unlocked Achievements list */}
        <div className="w-full mb-8">
          <AchievementsPanel unlockedIds={unlockedAchievements} />
        </div>

        {/* Footer Nav Controls */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={onPlayAgain}
            className="cursor-pointer flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-500/20 hover:opacity-95 transition-all select-none"
          >
            <RefreshCw className="w-4 h-4 animate-spin-slow" />
            <span>Play Again</span>
          </button>

          <button
            onClick={() => onViewLeaderboard()}
            className="cursor-pointer flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/60 border border-white/60 hover:bg-white text-slate-700 font-extrabold text-sm rounded-xl transition-all select-none shadow-sm"
          >
            <Trophy className="w-4 h-4 fill-slate-400 stroke-none" />
            <span>View Leaderboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
