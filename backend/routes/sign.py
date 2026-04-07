from fastapi import APIRouter

router = APIRouter()

@router.post("/text-to-sign")
def text_to_sign(text: str):
    words = text.upper().split()
    result = []
    for word in words:
        letters = [{"letter": ch, "word": word} for ch in word if ch.isalpha()]
        result.append({"word": word, "letters": letters})
    return {"words": result}
