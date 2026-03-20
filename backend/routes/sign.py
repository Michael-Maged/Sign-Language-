from fastapi import APIRouter
import json

router = APIRouter()

with open("data/sign_dictionary.json") as f:
    signs = json.load(f)

@router.post("/text-to-sign")
def text_to_sign(text: str):
    words = text.upper().split()
    sequence = [word for word in words if word in signs]
    return {"sequence": sequence}