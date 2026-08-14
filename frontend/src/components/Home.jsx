import React from 'react';
import Leaderboard from './Leaderboard';
import './home.css';

export default function Home({ onStart }) {
  return (
    <div className="home-screen">
      <div className="balloon balloon-one" aria-hidden="true"></div><div className="balloon balloon-two" aria-hidden="true"></div><div className="balloon balloon-three" aria-hidden="true"></div>
      <div className="home-container">
        <h1 className="home-title">SketchMind</h1><p className="home-subtitle">Draw it. Let the AI guess it.</p>
        <button className="btn btn-primary btn-large" onClick={() => onStart('')}>Start Game</button>
        <p className="home-info">20 objects • Test your sketching skills</p>
        <Leaderboard />
      </div>
    </div>
  );
}
