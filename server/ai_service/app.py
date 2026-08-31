from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any
import uvicorn
from model_runner import runner
from yolo_guard import guard_instance

app = FastAPI(
    title="Smart Civic Computer Vision AI Microservice",
    description="YOLOv8 & NVIDIA TensorRT powered civic defect identification, severity scoring, and guard verification service",
    version="1.1.0"
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

class VerificationResponse(BaseModel):
    verified: bool
    selectedCategory: str
    detectedClasses: List[str]
    matchedClasses: List[str]
    confidence: float
    latencyMs: float
    device: str
    message: str

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "smart-civic-ai-vision",
        "yolo_model_loaded": not runner.use_fallback,
        "tensorrt_mode": guard_instance.engine_mode,
        "confidence_threshold": guard_instance.conf_threshold
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

@app.post("/verify-category", response_model=VerificationResponse)
async def verify_category(
    file: UploadFile = File(...),
    category: str = Form(...)
):
    if not file.content_type.startswith(("image/", "video/")):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image or video.")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")

    result = guard_instance.verify_image(contents, category)
    return result

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
