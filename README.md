# 🛡️ InfoShield - AI-Powered Detection of Fake Government Schemes & Misinformation

> **Mini Project ID:** `2026-27CSEMPID003`  
> **Department:** Department of Computer Science & Engineering  
> **Institution:** ABES Institute of Technology (ABESIT), Ghaziabad  
> **Affiliation:** Dr. A.P.J. Abdul Kalam Technical University (AKTU), Lucknow  
> **Presented by:** Aakansha Sharma (2502900100003), Aadrika (2502900100002), Aditi Rai (2502900100017)  
> **Slogan:** *Verify. Trust. Share Responsibly.*

---

## 🌟 Executive Summary

**InfoShield** is an AI-powered civic-tech verification platform designed to protect Indian citizens from fraudulent government scheme messages, viral WhatsApp forwards, phishing portals, and fake scholarship scams.

By combining **Natural Language Processing (NLP)**, **heuristic scam pattern detection**, **domain security auditing**, and **knowledge-base cross-referencing** against authentic Government of India portals (`myScheme.gov.in`, `pmkisan.gov.in`, PIB Fact Check), InfoShield delivers an instant, **Explainable AI (XAI)** verdict:
- 🟢 **Likely Genuine**
- 🟡 **Needs Verification**
- 🔴 **Potentially Fake / Scam**

---

## 🚀 How to Run the Application Locally

### Start the Full-Stack Platform (Backend + Frontend)
InfoShield features a unified Flask REST backend and responsive citizen frontend. Start the application with a single command:

```powershell
python backend/app.py
```
Then open your web browser and navigate to:
```
http://127.0.0.1:5000/
```
The Flask backend automatically serves the API endpoints (`/api/*`) and the static frontend UI (`frontend/`).

### Run Automated Backend Tests
Run the comprehensive test suite with:
```powershell
python -m pytest backend/tests -v
```

---

## 🛠️ Architecture & 5-Step Methodology (Slide 7)

```
┌────────────────────────────────────────────────────────┐
│ 1. User Input: WhatsApp Message / Screenshot / Link   │
└─────────────────────────┬──────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│ 2. NLP Content Analysis & Entity Extraction           │
│    - Scheme Name Claim & Monetary Figures             │
│    - Contact Numbers, URLs & Top-Level Domains        │
└─────────────────────────┬──────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│ 3. Scam Indicator & Red Flag Detection                │
│    - Upfront Registration Fee / Payment demands       │
│    - Artificial Urgency ("Last date tonight")         │
│    - WhatsApp Viral Pyramid Sharing ("Share in 5 grps")│
│    - Unofficial TLDs (.online, .xyz, .top, etc.)       │
└─────────────────────────┬──────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│ 4. Cross-Verification with Official Sources           │
│    - Verified Government Database (myScheme Portal)   │
│    - PIB Fact Check Debunk Records                    │
│    - Official TLD Verification (.gov.in / .nic.in)    │
└─────────────────────────┬──────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│ 5. Explainable Verdict & Citizen Safety Guidance      │
│    - Verdict: Likely Genuine / Needs Verification / Fake│
│    - Risk Index (0-100%)                              │
│    - Transparent "Why This Result?" Reason Breakdown  │
│    - Official Link & Pre-filled Cyber Crime Report    │
└────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Features Implemented

1. **Patriotic Civic Design & National Motto**:
   - Features the Indian National Tiranga ribbon, 24-spoke spinning Ashoka Chakra, and *"सत्यमेव जयते • Digital India, Secure India 🇮🇳"* emblem.

2. **Multilingual Inclusivity (10 Indian Regional Languages)**:
   - English, ਪੰਜਾਬੀ (Punjabi), हिन्दी (Hindi), ગુજરાતી (Gujarati), বাংলা (Bengali), தமிழ் (Tamil), తెలుగు (Telugu), ಕನ್ನಡ (Kannada), മലയാളം (Malayalam), and मराठी (Marathi).
   - Real-time reactive switching across the entire user interface and guidance advisories.

2. **Multi-Input Verification Suite**:
   - **Text & Message Tab**: Instant detection of viral WhatsApp / SMS forwards with one-click test cases.
   - **Screenshot OCR Scanner**: Upload or drag-and-drop screenshot with laser scanning animation and OCR text extraction.
   - **Phishing Link Auditor**: Checks whether URLs belong to legitimate `.gov.in` / `.nic.in` domains or spoofed extensions (`.online`, `.xyz`).

3. **Explainable AI (XAI)**:
   - Transparent breakdown of **Red Flags** (Registration fee demanded, urgency, pyramid sharing) and **Trust Signals** (Direct Benefit Transfer DBT reference, official helpline 1930).

4. **Actionable Citizen Safety**:
   - **One-Click Official Portal Access**: Direct links to authentic government websites.
   - **Auto-Generated Cyber Crime Report**: Formatted incident report ready to file on `cybercrime.gov.in` (Helpline 1930).
   - **WhatsApp Debunk Advisory**: Generates a shareable fact-check card to paste into family/college WhatsApp groups.

5. **Official Schemes Directory & PIB Alerts**:
   - Filterable catalog of central & state schemes (PM-KISAN, Ayushman Bharat, PMAY, PM Surya Ghar, Mudra, Sukanya Samriddhi).
   - Live stream of debunked scams from PIB Fact Check.

6. **SDG Impact Mapping**:
   - **SDG 11**: Sustainable Cities & Communities (Protection from scam fraud).
   - **SDG 9**: Industry, Innovation & Infrastructure (NLP & heuristic tech for social good).
   - **SDG 4**: Quality Education (Digital literacy & scam awareness).
   - **SDG 16**: Peace, Justice & Strong Institutions (Promoting official governance channels).

---

## 📁 Project Structure

```
Ideathon prototype/
│
├── backend/                             # Python / Flask REST API Backend
│   ├── app.py                           # Application factory & static file serving
│   ├── config.py                        # Environment & database configuration
│   ├── database.py                      # MySQL & SQLite connection pooling
│   ├── schema.sql                       # DDL schema & verified government seed data
│   ├── models/                          # Database models (User, Scan, Report, Scheme, PIB)
│   ├── routes/                          # REST API Blueprints (Auth, Verify, Reports, etc.)
│   ├── services/                        # Business logic (Analyzer, Auth, NLP Entity Extraction)
│   └── tests/                           # 20 Automated unit & integration tests
│
├── frontend/                            # Dedicated Citizen Frontend Web Application
│   ├── index.html                       # Main single-page application UI
│   ├── css/
│   │   └── style.css                    # Cyber-civic design system & animations
│   ├── js/
│   │   ├── api.js                       # Frontend REST API client & bridge
│   │   ├── analyzer.js                  # NLP entity extraction & scam heuristics
│   │   ├── ocr.js                       # Tesseract OCR engine & laser scanner
│   │   ├── groq.js                      # Groq Cloud AI LPU integration
│   │   ├── app.js                       # Main application UI event orchestration
│   │   └── data/
│   │       ├── schemes.js               # Verified Indian Government schemes database
│   │       ├── scam_database.js         # PIB fact-check debunks & red-flag dictionaries
│   │       └── translations.js          # Multilingual regional Indian language dictionaries
│   └── assets/
│       ├── logo.jpg                     # InfoShield emblem logo
│       └── *.jpg                        # Real-world sample screenshots & notices
│
├── README.md                            # Comprehensive project documentation
└── PRESENTATION_GUIDE.md                # Presentation guide for examiners & evaluators
```
