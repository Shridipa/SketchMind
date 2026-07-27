export type GameState = 'landing' | 'tutorial' | 'playing' | 'completed-sketch' | 'game-over' | 'leaderboard';

export type DrawingTool = 'pencil' | 'eraser';

export interface Prediction {
  className: string;
  probability: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  badge: string; // Emoji or icon indicator
  unlocked: boolean;
  unlockedAt?: string;
  color: string; // Tailwind color class for badge background
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  completionTime: number; // In seconds
  formattedTime: string; // "02:15"
  score: number;
  accuracy: number; // percentage (e.g. 92)
  skipsUsed: number;
  date: string;
  difficultyCompleted: string;
}

export interface Challenge {
  id: string;
  word: string;
  level: number; // 1 to 4
  difficulty: 'Very Easy' | 'Easy' | 'Medium' | 'Hard';
  description: string;
  hints: [string, string, string]; // [initial 0s, 10s, 20s]
}

export interface SketchResult {
  sketchIndex: number;
  word: string;
  level: number;
  status: 'recognized' | 'skipped' | 'timeout';
  confidence: number;
  points: number;
  timeSpent: number; // seconds spent on this sketch
  strokes?: { x: number; y: number }[][];
  dimensions?: { width: number; height: number };
}

export interface DrawingFeatures {
  aspectRatio: number;
  density: number;
  circularity: number;
  symmetryHorizontal: number;
  symmetryVertical: number;
  topHeavyRatio: number;
  leftHeavyRatio: number;
  strokeCount: number;
  cornerCount: number;
  hasClosedLoop: boolean;
}
