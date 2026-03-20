from fastapi import FastAPI
from routes import speech, sign

app = FastAPI()

app.include_router(speech.router)
app.include_router(sign.router)

@app.get("/")
def root():
    return {"message": "API running"}