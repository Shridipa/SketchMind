import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BrainCircuit,
  Trophy,
  Volume2,
  VolumeX,
  Eye,
  Clock,
  CheckCircle2,
  Sparkles,
  Award,
  ArrowRight,
  SkipForward,
  HelpCircle,
  Zap,
  RotateCcw,
  Bug
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { GameState, Prediction, DrawingFeatures, Challenge } from './types';
import LandingScreen from './components/LandingScreen';
import DrawingCanvas from './components/DrawingCanvas';
import VisionModePanel from './components/VisionModePanel';
import LeaderboardPanel from './components/LeaderboardPanel';
import EducationPanel from './components/EducationPanel';
import AchievementsPanel, { checkAndUnlockAchievements } from './components/AchievementsPanel';
import HintCard from './components/HintCard';
import ConfidencePanel from './components/ConfidencePanel';
import TutorialModal from './components/TutorialModal';
import DebugPanel from './components/DebugPanel';
import EndScreen from './components/EndScreen';
import CircularTimer from './components/CircularTimer';
import { soundManager } from './components/SoundManager';
import { CATEGORIES, CHALLENGES_20, extractFeatures, predictDrawing, enhancedPredictDrawing, getTargetThreshold, checkPartialCredit, evaluateDecisionEngine } from './utils/mlEngine';
import { cleanupExpiredScores } from './utils/leaderboardService';

