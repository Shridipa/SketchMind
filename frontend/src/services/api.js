/**
 * API Service - Centralized backend communication
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = {
  /**
   * Health check
   */
  async health() {
    const response = await fetch(`${API_URL}/api/health`);
    if (!response.ok) throw new Error('Health check failed');
    return response.json();
  },

  /**
   * Start a new game
   */
  async startGame(player) {
    const response = await fetch(`${API_URL}/api/game/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player }),
    });
    if (!response.ok) throw new Error('Failed to start game');
    return response.json();
  },

  /**
   * Send drawing for prediction
   */
  async predictDrawing(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/api/predict`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Prediction failed');
    return response.json();
  },

  /**
   * Advance to next round
   */
  async nextRound(player, correct, scorePoints = 0) {
    const params = new URLSearchParams({
      player,
      correct,
      score_points: scorePoints,
    });

    const response = await fetch(`${API_URL}/api/game/next-round?${params}`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to advance round');
    return response.json();
  },

  /**
   * Skip current round
   */
  async skipRound(player) {
    const params = new URLSearchParams({ player });
    const response = await fetch(`${API_URL}/api/game/skip?${params}`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to skip round');
    return response.json();
  },

  /**
   * End game and save score
   */
  async endGame(player) {
    const params = new URLSearchParams({ player });
    const response = await fetch(`${API_URL}/api/game/end?${params}`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to end game');
    return response.json();
  },

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit = 10) {
    const params = new URLSearchParams({ limit });
    const response = await fetch(`${API_URL}/api/leaderboard?${params}`);
    if (!response.ok) throw new Error('Failed to fetch leaderboard');
    return response.json();
  },
};
