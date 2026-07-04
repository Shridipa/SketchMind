import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BrainCircuit,
  Trophy,
  Volume2,
  VolumeX,
  Eye,
  BookOpen,
  Timer,
  CheckCircle2,
  Sparkles,
  Award,
  ArrowRight,
  RotateCcw,
  RefreshCw,
  HelpCircle,
  Lightbulb
} from 'lucide-react';

import { GameState, Prediction, DrawingFeatures, Challenge } from './types';
import LandingScreen from './components/LandingScreen';
import DrawingCanvas from './components/DrawingCanvas';
import VisionModePanel from './components/VisionModePanel';
import LeaderboardPanel from './components/LeaderboardPanel';
import EducationPanel from './components/EducationPanel';
import AchievementsPanel, { checkAndUnlockAchievements } from './components/AchievementsPanel';
import EndScreen from './components/EndScreen';
import { soundManager } from './components/SoundManager';
import { CATEGORIES, CATEGORY_DETAILS, extractFeatures, predictDrawing } from './utils/mlEngine';

// Levels definition
const LEVEL_1_OBJECTS = ['Apple', 'Star', 'Fish'];
const LEVEL_2_OBJECTS = ['House', 'Tree', 'Car'];
const LEVEL_3_OBJECTS = ['Bicycle', 'Airplane', 'Cat', 'Flower'];

