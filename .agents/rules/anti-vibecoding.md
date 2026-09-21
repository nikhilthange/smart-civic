# Anti-Vibecoding & Production UI/UX Standards

This rulebook codifies the **30 Anti-Vibecoding Principles** to prevent generic, AI-telltale design clichés and ensure every interface feels authentic, human-crafted, resilient, and enterprise-grade.

---

## The 30 Core Rules

### 1. No Harsh Gradients
- **Anti-pattern:** 45-degree harsh rainbow/electric gradients (`bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500`) slapped onto headers or cards.
- **Rule:** Use subtle, tonal shifts (e.g. `from-slate-50 to-slate-100/50` in light mode, or `from-slate-900 to-slate-950` in dark mode) or solid surfaces with distinct 1px borders.

### 2. No Default Lucide Icon Overuse
- **Anti-pattern:** Randomly sprinkling unmodified Lucide icons as visual filler in every container without contextual styling.
- **Rule:** Treat icons as functional indicators. Maintain consistent stroke width (1.5px or 1.75px), matched optical bounding boxes, and intentional dual-tone or muted foreground coloring (`text-slate-500 dark:text-slate-400`).

### 3. No Pure White (#FFFFFF) Monoculture
- **Anti-pattern:** Canvas background is `#FFFFFF` and every card inside is `#FFFFFF` with muddy drop shadows to separate them.
- **Rule:** Use calibrated off-white canvas backgrounds (`#FAFAFA`, `#F8F9FA`, or `#F4F5F7` in light mode; `#0B0F17` or `#0F172A` in dark mode). Reserve pure `#FFFFFF` for elevated foreground cards and floating popovers.

### 4. No Rainbow Color Palettes
- **Anti-pattern:** Red, green, blue, purple, yellow, orange tags and badges scattered across the same card or dashboard view.
- **Rule:** Stick to a disciplined design system: 1 Primary Brand hue (e.g., Civic Deep Blue / Slate), 1 Neutral scale, and clear semantic functional colors (Green = Success/Resolved, Amber = In Progress/Warning, Red = Critical/Breach).

### 5. No Muddy Box-Shadows
- **Anti-pattern:** Huge default Tailwind drop shadows like `shadow-2xl` or `shadow-[0_20px_50px_rgba(0,0,0,0.25)]`.
- **Rule:** Use crisp 1px borders (`border border-slate-200 dark:border-slate-800`) paired with subtle, low-spread ambient shadows (`shadow-xs` or `0 1px 3px rgba(0,0,0,0.04)`).

### 6. No Generic "3 Feature Cards in a Row"
- **Anti-pattern:** Identical 3-column cards with an icon at top, bold title, and two lines of filler text.
- **Rule:** Structure layouts to showcase the actual workflow: asymmetric split-views, live data feeds, interactive preview simulators, or hierarchical process steps.

### 7. No Emojis in Production UI Elements
- **Anti-pattern:** Using emojis (`🚀`, `💡`, `🔥`, `🛡️`, `✨`) in headers, buttons, status badges, or navigation tabs.
- **Rule:** Use formal typographic badges, status pills, or crisp SVG icons with proper accessibility labels. Emojis belong only in user-generated conversational comments or chat messages.

### 8. No Clunky Liquid Glass / Frosted Glassmorphism
- **Anti-pattern:** Over-the-top `backdrop-blur-2xl bg-white/10` overlays with white borders that kill text contrast.
- **Rule:** Prioritize legibility. If background blur is needed for sticky navigation, use high-opacity backing (`bg-white/90 dark:bg-slate-900/90 backdrop-blur-md`) with high contrast text.

### 9. No AI Em Dashes ("—") in Copy
- **Anti-pattern:** Overuse of "—" in headlines, features, and marketing copy (the most common telltale sign of LLM text).
- **Rule:** Write direct, punchy sentences. Use standard punctuation (periods, commas, colons) and natural cadence.

### 10. No Default Font Trifecta Without Purpose
- **Anti-pattern:** Blindly using unconfigured Inter or Geist for everything.
- **Rule:** Curate fonts intentionally. In Smart Civic, use **DM Sans** for legible institutional UI and **JetBrains Mono** for numbers, ticket IDs, and coordinates.

### 11. No Gimmicky 4px Left Colored Stripes
- **Anti-pattern:** Cards that solely rely on `border-l-4 border-l-blue-500` for hierarchy.
- **Rule:** Use integrated status badges, contextual icon badges, or muted surface tints.

### 12. No Fake Testimonials
- **Anti-pattern:** "John Doe, Tech Enthusiast: 'This app changed my life!'" with random stock avatars.
- **Rule:** Use verifiable case studies, ground operational audits, ward administrative reports, or omit testimonials in favor of real telemetry metrics (e.g., "18,420 potholes resolved across 24 wards").

### 13. No Pointless Bento Grids
- **Anti-pattern:** Random jigsaw layout of boxes just to look like an Apple marketing slide.
- **Rule:** Every card's size must correlate with data importance and user hierarchy (e.g. critical alerts spanning full width, secondary stats occupying side columns).

### 14. No Fake Terminal Windows
- **Anti-pattern:** Fake macOS terminal window with 3 traffic-light dots running `npx run-magic-ai`.
- **Rule:** Show real functional interfaces: interactive API playgrounds, real JSON payloads, or realistic tabular data.

### 15. No "It's not X, it's Y" Cliché Copy
- **Anti-pattern:** "It's not just a civic app, it's an urban revolution."
- **Rule:** Say exactly what it does plainly: "Civic issue tracking, automated SLA enforcement, and geofenced resolution verification for Mumbai."

