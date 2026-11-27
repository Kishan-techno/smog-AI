# Smog Saathi AI — 2-Minute Hackathon Demo Script & Judge Guide

## 🎙️ 2-Minute Demo Script (Pitch & Live Walkthrough)

### [0:00 - 0:25] Hook & Problem (Why not just another AQI app?)
> *"Judges, when an app says 'AQI is 210 Poor', what does a mother in Bhopal or Delhi actually do? Does she send her child to school? Does she close the windows? Traditional AQI apps give numbers without context and without guidance.*
> 
> *Meet **Smog Saathi AI** — not just another AQI dashboard, but an explainable clean-air decision support platform for families and communities."*

---

### [0:25 - 0:55] Feature 1: Real-Time Contextual Dashboard & Spatial Variance
*(Action: Scroll to Bhopal AQI Dashboard & SVG Station Map)*
> *"Notice here on our live dashboard: Bhopal's AQI is calculated strictly against CPCB Indian National AQI standards, with sub-indices for PM2.5, PM10, NO2, SO2, CO, and Ozone.*
> 
> *Bhopal is not uniform — our spatial grid dynamically models micro-dispersion across 6 localized stations: T.T. Nagar, Kolar Road, Govindpura Industrial, MP Nagar, Arera Colony, and Bairagarh.*
> 
> *Every data point shows its station source, exact timestamp, and data freshness tag (Live feed vs stale-while-revalidate fallback)."*

---

### [0:55 - 1:20] Feature 2: 3-Step Family Routine -> Explainable Action Plan
*(Action: Click Routine Wizard tabs, adjust school bus and commute time, click Save)*
> *"Here is our core innovation: The user sets their family's routine: school time, commute window, and outdoor play time. No exact addresses, zero medical records collected — 100% privacy-first.*
> 
> *Instantly, our rule-based explainability engine produces a 4-part daily action plan: **What to do, When to do it, Why, and the Expected Impact**.*
> *Each card has an expandable audit tray showing the exact station timestamp, data source, and assumptions.*
> *And families can click **'Export / Print Plan'** for a clean fridge-ready printable card."*

---

### [1:20 - 1:40] Feature 3: Grounded Multilingual RAG Chat & What-If Simulator
*(Action: Click suggested question in Saathi AI, or type in Hinglish: 'Kya subah walk par jaana safe hai?')*
> *"Our AI assistant 'Saathi' operates on grounded Retrieval-Augmented Generation across CPCB, WHO, ICMR, and MoHFW health and ventilation guidelines.*
> *It streams token-by-token with zero hallucinations, citing verified document references. It works fluently in English, Hindi, and Hinglish.*
> 
> *Below it, our **What-If Simulator** models real scenarios: switching from two-wheeler to carpooling, or closing windows during inversion hours — displaying calculated exposure proxy reductions."*

---

### [1:40 - 2:00] Feature 4: Exposure Proxy Score & Privacy-First Community Pulse
*(Action: Scroll down to Exposure and Community Ward Pulse)*
> *"Finally, we calculate a **Personal Air Exposure Proxy Score** (concentration × duration per microenvironment, with a clear disclaimer that it is not an inhaled biological dose).*
> *And our community dashboard aggregates clean-air pledges ward-by-ward, enabling collective neighborhood action without exposing any personal routines.*
> 
> *Smog Saathi AI: Transparent, explainable, and actionable clean air for every Indian family. Thank you!"*

---

## 🏆 Key Architecture Highlights for Judges

1. **Layered Full-Stack**:
   - **Frontend**: React 18 (Vite), Tailwind CSS, Framer Motion, GSAP ScrollTrigger, Lenis smooth scrolling, Recharts.
   - **Backend**: Node.js/Express with Zod validation, Circuit Breaker resilience, LRU stale-while-revalidate caching, SSE chat streaming.
   - **ML Forecast Service**: Python FastAPI with 24-48h diurnal curve models, exponential moving averages, and data guardrails (returns `"forecast unavailable"` when points < 6 instead of fake numbers).

2. **Ethical AI & Compliance**:
   - Strict decision-support framing with non-medical disclaimers on every recommendation card.
   - Privacy-by-design: No precise GPS or home addresses collected; community metrics are ward-level aggregates.
   - Zero hallucination: Chat is anchored to trusted environmental authorities with visible citations.
