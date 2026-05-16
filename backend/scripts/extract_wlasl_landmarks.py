"""
WLASL Step 1 -- Extract MediaPipe hand landmarks from WLASL video files.

Uses HandLandmarker (Tasks API) to extract left + right hand landmarks.

Produces:
  data/wlasl_landmarks.npy   shape: (N, 30, 126)
  data/wlasl_labels.npy      shape: (N,)  dtype: str

  Features per frame: 21 left-hand landmarks x3 + 21 right-hand landmarks x3 = 126

Set WLASL_DIR to the folder containing WLASL_v0.3.json and videos/.

Run from backend/:
    python scripts/extract_wlasl_landmarks.py
"""

import os
import json
import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision

SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)

# ── Configure these paths ────────────────────────────────────────────────────
DATASET_DIR      = os.path.join(BACKEND_DIR, "data", "words", "msasl")
JSON_PATH        = os.path.join(DATASET_DIR, "MSASL_train.json")
VIDEO_DIR        = os.path.join(DATASET_DIR, "videos")
HAND_MODEL_PATH  = os.path.join(BACKEND_DIR, "models", "hand_landmarker.task")
OUT_LMS          = os.path.join(BACKEND_DIR, "data", "words", "landmarks.npy")
OUT_LABELS       = os.path.join(BACKEND_DIR, "data", "words", "labels.npy")

N_WORDS     = 100   # top-N glosses by training instance count
SEQ_LEN     = 30    # fixed sequence length (frames)
N_FEATURES  = 126   # 21 left_hand x3 + 21 right_hand x3


def _make_detector():
    options = mp_vision.HandLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path=HAND_MODEL_PATH),
        num_hands=2,
        min_hand_detection_confidence=0.3,
        min_hand_presence_confidence=0.3,
        min_tracking_confidence=0.3,
        running_mode=mp_vision.RunningMode.IMAGE,
    )
    return mp_vision.HandLandmarker.create_from_options(options)


def _extract_frame_features(detection_result) -> np.ndarray:
    """Flatten HandLandmarker result into a 126-dim vector (left + right hand)."""
    left  = np.zeros(63, dtype=np.float32)
    right = np.zeros(63, dtype=np.float32)

    for i, handedness in enumerate(detection_result.handedness):
        label = handedness[0].category_name.lower()
        lms = detection_result.hand_landmarks[i]
        arr = np.array([[lm.x, lm.y, lm.z] for lm in lms], dtype=np.float32).flatten()
        if label == "left":
            left = arr
        else:
            right = arr

    return np.concatenate([left, right])   # 126


def _video_to_sequence(video_path: str, frame_start: int, frame_end: int,
                        detector) -> np.ndarray:
    """Extract a (SEQ_LEN, 126) array from a video clip."""
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

    indices  = np.linspace(0, len(frames) - 1, SEQ_LEN, dtype=int)
    sequence = np.zeros((SEQ_LEN, N_FEATURES), dtype=np.float32)

    for seq_idx, frame_idx in enumerate(indices):
        rgb      = cv2.cvtColor(frames[frame_idx], cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result   = detector.detect(mp_image)
        sequence[seq_idx] = _extract_frame_features(result)

    return sequence


def process():
    if not os.path.exists(JSON_PATH):
        print(f"WLASL JSON not found at {JSON_PATH}")
        print("Set WLASL_DIR to your dataset folder.")
        return

    if not os.path.exists(HAND_MODEL_PATH):
        print(f"hand_landmarker.task not found at {HAND_MODEL_PATH}")
        return

    with open(JSON_PATH) as f:
        data = json.load(f)

    gloss_counts = {}
    for entry in data:
        gloss = entry["gloss"]
        train_count = sum(1 for inst in entry["instances"] if inst["split"] == "train")
        gloss_counts[gloss] = train_count

    top_glosses = sorted(gloss_counts, key=gloss_counts.get, reverse=True)[:N_WORDS]
    gloss_set   = set(top_glosses)
    print(f"Top {N_WORDS} glosses selected. Least common: '{top_glosses[-1]}' ({gloss_counts[top_glosses[-1]]} train samples)")

    all_sequences = []
    all_labels    = []
    skipped       = 0

    with _make_detector() as detector:
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

                seq = _video_to_sequence(video_path, frame_start, frame_end, detector)
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

    X = np.stack(all_sequences)
    y = np.array(all_labels)

    os.makedirs(os.path.dirname(OUT_LMS), exist_ok=True)
    np.save(OUT_LMS,    X)
    np.save(OUT_LABELS, y)
    print(f"\nSaved {len(X)} sequences to {OUT_LMS}")
    print(f"Saved labels to {OUT_LABELS}")
    print(f"Skipped {skipped} videos (missing or unreadable)")


if __name__ == "__main__":
    process()
