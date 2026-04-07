"""
Export one representative landmark set per ASL letter from landmarks.csv.

Reads:  data/landmarks.csv
Writes: data/signs/<letter>.json  (one file per letter, A–Z)

Uses the per-letter median across all training samples — more robust than
picking a single frame.

Run from backend/:
    python scripts/export_sign_landmarks.py
"""

import os
import json
import pandas as pd

SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
CSV_PATH    = os.path.join(BACKEND_DIR, "data", "landmarks.csv")
SIGNS_DIR   = os.path.join(BACKEND_DIR, "data", "signs")


def export():
    if not os.path.exists(CSV_PATH):
        print("landmarks.csv not found — run extract_landmarks.py first.")
        return

    os.makedirs(SIGNS_DIR, exist_ok=True)

    df = pd.read_csv(CSV_PATH)
    feature_cols = [c for c in df.columns if c != "label"]

    for letter, group in df.groupby("label"):
        median = group[feature_cols].median().values  # shape: (63,)

        landmarks = []
        for i in range(21):
            landmarks.append({
                "x": round(float(median[i * 3]),     5),
                "y": round(float(median[i * 3 + 1]), 5),
                "z": round(float(median[i * 3 + 2]), 5),
            })

        out_path = os.path.join(SIGNS_DIR, f"{letter}.json")
        with open(out_path, "w") as f:
            json.dump({"letter": letter, "landmarks": landmarks}, f)

        print(f"  {letter}  ({len(group)} samples) → {out_path}")

    print(f"\nDone — {df['label'].nunique()} files written to {SIGNS_DIR}/")


if __name__ == "__main__":
    export()
