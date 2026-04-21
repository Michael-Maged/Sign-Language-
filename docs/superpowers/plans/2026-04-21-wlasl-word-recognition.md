# WLASL Word Recognition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Words" tab to the mobile app where users sign a word in front of the camera and the app recognizes it from WLASL-100 vocabulary and speaks it aloud.

**Architecture:** Backend ML pipeline: MediaPipe Holistic extracts per-frame features (pose 33×3 + left hand 21×3 + right hand 21×3 = 225 features) from WLASL videos → sequences padded/trimmed to 30 frames → Keras LSTM trained on WLASL-100 → `POST /wlasl/predict` endpoint. Mobile: CameraView captures 30 frames over 2 seconds → sent to backend → word displayed + spoken via `expo-speech`.

**Tech Stack:** Python, MediaPipe Solutions (Holistic), TensorFlow/Keras, OpenCV, numpy; React Native, Expo, expo-speech, expo-camera

---

## Dataset Assumptions

The WLASL Kaggle dataset has this structure:

```
wlasl_dataset/
  WLASL_v0.3.json       # metadata: gloss → instances
  videos/
    00000.mp4
    00001.mp4
    ...
```

`WLASL_v0.3.json` structure:
```json
[
  {
    "gloss": "book",
    "instances": [
      { "video_id": "66666", "split": "train", "frame_start": 1, "frame_end": 22 },
      ...
    ]
  },
  ...
]
```

Set `WLASL_DIR` in `extract_wlasl_landmarks.py` to the path where you extracted the dataset.

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `backend/scripts/extract_wlasl_landmarks.py` | Videos → per-frame Holistic features → numpy arrays |
| Create | `backend/scripts/train_wlasl_model.py` | numpy arrays → LSTM model |
| Create | `backend/routes/wlasl.py` | `POST /wlasl/predict` endpoint |
| Modify | `backend/main.py` | Register wlasl router |
| Create | `backend/tests/test_wlasl_utils.py` | Unit tests for sequence padding |
| Create | `mobile/src/services/WLASLService.ts` | Frame capture + API call |
| Create | `mobile/src/screens/WLASLScreen.tsx` | "Words" tab UI |
| Modify | `mobile/App.tsx` | Add third tab |

---

## Task 1: Install backend dependency

**Files:** none (environment setup)

- [ ] **Step 1: Install TensorFlow**

```bash
cd backend
source venv/Scripts/activate
pip install tensorflow
```

If on a machine without a GPU and training speed matters, use `tensorflow-cpu` instead:

```bash
pip install tensorflow-cpu
```

- [ ] **Step 2: Verify import**

```bash
python -c "import tensorflow as tf; print(tf.__version__)"
```

Expected: version string printed (e.g., `2.15.0`), no errors.

- [ ] **Step 3: Commit requirements note**

There is no `requirements.txt` with pinned versions in this project — skip this step if that remains true. If a `requirements.txt` exists, add `tensorflow` to it:

```bash
echo "tensorflow" >> backend/requirements.txt
git add backend/requirements.txt
git commit -m "chore: add tensorflow dependency for WLASL LSTM model"
```

---

## Task 2: Create extract_wlasl_landmarks.py

**Files:**
- Create: `backend/scripts/extract_wlasl_landmarks.py`

Reads WLASL_v0.3.json, selects the top 100 glosses by training instance count, extracts per-frame Holistic landmarks from each video, pads/trims to 30 frames, saves numpy arrays.

- [ ] **Step 1: Write the script**

Create `backend/scripts/extract_wlasl_landmarks.py`:

