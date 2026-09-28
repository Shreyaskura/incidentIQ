import requests

BASE = 'http://localhost:5173'

def main():
    print("=== FINAL VERIFICATION CHECKS ===")

    # 1. Health check via single URL
    h = requests.get(f'{BASE}/api/health').json()
    print('1. Health check:', h)
    assert h.get('status') == 'ok', "Health status should be ok"
    assert h.get('hindsight_connected') is True, "Hindsight should be connected"
    assert h.get('hindsight_bank') == 'incidentiq', "Bank should be incidentiq"

    # 2. Memory list via single URL
    m = requests.get(f'{BASE}/api/memory?limit=5').json()
    total = m.get('total', 0)
    print(f'2. Memory Bank: total={total}, returned={len(m.get("memories", []))}, connected={m.get("hindsight_connected")}')
    assert total >= 22, f"Total memories should be at least 22, got {total}"
    assert m.get('hindsight_connected') is True, "Hindsight should be connected in memory endpoint"

    # 3. Memory Search via single URL
    s = requests.get(f'{BASE}/api/memory/search?q=PostgreSQL+connection+pool').json()
    print(f'3. Memory Search: query="{s.get("query")}", results={s.get("results_count")}')
    assert s.get('results_count') > 0, "Search should return matching memories"

    # 4. Analyze Incident via single URL
    a = requests.post(f'{BASE}/api/incidents/INC-204/analyze').json()
    recalled = a.get('historical_memories', [])
    top_match = recalled[0].get('incident_id') if recalled else None
    print(f'4. Analyze Incident INC-204: recalled_count={len(recalled)}, top_match={top_match}')
    assert len(recalled) > 0, "Analysis should recall historical memories"

    # 5. Resolve Incident via single URL
    res_body = {
        'root_cause': 'Verified and mitigated PostgreSQL connection saturation.',
        'resolution': 'Applied connection reaper pool configuration.',
        'worked': True
    }
    r = requests.post(f'{BASE}/api/incidents/INC-204/resolve', json=res_body).json()
    retained_status = r.get('hindsight_retain', {}).get('success')
    print('5. Resolve Incident INC-204: retained=', retained_status)
    assert retained_status is True, "Incident should be successfully retained"

    print("\n>>> ALL VERIFICATION CHECKS PASSED SUCCESSFULLY! <<<")

if __name__ == '__main__':
    main()
