import React from 'react';
import Leaderboard from './Leaderboard';
import './gameover.css';

export default function GameOver({ playerName, result, onPlayAgain }) {
  const score = result?.score ?? 0;
  const accuracy = Math.round(result?.accuracy ?? 0);
  return <main className="gameover-screen"><div className="results-orb orb-violet" aria-hidden="true" /><div className="results-orb orb-blue" aria-hidden="true" /><div className="results-orb orb-pink" aria-hidden="true" /><div className="results-grid" aria-hidden="true" /><section className="gameover-container"><header className="results-header"><div className="brand-lockup"><span className="brand-mark">✦</span><div><strong>SketchMind</strong><small>AI Drawing Challenge</small></div></div><span className="session-badge"><i /> Session complete</span></header><div className="results-hero"><div className="trophy-orbit" aria-hidden="true">🏆</div><p className="eyebrow">✦ Round complete ✦</p><h1>Game <span>Complete!</span></h1><p className="results-greeting">Well played, <strong>{playerName || 'Sketcher'}</strong>!</p><p className="results-subtitle">Your sketch has been evaluated by SketchMind AI.</p></div><div className="result-stats" aria-label="Game results"><article className="result-stat score-stat"><span className="stat-icon">✦</span><p>Score</p><strong>{score}</strong><small>Points earned</small></article><article className="result-stat accuracy-stat"><span className="stat-icon">◎</span><p>Accuracy</p><strong>{accuracy}%</strong><small>Drawing precision</small></article></div><div className="gameover-actions"><button className="btn btn-primary btn-large play-again" onClick={onPlayAgain}>↻ <span>Play Again</span></button></div><Leaderboard currentPlayer={playerName} /></section></main>;
}
