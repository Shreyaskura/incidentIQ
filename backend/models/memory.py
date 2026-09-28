from typing import List, Optional, Any, Dict, Union
from pydantic import BaseModel, Field


class HistoricalMemoryItem(BaseModel):
    incident_id: str
    title: Optional[str] = None
    memory: str
    previous_resolution: str
    why_it_matters: Optional[str] = None
    outcome: Optional[str] = "Resolved successfully"
    similarity_score: Optional[float] = None
    similarity_label: Optional[str] = "Relevant historical memory"
    source: Optional[str] = "Hindsight memory"


class SimilarIncidentMatch(BaseModel):
    incident_id: str
    title: str
    relevance_reason: str
    previous_resolution: str
    outcome: str = "Resolved successfully"
    similarity_score: Optional[float] = None
    similarity_label: str = "Relevant historical memory"
    source: str = "Hindsight memory"


class AiIncidentAnalysis(BaseModel):
    incident_id: str
    summary: str
    likely_root_cause: str
    evidence: List[str]
    historical_memories: List[HistoricalMemoryItem] = []
    recommended_actions: List[str]
    risks: List[str]
    confidence: str
    reasoning: str

    # Compatibility / helper fields
    likely_cause: Optional[str] = None
    recommended_remediation: Optional[List[str]] = None
    previous_resolutions: Optional[List[str]] = None
    memory_explanation: Optional[str] = None
    similar_incidents: Optional[List[SimilarIncidentMatch]] = None
    source: str = "Hindsight memory"
    hindsight_connected: bool = True
    memory_count_recalled: int = 0
    ai_provider: Optional[str] = "incidentiq-reasoning-engine"
    status: Optional[str] = "success"
    error: Optional[str] = None


# Backward-compatible alias
AiAnalysisResponse = AiIncidentAnalysis


class MemoryItem(BaseModel):
    id: str
    title: str
    text: str
    category: str
    context: str
    service: Optional[str] = None
    incident_id: Optional[str] = None
    document_id: Optional[str] = None
    tags: List[str] = []
    date: str
    source: str = "Hindsight memory"


class MemoryListResponse(BaseModel):
    total: int
    bank_id: str
    items: List[MemoryItem]
    memories: Optional[List[MemoryItem]] = None
    hindsight_connected: bool
    mission: str

