"""
Step 2 — Train MLP classifier on extracted world landmarks.

Reads:   data/landmarks.csv
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
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import classification_report, accuracy_score

SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR  = os.path.dirname(SCRIPT_DIR)

CSV_PATH     = os.path.join(BACKEND_DIR, "data", "landmarks.csv")
MODELS_DIR   = os.path.join(BACKEND_DIR, "models")
MODEL_PATH   = os.path.join(MODELS_DIR, "gesture_model.pkl")
ENCODER_PATH = os.path.join(MODELS_DIR, "label_encoder.pkl")


def _augment_noise(X, y, n_copies=1, noise_std=0.02):
    """Add Gaussian noise copies to improve robustness to small perturbations."""
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

    X = df.drop("label", axis=1).values.astype(np.float32)
    y = df["label"].values

    le = LabelEncoder()
    y_enc = le.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.15, random_state=42, stratify=y_enc
    )

    print(f"  Train: {len(X_train)}  Test: {len(X_test)}")

    print("Augmenting training data with Gaussian noise (1 copy, std=0.02)...")
    X_train_aug, y_train_aug = _augment_noise(X_train, y_train)
    print(f"  Augmented train size: {len(X_train_aug)}")

    print("\nTraining MLP (128->64->n_classes)...")
    model = MLPClassifier(
        hidden_layer_sizes=(128, 64),
        activation="relu",
        solver="adam",
        max_iter=100,
        random_state=42,
        early_stopping=True,
        validation_fraction=0.1,
        n_iter_no_change=10,
        verbose=True,
    )
    model.fit(X_train_aug, y_train_aug)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\nTest accuracy: {acc:.4f} ({acc * 100:.1f}%)")
    print("\nPer-class report:")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(le, ENCODER_PATH)
    print(f"\nModel saved to {MODEL_PATH}")
    print(f"Encoder saved to {ENCODER_PATH}")


if __name__ == "__main__":
    train()
