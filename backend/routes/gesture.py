import os
import cv2
import joblib
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from fastapi import APIRouter, UploadFile, HTTPException

router = APIRouter()

MODELS_DIR    = "models"
MODEL_PATH    = os.path.join(MODELS_DIR, "gesture_model.pkl")
ENCODER_PATH  = os.path.join(MODELS_DIR, "label_encoder.pkl")
LANDMARK_MODEL = os.path.join(MODELS_DIR, "hand_landmarker.task")


def _make_detector():
    if not os.path.exists(LANDMARK_MODEL):
        return None
    base_options = python.BaseOptions(model_asset_path=LANDMARK_MODEL)
    options = vision.HandLandmarkerOptions(
        base_options=base_options,
        num_hands=1,
        min_hand_detection_confidence=0.5,
    )
    return vision.HandLandmarker.create_from_options(options)


def _load_classifier():
    if os.path.exists(MODEL_PATH) and os.path.exists(ENCODER_PATH):
        return joblib.load(MODEL_PATH), joblib.load(ENCODER_PATH)
    return None, None


detector        = _make_detector()
model, label_encoder = _load_classifier()


def normalize(landmarks):
    pts = np.array([[lm.x, lm.y, lm.z] for lm in landmarks])
    pts -= pts[0]
    scale = np.linalg.norm(pts[9])
    if scale > 0:
        pts /= scale
    return pts.flatten().reshape(1, -1)


@router.post("/gesture/predict")
async def predict_gesture(file: UploadFile):
    if detector is None:
        raise HTTPException(status_code=503, detail="Hand landmark model not found.")
    if model is None:
        raise HTTPException(status_code=503, detail="Classifier not trained yet. Run scripts/train_model.py first.")

    contents = await file.read()
    img = cv2.imdecode(np.frombuffer(contents, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image")

    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    result = detector.detect(mp_image)

    if not result.hand_landmarks:
        raise HTTPException(status_code=422, detail="No hand detected in image")

    features   = normalize(result.hand_landmarks[0])
    probs      = model.predict_proba(features)[0]
    pred_idx   = int(np.argmax(probs))
    letter     = label_encoder.inverse_transform([pred_idx])[0]
    confidence = float(probs[pred_idx])

    return {"letter": letter, "confidence": round(confidence, 4)}
