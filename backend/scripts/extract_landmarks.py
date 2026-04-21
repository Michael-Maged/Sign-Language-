"""
Step 1 - Extract MediaPipe hand landmarks from ASL Alphabet dataset images.

Produces: data/landmarks.csv
  columns: label, x0..x20, y0..y20, z0..z20  (63 features + 1 label)

Landmarks are normalised relative to wrist (landmark 0) and scaled by the
wrist->middle-MCP distance so the model is position- and scale-invariant.

Each image is also augmented with a horizontal flip (x coords negated) so the
model handles both right-handed and left-handed signers.

Run from backend/:
    python scripts/extract_landmarks.py
"""

import os
import csv
import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)

DATASET_DIR = os.path.join(BACKEND_DIR, "data", "asl_alphabet_train", "asl_alphabet_train")
OUTPUT_CSV  = os.path.join(BACKEND_DIR, "data", "landmarks.csv")
MODEL_PATH  = os.path.join(BACKEND_DIR, "models", "hand_landmarker.task")

# Use more images per letter; set to None to use all available
IMAGES_PER_LETTER = 2000

LETTERS = [chr(c) for c in range(ord("A"), ord("Z") + 1)] + ["nothing", "space"]


def make_detector():
    base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
    options = vision.HandLandmarkerOptions(
        base_options=base_options,
        num_hands=1,
        min_hand_detection_confidence=0.3,
        min_hand_presence_confidence=0.3,
        min_tracking_confidence=0.3,
    )
    return vision.HandLandmarker.create_from_options(options)


# Finger joint triplets for angle features: (base, mid, tip) per joint
# Covers MCP-PIP-DIP for each of the 4 fingers + thumb IP
ANGLE_TRIPLETS = [
    (1, 2, 3), (2, 3, 4),          # thumb
    (5, 6, 7), (6, 7, 8),          # index
    (9, 10, 11), (10, 11, 12),     # middle
    (13, 14, 15), (14, 15, 16),    # ring
    (17, 18, 19), (18, 19, 20),    # pinky
]


def _angle(a, b, c):
    """Angle at b formed by vectors b->a and b->c, in radians."""
    ba = a - b
    bc = c - b
    cos = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-8)
    return float(np.arccos(np.clip(cos, -1.0, 1.0)))


def normalize(landmarks):
    pts = np.array([[lm.x, lm.y, lm.z] for lm in landmarks])
    pts -= pts[0]
    scale = np.linalg.norm(pts[9])
    if scale > 0:
        pts /= scale
    angles = [_angle(pts[a], pts[b], pts[c]) for a, b, c in ANGLE_TRIPLETS]
    return pts.flatten().tolist() + angles


def flip_x(features: list) -> list:
    """Horizontal-flip augmentation: negate x coordinate of each landmark."""
    flipped = list(features)
    for i in range(21):
        flipped[i * 3] = -flipped[i * 3]
    # angles (last 10 values) are invariant to horizontal flip
    return flipped


def process():
    if not os.path.exists(DATASET_DIR):
        print(f"Dataset not found at {DATASET_DIR}")
        return
    if not os.path.exists(MODEL_PATH):
        print(f"Model not found at {MODEL_PATH}")
        return

    angle_cols = [f"angle_{a}_{b}_{c}" for a, b, c in ANGLE_TRIPLETS]
    header = ["label"] + [f"{axis}{i}" for i in range(21) for axis in ("x", "y", "z")] + angle_cols

    detector = make_detector()
    total, skipped = 0, 0

    with open(OUTPUT_CSV, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(header)

        for letter in LETTERS:
            folder = os.path.join(DATASET_DIR, letter)
            if not os.path.isdir(folder):
                print(f"  SKIP  {letter} - folder missing")
                continue

            images = sorted(os.listdir(folder))
            if IMAGES_PER_LETTER is not None:
                images = images[:IMAGES_PER_LETTER]

            count = 0

            for fname in images:
                path = os.path.join(folder, fname)
                img  = cv2.imread(path)
                if img is None:
                    continue

                rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
                result = detector.detect(mp_image)

                if not result.hand_landmarks:
                    skipped += 1
                    continue

                features = normalize(result.hand_landmarks[0])

                # Original sample
                writer.writerow([letter] + features)
                count += 1
                total += 1

                # Augmentation: horizontal flip
                writer.writerow([letter] + flip_x(features))
                count += 1
                total += 1

            print(f"  {letter}  {count} rows ({count // 2} images + {count // 2} flipped)")

    print(f"\nDone - {total} rows written to {OUTPUT_CSV}  ({skipped} images skipped)")


if __name__ == "__main__":
    process()
