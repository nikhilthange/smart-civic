#!/usr/bin/env python3
"""
Smart Civic Vision Model Training Pipeline
Framework: Ultralytics YOLOv8 / YOLO11
Optimized for: NVIDIA T4 / A100 / RTX GPUs
"""

import argparse
import os
import sys
import torch
from ultralytics import YOLO


def parse_args():
    parser = argparse.ArgumentParser(description="Train Custom Vision Model for Smart Civic")
    parser.add_argument("--data", type=str, default="pothole.yaml", help="Path to data config or built-in dataset (e.g., pothole.yaml, data.yaml)")
    parser.add_argument("--model", type=str, default="yolov8m.pt", help="Base model weights (yolov8n.pt, yolov8s.pt, yolov8m.pt, yolov11m.pt)")
    parser.add_argument("--epochs", type=int, default=50, help="Number of training epochs")
    parser.add_argument("--batch", type=int, default=16, help="Batch size (reduce if GPU OOM)")
    parser.add_argument("--imgsz", type=int, default=640, help="Image resolution")
    parser.add_argument("--device", type=str, default="0" if torch.cuda.is_available() else "cpu", help="CUDA device index or 'cpu'")
    parser.add_argument("--project", type=str, default="civic_vision_runs", help="Project directory")
    parser.add_argument("--name", type=str, default="yolov8m_civic_detector", help="Experiment name")
    parser.add_argument("--patience", type=int, default=15, help="Early stopping patience")
    parser.add_argument("--export-onnx", action="store_true", help="Export best weights to ONNX format after training")
    return parser.parse_args()


def main():
    args = parse_args()

    print("=" * 70)
    print("🚀 SMART CIVIC AI VISION TRAINING PIPELINE")
    print("=" * 70)
    print(f"• PyTorch Version : {torch.__version__}")
    print(f"• CUDA Available  : {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"• GPU Device Name : {torch.cuda.get_device_name(0)}")
    print(f"• Base Model      : {args.model}")
    print(f"• Dataset Config  : {args.data}")
    print(f"• Epochs          : {args.epochs}")
    print(f"• Batch Size      : {args.batch}")
    print(f"• Image Size      : {args.imgsz}")
    print(f"• Training Device : {args.device}")
    print("=" * 70)

    if not os.path.exists(args.data):
        print(f"❌ Error: Dataset config '{args.data}' not found!")
        sys.exit(1)

    # 1. Load Model
    print(f"\n[1/4] Initializing base weights from {args.model}...")
    model = YOLO(args.model)

    # 2. Train Model
    print("\n[2/4] Starting training loop with mixed precision & augmentations...")
    results = model.train(
        data=args.data,
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        device=args.device,
        workers=4,
        patience=args.patience,
        save=True,
        optimizer="AdamW",
        lr0=0.001,
        lrf=0.01,
        augment=True,
        mosaic=1.0,
        mixup=0.1,
        project=args.project,
        name=args.name
    )

    # 3. Validate Model
    print("\n[3/4] Evaluating model performance on validation set...")
    metrics = model.val()
    print("--------------------------------------------------")
    print(f"✅ Training Completed Successfully!")
    print(f"• Validation mAP@50    : {metrics.box.map50:.4f}")
    print(f"• Validation mAP@50-95 : {metrics.box.map:.4f}")
    print(f"• Checkpoint weights   : {os.path.join(args.project, args.name, 'weights', 'best.pt')}")
    print("--------------------------------------------------")

    # 4. Optional ONNX Export
    if args.export_onnx:
        print("\n[4/4] Exporting model to ONNX format...")
        onnx_file = model.export(format="onnx", dynamic=True, simplify=True)
        print(f"✅ ONNX Exported: {onnx_file}")


if __name__ == "__main__":
    main()
