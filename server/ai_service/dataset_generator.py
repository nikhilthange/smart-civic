"""
Civic Complaint Dataset Generator & Synthetic Annotation Pipeline
Generates high-precision municipal classification datasets for all 10 BMC departments.
"""

import json
import os
import random

CIVIC_CATEGORIES = {
    "roads_and_infrastructure": {
        "department": "PWD",
        "default_severity": "high",
        "templates": [
            "Severe pothole on {street} causing vehicle damage and traffic congestion.",
            "Broken asphalt and road subsidence near {landmark}.",
            "Footpath tiles damaged and missing along {street}.",
            "Deep crater on the main road after monsoon rains.",
            "Dividers and road median broken near {landmark} creating hazard.",
            "Damaged speed breaker causing accidents on {street}."
        ]
    },
    "garbage_collection": {
        "department": "SWM",
        "default_severity": "medium",
        "templates": [
            "Overflowing garbage bin spreading foul smell outside {landmark}.",
            "Heaps of solid waste and plastic dumped on {street}.",
            "Garbage truck has not collected waste for 3 days near {street}.",
            "Commercial construction debris abandoned on sidewalk near {landmark}.",
            "Litter and wet waste dumped near residential area."
        ]
    },
    "storm_water_drains": {
        "department": "SWD",
        "default_severity": "high",
        "templates": [
            "Heavy waterlogging and blocked storm water drain at {street}.",
            "Monsoon rainwater overflow near {landmark} entering residential basements.",
            "Blocked nallah choking road traffic along {street}.",
            "Gutter overflowing during rains near {landmark}."
        ]
    },
    "water_and_sanitation": {
        "department": "WSD",
        "default_severity": "high",
        "templates": [
            "Main water supply pipeline burst and clean drinking water wasting on {street}.",
            "Sewage line leaking contaminated black water near {landmark}.",
            "Low water pressure and contaminated dirty water supply in ward.",
            "Underground pipe leak causing water stagnation on {street}."
        ]
    },
    "parks_and_recreation": {
        "department": "PRD",
        "default_severity": "medium",
        "templates": [
            "Fallen tree branch blocking traffic on {street}.",
            "Large banyan tree in danger of falling near {landmark}.",
            "Municipal park playground equipment broken and overgrown grass.",
            "Uprooted tree blocking pedestrian walkway on {street}."
        ]
    },
    "street_lighting": {
        "department": "ELD",
        "default_severity": "medium",
        "templates": [
            "Street lights not working for 4 consecutive poles on {street}.",
            "Exposed electrical wires dangling from lamp post near {landmark}.",
            "Completely dark street causing safety concern for pedestrians at night.",
            "Streetlight flickering and sparking during night hours."
        ]
    },
    "public_health": {
        "department": "PHD",
        "default_severity": "critical",
        "templates": [
            "Stagnant water breeding dengue and malaria mosquitoes near {landmark}.",
            "Dead animal on the roadside near {street} needing urgent sanitation removal.",
            "Severe bio-hazard waste dumped untreated behind {landmark}.",
            "Pest outbreak and unhygienic conditions near food market."
        ]
    },
    "licensing_and_encroachment": {
        "department": "LIC",
        "default_severity": "medium",
        "templates": [
            "Illegal hawkers and unauthorized stalls completely blocking footpath at {street}.",
            "Illegal temporary shed constructed on public walkway near {landmark}.",
            "Encroachment of shop extending 10 feet onto municipal road."
        ]
    },
    "illegal_construction": {
        "department": "LIC",
        "default_severity": "high",
        "templates": [
            "Unauthorized 3-floor building construction without BMC permission near {landmark}.",
            "Illegal pillar erection on government land at {street}.",
            "Demolition work ongoing without safety scaffolding causing dust and rubble."
        ]
    },
    "public_safety": {
        "department": "PSD",
        "default_severity": "critical",
        "templates": [
            "Open manhole with missing cover on busy {street} - fatal accident risk!",
            "Uncovered deep chamber hole right outside school near {landmark}.",
            "Collapsing boundary wall leaning towards footpath near {street}.",
            "Missing drainage metal grill leaving huge hole on road."
        ]
    }
}

STREETS = [
    "SV Road Andheri", "Linking Road Bandra", "LBS Marg Kurla", "MG Road Fort",
    "Gokhale Road Dadar", "Western Express Highway", "Eastern Express Highway",
    "Juhu Tara Road", "Hill Road Bandra", "Nepean Sea Road"
]

LANDMARKS = [
    "Metro Station Exit 2", "Municipal School No. 4", "Civil Hospital Gate",
    "Central Railway Crossing", "Public Garden Junction", "Local Market Area",
    "Bus Depot Entrance", "Police Station Signal"
]

def generate_dataset(num_samples_per_category=50, output_path="dataset.json"):
    data = []
    
    for category_key, meta in CIVIC_CATEGORIES.items():
        dept = meta["department"]
        default_sev = meta["default_severity"]
        templates = meta["templates"]
        
        for _ in range(num_samples_per_category):
            template = random.choice(templates)
            street = random.choice(STREETS)
            landmark = random.choice(LANDMARKS)
            
            text = template.format(street=street, landmark=landmark)
            
            # Severity detection
            text_lower = text.lower()
            if any(w in text_lower for w in ["fatal", "urgent", "critical", "danger", "burst", "open manhole"]):
                sev = "critical"
            elif any(w in text_lower for w in ["severe", "heavy", "damage", "accident"]):
                sev = "high"
            else:
                sev = default_sev

            data.append({
                "description": text,
                "category": category_key,
                "department": dept,
                "severity": sev,
                "verified": True
            })

    # Shuffle dataset
    random.shuffle(data)
    
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        
    print(f"Generated {len(data)} high-quality civic dataset samples at {output_path}")
    return data

if __name__ == "__main__":
    generate_dataset(num_samples_per_category=60, output_path=os.path.join(os.path.dirname(__file__), "dataset.json"))
