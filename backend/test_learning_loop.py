import requests
import json

BASE = "http://localhost:5173"

def run_learning_loop_test():
    print("=== STARTING LEARNING LOOP TEST ===")
    
    # 1. Create Second Incident
    inc2_data = {
        "title": "PostgreSQL Connection Timeout Cascade",
        "service": "aurora-postgres-primary",
        "severity": "P1",
        "impact": "Database connection pool exhausted on secondary replica, HTTP 500 spike",
        "error_logs": "PostgreSQL connection timeout: connection pool exhausted after 30000ms"
    }
    r = requests.post(f"{BASE}/api/incidents", json=inc2_data)
    inc2 = r.json()
    inc2_id = inc2["id"]
    print(f"1. Created Second Incident: {inc2_id}")

    # 2. Analyze Second Incident - should recall first incident(s)
    r = requests.post(f"{BASE}/api/incidents/{inc2_id}/analyze")
    analysis2 = r.json()
    recalled2 = analysis2.get("historical_memories", [])
    print(f"2. Second Incident Analysis recalled {len(recalled2)} memories:")
    for m in recalled2:
        print(f"   - {m.get('incident_id')} | {m.get('title')} | Prev Fix: {m.get('previous_resolution')}")

    # 3. Resolve Second Incident and Retain
    resolve_payload = {
        "root_cause": "Stale idle sessions holding connection slots in connection pool.",
        "resolution": "Terminated idle in transaction connections and reloaded pool config.",
        "worked": True,
        "deployment_info": "DB parameter group patch"
    }
    r = requests.post(f"{BASE}/api/incidents/{inc2_id}/resolve", json=resolve_payload)
    ret_res = r.json().get("hindsight_retain", {})
    print(f"3. Second Incident Resolved: retained={ret_res.get('success')}, doc={ret_res.get('document_id')}")

    # 4. Create Third Incident
    inc3_data = {
        "title": "Aurora Database Connection Saturation Under Surge",
        "service": "aurora-postgres-primary",
        "severity": "P1",
        "impact": "Database connection pool exhaustion leading to gateway timeout",
        "error_logs": "FATAL: remaining connection slots are reserved. PostgreSQL connection pool exhausted."
    }
    r = requests.post(f"{BASE}/api/incidents", json=inc3_data)
    inc3 = r.json()
    inc3_id = inc3["id"]
    print(f"4. Created Third Incident: {inc3_id}")

    # 5. Analyze Third Incident - should recall MULTIPLE memories
    r = requests.post(f"{BASE}/api/incidents/{inc3_id}/analyze")
    analysis3 = r.json()
    recalled3 = analysis3.get("historical_memories", [])
    print(f"5. Third Incident Analysis recalled {len(recalled3)} MULTIPLE memories:")
    for m in recalled3:
        print(f"   - {m.get('incident_id')} | {m.get('title')} | Prev Fix: {m.get('previous_resolution')}")

    print("=== LEARNING LOOP TEST COMPLETE ===")

if __name__ == "__main__":
    run_learning_loop_test()
