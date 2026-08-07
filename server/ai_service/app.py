from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from model_runner import runner

app = FastAPI(
    title="Smart Civic Computer Vision AI Microservice",
    description="YOLOv8 & OpenCV powered civic defect identification and severity scoring service",
    version="1.0.0"
)

# Enable CORS for local Express and dev apps
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BoundingBox(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int
    label: str
    confidence: float

class AnalysisResponse(BaseModel):
    detectedCategory: str
    confidence: float
    severityScore: float
    suggestedPriority: str
    recommendedDepartment: str
    boundingBoxes: List[BoundingBox]

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "smart-civic-ai-vision",
        "yolo_model_loaded": not runner.use_fallback
    }

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_image(file: UploadFile = File(...)):
    if not file.content_type.startswith(("image/", "video/")):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image or video.")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")

    result = runner.analyze_image(contents)
    return result

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
