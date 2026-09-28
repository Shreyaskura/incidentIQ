from datetime import datetime, timezone
from typing import Dict, List
from models import Incident, MockAiAnalysis

# In-memory store for incidents
INITIAL_INCIDENTS: List[Dict] = [
  {
    "id": "INC-204",
    "title": "API Server 500 Errors",
    "severity": "P1",
    "severityLabel": "Critical",
    "status": "Investigating",
    "time": "14m ago",
    "service": "api-gateway-us-east",
    "lead": "Sarah K. (On-Call SRE)",
    "impact": "Elevated 500 response rates across primary ingress routers (8.4% error rate). Upstream timeouts observed.",
    "resolutionSummary": None,
    "resolvedAt": None,
    "duration": None,
    "createdAt": "2026-09-28T08:45:00Z",
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
    "impact": "Connection pool saturated at 100/100 active connections. Read query latency > 4,200ms.",
    "resolutionSummary": None,
    "resolvedAt": None,
    "duration": None,
    "createdAt": "2026-09-28T08:30:00Z",
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
    "impact": "Stripe webhook retry storm tripping circuit breaker on batch settlement workers.",
    "resolutionSummary": None,
    "resolvedAt": None,
    "duration": None,
    "createdAt": "2026-09-28T08:12:00Z",
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
    "impact": "p99 JWT validation duration jumped to 850ms following deployment v2.14.1.",
    "resolutionSummary": None,
    "resolvedAt": None,
    "duration": None,
    "createdAt": "2026-09-28T07:46:00Z",
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
    "impact": "Volatile-lru eviction surge caused sudden cache hit drop to 41%.",
    "resolutionSummary": "Applied volatile-lru policy and resized memory threshold from 16GB to 32GB.",
    "resolvedAt": "Today 04:12 UTC",
    "duration": "34m",
    "createdAt": "2026-09-28T03:38:00Z",
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
    "impact": "TLS negotiation handshake latency spiked to 320ms on EU edge.",
    "resolutionSummary": "Updated OCSP stapling cache interval and renewed upstream intermediate certificates.",
    "resolvedAt": "Yesterday 18:40 UTC",
    "duration": "18m",
    "createdAt": "2026-09-27T18:22:00Z",
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
    "impact": "Max connection threshold reached after traffic surge; blocked active write pool.",
    "resolutionSummary": "Increased database connection pool from 50 to 100; patched unclosed connection leak.",
    "resolvedAt": "Sep 24 09:30 UTC",
    "duration": "22m",
    "createdAt": "2026-09-24T09:08:00Z",
  },
]

incidents_db: List[Dict] = []
for item in INITIAL_INCIDENTS:
    c = item.copy()
    c["responder"] = c.get("responder") or c.get("lead", "Alex Chen")
    incidents_db.append(c)
incident_counter = 205


def generate_mock_analysis(incident: Dict) -> MockAiAnalysis:
    service = incident.get("service", "").lower()
    title = incident.get("title", "").lower()

    if "postgres" in service or "database" in title or "pool" in title:
        return MockAiAnalysis(
            incident_id=incident["id"],
            likely_cause="Unclosed cursor handles during failed payment retry storms leading to connection starvation.",
            confidence=0.94,
            similar_incident="Incident #184 (Postgres Pool Exhaustion)",
            similarity_percentage="92%",
            previous_resolution="Increased database connection pool from 50 to 100.",
            recommended_remediation_steps=[
                "Temporarily scale connection pool ceiling from 100 to 150 via RDS Parameter Group.",
                "Execute active idle connection reaper for transactions idle in transaction > 30s.",
                "Review git commit 8f29d1c from Sep 24 to inspect connection handle leak fix."
            ],
            is_mock=True,
            note="MOCK DATA - Real LLM reasoning will be connected in a future stage."
        )
    elif "payment" in service or "stripe" in title or "checkout" in service:
        return MockAiAnalysis(
            incident_id=incident["id"],
            likely_cause="Downstream payment gateway webhook storm triggered exponential backoff retry cascade in Celery workers.",
            confidence=0.88,
            similar_incident="Incident #165 (Stripe Webhook Storm)",
            similarity_percentage="84%",
            previous_resolution="Scaled async consumer concurrency and enabled rate limiting token bucket.",
            recommended_remediation_steps=[
                "Scale worker replica count from 6 to 14 pods via kubectl deployment scale.",
                "Enable Redis token bucket limiter on incoming webhook endpoint (120 req/min).",
                "Purge dead letter queue duplicate notifications."
            ],
            is_mock=True,
            note="MOCK DATA - Real LLM reasoning will be connected in a future stage."
        )
    elif "api" in service or "500" in title or "gateway" in service:
        return MockAiAnalysis(
            incident_id=incident["id"],
            likely_cause="Upstream keepalive connection timeout mismatch between Envoy ingress and internal microservice listeners.",
            confidence=0.91,
            similar_incident="Incident #172 (Ingress Keepalive Timeout Drift)",
            similarity_percentage="88%",
            previous_resolution="Restarted unhealthy ingress pods and increased keepalive timeout to 65s.",
            recommended_remediation_steps=[
                "Perform rolling restart on unhealthy Envoy ingress pods.",
                "Verify upstream socket timeout config in Helm values (ensure timeout > 60s).",
                "Monitor 500 error rate drop on Prometheus dashboard."
            ],
            is_mock=True,
            note="MOCK DATA - Real LLM reasoning will be connected in a future stage."
        )
    elif "auth" in service or "jwt" in title or "token" in title:
        return MockAiAnalysis(
            incident_id=incident["id"],
            likely_cause="Stale JWKS public key cache eviction causing blocking remote fetches to identity provider on each request.",
            confidence=0.89,
            similar_incident="Incident #142 (Auth0 JWKS Cache Invalidation)",
            similarity_percentage="86%",
            previous_resolution="Reverted bad Redis token caching policy and cleared stale auth keys.",
            recommended_remediation_steps=[
                "Warm local JWKS public key cache with current active signing certificate.",
                "Increase JWKS cache TTL from 5m to 60m.",
                "Verify p99 verification latency returns to < 25ms baseline."
            ],
            is_mock=True,
            note="MOCK DATA - Real LLM reasoning will be connected in a future stage."
        )
    else:
        return MockAiAnalysis(
            incident_id=incident["id"],
            likely_cause=f"Resource saturation or unhandled exception in {incident.get('service')} processing pipeline.",
            confidence=0.85,
            similar_incident="Incident #170 (Generic Service Degradation)",
            similarity_percentage="81%",
            previous_resolution="Rolled back recent container deployment and cleared asynchronous queue backpressure.",
            recommended_remediation_steps=[
                f"Check runtime error logs and exception traces on {incident.get('service')}.",
                "Inspect resource metrics (CPU, RAM, thread pool saturation).",
                "Apply graceful restart or rollback to previous stable container tag."
            ],
            is_mock=True,
            note="MOCK DATA - Real LLM reasoning will be connected in a future stage."
        )
