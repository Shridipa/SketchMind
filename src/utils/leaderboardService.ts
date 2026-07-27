import { DailyLeaderboardEntry, DailyLeaderboardStore } from '../types';

const STORAGE_KEY = 'sketchmind_daily_leaderboard';
const RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const MAX_LEADERBOARD_ENTRIES = 50;

/**
 * Normalizes player name for duplicate comparison
 */
function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Validates a score entry against anti-cheat parameters
 */
function isValidScoreEntry(entry: Partial<DailyLeaderboardEntry>): boolean {
  if (!entry.playerName || entry.playerName.trim().length === 0) return false;
  if (typeof entry.score !== 'number' || isNaN(entry.score) || entry.score < 0 || entry.score > 15000) return false;
  if (typeof entry.completionTime !== 'number' || isNaN(entry.completionTime) || entry.completionTime <= 0 || entry.completionTime > 3600) return false;
  if (typeof entry.totalSketchesCompleted !== 'number' || isNaN(entry.totalSketchesCompleted) || entry.totalSketchesCompleted < 1 || entry.totalSketchesCompleted > 20) return false;
  if (typeof entry.accuracy !== 'number' || isNaN(entry.accuracy) || entry.accuracy < 0 || entry.accuracy > 100) return false;
  return true;
}

/**
 * Compares two entries. Returns negative if `a` is better than `b`, positive if `b` is better, 0 if equal.
 * Priority rules:
 * 1. Most sketches completed
 * 2. Fastest completion time
 * 3. Highest score
 * 4. Highest accuracy
 * 5. Highest average AI confidence
 */
export function compareEntries(a: DailyLeaderboardEntry, b: DailyLeaderboardEntry): number {
  if (b.totalSketchesCompleted !== a.totalSketchesCompleted) {
    return b.totalSketchesCompleted - a.totalSketchesCompleted;
  }
  if (a.completionTime !== b.completionTime) {
    return a.completionTime - b.completionTime;
  }
  if (b.score !== a.score) {
    return b.score - a.score;
  }
  if (b.accuracy !== a.accuracy) {
    return b.accuracy - a.accuracy;
  }
  return (b.averageConfidence || 0) - (a.averageConfidence || 0);
}

/**
 * Sorts array of entries in-place or returns sorted array according to tournament ranking rules
 */
export function sortLeaderboard(entries: DailyLeaderboardEntry[]): DailyLeaderboardEntry[] {
  return [...entries].sort(compareEntries);
}

/**
 * Reads raw store from LocalStorage
 */
function getRawStore(): DailyLeaderboardStore {
  if (typeof window === 'undefined') {
    return { version: 1, lastCleanup: Date.now(), entries: [] };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.entries)) {
        return parsed as DailyLeaderboardStore;
      }
    }
  } catch (e) {
    console.error('Failed to parse leaderboard storage', e);
  }

  return { version: 1, lastCleanup: Date.now(), entries: [] };
}

/**
 * Writes store object to LocalStorage
 */
function saveRawStore(store: DailyLeaderboardStore): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error('Failed to save leaderboard storage', e);
  }
}

/**
 * Automatically removes scores where expiresAt <= Date.now()
 */
export function cleanupExpiredScores(): DailyLeaderboardEntry[] {
  const store = getRawStore();
  const now = Date.now();

  const validEntries = store.entries.filter(entry => {
    return entry && typeof entry.expiresAt === 'number' && entry.expiresAt > now;
  });

  if (validEntries.length !== store.entries.length) {
    store.entries = validEntries;
    store.lastCleanup = now;
    saveRawStore(store);
  }

  return sortLeaderboard(validEntries);
}

/**
 * Retrieves valid, sorted top 50 leaderboard entries after cleaning up expired ones
 */
export function getLeaderboard(): DailyLeaderboardEntry[] {
  const activeEntries = cleanupExpiredScores();
  return activeEntries.slice(0, MAX_LEADERBOARD_ENTRIES);
}

/**
 * Returns the best score entry for a given player name among active 24h entries
 */
