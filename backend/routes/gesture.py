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
        min_hand_detection_confidence=0.2,   # lowered for low-light
        min_hand_presence_confidence=0.2,
        min_tracking_confidence=0.2,
    )
    return vision.HandLandmarker.create_from_options(options)


def _load_classifier():
    if os.path.exists(MODEL_PATH) and os.path.exists(ENCODER_PATH):
        return joblib.load(MODEL_PATH), joblib.load(ENCODER_PATH)
    return None, None


detector             = _make_detector()
model, label_encoder = _load_classifier()


# ── Feature extraction (must stay identical to extract_landmarks.py) ────────

ANGLE_TRIPLETS = [
    (1, 2, 3), (2, 3, 4),
    (5, 6, 7), (6, 7, 8),
    (9, 10, 11), (10, 11, 12),
    (13, 14, 15), (14, 15, 16),
    (17, 18, 19), (18, 19, 20),
]

FINGERTIP_IDS = [4,  8, 12, 16, 20]   # thumb → pinky tips
MCP_IDS       = [2,  5,  9, 13, 17]   # corresponding base joints


def _angle(a, b, c):
    ba = a - b
    bc = c - b
    cos = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-8)
    return float(np.arccos(np.clip(cos, -1.0, 1.0)))


def _extension_ratios(pts):
    """Tip-distance / MCP-distance from wrist — captures finger curl."""
    return [
        float(np.linalg.norm(pts[tip]) / (np.linalg.norm(pts[mcp]) + 1e-8))
        for tip, mcp in zip(FINGERTIP_IDS, MCP_IDS)
    ]


def _thumb_finger_dists(pts):
    """Distances from thumb tip to each finger tip — highly discriminative for S/A/E/M."""
    thumb = pts[4]
    return [float(np.linalg.norm(thumb - pts[tip])) for tip in [8, 12, 16, 20]]


def normalize(landmarks):
    pts = np.array([[lm.x, lm.y, lm.z] for lm in landmarks])
    pts -= pts[0]                          # wrist-relative
    scale = np.linalg.norm(pts[9])
    if scale > 0:
        pts /= scale                       # scale-invariant
    angles      = [_angle(pts[a], pts[b], pts[c]) for a, b, c in ANGLE_TRIPLETS]
    ext         = _extension_ratios(pts)
    thumb_dists = _thumb_finger_dists(pts)
    return np.concatenate([pts.flatten(), angles, ext, thumb_dists]).reshape(1, -1)


# ── Image preprocessing ──────────────────────────────────────────────────────

def _enhance_image(rgb: np.ndarray) -> np.ndarray:
    """CLAHE on L channel — improves detection in low-light conditions."""
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    return cv2.cvtColor(cv2.merge([l, a, b]), cv2.COLOR_LAB2RGB)


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


# ── Endpoint ─────────────────────────────────────────────────────────────────

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

    # Try original image first; fall back to CLAHE-enhanced for low-light
    result = detector.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb))
    if not result.hand_world_landmarks:
        enhanced = _enhance_image(rgb)
        result = detector.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=enhanced))

    if not result.hand_world_landmarks or not result.hand_landmarks:
        if label_encoder is not None and "nothing" in label_encoder.classes_:
            return {"letter": "nothing", "confidence": 1.0, "landmarks": []}
        raise HTTPException(status_code=422, detail="No hand detected in image")

    world_lms  = result.hand_world_landmarks[0]
    features   = normalize(world_lms)
    probs      = model.predict_proba(features)[0]
    pred_idx   = int(np.argmax(probs))
    letter     = label_encoder.inverse_transform([pred_idx])[0]
    confidence = float(probs[pred_idx])

    image_lms = result.hand_landmarks[0]
    landmarks = [{"x": round(lm.x, 4), "y": round(lm.y, 4)} for lm in image_lms]

    return {"letter": letter, "confidence": round(confidence, 4), "landmarks": landmarks}
