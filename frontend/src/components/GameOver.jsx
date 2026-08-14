import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import './gameover.css';

export default function GameOver({ playerName, onPlayAgain }) {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const data = await api.getLeaderboard(10);
        setLeaderboard(data.scores || []);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      }
    };

    loadLeaderboard();
  }, []);

  return (
    <div className="gameover-screen">
      <div className="balloon balloon-one" aria-hidden="true"></div>
      <div className="balloon balloon-two" aria-hidden="true"></div>
      <div className="balloon balloon-three" aria-hidden="true"></div>
      <div className="gameover-container">
        <h1>SketchMind</h1>

        <div className="gameover-message">
          <h2>Game Complete!</h2>
          <p>Well played, {playerName}!</p>
        </div>

        <div className="gameover-actions">
          <button className="btn btn-primary btn-large" onClick={onPlayAgain}>
            Play Again
          </button>
        </div>

        {leaderboard.length > 0 && (
          <div className="gameover-leaderboard">
            <h3>🏆 Top Scores</h3>
            <div className="leaderboard-table">
              {leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`leaderboard-row ${
                    entry.name === playerName ? 'current-player' : ''
                  }`}
                >
                  <span className="rank">#{entry.rank}</span>
                  <span className="name">{entry.name}</span>
                  <span className="score">{entry.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
