# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack assistive communication platform that converts spoken language into sign language. The system uses on-device speech recognition (current phase) with a path toward backend Whisper-based transcription, then maps text to sign language GIF/video assets.

**Current phase:** Flutter app uses on-device `speech_to_text` and fake word-to-sign mapping. The backend exists but the app doesn't yet call it — `HomeScreen.onSpeechResult` splits recognized text into words and loads `assets/signs/<word>.gif` locally.

**Planned evolution:** Replace on-device fake mapping → call `/text-to-sign` API → eventually use `/speech-to-text` (Whisper) for audio upload.

## Repository Structure

```
backend/          # FastAPI Python service
  main.py         # App entrypoint, registers routers
  routes/
    speech.py     # POST /speech-to-text (Whisper)
    sign.py       # POST /text-to-sign (dictionary lookup)
  data/
    sign_dictionary.json   # Word → sign key mapping (UPPERCASE keys)
  venv/           # Python virtual environment (do not edit)

mobile/           # Flutter app
  lib/
    main.dart             # App entrypoint
    screens/home_screen.dart   # Main UI: mic input + sign display
    widgets/mic_button.dart    # FAB that drives speech_to_text
    services/api_service.dart  # HTTP client for FastAPI (baseUrl: 10.0.2.2:8000)
    services/audio_service.dart  # (stub, currently empty)
    models/sign_model.dart       # (stub, currently empty)
  assets/signs/   # GIF files named <word>.gif (lowercase)
```

## Backend Commands

```bash
cd backend

# Activate virtual environment (Windows)
source venv/Scripts/activate   # bash
# or: venv\Scripts\activate    # cmd

# Install dependencies
pip install fastapi uvicorn openai-whisper

# Run the server (hot reload)
uvicorn main:app --reload

# Server runs at http://localhost:8000
# Android emulator reaches it via http://10.0.2.2:8000
```

The backend has no tests yet. The `requirements.txt` is currently empty — dependencies must be installed manually as above.

## Mobile Commands

```bash
cd mobile

# Install dependencies
flutter pub get

# Run on connected device/emulator
flutter run

# Run tests
flutter test

# Run a single test file
flutter test test/widget_test.dart

# Build APK
flutter build apk
```

## Key Architecture Notes

### Data Flow (current)
1. User taps mic → `MicButton` calls `speech_to_text` on-device
2. Recognized text passed to `HomeScreen.onSpeechResult`
3. Text is split by spaces (uppercased) → each word becomes a sign token
4. `Image.asset('assets/signs/<word>.gif')` renders the sign; missing assets show "No sign available"

### Data Flow (backend-ready path)
- `ApiService.textToSign(text)` POSTs to `/text-to-sign`, returns `List<String>` of matched words from `sign_dictionary.json`
- `speech.py` accepts a WAV file upload and returns Whisper transcription
- Sign dictionary keys are UPPERCASE; `sign.py` splits and filters against them

### Sign Dictionary
- Located at `backend/data/sign_dictionary.json`
- Keys are uppercase words; the mobile app looks up lowercase GIF filenames
- The `sign.py` router loads the dictionary at startup (module level)

### Mobile ↔ Backend
- `ApiService.baseUrl` is hardcoded to `http://10.0.2.2:8000` (Android emulator loopback to host)
- For physical devices or iOS simulator, this URL must change
- The app currently bypasses `ApiService` entirely; wiring it in requires updating `HomeScreen.onSpeechResult`
