import streamlit as st
from streamlit_drawable_canvas import st_canvas
from PIL import Image
import pandas as pd
import time

from predictor import Predictor
from game import Game
from leaderboard import save_score, get_leaderboard
from streamlit_autorefresh import st_autorefresh

st.set_page_config(
    page_title="SketchMind Challenge",
    page_icon="🎨",
    layout="wide"
)

# -------------------------------
# Custom CSS
# -------------------------------

st.markdown("""
<style>

html, body, [class*="css"]{
    background:#0f172a;
    color:white;
}

.block-container{
    padding-top:2rem;
}

.big-title{
    font-size:48px;
    font-weight:700;
    text-align:center;
}

.subtitle{
    font-size:20px;
    text-align:center;
    color:#cbd5e1;
}

.score-box{
    background:#1e293b;
    padding:20px;
    border-radius:15px;
    text-align:center;
}

.prompt-box{
    background:#334155;
    padding:15px;
    border-radius:12px;
    text-align:center;
    font-size:28px;
    font-weight:bold;
}

.result-box{
    background:#1e293b;
    padding:25px;
    border-radius:15px;
}

</style>
""", unsafe_allow_html=True)

# -------------------------------
# Session State
# -------------------------------

if "predictor" not in st.session_state:
    st.session_state.predictor = Predictor()

if "game" not in st.session_state:
    st.session_state.game = Game()

if "started" not in st.session_state:
    st.session_state.started = False

if "screen" not in st.session_state:
    st.session_state.screen = "home"

if "player" not in st.session_state:
    st.session_state.player = ""

if "difficulty" not in st.session_state:
    st.session_state.difficulty = "Easy"

if "prediction" not in st.session_state:
    st.session_state.prediction = ""

if "confidence" not in st.session_state:
    st.session_state.confidence = 0

if "correct" not in st.session_state:
    st.session_state.correct = False

if "round_start_time" not in st.session_state:
    st.session_state.round_start_time = None

predictor = st.session_state.predictor
game = st.session_state.game
# -------------------------------
# HOME SCREEN
# -------------------------------

if st.session_state.screen == "home":

    st.markdown(
        "<div class='big-title'>🎨 SketchMind Challenge</div>",
        unsafe_allow_html=True
    )

    st.markdown(
        "<div class='subtitle'>Can the AI recognize your drawings?</div>",
        unsafe_allow_html=True
    )

    st.write("")
    st.write("")

    col1, col2 = st.columns([2,1])

    with col1:

        player = st.text_input(
            "Enter Your Name",
            value=st.session_state.player
        )

        difficulty = st.selectbox(
            "Difficulty",
            [
                "Easy",
                "Medium",
                "Hard"
            ]
        )

        if st.button(
            "🎮 Start Game",
            use_container_width=True
        ):

            st.session_state.player = player
            st.session_state.difficulty = difficulty

            game.start(
                predictor.labels,
                difficulty
            )

            st.session_state.screen = "game"

            st.rerun()

    with col2:

        st.markdown("## 🏆 Leaderboard")

        leaderboard = get_leaderboard()

        if len(leaderboard) == 0:

            st.info("No scores yet.")

        else:

            st.dataframe(
                leaderboard.head(10),
                use_container_width=True,
                hide_index=True
            )
# -------------------------------
# GAME SCREEN
# -------------------------------

elif st.session_state.screen == "game":

    st.title("🎨 SketchMind Challenge")

    if st.session_state.round_start_time is None:
        st.session_state.round_start_time = time.time()

