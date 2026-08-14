import React from 'react';
import './result.css';

export default function Result({
  prediction,
  target,
  currentScore,
  onNextRound,
}) {
  const isCorrect = prediction.prediction.toLowerCase() === target.toLowerCase();
  const confidence = Math.round(prediction.confidence * 100);

  // Every correct object earns 10 points, with a bonus for high confidence.
  const scorePoints = isCorrect ? 10 + (confidence >= 95 ? 5 : 0) : 0;

  const handleNext = () => {
    onNextRound(isCorrect, scorePoints);
  };

  return (
    <div className="result-screen">
      <div className="result-container">
        <h1>SketchMind</h1>

        {isCorrect ? (
          <div className="result-success">
            <h2>✓ Nice!</h2>
            <p>The AI recognized your drawing</p>

            {confidence >= 95 && (
              <div className="alert alert-success">
                🌟 High Confidence Bonus: +5 points
              </div>
            )}
          </div>
        ) : (
          <div className="result-failure">
            <h2>Not quite!</h2>
            <p>The AI didn't recognize the target.</p>
          </div>
        )}

        <div className="result-details">
          <div className="result-item">
            <label>Target</label>
            <div className="result-value">{target}</div>
          </div>

          <div className="result-item">
            <label>AI Predicted</label>
            <div className="result-value">
              {prediction.prediction.toUpperCase()}
            </div>
          </div>

          <div className="result-item">
            <label>Confidence</label>
            <div className="result-value">{confidence}%</div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>
        </div>

        {isCorrect && (
          <div className="result-score">
            <p>You earned</p>
            <h2>+{scorePoints} points</h2>
          </div>
        )}

        {prediction.top_predictions && prediction.top_predictions.length > 0 && (
          <div className="result-predictions">
            <h3>AI Top Predictions</h3>
            <div className="predictions-list">
              {prediction.top_predictions.map((pred, idx) => (
                <div key={idx} className="prediction-item">
                  <div className="prediction-rank">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                  </div>
                  <div className="prediction-label">
                    {pred.label.toUpperCase()}
                  </div>
                  <div className="prediction-confidence">
                    {Math.round(pred.confidence * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="result-score-display">
          <span>Current Score: {currentScore + (isCorrect ? scorePoints : 0)}</span>
        </div>

        <button className="btn btn-primary btn-large" onClick={handleNext}>
          Next Drawing →
        </button>
      </div>
    </div>
  );
}
