# SketchMind — AI Drawing Challenge

SketchMind is a 20-object drawing game. Draw the prompt, let the AI identify it, and earn a place on the leaderboard.

The TensorFlow/Keras model and training assets are kept in `model-training/` and are not changed by the web app.

## Run the app

### Windows (recommended)

From the `SketchMind` folder, run:

```powershell
.\start-dev.bat
```

The script creates `backend/.venv` when needed, installs the backend dependencies, then opens separate backend and frontend terminals.

Open the game at [http://localhost:5173](http://localhost:5173). The backend health check is available at [http://localhost:8000/api/health](http://localhost:8000/api/health).

### Manual startup

Use two terminals from the `SketchMind` folder.

Terminal 1 — backend:

```powershell
python -m venv backend\.venv
.\backend\.venv\Scripts\python -m pip install -r backend\requirements.txt
.\backend\.venv\Scripts\python -m uvicorn main:app --app-dir backend --reload --port 8000
```

Terminal 2 — frontend:

```powershell
cd frontend
npm install
npm run dev
```

## How to play

1. Select **Start Game** and enter a player name.
2. Draw each of the 20 unique objects shown by the game.
3. Submit your sketch for AI recognition.
4. Earn 10 points for every correct answer, plus a 5-point bonus for at least 95% confidence.
5. Finish all 20 rounds to save your result.

There are no difficulty levels. Every drawing has a 30-second timer.

## Leaderboard

Scores are stored in `model-training/leaderboard.csv`. The leaderboard keeps one entry per player and automatically preserves that player’s highest score.

## Project layout

```text
SketchMind/
├── frontend/       React + Vite user interface
├── backend/        FastAPI REST API
├── model-training/ TensorFlow/Keras model, labels, game logic, leaderboard
├── start-dev.bat   Windows launcher
└── start-dev.sh    macOS/Linux launcher
```

## Requirements

- Node.js 18+ and npm
- Python 3.11 recommended
- TensorFlow 2.21.0 and Keras 3.15.1 (installed automatically for the backend)

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Verify backend and model status |
| POST | `/api/game/start` | Begin a 20-round game |
| POST | `/api/predict` | Identify a submitted drawing |
| POST | `/api/game/next-round` | Advance after a result |
| POST | `/api/game/skip` | Skip the current object |
| POST | `/api/game/end` | Save a completed game score |
| GET | `/api/leaderboard` | Read the highest scores |

Interactive API documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).
