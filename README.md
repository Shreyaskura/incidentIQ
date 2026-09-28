# IncidentIQ

IncidentIQ is an AI-powered Incident Response Agent designed to assist engineers in diagnosing, resolving, and learning from software incidents by combining persistent operational memory with grounded AI reasoning.

IncidentIQ integrates with **Hindsight** to retain post-mortems, recall past operational experiences during active outages, and reflect on prior resolutions to suggest proven remediation steps.

---

## Complete System Architecture

```
                          IncidentIQ End-to-End Architecture
+-----------------------------------------------------------------------------------+
|                              React + Vite Frontend                                |
| (Real-time SRE Console, AI Incident Intelligence, Interactive Runbook Execution) |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                              FastAPI Backend Server                               |
| (/api/incidents, /api/incidents/{id}/analyze, /resolve, /api/memory)              |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                              Hindsight Recall Layer                               |
| (Queries memory bank 'incidentiq' with active telemetry, logs, and service name)  |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                                AI Reasoning Layer                                 |
| (Synthesizes active incident telemetry + genuine Hindsight historical memories;   |
|  Formulates root cause, evidence, runbooks, operational risks, and confidence)    |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                            Structured Response to User                            |
| (Summary, Root Cause, Evidence, Historical Memories, Actions, Risks, Reasoning)   |
+-----------------------------------------------------------------------------------+
```

### Core Memory Concepts

- **Retain**: Remember incident experience. When an incident is resolved, its post-mortem (ID, title, error logs, affected service, root cause, resolution, and outcome) is stored persistently into Hindsight bank `incidentiq`.
- **Recall**: Find relevant previous experience. When a new incident occurs, Hindsight performs semantic recall using the incident's symptoms to retrieve matching historical precedents.
- **Reflect**: Reason using memory. Synthesizes past operational successes, failures, and lessons to explain why a remediation is recommended and guide active triage.

---

## AI Analysis Flow

```
NEW INCIDENT
     ↓
HINDSIGHT RECALL
     ↓
RELEVANT HISTORICAL EXPERIENCE
     ↓
AI REASONING
     ↓
INCIDENT ANALYSIS
     ↓
RECOMMENDED ACTION
```

1. **New Incident**: Active incident telemetry (title, description, error logs, affected service, severity, timestamp) is captured.
2. **Hindsight Recall**: A semantic query is dispatched to Hindsight bank `incidentiq`.
3. **Relevant Experience**: Matching historical post-mortems are retrieved without inventing artificial similarity scores. If no matches exist, the system explicitly reports: *"No relevant historical memory found."*
4. **AI Reasoning**: The AI reasoning layer (`backend/services/ai_service.py`) analyzes the incident against retrieved memories. Supports Google Gemini, OpenAI, or IncidentIQ's built-in Operational Reasoning Engine.
5. **Incident Analysis**: Produces a structured analysis with:
   - Executive Summary
   - Likely Root Cause
   - Observed Evidence
   - Historical Precedents (`incident_id`, `memory`, `previous_resolution`, `why_it_matters`, `outcome`)
   - Recommended Actions with interactive execution buttons
   - Operational Risks & Considerations
   - Confidence Level
   - Grounded Reasoning explaining how active symptoms connect to past operational lessons.

---

## Prerequisites

- **Python**: v3.10+ (with `pip`)
- **Node.js**: v18+ (with `npm`)

---

## 1. How to Install `hindsight-client`

IncidentIQ uses the official Hindsight Python SDK:

```bash
cd backend
pip install hindsight-client
```

*(Or on Windows with the Python launcher: `py -m pip install hindsight-client`)*

All backend dependencies are listed in `backend/requirements.txt`:
```bash
cd backend
pip install -r requirements.txt
```

---

## 2. How to Start Hindsight Locally

Hindsight runs as an independent memory service on `http://localhost:8888`.

### Option A: Using IncidentIQ Local Hindsight Service (Included)
IncidentIQ includes a local Hindsight service built with FastAPI that natively implements the official Hindsight REST API (`/v1/default/banks/{bank_id}`, `/memories`, `/memories/recall`, `/reflect`, `/memories/list`):

```bash
cd backend
uvicorn hindsight_mock_server:app --port 8888 --reload
```
*(Or: `py -m uvicorn hindsight_mock_server:app --port 8888`)*

The server stores memory banks and operational experience persistently in `backend/hindsight_storage.json`.

### Option B: Using Official Hindsight Docker Container (if Docker is installed)
```bash
docker run -p 8888:8888 hindsight/hindsight:latest
```

---

## 3. Environment Variables Configuration

### Backend Configuration (`backend/.env`)
See `backend/.env.example`:

```env
# Hindsight Persistent Memory Server URL
HINDSIGHT_API_URL=http://localhost:8888

# Memory Bank Identifier for IncidentIQ
HINDSIGHT_BANK_ID=incidentiq

# Enable or disable Hindsight memory integration
HINDSIGHT_ENABLED=true

# AI Provider Configuration ('auto', 'gemini', 'openai', or 'local')
# When API keys are left unset, IncidentIQ uses its built-in Operational Reasoning Engine.
AI_PROVIDER=auto

# Google Gemini API Key (Optional: for Gemini reasoning)
# GEMINI_API_KEY=your_gemini_api_key_here

# OpenAI API Key (Optional: for OpenAI reasoning)
# OPENAI_API_KEY=your_openai_api_key_here

# Specific AI Model Override (Optional)
# AI_MODEL=gemini-1.5-flash
```