```python
"""
WLASL Step 1 — Extract MediaPipe Holistic landmarks from WLASL video files.

Produces:
  data/wlasl_landmarks.npy   shape: (N, 30, 225)
  data/wlasl_labels.npy      shape: (N,)  dtype: str

Set WLASL_DIR to the folder containing WLASL_v0.3.json and videos/.

Run from backend/:
    python scripts/extract_wlasl_landmarks.py
"""

import os
import json
import cv2
import numpy as np
import mediapipe as mp

SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)

# ── Configure these paths ────────────────────────────────────────────────────
WLASL_DIR   = os.path.join(BACKEND_DIR, "data", "wlasl_dataset")  # change if needed
JSON_PATH   = os.path.join(WLASL_DIR, "WLASL_v0.3.json")
VIDEO_DIR   = os.path.join(WLASL_DIR, "videos")
OUT_LMS     = os.path.join(BACKEND_DIR, "data", "wlasl_landmarks.npy")
OUT_LABELS  = os.path.join(BACKEND_DIR, "data", "wlasl_labels.npy")

N_WORDS     = 100   # top-N glosses by training instance count
SEQ_LEN     = 30    # fixed sequence length (frames)
N_FEATURES  = 225   # 33 pose × 3 + 21 left_hand × 3 + 21 right_hand × 3


def _extract_frame_features(results) -> np.ndarray:
    """Flatten Holistic results for one frame into a 225-dim vector."""
    def _lms_to_array(landmark_list, n):
        if landmark_list is None:
            return np.zeros(n * 3, dtype=np.float32)
        return np.array(
            [[lm.x, lm.y, lm.z] for lm in landmark_list.landmark],
            dtype=np.float32
        ).flatten()

    pose  = _lms_to_array(results.pose_landmarks, 33)       # 99
    left  = _lms_to_array(results.left_hand_landmarks, 21)  # 63
    right = _lms_to_array(results.right_hand_landmarks, 21) # 63
    return np.concatenate([pose, left, right])               # 225


def _video_to_sequence(video_path: str, frame_start: int, frame_end: int,
                        holistic) -> np.ndarray:
    """Extract a fixed-length (SEQ_LEN, 225) array from a video clip."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return None

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    f_start = max(0, frame_start - 1)
    f_end   = min(total_frames - 1, frame_end - 1) if frame_end > 0 else total_frames - 1

    cap.set(cv2.CAP_PROP_POS_FRAMES, f_start)
    frames = []
    for _ in range(f_end - f_start + 1):
        ret, frame = cap.read()
        if not ret:
            break
        frames.append(frame)
    cap.release()

    if not frames:
        return None

    # Sample SEQ_LEN frames uniformly from the clip
    indices = np.linspace(0, len(frames) - 1, SEQ_LEN, dtype=int)
    sequence = np.zeros((SEQ_LEN, N_FEATURES), dtype=np.float32)

    for seq_idx, frame_idx in enumerate(indices):
        rgb = cv2.cvtColor(frames[frame_idx], cv2.COLOR_BGR2RGB)
        results = holistic.process(rgb)
        sequence[seq_idx] = _extract_frame_features(results)

    return sequence


def process():
    if not os.path.exists(JSON_PATH):
        print(f"WLASL JSON not found at {JSON_PATH}")
        print("Set WLASL_DIR to your dataset folder.")
        return

    with open(JSON_PATH) as f:
        data = json.load(f)

    # Count training instances per gloss, pick top N_WORDS
    gloss_counts = {}
    for entry in data:
        gloss = entry["gloss"]
        train_count = sum(1 for inst in entry["instances"] if inst["split"] == "train")
        gloss_counts[gloss] = train_count

    top_glosses = sorted(gloss_counts, key=gloss_counts.get, reverse=True)[:N_WORDS]
    gloss_set = set(top_glosses)
    print(f"Top {N_WORDS} glosses selected. Least common: '{top_glosses[-1]}' ({gloss_counts[top_glosses[-1]]} train samples)")

    all_sequences = []
    all_labels    = []
    skipped       = 0

    mp_holistic = mp.solutions.holistic
    with mp_holistic.Holistic(
        static_image_mode=False,
        model_complexity=1,
        min_detection_confidence=0.3,
        min_tracking_confidence=0.3,
    ) as holistic:

        for entry in data:
            gloss = entry["gloss"]
            if gloss not in gloss_set:
                continue

            count = 0
            for inst in entry["instances"]:
                if inst["split"] != "train":
                    continue
                video_id    = inst["video_id"]
                frame_start = inst.get("frame_start", 1)
                frame_end   = inst.get("frame_end", -1)
                video_path  = os.path.join(VIDEO_DIR, f"{video_id}.mp4")

                if not os.path.exists(video_path):
                    skipped += 1
                    continue

                seq = _video_to_sequence(video_path, frame_start, frame_end, holistic)
                if seq is None:
                    skipped += 1
                    continue

                all_sequences.append(seq)
                all_labels.append(gloss)
                count += 1

            print(f"  {gloss}: {count} sequences")

    if not all_sequences:
        print("No sequences extracted. Check WLASL_DIR and video files.")
        return

    X = np.stack(all_sequences)           # (N, 30, 225)
    y = np.array(all_labels)              # (N,)

    os.makedirs(os.path.dirname(OUT_LMS), exist_ok=True)
    np.save(OUT_LMS,    X)
    np.save(OUT_LABELS, y)
    print(f"\nSaved {len(X)} sequences to {OUT_LMS}")
    print(f"Saved labels to {OUT_LABELS}")
    print(f"Skipped {skipped} videos (missing or unreadable)")


if __name__ == "__main__":
    process()
```

