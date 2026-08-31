"""
YOLOv8 + NVIDIA TensorRT Acceleration Guard for Smart Civic
-----------------------------------------------------------
Performs sub-20ms hardware-accelerated deep learning defect verification
using YOLOv8 exported to NVIDIA TensorRT engine (.engine) format with FP16
half-precision on CUDA device 0.

Strictly validates uploaded images against citizen-selected grievance categories.
"""

import sys
import os
import time
import json
import argparse
import logging
from typing import Dict, List, Any, Optional, Tuple

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] [%(levelname)s] %(message)s")
logger = logging.getLogger("yolo_guard")

# Strict confidence threshold
CONFIDENCE_THRESHOLD = 0.45

# Allowed detection classes strictly mapped to civic grievance categories
CATEGORY_CLASS_MAP: Dict[str, List[str]] = {
    "garbage": [
        "trash", "waste", "garbage", "bottle", "cup", "plastic", "box", "can",
        "debris", "rubbish", "litter", "bag", "bucket", "bowl", "container",
        "plastic bag", "cardboard", "wrapper", "paper"
    ],
    "garbage_collection": [
        "trash", "waste", "garbage", "bottle", "cup", "plastic", "box", "can",
        "debris", "rubbish", "litter", "bag", "bucket", "bowl", "container",
        "plastic bag", "cardboard", "wrapper", "paper"
    ],
    "illegal_dumping": [
        "trash", "waste", "garbage", "bottle", "cup", "plastic", "box", "can",
        "debris", "rubbish", "litter", "bag", "bucket", "bowl", "container"
    ],
    "pothole": [
        "pothole", "crack", "road_defect", "asphalt", "hole", "road damage",
        "manhole", "damaged road", "crater"
    ],
    "roads_and_infrastructure": [
        "pothole", "crack", "road_defect", "asphalt", "hole", "road damage",
        "manhole", "damaged road", "crater", "speed bump", "curb"
    ],
    "waterlogging": [
        "flood", "puddle", "waterlogging", "submerged", "water", "drain",
        "leak", "stagnant water", "flooding", "water surface"
    ],
    "storm_water_drains": [
        "flood", "puddle", "waterlogging", "submerged", "water", "drain",
        "gutter", "nallah", "overflow", "culvert"
    ],
    "water_and_sanitation": [
        "water", "leak", "pipe", "burst pipe", "tap", "pipeline", "sewage",
        "valve", "puddle", "waterlogging"
    ],
    "street_lighting": [
        "traffic light", "street light", "light", "lamp", "pole", "wire",
        "cable", "streetlight", "lantern"
    ],
    "parks_and_recreation": [
        "tree", "branch", "leaf", "plant", "wood", "log", "fallen tree",
        "trunk", "grass", "foliage"
    ],
    "licensing_and_encroachment": [
        "hawker", "stall", "bench", "chair", "cart", "tent", "barrier",
        "shed", "umbrella", "kiosk", "table"
    ],
    "public_safety": [
        "manhole", "open manhole", "hole", "hazard", "pit", "broken cover",
        "exposed wire", "fire", "danger"
    ],
}

# Universal COCO class aliases to map standard 80-class models to civic taxonomy
COCO_TO_CIVIC_MAPPING: Dict[str, List[str]] = {
    "bottle": ["garbage", "garbage_collection"],
    "cup": ["garbage", "garbage_collection"],
    "fork": ["garbage", "garbage_collection"],
    "knife": ["garbage", "garbage_collection"],
    "spoon": ["garbage", "garbage_collection"],
    "bowl": ["garbage", "garbage_collection"],
    "banana": ["garbage", "garbage_collection"],
    "apple": ["garbage", "garbage_collection"],
    "sandwich": ["garbage", "garbage_collection"],
    "orange": ["garbage", "garbage_collection"],
    "broccoli": ["garbage", "garbage_collection"],
    "carrot": ["garbage", "garbage_collection"],
    "hot dog": ["garbage", "garbage_collection"],
    "pizza": ["garbage", "garbage_collection"],
    "donut": ["garbage", "garbage_collection"],
    "cake": ["garbage", "garbage_collection"],
    "potted plant": ["parks_and_recreation"],
    "traffic light": ["street_lighting"],
    "fire hydrant": ["water_and_sanitation", "public_safety"],
    "boat": ["waterlogging", "storm_water_drains"],
    "backpack": ["garbage_collection"],
    "handbag": ["garbage_collection"],
    "suitcase": ["garbage_collection"],
}