### Frontend Configuration (`frontend/.env`)
```env
# Backend API Base URL
VITE_API_URL=http://localhost:8000
```

> **Security Note**: API keys are only consumed in the FastAPI backend and never exposed to the React frontend. `.env` files are ignored by git.

---

## 4. How to Seed Historical Incidents

To populate the `incidentiq` memory bank with realistic operational experience, run the seed script:

```bash
cd backend
python seed_hindsight.py
```
*(Or: `py seed_hindsight.py`)*

This retains 22 realistic production incident post-mortems covering:
1. **INC-184**: Database connection pool exhaustion (`billing-api`, Aurora Postgres)
2. **INC-178**: API gateway 500 errors via thread deadlock (`checkout-api`)
3. **INC-173**: Redis cluster memory leak / OOM eviction storm (`catalog-cache`)
4. **INC-167**: Auth service JWT RS256 token verification timeout (`auth-service`)
5. **INC-161**: Payment processor webhook timeout & circuit breaker trip (`payment-service`)
6. **INC-155**: P99 latency spike due to unindexed foreign key query (`order-service`)
7. **INC-148**: Failed schema migration lock & table deadlock (`user-service`)
8. **INC-142**: PostgreSQL replica replication lag & WAL corruption (`data-warehouse`)
9. **INC-136**: SSE notification connection memory leak (`notification-service`)
10. **INC-129**: Background worker crash loop on unhandled SIGTERM (`async-worker`)
11. **INC-124**: High CPU throttling on crypto token hashing (`auth-service`)
12. **INC-118**: Deadlock cascade across microservice RPC mesh (`payment-service`)
13. **INC-112**: Redis connection saturation during cache stampede (`catalog-cache`)
14. **INC-106**: DNS lookup failure causing cascading upstream timeouts (`api-gateway`)
15. **INC-099**: Kafka consumer group rebalance storm (`event-stream`)
16. **INC-093**: Disk I/O saturation on Elasticsearch master node (`logging-cluster`)
17. **INC-087**: TLS certificate renewal failure causing HTTPS handshakes to drop (`ingress-lb`)
18. **INC-081**: S3 presigned URL generation throttling (`asset-service`)
19. **INC-074**: Gunicorn worker OOM kill from unoptimized pandas export (`reporting-api`)
20. **INC-067**: gRPC deadline exceeded across checkout dependencies (`checkout-api`)
21. **INC-059**: RabbitMQ unacknowledged message queue overflow (`task-queue`)
22. **INC-052**: Database primary failover split-brain detection (`aurora-cluster`)

---

## 5. Live Hackathon Demo Walkthrough (Step 6)

IncidentIQ provides a dedicated **Demo Environment** mode for hackathon demonstrations:

1. **Header Demo Indicator & Trigger**:
   - Header displays `⚡ DEMO ENVIRONMENT · Hindsight: incidentiq`.
   - Click **Load Demo Incident** to instantly load `INC-204` (*Production API 500 Errors*).
2. **AI Incident Intelligence & Hindsight Grounding**:
   - Automated semantic recall from Hindsight retrieves precedents `INC-184` (Database Connection Pool Saturation) and `INC-178` (API Gateway Upstream Connection Drop).
   - Click the interactive **🧠 Hindsight Memory** indicator or any memory card to inspect the genuine Hindsight memory record modal.
3. **Why Memory Matters (5-Step Progression)**:
   - Visual horizontal progression pipeline:
     `CURRENT INCIDENT` → `RELEVANT MEMORY FOUND` → `PREVIOUS EXPERIENCE` → `AI REASONING` → `RECOMMENDATION`.
4. **Interactive Runbook Mitigation**:
   - Click **Execute Step** or **Apply Runbook** to apply verified remediation steps.
5. **Real 3-Stage Resolution Flow**:
   - Click **Resolve** to trigger the genuine 3-stage feedback dialog:
     - *Stage 1: "Incident resolved."*
     - *Stage 2: "Saving operational experience to Hindsight..."*
     - *Stage 3: "✓ Experience added to IncidentIQ memory."*
6. **Memory Repository Experience**:
   - **What the AI Remembers**: 6 categorized cards (Past Incidents, Root Causes, Successful Fixes, Failed Fixes & Anti-Patterns, Deployment Lessons, Operational Patterns).
   - **Memory Timeline**: Chronological operational knowledge growth nodes with 4 distinct milestone badges (*New experience*, *Recalled experience*, *Successful resolution*, *Newly stored memory*).
   - **Memory Impact (Comparison)**: Side-by-side visual comparison of *WITHOUT MEMORY* (Generic troubleshooting, 48m MTTR) vs. *WITH HINDSIGHT MEMORY* (Grounding in precedent, 9m MTTR, 81% faster resolution).
   - **Memory Explorer**: Live semantic search across all indexed experiences in Hindsight bank `incidentiq`.

---

## 6. How to Run IncidentIQ

Launch the three services:

### Step 1: Start Hindsight Memory Server
```bash
cd backend
uvicorn hindsight_mock_server:app --port 8888 --reload
```

### Step 2: Start FastAPI Backend
```bash
cd backend
uvicorn main:app --port 8000 --reload
```

### Step 3: Start React Frontend
```bash
cd frontend
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

---

## 7. Automated Testing

Run the automated integration test suites:

### Step 5 AI Reasoning & Memory Lifecycle Test:
```bash
cd backend
py test_ai_analysis.py
```
*(Or: `python test_ai_analysis.py`)*

### Step 4 Hindsight Client Verification Suite:
```bash
cd backend
py test_hindsight.py
```
*(Or: `python test_hindsight.py`)*

