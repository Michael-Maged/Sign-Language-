from fastapi import APIRouter, UploadFile
import whisper

router = APIRouter()
model = whisper.load_model("base")

@router.post("/speech-to-text")
async def speech_to_text(file: UploadFile):
    with open("temp.wav", "wb") as f:
        f.write(await file.read())

    result = model.transcribe("temp.wav")
    return {"text": result["text"]}