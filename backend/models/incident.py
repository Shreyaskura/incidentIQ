from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=3, description="Incident title")
    service: str = Field(..., min_length=2, description="Affected microservice or infrastructure")
    severity: str = Field(default="P2", description="Severity level: P1, P2, P3, P4")
    impact: str = Field(..., min_length=5, description="Observed symptoms or customer impact")
    error_logs: Optional[str] = Field(default=None, description="Raw error log snippets or stack traces")
    lead: Optional[str] = Field(default="Alex Chen (On-Call SRE)", description="Incident commander / lead")


class IncidentResolve(BaseModel):
    root_cause: Optional[str] = Field(default=None, description="Diagnosed root cause")
    resolution: Optional[str] = Field(default=None, description="Playbook or remediation actions executed")
    worked: Optional[bool] = Field(default=True, description="Whether the resolution was successful")
    deployment_info: Optional[str] = Field(default=None, description="Associated deploy/commit if applicable")


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
    error_logs: Optional[str] = None
    root_cause: Optional[str] = None
    resolutionSummary: Optional[str] = None
    resolvedAt: Optional[str] = None
    duration: Optional[str] = None
    createdAt: str
    retained_in_hindsight: Optional[bool] = False


class HealthResponse(BaseModel):
    status: str
    hindsight_connected: bool
    hindsight_bank: str
