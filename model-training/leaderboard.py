import pandas as pd
import os

FILE = "leaderboard.csv"


def save_score(name, score):

    if not name.strip():
        name = "Anonymous"

    if os.path.exists(FILE):

        df = pd.read_csv(FILE)

    else:

        df = pd.DataFrame(
            columns=["Name", "Score"]
        )

    new_row = pd.DataFrame({
        "Name": [name],
        "Score": [score]
    })

    df = pd.concat(
        [df, new_row],
        ignore_index=True
    )

    df = df.sort_values(
        by="Score",
        ascending=False
    )

    df.to_csv(
        FILE,
        index=False
    )


def get_leaderboard():

    if os.path.exists(FILE):

        df = pd.read_csv(FILE)

        df = df.sort_values(
            by="Score",
            ascending=False
        )

        return df

    return pd.DataFrame(
        columns=["Name", "Score"]
    )