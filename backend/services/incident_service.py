from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status

from services.hindsight_service import hindsight_service
from services.ai_service import ai_service
from models.incident import IncidentCreate, IncidentResolve
from models.memory import AiIncidentAnalysis, AiAnalysisResponse, SimilarIncidentMatch

# Seed in-memory incidents dataset
INITIAL_INCIDENTS: List[Dict[str, Any]] = [
    {
        "id": "INC-204",
        "title": "Production API 500 Errors",
        "severity": "P1",
        "severityLabel": "Critical",
        "status": "Investigating",
        "time": "8m ago",
        "service": "api-gateway-us-east",
        "lead": "Sarah K. (On-Call SRE)",
        "responder": "Sarah K. (On-Call SRE)",
        "impact": "HTTP 500 responses increasing rapidly across primary ingress routers (8.4% error rate). Upstream database connection timeouts observed.",
        "error_logs": "Database connection pool exhausted. Connection timeout on aurora-postgres-primary after 30000ms. HTTP 500 responses increasing. 502 Bad Gateway upstream socket connect error.",
        "root_cause": "Upstream database connection pool saturation causing gateway worker threads to stall waiting on connections and trigger HTTP 500 cascade.",
        "resolutionSummary": None,
        "resolvedAt": None,
        "duration": None,
        "createdAt": "2026-09-28T09:15:00Z",
        "retained_in_hindsight": False,
        "is_demo_incident": True,
    },
    {
        "id": "INC-203",
        "title": "Database Connection Timeout",
        "severity": "P1",
        "severityLabel": "Critical",
        "status": "Identified",
        "time": "28m ago",
        "service": "aurora-postgres-primary",
        "lead": "Marcus R. (Database Lead)",
        "responder": "Marcus R. (Database Lead)",
        "impact": "Connection pool saturated at 100/100 active connections. Read query latency > 4,200ms.",
        "error_logs": "FATAL: remaining connection slots are reserved for non-replication superuser connections (SQLSTATE 53300)",
        "root_cause": "Unclosed cursor handles during failed payment retry storms leading to connection starvation.",
        "resolutionSummary": None,
        "resolvedAt": None,
        "duration": None,
        "createdAt": "2026-09-28T08:30:00Z",
        "retained_in_hindsight": False,
    },
    {
        "id": "INC-202",
        "title": "Payment Service Failure",
        "severity": "P2",
        "severityLabel": "High",
        "status": "Mitigating",
        "time": "46m ago",
        "service": "checkout-payment-svc",
        "lead": "Elena V. (Payments Lead)",
        "responder": "Elena V. (Payments Lead)",
        "impact": "Stripe webhook retry storm tripping circuit breaker on batch settlement workers.",
        "error_logs": "RateLimitError: 429 Too Many Requests from api.stripe.com. CircuitBreaker open on payment_queue.",
        "root_cause": "Unthrottled webhook retry cascade without exponential backoff token bucket.",
        "resolutionSummary": None,
        "resolvedAt": None,
        "duration": None,
        "createdAt": "2026-09-28T08:12:00Z",
        "retained_in_hindsight": False,
    },
    {
        "id": "INC-201",
        "title": "Authentication Service Latency",
        "severity": "P3",
        "severityLabel": "Medium",
        "status": "Monitoring",
        "time": "1h 12m ago",
        "service": "auth0-session-broker",
        "lead": "Devin T. (Security Core)",
        "responder": "Devin T. (Security Core)",
        "impact": "p99 JWT validation duration jumped to 850ms following deployment v2.14.1.",
        "error_logs": "JWKSRetrievalTimeout: Failed to fetch public key set from auth0 endpoint within 500ms timeout.",
        "root_cause": "Stale JWKS public key cache eviction causing blocking remote fetches.",
        "resolutionSummary": None,
        "resolvedAt": None,
        "duration": None,
        "createdAt": "2026-09-28T07:46:00Z",
        "retained_in_hindsight": False,
    },
    {
        "id": "INC-198",
        "title": "Redis Cache Eviction Storm",
        "severity": "P2",
        "severityLabel": "High",
        "status": "Resolved",
        "time": "4h ago",
        "service": "cache-redis-cluster",
        "lead": "Alex Chen",
        "responder": "Alex Chen",
        "impact": "Volatile-lru eviction surge caused sudden cache hit drop to 41%.",
        "error_logs": "OOM command not allowed when used memory > 'maxmemory' (16GB)",
        "root_cause": "Memory cap undersized for weekend traffic spike; eviction storm overwhelmed backend DB.",
        "resolutionSummary": "Applied volatile-lru policy and resized memory threshold from 16GB to 32GB.",
        "resolvedAt": "Today 04:12 UTC",
        "duration": "34m",
        "createdAt": "2026-09-28T03:38:00Z",
        "retained_in_hindsight": True,
    },
    {
        "id": "INC-195",
        "title": "Ingress TLS Handshake Latency Spike",
        "severity": "P3",
        "severityLabel": "Medium",
        "status": "Resolved",
        "time": "Yesterday",
        "service": "k8s-ingress-traefik",
        "lead": "Elena Rostova",
        "responder": "Elena Rostova",
        "impact": "TLS negotiation handshake latency spiked to 320ms on EU edge.",
        "error_logs": "OCSP responder timeout: ocsp.digicert.com connection reset during client hello.",
        "root_cause": "Expired OCSP stapling cache interval forced synchronous CA verification on every handshake.",
        "resolutionSummary": "Updated OCSP stapling cache interval and renewed upstream intermediate certificates.",
        "resolvedAt": "Yesterday 18:40 UTC",
        "duration": "18m",
        "createdAt": "2026-09-27T18:22:00Z",
        "retained_in_hindsight": True,
    },
    {
        "id": "INC-184",
        "title": "DB Connection Pool Saturation Post-Release",
        "severity": "P1",
        "severityLabel": "Critical",
        "status": "Resolved",
        "time": "4 days ago",
        "service": "aurora-postgres-primary",
        "lead": "Sarah Kim",
        "responder": "Sarah Kim",
        "impact": "Max connection threshold reached after traffic surge; blocked active write pool.",
        "error_logs": "FATAL: sorry, too many clients already (max_connections=100 reached)",
        "root_cause": "Database connection pool saturated at 50 connections with unclosed connection handles.",
        "resolutionSummary": "Increased database connection pool from 50 to 100; patched unclosed connection leak in commit 8f29d1c.",
        "resolvedAt": "Sep 24 09:30 UTC",
        "duration": "22m",
        "createdAt": "2026-09-24T09:08:00Z",
        "retained_in_hindsight": True,
    },
]

