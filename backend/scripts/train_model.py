"""
Step 2 — Train Random Forest classifier on extracted hand landmarks.

Reads:   data/letters/landmarks.csv
Writes:  models/gesture_model.pkl
         models/label_encoder.pkl

Run from backend/:
    python scripts/train_model.py
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR  = os.path.dirname(SCRIPT_DIR)

CSV_PATH     = os.path.join(BACKEND_DIR, "data", "letters", "landmarks.csv")
MODELS_DIR   = os.path.join(BACKEND_DIR, "models")
MODEL_PATH   = os.path.join(MODELS_DIR, "gesture_model.pkl")
ENCODER_PATH = os.path.join(MODELS_DIR, "label_encoder.pkl")


def _augment_noise(X, y, n_copies=3, noise_std=0.015):
    """Multiple Gaussian noise copies for robustness."""
    rng = np.random.default_rng(42)
    parts_X = [X]
    parts_y = [y]
    for _ in range(n_copies):
        noise = rng.normal(0, noise_std, X.shape)
        parts_X.append(X + noise)
        parts_y.append(y)
    return np.vstack(parts_X), np.concatenate(parts_y)


def train():
    if not os.path.exists(CSV_PATH):
        print("landmarks.csv not found — run extract_landmarks.py first.")
        return

    print("Loading landmarks...")
    df = pd.read_csv(CSV_PATH)
    print(f"  {len(df)} samples, {df['label'].nunique()} classes")

    # Print per-class counts to spot imbalance
    counts = df["label"].value_counts().sort_index()
    print("\nSamples per class:")
    for label, cnt in counts.items():
        print(f"  {label:10s}  {cnt}")

    X = df.drop("label", axis=1).values.astype(np.float32)
    y = df["label"].values

    le = LabelEncoder()
    y_enc = le.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.15, random_state=42, stratify=y_enc
    )

    print(f"\nTrain: {len(X_train)}  Test: {len(X_test)}")

    print("Augmenting with Gaussian noise (3 copies, std=0.015)...")
    X_train_aug, y_train_aug = _augment_noise(X_train, y_train)
    print(f"  Augmented train size: {len(X_train_aug)}")

    print("\nTraining Random Forest (300 trees)...")
    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=None,
        min_samples_leaf=2,
        max_features="sqrt",
        n_jobs=-1,
        random_state=42,
        class_weight="balanced",   # compensates for any class imbalance
        verbose=1,
    )
    model.fit(X_train_aug, y_train_aug)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\nTest accuracy: {acc:.4f} ({acc * 100:.1f}%)")

    print("\nPer-class report:")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    # Flag classes with low precision or recall (potential confusion sources)
    report = classification_report(y_test, y_pred, target_names=le.classes_, output_dict=True)
    print("Classes with recall < 0.85 (most error-prone):")
    for cls, metrics in report.items():
        if isinstance(metrics, dict) and metrics.get("recall", 1.0) < 0.85:
            print(f"  {cls:10s}  precision={metrics['precision']:.2f}  recall={metrics['recall']:.2f}")

    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(le, ENCODER_PATH)
    print(f"\nModel saved → {MODEL_PATH}")
    print(f"Encoder saved → {ENCODER_PATH}")


if __name__ == "__main__":
    train()
