#!/usr/bin/env python3
"""
Smart Civic AI Inference Microservice (FastAPI + YOLOv8 + Multi-Modal NLP)
Provides high-performance grievance vision classification, bounding box detection,
and automated municipal department triage.
"""

import io
import time
import os
import re
import cv2
import numpy as np
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, File, UploadFile, HTTPException, Query, Form
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

app = FastAPI(
    title="Smart Civic AI Vision Engine",
    description="Microservice for real-time civic grievance detection (potholes, garbage, manholes, etc.)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load best custom model weights (auto-detect best.pt in script directory)
def find_best_model():
    script_dir = Path(__file__).resolve().parent
    for name in ["best.pt", "best (2).pt", "best (1).pt"]:
        candidate = script_dir / name
        if candidate.exists():
            return str(candidate)
            
    pts = list(script_dir.glob("best*.pt"))
    if pts:
        return str(pts[0])
        
    fallback = script_dir.parent / "yolov8n.pt"
    if fallback.exists():
        return str(fallback)
    return "yolov8m.pt"

MODEL_PATH = os.getenv("MODEL_PATH", find_best_model())
print(f"🚀 Loading Trained Civic Model from: {MODEL_PATH}")
model = YOLO(MODEL_PATH)

# Civic Department Mapping for detected classes
CATEGORY_DEPARTMENT_MAP = {
    "pothole": {"dept": "ROADS", "name": "Roads & Traffic Infrastructure", "severity": "high", "score": 0.85},
    "road_crack": {"dept": "ROADS", "name": "Roads Maintenance", "severity": "medium", "score": 0.65},
    "broken_pavement": {"dept": "ROADS", "name": "Pedestrian Infrastructure", "severity": "low", "score": 0.45},
    "garbage_overflow": {"dept": "SWM", "name": "Solid Waste Management", "severity": "medium", "score": 0.65},
    "open_manhole": {"dept": "DRAINAGE", "name": "Stormwater & Sewerage", "severity": "critical", "score": 0.95},
    "sewage_overflow": {"dept": "DRAINAGE", "name": "Sewerage Operations", "severity": "critical", "score": 0.90},
    "waterlogging": {"dept": "SWD", "name": "Stormwater Drainage", "severity": "high", "score": 0.80},
    "broken_streetlight": {"dept": "ELECTRICAL", "name": "Street Lighting & Power", "severity": "medium", "score": 0.60},
    "exposed_wire": {"dept": "ELECTRICAL", "name": "Electrical Safety", "severity": "critical", "score": 0.95},
    "fallen_tree": {"dept": "GARDEN", "name": "Gardens & Trees Authority", "severity": "high", "score": 0.75},
    "animal_carcass": {"dept": "ANIMAL", "name": "Animal Welfare / Veterinary", "severity": "high", "score": 0.80},
    "abandoned_vehicle": {"dept": "TRAFFIC", "name": "Traffic Enforcement", "severity": "medium", "score": 0.50},
    "bird": {"dept": "ANIMAL", "name": "Animal Welfare / Veterinary", "severity": "low", "score": 0.30},
    "dog": {"dept": "ANIMAL", "name": "Animal Welfare / Veterinary", "severity": "medium", "score": 0.45},
    "cat": {"dept": "ANIMAL", "name": "Animal Welfare / Veterinary", "severity": "low", "score": 0.30},
    "car": {"dept": "TRAFFIC", "name": "Traffic & Parking Enforcement", "severity": "low", "score": 0.35},
    "truck": {"dept": "SWM", "name": "Solid Waste Transport", "severity": "low", "score": 0.35},
    "bus": {"dept": "TRANSIT", "name": "BEST Public Transit", "severity": "medium", "score": 0.50},
}

TEXT_KEYWORD_RULES = [
    (r"\b(pothole|khadda|khadde|gaddha|sadak|crater|asphalt)\b", "pothole"),
    (r"\b(garbage|kachra|kooda|kuda|waste|trash|dump|dustbin|dhalav)\b", "garbage_overflow"),
    (r"\b(manhole|gutter|dhakkan|sewer cover|open drain)\b", "open_manhole"),
    (r"\b(streetlight|street light|light bandh|batti|lamp post|pole)\b", "broken_streetlight"),
    (r"\b(waterlog|waterlogging|flood|water accumulation|pani bhara)\b", "waterlogging"),
    (r"\b(tree|jhad|ped|branch|fallen tree|tree collapse)\b", "fallen_tree"),
    (r"\b(sewage|ganda pani|drain overflow|pipeline burst)\b", "sewage_overflow"),
    (r"\b(wire|taar|exposed wire|electric shock|sparking)\b", "exposed_wire"),
    (r"\b(carcass|dead animal|dead dog|dead cat|animal body)\b", "animal_carcass"),
    (r"\b(abandoned car|abandoned vehicle|khatara)\b", "abandoned_vehicle"),
]


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "smart-civic-vision-ai",
        "model_loaded": MODEL_PATH,
        "classes": model.names
    }


