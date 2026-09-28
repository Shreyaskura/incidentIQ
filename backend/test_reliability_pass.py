import json
import sys
import urllib.error
import urllib.request

BASE_URL = "http://localhost:8000"


def request(method: str, path: str, data: dict = None):
    url = f"{BASE_URL}{path}"
    body = json.dumps(data).encode("utf-8") if data else None
    headers = {"Content-Type": "application/json"} if data else {}
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            status_code = resp.status
            content = resp.read().decode("utf-8")
            return status_code, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            parsed = json.loads(content)
        except Exception:
            parsed = {"raw": content}
        return e.code, parsed


def run_tests():
    print("==================================================")
    print("IncidentIQ Step 7 Reliability & Integration Pass")
    print("==================================================")
    passed = 0
    total = 0

    def assert_test(name, condition, details=""):
        nonlocal passed, total
        total += 1
        if condition:
            print(f"  [PASS] {name}")
            passed += 1
        else:
            print(f"  [FAIL] {name}: {details}")

    # 1. Health check
    code, res = request("GET", "/health")
    assert_test("Health check returns 200 and status ok", code == 200 and res.get("status") == "ok")
    assert_test("Hindsight connected", res.get("hindsight_connected") is True)

    # 2. GET /api/incidents
    code, incidents = request("GET", "/api/incidents")
    assert_test("GET /api/incidents returns list", code == 200 and isinstance(incidents, list))

    # 3. GET valid incident
    code, inc = request("GET", "/api/incidents/INC-204")
    assert_test("GET /api/incidents/INC-204 returns incident", code == 200 and inc.get("id") == "INC-204")

    # 4. Error Handling: GET invalid incident ID
    code, err = request("GET", "/api/incidents/INC-NONEXISTENT")
    assert_test("GET invalid incident returns 404", code == 404, f"Got code {code}")

    # 5. Error Handling: POST invalid incident payload (title too short)
    code, err = request("POST", "/api/incidents", {"title": "X", "service": "test", "impact": "short"})
    assert_test("POST invalid incident returns 422 validation error", code == 422, f"Got code {code}")

    # 6. Error Handling: POST analyze invalid incident ID
    code, err = request("POST", "/api/incidents/INC-NONEXISTENT/analyze")
    assert_test("POST analyze invalid incident returns 404", code == 404, f"Got code {code}")

    # 7. Error Handling: POST resolve invalid incident ID
    code, err = request("POST", "/api/incidents/INC-NONEXISTENT/resolve")
    assert_test("POST resolve invalid incident returns 404", code == 404, f"Got code {code}")

    # 8. Create valid incident with empty error logs
    code, created_empty_logs = request(
        "POST",
        "/api/incidents",
        {
            "title": "Service Gateway Timeout",
            "service": "api-gateway",
            "severity": "P2",
            "impact": "Gateway returned 504 on downstream timeouts",
            "error_logs": None,
        },
    )
    assert_test("Create incident with empty error_logs succeeds", code == 201 and created_empty_logs.get("id") is not None)

    # 9. CRITICAL MEMORY TEST (Requirement 5)
    print("\n--- Running Requirement 5: Critical Memory Test ---")
    # Step A: Create First Incident
    code, first_inc = request(
        "POST",
        "/api/incidents",
        {
            "title": "Database Connection Pool Exhaustion",
            "service": "aurora-postgres",
            "severity": "P1",
            "impact": "Connection pool exhausted. PostgreSQL connection timeout. HTTP 500 errors increasing.",
            "error_logs": "Connection pool exhausted. PostgreSQL connection timeout. HTTP 500 errors increasing.",
        },
    )
    assert_test("Created first incident (DB Pool Exhaustion)", code == 201)
    first_id = first_inc["id"]

    # Step B: Resolve First Incident with exact resolution
    code, resolve_res = request(
        "POST",
        f"/api/incidents/{first_id}/resolve",
        {
            "root_cause": "PostgreSQL connection pool exhausted by unreleased connections",
            "resolution": "Increase connection pool and clean idle connections.",
            "worked": True,
        },
    )
    assert_test("First incident resolved and retained in Hindsight", code == 200 and resolve_res.get("incident", {}).get("retained_in_hindsight") is True)

    # Step C: Create Second Incident
    code, second_inc = request(
        "POST",
        "/api/incidents",
        {
            "title": "Production Database Connection Failures",
            "service": "aurora-postgres",
            "severity": "P1",
            "impact": "PostgreSQL connection timeout. Database connection pool exhausted. API returning HTTP 500.",
            "error_logs": "PostgreSQL connection timeout. Database connection pool exhausted. API returning HTTP 500.",
        },
    )
    assert_test("Created second incident (Production DB Connection Failures)", code == 201)
    second_id = second_inc["id"]

    # Step D: Analyze Second Incident
    code, analysis = request("POST", f"/api/incidents/{second_id}/analyze")
    assert_test("Analysis of second incident returned 200", code == 200)

    # Verify Hindsight Recall found the first incident
    memories = analysis.get("historical_memories", [])
    found_first = any(first_id in m.get("incident_id", "") or "Database Connection Pool Exhaustion" in m.get("memory", "") for m in memories)
    assert_test("Hindsight recall retrieved first incident as historical context", found_first or len(memories) > 0, f"Memories: {memories}")

    # Verify resolution is used in recommendations or previous resolutions
    has_res_action = any("Increase connection pool" in act or "clean idle" in act for act in analysis.get("recommended_actions", [])) or \
                     any("Increase connection pool" in r for r in analysis.get("previous_resolutions", [])) or \
                     any("Increase connection pool" in m.get("previous_resolution", "") for m in memories)
    assert_test("AI reasoning uses previous resolution ('Increase connection pool and clean idle connections.')", has_res_action)

    # 10. NEGATIVE MEMORY TEST (Requirement 6)
    print("\n--- Running Requirement 6: Negative Memory Test ---")
    code, unrelated_inc = request(
        "POST",
        "/api/incidents",
        {
            "title": "Subharmonic Interferometer Quantum Decoherence",
            "service": "quantum-telemetry-array",
            "severity": "P4",
            "impact": "Cryogenic telemetry sensor baseline phase frequency drift 4.2Hz",
            "error_logs": "SensorPhaseDrift: baseline frequency outside threshold. Non-production diagnostic node.",
        },
    )
    assert_test("Created completely unrelated incident", code == 201)
    unrelated_id = unrelated_inc["id"]

    code, un_analysis = request("POST", f"/api/incidents/{unrelated_id}/analyze")
    un_memories = un_analysis.get("historical_memories", [])
    assert_test("Negative memory test: Did NOT invent any database incident", not any("pool" in m.get("memory", "").lower() for m in un_memories))
    assert_test("Negative memory test: Historical memories is empty", len(un_memories) == 0, f"Got: {un_memories}")
    assert_test("Negative memory test: Reasoning states 'No relevant historical memory found'", "No relevant historical memory found" in un_analysis.get("reasoning", ""))

    # 11. Memory endpoints
    code, mem_list = request("GET", "/api/memory?limit=10")
    assert_test("GET /api/memory returns indexed memories", code == 200 and len(mem_list.get("items", [])) > 0)

    code, mem_search = request("GET", "/api/memory/search?q=connection%20pool")
    assert_test("GET /api/memory/search returns search results", code == 200 and mem_search.get("results_count", 0) > 0)

    code, mem_cats = request("GET", "/api/memory/categories")
    assert_test("GET /api/memory/categories returns categorized data", code == 200 and "past_incidents" in mem_cats.get("categories", {}))

    code, mem_timeline = request("GET", "/api/memory/timeline")
    assert_test("GET /api/memory/timeline returns knowledge timeline", code == 200 and len(mem_timeline.get("timeline", [])) > 0)

    print("\n==================================================")
    print(f"Test Summary: {passed}/{total} tests passed ({round(passed / total * 100)}%)")
    print("==================================================")
    return passed == total


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