- [ ] **Step 2: Verify the script imports cleanly**

```bash
cd backend
source venv/Scripts/activate
python -c "import scripts.extract_wlasl_landmarks; print('imports OK')"
```

Expected: `imports OK`

- [ ] **Step 3: Commit**

```bash
git add backend/scripts/extract_wlasl_landmarks.py
git commit -m "feat: add extract_wlasl_landmarks.py for WLASL video processing"
```

---

## Task 3: Create train_wlasl_model.py

**Files:**
- Create: `backend/scripts/train_wlasl_model.py`

- [ ] **Step 1: Write the script**

Create `backend/scripts/train_wlasl_model.py`:

```python
"""
WLASL Step 2 — Train LSTM classifier on extracted landmark sequences.

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
        print("wlasl_landmarks.npy not found — run extract_wlasl_landmarks.py first.")
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
```

- [ ] **Step 2: Verify imports**

```bash
cd backend
python -c "import scripts.train_wlasl_model; print('imports OK')"
```

Expected: `imports OK`

- [ ] **Step 3: Commit**

```bash
git add backend/scripts/train_wlasl_model.py
git commit -m "feat: add train_wlasl_model.py — LSTM on WLASL-100 landmark sequences"
```

---

## Task 4: Create the wlasl route

**Files:**
- Create: `backend/routes/wlasl.py`
- Create: `backend/tests/test_wlasl_utils.py`

- [ ] **Step 1: Write a test for sequence padding**

Create `backend/tests/test_wlasl_utils.py`:

```python
import numpy as np
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


def _pad_or_trim(seq: np.ndarray, seq_len: int = 30) -> np.ndarray:
    """Take first seq_len frames; zero-pad if shorter."""
    n = len(seq)
    if n >= seq_len:
        return seq[:seq_len]
    pad = np.zeros((seq_len - n, seq[0].shape[0]), dtype=np.float32)
    return np.vstack([seq, pad])


def test_trim_long_sequence():
    seq = np.ones((40, 225), dtype=np.float32)
    result = _pad_or_trim(seq)
    assert result.shape == (30, 225)
    assert np.all(result == 1.0)


def test_pad_short_sequence():
    seq = np.ones((10, 225), dtype=np.float32)
    result = _pad_or_trim(seq)
    assert result.shape == (30, 225)
    assert np.all(result[:10] == 1.0)
    assert np.all(result[10:] == 0.0)


def test_exact_length_unchanged():
    seq = np.ones((30, 225), dtype=np.float32) * 3.0
    result = _pad_or_trim(seq)
    assert result.shape == (30, 225)
    assert np.all(result == 3.0)
```

- [ ] **Step 2: Run tests — expect PASS**

```bash
cd backend
python -m pytest tests/test_wlasl_utils.py -v
```

Expected: 3 PASSED.

- [ ] **Step 3: Write the wlasl route**

Create `backend/routes/wlasl.py`:

