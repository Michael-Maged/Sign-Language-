import io
import os
import cv2
import joblib
import numpy as np
import mediapipe as mp
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
        import tensorflow as tf
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
    """Decode image bytes to RGB numpy array, honouring EXIF rotation."""
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
        raise HTTPException(status_code=503, detail="WLASL model not loaded -- run scripts/train_wlasl_model.py first.")

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