incidents_db: List[Dict[str, Any]] = [item.copy() for item in INITIAL_INCIDENTS]


class IncidentService:
    def get_all(self, status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        if status_filter:
            sf = status_filter.lower()
            if sf == "active":
                return [inc for inc in incidents_db if inc.get("status") != "Resolved"]
            elif sf == "resolved":
                return [inc for inc in incidents_db if inc.get("status") == "Resolved"]
        return incidents_db

    def get_by_id(self, incident_id: str) -> Dict[str, Any]:
        for inc in incidents_db:
            if inc["id"].upper() == incident_id.upper():
                return inc
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID '{incident_id}' not found.",
        )

    def create(self, payload: IncidentCreate) -> Dict[str, Any]:
        global incidents_db
        max_num = 204
        for inc in incidents_db:
            if inc["id"].startswith("INC-"):
                try:
                    num = int(inc["id"].replace("INC-", ""))
                    if num > max_num:
                        max_num = num
                except ValueError:
                    pass

        new_id = f"INC-{max_num + 1}"
        severity_labels = {
            "P1": "Critical",
            "P2": "High",
            "P3": "Medium",
            "P4": "Low",
        }
        now_iso = datetime.now(timezone.utc).isoformat()
        responder_name = payload.lead or "Alex Chen (On-Call SRE)"

        new_incident = {
            "id": new_id,
            "title": payload.title,
            "severity": payload.severity,
            "severityLabel": severity_labels.get(payload.severity, "Medium"),
            "status": "Investigating",
            "time": "Just now",
            "service": payload.service,
            "lead": responder_name,
            "responder": responder_name,
            "impact": payload.impact,
            "error_logs": payload.error_logs or payload.impact,
            "root_cause": None,
            "resolutionSummary": None,
            "resolvedAt": None,
            "duration": None,
            "createdAt": now_iso,
            "retained_in_hindsight": False,
        }

        incidents_db.insert(0, new_incident)
        return new_incident

    def resolve(self, incident_id: str, payload: Optional[IncidentResolve] = None) -> Dict[str, Any]:
        inc = self.get_by_id(incident_id)
        inc["status"] = "Resolved"
        inc["resolvedAt"] = datetime.now(timezone.utc).strftime("%H:%M UTC")
        if not inc.get("duration"):
            inc["duration"] = "18m"

        if payload:
            if payload.root_cause:
                inc["root_cause"] = payload.root_cause
            if payload.resolution:
                inc["resolutionSummary"] = payload.resolution
            inc["worked"] = payload.worked
            if payload.deployment_info:
                inc["deployment_info"] = payload.deployment_info

        if not inc.get("resolutionSummary"):
            inc["resolutionSummary"] = (
                f"Remediated operational degradation on service '{inc['service']}'. "
                f"Root cause addressed and verified stable in production."
            )

        # Retain complete incident experience in Hindsight
        retain_res = hindsight_service.retain_incident(inc)
        inc["retained_in_hindsight"] = retain_res.get("success", False)

        return {
            "incident": inc,
            "hindsight_retain": retain_res,
            "message": f"Incident {incident_id} marked as resolved and retained in IncidentIQ Hindsight memory.",
        }

    def analyze_with_memory(self, incident_id: str) -> AiIncidentAnalysis:
        """
        Analyze incident using genuine AI reasoning grounded in Hindsight operational memory:
        1. Receive incident
        2. Build a meaningful search query from title, service, error logs, and impact
        3. Recall similar incidents from Hindsight
        4. Give incident + historical memories to the AI reasoning layer
        5. Return structured analysis with summary, root cause, evidence, historical memories,
           recommended actions, risks, confidence, and reasoning
        """
        incident = self.get_by_id(incident_id)
        title = incident.get("title", "")
        service = incident.get("service", "")
        error_logs = incident.get("error_logs") or ""
        impact = incident.get("impact", "")

        # 2. Build meaningful search query from actual incident details
        search_query = f"{title} {service} {error_logs} {impact}".strip()

        # 3. Recall similar incidents from Hindsight
        hindsight_connected = hindsight_service.is_available()
        recalled = []
        if hindsight_connected:
            try:
                recalled = hindsight_service.recall_similar_incidents(search_query, limit=5)
            except Exception as e:
                hindsight_connected = False
                recalled = []

        # 4 & 5. AI Reasoning layer synthesizes structured incident analysis
        analysis = ai_service.analyze_incident(
            incident=incident,
            recalled_memories=recalled,
            hindsight_connected=hindsight_connected,
        )

        return analysis

    def reset_demo_incident(self) -> Dict[str, Any]:
        """Reset or restore INC-204 as the active demo incident."""
        global incidents_db
        demo_inc = next((i for i in incidents_db if i["id"] == "INC-204"), None)
        if not demo_inc:
            demo_inc = {
                "id": "INC-204",
                "title": "Production API 500 Errors",
                "severity": "P1",
                "severityLabel": "Critical",
                "status": "Investigating",
                "time": "Just now",
                "service": "api-gateway-us-east",
                "lead": "Sarah K. (On-Call SRE)",
                "responder": "Sarah K. (On-Call SRE)",
                "impact": "HTTP 500 responses increasing rapidly across primary ingress routers (8.4% error rate). Upstream database connection timeouts observed.",
                "error_logs": "Database connection pool exhausted. Connection timeout on aurora-postgres-primary after 30000ms. HTTP 500 responses increasing. 502 Bad Gateway upstream socket connect error.",
                "root_cause": "Upstream database connection pool saturation causing gateway worker threads to stall waiting on connections and trigger HTTP 500 cascade.",
                "resolutionSummary": None,
                "resolvedAt": None,
                "duration": None,
                "createdAt": datetime.now(timezone.utc).isoformat(),
                "retained_in_hindsight": False,
                "is_demo_incident": True,
            }
            incidents_db.insert(0, demo_inc)
        else:
            demo_inc["status"] = "Investigating"
            demo_inc["resolutionSummary"] = None
            demo_inc["resolvedAt"] = None
            demo_inc["duration"] = None
            demo_inc["retained_in_hindsight"] = False
        return demo_inc


incident_service = IncidentService()