export function getPlayerBestScore(playerName: string): DailyLeaderboardEntry | null {
  const entries = getLeaderboard();
  const targetNorm = normalizeName(playerName);
  const playerEntries = entries.filter(e => normalizeName(e.playerName) === targetNorm);
  if (playerEntries.length === 0) return null;
  return playerEntries[0]; // sorted best is first
}

/**
 * Adds a new completed game score to the daily event leaderboard.
 * Handled duplicate player logic: replaces existing score ONLY if new attempt is better.
 * Returns the saved entry object if successful, or null if rejected.
 */
export function addScore(input: {
  playerName: string;
  score: number;
  completionTime: number;
  totalSketchesCompleted: number;
  accuracy: number;
  averageConfidence?: number;
  skipsUsed?: number;
  difficultyReached?: number;
}): DailyLeaderboardEntry | null {
  if (!isValidScoreEntry(input)) {
    console.warn('Rejected invalid score submission', input);
    return null;
  }

  const now = Date.now();
  const expiresAt = now + RETENTION_MS;
  const newId = `score_${now}_${Math.random().toString(36).substring(2, 7)}`;

  const newEntry: DailyLeaderboardEntry = {
    id: newId,
    playerName: input.playerName.trim(),
    score: Math.round(input.score),
    completionTime: Math.round(input.completionTime),
    totalSketchesCompleted: Math.min(20, Math.max(1, Math.round(input.totalSketchesCompleted))),
    accuracy: Math.min(100, Math.max(0, Math.round(input.accuracy))),
    averageConfidence: Math.round(input.averageConfidence || input.accuracy),
    skipsUsed: input.skipsUsed || 0,
    difficultyReached: input.difficultyReached || 4,
    completedAt: now,
    expiresAt
  };

  const store = getRawStore();
  let entries = store.entries.filter(e => e && e.expiresAt > now);

  const normName = normalizeName(newEntry.playerName);
  const existingIndex = entries.findIndex(e => normalizeName(e.playerName) === normName);

  if (existingIndex !== -1) {
    const existingEntry = entries[existingIndex];
    // Check if new attempt ranks better than existing entry
    const comp = compareEntries(newEntry, existingEntry);
    if (comp < 0) {
      // New entry is better -> replace existing
      entries[existingIndex] = newEntry;
    } else {
      // Existing score is better or equal -> discard new attempt
      return existingEntry;
    }
  } else {
    // New player entry -> append
    entries.push(newEntry);
  }

  // Sort and trim to top 50
  entries = sortLeaderboard(entries).slice(0, MAX_LEADERBOARD_ENTRIES);

  store.entries = entries;
  store.lastCleanup = now;
  saveRawStore(store);

  return newEntry;
}

/**
 * Resets/clears the daily event leaderboard
 */
export function clearLeaderboard(): void {
  saveRawStore({ version: 1, lastCleanup: Date.now(), entries: [] });
}

/**
 * Helper to seed initial sample entries if leaderboard is empty for orientation demo
 */
export function seedSampleEntriesIfEmpty(): DailyLeaderboardEntry[] {
  const current = getLeaderboard();
  if (current.length > 0) return current;

  const now = Date.now();
  const sampleData = [
    { playerName: 'Aarav (CS)', score: 1940, completionTime: 105, totalSketchesCompleted: 20, accuracy: 96, averageConfidence: 94, skipsUsed: 0, difficultyReached: 4 },
    { playerName: 'Maya (EE)', score: 1860, completionTime: 118, totalSketchesCompleted: 20, accuracy: 94, averageConfidence: 91, skipsUsed: 0, difficultyReached: 4 },
    { playerName: 'Alex (Design)', score: 1780, completionTime: 132, totalSketchesCompleted: 20, accuracy: 91, averageConfidence: 88, skipsUsed: 1, difficultyReached: 4 },
    { playerName: 'Prof. Chen', score: 1690, completionTime: 155, totalSketchesCompleted: 20, accuracy: 88, averageConfidence: 85, skipsUsed: 1, difficultyReached: 4 },
    { playerName: 'Leo (ME)', score: 1560, completionTime: 182, totalSketchesCompleted: 20, accuracy: 84, averageConfidence: 82, skipsUsed: 2, difficultyReached: 4 }
  ];

  sampleData.forEach(s => addScore(s));
  return getLeaderboard();
}
