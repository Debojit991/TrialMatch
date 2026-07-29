# TrialMatch+: Agentic Clinical Trial Matching System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-lightgrey.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748.svg)](https://www.prisma.io/)
[![Google Gemini](https://img.shields.io/badge/Gemini_2.0_Flash-4285F4.svg)](https://ai.google.dev/)
[![Groq Llama-3](https://img.shields.io/badge/Groq_Llama--3--70B-F05032.svg)](https://groq.com/)
[![Deployment: Vercel](https://img.shields.io/badge/Vercel-Serverless-black.svg)](https://vercel.com/)

**TrialMatch+** is an advanced, AI-powered **Multi-Agent System (MAS)** and longitudinal clinical decision support platform designed to bridge the gap between complex patient electronic medical records (EMR) and clinical trial inclusion/exclusion protocols.

By orchestrating specialized autonomous AI agents, TrialMatch+ automatically parses unstructured medical scans, aggregates patient history over time without data loss, audits discrepancies between official reports and patient-reported symptoms, and ranks candidate clinical trials and principal investigator sites using two-stage reasoning and geospatial logistics.

---

## 🏗️ System Architecture (The 3-Agent Workflow)

TrialMatch+ utilizes a decoupled, sequential **Agentic Workflow** (`server/src/agents/`) where three specialized AI agents collaborate to deliver high-confidence clinical decision support:

```mermaid
flowchart TD
    A[Patient Medical Files / Scans] --> B[Agent 1: Onboarding & Extraction Agent]
    B -- Gemini 2.0 Flash Vision --> C[Structured Clinical Profile JSON]
    C --> D[Longitudinal Profile Aggregator & Deduplicator]
    D --> E[Agent 2: Clinical Trial Recommendation & Matching Agent]
    E -- Groq Llama-3 70B --> F[Dynamic Screening Questionnaire]
    E -- Stage 1 SQL + Stage 2 AI LLM --> G[Eligibility Match Rankings 1-100]
    F --> H[Discrepancy Auditor]
    G --> I[Agent 3: Doctor Match & Connect Agent]
    I -- Haversine Geospatial Tool --> J[Ranked Principal Investigators & Trial Sites]
```

### 🤖 Agent 1: Patient Onboarding & Extraction Agent
* **Module:** `server/src/agents/onboardingAgent.js`
* **Model:** Google Gemini 2.0 Flash Vision (`gemini-2.0-flash` / `gemini-3.6-flash`)
* **Role:** Multi-modal Vision & Structural Normalization
* **Tools Used:** Base64 Image Ingestion Buffer, Document MIME Inspector, JSON Clinical Normalizer Tool.
* **Responsibilities:** Analyzes raw prescriptions, diagnostic laboratory reports, and medical imaging scans. Performs clinical OCR and multi-modal vision extraction, normalizes drug dosages, and outputs structured JSON schema containing suspected conditions, disease stage, diagnosis date, active medications, key lab parameters, and raw summaries.

### 🤖 Agent 2: Clinical Trial Recommendation & Matching Agent
* **Module:** `server/src/agents/recommendationAgent.js`
* **Model:** Groq Llama-3 70B (`llama-3.3-70b-versatile`)
* **Role:** Clinical Reasoning, Discrepancy Detection & Protocol Evaluation
* **Tools Used:** Database Trial Criteria Query Tool, Dynamic Questionnaire Generator, Discrepancy Auditor.
* **Responsibilities:**
  - **Dynamic Questionnaire Generation:** Generates 5–7 tailored screening questions based on missing document parameters (with Q1 mandatory: *"What condition do you believe you have?"*).
  - **Discrepancy Auditing:** Compares official document findings against patient self-reported answers to detect contradictions or conflicts, assigning `HIGH`, `MEDIUM`, or `LOW` severity flags.
  - **Two-Stage Matching Engine:** Executes Stage 1 SQL prescreening followed by Stage 2 deep LLM criterion-by-criterion evaluation, assigning numerical eligibility rank scores (1–100) and step-by-step clinical explanations.

### 🤖 Agent 3: Doctor Match & Connect Agent
* **Module:** `server/src/agents/doctorConnectAgent.js`
* **Model:** Groq / Gemini
* **Role:** Geospatial & Budget Logistics Matchmaker
* **Tools Used:** Haversine Distance Calculator Tool, Doctor Consultation Budget & Specialty Filter.
* **Responsibilities:** Takes matched trial site locations and patient demographic data, calculates exact geographic distances (in kilometers) using the Haversine formula, handles missing coordinate fallbacks gracefully without null errors, and ranks qualified Principal Investigators / doctors for trial referral.

---

## 📊 System Workflows & Architecture Diagrams

### 1. Patient-Side Workflow (App Execution)
```mermaid
flowchart TD
    A["Patient Registration / Login"] --> B["Profile Setup (Age, Gender, Location)"]
    B --> C["Upload Medical Documents (PDF, JPG, PNG)"]
    C --> D["AI Document Ingestion & Longitudinal Aggregation"]
    D --> E["AI Generates Dynamic Screening Questionnaire"]
    E --> F["Patient Submits Screening Answers"]
    F --> G["Display Matched Clinical Trials & Ranked Doctors"]
```

### 2. Doctor-Side Workflow (App Execution)
```mermaid
flowchart TD
    A["Doctor Login / Auth"] --> B["Doctor Portal Dashboard UI"]
    B --> C["View Patient Review Queue & Applications"]
    C --> D["Inspect AI Extracted Medical Record & Match Scores"]
    D --> E["Inspect Discrepancy Audit Flags"]
    E --> F{"Human-in-the-Loop (HITL) Decision"}
    F -- Approve Match --> G["Mark Application Approved & Send Connection Notice"]
    F -- Reject / Request Info --> H["Update Status & Request Additional Clinical Data"]
```

### 3. API Execution & Multi-Agent Pipeline
```mermaid
sequenceDiagram
    autonumber
    actor Client as Frontend Client
    participant Router as API Gateway / Express Router
    participant Orch as Agent Orchestrator (ai.service.js)
    participant Agent1 as Agent 1 (Vision Extraction)
    participant DB as PostgreSQL / Prisma DB
    participant Agent2 as Agent 2 (Reasoning & Matching)
    participant Agent3 as Agent 3 (Geospatial Doctor Routing)

    Client->>Router: POST /api/patients/:id/assess-documents
    Router->>Orch: Trigger Agentic Workflow
    Orch->>Agent1: extractAndNormalizeDoc(buffer, ocrText)
    Agent1-->>Orch: Structured Clinical JSON
    Orch->>DB: Upsert DocumentAssessment & Deduplicate Master Profile
    Orch->>Agent2: generateDynamicQuestionnaire(assessment)
    Agent2-->>Orch: 5-7 Dynamic Screening Questions
    Orch-->>Client: Assessment & Screening Questions Response
    
    Client->>Router: POST /api/patients/:id/find-trials
    Router->>Agent2: matchPatientToTrials(patientId)
    Agent2->>DB: Stage 1 SQL Protocol Query
    DB-->>Agent2: Candidate Clinical Trials
    Agent2-->>Orch: Stage 2 LLM Criteria Evaluation & Rank Scores (1-100)
    Orch->>Agent3: matchDoctorsForPatient(patientId)
    Agent3-->>Orch: Haversine Proximity Rankings & Site Logistics
    Orch-->>Client: Matched Trials & Ranked Doctors JSON Response
```

### 4. Human-in-the-Loop (HITL) Decision Sequence
```mermaid
stateDiagram-v2
    [*] --> AIScreeningComplete: AI Matching & Discrepancy Audit Finished
    AIScreeningComplete --> PendingClinicalReview: Application Queued for Doctor Review
    PendingClinicalReview --> DoctorInspection: Doctor Reviews AI Extraction & Audit Flags

    state DoctorInspection {
        [*] --> ReviewMedicalHistory
        ReviewMedicalHistory --> EvaluateDiscrepancies
        EvaluateDiscrepancies --> FinalDecision
    }

    DoctorInspection --> Approved: Clinician Approves Match
    DoctorInspection --> Rejected: Clinician Rejects Match
    DoctorInspection --> MoreInfoNeeded: Clinician Requests Data

    Approved --> PatientEnrolled: Patient Enrolled in Clinical Trial Protocol
    Rejected --> SystemRecalibrated: Master Profile Recalibrated
    MoreInfoNeeded --> PatientNotified: Patient Prompted for Information

    SystemRecalibrated --> [*]
    PatientEnrolled --> [*]
    PatientNotified --> [*]
```

---

## 🛠️ Tech Stack & Infrastructure

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | HTML5, Vanilla CSS3, JavaScript (ES6+) | Custom glassmorphism design system, micro-animations, multi-language support (English, Bengali, Marathi, Tamil, Hindi, Russian via Google Translate). |
| **Backend API** | Node.js, Express.js | RESTful API architecture with CORS, Helmet security headers, rate-limiting middleware, and centralized error handling. |
| **AI / MAS** | Google Gen AI SDK & Groq Cloud SDK | Multi-model orchestration (`gemini-2.0-flash`, `llama-3.3-70b-versatile`). |
| **Database & ORM** | PostgreSQL & Prisma ORM v5 | Production relational database deployed on Supabase with Prisma schema migrations and seed scripts. |
| **Cloud Storage** | Cloudinary API | Serverless memory storage buffer streaming for medical documents. |
| **Deployment** | Vercel Serverless | Optimized serverless API deployment (`vercel.json`). |

---

## ✨ Key Features

- 📄 **Longitudinal Patient Records:** Multi-document aggregation over time that appends newly uploaded medical reports and deduplicates condition & medication lists using case-insensitive `Set` normalization.
- 🎯 **Targeted Document Deletion:** Allows granular deletion of individual medical files (`DELETE /api/patients/:patientId/documents/:docId`), automatically removing physical storage and recalibrating the Master Patient Profile across remaining files.
- 🔍 **Real-Time Discrepancy Detection:** Automatically flags contradictions between official medical scans and patient self-reported questionnaire answers for clinician review.
- ⚡ **Native Vercel Serverless Compatibility:** Replaced heavy C/WebAssembly/Tesseract dependencies with cloud multi-modal vision API streaming for serverless cold-start performance.
- 🗺️ **Geospatial & Logistics Distance Scoring:** Uses Haversine distance calculations to connect patients with nearby trial sites and Principal Investigators.

---

## 🚀 Local Setup & Installation

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn**
- **PostgreSQL Database** (or free Supabase PostgreSQL instance)

### 1. Clone the Repository
```bash
git clone https://github.com/Debojit991/TrialMatch.git
cd TrialMatch
```

### 2. Backend Dependencies & Environment Setup
Navigate to the `server/` directory and install dependencies:
```bash
cd server
npm install
```

Create a `.env` file inside the `server/` directory (refer to [Environment Variables](#-environment-variables-reference)).

### 3. Database Migration & Seeding
Sync your PostgreSQL database schema and seed candidate clinical trials (including Bacterial Pneumonia, Type 2 Diabetes, Oncology, Cardiology, and Asthma trials):
```bash
npx prisma db push
node prisma/seed.js
```

### 4. Run the Application
Start the backend Express server:
```bash
npm run dev
```
The API server will run on `http://localhost:5000` (or `http://localhost:5002`).

To view the frontend UI, open `index.html` from the root directory using VS Code Live Server or your local web server.

---

## 🔑 Environment Variables Reference

Create a `.env` file in the `server/` folder containing the following keys:

```env
# Database Credentials (Supabase / PostgreSQL)
DATABASE_URL="postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:5432/postgres"

# AI Model API Keys
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"
GROQ_API_KEY="gsk_YourGroqApiKeyHere"

# Cloudinary Storage Credentials
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

# Server Port
PORT=5000
```

---

## 🧪 Verification & Testing

Run automated end-to-end multi-agent verification tests:
```bash
# Test 3-Agent Agentic Workflow & Pneumonia Matching
node test-agents.js

# Test Longitudinal Patient Record & Targeted Deletion
node test-longitudinal.js

# Test Multi-Model Assessment & Questionnaire Engine
node test-phase2.js
```

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
