import io
import os
import cv2
import joblib
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
from PIL import Image as PILImage, ImageOps
from fastapi import APIRouter, UploadFile, HTTPException
from typing import List

router = APIRouter()

MODELS_DIR        = "models"
MODEL_PATH        = os.path.join(MODELS_DIR, "wlasl_model.keras")
ENCODER_PATH      = os.path.join(MODELS_DIR, "wlasl_encoder.pkl")
HAND_MODEL_PATH   = os.path.join(MODELS_DIR, "hand_landmarker.task")

SEQ_LEN    = 30
N_FEATURES = 126   # 21 left-hand x3 + 21 right-hand x3


def _load_wlasl_model():
    if os.path.exists(MODEL_PATH) and os.path.exists(ENCODER_PATH):
        import tensorflow as tf
        return tf.keras.models.load_model(MODEL_PATH), joblib.load(ENCODER_PATH)
    return None, None


wlasl_model, wlasl_encoder = _load_wlasl_model()

_hand_options = mp_vision.HandLandmarkerOptions(
    base_options=mp_python.BaseOptions(model_asset_path=HAND_MODEL_PATH),
    num_hands=2,
    min_hand_detection_confidence=0.3,
    min_hand_presence_confidence=0.3,
    min_tracking_confidence=0.3,
    running_mode=mp_vision.RunningMode.IMAGE,
)
_hand_detector = mp_vision.HandLandmarker.create_from_options(_hand_options)


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
    """Extract 126-dim feature vector (left + right hand) from one RGB frame."""
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    result   = _hand_detector.detect(mp_image)

    left  = np.zeros(63, dtype=np.float32)
    right = np.zeros(63, dtype=np.float32)

    for i, handedness in enumerate(result.handedness):
        label = handedness[0].category_name.lower()
        lms   = result.hand_landmarks[i]
        arr   = np.array([[lm.x, lm.y, lm.z] for lm in lms], dtype=np.float32).flatten()
        if label == "left":
            left = arr
        else:
            right = arr

    return np.concatenate([left, right])


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
    inp       = seq_array[np.newaxis, ...]   # (1, 30, 126)

    probs      = wlasl_model.predict(inp, verbose=0)[0]
    pred_idx   = int(np.argmax(probs))
    word       = wlasl_encoder.inverse_transform([pred_idx])[0]
    confidence = float(probs[pred_idx])

    return {"word": word, "confidence": round(confidence, 4)}
