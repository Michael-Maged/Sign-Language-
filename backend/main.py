from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import speech, sign, media, gesture

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(speech.router)
app.include_router(sign.router)
app.include_router(media.router)
app.include_router(gesture.router)

@app.get("/")
def root():
    return {"message": "API running"}