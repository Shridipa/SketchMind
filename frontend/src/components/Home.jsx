import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import './home.css';

export default function Home({ onStart }) {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const data = await api.getLeaderboard(5);
        setLeaderboard(data.scores || []);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      }
    };

    loadLeaderboard();
  }, []);

  return (
    <div className="home-screen">
      <div className="balloon balloon-one" aria-hidden="true"></div>
      <div className="balloon balloon-two" aria-hidden="true"></div>
      <div className="balloon balloon-three" aria-hidden="true"></div>
      <div className="home-container">
        <h1 className="home-title">SketchMind</h1>
        <p className="home-subtitle">Draw it. Let the AI guess it.</p>

        <button className="btn btn-primary btn-large" onClick={() => onStart('')}>
          Start Game
        </button>

        <p className="home-info">20 objects • Test your sketching skills</p>

        {leaderboard.length > 0 && (
          <div className="home-leaderboard">
            <h3>Top Scores</h3>
            <div className="leaderboard-table">
              {leaderboard.map((entry) => (
                <div key={`${entry.rank}-${entry.name}`} className="leaderboard-row">
                  <span className="rank">{entry.rank}</span>
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