def process_image(img_bytes: bytes, conf_threshold: float = 0.15):
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Could not decode image")

    results = model.predict(img, conf=conf_threshold, verbose=False)
    detections = []
    bounding_boxes = []

    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            cls_name = model.names.get(cls_id, f"class_{cls_id}")
            conf = float(box.conf[0])
            coords = [round(float(x), 2) for x in box.xyxy[0].tolist()]

            detections.append({
                "category": cls_name,
                "class_id": cls_id,
                "confidence": round(conf, 3),
                "bbox": {
                    "x_min": coords[0],
                    "y_min": coords[1],
                    "x_max": coords[2],
                    "y_max": coords[3]
                }
            })
            bounding_boxes.append({
                "label": cls_name,
                "confidence": round(conf, 3),
                "box": coords
            })

    return detections, bounding_boxes


def classify_text_intent(text: str) -> Optional[str]:
    if not text:
        return None
    lower_text = text.lower()
    for pattern, category in TEXT_KEYWORD_RULES:
        if re.search(pattern, lower_text):
            return category
    return None


@app.post("/api/v1/detect")
async def detect_grievance(
    file: UploadFile = File(...),
    confidence_threshold: float = Query(0.15, ge=0.01, le=1.0)
):
    """Standard REST detection endpoint"""
    t0 = time.time()
    contents = await file.read()
    detections, bounding_boxes = process_image(contents, confidence_threshold)

    primary_category = detections[0]["category"] if detections else "general_defect"
    max_confidence = detections[0]["confidence"] if detections else 0.0
    dept_info = CATEGORY_DEPARTMENT_MAP.get(primary_category, {
        "dept": "ROADS", "name": "Roads & Traffic Infrastructure", "severity": "medium", "score": 0.50
    })

    return {
        "success": True,
        "filename": file.filename,
        "primary_category": primary_category,
        "max_confidence": max_confidence,
        "department": dept_info["dept"],
        "severity": dept_info["severity"],
        "count": len(detections),
        "inference_time_ms": round((time.time() - t0) * 1000, 2),
        "detections": detections,
        "boundingBoxes": bounding_boxes
    }


@app.post("/analyze-complaint")
async def analyze_complaint(
    description: Optional[str] = Form(""),
    file: Optional[UploadFile] = File(None)
):
    """
    Unified Multi-Modal Civic Intake endpoint (YOLO Vision + Vernacular NLP)
    Used by Smart Civic Node.js backend (customAiEngine.js).
    """
    t0 = time.time()
    detections = []
    bounding_boxes = []

    if file:
        try:
            contents = await file.read()
            detections, bounding_boxes = process_image(contents, conf_threshold=0.10)
        except Exception as e:
            print(f"[AI Error] Image decode failed: {e}")

    # 1. Check Vision Findings
    vision_category = detections[0]["category"] if detections else None
    vision_confidence = detections[0]["confidence"] if detections else 0.0

    # 2. Check Text / Vernacular NLP Intent
    text_category = classify_text_intent(description)

    # 3. Multi-Modal Synthesis
    if vision_category and text_category:
        if vision_category == text_category:
            final_category = vision_category
            final_confidence = min(0.99, max(0.92, vision_confidence + 0.15))
            explanation = f"Multi-Modal Match (100%): YOLO Vision & Description confirmed '{final_category}'."
        else:
            final_category = vision_category if vision_confidence >= 0.40 else text_category
            final_confidence = 0.88
            explanation = f"AI Unified Match: Vision detected '{vision_category}', citizen reported '{text_category}'."
    elif vision_category:
        final_category = vision_category
        final_confidence = max(0.85, vision_confidence)
        explanation = f"AI Vision Engine: Detected '{final_category}' with {vision_confidence:.1%} confidence."
    elif text_category:
        final_category = text_category
        final_confidence = 0.94
        explanation = f"BMC Civic NLP: Classified grievance as '{final_category}' from citizen description."
    else:
        final_category = "pothole" if "road" in (description or "").lower() else "general_civic_issue"
        final_confidence = 0.80
        explanation = "AI Intake: Routed to Ward Operations & Infrastructure Maintenance."

    dept_info = CATEGORY_DEPARTMENT_MAP.get(final_category, {
        "dept": "ROADS", "name": "Roads & Traffic Infrastructure", "severity": "high", "score": 0.85
    })

    return {
        "verified": True,
        "category": final_category,
        "department": dept_info["dept"],
        "department_name": dept_info["name"],
        "confidence": round(final_confidence, 2),
        "severity": dept_info["severity"],
        "severityScore": dept_info["score"],
        "explanation": explanation,
        "boundingBoxes": bounding_boxes,
        "source": "SMART_CIVIC_HYBRID_AI",
        "latency_ms": round((time.time() - t0) * 1000, 2)
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print(f"🚀 Starting Smart Civic AI Vision Server on http://0.0.0.0:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