```python
import io
import os
import cv2
import joblib
import numpy as np
import mediapipe as mp
import tensorflow as tf
from PIL import Image as PILImage, ImageOps
from fastapi import APIRouter, UploadFile, HTTPException
from typing import List

router = APIRouter()

MODELS_DIR   = "models"
MODEL_PATH   = os.path.join(MODELS_DIR, "wlasl_model.keras")
ENCODER_PATH = os.path.join(MODELS_DIR, "wlasl_encoder.pkl")

SEQ_LEN     = 30
N_FEATURES  = 225


def _load_wlasl_model():
    if os.path.exists(MODEL_PATH) and os.path.exists(ENCODER_PATH):
        return tf.keras.models.load_model(MODEL_PATH), joblib.load(ENCODER_PATH)
    return None, None


wlasl_model, wlasl_encoder = _load_wlasl_model()

_mp_holistic = mp.solutions.holistic
_holistic = _mp_holistic.Holistic(
    static_image_mode=True,
    model_complexity=1,
    min_detection_confidence=0.3,
    min_tracking_confidence=0.3,
)


def _decode_image(contents: bytes) -> np.ndarray:
    """Decode image bytes → RGB numpy array, honouring EXIF rotation."""
    try:
        pil_img = PILImage.open(io.BytesIO(contents))
        pil_img = ImageOps.exif_transpose(pil_img)
        return np.array(pil_img.convert("RGB"))
    except Exception:
        img = cv2.imdecode(np.frombuffer(contents, np.uint8), cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Invalid image")
        return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)


def _frame_to_features(rgb: np.ndarray) -> np.ndarray:
    """Extract 225-dim feature vector from one RGB frame via Holistic."""
    results = _holistic.process(rgb)

    def _lms(landmark_list, n):
        if landmark_list is None:
            return np.zeros(n * 3, dtype=np.float32)
        return np.array(
            [[lm.x, lm.y, lm.z] for lm in landmark_list.landmark],
            dtype=np.float32,
        ).flatten()

    pose  = _lms(results.pose_landmarks, 33)
    left  = _lms(results.left_hand_landmarks, 21)
    right = _lms(results.right_hand_landmarks, 21)
    return np.concatenate([pose, left, right])


def _pad_or_trim(seq: np.ndarray) -> np.ndarray:
    """Return array of shape (SEQ_LEN, N_FEATURES)."""
    n = len(seq)
    if n >= SEQ_LEN:
        return seq[:SEQ_LEN]
    pad = np.zeros((SEQ_LEN - n, N_FEATURES), dtype=np.float32)
    return np.vstack([seq, pad])


@router.post("/wlasl/predict")
async def predict_word(frames: List[UploadFile]):
    if wlasl_model is None:
        raise HTTPException(status_code=503, detail="WLASL model not loaded — run scripts/train_wlasl_model.py first.")

    if not frames:
        raise HTTPException(status_code=400, detail="No frames provided.")

    sequence = []
    for frame_file in frames:
        contents = await frame_file.read()
        try:
            rgb = _decode_image(contents)
        except ValueError:
            sequence.append(np.zeros(N_FEATURES, dtype=np.float32))
            continue
        sequence.append(_frame_to_features(rgb))

    seq_array = _pad_or_trim(np.array(sequence, dtype=np.float32))
    inp = seq_array[np.newaxis, ...]   # (1, 30, 225)

    probs    = wlasl_model.predict(inp, verbose=0)[0]
    pred_idx = int(np.argmax(probs))
    word     = wlasl_encoder.inverse_transform([pred_idx])[0]
    confidence = float(probs[pred_idx])

    return {"word": word, "confidence": round(confidence, 4)}
```

- [ ] **Step 4: Run tests again to confirm they still pass**

```bash
python -m pytest tests/ -v
```

Expected: 7 PASSED (4 from test_landmarks.py + 3 from test_wlasl_utils.py).

- [ ] **Step 5: Commit**

```bash
git add backend/routes/wlasl.py backend/tests/test_wlasl_utils.py
git commit -m "feat: add /wlasl/predict endpoint with Holistic + LSTM inference"
```

---

## Task 5: Register the wlasl router in main.py

**Files:**
- Modify: `backend/main.py`

- [ ] **Step 1: Add the import and router registration**

In `backend/main.py`, change:

```python
from routes import speech, sign, media, gesture
```

to:

```python
from routes import speech, sign, media, gesture, wlasl
```

And after `app.include_router(gesture.router)`, add:

```python
app.include_router(wlasl.router)
```

- [ ] **Step 2: Verify the server starts**

```bash
cd backend
source venv/Scripts/activate
uvicorn main:app --reload
```

Expected: server starts, no import errors. Visit `http://localhost:8000/docs` — you should see `/wlasl/predict` listed.

- [ ] **Step 3: Commit**

```bash
git add backend/main.py
git commit -m "feat: register wlasl router in FastAPI app"
```

---

## Task 6: Install expo-speech in the mobile app

**Files:** none (environment setup)

- [ ] **Step 1: Install the package**

```bash
cd mobile
npx expo install expo-speech
```

- [ ] **Step 2: Verify import**

