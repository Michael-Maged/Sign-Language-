# Letter Detection Improvement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the image-space landmark pipeline with 3D world landmarks and an MLP classifier to fix lighting/angle-dependent misclassifications.

**Architecture:** Switch `extract_landmarks.py` and `gesture.py` from `hand_landmarks` (0–1 image coords) to `hand_world_landmarks` (3D metric space, perspective-invariant). Replace XGBoost with sklearn `MLPClassifier` (256→128→64→26). Add Gaussian noise augmentation during training. The API contract and mobile app are unchanged.

**Tech Stack:** Python, MediaPipe Tasks API, scikit-learn MLPClassifier, joblib, pandas, numpy

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `backend/scripts/extract_landmarks.py` | Use `hand_world_landmarks` instead of `hand_landmarks` |
| Modify | `backend/scripts/train_model.py` | Replace XGBoost with MLP; add noise augmentation |
| Modify | `backend/routes/gesture.py` | Use `hand_world_landmarks` for features; keep `hand_landmarks` for overlay |
| Create | `backend/tests/test_landmarks.py` | Unit tests for `normalize()` and `flip_x()` |

---

## Task 1: Add test file for landmark utilities

**Files:**
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/test_landmarks.py`

- [ ] **Step 1: Create the test package**

Create `backend/tests/__init__.py` (empty file).

- [ ] **Step 2: Write failing tests for normalize() and flip_x()**

Create `backend/tests/test_landmarks.py`:

```python
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import numpy as np
import pytest
from scripts.extract_landmarks import normalize, flip_x


class _FakeLandmark:
    def __init__(self, x, y, z):
        self.x, self.y, self.z = x, y, z


def _make_landmarks(pts):
    return [_FakeLandmark(x, y, z) for x, y, z in pts]


def test_normalize_wrist_at_origin():
    """After normalize(), landmark 0 (wrist) must be at (0,0,0)."""
    pts = [(float(i), float(i) * 0.5, float(i) * 0.1) for i in range(21)]
    lms = _make_landmarks(pts)
    result = normalize(lms)
    # first 3 values are x0, y0, z0 — must all be 0
    assert result[0] == pytest.approx(0.0, abs=1e-6)
    assert result[1] == pytest.approx(0.0, abs=1e-6)
    assert result[2] == pytest.approx(0.0, abs=1e-6)


def test_normalize_scale_invariant():
    """Scaling all landmarks by a constant must not change normalize() output."""
    pts = [(float(i + 1), float(i + 1) * 0.3, float(i + 1) * 0.2) for i in range(21)]
    lms1 = _make_landmarks(pts)
    lms2 = _make_landmarks([(x * 3, y * 3, z * 3) for x, y, z in pts])
    r1 = normalize(lms1)
    r2 = normalize(lms2)
    np.testing.assert_allclose(r1, r2, atol=1e-5)


def test_flip_x_negates_x_coords():
    """flip_x() must negate the x coordinate of each of the 21 landmarks."""
    features = list(range(63)) + [0.5] * 10  # 63 xyz + 10 angles
    flipped = flip_x(features)
    for i in range(21):
        assert flipped[i * 3] == -features[i * 3]
        assert flipped[i * 3 + 1] == features[i * 3 + 1]  # y unchanged
        assert flipped[i * 3 + 2] == features[i * 3 + 2]  # z unchanged


def test_flip_x_angles_unchanged():
    """flip_x() must not modify the angle features (last 10 values)."""
    features = [1.0] * 63 + [0.1 * i for i in range(10)]
    flipped = flip_x(features)
    assert flipped[63:] == features[63:]
```

- [ ] **Step 3: Run tests — expect PASS (logic already correct, just verifying)**

```bash
cd backend
python -m pytest tests/test_landmarks.py -v
```

Expected output: 4 tests PASSED.

- [ ] **Step 4: Commit**

```bash
git add backend/tests/
git commit -m "test: add unit tests for normalize() and flip_x()"
```

---

## Task 2: Switch extract_landmarks.py to world landmarks

**Files:**
- Modify: `backend/scripts/extract_landmarks.py`

The only change is line 132: use `result.hand_world_landmarks[0]` instead of `result.hand_landmarks[0]`. World landmarks have the same `.x`, `.y`, `.z` attributes but in 3D metric space — `normalize()` works identically on them.

Also update the guard: check `result.hand_world_landmarks` instead of `result.hand_landmarks`.

- [ ] **Step 1: Update the detection check and feature extraction in process()**

In `backend/scripts/extract_landmarks.py`, find the block inside the image loop (around line 128) and replace:

```python
                if not result.hand_landmarks:
                    skipped += 1
                    continue

                features = normalize(result.hand_landmarks[0])
```

With:

```python
                if not result.hand_world_landmarks:
                    skipped += 1
                    continue

                features = normalize(result.hand_world_landmarks[0])
