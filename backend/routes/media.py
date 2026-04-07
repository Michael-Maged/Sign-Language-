from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse
import os
import json

router = APIRouter()

SIGNS_DIR = "data/signs"
EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif"]


@router.get("/signs/{name}/landmarks")
def get_sign_landmarks(name: str):
    path = os.path.join(SIGNS_DIR, f"{name.upper()}.json")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"No landmarks found for '{name}'")
    with open(path) as f:
        return JSONResponse(content=json.load(f))


@router.get("/signs/{name}")
def get_sign(name: str):
    for ext in EXTENSIONS:
        path = os.path.join(SIGNS_DIR, f"{name.lower()}{ext}")
        if os.path.exists(path):
            media_type = "image/gif" if ext == ".gif" else "image/jpeg" if ext in (".jpg", ".jpeg") else "image/png"
            return FileResponse(path, media_type=media_type)
    raise HTTPException(status_code=404, detail=f"No sign found for '{name}'")
