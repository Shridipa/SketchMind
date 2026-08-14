# Connecting Frontend and Backend - Complete Guide

## Quick Start (All-in-One)

### Windows Users - Automatic
```bash
.\start-dev.bat
```
This will open both servers automatically.

---

## Manual Connection (Recommended for Understanding)

### Step 1: Start the Backend (FastAPI)

Open **Terminal 1** (PowerShell/CMD/Bash):

```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Application startup complete
```

**Backend is now running at: http://localhost:8000**

---

### Step 2: Verify Backend is Working

In your browser, visit one of these URLs to test:

✅ **Health Check:** http://localhost:8000/api/health

Should return:
```json
{
  "status": "ok",
  "model_loaded": true,
  "labels_loaded": true
}
```

✅ **API Documentation:** http://localhost:8000/docs

Interactive API docs showing all endpoints.

---

### Step 3: Start the Frontend (React)

Open **Terminal 2** (in same project folder):

```bash
cd frontend
npm install          # Only needed first time
npm run dev
```

Expected output:
```
  VITE v5.0.0  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

**Frontend is now running at: http://localhost:5173**

---

### Step 4: Open the Game

In your browser, open: **http://localhost:5173**

You should see the SketchMind home screen with:
- Title: "SketchMind"
- Subtitle: "Draw it. Let the AI guess it."
- "Start Game" button
- Leaderboard preview (if any games played before)

---

## How They Connect

### Communication Flow

```
Browser (Frontend)
    ↓ (REST API calls via HTTP)
http://localhost:5173/
    ↓
React sends requests to:
http://localhost:8000/api/*
    ↓
FastAPI Backend
    ↓
TensorFlow Model
    ↓
Returns JSON response
    ↓
React displays result
```

### API Connection Details

**Frontend Configuration** (`frontend/.env`):
```
VITE_API_URL=http://localhost:8000
```

**API Service** (`frontend/src/services/api.js`):
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

All frontend API calls use this URL automatically.

---

## Testing the Connection

### Test 1: Check Backend Health
```bash
curl http://localhost:8000/api/health
```

Expected response:
```json
{"status":"ok","model_loaded":true,"labels_loaded":true}
```

### Test 2: Use the App
1. Go to http://localhost:5173
2. Enter your name
3. Click "Start Game"
4. Draw something
5. Click "Done"
6. Verify AI prediction appears

If prediction shows → **Connection works! ✅**

### Test 3: Check Browser Console
1. Open http://localhost:5173
2. Press **F12** or **Ctrl+Shift+I** (Dev Tools)
3. Go to **Network** tab
4. Click "Start Game"
5. You should see API requests to `http://localhost:8000/api/...`

All requests should return **Status 200** (success).

---

## Complete Setup Walkthrough

### Windows

**Option 1: Automatic (Easiest)**
```bash
.\start-dev.bat
```
Two terminal windows open automatically.

**Option 2: Manual (Two Terminal Windows)**

Window 1:
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

Window 2:
```bash
cd frontend
npm run dev
```

Then open: http://localhost:5173

---

### macOS / Linux

**Option 1: Automatic**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

**Option 2: Manual (Two Terminal Tabs)**

Tab 1:
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

Tab 2:
```bash
cd frontend
npm run dev
```

Then open: http://localhost:5173

---

## What Happens When You Play

### Behind the Scenes:

1. **Home Screen**
   - Frontend loads
   - Fetches leaderboard from `/api/leaderboard`

2. **Setup Screen**
   - You enter name and difficulty
   - Click "Start Game"

3. **Game Screen**
   - Frontend calls `/api/game/start`
   - Backend returns target word (e.g., "CAT")
   - Timer starts

4. **You Draw**
   - Canvas stores drawing in memory
   - Click "Done"

5. **Submit Drawing**
   - Canvas converts to PNG blob
   - Frontend sends to `/api/predict`
   - Backend receives image → processes → predicts
   - Returns: `{ prediction: "cat", confidence: 0.94, top_predictions: [...] }`

6. **Display Result**
   - Frontend compares prediction vs target
   - Calculates score
   - Shows result screen

7. **Next Round**
   - Frontend calls `/api/game/next-round`
   - Backend advances game
   - New target displayed

8. **Game Over**
   - After 20 rounds
   - Frontend calls `/api/game/end`
   - Backend saves score
   - Shows leaderboard

---

## Verification Checklist

### Backend ✅
- [ ] Terminal shows "Uvicorn running on http://127.0.0.1:8000"
- [ ] Health check works: http://localhost:8000/api/health
- [ ] API docs load: http://localhost:8000/docs
- [ ] Model loaded successfully (no errors in terminal)

### Frontend ✅
- [ ] Terminal shows "ready in XXX ms"
- [ ] Local URL: http://localhost:5173/
- [ ] Home screen loads
- [ ] Leaderboard displays (if games played before)