### 16. No Checkmark Bullet Lists
- **Anti-pattern:** 5 green checkmark icons in a vertical column (`✓ 24/7 Support`, `✓ AI Powered`).
- **Rule:** Use clear specification tables, feature breakdown matrices, or structured metric callouts.

### 17. No Generic 3-Tier Pricing with "Most Popular" Pill
- **Anti-pattern:** Free / Pro ($19) / Enterprise with a gradient border around Pro.
- **Rule:** Base models on actual domain mechanics (e.g. municipal ward tier, citizen quota, enterprise SLA) or keep clear civic public access tiering.

### 18. No Static Placeholders Instead of Working Demos
- **Anti-pattern:** Static illustrations or stock photos where the core product workflow should be.
- **Rule:** Provide functional live widgets, interactive filters, realistic before/after comparison sliders, and actual map simulations.

### 19. No Pillowy Soft Radii Everywhere (`rounded-3xl` on buttons)
- **Anti-pattern:** Bubble-like shapes that look like children's toys.
- **Rule:** Use tight, precise radii: 6px (`rounded-md`) to 10px (`rounded-lg`) for buttons, inputs, and cards.

### 20. No Generic Purple + Pitch Black AI Dark Mode
- **Anti-pattern:** `#09090b` pitch black paired with glowing violet/neon purple.
- **Rule:** Use sophisticated slate, navy, or charcoal dark tones (`#0F172A`, `#0B1120`, `#1E293B`) with high-contrast text and crisp neutral borders.

### 21. Skeleton Loaders Are Mandatory
- **Anti-pattern:** Blank white boxes or generic spinning wheels that cause massive layout shifts when data loads.
- **Rule:** Build precision skeleton screens mirroring the exact geometry of the incoming cards and tables.

### 22. No Blurry Radial Glow Orbs Behind Text
- **Anti-pattern:** Giant `filter blur(120px)` colored circles positioned randomly behind headers.
- **Rule:** Keep text legible with clean, crisp backgrounds. Establish hierarchy through typography, spacing, and structural borders.

### 23. No Gimmicky Dot-Grid / Blueprint Canvas Patterns
- **Anti-pattern:** Slapping `radial-gradient(#000 1px, transparent 1px)` over the entire viewport.
- **Rule:** Let whitespace breathe. Subtle structural borders or clean solid surfaces give an institutional, trustworthy feel.

### 24. No Sparkle (`✨`) Icons on "AI" Features
- **Anti-pattern:** Putting `✨` or `<Sparkles />` on every single button or tag that mentions AI.
- **Rule:** Describe the functional mechanism: "Computer Vision Verification", "Automated Ward Routing", "OCR Scanner", using technical icons (`ScanLine`, `ShieldCheck`, `Cpu`, `Layers`).

### 25. No Bouncing / Pulsing Animated Arrows
- **Anti-pattern:** Floating arrow pointing down to "Learn More" or bouncing CTA indicators.
- **Rule:** Natural visual hierarchy and clean page structure guide the user's attention without annoying animation noise.

### 26. Always Have Real Terms of Service (TOS)
- **Anti-pattern:** Missing or `href="#"` dummy legal links.
- **Rule:** Maintain accessible, comprehensive, and legally sound Terms of Service.

### 27. Always Have a Real Privacy Policy
- **Anti-pattern:** Missing privacy documentation.
- **Rule:** Provide clear data protection disclosure (data collection, storage, telemetry, DPDP/GDPR compliance).

### 28. No Hyperactive Hover Animations
- **Anti-pattern:** Cards scaling up 105% and tilting 3D on hover with sluggish transitions.
- **Rule:** Keep micro-interactions snappy and subtle (e.g. `transition-colors duration-150`, or a 1px border color change). No element should distract the user while reading.

### 29. No Eye-Melting Neon Colors
- **Anti-pattern:** Super-saturated neon green (`#00FF00`) or fluorescent cyan that fails WCAG accessibility contrast.
- **Rule:** Calibrate all colors to meet WCAG AA (contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text).

### 30. No Washed-Out Low-Contrast Pastels
- **Anti-pattern:** Very light grey text (`#A1A1AA`) on light grey cards (`#F4F4F5`).
- **Rule:** Maintain dark, readable foreground text (`#0F172A` or `#1E293B` on light backgrounds; `#F8FAFC` on dark backgrounds).

---

## Domain & Naming Guardrails

### 31. Prohibited Terminology: Never Use "BMC MARG"
- **Anti-pattern:** Labeling civic features, categories, modals, or vouchers as "BMC MARG", "MARG Verified", "MARG Catalog", or "MARG Docket".
- **Rule:** Use independent municipal terminology:
  - Use **"Municipal Grievance Catalog"** (not "BMC MARG Catalog")
  - Use **"Municipal Verified"** (not "MARG Verified")
  - Use **"Municipal Geotag Mandate"** (not "BMC MARG Geotag Mandate")
  - Use **"Municipal 24-Hour Rapid Pothole Directive"** (not "BMC MARG 24-Hour Rapid Pothole Directive")
  - Use **"Field Execution Channel"** (not "MARG Execution Channel")
  - Use **"Municipal Material & Engineering Voucher"** (not "BMC MARG Voucher")
  *(Note: Actual physical Mumbai street names like "Senapati Bapat Marg" or "LBS Marg" are valid geographic road names).*