```bash
node -e "require('./node_modules/expo-speech'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit lock file**

```bash
git add mobile/package.json mobile/package-lock.json
git commit -m "chore: add expo-speech for WLASL voice output"
```

---

## Task 7: Create WLASLService.ts

**Files:**
- Create: `mobile/src/services/WLASLService.ts`

- [ ] **Step 1: Write the service**

Create `mobile/src/services/WLASLService.ts`:

```typescript
import { BASE_URL } from "../config";

export interface WLASLPrediction {
  word: string;
  confidence: number;
}

export async function predictWord(frameUris: string[]): Promise<WLASLPrediction> {
  const formData = new FormData();
  frameUris.forEach((uri, i) => {
    formData.append("frames", {
      uri,
      type: "image/jpeg",
      name: `frame_${i}.jpg`,
    } as any);
  });

  const response = await fetch(`${BASE_URL}/wlasl/predict`, {
    method: "POST",
    body: formData,
  });

  if (response.status === 503) throw new Error("WLASL model not ready — run train_wlasl_model.py first");
  if (response.status === 400) throw new Error("No frames received by server");
  if (!response.ok)            throw new Error("Server error");

  return response.json() as Promise<WLASLPrediction>;
}
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/services/WLASLService.ts
git commit -m "feat: add WLASLService for frame capture and word prediction"
```

---

## Task 8: Create WLASLScreen.tsx

**Files:**
- Create: `mobile/src/screens/WLASLScreen.tsx`

- [ ] **Step 1: Write the screen**

Create `mobile/src/screens/WLASLScreen.tsx`:

```tsx
import React, { useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Speech from "expo-speech";
import { predictWord, WLASLPrediction } from "../services/WLASLService";

const FRAMES_COUNT   = 30;
const FRAME_INTERVAL = 67;   // ms — ~15 fps
const MIN_CONFIDENCE = 0.6;

export default function WLASLScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [recording, setRecording]       = useState(false);
  const [progress, setProgress]         = useState(0);          // 0–30
  const [prediction, setPrediction]     = useState<WLASLPrediction | null>(null);
  const [error, setError]               = useState("");
  const [sentence, setSentence]         = useState<string[]>([]);

  const cameraRef   = useRef<CameraView>(null);
  const sentenceRef = useRef<ScrollView>(null);

  async function handleRecord() {
    if (recording || !cameraRef.current) return;
    setRecording(true);
    setProgress(0);
    setPrediction(null);
    setError("");

    const uris: string[] = [];
    try {
      for (let i = 0; i < FRAMES_COUNT; i++) {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
        if (photo) uris.push(photo.uri);
        setProgress(i + 1);
        await new Promise<void>((r) => setTimeout(r, FRAME_INTERVAL));
      }
      const result = await predictWord(uris);
      setPrediction(result);
      if (result.confidence >= MIN_CONFIDENCE) {
        try { Speech.speak(result.word); } catch {}
      }
    } catch (e: any) {
      setError(e.message ?? "Unknown error");
    } finally {
      setRecording(false);
      setProgress(0);
    }
  }

  function addWord() {
    if (!prediction || prediction.confidence < MIN_CONFIDENCE) return;
    setSentence((prev) => {
      const next = [...prev, prediction.word];
      setTimeout(() => sentenceRef.current?.scrollToEnd({ animated: true }), 50);
      return next;
    });
  }

  function deleteWord()   { setSentence((s) => s.slice(0, -1)); }
  function clearSentence() { setSentence([]); }

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera access is needed to detect hand signs.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const canAdd = !!prediction && prediction.confidence >= MIN_CONFIDENCE;
  const confColor =
    !prediction                  ? "#94A3B8" :
    prediction.confidence >= 0.8 ? "#4ADE80" :
    prediction.confidence >= 0.6 ? "#FACC15" : "#F87171";

  return (
    <View style={styles.container}>
      {/* Sentence strip */}
      <SafeAreaView edges={["top"]} style={styles.sentenceBar}>
        <ScrollView
          ref={sentenceRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sentenceScroll}
        >
          {sentence.length === 0
            ? <Text style={styles.sentencePlaceholder}>Sign a word → tap Add ✓</Text>
            : sentence.map((w, i) => (
                <View key={i} style={styles.wordChip}>
                  <Text style={styles.wordChipText}>{w}</Text>
                </View>
              ))
          }
        </ScrollView>
      </SafeAreaView>

      {/* Camera */}
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="front" />

        {/* Progress bar during recording */}
        {recording && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(progress / FRAMES_COUNT) * 100}%` as any }]} />
          </View>
        )}
      </View>

      {/* Bottom panel */}
      <View style={styles.bottomPanel}>
        {!!error && (
          <View style={styles.errorRow}>
            <Text style={styles.errorText}>⚠ {error}</Text>
          </View>
        )}

        {/* Prediction display */}
        <View style={styles.predictionRow}>
          {recording ? (
            <View style={styles.recordingRow}>
              <ActivityIndicator color="#2196F3" />
              <Text style={styles.recordingText}>Capturing… {progress}/{FRAMES_COUNT}</Text>
            </View>
          ) : prediction ? (
            <>
              <Text style={[styles.bigWord, { color: confColor }]}>{prediction.word}</Text>
              <Text style={styles.confLabel}>{Math.round(prediction.confidence * 100)}%</Text>
            </>
          ) : (
            <Text style={styles.hintText}>Tap Record and sign a word</Text>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.btnSecondary, sentence.length === 0 && styles.btnDisabled]}
            onPress={deleteWord} disabled={sentence.length === 0}
          >
            <Text style={styles.btnSecondaryText}>⌫</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnRecord, recording && styles.btnDisabled]}
            onPress={handleRecord} disabled={recording}
          >
            <Text style={styles.btnRecordText}>{recording ? "Recording…" : "Record"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnPrimary, !canAdd && styles.btnDisabled]}
            onPress={addWord} disabled={!canAdd}
          >
            <Text style={styles.btnPrimaryText}>Add ✓</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnSecondary, sentence.length === 0 && styles.btnDisabled]}
            onPress={clearSentence} disabled={sentence.length === 0}
          >
            <Text style={styles.btnSecondaryText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: "#fff" },
  permissionContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  permissionText:      { fontSize: 16, textAlign: "center", marginBottom: 16, color: "#374151" },
  permissionButton:    { backgroundColor: "#2196F3", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  permissionButtonText:{ color: "#fff", fontWeight: "600" },
  sentenceBar:         { backgroundColor: "#F9FAFB", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E5E7EB" },
  sentenceScroll:      { paddingHorizontal: 12, paddingVertical: 8, alignItems: "center", minHeight: 44 },
  sentencePlaceholder: { color: "#9CA3AF", fontSize: 14, fontStyle: "italic" },
  wordChip:            { backgroundColor: "#EFF6FF", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6 },
  wordChipText:        { color: "#1D4ED8", fontWeight: "600", fontSize: 14 },
  cameraContainer:     { flex: 1, position: "relative", overflow: "hidden" },
  progressBar:         { position: "absolute", bottom: 0, left: 0, right: 0, height: 4, backgroundColor: "#E5E7EB" },
  progressFill:        { height: 4, backgroundColor: "#2196F3" },
  bottomPanel:         { backgroundColor: "#fff", paddingBottom: 8 },
  errorRow:            { paddingHorizontal: 16, paddingTop: 8 },
  errorText:           { color: "#EF4444", fontSize: 13 },
  predictionRow:       { alignItems: "center", paddingVertical: 12, minHeight: 72 },
  recordingRow:        { flexDirection: "row", alignItems: "center", gap: 8 },
  recordingText:       { color: "#2196F3", fontSize: 14 },
  bigWord:             { fontSize: 36, fontWeight: "700", letterSpacing: 1 },
  confLabel:           { fontSize: 13, color: "#6B7280", marginTop: 2 },
  hintText:            { color: "#9CA3AF", fontSize: 14, fontStyle: "italic" },
  controls:            { flexDirection: "row", paddingHorizontal: 16, gap: 8, paddingBottom: 4 },
  btnRecord:           { flex: 2, backgroundColor: "#2196F3", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  btnRecordText:       { color: "#fff", fontWeight: "700", fontSize: 15 },
  btnPrimary:          { flex: 1, backgroundColor: "#10B981", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  btnPrimaryText:      { color: "#fff", fontWeight: "700", fontSize: 15 },
  btnSecondary:        { flex: 1, backgroundColor: "#F3F4F6", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  btnSecondaryText:    { color: "#374151", fontWeight: "600", fontSize: 15 },
  btnDisabled:         { opacity: 0.4 },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/screens/WLASLScreen.tsx
git commit -m "feat: add WLASLScreen with frame capture, word prediction, and TTS"
```

---

## Task 9: Add Words tab to App.tsx

**Files:**
- Modify: `mobile/App.tsx`

- [ ] **Step 1: Update App.tsx**

Replace the full contents of `mobile/App.tsx` with:

```tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import HomeScreen    from "./src/screens/HomeScreen";
import GestureScreen from "./src/screens/GestureScreen";
import WLASLScreen   from "./src/screens/WLASLScreen";

type Tab = "speech" | "gesture" | "wlasl";

export default function App() {
  const [tab, setTab] = useState<Tab>("speech");

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <View style={styles.root}>
        <View style={styles.content}>
          {tab === "speech"   && <HomeScreen />}
          {tab === "gesture"  && <GestureScreen />}
          {tab === "wlasl"    && <WLASLScreen />}
        </View>
        <SafeAreaView edges={["bottom"]} style={styles.tabBar}>
          <TabItem icon="🎙" label="Speech"  active={tab === "speech"}  onPress={() => setTab("speech")} />
          <TabItem icon="✋" label="Letters" active={tab === "gesture"} onPress={() => setTab("gesture")} />
          <TabItem icon="🤟" label="Words"   active={tab === "wlasl"}   onPress={() => setTab("wlasl")} />
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

function TabItem({
  icon, label, active, onPress,
}: {
  icon: string; label: string; active: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress}>
      {active && <View style={styles.tabIndicator} />}
      <Text style={styles.tabIcon}>{icon}</Text>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: "#fff" },
  content:        { flex: 1 },
  tabBar:         { flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#D1D5DB", backgroundColor: "#fff" },
  tabItem:        { flex: 1, alignItems: "center", paddingTop: 10, paddingBottom: 6 },
  tabIndicator:   { position: "absolute", top: 0, width: 36, height: 3, borderRadius: 2, backgroundColor: "#2196F3" },
  tabIcon:        { fontSize: 22 },
  tabLabel:       { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  tabLabelActive: { color: "#2196F3", fontWeight: "600" },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/App.tsx
git commit -m "feat: add Words tab for WLASL word recognition"
```

---

## Task 10: Run the full WLASL ML pipeline

Run these steps only after you have downloaded the WLASL dataset from Kaggle and set `WLASL_DIR` in `extract_wlasl_landmarks.py`.

- [ ] **Step 1: Set your dataset path**

Edit `backend/scripts/extract_wlasl_landmarks.py` line:
```python
WLASL_DIR = os.path.join(BACKEND_DIR, "data", "wlasl_dataset")
```
Change `"wlasl_dataset"` to the actual folder name where you extracted the Kaggle dataset.

- [ ] **Step 2: Extract landmarks (takes 30–90 minutes depending on machine)**

```bash
cd backend
source venv/Scripts/activate
python scripts/extract_wlasl_landmarks.py
```

Expected: one line per gloss printed with sequence count, then:
```
Saved N sequences to .../data/wlasl_landmarks.npy
Saved labels to .../data/wlasl_labels.npy
```

- [ ] **Step 3: Train the LSTM**

```bash
python scripts/train_wlasl_model.py
```

Expected: Keras training output per epoch, then:
```
Test accuracy: 0.XXXX (XX.X%)
Model saved to models/wlasl_model.keras
Encoder saved to models/wlasl_encoder.pkl
```

- [ ] **Step 4: Restart the backend and verify the endpoint**

```bash
uvicorn main:app --reload
```

In another terminal:
```bash
curl -X POST http://localhost:8000/wlasl/predict \
  -F "frames=@/path/to/frame1.jpg" \
  -F "frames=@/path/to/frame2.jpg"
```

Expected: `{"word": "...", "confidence": 0.XXXX}`

---

## Completion Checklist

- [ ] `test_wlasl_utils.py` passes (3 tests)
- [ ] `extract_wlasl_landmarks.py` produces `wlasl_landmarks.npy` and `wlasl_labels.npy`
- [ ] `train_wlasl_model.py` trains and saves `wlasl_model.keras` and `wlasl_encoder.pkl`
- [ ] `POST /wlasl/predict` returns `{word, confidence}`
- [ ] Server returns 503 if model files are missing
- [ ] `WLASLScreen.tsx` records 30 frames, sends to backend, displays word
- [ ] `expo-speech` speaks the word when confidence ≥ 60%
- [ ] "Words" tab appears in the app tab bar
- [ ] Existing Speech and Letters tabs are unaffected
