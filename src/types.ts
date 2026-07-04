export type GameState = 'landing' | 'playing' | 'completed-round' | 'game-over' | 'leaderboard';

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
  score: number;
  date: string;
  accuracy: number;
  levelReached: number;
}

export interface Challenge {
  word: string;
  level: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
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
