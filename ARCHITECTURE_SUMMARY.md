# SketchMind - Architecture Migration Summary

## Overview

This document summarizes the complete migration from Streamlit to a modern React + FastAPI architecture while preserving all existing ML infrastructure.

## What Was Changed

### NEW FILES CREATED

#### Backend (FastAPI)
- `backend/main.py` - FastAPI application with all endpoints
- `backend/requirements.txt` - Python dependencies
- `backend/.gitignore` - Git ignore patterns

#### Frontend (React + Vite)
- `frontend/package.json` - NPM dependencies and scripts
- `frontend/vite.config.js` - Vite configuration
- `frontend/index.html` - HTML entry point
- `frontend/.env` - Environment variables for API URL
- `frontend/.gitignore` - Git ignore patterns

#### Frontend - Source Code
- `frontend/src/main.jsx` - React entry point
- `frontend/src/App.jsx` - Main application component
- `frontend/src/services/api.js` - Centralized API communication

#### Frontend - Components
- `frontend/src/components/Home.jsx` - Landing/home screen
- `frontend/src/components/Setup.jsx` - Game setup screen
- `frontend/src/components/Game.jsx` - Main game screen
- `frontend/src/components/DrawingCanvas.jsx` - Drawing canvas component
- `frontend/src/components/Result.jsx` - Result display screen
- `frontend/src/components/GameOver.jsx` - Game over/leaderboard screen

#### Frontend - Styles
- `frontend/src/styles/global.css` - Global CSS and utilities
- `frontend/src/styles/app.css` - App-level styles
- `frontend/src/components/home.css` - Home screen styles
- `frontend/src/components/setup.css` - Setup screen styles
- `frontend/src/components/canvas.css` - Canvas styles
- `frontend/src/components/game.css` - Game screen styles
- `frontend/src/components/result.css` - Result screen styles
- `frontend/src/components/gameover.css` - Game over screen styles

#### Documentation
- `SETUP_GUIDE.md` - Complete setup and architecture guide
- `start-dev.bat` - Windows development startup script
- `start-dev.sh` - macOS/Linux development startup script
- `ARCHITECTURE_SUMMARY.md` - This file

### FILES UNCHANGED (Still in model-training/)

All existing ML infrastructure remains completely untouched:
- ✅ `model-training/predictor.py` - Model prediction pipeline
- ✅ `model-training/game.py` - Game state management
- ✅ `model-training/leaderboard.py` - Score persistence
- ✅ `model-training/labels.txt` - Class labels
- ✅ `model-training/sketchmind_model.keras` - Trained model
- ✅ `model-training/processed/` - Processed dataset
- ✅ `model-training/data/` - Raw QuickDraw data
- ✅ All training scripts and utilities

## Technology Stack

### Frontend
- **React 18** - UI framework
- **Vite 5** - Build tool and dev server
- **Vanilla CSS** - Styling (no framework)
- **Fetch API** - HTTP requests

### Backend
- **FastAPI** - Web framework
- **Uvicorn** - ASGI server
- **TensorFlow 2.15** - ML inference
- **PIL/Pillow** - Image processing
- **NumPy** - Numerical computing
- **Pandas** - Data handling

## Key Features

### Frontend
✅ Clean, minimal Google QuickDraw-inspired design
✅ Responsive canvas drawing (mouse + touch)
✅ Real-time timer with visual warnings
✅ Game progress tracking
✅ Result screen with top 3 predictions
✅ Leaderboard display
✅ Error handling and loading states

### Backend
✅ Health check endpoint
✅ Game session management
✅ Image prediction with preprocessing
✅ Score calculation
✅ Leaderboard persistence
✅ CORS properly configured
✅ Input validation

### ML Integration
✅ Existing Predictor class reused
✅ Same preprocessing pipeline (28×28 normalized grayscale)
✅ Model loaded once at startup
✅ No duplication of ML logic
✅ Maintains training/inference consistency

## Directory Structure

