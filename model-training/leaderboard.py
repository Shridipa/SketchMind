import pandas as pd
import os

# Get the directory where this file is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FILE = os.path.join(SCRIPT_DIR, "leaderboard.csv")


def save_score(name, score):

    name = name.strip()
    if not name:
        name = "Anonymous"

    if os.path.exists(FILE):

        df = pd.read_csv(FILE)

    else:

        df = pd.DataFrame(
            columns=["Name", "Score"]
        )

    # Keep a single entry per player and preserve only their highest score.
    # This also cleans up duplicate names already present in the CSV.
    df["Name"] = df["Name"].astype(str).str.strip()
    df["Score"] = pd.to_numeric(df["Score"], errors="coerce").fillna(0).astype(int)
    normalized_name = name.casefold()
    existing = df["Name"].str.casefold() == normalized_name

    if existing.any():
        best_score = max(int(score), int(df.loc[existing, "Score"].max()))
        df = df.loc[~existing]
        new_row = pd.DataFrame({"Name": [name], "Score": [best_score]})
    else:
        new_row = pd.DataFrame({"Name": [name], "Score": [int(score)]})

    df = pd.concat([df, new_row], ignore_index=True)
    df = df.sort_values(by=["Score", "Name"], ascending=[False, True], kind="stable")

    df.to_csv(
        FILE,
        index=False
    )


def get_leaderboard():

    if os.path.exists(FILE):

        df = pd.read_csv(FILE)

        df["Name"] = df["Name"].astype(str).str.strip()
        df["Score"] = pd.to_numeric(df["Score"], errors="coerce").fillna(0).astype(int)
        df["_normalized_name"] = df["Name"].str.casefold()
        df = (
            df.sort_values(by=["Score", "Name"], ascending=[False, True], kind="stable")
            .drop_duplicates(subset="_normalized_name", keep="first")
            .drop(columns="_normalized_name")
        )
        df = df.sort_values(by=["Score", "Name"], ascending=[False, True], kind="stable")

        return df

    return pd.DataFrame(
        columns=["Name", "Score"]
    )
