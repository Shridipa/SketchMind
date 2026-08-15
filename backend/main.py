"""
SketchMind FastAPI Backend
Serves predictions from the TensorFlow model via REST API
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import io
import sys
import os

# Add model-training to path to import existing modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'model-training'))

from predictor import Predictor
from game import Game
from leaderboard_store import get_top_players, initialise_database, record_game_result

# ============================================================
# INITIALIZATION
# ============================================================

app = FastAPI(title="SketchMind Backend")


@app.on_event("startup")
async def initialise_leaderboard() -> None:
    initialise_database()

# Load predictor once at startup
predictor = Predictor()

# Store active game sessions by player
games = {}

# ============================================================
# CORS CONFIGURATION
# ============================================================

allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")
vercel_origin_regex = os.getenv(
    "VERCEL_ORIGIN_REGEX",
    r"https://(sketch-mind-(1irk|77rw)\.vercel\.app|sketch-mind-(1irk|77rw)-[a-z0-9]+-shridipas-projects\.vercel\.app)",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins if origin.strip()],
    allow_origin_regex=vercel_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# MODELS
# ============================================================


class GameStartRequest(BaseModel):
    player: str


class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    top_predictions: list


class GameStartResponse(BaseModel):
    player: str
    round: int
    max_rounds: int
    target: str
    score: int
    time_limit: int


class NextRoundResponse(BaseModel):
    round: int
    max_rounds: int
    target: str
    score: int
    finished: bool


class GameResultResponse(BaseModel):
    player: str
    score: int
    accuracy: float
    rounds: int


class LeaderboardEntry(BaseModel):
    rank: int
    player_name: str
    games_played: int
    average_score: float
    best_score: int
    average_accuracy: float


# ============================================================
# HEALTH CHECK
# ============================================================


@app.get("/")
async def root():
    """Small unauthenticated service check for a deployed API root URL."""
    return {"status": "ok", "service": "SketchMind API"}


@app.get("/api/health")
async def health_check():
    """Simple health check endpoint"""
    return {
        "status": "ok",
        "model_loaded": predictor.model is not None,
        "labels_loaded": len(predictor.labels) > 0,
    }


# ============================================================
# GAME START
# ============================================================


@app.post("/api/game/start")
async def start_game(request: GameStartRequest):
    """
    Initialize a new game session
    """
    player = request.player.strip()
    if not player:
        raise HTTPException(status_code=400, detail="Player name required")

    # Create new game
    game = Game()
    game.start(predictor.labels)

    # Store game session
    games[player] = game

    return GameStartResponse(
        player=player,
        round=game.round + 1,
        max_rounds=game.max_rounds,
        target=game.current_prompt().upper(),
        score=game.score,
        time_limit=game.time_limit,
    )


# ============================================================
# PREDICTION
# ============================================================


@app.post("/api/predict")
async def predict(file: UploadFile = File(...), target: str = None):
    """
    Receive a drawing image and return prediction
    """
    if file.content_type not in ["image/png", "image/jpeg", "image/jpg"]:
        raise HTTPException(status_code=400, detail="Invalid image format")

    try:
        # Read image
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))

        # Get prediction
        prediction, confidence = predictor.predict(image)
        top_predictions = predictor.predict_top3(image)

        # Format top predictions
        top_pred_list = [
            {
                "label": pred["label"],
                "confidence": round(float(pred["confidence"]), 4),
            }
            for pred in top_predictions
        ]

        return PredictionResponse(
            prediction=prediction.lower(),
            confidence=round(float(confidence), 4),
            top_predictions=top_pred_list,
        )

    except Exception as e:
        print(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail="Prediction failed")


# ============================================================
# NEXT ROUND
# ============================================================


@app.post("/api/game/next-round")
async def next_round(player: str, correct: bool, score_points: int = 0):
    """
    Advance to the next round and update score
    """
    if player not in games:
        raise HTTPException(status_code=404, detail="Game session not found")

    game = games[player]

    if correct:
        game.add_score(score_points)
    else:
        game.wrong_answer()

    game.next_round()

    if game.finished():
        return NextRoundResponse(
            round=game.round,
            max_rounds=game.max_rounds,
            target="",
            score=game.score,
            finished=True,
        )

    return NextRoundResponse(
        round=game.round + 1,
        max_rounds=game.max_rounds,
        target=game.current_prompt().upper(),
        score=game.score,
        finished=False,
    )


# ============================================================
# END GAME
# ============================================================


@app.post("/api/game/end")
async def end_game(player: str):
    """
    End the current game and save score
    """
    if player not in games:
        raise HTTPException(status_code=404, detail="Game session not found")

    game = games[player]

    # Store the existing final game result; no score or ML logic is changed here.
    try:
        record_game_result(player, game.score, game.accuracy())
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    result = GameResultResponse(
        player=player,
        score=game.score,
        accuracy=game.accuracy(),
        rounds=game.round,
    )

    # Clean up session
    del games[player]

    return result


# ============================================================
# LEADERBOARD
# ============================================================


@app.get("/api/leaderboard")
async def get_top_scores(limit: int = 10):
    """Return the persistent top 10, ranked by consistent performance."""
    try:
        return {"scores": [LeaderboardEntry(**entry) for entry in get_top_players(limit)]}

    except Exception as e:
        print(f"Leaderboard error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve leaderboard")


# ============================================================
# SKIP ROUND
# ============================================================


@app.post("/api/game/skip")
async def skip_round(player: str):
    """
    Skip the current round
    """
    if player not in games:
        raise HTTPException(status_code=404, detail="Game session not found")

    game = games[player]

    game.wrong_answer()
    game.next_round()

    if game.finished():
        return NextRoundResponse(
            round=game.round,
            max_rounds=game.max_rounds,
            target="",
            score=game.score,
            finished=True,
        )

    return NextRoundResponse(
        round=game.round + 1,
        max_rounds=game.max_rounds,
        target=game.current_prompt().upper(),
        score=game.score,
        finished=False,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