export default function App() {
  const [gameState, setGameState] = useState<GameState>('landing');
  const [isMuted, setIsMuted] = useState(false);
  const [visionMode, setVisionMode] = useState(false);
  
  // Game state variables
  const [currentRound, setCurrentRound] = useState(0); // 0 (Level 1), 1 (Level 2), 2 (Level 3)
  const [roundChallenges, setRoundChallenges] = useState<Challenge[]>([]);
  const [points, setPoints] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [grayscale, setGrayscale] = useState<number[][]>(
    Array(28).fill(0).map(() => Array(28).fill(0))
  );
  const [features, setFeatures] = useState<DrawingFeatures>({
    aspectRatio: 1.0,
    density: 0,
    circularity: 0,
    symmetryHorizontal: 1.0,
    symmetryVertical: 1.0,
    topHeavyRatio: 0.5,
    leftHeavyRatio: 0.5,
    strokeCount: 0,
    cornerCount: 0,
    hasClosedLoop: false
  });

  // Analytics of game play
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [roundAccuracies, setRoundAccuracies] = useState<number[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [bestDrawing, setBestDrawing] = useState<{
    category: string;
    level: number;
    strokes: { x: number; y: number }[][];
    dimensions: { width: number; height: number };
    confidence: number;
  } | null>(null);

  // Active round transient state
  const [bestConfidenceInRound, setBestConfidenceInRound] = useState(0);
  const [pointsEarnedInRound, setPointsEarnedInRound] = useState(0);
  const [roundComplete, setRoundComplete] = useState(false);
  const [achievementNotification, setAchievementNotification] = useState<string | null>(null);
  const [highlightedLeaderboardId, setHighlightedLeaderboardId] = useState<string | undefined>(undefined);

  // Sound sync
  useEffect(() => {
    setIsMuted(soundManager.getMuteStatus());
  }, []);

  // Timer interval hook
  useEffect(() => {
    if (gameState !== 'playing' || roundComplete) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleRoundTimeout();
          return 0;
        }
        
        // Play warning tick on final 5 seconds
        if (prev <= 6) {
          soundManager.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, roundComplete]);

  // Setup 3 random challenges representing Levels 1, 2, and 3
  const initGame = () => {
    const pickRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    
    const c1 = pickRandom(LEVEL_1_OBJECTS);
    const c2 = pickRandom(LEVEL_2_OBJECTS);
    const c3 = pickRandom(LEVEL_3_OBJECTS);

    const challenges: Challenge[] = [
      {
        word: c1,
        level: 1,
        difficulty: 'Easy',
        description: CATEGORY_DETAILS[c1]?.description || ''
      },
      {
        word: c2,
        level: 2,
        difficulty: 'Medium',
        description: CATEGORY_DETAILS[c2]?.description || ''
      },
      {
        word: c3,
        level: 3,
        difficulty: 'Hard',
        description: CATEGORY_DETAILS[c3]?.description || ''
      }
    ];

    setRoundChallenges(challenges);
    setCurrentRound(0);
    setPoints(0);
    setRoundScores([]);
    setRoundAccuracies([]);
    setBestDrawing(null);
    startRound(0, challenges);
  };

  const startRound = (roundIdx: number, challengesList = roundChallenges) => {
    setTimeRemaining(30);
    setPredictions([]);
    setGrayscale(Array(28).fill(0).map(() => Array(28).fill(0)));
    setFeatures({
      aspectRatio: 1.0,
      density: 0,
      circularity: 0,
      symmetryHorizontal: 1.0,
      symmetryVertical: 1.0,
      topHeavyRatio: 0.5,
      leftHeavyRatio: 0.5,
      strokeCount: 0,
      cornerCount: 0,
      hasClosedLoop: false
    });
    setBestConfidenceInRound(0);
    setPointsEarnedInRound(0);
    setRoundComplete(false);
    setGameState('playing');
  };

  // Real-time canvas drawing analysis trigger
  const handleDrawingChange = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    strokeCount: number,
    strokePoints: { x: number; y: number }[][]
  ) => {
    if (gameState !== 'playing' || roundComplete) return;

    // 1. Extract CV features and 28x28 pixel matrix
    const { features: extracted, grayscale28 } = extractFeatures(ctx, width, height, strokeCount, strokePoints);
    setFeatures(extracted);
    setGrayscale(grayscale28);

    // 2. Predict using Softmax mathematical model
    const results = predictDrawing(extracted, grayscale28);
    setPredictions(results);

    // Find confidence for our target word
    const activeChallenge = roundChallenges[currentRound];
    if (!activeChallenge) return;

    const targetMatch = results.find(p => p.className === activeChallenge.word);
    const confidence = targetMatch ? Math.round(targetMatch.probability * 100) : 0;

    if (confidence > bestConfidenceInRound) {
      setBestConfidenceInRound(confidence);
    }

    // Save best drawing tracking
    if (confidence > 40 && (!bestDrawing || confidence > bestDrawing.confidence)) {
      setBestDrawing({
        category: activeChallenge.word,
        level: activeChallenge.level,
        strokes: strokePoints,
        dimensions: { width, height },
        confidence
      });
    }

    // Interactive gameplay: If user hits perfect target recognition limit (>= 80%)
    if (confidence >= 80) {
      // Award points depending on confidence brackets
      let awardedPoints = 70; // Good
      if (confidence >= 90) awardedPoints = 100; // Perfect

      triggerRoundCompletion(awardedPoints, confidence, strokePoints, { width, height });
    }
  }, [gameState, currentRound, roundChallenges, bestConfidenceInRound, roundComplete, bestDrawing]);

  // Round completion triggers
  const triggerRoundCompletion = (
    awardedPoints: number,
    finalConfidence: number,
    strokes: { x: number; y: number }[][],
    dimensions: { width: number; height: number }
  ) => {
    setRoundComplete(true);
    setPointsEarnedInRound(awardedPoints);
    setPoints(prev => prev + awardedPoints);
    setRoundScores(prev => [...prev, awardedPoints]);
    setRoundAccuracies(prev => [...prev, finalConfidence]);

    // Play victory tone
    soundManager.playCorrect();

    // Check and trigger local achievements
    const stats = {
      maxProbability: finalConfidence,
      levelCompleted: currentRound + 1,
      pointsScored: awardedPoints,
      secondsRemaining: timeRemaining
    };

    const updatedBadges = checkAndUnlockAchievements(unlockedAchievements, stats, (badgeId) => {
      // Trigger floating success notification
      const achDetails = {
        'ai-whisperer': '🔮 AI Whisperer Unlocked! (95%+ Confidence)',
        'sketch-master': '🎨 Sketch Master Unlocked! (Completed Level 3)',
        'perfect-draw': '🎯 Perfect Draw Unlocked! (100 Point Score)',
        'speed-artist': '⚡ Speed Artist Unlocked! (Drawn in <10s)'
      }[badgeId] || 'Achievement Unlocked!';
      
      setAchievementNotification(achDetails);
      soundManager.playAchievement();
      
      setTimeout(() => {
        setAchievementNotification(null);
      }, 4000);
    });

    setUnlockedAchievements(updatedBadges);
  };

  // Timer expires without hitting perfect recognition
  const handleRoundTimeout = () => {
    // Check if we got partial recognition (>= 50% confidence)
    let awardedPoints = 0;
    let finalConf = bestConfidenceInRound;

    if (finalConf >= 50) {
      awardedPoints = 40; // Partial
    }

    setRoundComplete(true);
    setPointsEarnedInRound(awardedPoints);
    setPoints(prev => prev + awardedPoints);
    setRoundScores(prev => [...prev, awardedPoints]);
    setRoundAccuracies(prev => [...prev, finalConf]);

    if (awardedPoints > 0) {
      soundManager.playCorrect();
    } else {
      soundManager.playFailure();
    }
  };

  // Proceed to next level or final summary
  const handleProceed = () => {
    if (currentRound < 2) {
      // Go to next round
      const nextRound = currentRound + 1;
      setCurrentRound(nextRound);
      startRound(nextRound);
    } else {
      // Game over, show final scorecard
      setGameState('game-over');
    }
  };

  // Toggle mute state
  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const activeChallenge = roundChallenges[currentRound];
  const activePred = predictions[0] || { className: 'Thinking...', probability: 0 };

  // Calculate overall average accuracy
  const totalAccSum = roundAccuracies.reduce((sum, val) => sum + val, 0);
  const avgAccuracy = roundAccuracies.length > 0 ? Math.round(totalAccSum / roundAccuracies.length) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white antialiased relative overflow-hidden select-none">
      {/* Background Mesh Gradients */}
      <div className="absolute -top-48 -left-48 w-96 h-96 bg-blue-400/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-1/4 -right-24 w-[500px] h-[500px] bg-purple-400/15 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute -bottom-48 left-1/3 w-[600px] h-[600px] bg-indigo-400/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Top Global Navigation header */}
      <header className="bg-white/60 backdrop-blur-md border-b border-white/40 sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-sm relative z-40">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setGameState('landing')}>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-black text-slate-800 tracking-tight block">SketchMind</span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block leading-none">ML-Powered Recognition</span>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleMute}
            className="cursor-pointer p-2 rounded-xl bg-white/60 backdrop-blur-md hover:bg-white text-slate-600 transition-all border border-white/40 shadow-sm"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {gameState === 'playing' && (
            <button
              onClick={() => setVisionMode(!visionMode)}
              className={`cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                visionMode
                  ? 'bg-slate-900 text-white border-slate-950 shadow-md'
                  : 'bg-white/60 backdrop-blur-md text-slate-700 border-white/40 shadow-sm hover:bg-white'
              }`}
              title="Toggle AI Vision Mode to see pixel matrix"
            >
              <Eye className="w-4 h-4" />
              <span>AI Vision Mode</span>
            </button>
          )}

          <button
            onClick={() => setGameState('leaderboard')}
            className={`cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              gameState === 'leaderboard'
                ? 'bg-amber-500 text-white border-amber-400 shadow-sm'
                : 'bg-white/60 backdrop-blur-md hover:bg-white text-slate-700 border-white/40 shadow-sm'
            }`}
          >
            <Trophy className="w-4 h-4 fill-current stroke-none" />
            <span>Scores</span>
          </button>
        </div>
      </header>

      {/* Main Screen Router */}
      <main className="min-h-[calc(100vh-73px)]">
        <AnimatePresence mode="wait">
          
          {/* 1. Landing Splash Screen */}
          {gameState === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LandingScreen onStartGame={initGame} />
            </motion.div>
          )}

          {/* 2. Leaderboard View */}
          {gameState === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="py-12 px-4"
            >
              <LeaderboardPanel
                onBack={() => setGameState('landing')}
                highlightId={highlightedLeaderboardId}
              />
            </motion.div>
          )}

          {/* 3. Main Playing Screen */}
          {gameState === 'playing' && activeChallenge && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-4 md:px-6 py-8 relative z-10"
            >
              {/* Dynamic Header details for game round */}
              <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-[2rem] p-6 mb-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 bottom-0 w-2.5 bg-gradient-to-b from-blue-600 to-purple-600" />
                
                {/* Round Prompt */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-white/40 backdrop-blur-sm border border-white/60 text-indigo-600 rounded uppercase">
                      Round {currentRound + 1} of 3
                    </span>
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-white/40 backdrop-blur-sm border border-white/60 text-slate-500 rounded uppercase">
                      Level: {activeChallenge.difficulty}
                    </span>
                  </div>
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                    Draw a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">{activeChallenge.word}</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium max-w-md mt-0.5 leading-relaxed">
                    {activeChallenge.description}
                  </p>
                </div>

                {/* Score & Timer Indicators */}
                <div className="flex items-center gap-6">
                  {/* Confidence Monitor */}
                  <div className="text-center md:text-right pr-6 border-r border-slate-200">
                    <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest block mb-0.5">Best Confidence</span>
                    <span className="text-2xl font-black text-slate-800 font-mono">
                      {bestConfidenceInRound}%
                    </span>
                  </div>

                  {/* Countdown Clock */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          fill="transparent"
                          stroke="rgba(255, 255, 255, 0.4)"
                          strokeWidth="4"
                        />
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          fill="transparent"
                          stroke={timeRemaining < 10 ? '#f43f5e' : '#2563eb'}
                          strokeWidth="4"
                          strokeDasharray={2 * Math.PI * 20}
                          strokeDashoffset={2 * Math.PI * 20 * (1 - timeRemaining / 30)}
                          className="transition-all duration-1000 ease-linear"
                        />
                      </svg>
                      <span className={`absolute text-sm font-extrabold font-mono ${
                        timeRemaining < 10 ? 'text-rose-500 animate-pulse' : 'text-slate-700'
                      }`}>
                        {timeRemaining}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider block">Time Left</span>
                      <span className="text-xs font-bold text-slate-600 font-mono">Seconds</span>
                    </div>
                  </div>

                  {/* Points display */}
                  <div className="bg-white/60 backdrop-blur-md border border-white/40 p-3 rounded-xl flex flex-col items-center justify-center font-mono text-center shrink-0 min-w-[70px] shadow-sm">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
                    <span className="text-base font-black text-blue-600">{points}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase leading-none">PTS</span>
                  </div>
                </div>
              </div>

              {/* Responsive Workspace layouts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
                
                {/* LEFT BLOCK: Always user canvas */}
                <div className={`${visionMode ? 'lg:col-span-6' : 'lg:col-span-8'} flex flex-col h-full`}>
                  <div className="bg-white/70 backdrop-blur-md border border-white rounded-[3rem] shadow-2xl shadow-slate-200/50 p-6 h-full relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <span className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span>Interactive Sketch Canvas</span>
                      </span>
                      <span className="text-xs text-slate-400 font-medium">Draw lines with your mouse or finger</span>
                    </div>
                    <DrawingCanvas
                      onDrawingChange={handleDrawingChange}
                      targetObjectTip={CATEGORY_DETAILS[activeChallenge.word]?.tips}
                    />
                  </div>
                </div>

                {/* RIGHT BLOCK: Changes based on Vision Mode toggle */}
                <div className={`${visionMode ? 'lg:col-span-6' : 'lg:col-span-4'} space-y-6 h-full`}>
                  
                  {visionMode ? (
                    /* AI Vision split screen view */
                    <VisionModePanel
                      grayscale28={grayscale}
                      features={features}
                      predictions={predictions}
                      targetObject={activeChallenge.word}
                    />
                  ) : (
                    /* Standard simple preview with confidence bars and side-educator card */
                    <div className="space-y-6">
                      
                      {/* Confidence Predictions progress bar card */}
                      <div className="bg-white/60 backdrop-blur-md border border-white/60 p-6 rounded-[2rem] shadow-sm">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                          <h3 className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <BrainCircuit className="w-4 h-4 text-blue-500" />
                            <span>Real-Time AI Guessing</span>
                          </h3>
                          <span className="text-[10px] text-slate-400 font-mono font-bold animate-pulse">
                            ACTIVE
                          </span>
                        </div>

                        {predictions.length === 0 ? (
                          <div className="text-center py-12 text-slate-400">
                            <span className="text-2xl block mb-2">🔮</span>
                            <p className="text-xs font-semibold">AI is waiting for strokes...</p>
                            <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto">Start sketching inside the box to activate classification.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="bg-white/40 backdrop-blur-sm p-2.5 rounded-xl border border-white/60 flex items-center justify-between mb-4">
                              <span className="text-xs text-slate-500 font-bold">Top Match:</span>
                              <span className="text-xs font-black text-blue-600 font-mono uppercase bg-white/60 px-2 py-0.5 rounded border border-white/60 shadow-sm">
                                {activePred.className} ({Math.round(activePred.probability * 100)}%)
                              </span>
                            </div>

                            <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-widest block mb-1">
                              Prediction Confidence
                            </span>

                            {/* Render top 3 prediction bars */}
                            {predictions.slice(0, 3).map(pred => {
                              const isTarget = pred.className === activeChallenge.word;
                              const percentage = Math.round(pred.probability * 100);
                              
                              return (
                                <div key={pred.className} className="space-y-1">
                                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                    <span className="flex items-center gap-1.5">
                                      {pred.className}
                                      {isTarget && (
                                        <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                                          TARGET
                                        </span>
                                      )}
                                    </span>
                                    <span className="font-mono text-slate-500">{percentage}%</span>
                                  </div>
                                  <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                    <motion.div
                                      className={`h-full rounded-full ${
                                        isTarget 
                                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500' 
                                          : 'bg-slate-400'
                                      }`}
                                      animate={{ width: `${percentage}%` }}
                                      transition={{ duration: 0.15 }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Educational panel */}
                      <EducationPanel />
                    </div>
                  )}

                </div>
              </div>

              {/* Staggered overlay completion dialog */}
              <AnimatePresence>
                {roundComplete && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4"
                  >
                    <motion.div
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 20 }}
                      className="bg-white/80 backdrop-blur-xl border border-white rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 text-center"
                    >
                      {/* Points icon display */}
                      <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-500 flex items-center justify-center mx-auto mb-4 text-3xl">
                        {pointsEarnedInRound > 0 ? '🎉' : '⏱️'}
                      </div>

                      <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-1">
                        {pointsEarnedInRound >= 90 
                          ? 'Perfect Recognition!' 
                          : pointsEarnedInRound >= 70 
                          ? 'Excellent Drawing!' 
                          : pointsEarnedInRound >= 40 
                          ? 'Partial Match!' 
                          : "Time's Up!"}
                      </h3>
                      
                      <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto mb-6">
                        {pointsEarnedInRound > 0 
                          ? `The AI successfully identified your ${activeChallenge.word} sketch with a high matching confidence score!` 
                          : `We couldn't quite recognize the ${activeChallenge.word} with high confidence this time, but let's keep sketching to score points.`}
                      </p>

                      {/* Performance scorecard */}
                      <div className="bg-white/40 border border-white/60 rounded-2xl p-4 grid grid-cols-2 gap-4 mb-6 shadow-sm">
                        <div className="text-center font-mono">
                          <span className="text-[10px] text-slate-400 font-bold font-sans uppercase block mb-0.5">Points Scored</span>
                          <span className="text-xl font-black text-blue-600">+{pointsEarnedInRound}</span>
                          <span className="text-[9px] text-slate-400 font-bold block leading-none mt-0.5">PTS</span>
                        </div>
                        <div className="text-center font-mono border-l border-white/60">
                          <span className="text-[10px] text-slate-400 font-bold font-sans uppercase block mb-0.5">Best Confidence</span>
                          <span className="text-xl font-black text-slate-700">{bestConfidenceInRound}%</span>
                          <span className="text-[9px] text-slate-400 font-bold block leading-none mt-0.5">MATCH</span>
                        </div>
                      </div>

                      <button
                        onClick={handleProceed}
                        className="cursor-pointer w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white rounded-xl text-sm font-extrabold transition-all select-none shadow-lg shadow-blue-500/25"
                      >
                        <span>{currentRound < 2 ? 'Next Level' : 'View Final Scorecard'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          )}

          {/* 4. End game summary screen */}
          {gameState === 'game-over' && (
            <motion.div
              key="game-over"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EndScreen
                score={points}
                accuracy={avgAccuracy}
                bestDrawing={bestDrawing}
                unlockedAchievements={unlockedAchievements}
                levelReached={currentRound + 1}
                onPlayAgain={initGame}
                onViewLeaderboard={(highlightId) => {
                  setHighlightedLeaderboardId(highlightId);
                  setGameState('leaderboard');
                }}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Floating global notifications for Achievements unlocked */}
      <AnimatePresence>
        {achievementNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 text-white shadow-2xl rounded-2xl border border-slate-800 p-4.5 flex items-center gap-3.5 pointer-events-none"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-inner">
              <Award className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <span className="text-[9px] font-bold font-mono text-indigo-400 uppercase tracking-widest block mb-0.5">Milestone Achieved!</span>
              <p className="text-xs font-black text-slate-100">{achievementNotification}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
