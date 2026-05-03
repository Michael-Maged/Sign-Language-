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