### Connection ✅
- [ ] Start game button works
- [ ] Game screen displays target word
- [ ] Can draw on canvas
- [ ] "Done" button works
- [ ] AI prediction appears (not empty)
- [ ] Confidence percentage shows
- [ ] Score updates correctly

---

## Common Issues & Fixes

### Issue: "Cannot connect to backend"

**Check 1: Is backend running?**
```bash
curl http://localhost:8000/api/health
```

If fails → start backend:
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

**Check 2: Wrong port?**
Make sure backend is on port 8000, frontend on port 5173.

**Check 3: Wrong API URL?**
Check `frontend/.env`:
```
VITE_API_URL=http://localhost:8000
```

---

### Issue: "Model not found"

Backend terminal shows error about `sketchmind_model.keras`

**Fix:**
```bash
# Check file exists
ls model-training/sketchmind_model.keras
```

If missing, check `backend/main.py` for correct path.

---

### Issue: CORS Error in Browser Console

Error: "Access to XMLHttpRequest has been blocked by CORS"

**This means:** Frontend can't call backend

**Fix:** Verify backend CORS settings in `backend/main.py`:
```python
allow_origins=[
    "http://localhost:5173",  # ← Make sure this is there
    "http://127.0.0.1:5173",
]
```

---

### Issue: Frontend shows "Analyzing your drawing..." but never returns

**This means:** Backend is taking too long or crashed

**Check:**
1. Backend terminal for errors
2. Is model loaded? Check backend logs
3. Is image valid? Check browser console

---

## Monitoring Connection

### Backend Logs
Watch terminal 1 for requests:
```
INFO:     127.0.0.1:54321 - "POST /api/predict HTTP/1.1" 200 OK
INFO:     127.0.0.1:54322 - "POST /api/game/next-round HTTP/1.1" 200 OK
```

Each request shows in real-time.

### Frontend Logs
Open browser DevTools (F12) → Console:
```javascript
// Should see API responses being logged
```

### Browser Network Tab
1. Press F12 → Network tab
2. Reload page
3. Perform action (start game, submit drawing)
4. Should see:
   - `POST /api/game/start` → Status 200
   - `POST /api/predict` → Status 200
   - `POST /api/game/next-round` → Status 200

---

## Full Example: Complete Flow

### Terminal 1 - Start Backend
```bash
$ cd backend
$ python -m uvicorn main:app --reload --port 8000
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Loaded predictor
```

### Terminal 2 - Start Frontend
```bash
$ cd frontend
$ npm run dev
  VITE v5.0.0  ready in 234 ms
  ➜  Local:   http://localhost:5173/
```

### Browser - Open App
1. Go to http://localhost:5173
2. See home screen ✅

### Browser - Start Game
1. Enter name: "Shri"
2. Select difficulty: "Easy"
3. Click "Start Game"
4. Backend logs:
   ```
   INFO: POST /api/game/start
   Shri started game on Easy difficulty
   ```
5. Game screen shows target word ✅

### Browser - Draw
1. Draw a circle on canvas
2. Click "Done"
3. Backend logs:
   ```
   INFO: POST /api/predict
   Received image, preprocessing...
   Prediction: circle, confidence: 0.92
   ```
4. Result shows:
   ```
   ✓ Nice!
   AI guessed: CIRCLE
   92% confident
   +10 points
   ```

✅ **Connection Working!**

---

## Environment Variables

### Frontend (.env)
```
# API Backend URL
VITE_API_URL=http://localhost:8000

# For production, change to:
# VITE_API_URL=https://api.sketchmind.com
```

### Backend
No `.env` file needed for local development.

For production, could add:
```python
# backend/main.py
import os
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
```

---

## Production Connection

When deploying:

1. **Backend** deployed to: `https://api.sketchmind.com`
2. **Frontend** deployed to: `https://sketchmind.com`
3. **Update frontend/.env:**
   ```
   VITE_API_URL=https://api.sketchmind.com
   ```
4. **Update backend CORS:**
   ```python
   allow_origins=[
       "https://sketchmind.com",
       "https://www.sketchmind.com",
   ]
   ```

---

## Summary

### To Connect Frontend & Backend:

1. **Start Backend**
   ```bash
   cd backend
   python -m uvicorn main:app --reload --port 8000
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open Browser**
   ```
   http://localhost:5173
   ```

4. **Test Connection**
   - Play a game
   - Draw something
   - Submit
   - See AI prediction
   - ✅ Connected!

**That's it!** They communicate automatically via REST API.

---

## Need Help?

### Check These Files:
- **Backend API**: `backend/main.py` (endpoints documented)
- **Frontend API**: `frontend/src/services/api.js` (API calls)
- **Connection Config**: `frontend/.env` (API URL)
- **CORS Config**: `backend/main.py` (allowed origins)

### Test Connection:
```bash
# In any terminal
curl http://localhost:8000/api/health

# Should return:
# {"status":"ok","model_loaded":true,"labels_loaded":true}
```

---

**You're all set!** Frontend and backend are now connected. 🎉