# Refresh page every second
    st_autorefresh(interval=1000, key="timer")

    elapsed = int(
        time.time() -
        st.session_state.round_start_time
        )

    remaining = max(
        0,
        game.time_limit - elapsed
        )
    
    col1, col2 = st.columns([3, 1])

    with col1:
        st.markdown(
            f"""
            <h3 style="margin-bottom:0;">
            👤 {st.session_state.player}
            </h3>
            """,
            unsafe_allow_html=True
            )

    with col2:
        st.markdown(
            f"""
            <h3 style="text-align:right;margin-bottom:0;">
            ⭐ {game.score}
            </h3>
            """,
            unsafe_allow_html=True
            )

    st.divider()

    left, right = st.columns([2, 1])

    with left:
        st.write(
            f"### 🎯 Round {game.round + 1}/{game.max_rounds}"
            )

    with right:
        st.write(
            f"### ⏱ {remaining}s"
            )


    st.progress(
        remaining / game.time_limit
        )

    st.warning(
        f"⏱ {remaining} seconds left"
        )

    if remaining == 0:

        st.error("⏰ Time's Up!")

        game.wrong_answer()

        game.next_round()

        st.session_state.round_start_time = None

        if game.finished():

            save_score(
                st.session_state.player,
                game.score
                )

            st.session_state.screen = "game_over"

        st.rerun()

    progress = (game.round) / game.max_rounds

    st.progress(progress)

    st.write("")

    prompt = game.current_prompt()

    st.markdown(
        f"""
        <h2 style="
            text-align:center;
            color:#22c55e;
            margin-bottom:5px;
            ">
                ✏ Draw
            </h2>

        <h1 style="
            text-align:center;
            color:white;
            font-size:48px;
            margin-top:0;
            margin-bottom:20px;
            ">
                {prompt.upper()}
            </h1>
            """,
            unsafe_allow_html=True
            )

    st.write("")

    canvas = st_canvas(
        fill_color="black",
        stroke_width=12,
        stroke_color="white",
        background_color="black",
        width=500,
        height=500,
        drawing_mode="freedraw",
        key=f"canvas_{game.round}"
    )

    st.write("")

    left, middle, right = st.columns([2,2,1])

    with left:

        submit = st.button(
            "✅ Done",
            use_container_width=True
        )

    with middle:

        skip = st.button(
            "⏭ Skip",
            use_container_width=True
        )

    with right:

        quit_game = st.button(
            "❌ Quit"
        )

    # --------------------
    # Skip
    # --------------------

    if skip:

        game.wrong_answer()

        game.next_round()

        st.session_state.round_start_time = None

        if game.finished():

            save_score(
                st.session_state.player,
                game.score
                )

            st.session_state.screen = "game_over"

        st.rerun()

    # --------------------
    # Quit
    # --------------------

    if quit_game:

        save_score(
            st.session_state.player,
            game.score
        )

        st.session_state.screen = "game_over"

        st.session_state.round_start_time = None

        st.rerun()

    # --------------------
    # Predict
    # --------------------

    if submit:

        if canvas.image_data is not None:

            image = Image.fromarray(
                canvas.image_data.astype("uint8")
            )

            with st.spinner("AI is thinking..."):

                prediction, confidence = predictor.predict(image)

            st.session_state.prediction = prediction
            st.session_state.confidence = confidence

            if prediction == prompt:

                st.session_state.correct = True

                if game.difficulty == "Easy":
                    points = 10

                elif game.difficulty == "Medium":
                    points = 15

                else:
                    points = 20

# Bonus for high confidence
                if confidence > 0.95:
                    points += 5

                game.add_score(points)

            else:
                st.session_state.correct = False
                game.wrong_answer()

            st.session_state.screen = "result"

            st.session_state.round_start_time = None

            st.rerun()
# -------------------------------
# RESULT SCREEN
# -------------------------------

elif st.session_state.screen == "result":

    st.title("🎯 AI Result")

    if st.session_state.correct:

        st.success("✅ Correct!")

        if st.session_state.confidence > 0.95:
            st.info("🌟 Confidence Bonus +5")

    else:

        st.error("❌ Wrong Drawing!")

    st.write("")

    col1, col2 = st.columns(2)

    with col1:

        st.metric(
            "Expected",
            game.current_prompt().upper()
        )

    with col2:

        st.metric(
            "AI Predicted",
            st.session_state.prediction.upper()
        )

    st.metric(
        "Confidence",
        f"{st.session_state.confidence*100:.2f}%"
    )

    st.metric(
        "Current Score",
        game.score
    )

    st.write("")

    left, right = st.columns(2)

    with left:

        if st.button(
            "➡ Next Round",
            use_container_width=True
        ):

            game.next_round()

            if game.finished():

                save_score(
                    st.session_state.player,
                    game.score
                )

                st.session_state.screen = "game_over"

            else:

                st.session_state.screen = "game"

            st.session_state.round_start_time = None

            st.rerun()

    with right:

        if st.button(
            "❌ Quit Game",
            use_container_width=True
        ):

            save_score(
                st.session_state.player,
                game.score
            )

            st.session_state.screen = "game_over"

            st.rerun()

# -------------------------------
# GAME OVER
# -------------------------------

elif st.session_state.screen == "game_over":

    st.balloons()

    st.title("🏆 Game Over")

    st.metric(
        "Final Score",
        game.score
    )

    accuracy = 0

    if game.max_rounds > 0:

        accuracy = (
            game.score /
            (game.max_rounds * 15)
        ) * 100

    st.metric(
        "Accuracy",
        f"{accuracy:.1f}%"
    )

    st.write("")

    st.subheader("🏆 Leaderboard")

    leaderboard = get_leaderboard()

    if len(leaderboard):

        st.dataframe(
            leaderboard.head(10),
            use_container_width=True,
            hide_index=True
        )

    st.write("")

    if st.button(
        "🔄 Play Again",
        use_container_width=True
    ):

        st.session_state.screen = "home"

        st.session_state.started = False

        st.session_state.correct = False

        st.session_state.prediction = ""

        st.session_state.confidence = 0

        st.session_state.game = Game()

        st.rerun()