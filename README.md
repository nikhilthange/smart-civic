# Smart Civic AI — Next-Gen AI-Powered Municipal Grievance & SLA Management Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19.0-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.0-blue.svg)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Enterprise-47A248.svg)](https://www.mongodb.com/)

**Smart Civic AI** is an enterprise-grade municipal grievance redressal and SLA management platform designed for city governance authorities (such as the Brihanmumbai Municipal Corporation - BMC). Inspired by leading civic tech platforms including *SeeClickFix*, *Swachhata*, and *FixMyStreet*, Smart Civic AI automates ticket classification, spatial deduplication, ward-level governance leaderboards, and resolution verification.

---

## 🌟 Key Enterprise Features

### 1. 🤖 YOLOv8 Computer Vision & Gemini AI Auto-Classification
- **Automated Issue Detection**: Analyzes uploaded civic photos using computer vision models (YOLOv8 + Google Gemini AI) to verify issue legitimacy.
- **Smart Department Routing**: Auto-routes complaints to appropriate ward departments (Public Works, Water Supply, Solid Waste Management, Electricity) with confidence scoring and severity classification.

### 2. 📍 Spatial Auto-Deduplication Engine (20m Lat/Lng Radius)
- **Spatial Proximity Check**: Detects existing open complaints within a `0.0002°` (~20 meters) lat/lng radius.
- **Photo Linking & Upvoting**: Automatically links incoming photos to original tickets and increments `upvoteCount` and priority scores instead of creating duplicate tickets.

### 3. 🏆 Real-Time Ward Governance Scorecard & Leaderboards
- **Live SLA Performance Metrics**: Calculates real-time Ward Performance Scores based on % of tickets resolved within SLA deadline hours.
- **Ward Leaderboard Cards**: Ranks municipal wards (**Ward A**, **Ward H-West**, **Ward G-South**, **Ward K-East**) with color-coded status badges:
  - 🟢 **Green Badge**: `>90% SLA met` (Excellent)
  - 🟡 **Yellow Badge**: `70-90% SLA met` (Moderate)
  - 🔴 **Red Badge**: `<70% SLA met` (Action Required)

### 4. 🗺️ Interactive Public GIS Map View (`/map` & `/public-map`)
- **Leaflet OpenStreetMap Visualization**: Renders active civic tickets on an interactive GIS map layer.
- **Color-Coded Severity Pins**: Displays tickets as Red (Critical with animated pulse), Orange (High), Yellow (Medium), or Green (Low) markers.
- **Multi-Parameter Filtering**: Filter tickets by Category (Potholes, Waterlogging, Garbage), Status, Ward, or Severity.
- **Interactive Popups**: Click markers to view ticket details, category badges, and launch direct **"Track Complaint →"** links.

### 5. 🌐 Multilingual i18n Support & Web Speech Dictation
- **Tri-Language UI**: Full localization support for **English**, **हिंदी (Hindi)**, and **मराठी (Marathi)** via `i18next`.
- **Speech-to-Text Voice Input**: Integrated Web Speech API microphone dictation button in ticket creation to convert spoken voice notes into detailed description text.

### 6. 📄 Dynamic Executive PDF Ward Governance Report Generator
- **Vector PDF Exports**: Generates structured PDF audit reports using `jspdf` and `jspdf-autotable`.
- **Comprehensive Summary**: Includes Ward SLA Leaderboards, Category Volume Share tables, and Active Unresolved Critical Tickets.

### 7. 📸 Native & WebRTC Live Camera Capture with Timestamped Proof
- **WebRTC Camera Modal**: Captures ground photos directly from laptop/mobile webcams.
- **Timestamped Resolution Proof**: Allows field workers to upload resolution proof photos with automatically stamped date, time, and verification badges.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, TailwindCSS, Leaflet / OpenStreetMap, i18next, jsPDF, Recharts, Lucide Icons |
| **Backend** | Node.js, Express.js, MongoDB, Mongoose ODM, Security Stack (Helmet, Rate Limiter, MongoSanitize, HPP) |
| **AI / ML** | Python 3, PyTorch, Ultralytics YOLOv8, Google Gemini Pro Vision API |
| **Storage & Media**| Multer, Cloudinary API, Local File Storage Fallback |

---

## 📂 Repository Structure

```
smart-civic/
├── frontend/                     # React + TypeScript Frontend Client
│   ├── src/
│   │   ├── components/           # UI Components, Header, Camera Modal, VoiceInput
│   │   ├── context/              # Authentication & Global App Context
│   │   ├── i18n/                 # i18next Config (English, Hindi, Marathi)
│   │   ├── pages/                # AdminDashboard, ComplaintTracking, MapView, etc.
│   │   ├── services/             # Axios API Services (complaintApi, officerApi)
│   │   └── utils/                # PDF Report Generator Utility (jspdf)
│   ├── package.json
│   └── vite.config.ts
├── server/                       # Node.js Express REST API Backend
│   ├── ai_service/               # YOLOv8 & Computer Vision Model Runners
│   ├── config/                   # Database & Cloudinary Configurations
│   ├── controllers/              # Complaint, Admin, Analytics Controllers
│   ├── middlewares/              # Security, Auth, Upload Middlewares
│   ├── models/                   # Mongoose Schemas (Complaint, User, Department)
│   ├── routes/                   # API Route Declarations
│   ├── seed/                     # Seed Data Script (seedData.js)
│   └── index.js                  # Main Server Entry Point
└── README.md
```

---

## ⚡ Quickstart & Installation Guide

### Prerequisites
- **Node.js** v18.0 or higher
- **MongoDB** local instance (`mongodb://127.0.0.1:27017/smart-civic`) or MongoDB Atlas URI

### 1. Backend Server Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Configure environment variables (.env file created automatically or customize as needed)
# MONGO_URI=mongodb://127.0.0.1:27017/smart-civic
# PORT=5000
# JWT_SECRET=your_jwt_secret_here

# Seed initial demo database with users and BMC complaints
npm run seed

# Start API server
npm start
```

Backend server runs at: `http://localhost:5000`

---

### 2. Frontend Client Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Frontend application runs at: `http://localhost:5173`

---

## 🔑 Demo Access Credentials

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@bmc.gov.in` | `password123` | Full Command Centre, PDF Exports, Ward Scorecards |
| **Officer** | `officer@bmc.gov.in` | `password123` | Ward Governance, Ticket Assignment, SLA Escalate |
| **Worker** | `worker@bmc.gov.in` | `password123` | Field Worker Queue, Resolution Proof Photo Upload |
| **Citizen** | `citizen@bmc.gov.in` | `password123` | Create Complaint, Voice Input, 5-Step Stepper Tracking |

---

## 🛡️ Quality Audit & Verification Commands

To verify code quality and type safety across the project:

```bash
# Check Backend Node Syntax
node --check server/controllers/complaintController.js server/controllers/adminController.js server/routes/adminRoutes.js server/models/Complaint.js

# Check Frontend Oxlint Linter
cd frontend
npx oxlint src/pages/AdminDashboard.tsx src/pages/ComplaintTracking.tsx src/pages/MapView.tsx src/utils/pdfReportGenerator.ts
```

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.