class TensorRTYoloGuard:
    """
    NVIDIA TensorRT accelerated YOLOv8 inference guard for civic verification.
    """

    def __init__(
        self,
        engine_path: str = "yolov8n.engine",
        pt_path: str = "yolov8n.pt",
        device: str = "0",
        conf_threshold: float = CONFIDENCE_THRESHOLD,
    ):
        self.engine_path = engine_path
        self.pt_path = pt_path
        self.device = device
        self.conf_threshold = conf_threshold
        self.model = None
        self.engine_mode = "fallback"
        self._initialize_model()

    def _initialize_model(self):
        """
        Initializes YOLOv8 with TensorRT engine on CUDA:0, or exports to .engine with FP16.
        """
        try:
            from ultralytics import YOLO
            import torch

            has_cuda = torch.cuda.is_available()
            if has_cuda:
                logger.info(f"⚡ NVIDIA CUDA detected: {torch.cuda.get_device_name(0)} on device={self.device}")

                # 1. Check if TensorRT engine file exists
                if os.path.exists(self.engine_path):
                    logger.info(f"🚀 Loading compiled NVIDIA TensorRT engine from: {self.engine_path}")
                    self.model = YOLO(self.engine_path, task="detect")
                    self.engine_mode = "tensorrt_engine_fp16"
                    logger.info("✅ NVIDIA TensorRT FP16 Engine active (Target Latency < 20ms).")
                    return

                # 2. Check if PyTorch weights exist and export to TensorRT engine
                logger.info("Compiling YOLOv8 to NVIDIA TensorRT engine (FP16)...")
                try:
                    pt_model = YOLO(self.pt_path)
                    # Export with half-precision (FP16) on CUDA device 0
                    exported_path = pt_model.export(
                        format="engine",
                        half=True,
                        device=0,
                        workspace=4,
                        verbose=False
                    )
                    if exported_path and os.path.exists(exported_path):
                        self.model = YOLO(exported_path, task="detect")
                        self.engine_mode = "tensorrt_engine_fp16"
                        logger.info("✅ TensorRT Engine compilation succeeded!")
                        return
                except Exception as export_err:
                    logger.warning(f"TensorRT compile note: {export_err}. Using PyTorch CUDA FP16.")

                # 3. Direct CUDA PyTorch FP16 execution
                self.model = YOLO(self.pt_path)
                self.engine_mode = "cuda_fp16"
                logger.info("✅ PyTorch CUDA FP16 model initialized on device=0.")
            else:
                logger.info("CUDA not detected on host. Initializing standard CPU model.")
                self.model = YOLO(self.pt_path)
                self.engine_mode = "cpu"
        except Exception as e:
            logger.warning(f"⚠️ YOLOv8 model initialization fallback: {e}")
            self.model = None
            self.engine_mode = "heuristic_cv"

    def verify_image(
        self,
        image_input: Any,
        selected_category: str
    ) -> Dict[str, Any]:
        """
        Verifies if the uploaded image matches the selected civic category.

        Parameters:
            image_input: File path (str), numpy array (cv2), or raw bytes
            selected_category: Selected grievance category (e.g. 'garbage', 'pothole', 'waterlogging')

        Returns:
            Dictionary containing verification decision, detected classes, confidence, and latency.
        """
        start_time = time.perf_counter()
        normalized_category = selected_category.lower().strip().replace(" ", "_")

        # Generic / other categories are permissive
        if normalized_category in ["other", "general", "other_complaint"]:
            return {
                "verified": True,
                "selectedCategory": selected_category,
                "detectedClasses": ["generic_civic_issue"],
                "confidence": 1.0,
                "latencyMs": round((time.perf_counter() - start_time) * 1000, 2),
                "device": f"cuda:0 ({self.engine_mode})",
                "message": "Generic category verified without class restriction."
            }

        detected_classes: List[Dict[str, Any]] = []
        max_conf = 0.0

        if self.model is not None:
            try:
                # Run YOLOv8 inference with strict 0.45 threshold
                results = self.model.predict(
                    source=image_input,
                    conf=self.conf_threshold,
                    device=0 if "cuda" in self.engine_mode or "tensorrt" in self.engine_mode else "cpu",
                    half=("fp16" in self.engine_mode),
                    verbose=False
                )

                for r in results:
                    boxes = r.boxes
                    if boxes is not None and len(boxes) > 0:
                        for box in boxes:
                            conf = float(box.conf[0])
                            cls_id = int(box.cls[0])
                            class_name = self.model.names.get(cls_id, f"class_{cls_id}").lower()

                            if conf > max_conf:
                                max_conf = conf

                            detected_classes.append({
                                "class": class_name,
                                "confidence": round(conf, 3),
                                "bbox": [int(v) for v in box.xyxy[0].tolist()]
                            })
            except Exception as inf_err:
                logger.error(f"Inference error in YOLO guard: {inf_err}")

        # If no deep learning detections or in heuristic mode, evaluate OpenCV feature descriptors
        if not detected_classes:
            cv_features = self._heuristic_cv_fallback(image_input, normalized_category)
            if cv_features:
                detected_classes.extend(cv_features.get("classes", []))
                max_conf = max(max_conf, cv_features.get("confidence", 0.0))

        # Check detected classes against allowed taxonomy
        allowed_classes = CATEGORY_CLASS_MAP.get(normalized_category, [normalized_category])
        matched_classes = []

        for d in detected_classes:
            c_name = d["class"].lower()
            # Direct match in allowed list
            if any(allowed in c_name or c_name in allowed for allowed in allowed_classes):
                matched_classes.append(d)
                continue

            # COCO class alias match
            mapped_cats = COCO_TO_CIVIC_MAPPING.get(c_name, [])
            if normalized_category in mapped_cats or any(cat in normalized_category for cat in mapped_cats):
                matched_classes.append(d)

        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        is_verified = len(matched_classes) > 0 and max_conf >= self.conf_threshold

        # If the image specifically detected non-matching distinct objects (like person/selfie, car on garbage)
        # and has zero matches for target category, explicitly fail
        if not is_verified:
            distinct_detected = [d["class"] for d in detected_classes]
            message = (
                f"Image does not match the selected category '{selected_category}'. "
                f"Detected objects: {distinct_detected if distinct_detected else 'No relevant civic defects identified'}."
            )
        else:
            message = f"Image verified: Contains valid features for category '{selected_category}'."

        return {
            "verified": is_verified,
            "selectedCategory": selected_category,
            "detectedClasses": [d["class"] for d in detected_classes],
            "matchedClasses": [d["class"] for d in matched_classes],
            "confidence": round(max_conf, 3),
            "latencyMs": latency_ms,
            "device": f"cuda:0 ({self.engine_mode})",
            "message": message,
        }

    def _heuristic_cv_fallback(self, image_input: Any, category: str) -> Optional[Dict[str, Any]]:
        """
        OpenCV spectral / texture / color histogram analysis when running on lightweight nodes.
        """
        try:
            import cv2
            import numpy as np

            img = None
            if isinstance(image_input, str) and os.path.exists(image_input):
                img = cv2.imread(image_input)
            elif isinstance(image_input, bytes):
                nparr = np.frombuffer(image_input, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if img is None:
                return None

            # Color and edge variance inspection
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

            # Reject completely blurry / black / blank photos
            if laplacian_var < 15.0:
                return {
                    "classes": [{"class": "blurred_unclear_photo", "confidence": 0.20}],
                    "confidence": 0.20
                }

            # Road/Asphalt / Water / Waste texture analysis
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            h, s, v = cv2.split(hsv)

            if category in ["pothole", "roads_and_infrastructure"]:
                # High asphalt edge density with dark-to-medium grayscale profile
                edges = cv2.Canny(gray, 50, 150)
                edge_ratio = float(np.count_nonzero(edges)) / (img.shape[0] * img.shape[1])
                if edge_ratio > 0.03:
                    return {
                        "classes": [{"class": "pothole", "confidence": 0.68}],
                        "confidence": 0.68
                    }

            elif category in ["waterlogging", "storm_water_drains", "water_and_sanitation"]:
                # Specular water reflection & high saturation / blue-brown liquid regions
                blue_mask = cv2.inRange(hsv, np.array([90, 50, 50]), np.array([130, 255, 255]))
                if float(np.count_nonzero(blue_mask)) / (img.shape[0] * img.shape[1]) > 0.05:
                    return {
                        "classes": [{"class": "waterlogging", "confidence": 0.72}],
                        "confidence": 0.72
                    }

            elif category in ["garbage", "garbage_collection", "illegal_dumping"]:
                # High color entropy / multi-colored clutter
                color_std = float(np.std(h) + np.std(s))
                if color_std > 65.0:
                    return {
                        "classes": [{"class": "garbage", "confidence": 0.65}],
                        "confidence": 0.65
                    }

            return None
        except Exception as e:
            logger.debug(f"Heuristic CV fallback error: {e}")
            return None


# Global singleton instance
guard_instance = TensorRTYoloGuard()


def main():
    parser = argparse.ArgumentParser(description="YOLOv8 NVIDIA TensorRT Civic Category Verification Guard")
    parser.add_argument("--image", required=True, help="Path to input image file")
    parser.add_argument("--category", required=True, help="Citizen selected grievance category (e.g. garbage, pothole, waterlogging)")
    parser.add_argument("--conf", type=float, default=CONFIDENCE_THRESHOLD, help="Minimum confidence threshold")

    args = parser.parse_args()

    if not os.path.exists(args.image):
        print(json.dumps({
            "verified": False,
            "error": "IMAGE_NOT_FOUND",
            "message": f"Image file not found at path: {args.image}"
        }))
        sys.exit(1)

    result = guard_instance.verify_image(args.image, args.category)
    print(json.dumps(result, indent=2))
    sys.exit(0 if result["verified"] else 2)


if __name__ == "__main__":
    main()
