from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os

router = APIRouter()

SIGNS_DIR = "data/signs"
EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif"]

@router.get("/signs/{name}")
def get_sign(name: str):
    for ext in EXTENSIONS:
        path = os.path.join(SIGNS_DIR, f"{name.lower()}{ext}")
        if os.path.exists(path):
            media_type = "image/gif" if ext == ".gif" else "image/jpeg" if ext in (".jpg", ".jpeg") else "image/png"
            return FileResponse(path, media_type=media_type)
    raise HTTPException(status_code=404, detail=f"No sign found for '{name}'")
