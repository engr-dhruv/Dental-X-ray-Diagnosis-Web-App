from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from utils import process_dicom_file
from dotenv import load_dotenv
import os

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

os.makedirs("images", exist_ok=True)
app.mount("/images", StaticFiles(directory="images"), name="images")

@app.post("/process")
async def process(file: UploadFile = File(...)):
    result = await process_dicom_file(file)
    return result
