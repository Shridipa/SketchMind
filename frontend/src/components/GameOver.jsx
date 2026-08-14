import React from 'react';
import Leaderboard from './Leaderboard';
import './gameover.css';

export default function GameOver({ playerName, result, onPlayAgain }) {
  return <div className="gameover-screen"><div className="balloon balloon-one" aria-hidden="true"></div><div className="balloon balloon-two" aria-hidden="true"></div><div className="balloon balloon-three" aria-hidden="true"></div><div className="gameover-container"><h1>SketchMind</h1><div className="gameover-message"><h2>Game Complete!</h2><p>Well played, {playerName}!</p>{result && <p>Final score: <strong>{result.score}</strong> · Accuracy: <strong>{Math.round(result.accuracy)}%</strong></p>}</div><div className="gameover-actions"><button className="btn btn-primary btn-large" onClick={onPlayAgain}>Play Again</button></div><Leaderboard currentPlayer={playerName} /></div></div>;
}
