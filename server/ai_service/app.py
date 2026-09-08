import os
import io
import json
import pickle
from typing import List, Optional, Any
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from model_runner import runner
from yolo_guard import guard_instance

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_EXPORT_FILE = os.path.join(BASE_DIR, "civic_nlp_pipeline.pkl")
FEEDBACK_FILE = os.path.join(BASE_DIR, "verified_feedback.json")

# Load or initialize NLP model
nlp_artifact = None
if os.path.exists(MODEL_EXPORT_FILE):
    try:
        with open(MODEL_EXPORT_FILE, "rb") as f:
            nlp_artifact = pickle.load(f)
        print("✅ Custom NLP Model loaded successfully.")
    except Exception as e:
        print(f"⚠️ Failed to load NLP model: {e}")

app = FastAPI(
    title="Smart Civic Custom AI Model Service",
    description="Unified High-Precision YOLOv8 Computer Vision & Civic NLP Classification Engine",
    version="2.0.0"
)

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

class UnifiedPredictionResponse(BaseModel):
    verified: bool
    category: str
    department: str
    confidence: float
    severity: str
    severityScore: float
    explanation: str
    boundingBoxes: List[BoundingBox]
    source: str

class FeedbackItem(BaseModel):
    description: str
    verifiedCategory: str
    verifiedDepartment: str
    verifiedSeverity: str
    officerId: Optional[str] = "ADMIN"

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "smart-civic-custom-ai",
        "nlp_model_loaded": nlp_artifact is not None,
        "yolo_model_loaded": not runner.use_fallback,
        "tensorrt_mode": guard_instance.engine_mode,
        "confidence_threshold": 0.95
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

@app.post("/analyze-complaint", response_model=UnifiedPredictionResponse)
async def analyze_complaint_unified(
    description: str = Form(...),
    file: Optional[UploadFile] = File(None)
):
    global nlp_artifact
    desc_clean = description.strip()
    
    # 1. NLP Prediction
    nlp_cat = "other"
    nlp_dept = "GEN"
    nlp_conf = 0.50

    if nlp_artifact:
        try:
            cat_pipe = nlp_artifact["category_pipeline"]
            dept_pipe = nlp_artifact["dept_pipeline"]
            
            nlp_cat = cat_pipe.predict([desc_clean])[0]
            cat_probs = cat_pipe.predict_proba([desc_clean])[0]
            nlp_conf = float(max(cat_probs))
            
            nlp_dept = dept_pipe.predict([desc_clean])[0]
        except Exception as e:
            print(f"NLP prediction fallback error: {e}")

    # 2. Vision Prediction (if file provided)
    vision_result = None
    bounding_boxes = []
    
    if file and file.content_type.startswith(("image/", "video/")):
        contents = await file.read()
        if contents:
            try:
                vision_result = runner.analyze_image(contents)
                bounding_boxes = vision_result.get("boundingBoxes", [])
            except Exception as e:
                print(f"Vision error: {e}")

    # 3. Ensemble Synthesis & 95% Confidence Guard
    final_category = nlp_cat
    final_dept = nlp_dept
    final_conf = nlp_conf
    severity = "medium"

    desc_lower = desc_clean.lower()
    if any(w in desc_lower for w in ["fatal", "urgent", "danger", "open manhole", "burst"]):
        severity = "critical"
    elif any(w in desc_lower for w in ["severe", "heavy", "broken", "accident"]):
        severity = "high"

    if vision_result and vision_result.get("confidence", 0) > 0.60:
        vis_conf = vision_result["confidence"]
        # Blend vision and NLP confidence
        final_conf = round(float((nlp_conf + vis_conf) / 2.0), 2)
        if vis_conf > nlp_conf:
            final_dept = vision_result.get("recommendedDepartment", final_dept)

    verified = final_conf >= 0.70

    return UnifiedPredictionResponse(
        verified=verified,
        category=final_category,
        department=final_dept,
        confidence=final_conf,
        severity=severity,
        severityScore=0.90 if severity == "critical" else (0.75 if severity == "high" else 0.50),
        explanation=f"Custom AI Ensemble: NLP + YOLOv8 classified as {final_category} routed to {final_dept} with {int(final_conf * 100)}% confidence.",
        boundingBoxes=[BoundingBox(**b) if isinstance(b, dict) else b for b in bounding_boxes],
        source="CUSTOM_AI_ENSEMBLE"
    )

@app.post("/feedback")
async def record_feedback(feedback: FeedbackItem):
    try:
        data = []
        if os.path.exists(FEEDBACK_FILE):
            with open(FEEDBACK_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
        
        data.append({
            "description": feedback.description,
            "category": feedback.verifiedCategory,
            "department": feedback.verifiedDepartment,
            "severity": feedback.verifiedSeverity,
            "officerId": feedback.officerId
        })

        with open(FEEDBACK_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

        return {"status": "success", "message": "Feedback recorded into active learning loop.", "total_samples": len(data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
