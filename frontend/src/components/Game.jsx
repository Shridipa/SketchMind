import React, { useState, useEffect } from 'react';
import DrawingCanvas from './DrawingCanvas';
import { api } from '../services/api';
import './game.css';

export default function Game({
  gameState,
  onPredictionComplete,
  onSkip,
  onQuit,
}) {
  const [timeLeft, setTimeLeft] = useState(gameState.time_limit);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleTimeExpired();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleTimeExpired = async () => {
    try {
      setIsLoading(true);
      await onSkip();
    } catch (err) {
      setError('Time expired - failed to skip round');
    }
  };

  const handleImageReady = async (imageBlob) => {
    try {
      setIsLoading(true);
      setError(null);

      const prediction = await api.predictDrawing(imageBlob);
      onPredictionComplete(prediction);
    } catch (err) {
      setError('Failed to analyze drawing: ' + err.message);
      setIsLoading(false);
    }
  };

  const progressPercent = (gameState.round / gameState.max_rounds) * 100;
  const timePercent = (timeLeft / gameState.time_limit) * 100;
  const timeWarning = timeLeft <= 5;

  return (
    <div className="game-screen">
      <div className="game-header">
        <div className="game-header-top">
          <h1>SketchMind</h1>
          <div className="game-score">⭐ {gameState.score}</div>
        </div>

        <div className="game-info">
          <span>Round {gameState.round} / {gameState.max_rounds}</span>
          <span className={timeWarning ? 'time-warning' : ''}>
            {timeLeft}s
          </span>
        </div>

        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${timePercent}%` }}
          />
        </div>
      </div>

      <div className="game-content">
        <div className="game-prompt">
          <p>Draw a</p>
          <h2>{gameState.target}</h2>
        </div>

        <DrawingCanvas onImageReady={handleImageReady} isDisabled={isLoading} />

        {error && (
          <div className="alert alert-error">
            {error}
            <button
              className="btn btn-ghost"
              onClick={() => setError(null)}
              style={{ marginLeft: '0.5rem' }}
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="game-actions">
          <button
            className="btn btn-secondary"
            onClick={onSkip}
            disabled={isLoading}
          >
            Skip
          </button>
          <button
            className="btn btn-error"
            onClick={onQuit}
            disabled={isLoading}
          >
            Quit
          </button>
        </div>
      </div>

      <div className="game-footer">
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Analyzing your drawing...</p>
          </div>
        </div>
      )}
    </div>
  );
}