function getMaxTimeForDifficulty(difficulty?: string): number {
  switch (difficulty) {
    case 'Very Easy': return 40;
    case 'Easy': return 35;
    case 'Medium': return 30;
    case 'Hard': return 30;
    default: return 35;
  }
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('landing');
  const [isMuted, setIsMuted] = useState(false);
  const [visionMode, setVisionMode] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rollingBufferRef = useRef<Prediction[][]>([]);
  const lastDrawingStateRef = useRef<{
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    strokeCount: number;
    strokePoints: { x: number; y: number }[][];
  } | null>(null);

  // 20-Sketch Challenge State
  const [currentSketchIdx, setCurrentSketchIdx] = useState(0); // 0 to 19
  const [sketchList, setSketchList] = useState<Challenge[]>([]);
  const [points, setPoints] = useState(0);
  const [skipsRemaining, setSkipsRemaining] = useState(3);
  const [skipsUsed, setSkipsUsed] = useState(0);
  const [currentComboStreak, setCurrentComboStreak] = useState(0);

  // Dynamic Assistance & Adaptive Difficulty State
  const [consecutiveFailsCount, setConsecutiveFailsCount] = useState(0);
  const [isAdaptiveActive, setIsAdaptiveActive] = useState(false);
  const [bonusTimeGranted, setBonusTimeGranted] = useState(false);
  const [dynamicAssistanceTip, setDynamicAssistanceTip] = useState<string | null>(null);
  const [partialCreditNotice, setPartialCreditNotice] = useState<{ message: string; points: number } | null>(null);

  // Timers
  const [totalGameTimeSeconds, setTotalGameTimeSeconds] = useState(0);
  const [timeSpentOnCurrentSketch, setTimeSpentOnCurrentSketch] = useState(0);

  // ML Analysis State
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
  const [totalInkPixels, setTotalInkPixels] = useState(0);

  // Analytics & Best Drawing
  const [sketchAccuracies, setSketchAccuracies] = useState<number[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [bestDrawing, setBestDrawing] = useState<{
    category: string;
    level: number;
    strokes: { x: number; y: number }[][];
    dimensions: { width: number; height: number };
    confidence: number;
  } | null>(null);

  // Auto-advance modal / notification toast
  const [autoAdvanceNotice, setAutoAdvanceNotice] = useState<{
    word: string;
    points: number;
    confidence: number;
  } | null>(null);

  const [achievementNotification, setAchievementNotification] = useState<string | null>(null);
  const [highlightedLeaderboardId, setHighlightedLeaderboardId] = useState<string | undefined>(undefined);

  // Initialization & cleanup
  useEffect(() => {
    setIsMuted(soundManager.getMuteStatus());
    cleanupExpiredScores();
  }, []);

  // Global game stopwatch
  useEffect(() => {
    if (gameState !== 'playing' || autoAdvanceNotice) return;

    const timer = setInterval(() => {
      setTotalGameTimeSeconds(prev => prev + 1);
      setTimeSpentOnCurrentSketch(prev => {
        const nextTime = prev + 1;

        // Dynamic Assistance Messages based on seconds spent
        if (nextTime === 5) {
          setDynamicAssistanceTip("💡 Quick tip: Start with the basic outer shape!");
        } else if (nextTime === 10) {
          setDynamicAssistanceTip("💡 Try making the main shape larger or bolder.");
        } else if (nextTime === 15) {
          setDynamicAssistanceTip("💡 Focus on essential features (e.g. key loops, rays, or wheels)");
        } else if (nextTime === 20) {
          setDynamicAssistanceTip("🌟 AI Threshold reduced by 5%! Keep drawing!");
        } else if (nextTime === 25) {
          setDynamicAssistanceTip("🌟 AI Threshold reduced by another 5%! Almost recognized!");
        }

        // Gentle Time Pressure & Audio Tick
        const activeChallenge = sketchList[currentSketchIdx];
        if (activeChallenge) {
          const maxTime = getMaxTimeForDifficulty(activeChallenge.difficulty);
          const allowedMax = maxTime + (bonusTimeGranted ? 10 : 0);
          const remaining = allowedMax - nextTime;

          if (remaining <= 5 && remaining > 0) {
            soundManager.playTick();
          }

          if (remaining <= 5 && !bonusTimeGranted) {
            const targetMatch = predictions.find(
              p => p.className.toLowerCase().trim() === activeChallenge.word.toLowerCase().trim()
            );
            const conf = targetMatch ? Math.round(targetMatch.probability * 100) : 0;
            if (conf >= 30) {
              setBonusTimeGranted(true);
              setDynamicAssistanceTip("⏰ +10s Extra Bonus Time granted! You're almost there!");
              return Math.max(0, nextTime - 10);
            }
          }

          // Full timeout handling - Run Enhanced Final Recognition Pass before timing out
          if (nextTime >= allowedMax) {
            if (lastDrawingStateRef.current) {
              const { ctx, width, height, strokeCount, strokePoints } = lastDrawingStateRef.current;
              const enhancedResults = enhancedPredictDrawing(ctx, width, height, strokeCount, strokePoints);
              const targetMatch = enhancedResults.find(
                p => p.className.toLowerCase().trim() === activeChallenge.word.toLowerCase().trim()
              );
              const enhancedConf = targetMatch ? Math.round(targetMatch.probability * 100) : 0;
              const targetThreshold = Math.max(35, getTargetThreshold(activeChallenge.difficulty) - 10);

              if (enhancedConf >= targetThreshold) {
                triggerSketchSuccess(75, enhancedConf);
                return nextTime;
              }
            }

            soundManager.playSkip();
            setCurrentComboStreak(0);
            setConsecutiveFailsCount(c => {
              const next = c + 1;
              if (next >= 2) setIsAdaptiveActive(true);
              return next;
            });
            setSketchAccuracies(s => [...s, 0]);
            setTimeout(() => proceedToNextSketch(), 100);
          }
        }

        return nextTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, autoAdvanceNotice, bonusTimeGranted, predictions, sketchList, currentSketchIdx]);

  // Check tutorial preference on launch
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const skip = localStorage.getItem('sketchmind_skip_tutorial');
      if (!skip) {
        // Option to show tutorial when landing
      }
    }
  }, []);

  // Initialize the 20-Sketch Challenge
  const initGame = () => {
    setSketchList(CHALLENGES_20);
    setCurrentSketchIdx(0);
    setPoints(0);
    setSkipsRemaining(3);
    setSkipsUsed(0);
    setCurrentComboStreak(0);
    setTotalGameTimeSeconds(0);
    setSketchAccuracies([]);
    setBestDrawing(null);
    setConsecutiveFailsCount(0);
    setIsAdaptiveActive(false);

    startSketch(0, CHALLENGES_20);
  };

  const startSketch = (idx: number, list = sketchList) => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setTimeSpentOnCurrentSketch(0);
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
    setTotalInkPixels(0);
    setAutoAdvanceNotice(null);
    setBonusTimeGranted(false);
    setDynamicAssistanceTip(null);
    setPartialCreditNotice(null);
    rollingBufferRef.current = [];
    setGameState('playing');
  };

  // Drawing canvas change handler
  const handleDrawingChange = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    strokeCount: number,
    strokePoints: { x: number; y: number }[][],
    isStrokeActive: boolean = false
  ) => {
    if (gameState !== 'playing' || autoAdvanceNotice) return;

    lastDrawingStateRef.current = { ctx, width, height, strokeCount, strokePoints };

    // 1. Extract CV features and 28x28 matrix
    const { features: extracted, grayscale28, totalInkPixels: inkCount } = extractFeatures(ctx, width, height, strokeCount, strokePoints);
    setFeatures(extracted);
    setGrayscale(grayscale28);
    setTotalInkPixels(inkCount);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (inkCount < 35) {
      setPredictions([]);
      rollingBufferRef.current = [];
      return;
    }

    // 2. Debounce Softmax predictions (200ms) to prevent inference thrashing while drawing
    debounceTimerRef.current = setTimeout(() => {
      const rawResults = predictDrawing(extracted, grayscale28, inkCount);

      // Smooth predictions over rolling buffer (last 5 frames)
      rollingBufferRef.current.push(rawResults);
      if (rollingBufferRef.current.length > 5) {
        rollingBufferRef.current.shift();
      }

      const categorySums: Record<string, number> = {};
      rollingBufferRef.current.forEach(buf => {
        buf.forEach(p => {
          categorySums[p.className] = (categorySums[p.className] || 0) + p.probability;
        });
      });

      const bufLen = rollingBufferRef.current.length;
      const smoothedResults: Prediction[] = Object.keys(categorySums).map(cat => ({
        className: cat,
        probability: Math.round((categorySums[cat] / bufLen) * 100) / 100
      })).sort((a, b) => b.probability - a.probability);

      setPredictions(smoothedResults);

      const activeChallenge = sketchList[currentSketchIdx];
      if (!activeChallenge) return;

      let targetThreshold = getTargetThreshold(activeChallenge.difficulty);

      // Dynamic Assistance Threshold Reductions based on seconds spent on sketch
      if (timeSpentOnCurrentSketch >= 25) {
        targetThreshold -= 10;
      } else if (timeSpentOnCurrentSketch >= 20) {
        targetThreshold -= 5;
      }

      // Adaptive difficulty reduction (-10% if active)
      if (isAdaptiveActive) {
        targetThreshold -= 10;
      }

      targetThreshold = Math.max(35, targetThreshold);

      const targetMatch = smoothedResults.find(
        p => p.className.toLowerCase().trim() === activeChallenge.word.toLowerCase().trim()
      );
      let confidence = targetMatch ? Math.round(targetMatch.probability * 100) : 0;

      // Evaluate Multi-Layer Recognition Decision Engine
      const decision = evaluateDecisionEngine(
        activeChallenge.word,
        extracted,
        inkCount,
        confidence,
        targetThreshold,
        grayscale28
      );

      const effectiveConfidence = Math.max(confidence, decision.finalScore);

      // Smart Recognition Recovery Boost at >=20s if close
      if (timeSpentOnCurrentSketch >= 20 && effectiveConfidence >= targetThreshold - 15) {
        confidence = Math.min(100, effectiveConfidence + 15);
      } else {
        confidence = effectiveConfidence;
      }

      // Save best drawing for masterpiece plaque
      if (confidence > 50 && (!bestDrawing || confidence > bestDrawing.confidence)) {
        setBestDrawing({
          category: activeChallenge.word,
          level: activeChallenge.level,
          strokes: strokePoints,
          dimensions: { width, height },
          confidence
        });
      }

      // Check Partial Credit System
      const topPred = smoothedResults[0];
      if (topPred && topPred.className.toLowerCase().trim() !== activeChallenge.word.toLowerCase().trim()) {
        const partial = checkPartialCredit(activeChallenge.word, topPred.className);
        if (partial.isPartial) {
          setPartialCreditNotice({ message: partial.message, points: partial.bonusPoints });
        }
      }

      // Goal threshold check: ONLY trigger success when user completes stroke (!isStrokeActive) and Object Gatekeeper passes
      if (!isStrokeActive && decision.isSuccess) {
        let awardedPoints = 70;
        if (decision.finalScore >= 85) awardedPoints = 100;
        if (partialCreditNotice) awardedPoints += partialCreditNotice.points;

        triggerSketchSuccess(awardedPoints, decision.finalScore);
      }
    }, 200);
  }, [gameState, currentSketchIdx, sketchList, autoAdvanceNotice, bestDrawing, timeSpentOnCurrentSketch, isAdaptiveActive, partialCreditNotice]);

  // Handle successful recognition
  const triggerSketchSuccess = (awardedPoints: number, confidence: number) => {
    const activeChallenge = sketchList[currentSketchIdx];

    // Reset fails count and turn off adaptive mode when streak recovers
    setConsecutiveFailsCount(0);
    if (currentComboStreak >= 1) {
      setIsAdaptiveActive(false);
    }

    // Play sounds & confetti
    soundManager.playCorrect();
    try {
      confetti({
        particleCount: 55,
        spread: 65,
        origin: { y: 0.7 }
      });
    } catch (e) {
      console.error(e);
    }

    // Update state
    setPoints(prev => prev + awardedPoints);
    setSketchAccuracies(prev => [...prev, confidence]);
    setCurrentComboStreak(prev => prev + 1);

    // Check achievements
    const stats = {
      maxProbability: confidence,
      sketchesCompleted: currentSketchIdx + 1,
      skipsUsed,
      timeSpentOnSketch: timeSpentOnCurrentSketch,
      totalGameTimeSeconds,
      currentComboStreak: currentComboStreak + 1
    };

    const updatedBadges = checkAndUnlockAchievements(unlockedAchievements, stats, (badgeId) => {
      const achName = {
        'first-sketch': '✏️ First Sketch Unlocked!',
        'perfect-draw': '🎯 Perfect Draw Unlocked! (>95% Confidence)',
        'fast-artist': '⚡ Fast Artist Unlocked! (<8s Sketch)',
        'combo-king': '🔥 Combo King Unlocked! (5 Consecutive Sketches)',
        'ai-whisperer': '🔮 AI Whisperer Unlocked! (98%+ Confidence)',
        'sketch-master': '🎨 20-Sketch Master Unlocked!',
        'speed-demon': '🚀 Speed Demon Unlocked! (<3 Min Total Time)',
        'no-mistakes': '👑 Flawless Artist Unlocked! (0 Skips Used)'
      }[badgeId] || 'Achievement Unlocked!';

      setAchievementNotification(achName);
      soundManager.playAchievement();
      setTimeout(() => setAchievementNotification(null), 3500);
    });

    setUnlockedAchievements(updatedBadges);

    // Show quick auto-advance toast and advance after 2.0s
    setAutoAdvanceNotice({
      word: activeChallenge.word,
      points: awardedPoints,
      confidence
    });

    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }

    autoAdvanceTimerRef.current = setTimeout(() => {
      proceedToNextSketch();
    }, 2000);
  };

  // Handle Skipping
  const handleSkip = () => {
    if (skipsRemaining <= 0 || autoAdvanceNotice) return;

    soundManager.playSkip();
    setSkipsRemaining(prev => prev - 1);
    setSkipsUsed(prev => prev + 1);
    setCurrentComboStreak(0); // Reset combo

    setConsecutiveFailsCount(prev => {
      const next = prev + 1;
      if (next >= 2) setIsAdaptiveActive(true);
      return next;
    });

    setSketchAccuracies(prev => [...prev, 0]);
    proceedToNextSketch();
  };

  const proceedToNextSketch = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setAutoAdvanceNotice(null);

    if (currentSketchIdx < 19) {
      const nextIdx = currentSketchIdx + 1;
      setCurrentSketchIdx(nextIdx);
      startSketch(nextIdx);
    } else {
      // 20 sketches completed -> Show End Screen
      soundManager.playAchievement();
      setGameState('game-over');
    }
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const activeChallenge = sketchList[currentSketchIdx];
  const totalAccSum = sketchAccuracies.reduce((sum, v) => sum + v, 0);
  const avgAccuracy = sketchAccuracies.length > 0 ? Math.round(totalAccSum / sketchAccuracies.length) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-500 selection:text-white antialiased relative overflow-hidden select-none">
      {/* Background Gradients */}
      <div className="absolute -top-48 -left-48 w-96 h-96 bg-blue-300/30 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/4 -right-24 w-[500px] h-[500px] bg-purple-300/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-48 left-1/3 w-[600px] h-[600px] bg-indigo-300/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Global Top Navbar */}
      <header className="bg-white/70 backdrop-blur-md border-b border-white/80 sticky top-0 z-50 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs relative">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setGameState('landing')}>
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-black text-slate-800 tracking-tight block leading-tight">SketchMind</span>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block leading-none">20-Sketch Challenge</span>
          </div>
        </div>

        {/* Global Nav Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleMute}
            className="cursor-pointer p-2 rounded-xl bg-white/80 hover:bg-white text-slate-600 border border-white/80 shadow-xs transition-all"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {gameState === 'playing' && (
            <button
              onClick={() => setVisionMode(!visionMode)}
              className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all border ${
                visionMode
                  ? 'bg-slate-900 text-white border-slate-950 shadow-sm'
                  : 'bg-white/80 text-slate-700 border-white/80 shadow-xs hover:bg-white'
              }`}
              title="Toggle AI Vision Mode"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Vision Mode</span>
            </button>
          )}

          <button
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all border ${
              showDebugPanel
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                : 'bg-white/80 text-slate-700 border-white/80 shadow-xs hover:bg-white'
            }`}
            title="Toggle ML Debugger"
          >
            <Bug className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Debug ML</span>
          </button>

          <button
            onClick={() => setShowTutorial(true)}
            className="cursor-pointer p-2 rounded-xl bg-white/80 hover:bg-white text-slate-600 border border-white/80 shadow-xs transition-all"
            title="Tutorial"
          >
            <HelpCircle className="w-4 h-4 text-blue-600" />
          </button>

          <button
            onClick={() => setGameState('leaderboard')}
            className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all border ${
              gameState === 'leaderboard'
                ? 'bg-amber-500 text-white border-amber-400 shadow-xs'
                : 'bg-white/80 hover:bg-white text-slate-700 border-white/80 shadow-xs'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Scores</span>
          </button>
        </div>
      </header>

      {/* Main View Router */}
      <main className="min-h-[calc(100vh-65px)]">
        <AnimatePresence mode="wait">
          
          {/* 1. Landing Screen */}
          {gameState === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LandingScreen
                onStartGame={initGame}
                onOpenLeaderboard={() => setGameState('leaderboard')}
                onOpenTutorial={() => setShowTutorial(true)}
              />
            </motion.div>
          )}

          {/* 2. Leaderboard Screen */}
          {gameState === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="py-10 px-4"
            >
              <LeaderboardPanel
                onBack={() => setGameState('landing')}
                highlightId={highlightedLeaderboardId}
              />
            </motion.div>
          )}

          {/* 3. Main Gameplay Screen */}
          {gameState === 'playing' && activeChallenge && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 py-6 relative z-10"
            >
              {/* Header Bar: Progress, Prompt, Stopwatch, Skips */}
              <div className="bg-white/70 backdrop-blur-md border border-white/80 rounded-[2rem] p-5 mb-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 bottom-0 w-2.5 bg-gradient-to-b from-blue-600 to-indigo-600" />

                {/* Left: Challenge Title & Difficulty */}
                <div className="text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                    <span className="text-[10px] font-extrabold font-mono px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      Sketch {currentSketchIdx + 1} / 20
                    </span>
                    <span className="text-[10px] font-extrabold font-mono px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                      Tier: {activeChallenge.difficulty}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                    Draw a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">"{activeChallenge.word}"</span>
                  </h2>
                </div>

                {/* Right: Stopwatch, Points, Skip Button */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Per-sketch Circular Countdown Timer */}
                  <CircularTimer
                    timeSpent={timeSpentOnCurrentSketch}
                    maxTime={getMaxTimeForDifficulty(activeChallenge.difficulty) + (bonusTimeGranted ? 10 : 0)}
                  />

                  {/* Overall Stopwatch */}
                  <div className="flex items-center gap-2 bg-white/80 border border-slate-200/80 px-3 py-2 rounded-xl shadow-xs font-mono">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <div className="text-left">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase leading-none">Total</span>
                      <span className="text-sm font-black text-slate-800">
                        {Math.floor(totalGameTimeSeconds / 60)}:{totalGameTimeSeconds % 60 < 10 ? '0' : ''}{totalGameTimeSeconds % 60}
                      </span>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="flex items-center gap-1.5 bg-white/80 border border-slate-200/80 px-3 py-2 rounded-xl shadow-xs font-mono">
                    <Zap className="w-4 h-4 text-amber-500 fill-current" />
                    <div className="text-left">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase leading-none">Score</span>
                      <span className="text-sm font-black text-blue-600">{points} pts</span>
                    </div>
                  </div>

                  {/* Skip Button */}
                  <button
                    onClick={handleSkip}
                    disabled={skipsRemaining <= 0}
                    className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold border transition-all select-none ${
                      skipsRemaining > 0
                        ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100 shadow-xs'
                        : 'bg-slate-100 border-slate-200 text-slate-300 pointer-events-none'
                    }`}
                    title="Skip sketch (Max 3 skips)"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    <span>Skip ({skipsRemaining})</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Assistance AI Tip Banner */}
              {dynamicAssistanceTip && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-xs rounded-2xl p-3 mb-4 shadow-sm flex items-center justify-between"
                >
                  <span className="font-semibold">{dynamicAssistanceTip}</span>
                  <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider shrink-0 ml-2">
                    AI Assistant
                  </span>
                </motion.div>
              )}

              {/* Progressive Hint Card */}
              <HintCard
                hints={activeChallenge.hints || ['Draw basic shape', 'Add outlines', 'Fill details']}
                word={activeChallenge.word}
                timeSpent={timeSpentOnCurrentSketch}
              />

              {/* Responsive Layout Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Drawing Canvas */}
                <div className={`${visionMode ? 'lg:col-span-6' : 'lg:col-span-7'} flex flex-col h-full`}>
                  <div className={`bg-white/70 backdrop-blur-md rounded-[2.5rem] shadow-xl p-5 h-full relative overflow-hidden transition-all duration-300 ${
                    (getMaxTimeForDifficulty(activeChallenge.difficulty) + (bonusTimeGranted ? 10 : 0) - timeSpentOnCurrentSketch <= 5 && getMaxTimeForDifficulty(activeChallenge.difficulty) + (bonusTimeGranted ? 10 : 0) - timeSpentOnCurrentSketch > 0)
                      ? 'ring-4 ring-rose-500/60 shadow-rose-500/20 border border-rose-400'
                      : 'border border-white/80'
                  }`}>
                    <DrawingCanvas onDrawingChange={handleDrawingChange} />
                  </div>
                </div>

                {/* Right Column: AI Classifier or Vision Mode */}
                <div className={`${visionMode ? 'lg:col-span-6' : 'lg:col-span-5'} space-y-6 h-full`}>
                  {visionMode ? (
                    <VisionModePanel
                      grayscale28={grayscale}
                      features={features}
                      predictions={predictions}
                      targetObject={activeChallenge.word}
                    />
                  ) : (
                    <div className="space-y-6">
                      <ConfidencePanel
                        predictions={predictions}
                        targetWord={activeChallenge.word}
                        isThinking={totalInkPixels > 20 && predictions.length === 0}
                        totalInkPixels={totalInkPixels}
                        targetThreshold={(() => {
                          let t = getTargetThreshold(activeChallenge.difficulty);
                          if (timeSpentOnCurrentSketch >= 25) t -= 10;
                          else if (timeSpentOnCurrentSketch >= 20) t -= 5;
                          if (isAdaptiveActive) t -= 10;
                          return Math.max(35, t);
                        })()}
                        partialCreditMessage={partialCreditNotice ? partialCreditNotice.message : ''}
                        isAdaptiveActive={isAdaptiveActive}
                      />
                      <EducationPanel isLoading={totalInkPixels > 20 && predictions.length === 0} />
                    </div>
                  )}
                </div>

              </div>

              {/* Auto-Advance Toast Notification on Success */}
              <AnimatePresence>
                {autoAdvanceNotice && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs pointer-events-auto"
                  >
                    <div className="bg-white/95 backdrop-blur-xl border border-white/80 shadow-2xl rounded-3xl p-6 text-center max-w-sm w-full relative overflow-hidden">
                      {/* Animated Progress Countdown Bar */}
                      <motion.div
                        initial={{ width: '100%' }}
                        animate={{ width: '0%' }}
                        transition={{ duration: 2.0, ease: 'linear' }}
                        className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500"
                      />

                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <div className="inline-block px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-[11px] font-black tracking-wide uppercase mb-2">
                        Sketch Completed! 🎉
                      </div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight">
                        "{autoAdvanceNotice.word}" Recognized!
                      </h3>
                      <p className="text-xs text-slate-500 font-bold mt-1">
                        +{autoAdvanceNotice.points} Points ({autoAdvanceNotice.confidence}% Confidence)
                      </p>

                      <div className="mt-5 flex items-center justify-center gap-3">
                        <button
                          onClick={() => proceedToNextSketch()}
                          className="cursor-pointer w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs rounded-xl shadow-md hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center justify-center gap-2"
                        >
                          <span>Next Sketch Now</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          )}

          {/* 4. End Screen */}
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
                totalTimeSeconds={totalGameTimeSeconds}
                sketchesCompleted={20}
                skipsUsed={skipsUsed}
                bestDrawing={bestDrawing}
                unlockedAchievements={unlockedAchievements}
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

      {/* Tutorial Modal */}
      {showTutorial && (
        <TutorialModal onClose={() => setShowTutorial(false)} />
      )}

      {/* Floating Milestone Achievement Toast */}
      <AnimatePresence>
        {achievementNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 text-white shadow-2xl rounded-2xl border border-slate-800 p-4 flex items-center gap-3 pointer-events-none"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-inner shrink-0">
              <Award className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <span className="text-[9px] font-bold font-mono text-indigo-400 uppercase tracking-widest block mb-0.5">Milestone Achieved!</span>
              <p className="text-xs font-extrabold text-slate-100">{achievementNotification}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Developer Debug Panel */}
      <AnimatePresence>
        {showDebugPanel && (
          <DebugPanel
            isOpen={showDebugPanel}
            onClose={() => setShowDebugPanel(false)}
            grayscale28={grayscale}
            features={features}
            totalInkPixels={totalInkPixels}
            predictions={predictions}
            targetWord={activeChallenge ? activeChallenge.word : ''}
            targetThreshold={activeChallenge ? getTargetThreshold(activeChallenge.difficulty) : 70}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
