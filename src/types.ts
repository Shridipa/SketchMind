export type GameState = 'landing' | 'tutorial' | 'playing' | 'completed-sketch' | 'game-over' | 'leaderboard';

export type DrawingTool = 'pencil' | 'eraser';

export type RecognitionState =
  | 'EMPTY_CANVAS'
  | 'DRAWING_STARTED'
  | 'INSUFFICIENT_INFORMATION'
  | 'READY_FOR_RECOGNITION'
  | 'VALIDATING_OBJECT'
  | 'RECOGNIZED';

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

export interface DailyLeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  completionTime: number; // In seconds
  totalSketchesCompleted: number;
  accuracy: number; // percentage (0-100)
  averageConfidence: number;
  skipsUsed: number;
  difficultyReached: number;
  completedAt: number; // timestamp ms
  expiresAt: number; // timestamp ms (+24 hours)
}

export interface DailyLeaderboardStore {
  version: number;
  lastCleanup: number;
  entries: DailyLeaderboardEntry[];
}

export interface LeaderboardEntry extends DailyLeaderboardEntry {
  name?: string;
  formattedTime?: string;
  date?: string;
  difficultyCompleted?: string;
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
  totalStrokeLength: number;
  boxWidth: number;
  boxHeight: number;
  isStraightLine: boolean;
  connectedComponentsCount?: number;
  closedContourDistance?: number;
  canvasCompletenessScore?: number;
}
