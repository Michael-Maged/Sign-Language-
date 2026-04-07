import io
import os
import cv2
import joblib
import numpy as np
import mediapipe as mp
from PIL import Image as PILImage, ImageOps
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from fastapi import APIRouter, UploadFile, HTTPException

router = APIRouter()

MODELS_DIR     = "models"
MODEL_PATH     = os.path.join(MODELS_DIR, "gesture_model.pkl")
ENCODER_PATH   = os.path.join(MODELS_DIR, "label_encoder.pkl")
LANDMARK_MODEL = os.path.join(MODELS_DIR, "hand_landmarker.task")


def _make_detector():
    if not os.path.exists(LANDMARK_MODEL):
        return None
    base_options = python.BaseOptions(model_asset_path=LANDMARK_MODEL)
    options = vision.HandLandmarkerOptions(
        base_options=base_options,
        num_hands=1,
        min_hand_detection_confidence=0.3,   # lowered from 0.5 — matches training
        min_hand_presence_confidence=0.3,
        min_tracking_confidence=0.3,
    )
    return vision.HandLandmarker.create_from_options(options)


def _load_classifier():
    if os.path.exists(MODEL_PATH) and os.path.exists(ENCODER_PATH):
        return joblib.load(MODEL_PATH), joblib.load(ENCODER_PATH)
    return None, None


detector             = _make_detector()
model, label_encoder = _load_classifier()


def normalize(landmarks):
    pts = np.array([[lm.x, lm.y, lm.z] for lm in landmarks])
    pts -= pts[0]
    scale = np.linalg.norm(pts[9])
    if scale > 0:
        pts /= scale
    return pts.flatten().reshape(1, -1)


def _decode_image(contents: bytes) -> np.ndarray:
    """Decode image bytes → RGB numpy array, honouring EXIF rotation."""
    try:
        pil_img = PILImage.open(io.BytesIO(contents))
        pil_img = ImageOps.exif_transpose(pil_img)   # fix mobile rotation
        return np.array(pil_img.convert("RGB"))
    except Exception:
        # Fallback: OpenCV decode
        img = cv2.imdecode(np.frombuffer(contents, np.uint8), cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Invalid image")
        return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)


@router.post("/gesture/predict")
async def predict_gesture(file: UploadFile):
    if detector is None:
        raise HTTPException(status_code=503, detail="Hand landmark model not found.")
    if model is None:
        raise HTTPException(status_code=503, detail="Classifier not trained yet. Run scripts/train_model.py first.")

    contents = await file.read()
    try:
        rgb = _decode_image(contents)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid image")

    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    result   = detector.detect(mp_image)

    if not result.hand_landmarks:
        raise HTTPException(status_code=422, detail="No hand detected in image")

    raw_lms  = result.hand_landmarks[0]
    features = normalize(raw_lms)
    probs    = model.predict_proba(features)[0]
    pred_idx = int(np.argmax(probs))
    letter   = label_encoder.inverse_transform([pred_idx])[0]
    confidence = float(probs[pred_idx])

    # Raw landmark positions (0-1 relative to image) for client-side overlay
    landmarks = [{"x": round(lm.x, 4), "y": round(lm.y, 4)} for lm in raw_lms]

    return {"letter": letter, "confidence": round(confidence, 4), "landmarks": landmarks}
