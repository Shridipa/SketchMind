import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import Home from './components/Home';
import Setup from './components/Setup';
import Game from './components/Game';
import Result from './components/Result';
import GameOver from './components/GameOver';
import './styles/global.css';
import './styles/app.css';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [backendReady, setBackendReady] = useState(false);
  const [backendError, setBackendError] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [playerName, setPlayerName] = useState('');

  // Check backend health on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        await api.health();
        setBackendReady(true);
      } catch (err) {
        console.error('Backend error:', err);
        setBackendError(err.message);
      }
    };

    checkBackend();
  }, []);

  const handleStartGame = (name) => {
    setPlayerName(name);
    setScreen('setup');
  };

  const handleBeginGame = async (name) => {
    try {
      const gameData = await api.startGame(name);
      setGameState(gameData);
      setScreen('game');
      setPrediction(null);
    } catch (err) {
      alert('Failed to start game: ' + err.message);
    }
  };

  const handlePredictionComplete = (pred) => {
    setPrediction(pred);
    setScreen('result');
  };

  const handleNextRound = async (correct, scorePoints = 0) => {
    try {
      const nextData = await api.nextRound(
        gameState.player,
        correct,
        scorePoints
      );

      if (nextData.finished) {
        setScreen('gameover');
      } else {
        setGameState((prev) => ({
          ...prev,
          round: nextData.round,
          target: nextData.target,
          score: nextData.score,
        }));
        setPrediction(null);
        setScreen('game');
      }
    } catch (err) {
      alert('Failed to advance: ' + err.message);
    }
  };

  const handleSkipRound = async () => {
    try {
      const nextData = await api.skipRound(gameState.player);

      if (nextData.finished) {
        setScreen('gameover');
      } else {
        setGameState((prev) => ({
          ...prev,
          round: nextData.round,
          target: nextData.target,
          score: nextData.score,
        }));
        setPrediction(null);
        setScreen('game');
      }
    } catch (err) {
      alert('Failed to skip: ' + err.message);
    }
  };

  const handleGameOver = async () => {
    try {
      await api.endGame(playerName);
      setGameState(null);
      setPrediction(null);
      setScreen('home');
    } catch (err) {
      console.error('Error ending game:', err);
      setScreen('home');
    }
  };

  if (!backendReady) {
    return (
      <div className="container center" style={{ height: '100vh' }}>
        <h1>SketchMind</h1>
        {backendError ? (
          <div className="alert alert-error">
            <p>Cannot connect to backend at http://localhost:8000</p>
            <p>Make sure the FastAPI server is running:</p>
            <code>cd backend && python -m uvicorn main:app --reload</code>
          </div>
        ) : (
          <p>Connecting to backend...</p>
        )}
      </div>
    );
  }

  return (
    <>
      {screen === 'home' && (
        <Home onStart={handleStartGame} />
      )}
      {screen === 'setup' && (
        <Setup
          initialName={playerName}
          onStart={handleBeginGame}
          onBack={() => setScreen('home')}
        />
      )}
      {screen === 'game' && gameState && (
        <Game
          gameState={gameState}
          onPredictionComplete={handlePredictionComplete}
          onSkip={handleSkipRound}
          onQuit={() => handleGameOver()}
        />
      )}
      {screen === 'result' && gameState && prediction && (
        <Result
          prediction={prediction}
          target={gameState.target}
          currentScore={gameState.score}
          onNextRound={handleNextRound}
        />
      )}
      {screen === 'gameover' && (
        <GameOver
          playerName={playerName}
          onPlayAgain={() => {
            handleGameOver();
          }}
        />
      )}
    </>
  );
}
