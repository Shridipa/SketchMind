"""Persistent SQLite storage for the non-ML SketchMind leaderboard."""

import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator


DEFAULT_DB_PATH = Path(__file__).resolve().parent / "data" / "leaderboard.db"
DB_PATH = Path(os.getenv("LEADERBOARD_DB_PATH", str(DEFAULT_DB_PATH)))


def _normalise_name(name: str) -> str:
    return " ".join(name.strip().split())


@contextmanager
def _connection() -> Iterator[sqlite3.Connection]:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def initialise_database() -> None:
    with _connection() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS players (
                id INTEGER PRIMARY KEY,
                display_name TEXT NOT NULL,
                normalized_name TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                last_played TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS game_results (
                id INTEGER PRIMARY KEY,
                player_id INTEGER NOT NULL REFERENCES players(id),
                score INTEGER NOT NULL CHECK(score >= 0 AND score <= 10000),
                accuracy REAL NOT NULL CHECK(accuracy >= 0 AND accuracy <= 100),
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_game_results_player ON game_results(player_id);
            """
        )


def record_game_result(player_name: str, score: int, accuracy: float) -> None:
    clean_name = _normalise_name(player_name)
    if not clean_name or len(clean_name) > 40:
        raise ValueError("Player name must contain 1 to 40 characters")
    if not 0 <= score <= 10000:
        raise ValueError("Score must be between 0 and 10000")
    if not 0 <= accuracy <= 100:
        raise ValueError("Accuracy must be between 0 and 100")

    normalized_name = clean_name.casefold()
    with _connection() as connection:
        connection.execute(
            """
            INSERT INTO players (display_name, normalized_name)
            VALUES (?, ?)
            ON CONFLICT(normalized_name) DO UPDATE SET
                last_played = CURRENT_TIMESTAMP
            """,
            (clean_name, normalized_name),
        )
        player_id = connection.execute(
            "SELECT id FROM players WHERE normalized_name = ?", (normalized_name,)
        ).fetchone()["id"]
        connection.execute(
            "INSERT INTO game_results (player_id, score, accuracy) VALUES (?, ?, ?)",
            (player_id, score, accuracy),
        )


def get_top_players(limit: int = 10) -> list[dict]:
    safe_limit = min(max(limit, 1), 10)
    with _connection() as connection:
        rows = connection.execute(
            """
            SELECT
                p.display_name AS player_name,
                COUNT(r.id) AS games_played,
                ROUND(AVG(r.score), 1) AS average_score,
                MAX(r.score) AS best_score,
                ROUND(AVG(r.accuracy), 1) AS average_accuracy
            FROM players p
            JOIN game_results r ON r.player_id = p.id
            GROUP BY p.id
            ORDER BY average_score DESC, average_accuracy DESC,
                     games_played DESC, best_score DESC, p.display_name COLLATE NOCASE ASC
            LIMIT ?
            """,
            (safe_limit,),
        ).fetchall()
    return [{"rank": index + 1, **dict(row)} for index, row in enumerate(rows)]
