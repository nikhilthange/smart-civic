const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  Header,
  Footer,
  PageNumber
} = require('docx');

async function generateProposalDocx() {
  const outputPath = path.resolve(__dirname, '..', 'docs', 'BMC_Smart_Civic_AI_Proposal_2026.docx');

  const borderNone = {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  };

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
              top: 1440, // 1 inch
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
          // Header / Title
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
                text: 'DEPLOYMENT OF SMART CIVIC AI PLATFORM (CITYOS)\nAcross 24 Administrative Wards (A to T)',
                bold: true,
                size: 34,
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
                    children: [new Paragraph({ children: [new TextRun({ text: 'Brihanmumbai Municipal Corporation (BMC), Fort HQ, Mumbai - 400001', size: 19, color: '334155', font: 'Calibri' })] })],
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
                    children: [new Paragraph({ children: [new TextRun({ text: 'Subject Matter:', bold: true, size: 19, color: '1E293B', font: 'Calibri' })] })],
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 150, right: 150 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'AI Grievance Triage, GPS Geofenced Telemetry, and Ward SLA Governance', size: 19, color: '334155', font: 'Calibri' })] })],
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
                    children: [new Paragraph({ children: [new TextRun({ text: 'Live Demonstration URL:', bold: true, size: 19, color: '1E293B', font: 'Calibri' })] })],
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

          // Section 1: Executive Briefing
          new Paragraph({
            spacing: { before: 250, after: 120 },
            children: [
              new TextRun({
                text: '1. Official Header & Executive Briefing',
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
                            text: 'Smart Civic AI transforms Mumbai\'s grievance management from a slow, retrospective ticketing portal into a real-time, AI-orchestrated City Operating System (CityOS). Built with edge YOLOv8 computer vision, Marathi/Hindi Web Audio voice parsing, hardware-level GPS coordinate locking, and SHA-256 chained audit logs, the platform eliminates contractor fraud while ensuring sub-second response times.',
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
          new Paragraph({
            spacing: { before: 140, after: 100 },
            children: [
              new TextRun({
                text: 'This proposal is formally addressed to the Municipal Commissioner, Additional Municipal Commissioners, Chief Information Officer (CIO), and Ward Executive Engineers across all 24 administrative wards (A to T) of the Brihanmumbai Municipal Corporation.',
                size: 20,
                color: '334155',
                font: 'Calibri',
              }),
            ],
          }),

          // Section 2: Root-Cause Analysis
          new Paragraph({
            spacing: { before: 250, after: 120 },
            children: [
              new TextRun({
                text: '2. Root-Cause Analysis of Mumbai\'s Civic Grievance Gaps',
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
              new TextRun({ text: '• Volume & Triage Bottleneck: ', bold: true, size: 20, color: '0F172A', font: 'Calibri' }),
              new TextRun({ text: 'During peak monsoon surges, complaint volumes rise by 420% exceeding 15,000 daily tickets. Over 68% are spatial duplicates of the same hazard, choking Ward Control Rooms.', size: 20, color: '334155', font: 'Calibri' }),
            ],
          }),
          new Paragraph({
            spacing: { before: 60, after: 80 },
            children: [
              new TextRun({ text: '• Ghost Repairs & Telemetry Gaps: ', bold: true, size: 20, color: '0F172A', font: 'Calibri' }),
              new TextRun({ text: 'Legacy portals permit contractor ticket closures without verified GPS coordinates or real-time camera proof, leading to fraudulent payouts.', size: 20, color: '334155', font: 'Calibri' }),
            ],
          }),
          new Paragraph({
            spacing: { before: 60, after: 80 },
            children: [
              new TextRun({ text: '• Static SLA Drift: ', bold: true, size: 20, color: '0F172A', font: 'Calibri' }),
              new TextRun({ text: 'Life-threatening hazards (open manholes, pipeline ruptures) share the same static 48-72h SLA as cosmetic defects without dynamic auto-escalation.', size: 20, color: '334155', font: 'Calibri' }),
            ],
          }),
          new Paragraph({
            spacing: { before: 60, after: 80 },
            children: [
              new TextRun({ text: '• Vernacular & Digital Friction: ', bold: true, size: 20, color: '0F172A', font: 'Calibri' }),
              new TextRun({ text: 'Lack of native Marathi/Hindi voice intake creates barrier to reporting for transit workers, blue-collar citizens, and senior citizens.', size: 20, color: '334155', font: 'Calibri' }),
            ],
          }),

          // Section 3: Architecture Table
          new Paragraph({
            spacing: { before: 250, after: 120 },
            children: [
              new TextRun({
                text: '3. The Proposed Solution: 4-Tier Unified Role Architecture',
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
                    shading: { fill: '1E3A8A', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 120, bottom: 120, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Administrative Tier', bold: true, size: 20, color: 'FFFFFF', font: 'Calibri' })] })],
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    shading: { fill: '1E3A8A', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 120, bottom: 120, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Key Operational Capabilities & Controls', bold: true, size: 20, color: 'FFFFFF', font: 'Calibri' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Tier 1: Citizens & RWAs', bold: true, size: 19, color: '0F172A', font: 'Calibri' })] })],
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: '1-click filing, Web Audio Marathi/Hindi/English voice notes, live ticket status timeline, and Civic Karma engagement credits.', size: 19, color: '334155', font: 'Calibri' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Tier 2: Field Contractors', bold: true, size: 19, color: '0F172A', font: 'Calibri' })] })],
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Mandatory 50m GPS geofenced task queue, before/after camera locking (zero gallery uploads), offline SQLite sync.', size: 19, color: '334155', font: 'Calibri' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Tier 3: Ward Officers', bold: true, size: 19, color: '0F172A', font: 'Calibri' })] })],
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Live SLA countdown radar, contractor scorecards, 1-click MMC Act notices (Section 354, 314, Clause 18.4) with SHA-256 seal.', size: 19, color: '334155', font: 'Calibri' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Tier 4: Commissioners HQ', bold: true, size: 19, color: '0F172A', font: 'Calibri' })] })],
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'City-wide GIS heatmaps, 3D hydrological runoff digital twin, green bond CapEx ledger, and automated disaster protocols.', size: 19, color: '334155', font: 'Calibri' })] })],
                  }),
                ],
              }),
            ],
          }),

          // Section 4: Security & Compliance
          new Paragraph({
            spacing: { before: 250, after: 120 },
            children: [
              new TextRun({
                text: '4. Sovereign Data Security, Legal Compliance & Audit Trails',
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
              new TextRun({ text: '• DPDPA 2023 Compliance: ', bold: true, size: 20, color: '0F172A', font: 'Calibri' }),
              new TextRun({ text: 'Strict data minimization, ephemeral telemetry storage, and citizen PII hashing (+91 98****1234).', size: 20, color: '334155', font: 'Calibri' }),
            ],
          }),
          new Paragraph({
            spacing: { before: 60, after: 80 },
            children: [
              new TextRun({ text: '• MeitY Empanelled Cloud: ', bold: true, size: 20, color: '0F172A', font: 'Calibri' }),
              new TextRun({ text: '100% Indian data sovereignty (AWS Mumbai ap-south-1 / NIC Cloud) with AES-256-GCM rest and TLS 1.3 transit encryption.', size: 20, color: '334155', font: 'Calibri' }),
            ],
          }),
          new Paragraph({
            spacing: { before: 60, after: 80 },
            children: [
              new TextRun({ text: '• SHA-256 Audit Trail: ', bold: true, size: 20, color: '0F172A', font: 'Calibri' }),
              new TextRun({ text: 'Cryptographically sealed ledger for every ticket action, providing tamper-proof evidence for RTI Act and CAG state audits.', size: 20, color: '334155', font: 'Calibri' }),
            ],
          }),
          new Paragraph({
            spacing: { before: 60, after: 80 },
            children: [
              new TextRun({ text: '• Zero-Trust RBAC: ', bold: true, size: 20, color: '0F172A', font: 'Calibri' }),
              new TextRun({ text: '100% pass rate across 30 automated security penetration vectors (BOLA, NoSQL injection, DDoS throttling).', size: 20, color: '334155', font: 'Calibri' }),
            ],
          }),

          // Section 5 & 6
          new Paragraph({
            spacing: { before: 250, after: 120 },
            children: [
              new TextRun({
                text: '5. Interoperability & Disaster Recovery Protocol',
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
              new TextRun({ text: '• BMC SAP / MCGS Sync: ', bold: true, size: 20, color: '0F172A', font: 'Calibri' }),
              new TextRun({ text: 'Bidirectional RESTful webhook adapters allow parallel dual-run mode without disrupting existing enterprise investments.', size: 20, color: '334155', font: 'Calibri' }),
            ],
          }),
          new Paragraph({
            spacing: { before: 60, after: 80 },
            children: [
              new TextRun({ text: '• 60-Second Instant Rollback: ', bold: true, size: 20, color: '0F172A', font: 'Calibri' }),
              new TextRun({ text: 'Containerized immutable deployments allow instant blue/green traffic cutover to prior certified baselines in case of systemic failure.', size: 20, color: '334155', font: 'Calibri' }),
            ],
          }),
          new Paragraph({
            spacing: { before: 60, after: 80 },
            children: [
              new TextRun({ text: '• High Availability & PITR: ', bold: true, size: 20, color: '0F172A', font: 'Calibri' }),
              new TextRun({ text: '99.99% uptime SLA with continuous replica-set backups (RPO < 1s, RTO < 15min) and Redis Dead-Letter Queues for failed background jobs.', size: 20, color: '334155', font: 'Calibri' }),
            ],
          }),

          // Section 7: ROI Table
          new Paragraph({
            spacing: { before: 250, after: 120 },
            children: [
              new TextRun({
                text: '6. Projected Annual ROI & Fiscal Benefits',
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
                    width: { size: 65, type: WidthType.PERCENTAGE },
                    shading: { fill: '0F766E', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 120, bottom: 120, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Optimization Stream', bold: true, size: 20, color: 'FFFFFF', font: 'Calibri' })] })],
                  }),
                  new TableCell({
                    width: { size: 35, type: WidthType.PERCENTAGE },
                    shading: { fill: '0F766E', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 120, bottom: 120, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Annual Savings', bold: true, size: 20, color: 'FFFFFF', font: 'Calibri' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Elimination of Fraudulent Contractor Claims (50m Geofence Lock)', size: 19, color: '334155', font: 'Calibri' })] })],
                  }),
                  new TableCell({
                    shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: '₹ 24.50 Crore', bold: true, size: 19, color: '0F172A', font: 'Calibri' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Ward Control Room Man-Hour Savings (187,000 Hours Saved)', size: 19, color: '334155', font: 'Calibri' })] })],
                  }),
                  new TableCell({
                    shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: '₹ 9.80 Crore', bold: true, size: 19, color: '0F172A', font: 'Calibri' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Automated Sub-Meter GIS Asset Routing (Fuel/Logistics)', size: 19, color: '334155', font: 'Calibri' })] })],
                  }),
                  new TableCell({
                    shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: '₹ 3.20 Crore', bold: true, size: 19, color: '0F172A', font: 'Calibri' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Paperless MMC Act Legal Notices & Automated Compliance', size: 19, color: '334155', font: 'Calibri' })] })],
                  }),
                  new TableCell({
                    shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: '₹ 2.30 Crore', bold: true, size: 19, color: '0F172A', font: 'Calibri' })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: 'CCFBF1', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 110, bottom: 110, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: 'TOTAL PROJECTED ANNUAL FISCAL SAVINGS', bold: true, size: 20, color: '0F766E', font: 'Calibri' })] })],
                  }),
                  new TableCell({
                    shading: { fill: 'CCFBF1', type: ShadingType.CLEAR },
                    borders: borderThin,
                    margins: { top: 110, bottom: 110, left: 140, right: 140 },
                    children: [new Paragraph({ children: [new TextRun({ text: '₹ 39.80 Crore', bold: true, size: 20, color: '0F766E', font: 'Calibri' })] })],
                  }),
                ],
              }),
            ],
          }),

          // Section 7: Pilot Proposal & Contact
          new Paragraph({
            spacing: { before: 250, after: 120 },
            children: [
              new TextRun({
                text: '7. 30-Day Zero-Risk Pilot & Call to Action',
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
                text: 'We propose an immediate 30-day zero-cost trial across Ward K-West (Andheri West) and Ward G-North (Dadar / Dharavi) to validate sub-30-second AI triage, 0% false closures, and sub-24h resolution times.',
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
                          new TextRun({ text: 'OFFICIAL SYSTEM DEMO & EXECUTIVE BRIEFING\n', bold: true, size: 20, color: '0F172A', font: 'Calibri' }),
                          new TextRun({ text: 'Live Production Link: ', bold: true, size: 19, color: '0284C7', font: 'Calibri' }),
                          new TextRun({ text: 'https://smart-civic-pi.vercel.app\n', size: 19, color: '0284C7', font: 'Calibri' }),
                          new TextRun({ text: 'Demo Accounts: admin@smartcivic.gov.in | engineer@kwest.bmc.gov.in | contractor@mumbai-roads.com\n', size: 18, color: '475569', font: 'Calibri' }),
                          new TextRun({ text: 'Secretariat Liaison: Municipal Solutions Architecture Group, Fort HQ, Mumbai - 400001\n', size: 18, color: '475569', font: 'Calibri' }),
                          new TextRun({ text: 'Direct Line: +91 22 2262 0251 / Extension 4019', size: 18, color: '475569', font: 'Calibri' }),
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
  console.log('Successfully generated DOCX at:', outputPath);
}

generateProposalDocx().catch(err => {
  console.error('Error generating docx:', err);
  process.exit(1);
});
