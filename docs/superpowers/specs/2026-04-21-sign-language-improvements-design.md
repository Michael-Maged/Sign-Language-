# Sign Language Platform — Improvements Design
**Date:** 2026-04-21

## Overview

Two improvements to the existing assistive communication platform:

1. **Letter Detection Improvement** — fix random misclassifications caused by lighting/angle sensitivity by upgrading to 3D world landmarks and an MLP classifier.
2. **WLASL Word Recognition** — new screen for word-level sign recognition (WLASL-100 vocabulary) with voice output.

GUI improvements are deferred to a future phase.

---

## Feature 1: Letter Detection Improvement

### Problem

The current pipeline extracts 2D image-space landmarks (pixel coordinates normalized 0–1) via MediaPipe `HandLandmarker`. These are sensitive to camera angle and distance — the same hand shape at a different tilt produces significantly different coordinate values, causing XGBoost to misclassify despite MediaPipe detecting the hand correctly.

### Solution

Switch to MediaPipe **Holistic world landmarks** — 3D coordinates in meters, relative to the hand's own geometric center. These are perspective-corrected and scale-invariant by construction. Pair with a small MLP that generalizes better than XGBoost on continuous geometric features.

### Changes

| Dimension | Current | New |
|---|---|---|
| Feature source | `HandLandmarker` 2D image coords | `Holistic` 3D world coords |
| Feature size | 42 values (21 × xy) | 63 values (21 × xyz) |
| Augmentation | None | ±2% Gaussian noise + random ±15° wrist rotation during training |
| Model | XGBoost | scikit-learn `MLPClassifier` (256 → 128 → 64 → 26) |
| Normalization | Subtract wrist (landmark 0), divide by ‖landmark 9‖ | Same contract, now in 3D |

### Normalization Contract

Both `extract_landmarks.py` (training) and `gesture.py` (inference) must use the identical `normalize()` function:
- Subtract wrist position (landmark 0) → wrist-relative 3D coords
- Divide by `‖landmark 9‖` (wrist→middle-MCP distance) → scale-invariant

### Files Touched

- `backend/scripts/extract_landmarks.py` — switch to Holistic, extract world landmarks
- `backend/scripts/train_model.py` — replace XGBoost with MLPClassifier, add augmentation
- `backend/routes/gesture.py` — update inference to use Holistic world landmarks

### What Does NOT Change

- Mobile app (zero changes)
- API contract: `POST /gesture/predict` still returns `{letter, confidence, landmarks[]}`
- Landmark overlay drawing on GestureScreen
- `models/gesture_model.pkl` and `models/label_encoder.pkl` file names

### Validation

- `train_model.py` prints test-set accuracy — compare before/after
- Manual smoke test: hold up all 26 letters in varied lighting conditions

---

## Feature 2: WLASL Word Recognition

### Scope

WLASL-100: the 100 most frequent words in the WLASL dataset. Expected accuracy ~94%. Architecture scales to WLASL-300 in a future training run without code changes.

### ML Pipeline

| Step | Detail |
|---|---|
| Feature extraction | MediaPipe Holistic per video frame → pose (33×3) + left hand (21×3) + right hand (21×3) = **225 features/frame** |
| Sequence length | Fixed 30 frames — pad with zeros if shorter, take first 30 if longer |
| Model | Keras LSTM: 225 → LSTM(128) → LSTM(64) → Dense(100, softmax) |
| Training data | `data/wlasl_landmarks.npy` shape `(N, 30, 225)` + `data/wlasl_labels.npy` |
| Output models | `models/wlasl_model.keras` + `models/wlasl_encoder.pkl` |

### New Backend Scripts (run in order)

1. `backend/scripts/extract_wlasl_landmarks.py`
   - Iterates WLASL-100 video files
   - Extracts per-frame Holistic landmarks, pads/trims to 30 frames
   - Saves `data/wlasl_landmarks.npy` and `data/wlasl_labels.npy`

2. `backend/scripts/train_wlasl_model.py`
   - Loads numpy arrays, trains LSTM model
   - Saves `models/wlasl_model.keras` and `models/wlasl_encoder.pkl`
   - Prints test-set accuracy

### New Backend Route

`POST /wlasl/predict`
- Receives up to 30 JPEG frames as multipart form fields
- Runs Holistic on each frame, pads/trims sequence to 30
- Feeds sequence to LSTM
- Returns `{ word: string, confidence: float }`
- Returns 503 if model files are missing at startup (mirrors `gesture.py` pattern)

New file: `backend/routes/wlasl.py`
Registered in: `backend/main.py`

### Mobile — WLASLScreen

**Recording flow:**
1. User taps "Record" — app captures 30 frames at ~15fps over 2 seconds using `CameraView.takePictureAsync()`
2. Frames sent to `POST /wlasl/predict`
3. On response: recognized word displayed + appended to sentence
4. Voice output: `expo-speech` → `Speech.speak(word)` called on successful prediction
5. Confidence < 60%: word shown as "uncertain", user taps to confirm before appending

**New mobile files:**
- `mobile/src/screens/WLASLScreen.tsx`
- `mobile/src/services/WLASLService.ts`

**Modified mobile files:**
- `mobile/App.tsx` — adds "Words" as third tab

### Error Handling

| Scenario | Behavior |
|---|---|
| No hand detected in a frame | That frame is zero-padded in the sequence |
| WLASL model missing at startup | Router returns 503 `"WLASL model not loaded"` |
| Confidence < 60% | Response returned normally; mobile marks as uncertain |
| `expo-speech` unavailable | TTS silently skipped; word still displays |

### Validation

- Smoke test with 10 most common words before full evaluation
- `train_wlasl_model.py` prints test-set accuracy

---

## Dependencies

New Python packages (backend):
- `tensorflow` or `tensorflow-cpu` (Keras LSTM)

New JS packages (mobile):
- `expo-speech`

No changes to existing package versions.

---

## Implementation Order

1. Feature 1 (letter detection) — backend only, no mobile changes, self-contained
2. Feature 2 (WLASL) — backend scripts → backend route → mobile screen