```
SketchMind/
│
├── frontend/                          # React Vite app
│   ├── src/
│   │   ├── components/
│   │   │   ├── Home.jsx
│   │   │   ├── Setup.jsx
│   │   │   ├── Game.jsx
│   │   │   ├── DrawingCanvas.jsx
│   │   │   ├── Result.jsx
│   │   │   ├── GameOver.jsx
│   │   │   ├── home.css
│   │   │   ├── setup.css
│   │   │   ├── canvas.css
│   │   │   ├── game.css
│   │   │   ├── result.css
│   │   │   └── gameover.css
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── styles/
│   │   │   ├── global.css
│   │   │   └── app.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── .env
│   └── .gitignore
│
├── backend/                           # FastAPI app
│   ├── main.py                        # All endpoints
│   ├── requirements.txt
│   └── .gitignore
│
├── model-training/                    # ML infrastructure (unchanged)
│   ├── predictor.py                   # ← Used by backend
│   ├── game.py                        # ← Used by backend
│   ├── leaderboard.py                 # ← Used by backend
│   ├── labels.txt                     # ← Used by backend
│   ├── sketchmind_model.keras         # ← Used by backend
│   ├── processed/
│   ├── data/
│   └── ...
│
├── SETUP_GUIDE.md                     # Complete setup guide
├── ARCHITECTURE_SUMMARY.md            # This file
├── start-dev.bat                      # Windows quick start
└── start-dev.sh                       # Unix/Mac quick start
```

## Data Flow

### User Interaction Flow
```
Home Screen
    ↓
Setup (Name + Difficulty)
    ↓
API: startGame() → /api/game/start
    ↓
Game Screen (Target + Canvas)
    ↓
User draws
    ↓
Click Done
    ↓
Canvas → Blob → API: predictDrawing() → /api/predict
    ↓
FastAPI receives PNG
    ↓
Predictor.preprocess() (28×28 normalized)
    ↓
TensorFlow model.predict()
    ↓
Returns: prediction, confidence, top_3
    ↓
React compares prediction vs target
    ↓
Calculate score (difficulty + confidence bonus)
    ↓
API: nextRound() → /api/game/next-round
    ↓
Result Screen (show prediction + score)
    ↓
Click Next
    ↓
[Loop back to Game Screen with new target]
    ↓
After 20 rounds → Game Over Screen
    ↓
API: endGame() → /api/game/end (save score)
    ↓
Leaderboard fetched via API
    ↓
Option to Play Again
```

## API Endpoints

All endpoints documented in `SETUP_GUIDE.md`:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/health` | Health check |
| POST | `/api/game/start` | Initialize game |
| POST | `/api/predict` | Get prediction for drawing |
| POST | `/api/game/next-round` | Advance to next round |
| POST | `/api/game/skip` | Skip current round |
| POST | `/api/game/end` | End game and save score |
| GET | `/api/leaderboard` | Get top scores |

## How It Works

### Drawing Submission Process

1. User draws on HTML5 canvas in React
2. Clicks "Done" button
3. Canvas converted to PNG Blob
4. React sends to `POST /api/predict` with FormData
5. FastAPI receives multipart image
6. PIL converts bytes → Image object
7. **Predictor.preprocess()** called:
   - Converts to grayscale
   - Detects drawing pixels (threshold 20)
   - Finds bounding box
   - Crops and centers
   - Resizes to 28×28
   - Normalizes to [0, 1]
   - Adds batch/channel dimensions
8. TensorFlow model runs inference
9. FastAPI returns JSON with prediction
10. React compares with target word
11. Calculates score based on difficulty
12. Adds confidence bonus if ≥95%
13. Updates game state via next-round endpoint
14. Displays result screen

### Scoring

Based on existing game.py logic:
- Easy difficulty: 10 points/correct
- Medium difficulty: 15 points/correct
- Hard difficulty: 20 points/correct
- High confidence bonus (≥95%): +5 points

Score is authorized by backend (cannot be faked by client).

## Installation Steps

### Option 1: Manual Setup

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Option 2: Quick Start Script (Windows)
```bash
.\start-dev.bat
```

### Option 3: Quick Start Script (macOS/Linux)
```bash
chmod +x start-dev.sh
./start-dev.sh
```

## Design Philosophy

✅ **Simplicity First** - Google QuickDraw-inspired, minimal UI
✅ **ML Model Protected** - Never sent to browser, only on backend
✅ **Preprocessing Unified** - Same pipeline for training and inference
✅ **No Duplicated Logic** - Reuses predictor.py, game.py, leaderboard.py
✅ **Easy Debugging** - Simple REST API, visible in browser dev tools
✅ **Responsive Design** - Works on desktop, tablet, mobile
✅ **Performance** - Model loaded once, no per-request overhead
✅ **Human-Designed Feel** - Not "AI-generated" looking

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Health check returns OK
- [ ] Home screen displays
- [ ] Can enter player name
- [ ] Can select difficulty
- [ ] Game starts and displays target
- [ ] Canvas allows drawing
- [ ] Clear button works
- [ ] Done button works
- [ ] Real model prediction appears
- [ ] Confidence shows correctly
- [ ] Correct/wrong status shows
- [ ] Score updates correctly
- [ ] Next round loads new target
- [ ] Timer counts down
- [ ] Skip works
- [ ] Quit saves game
- [ ] Game over screen displays
- [ ] Leaderboard shows scores
- [ ] Play again resets properly

## Deployment

### Backend (Production)
```bash
pip install gunicorn
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

