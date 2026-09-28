import logging
import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

from models.incident import Incident, IncidentCreate, IncidentResolve, HealthResponse
from models.memory import AiIncidentAnalysis, AiAnalysisResponse, MemoryListResponse, MemoryItem
from services.incident_service import incident_service
from services.hindsight_service import hindsight_service, HINDSIGHT_BANK_ID

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("incidentiq.api")

app = FastAPI(
    title="IncidentIQ Backend API",
    description="Full-stack AI-Powered Incident Response Agent with Hindsight Persistent Memory",
    version="0.4.0",
)

# Enable CORS for React frontend (Vite dev server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    """Ensure Hindsight memory bank is initialized on backend startup if available."""
    try:
        if hindsight_service.is_available():
            hindsight_service.ensure_bank_exists()
            logger.info("Connected to Hindsight memory service.")
        else:
            logger.warning("Hindsight server not detected on startup (will retry on demand).")
    except Exception as e:
        logger.warning(f"Startup Hindsight check note: {e}")


@app.get("/health", response_model=HealthResponse)
@app.get("/api/health", response_model=HealthResponse)
def health_check():
    """Simple health check endpoint that also monitors Hindsight connectivity."""
    hindsight_ok = hindsight_service.is_available()
    return {
        "status": "ok",
        "hindsight_connected": hindsight_ok,
        "hindsight_bank": HINDSIGHT_BANK_ID,
    }


@app.get("/api/incidents", response_model=List[Incident])
def get_incidents(status_filter: Optional[str] = None):
    """
    Returns a list of realistic sample incidents.
    Optionally filter by status (e.g. 'active' or 'resolved').
    """
    return incident_service.get_all(status_filter)


@app.get("/api/incidents/{incident_id}", response_model=Incident)
def get_incident(incident_id: str):
    """Returns details for one incident."""
    return incident_service.get_by_id(incident_id)


@app.post("/api/incidents", response_model=Incident, status_code=status.HTTP_201_CREATED)
def create_incident(payload: IncidentCreate):
    """Creates a new incident."""
    return incident_service.create(payload)


@app.post("/api/incidents/{incident_id}/analyze", response_model=AiIncidentAnalysis)
def analyze_incident(incident_id: str):
    """
    Analyzes an incident using Hindsight persistent operational memory:
    1. Builds search query from incident title, service, and error logs.
    2. Recalls similar incidents from Hindsight.
    3. Reflects on historical precedents and playbooks.
    4. Returns grounded remediation recommendations and memory evidence.
    """
    return incident_service.analyze_with_memory(incident_id)


@app.post("/api/incidents/{incident_id}/resolve")
def resolve_incident(incident_id: str, payload: Optional[IncidentResolve] = None):
    """
    Marks an incident as resolved and retains the complete incident post-mortem
    into Hindsight persistent semantic memory.
    """
    return incident_service.resolve(incident_id, payload)


@app.get("/api/memory", response_model=MemoryListResponse)
def get_memory_items(limit: int = Query(default=100)):
    """
    Queries Hindsight memory bank for stored incident post-mortems and lessons.
    """
    hindsight_ok = hindsight_service.is_available()
    items_raw = hindsight_service.list_all_memories(limit=limit)
    total_count = hindsight_service.get_memory_count() if hindsight_ok else len(items_raw)
    if total_count < len(items_raw):
        total_count = len(items_raw)

    return MemoryListResponse(
        total=total_count,
        bank_id=HINDSIGHT_BANK_ID,
        items=items_raw,
        memories=items_raw,
        hindsight_connected=hindsight_ok,
        mission=(
            "Remember production incidents, error patterns, root causes, successful and failed resolutions, "
            "deployment changes, affected services, and operational lessons. Prioritize information that can "
            "help diagnose future incidents."
        ),
    )


@app.get("/api/memory/search")
def search_memory(q: str = Query(..., min_length=2)):
    """
    Performs a Hindsight recall query against the memory bank to find relevant
    operational experience.
    """
    recalled = hindsight_service.recall_similar_incidents(query=q, limit=8)
    return {
        "query": q,
        "results_count": len(recalled),
        "source": "Hindsight memory",
        "results": recalled,
        "memories": recalled,
        "hindsight_connected": hindsight_service.is_available(),
    }


@app.get("/api/memory/categories")
def get_memory_categories_endpoint():
    """
    Returns categorized operational knowledge from Hindsight:
    Past Incidents, Root Causes, Successful Fixes, Failed Fixes, Deployment Lessons, Operational Patterns.
    """
    return hindsight_service.get_memory_categories()


@app.get("/api/memory/timeline")
def get_memory_timeline_endpoint():
    """
    Returns the chronologically growing operational knowledge timeline from Hindsight.
    """
    return {
        "timeline": hindsight_service.get_memory_timeline(),
        "total_milestones": len(hindsight_service.get_memory_timeline()),
        "bank_id": HINDSIGHT_BANK_ID,
    }


@app.post("/api/demo/reset")
def reset_demo():
    """
    Resets INC-204 to the un-resolved 'Investigating' demo state for live hackathon walkthrough.
    """
    reset_inc = incident_service.reset_demo_incident()
    return {
        "status": "reset",
        "incident": reset_inc,
        "message": "Demo incident INC-204 restored to active investigating state.",
    }
