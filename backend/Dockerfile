FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/main.py backend/leaderboard_store.py ./
COPY model-training/predictor.py model-training/game.py model-training/leaderboard.py model-training/labels.txt ./model-training/
COPY model-training/models ./model-training/models

ENV PYTHONPATH=/app/model-training
EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
