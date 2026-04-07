# Sign Language Translator

A full-stack assistive communication platform that converts spoken language into sign language. Built with a React Native (Expo) mobile app and a FastAPI backend.

---

## Current State

### What's fully working
- **Speech → Text → Sign pipeline is end-to-end connected**
  - Mobile mic button records audio via `expo-av`
  - `AudioService.stopRecordingAndTranscribe()` uploads the audio to `POST /speech-to-text` (Whisper)
  - Transcribed text is sent to `POST /text-to-sign`, which splits it into words and letters
  - Each letter is rendered as an image fetched from `GET /signs/{letter}` (served from `data/signs/`)
- **Gesture recognition pipeline is built but not yet wired to mobile**
  - `extract_landmarks.py` → extracts 63 MediaPipe features per image from ASL dataset
  - `train_model.py` → trains an XGBoost classifier, saves `gesture_model.pkl` + `label_encoder.pkl`
  - `POST /gesture/predict` → accepts an image, returns predicted letter + confidence
  - The trained model files (`gesture_model.pkl`, `label_encoder.pkl`) may or may not exist yet depending on whether training has been run

### Architecture
```
Mobile (Expo / React Native)
  MicButton → AudioService → POST /speech-to-text (Whisper)
                           → POST /text-to-sign
                           → GET  /signs/{letter}  ← LetterCard renders image

Backend (FastAPI)
  /speech-to-text   — Whisper transcription from uploaded audio
  /text-to-sign     — splits text into words/letters
  /signs/{name}     — serves sign images from data/signs/
  /gesture/predict  — XGBoost classifier on MediaPipe landmarks (image upload)
```

---

## What Should Happen Next

### 1. Run the gesture model training (if not done yet)
The classifier exists in code but the model files need to be generated before `/gesture/predict` works.

```bash
cd backend
python scripts/extract_landmarks.py   # produces data/landmarks.csv
python scripts/train_model.py         # produces models/gesture_model.pkl + label_encoder.pkl
```

Requires the ASL alphabet dataset at `data/asl_alphabet_train/asl_alphabet_train/`.

---

### 2. Wire the camera gesture recognition into the mobile app
`/gesture/predict` is ready on the backend but the mobile app has no camera screen yet.

- Add a camera screen using `expo-camera`
- Capture frames and POST them to `/gesture/predict`
- Display the predicted letter and accumulate letters into words
- This enables the **reverse direction**: sign language → text

---

### 3. Fix the Whisper audio format
`AudioService` records in `.m4a` (AAC) but Whisper works best with `.wav`. The backend saves the upload as `temp.wav` without converting it, which will cause transcription failures on real devices.

- Either convert on the backend using `ffmpeg` or `pydub` before passing to Whisper
- Or change the recording preset in `AudioService` to output a compatible format

---

### 4. Replace letter-by-letter signs with word-level signs
Currently `sign.py` finger-spells every word letter by letter. This is functional but not real sign language.

- Build or source a word-level sign video/GIF dataset
- Update `sign.py` to look up whole words first, fall back to finger-spelling only when no word-level sign exists
- Add word-level assets to `data/signs/`

---

### 5. Add sentence-level grammar restructuring
Spoken English grammar differs from ASL grammar (e.g., ASL uses topic-comment structure). After word mapping works reliably:

- Integrate a lightweight NLP step (e.g., spaCy or an LLM prompt) to reorder tokens into ASL grammar before mapping to signs
- This is the step that moves the system from a transliteration tool to an actual translator

---

### 6. Multilingual input support
The Whisper model already supports multiple languages. The gap is on the sign-mapping side.

- Add Arabic Sign Language (ArSL) assets and a separate mapping route
- Let the mobile app select input language; pass it through to the backend
- Route to the correct sign dataset based on language

---

### 7. Harden the backend
Several production-readiness gaps exist:

- `speech.py` writes to a hardcoded `temp.wav` — concurrent requests will collide; use `tempfile.NamedTemporaryFile`
- `gesture.py` loads the model at module import time with no reload mechanism; add a `/gesture/reload` admin endpoint or use a lifespan handler
- Add `pytest` tests for `/text-to-sign` and `/gesture/predict`
- Pin dependency versions in `requirements.txt`

---

### 8. On-device inference (later phase)
To reduce latency and enable offline use:

- Export the XGBoost gesture model to ONNX
- Run it on-device using `onnxruntime-react-native`
- Eliminates the round-trip for gesture prediction, which needs to be near real-time for live camera use

---

## Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Mobile
```bash
cd mobile
npm install
npx expo start
```

Set your machine's local IP in `mobile/src/config.ts`:
```ts
export const BASE_URL = "http://<your-local-ip>:8000";
```
Both your machine and device must be on the same Wi-Fi network.
