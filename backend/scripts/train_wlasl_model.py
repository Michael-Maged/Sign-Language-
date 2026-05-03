"""
WLASL Step 2 -- Train LSTM classifier on extracted landmark sequences.

Reads:   data/wlasl_landmarks.npy   shape: (N, 30, 225)
         data/wlasl_labels.npy      shape: (N,)
Writes:  models/wlasl_model.keras
         models/wlasl_encoder.pkl

Run from backend/:
    python scripts/train_wlasl_model.py
"""

import os
import joblib
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR  = os.path.dirname(SCRIPT_DIR)

LMS_PATH     = os.path.join(BACKEND_DIR, "data", "wlasl_landmarks.npy")
LABELS_PATH  = os.path.join(BACKEND_DIR, "data", "wlasl_labels.npy")
MODELS_DIR   = os.path.join(BACKEND_DIR, "models")
MODEL_PATH   = os.path.join(MODELS_DIR, "wlasl_model.keras")
ENCODER_PATH = os.path.join(MODELS_DIR, "wlasl_encoder.pkl")

SEQ_LEN      = 30
N_FEATURES   = 225
EPOCHS       = 50
BATCH_SIZE   = 32


def train():
    if not os.path.exists(LMS_PATH):
        print("wlasl_landmarks.npy not found -- run extract_wlasl_landmarks.py first.")
        return

    print("Loading sequences...")
    X = np.load(LMS_PATH).astype(np.float32)   # (N, 30, 225)
    y_raw = np.load(LABELS_PATH, allow_pickle=True)
    print(f"  {len(X)} samples, {len(set(y_raw))} classes")

    le = LabelEncoder()
    y = le.fit_transform(y_raw)
    n_classes = len(le.classes_)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y
    )
    print(f"  Train: {len(X_train)}  Test: {len(X_test)}")

    model = tf.keras.Sequential([
        tf.keras.layers.LSTM(128, return_sequences=True, input_shape=(SEQ_LEN, N_FEATURES)),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.LSTM(64),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(n_classes, activation="softmax"),
    ])

    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    model.summary()

    callbacks = [
        tf.keras.callbacks.EarlyStopping(patience=10, restore_best_weights=True),
        tf.keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=5, verbose=1),
    ]

    print("\nTraining LSTM...")
    model.fit(
        X_train, y_train,
        validation_data=(X_test, y_test),
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        callbacks=callbacks,
        verbose=1,
    )

    _, acc = model.evaluate(X_test, y_test, verbose=0)
    print(f"\nTest accuracy: {acc:.4f} ({acc * 100:.1f}%)")

    os.makedirs(MODELS_DIR, exist_ok=True)
    model.save(MODEL_PATH)
    joblib.dump(le, ENCODER_PATH)
    print(f"\nModel saved to {MODEL_PATH}")
    print(f"Encoder saved to {ENCODER_PATH}")


if __name__ == "__main__":
    train()
