"""
High-Precision NLP Classifier Trainer for Civic Complaint Routing
Trains a TF-IDF + Calibrated Multi-Class Classifier and exports model artifacts.
"""

import json
import os
import pickle
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score
from dataset_generator import generate_dataset

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_FILE = os.path.join(BASE_DIR, "dataset.json")
MODEL_EXPORT_FILE = os.path.join(BASE_DIR, "civic_nlp_pipeline.pkl")

def train_nlp_model():
    # Ensure dataset exists
    if not os.path.exists(DATASET_FILE):
        print("Dataset not found. Generating fresh dataset...")
        generate_dataset(num_samples_per_category=80, output_path=DATASET_FILE)

    with open(DATASET_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    texts = [item["description"] for item in data]
    categories = [item["category"] for item in data]
    departments = [item["department"] for item in data]
    
    print(f"Loaded {len(texts)} samples for training.")

    # Build High-Precision TF-IDF + Logistic Regression Pipeline
    category_pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 3), max_features=5000, sublinear_tf=True)),
        ("clf", LogisticRegression(C=10.0, max_iter=1000, class_weight="balanced"))
    ])

    # Train category classifier
    category_pipeline.fit(texts, categories)
    cat_preds = category_pipeline.predict(texts)
    cat_acc = accuracy_score(categories, cat_preds)
    print(f"Category Classifier Training Accuracy: {cat_acc * 100:.2f}%")

    # Build Department classifier
    dept_pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 3), max_features=5000, sublinear_tf=True)),
        ("clf", LogisticRegression(C=10.0, max_iter=1000, class_weight="balanced"))
    ])
    dept_pipeline.fit(texts, departments)
    dept_preds = dept_pipeline.predict(texts)
    dept_acc = accuracy_score(departments, dept_preds)
    print(f"Department Classifier Training Accuracy: {dept_acc * 100:.2f}%")

    # Export unified model artifact
    model_artifact = {
        "category_pipeline": category_pipeline,
        "dept_pipeline": dept_pipeline,
        "classes": list(set(categories)),
        "departments": list(set(departments)),
        "accuracy": float(dept_acc)
    }

    with open(MODEL_EXPORT_FILE, "wb") as f:
        pickle.dump(model_artifact, f)

    print(f"Exported trained civic model pipeline to {MODEL_EXPORT_FILE}")
    return model_artifact

if __name__ == "__main__":
    train_nlp_model()
