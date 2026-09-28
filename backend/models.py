from typing import List, Optional
from pydantic import BaseModel, Field


class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=3, description="Incident title")
    service: str = Field(..., min_length=2, description="Affected microservice or infrastructure")
    severity: str = Field(default="P2", description="Severity level: P1, P2, P3, P4")
    impact: str = Field(..., min_length=5, description="Observed symptoms or customer impact")
    lead: Optional[str] = Field(default="Alex Chen (On-Call SRE)", description="Incident commander / lead")


class Incident(BaseModel):
    id: str
    title: str
    severity: str
    severityLabel: str
    status: str
    time: str
    service: str
    lead: str
    responder: Optional[str] = None
    impact: str
    resolutionSummary: Optional[str] = None
    resolvedAt: Optional[str] = None
    duration: Optional[str] = None
    createdAt: str


class MockAiAnalysis(BaseModel):
    incident_id: str
    likely_cause: str
    confidence: float
    similar_incident: str
    similarity_percentage: str
    previous_resolution: str
    recommended_remediation_steps: List[str]
    is_mock: bool = True
    note: str = "MOCK DATA - Real LLM reasoning will be connected in a future stage."


class HealthResponse(BaseModel):
    status: str
