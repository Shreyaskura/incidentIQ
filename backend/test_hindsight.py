"""
Backend integration tests for Hindsight memory flows:
1. Hindsight connection.
2. Retaining an incident.
3. Recalling a similar incident.
4. Resolving an incident and confirming it is retained.
5. Analyzing a new incident using historical memory.
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.hindsight_service import hindsight_service, HINDSIGHT_BANK_ID
from services.incident_service import incident_service
from models.incident import IncidentCreate, IncidentResolve


class TestHindsightIntegration(unittest.TestCase):
    def test_01_hindsight_connection(self):
        """1. Verify Hindsight connection and bank initialization."""
        is_up = hindsight_service.is_available()
        self.assertTrue(is_up, "Hindsight server should be reachable on configured base_url")
        bank_ready = hindsight_service.ensure_bank_exists()
        self.assertTrue(bank_ready, "Hindsight bank 'incidentiq' should be initialized")

    def test_02_retain_incident(self):
        """2. Verify retaining a test incident post-mortem in Hindsight."""
        test_inc = {
            "id": "INC-TEST-99",
            "title": "Kafka consumer offset commit timeout test",
            "service": "kafka-event-stream",
            "severity": "P2",
            "impact": "Consumer group rebalance storm caused 12m message delay",
            "error_logs": "CommitFailedException: The request timed out while waiting for group coordinator",
            "root_cause": "Heartbeat interval exceeded max.poll.interval.ms under large message batches",
            "resolutionSummary": "Increased max.poll.interval.ms from 300s to 600s and reduced max.poll.records to 250",
            "worked": True,
            "deployment_info": "Kafka consumer v2.1.0",
        }
        res = hindsight_service.retain_incident(test_inc)
        self.assertTrue(res.get("success"), f"Retain failed: {res}")
        self.assertEqual(res.get("document_id"), "incident-inc-test-99")

    def test_03_recall_similar_incident(self):
        """3. Verify recalling similar incidents from Hindsight memory."""
        recalled = hindsight_service.recall_similar_incidents(
            query="database connection pool timeout aurora postgres slots reserved",
            limit=3
        )
        self.assertIsInstance(recalled, list)
        self.assertGreater(len(recalled), 0, "Should recall at least one similar historical incident")
        top = recalled[0]
        self.assertIn("incident_id", top)
        self.assertIn("relevance_reason", top)
        self.assertIn("previous_resolution", top)
        self.assertEqual(top.get("source"), "Hindsight memory")
        print(f"Recalled: {top['incident_id']} -> {top['title']} (outcome: {top['outcome']})")

    def test_04_create_and_resolve_with_retain(self):
        """4. Verify resolving an incident retains it in Hindsight."""
        new_inc = incident_service.create(
            IncidentCreate(
                title="Stripe webhook retry surge test",
                service="checkout-payment-svc",
                severity="P2",
                impact="Duplicate charge notifications received",
                error_logs="DuplicateNotificationError: message already acknowledged",
                lead="Alex Chen (On-Call SRE)"
            )
        )
        inc_id = new_inc["id"]

        resolve_res = incident_service.resolve(
            incident_id=inc_id,
            payload=IncidentResolve(
                root_cause="Webhook idempotent token validation missing on settlement endpoint",
                resolution="Added Redis SETNX idempotency lock for 120 seconds",
                worked=True,
                deployment_info="Hotfix v4.0.3"
            )
        )
        self.assertEqual(resolve_res["incident"]["status"], "Resolved")
        self.assertTrue(resolve_res["incident"]["retained_in_hindsight"])
        self.assertIn("Hindsight memory", resolve_res["message"])

    def test_05_analyze_with_historical_memory(self):
        """5. Verify analyzing an incident uses recalled Hindsight memory."""
        analysis = incident_service.analyze_with_memory("INC-203")
        self.assertEqual(analysis.incident_id, "INC-203")
        self.assertIn("postgres", analysis.memory_explanation.lower() + analysis.likely_cause.lower())
        self.assertGreater(len(analysis.similar_incidents), 0)
        self.assertGreater(len(analysis.recommended_remediation), 0)
        self.assertEqual(analysis.source, "Hindsight memory")
        print(f"Analysis explanation: {analysis.memory_explanation[:120]}...")


if __name__ == "__main__":
    unittest.main()
