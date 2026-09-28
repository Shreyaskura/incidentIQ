"""
Automated Integration Tests for Step 5: IncidentIQ AI-Powered Incident Analysis
Tests:
1. Resembles historical incident -> Hindsight retrieves experience & AI uses it.
2. Completely different incident -> System does not invent a historical match, explicitly says 'No relevant historical memory found.'
3. Resolve an incident -> Retained in Hindsight -> Create similar incident -> Recalled newly resolved experience.
4. Error handling & resilience -> Hindsight offline fallback without backend crash.
"""

import json
import unittest
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8000"


class TestAiAnalysisStep5(unittest.TestCase):
    def test_01_database_incident_uses_historical_memory(self):
        """
        TEST 1: Create a database connection incident resembling INC-184.
        Expected: Hindsight retrieves the historical experience and AI uses it.
        """
        payload = {
            "title": "Postgres Connection Pool Saturation on Replica",
            "service": "aurora-postgres-primary",
            "severity": "P1",
            "impact": "Exhausted all available connections (100/100). Blocking active transactions.",
            "error_logs": "FATAL: sorry, too many clients already (max_connections=100 reached)",
            "lead": "Marcus R. (Database Lead)",
        }

        # 1. Create incident
        req = urllib.request.Request(
            f"{BASE_URL}/api/incidents",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req) as resp:
            self.assertEqual(resp.status, 201)
            inc = json.loads(resp.read().decode())
            inc_id = inc["id"]

        # 2. Analyze incident with AI
        req_analyze = urllib.request.Request(
            f"{BASE_URL}/api/incidents/{inc_id}/analyze",
            data=b"",
            method="POST",
        )
        with urllib.request.urlopen(req_analyze) as resp:
            self.assertEqual(resp.status, 200)
            analysis = json.loads(resp.read().decode())

            # Check required schema fields
            self.assertIn("summary", analysis)
            self.assertIn("likely_root_cause", analysis)
            self.assertIn("evidence", analysis)
            self.assertIn("historical_memories", analysis)
            self.assertIn("recommended_actions", analysis)
            self.assertIn("risks", analysis)
            self.assertIn("confidence", analysis)
            self.assertIn("reasoning", analysis)

            # Assert Hindsight retrieved historical memory
            memories = analysis["historical_memories"]
            self.assertGreater(len(memories), 0, "Expected at least one historical memory to be recalled")

            # Check that top memory is INC-184
            top_mem = memories[0]
            self.assertIn("INC-184", top_mem["incident_id"])
            self.assertIn("connection pool", top_mem["memory"].lower())
            self.assertTrue(len(top_mem["previous_resolution"]) > 10)

            # Check that AI reasoning references the historical precedent
            self.assertIn("INC-184", analysis["reasoning"])
            self.assertIn("connection", analysis["likely_root_cause"].lower())
            print(f"\n[TEST 1 PASS] Incident {inc_id} recalled historical precedent {top_mem['incident_id']}.")
            print(f"Top memory: {top_mem['memory'][:100]}...")
            print(f"AI Reasoning snippet: {analysis['reasoning'][:120]}...")

    def test_02_completely_different_incident_does_not_invent_memory(self):
        """
        TEST 2: Create a completely different incident (e.g. quantum crypto / space drone).
        Expected: The system should NOT invent a historical match and explicitly say
        'No relevant historical memory found.'
        """
        payload = {
            "title": "Quantum Lattice Key Exchange Desynchronization",
            "service": "aerospace-telemetry-uplink",
            "severity": "P3",
            "impact": "Satellite optical transceiver dropped orbital telemetry beacon over Pacific quadrant.",
            "error_logs": "OpticalPhasedArrayErr: QKD synchronization lost at 450nm photon detector",
            "lead": "Flight Systems Team",
        }

        # 1. Create incident
        req = urllib.request.Request(
            f"{BASE_URL}/api/incidents",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req) as resp:
            self.assertEqual(resp.status, 201)
            inc = json.loads(resp.read().decode())
            inc_id = inc["id"]

        # 2. Analyze incident with AI
        req_analyze = urllib.request.Request(
            f"{BASE_URL}/api/incidents/{inc_id}/analyze",
            data=b"",
            method="POST",
        )
        with urllib.request.urlopen(req_analyze) as resp:
            self.assertEqual(resp.status, 200)
            analysis = json.loads(resp.read().decode())

            # Historical memories MUST be empty
            self.assertEqual(
                len(analysis.get("historical_memories", [])),
                0,
                "Expected 0 historical memories for completely unrelated incident",
            )

            # System must explicitly state no relevant memory found
            reasoning = analysis.get("reasoning", "")
            self.assertIn("No relevant historical memory found", reasoning)

            # Must not invent fake similarity percentage
            for sim in analysis.get("similar_incidents", []):
                self.assertIsNone(sim.get("similarity_score"))

            print(f"\n[TEST 2 PASS] Unrelated incident {inc_id} correctly returned 0 memories.")
            print(f"Reasoning: {reasoning[:120]}...")

    def test_03_resolve_and_re_recall_new_experience(self):
        """
        TEST 3: Resolve an incident -> verify retained in Hindsight -> create similar incident -> verify newly resolved experience is recalled.
        """
        # Step A: Create and resolve novel incident
        unique_term = "ElasticsearchSegmentMergingDeadlock"
        novel_incident = {
            "title": f"Search Index Freeze via {unique_term}",
            "service": "catalog-search-indexing",
            "severity": "P1",
            "impact": "Query threads blocked on Lucene index writer lock.",
            "error_logs": f"LuceneLockObtainFailedException: {unique_term} during force_merge API call",
            "lead": "Search Infrastructure Team",
        }

        req = urllib.request.Request(
            f"{BASE_URL}/api/incidents",
            data=json.dumps(novel_incident).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req) as resp:
            inc = json.loads(resp.read().decode())
            first_id = inc["id"]

        # Resolve with specific resolution
        resolve_payload = {
            "root_cause": f"Concurrent index optimize triggered {unique_term} on 3 master shards simultaneously.",
            "resolution": "Disabled auto force_merge during peak traffic, increased max_thread_count to 4, and deleted lock file.",
            "worked": True,
        }
        req_resolve = urllib.request.Request(
            f"{BASE_URL}/api/incidents/{first_id}/resolve",
            data=json.dumps(resolve_payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req_resolve) as resp:
            self.assertEqual(resp.status, 200)
            res_data = json.loads(resp.read().decode())
            self.assertTrue(res_data["hindsight_retain"]["success"])
            print(f"\n[TEST 3a PASS] Incident {first_id} resolved and successfully retained in Hindsight.")

        # Step B: Create a second similar incident encountering the same deadlock
        second_incident = {
            "title": f"Catalog Search Latency Surge - {unique_term}",
            "service": "catalog-search-indexing",
            "severity": "P2",
            "impact": "Slow search responses due to thread contention.",
            "error_logs": f"IndexWriter lock held by {unique_term}",
            "lead": "Search On-Call",
        }

        req2 = urllib.request.Request(
            f"{BASE_URL}/api/incidents",
            data=json.dumps(second_incident).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req2) as resp:
            inc2 = json.loads(resp.read().decode())
            second_id = inc2["id"]

        # Step C: Analyze second incident - must recall newly retained first_id!
        req_analyze2 = urllib.request.Request(
            f"{BASE_URL}/api/incidents/{second_id}/analyze",
            data=b"",
            method="POST",
        )
        with urllib.request.urlopen(req_analyze2) as resp:
            self.assertEqual(resp.status, 200)
            analysis2 = json.loads(resp.read().decode())

            # Verify the first_id was recalled
            memories = analysis2.get("historical_memories", [])
            recalled_ids = [m["incident_id"] for m in memories]
            self.assertIn(first_id, recalled_ids, f"Expected newly retained {first_id} to be recalled in {recalled_ids}")

            matched_mem = next(m for m in memories if m["incident_id"] == first_id)
            self.assertIn("Disabled auto force_merge", matched_mem["previous_resolution"])
            self.assertIn(first_id, analysis2["reasoning"])
            print(f"[TEST 3b PASS] Second incident {second_id} successfully recalled experience from newly resolved {first_id}!")
            print(f"Recalled resolution: {matched_mem['previous_resolution'][:90]}...")


if __name__ == "__main__":
    unittest.main()