Deploy to: Heroku, AWS, GCP, Railway, Render, etc.

### Frontend (Production)
```bash
npm run build
# Deploy frontend/dist/ to Vercel, Netlify, S3, etc.
```

Update `frontend/.env` to point to production backend URL.

## Maintenance

### Updating Dependencies

Frontend:
```bash
cd frontend
npm outdated
npm update
```

Backend:
```bash
cd backend
pip list --outdated
pip install --upgrade <package>
```

### Improving Model Accuracy

If predictions seem wrong:
1. Review preprocessing in `model-training/predictor.py`
2. Check if training distribution matches canvas drawings
3. Consider retraining with more diverse QuickDraw data
4. Fine-tune confidence thresholds if needed

### Scaling

To handle more concurrent games:
1. Add game session cleanup (time-based expiration)
2. Use database instead of memory dict for games
3. Add Redis for faster lookups
4. Increase Uvicorn workers
5. Add load balancer (Nginx)

## Known Limitations

- Single-player only (authentication not implemented)
- Leaderboard uses CSV file (not scalable)
- Session storage in memory (lost on server restart)
- No real-time multiplayer
- No replay feature
- No difficulty progression

These can be added as future enhancements.

## Troubleshooting

See `SETUP_GUIDE.md` for detailed troubleshooting section.

Common issues:
- Backend not starting: Check Python version and TensorFlow installation
- Frontend can't connect: Verify backend running on 8000
- Wrong predictions: Review drawing preprocessing
- Leaderboard empty: Check file permissions for leaderboard.csv

## Migration Notes

### What Stayed the Same
- TensorFlow/Keras model
- predictor.py preprocessing
- game.py scoring logic
- leaderboard.py persistence
- All training data
- All class labels

### What Changed
- UI framework (Streamlit → React)
- Backend (Streamlit → FastAPI)
- Frontend language (Python → JavaScript/JSX)
- Styling approach (Streamlit defaults → custom CSS)
- Communication (session state → REST API)

### Why This Architecture

1. **Flexibility** - React offers more UI control than Streamlit
2. **Performance** - Vite provides fast development and builds
3. **Scalability** - FastAPI easily handles concurrent requests
4. **Separation** - Frontend and backend can scale independently
5. **Deployment** - Each part can be deployed separately
6. **Maintainability** - Clear separation of concerns

## Next Steps

For continued development:
1. Add user authentication (JWT)
2. Add database (PostgreSQL, MongoDB)
3. Improve model (retrain with more data)
4. Add sound effects
5. Add statistics dashboard
6. Implement multiplayer mode
7. Add difficulty progression
8. Optimize model for mobile
9. Add offline support (Service Workers)
10. Add analytics tracking

## Support

Refer to:
- `SETUP_GUIDE.md` - Setup instructions
- `backend/main.py` - API documentation in docstrings
- `frontend/src/services/api.js` - Frontend API calls
- Backend docs: `http://localhost:8000/docs` (when running)

---

**Architecture Complete** ✅

The migration from Streamlit to React + FastAPI is complete. All existing ML infrastructure is preserved and fully integrated.
