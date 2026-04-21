import tempfile
import os
from fastapi import APIRouter, UploadFile
import whisper

router = APIRouter()
model = whisper.load_model("base")

@router.post("/speech-to-text")
async def speech_to_text(file: UploadFile):
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
    try:
        result = model.transcribe(tmp_path)
        return {"text": result["text"]}
    finally:
        os.remove(tmp_path)