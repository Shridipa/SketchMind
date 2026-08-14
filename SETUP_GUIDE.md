# SketchMind - React + FastAPI Architecture

This is the new architecture for SketchMind using React (frontend) and FastAPI (backend) while preserving the existing TensorFlow/Keras ML model.

## Architecture Overview

```
React Frontend (Vite)
        ↓
    HTTP/REST
        ↓
FastAPI Backend
    ↓       ↓
Predictor Game Logic
    ↓
TensorFlow/Keras Model
    ↓
Predictions
```

## Project Structure

```
SketchMind/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── services/         # API service layer
│   │   ├── styles/           # CSS files
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .env                  # API URL configuration
│
├── backend/                  # FastAPI backend
│   ├── main.py              # FastAPI app
│   └── requirements.txt      # Python dependencies
│
└── model-training/          # Existing ML infrastructure (unchanged)
    ├── predictor.py         # Model prediction logic
    ├── game.py              # Game state management
    ├── leaderboard.py       # Score persistence
    ├── labels.txt           # Class labels
    ├── sketchmind_model.keras
    └── ...
```

## Setup Instructions

### Prerequisites

- **Node.js** 16+ and npm
- **Python** 3.8+
- Existing TensorFlow/Keras model in `model-training/`

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create Python virtual environment (optional but recommended):
   ```bash
   python -m venv .venv
   # On Windows:
   .venv\Scripts\activate
   # On macOS/Linux:
   source .venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the FastAPI server:
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```

   The backend will be available at `http://localhost:8000`
   - Health check: `http://localhost:8000/api/health`
   - API docs: `http://localhost:8000/docs`

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

### Full Workflow

Terminal 1 - Backend:
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

Then open `http://localhost:5173` in your browser.

## API Endpoints

### Health Check
- **GET** `/api/health`
- Response: `{ "status": "ok", "model_loaded": true, "labels_loaded": true }`

### Start Game
- **POST** `/api/game/start`
- Request: `{ "player": "Shri", "difficulty": "Easy" }`
- Response: Game state with target, round, score, etc.

### Get Prediction
- **POST** `/api/predict`
- Body: FormData with image file
- Response: `{ "prediction": "cat", "confidence": 0.94, "top_predictions": [...] }`

### Next Round
- **POST** `/api/game/next-round?player=Shri&correct=true&score_points=15`
- Response: Next round state or game finished flag

### Skip Round
- **POST** `/api/game/skip?player=Shri`
- Response: Next round state or game finished flag

### End Game
- **POST** `/api/game/end?player=Shri`
- Response: Final game result with score and accuracy

### Get Leaderboard
- **GET** `/api/leaderboard?limit=10`
- Response: Top scores list

## Data Flow

### Drawing Submission Flow

1. User draws on canvas in React
2. User clicks "Done"
3. Canvas converts to PNG blob
4. React sends image to `POST /api/predict`
5. FastAPI receives image
6. Image converted to PIL Image
7. **Predictor.preprocess()** processes image (same as training)
   - Convert to grayscale
   - Detect drawing pixels
   - Crop and center
   - Resize to 28×28
   - Normalize pixel values
8. **TensorFlow model** predicts
9. Returns prediction + confidence
10. React compares with target
11. React calculates score (based on difficulty & confidence)
12. React advances game via `/api/game/next-round`
13. Next target displayed

### Scoring System

Based on `game.py`:
- **Easy**: 10 points per correct drawing
- **Medium**: 15 points per correct drawing
- **Hard**: 20 points per correct drawing
- **High Confidence Bonus**: +5 points if confidence ≥ 95%

## Key Design Decisions

1. **Model stays on backend**: The TensorFlow model is never sent to the browser
2. **Preprocessing unified**: Same preprocessing pipeline used for training and inference
3. **Game state on backend**: Prevents cheating; backend authorizes score awards
4. **CORS configured**: Frontend localhost ports allowed to call backend
5. **Simple REST API**: No WebSockets; simple HTTP for easy debugging
6. **Existing ML logic preserved**: `predictor.py`, `game.py`, `leaderboard.py` unchanged

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
```

For production, change to your deployed backend URL:
```
VITE_API_URL=https://api.sketchmind.com
```

### Backend
No environment variables required for local development.

For production, add:
```python
# In main.py
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
```

## Building for Production

### Backend
```bash
cd backend
# Install gunicorn
pip install gunicorn

# Run with gunicorn
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend
```bash
cd frontend
npm run build
# Output in frontend/dist/
```

Deploy `frontend/dist/` to any static hosting (Vercel, Netlify, S3, etc.)

## Troubleshooting

### Backend won't start
- Check Python version: `python --version` (3.8+ required)
- Check TensorFlow model file exists: `model-training/sketchmind_model.keras`
- Check labels.txt: `model-training/labels.txt` or `model-training/processed/labels.txt`
- Look for errors in terminal output

### Frontend can't connect to backend
- Backend running on port 8000? Check: `http://localhost:8000/api/health`
- CORS issue? Check backend CORS configuration
- Wrong API URL in `.env`? Update `VITE_API_URL`

### Predictions are wrong
- Check preprocessing matches training data
- Verify model accuracy on test data
- Drawing preprocessing in backend `predictor.py`

### Model takes too long to load
- First load caches model; subsequent loads are fast
- Model loads once at backend startup (not per request)

## Testing the Pipeline

1. Start both backend and frontend
2. Enter player name
3. Select difficulty
4. Draw a clear, recognizable shape (e.g., circle, square)
5. Click "Done"
6. Verify model prediction appears
7. Check confidence percentage
8. Verify score calculation
9. Continue to next round
10. Complete all 20 rounds
11. Check leaderboard

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| "Cannot connect to backend" | Start backend with `uvicorn main:app --reload` |
| Predictions don't match drawings | Check preprocessing in `predictor.py`; verify training data distribution |
| High confidence but wrong prediction | Normal; model confidence ≠ correctness. Compare labels only. |
| Leaderboard empty | Scores saved to `leaderboard.csv` after game ends |
| Canvas won't clear | Refresh page; clear button clears only current drawing |
| Timer running too fast | Timer is client-side; expected behavior for responsiveness |

## Development Notes

- Frontend: React 18, Vite, vanilla CSS (no frameworks)
- Backend: FastAPI, Uvicorn, TensorFlow 2.15
- Model: Existing `sketchmind_model.keras` unchanged
- No database: Leaderboard saved to CSV file
- No authentication: Simple single-player game (add if needed)

## Next Steps

- [ ] Add user authentication
- [ ] Deploy backend to cloud (Heroku, AWS, GCP)
- [ ] Deploy frontend to static hosting (Vercel, Netlify)
- [ ] Add more drawing categories
- [ ] Implement multiplayer mode
- [ ] Add sound effects (if .mp3 files available)
- [ ] Improve preprocessing for better accuracy
- [ ] Add statistics/analytics dashboard
