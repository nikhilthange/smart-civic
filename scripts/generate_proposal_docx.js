const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  Header,
  Footer,
} = require('docx');

async function generateProposalDocx() {
  const outputPath = path.resolve(__dirname, '..', 'docs', 'BMC_Smart_Civic_AI_Proposal_2026.docx');

  const borderThin = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
  };

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'Brihanmumbai Municipal Corporation (BMC) | Smart Civic AI Platform Dossier',
                    size: 17,
                    color: '64748B',
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.JUSTIFY,
                children: [
                  new TextRun({
                    text: 'CONFIDENTIAL & PROPRIETARY — TENDER & TECHNICAL WHITEPAPER REF: BMC/IT-CIVIC/2026/PROPOSAL-0419',
                    size: 16,
                    color: '94A3B8',
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Title
          new Paragraph({
            spacing: { before: 0, after: 100 },
            children: [
              new TextRun({
                text: 'MUNICIPAL PROJECT WHITEPAPER & OFFICIAL TENDER-READY PROPOSAL\n',
                bold: true,
                size: 24,
                color: '0369A1',
                font: 'Calibri',
              }),
              new TextRun({
                text: 'DEPLOYMENT OF SMART CIVIC AI PLATFORM (CITYOS)\nReal-Time Grievance Resolution & Ward Telemetry Across 24 Mumbai Wards (A to T)',
                bold: true,
                size: 32,
                color: '0F172A',
                font: 'Calibri',
              }),
            ],
          }),

          // Metadata Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 150, right: 150 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Target Municipal Authority:', bold: true, size: 19, color: '1E293B', font: 'Calibri' })] })],
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 150, right: 150 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Brihanmumbai Municipal Corporation (BMC), Mahapalika Marg, Mumbai - 400001', size: 19, color: '334155', font: 'Calibri' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 150, right: 150 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Core Architecture Scope:', bold: true, size: 19, color: '1E293B', font: 'Calibri' })] })],
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 150, right: 150 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'YOLOv8 Vision Intake, 24-Ward GeoJSON Routing, Ward Broadcast Pool Dispatch, AI Quality Gates & Real-Time WebSockets', size: 19, color: '334155', font: 'Calibri' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 150, right: 150 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Live Platform URL:', bold: true, size: 19, color: '1E293B', font: 'Calibri' })] })],
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 150, right: 150 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'https://smart-civic-pi.vercel.app', bold: true, size: 19, color: '0284C7', font: 'Calibri' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 150, right: 150 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Security Classification:', bold: true, size: 19, color: '1E293B', font: 'Calibri' })] })],
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 150, right: 150 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'OFFICIAL / ADMINISTRATIVE SENSITIVE | REF: BMC/IT-CIVIC/2026/PROPOSAL-0419', size: 19, color: '334155', font: 'Calibri' })] })],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { before: 200, after: 100 } }),

          // Section 1: Executive Summary
          new Paragraph({
            spacing: { before: 250, after: 120 },
            children: [
              new TextRun({
                text: '1. Executive Summary & Vision Statement',
                bold: true,
                size: 26,
                color: '0369A1',
                font: 'Calibri',
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: 'EFF6FF', type: ShadingType.CLEAR },
                    borders: {
                      left: { style: BorderStyle.SINGLE, size: 24, color: '2563EB' },
                      top: BorderStyle.NONE,
                      bottom: BorderStyle.NONE,
                      right: BorderStyle.NONE,
                    },
                    margins: { top: 140, bottom: 140, left: 200, right: 200 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: 'EXECUTIVE ABSTRACT\n',
                            bold: true,
                            size: 20,
                            color: '1D4ED8',
                            font: 'Calibri',
                          }),
                          new TextRun({
                            text: 'Smart Civic AI is a high-performance, real-time City Operating System (CityOS) engineered specifically for the Brihanmumbai Municipal Corporation (BMC). It replaces slow, error-prone manual triage with automated computer vision classification (YOLOv8 + NVIDIA NIM), spatial Point-in-Polygon 24-Ward routing, an open Ward Broadcast Pool for field worker task claiming, and strict AI-verified resolution quality gates that prevent fraudulent ticket closure.',
                            size: 19,
                            color: '1E3A8A',
                            font: 'Calibri',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Section 2: Core Engineering Capabilities
          new Paragraph({
            spacing: { before: 250, after: 120 },
            children: [
              new TextRun({
                text: '2. Detailed System Architecture & Implementation',
                bold: true,
                size: 26,
                color: '0369A1',
                font: 'Calibri',
              }),
            ],
          }),

          new Paragraph({
            spacing: { before: 60, after: 80 },
            children: [
              new TextRun({ text: 'A. Automated AI Vision Intake & Defect Classification:\n', bold: true, size: 20, color: '0F172A', font: 'Calibri' }),
              new TextRun({ text: 'Citizens report issues by capturing or uploading photos. The intake engine classifies complaints into municipal categories (Potholes, Solid Waste, Drainage, Street Lighting, Water Supply, Encroachment) with real-time confidence scores and automatic severity grading (Low, Medium, High, Critical).', size: 19, color: '334155', font: 'Calibri' }),
            ],
          }),

          new Paragraph({
            spacing: { before: 60, after: 80 },
            children: [
              new TextRun({ text: 'B. 24-Ward High-Precision Spatial Boundary Routing:\n', bold: true, size: 20, color: '0F172A', font: 'Calibri' }),
              new TextRun({ text: 'Using Ray-Casting Point-in-Polygon (PIP) algorithms over authentic GeoJSON polygon coordinates for all 24 BMC Administrative Wards (Ward A to Ward T), complaints are instantly mapped to the correct municipal ward office and department without manual officer intervention.', size: 19, color: '334155', font: 'Calibri' }),
            ],
          }),

          new Paragraph({
            spacing: { before: 60, after: 80 },
            children: [
              new TextRun({ text: 'C. Ward Broadcast Pool & Worker Self-Claim Workflow:\n', bold: true, size: 20, color: '0F172A', font: 'Calibri' }),
              new TextRun({ text: 'Rather than locking complaints to a single worker, open tickets are broadcast to the entire Ward Pool. All officers and field workers assigned to that ward can view open tickets in real time. Any worker can claim a task with a single tap (PUT /api/complaints/:id/accept-task), automatically transitioning status to In Progress, incrementing worker active counts, and notifying citizens and officers instantly.', size: 19, color: '334155', font: 'Calibri' }),
            ],
          }),

          new Paragraph({
            spacing: { before: 60, after: 80 },
            children: [
              new TextRun({ text: 'D. AI-Verified Resolution Quality Gatekeeper (Anti-Fraud):\n', bold: true, size: 20, color: '0F172A', font: 'Calibri' }),
              new TextRun({ text: 'A complaint remains strictly In Progress until an authentic, on-site resolution photo is uploaded. The AI Inspector analyzes pixel variance and re-classifies the scene. If the worker uploads the citizen\'s original defect photo, a black/obscured photo, or if the defect is still present, the system returns HTTP 422 with a specific rejection reason, requiring genuine on-site repair proof.', size: 19, color: '334155', font: 'Calibri' }),
            ],
          }),

          new Paragraph({
            spacing: { before: 60, after: 80 },
            children: [
              new TextRun({ text: 'E. Zero-Latency WebSocket Telemetry & Real-Time Push:\n', bold: true, size: 20, color: '0F172A', font: 'Calibri' }),
              new TextRun({ text: 'Built on native Socket.IO rooms (complaint:<id>, user:<citizenId>, ward:<wardName>), progress steps update in real time with haptic vibrations and animated live telemetry notifications without requiring a page reload.', size: 19, color: '334155', font: 'Calibri' }),
            ],
          }),

          new Paragraph({
            spacing: { before: 60, after: 80 },
            children: [
              new TextRun({ text: 'F. Traveling Salesperson Problem (TSP) Shift Route Optimizer:\n', bold: true, size: 20, color: '0F172A', font: 'Calibri' }),
              new TextRun({ text: 'Field workers can optimize their daily assigned repairs into the shortest driving circuit across Mumbai wards using Nearest-Neighbor and 2-Opt heuristics, complete with interactive Leaflet TSP route visualization.', size: 19, color: '334155', font: 'Calibri' }),
            ],
          }),

          new Paragraph({
            spacing: { before: 60, after: 80 },
            children: [
              new TextRun({ text: 'G. Civic Karma Reward Engine & Gamification:\n', bold: true, size: 20, color: '0F172A', font: 'Calibri' }),
              new TextRun({ text: 'Citizens earn +10 Civic Karma points for each verified issue reported, unlocking tiered badges (Citizen Contributor, Active Citizen, Ward Guardian) and redeeming municipal partner discount vouchers.', size: 19, color: '334155', font: 'Calibri' }),
            ],
          }),

          // Section 3: 4-Tier Role Architecture
          new Paragraph({
            spacing: { before: 250, after: 120 },
            children: [
              new TextRun({
                text: '3. 4-Tier Unified Role Hierarchy & Dashboards',
                bold: true,
                size: 26,
                color: '0369A1',
                font: 'Calibri',
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    shading: { fill: '1E3A8A', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 120, bottom: 120, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Role / Portal', bold: true, size: 20, color: 'FFFFFF', font: 'Calibri' })] })],
                  }),
                  new TableCell({
                    width: { size: 75, type: WidthType.PERCENTAGE },
                    shading: { fill: '1E3A8A', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 120, bottom: 120, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Key Capabilities & Workflows', bold: true, size: 20, color: 'FFFFFF', font: 'Calibri' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: '1. Citizen', bold: true, size: 19, color: '0F172A', font: 'Calibri' })] })],
                  }),
                  new TableCell({
                    shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Quick Snap reporting, Marathi/Hindi/English voice input, live GPS map explorer, real-time ticket tracking timeline with before/after resolution diff slider, and Civic Karma vouchers.', size: 19, color: '334155', font: 'Calibri' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: '2. Field Worker', bold: true, size: 19, color: '0F172A', font: 'Calibri' })] })],
                  }),
                  new TableCell({
                    shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Ward Open Pool tab for 1-tap task claiming, My Active Repairs queue, TSP shift route optimization, live turn-by-turn GPS navigation, low-bandwidth image compressor, offline queue sync, and AI-inspected resolution proof submission.', size: 19, color: '334155', font: 'Calibri' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: '3. Ward Officer', bold: true, size: 19, color: '0F172A', font: 'Calibri' })] })],
                  }),
                  new TableCell({
                    shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Ward control desk with real-time grievance triage, SLA countdown timers, dynamic department filtering, Monsoon flood radar monitoring, and manual worker dispatch overrides.', size: 19, color: '334155', font: 'Calibri' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: '4. Executive Admin', bold: true, size: 19, color: '0F172A', font: 'Calibri' })] })],
                  }),
                  new TableCell({
                    shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'City-wide Command Center, 24-Ward GIS heatmaps, interactive Admin Data Studio for SQL/aggregate analytics, contractor scorecards, and tamper-evident audit ledger.', size: 19, color: '334155', font: 'Calibri' })] })],
                  }),
                ],
              }),
            ],
          }),

          // Section 4: Technology Stack
          new Paragraph({
            spacing: { before: 250, after: 120 },
            children: [
              new TextRun({
                text: '4. Technology Stack & Enterprise Resilience',
                bold: true,
                size: 26,
                color: '0369A1',
                font: 'Calibri',
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { fill: '0F766E', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Layer', bold: true, size: 20, color: 'FFFFFF', font: 'Calibri' })] })],
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    shading: { fill: '0F766E', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Implemented Technology & Framework', bold: true, size: 20, color: 'FFFFFF', font: 'Calibri' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: borderThin, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: 'Frontend UI', bold: true, size: 19, font: 'Calibri' })] })] }),
                  new TableCell({ borders: borderThin, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: 'React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide Icons, PWA Service Worker', size: 19, font: 'Calibri' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: borderThin, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: 'Backend API', bold: true, size: 19, font: 'Calibri' })] })] }),
                  new TableCell({ borders: borderThin, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: 'Node.js, Express, Socket.IO, Helmet, Express-Rate-Limit, Compression, Morgan', size: 19, font: 'Calibri' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: borderThin, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: 'Database & Storage', bold: true, size: 19, font: 'Calibri' })] })] }),
                  new TableCell({ borders: borderThin, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: 'MongoDB (Mongoose ODM with 2dsphere indexing & exponential connection retry loop), Local Upload Storage with auto-initialization', size: 19, font: 'Calibri' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: borderThin, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: 'AI & Vision Pipeline', bold: true, size: 19, font: 'Calibri' })] })] }),
                  new TableCell({ borders: borderThin, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: 'YOLOv8 + NVIDIA NIM / TensorRT, Sharp pixel variance inspection, and Gemini AI analysis', size: 19, font: 'Calibri' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: borderThin, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: 'GIS & Mapping', bold: true, size: 19, font: 'Calibri' })] })] }),
                  new TableCell({ borders: borderThin, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: 'Leaflet, MarkerCluster, OpenStreetMap Tiles, Mumbai 24-Ward Polygon GeoJSON', size: 19, font: 'Calibri' })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: borderThin, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: 'Authentication & Push', bold: true, size: 19, font: 'Calibri' })] })] }),
                  new TableCell({ borders: borderThin, margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: 'JWT Bearer Authentication, Firebase Auth & Firebase Cloud Messaging (FCM)', size: 19, font: 'Calibri' })] })] }),
                ],
              }),
            ],
          }),

          // Section 5: Pilot Proposal & Contact
          new Paragraph({
            spacing: { before: 250, after: 120 },
            children: [
              new TextRun({
                text: '5. Proposed Pilot Deployment & Demonstration Access',
                bold: true,
                size: 26,
                color: '0369A1',
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 60, after: 80 },
            children: [
              new TextRun({
                text: 'An immediate 30-day zero-risk trial is recommended across high-density pilot wards: Ward G-North (Dadar / Dharavi) and Ward H-West (Bandra / Khar), validating sub-30-second automated triage, 0% duplicate ticket leaks, and real-time field task claiming.',
                size: 20,
                color: '334155',
                font: 'Calibri',
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 140, bottom: 140, left: 200, right: 200 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'OFFICIAL SYSTEM DEMONSTRATION ACCESS\n', bold: true, size: 20, color: '0F172A', font: 'Calibri' }),
                          new TextRun({ text: 'Live Web App: ', bold: true, size: 19, color: '0284C7', font: 'Calibri' }),
                          new TextRun({ text: 'https://smart-civic-pi.vercel.app\n', size: 19, color: '0284C7', font: 'Calibri' }),
                          new TextRun({ text: 'Municipal Architecture Liaison: Municipal Solutions Architecture Group, Fort HQ, Mumbai - 400001\n', size: 18, color: '475569', font: 'Calibri' }),
                          new TextRun({ text: 'Direct Reference: BMC/IT-CIVIC/2026/PROPOSAL-0419', size: 18, color: '475569', font: 'Calibri' }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log('Successfully generated updated DOCX proposal at:', outputPath);
}

generateProposalDocx().catch(err => {
  console.error('Error generating docx:', err);
  process.exit(1);
});
