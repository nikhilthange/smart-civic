# 🏙️ Smart Civic AI Model Training & Inference Engine

This package contains everything needed to train, evaluate, and deploy a custom Computer Vision Object Detection Model on large-scale civic datasets (Potholes, Garbage Dumps, Open Manholes, Broken Streetlights, Waterlogging, Fallen Trees).

---

## 📁 Directory Structure

```text
smart-civic/ai_training/
├── Civic_Vision_Model_Training.ipynb   # 🚀 Google Colab / Kaggle 1-Click Training Notebook
├── train.py                            # Standalone Python training script (Local GPU / Cloud VM)
├── inference_server.py                 # FastAPI production microservice for real-time detection
├── data.yaml                           # YOLO dataset configuration template
└── README.md                           # This guide
```

---

## 🚀 Option 1: Train on Free Google Colab / Kaggle (Recommended)

1. Open [Google Colab](https://colab.research.google.com/).
2. Click **Upload** and upload `Civic_Vision_Model_Training.ipynb`.
3. In Colab menu, select **Runtime > Change runtime type > T4 GPU**.
4. Run all cells sequentially. The notebook will:
   - Check GPU and install dependencies.
   - Download public datasets (or let you upload custom data via Roboflow/Google Drive).
   - Train YOLOv8m with mixed-precision `fp16`, data augmentation, and AdamW.
   - Compute validation metrics ($mAP_{50}$, $mAP_{50-95}$, Confusion Matrix, PR curve).
   - Test sample predictions and export to `best.pt` and `best.onnx`.

---

## 💻 Option 2: Train Locally or on Cloud VM (AWS / RunPod)

### 1. Install Requirements
```bash
pip install ultralytics roboflow opencv-python-headless matplotlib fastapi uvicorn pydantic python-multipart
```

### 2. Configure Dataset in `data.yaml`
Ensure your dataset follows the YOLO layout:
```text
dataset/
├── images/train/
├── images/val/
├── labels/train/
└── labels/val/
```

### 3. Launch Training
```bash
python train.py --data data.yaml --epochs 50 --batch 16 --imgsz 640 --model yolov8m.pt --name civic_detector_v1
```

---

## ⚡ Production Serving via FastAPI Microservice

Once training is complete, place the generated `best.pt` (or `best.onnx`) in this folder and start the API server:

```bash
python inference_server.py
```

The server starts at `http://localhost:8000`:
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **Health Check**: `GET http://localhost:8000/health`
- **Grievance Detection**: `POST http://localhost:8000/api/v1/detect` (Accepts multipart form file)

### Example API Response:
```json
{
  "success": true,
  "count": 2,
  "inference_time_ms": 14.8,
  "detections": [
    {
      "category": "pothole",
      "class_id": 0,
      "confidence": 0.92,
      "bbox": [124.5, 340.2, 280.1, 460.8]
    },
    {
      "category": "garbage_overflow",
      "class_id": 1,
      "confidence": 0.87,
      "bbox": [450.0, 210.0, 600.0, 390.5]
    }
  ]
}
```

---

## 🔄 Integration with Smart Civic Node.js Backend

Your Node.js backend (`server/services/customAiEngine.js`) connects to `PYTHON_AI_URL="http://localhost:8000/api/v1/detect"` automatically. When citizens upload photos via the frontend, the image is passed to this vision engine for instant category classification and bounding-box verification.