```

- [ ] **Step 2: Run tests to confirm normalize() still passes**

```bash
cd backend
python -m pytest tests/test_landmarks.py -v
```

Expected: 4 PASSED.

- [ ] **Step 3: Commit**

```bash
git add backend/scripts/extract_landmarks.py
git commit -m "feat: use hand_world_landmarks in extract_landmarks.py for rotation invariance"
```

---

## Task 3: Replace XGBoost with MLP and add noise augmentation

**Files:**
- Modify: `backend/scripts/train_model.py`

Replace the entire file content. Keep the same file paths, same CSV input format, same output file names (`gesture_model.pkl`, `label_encoder.pkl`) so `gesture.py` loads the new model without changes.

- [ ] **Step 1: Replace train_model.py**

Replace the full contents of `backend/scripts/train_model.py` with:

```python
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


def _augment_noise(X, y, n_copies=3, noise_std=0.02):
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

    print("Augmenting training data with Gaussian noise (3 copies, std=0.02)...")
    X_train_aug, y_train_aug = _augment_noise(X_train, y_train)
    print(f"  Augmented train size: {len(X_train_aug)}")

    print("\nTraining MLP (256→128→64→n_classes)...")
    model = MLPClassifier(
        hidden_layer_sizes=(256, 128, 64),
        activation="relu",
        solver="adam",
        max_iter=300,
        random_state=42,
        early_stopping=True,
        validation_fraction=0.1,
        n_iter_no_change=20,
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
```

- [ ] **Step 2: Install sklearn (already installed via scikit-learn) — verify**

```bash
cd backend
source venv/Scripts/activate
python -c "from sklearn.neural_network import MLPClassifier; print('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/scripts/train_model.py
git commit -m "feat: replace XGBoost with MLPClassifier and add Gaussian noise augmentation"
```

---

## Task 4: Update gesture.py inference to use world landmarks

**Files:**
- Modify: `backend/routes/gesture.py`

Use `hand_world_landmarks` for feature extraction (same `normalize()` call), keep `hand_landmarks` for the overlay coordinates returned to the mobile client.

- [ ] **Step 1: Update the predict_gesture endpoint**

In `backend/routes/gesture.py`, find the block starting at line 100 and replace:

```python
    if not result.hand_landmarks:
        # If the classifier knows "nothing", return it; otherwise 422
        if label_encoder is not None and "nothing" in label_encoder.classes_:
            return {"letter": "nothing", "confidence": 1.0, "landmarks": []}
        raise HTTPException(status_code=422, detail="No hand detected in image")

    raw_lms  = result.hand_landmarks[0]
    features = normalize(raw_lms)
    probs    = model.predict_proba(features)[0]
    pred_idx = int(np.argmax(probs))
    letter   = label_encoder.inverse_transform([pred_idx])[0]
    confidence = float(probs[pred_idx])

    # Raw landmark positions (0-1 relative to image) for client-side overlay
    landmarks = [{"x": round(lm.x, 4), "y": round(lm.y, 4)} for lm in raw_lms]
```

With:

```python
    if not result.hand_world_landmarks:
        # If the classifier knows "nothing", return it; otherwise 422
        if label_encoder is not None and "nothing" in label_encoder.classes_:
            return {"letter": "nothing", "confidence": 1.0, "landmarks": []}
        raise HTTPException(status_code=422, detail="No hand detected in image")

    world_lms = result.hand_world_landmarks[0]
    features  = normalize(world_lms)
    probs     = model.predict_proba(features)[0]
    pred_idx  = int(np.argmax(probs))
    letter    = label_encoder.inverse_transform([pred_idx])[0]
    confidence = float(probs[pred_idx])

    # Image-space landmarks (0-1) for client-side skeleton overlay
    image_lms = result.hand_landmarks[0]
    landmarks = [{"x": round(lm.x, 4), "y": round(lm.y, 4)} for lm in image_lms]
```

- [ ] **Step 2: Commit**

```bash
git add backend/routes/gesture.py
git commit -m "feat: use hand_world_landmarks for gesture classification in inference"
```

---

## Task 5: Run the full ML pipeline and verify accuracy

- [ ] **Step 1: Re-extract landmarks with world coordinates**

```bash
cd backend
source venv/Scripts/activate
python scripts/extract_landmarks.py
```

Expected: same output as before — rows per letter printed, `data/landmarks.csv` written.

- [ ] **Step 2: Retrain the MLP**

```bash
python scripts/train_model.py
```

Expected: training loss printed per iteration, then test accuracy printed. Record the accuracy number.

- [ ] **Step 3: Restart the server and smoke test**

```bash
uvicorn main:app --reload
```

Then manually test via the mobile app or curl:

```bash
curl -X POST http://localhost:8000/gesture/predict \
  -F "file=@/path/to/test_hand.jpg"
```

Expected response shape: `{"letter": "A", "confidence": 0.92, "landmarks": [...]}`

- [ ] **Step 4: Commit final state**

```bash
git add backend/data/landmarks.csv
git commit -m "chore: regenerate landmarks.csv with world coordinates"
```

---

## Completion Checklist

- [ ] `test_landmarks.py` passes (4 tests)
- [ ] `extract_landmarks.py` uses `hand_world_landmarks`
- [ ] `train_model.py` uses `MLPClassifier` with noise augmentation
- [ ] `gesture.py` uses `hand_world_landmarks` for features, `hand_landmarks` for overlay
- [ ] Test accuracy is printed after training
- [ ] Server starts without errors after retraining
- [ ] Mobile app still receives `{letter, confidence, landmarks}` unchanged
