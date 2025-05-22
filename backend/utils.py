import os
import uuid
import pydicom
import numpy as np
import cv2
from PIL import Image
from dotenv import load_dotenv
import requests
import google.generativeai as genai

load_dotenv()
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")
ROBOFLOW_URL = "https://detect.roboflow.com/adr/6"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)


def dicom_to_png(dicom_file, output_path):
    ds = pydicom.dcmread(dicom_file)
    pixel_array = ds.pixel_array
    normalized = cv2.normalize(pixel_array, None, 0, 255, cv2.NORM_MINMAX)
    image = Image.fromarray(normalized).convert("L")
    image.save(output_path)

def draw_boxes(image_path, predictions, output_path):
    image = cv2.imread(image_path)
    for p in predictions:
        x, y, w, h = int(p["x"]), int(p["y"]), int(p["width"]/2), int(p["height"]/2)
        top_left = (x - w, y - h)
        bottom_right = (x + w, y + h)
        label = f'{p["class"]} ({int(p["confidence"] * 100)}%)'
        cv2.rectangle(image, top_left, bottom_right, (0, 255, 0), 2)
        cv2.putText(image, label, (x - w, y - h - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)
    cv2.imwrite(output_path, image)

async def process_dicom_file(file):
    os.makedirs("images", exist_ok=True)
    uid = str(uuid.uuid4())
    dicom_path = f"images/{uid}.dcm"
    png_path = f"images/{uid}.png"
    annotated_path = f"images/{uid}_annotated.png"

    with open(dicom_path, "wb") as f:
        f.write(await file.read())

    dicom_to_png(dicom_path, png_path)

    with open(png_path, "rb") as img_file:
        res = requests.post(
            f"{ROBOFLOW_URL}?api_key={ROBOFLOW_API_KEY}&confidence=30&overlap=50",
            files={"file": img_file}
        )

    predictions = res.json().get("predictions", [])
    draw_boxes(png_path, predictions, annotated_path)

    report = generate_report(predictions)

    return {
        "original_image_url": f"http://localhost:8000/{png_path}",
        "annotated_image_url": f"http://localhost:8000/{annotated_path}",
        "report": report
    }

def generate_report(predictions):
    if not predictions:
        return "No pathologies detected."

    prompt = (
        "You are a dental radiologist. Based on the following image annotations, "
        "generate a clinical diagnostic report summarizing findings and suggesting next steps.\n\n"
        f"Annotations: {predictions}"
    )

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print("Gemini Error:", e)
        return "Error generating report."
