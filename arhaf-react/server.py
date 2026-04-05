from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# تأكد من وجود الـ CORS للسماح لـ React بالتواصل
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload")
async def upload_audio(file: UploadFile = File(...)): # تأكد أن الاسم هنا 'file'
    print(f"Received file: {file.filename}")
    return {
        "prediction": "Normal Crying",
        "confidence": 95.0,
        "status": "success"
    }