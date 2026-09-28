"""
Local Hindsight Memory Server (FastAPI implementation of Hindsight REST API)
Provides a local Hindsight server listening on port 8888 for developer workflows.
Fully compliant with official `hindsight-client`.
"""

import json
import os
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Hindsight Memory API Server", version="0.10.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STORAGE_FILE = os.path.join(os.path.dirname(__file__), "hindsight_storage.json")

# In-memory banks and memories
banks: Dict[str, Dict[str, Any]] = {
    "incidentiq": {
        "bank_id": "incidentiq",
        "name": "IncidentIQ Memory Bank",
        "mission": (
            "Remember production incidents, error patterns, root causes, successful and failed resolutions, "
            "deployment changes, affected services, and operational lessons. Prioritize information that can "
            "help diagnose future incidents."
        ),
        "disposition": {"skepticism": 3, "literalism": 3, "empathy": 3},
        "background": "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
}

memories: Dict[str, List[Dict[str, Any]]] = {
    "incidentiq": []
}


def load_storage():
    global banks, memories
    if os.path.exists(STORAGE_FILE):
        try:
            with open(STORAGE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                banks.update(data.get("banks", {}))
                memories.update(data.get("memories", {}))
        except Exception as e:
            print(f"Warning: Failed to load storage from {STORAGE_FILE}: {e}")


def save_storage():
    try:
        with open(STORAGE_FILE, "w", encoding="utf-8") as f:
            json.dump({"banks": banks, "memories": memories}, f, indent=2)
    except Exception as e:
        print(f"Warning: Failed to save storage to {STORAGE_FILE}: {e}")


load_storage()


@app.get("/health")
def health():
    return {"status": "ok", "service": "hindsight-memory-server", "version": "0.10.1"}


@app.put("/v1/default/banks/{bank_id}")
def create_or_update_bank(bank_id: str, payload: Dict[str, Any]):
    banks[bank_id] = {
        "bank_id": bank_id,
        "name": payload.get("name") or f"Bank {bank_id}",
        "mission": payload.get("mission") or "",
        "disposition": {"skepticism": 3, "literalism": 3, "empathy": 3},
        "background": payload.get("background") or "",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if bank_id not in memories:
        memories[bank_id] = []
    save_storage()
    return banks[bank_id]


@app.get("/v1/default/banks/{bank_id}")
def get_bank(bank_id: str):
    if bank_id not in banks:
        raise HTTPException(status_code=404, detail=f"Bank {bank_id} not found")
    b = banks[bank_id].copy()
    if "disposition" not in b:
        b["disposition"] = {"skepticism": 3, "literalism": 3, "empathy": 3}
    return b


@app.post("/v1/default/banks/{bank_id}/memories")
def retain_memories(bank_id: str, payload: Dict[str, Any]):
    if bank_id not in banks:
        banks[bank_id] = {
            "bank_id": bank_id,
            "name": f"Bank {bank_id}",
            "mission": "Default memory bank",
            "disposition": {"skepticism": 3, "literalism": 3, "empathy": 3},
            "background": "",
        }
    if bank_id not in memories:
        memories[bank_id] = []

    items = payload.get("items", [])
    document_id = payload.get("document_id")

    # If document_id provided, remove existing memories with that document_id (upsert behavior)
    if document_id:
        memories[bank_id] = [m for m in memories[bank_id] if m.get("document_id") != document_id]

    created_count = 0
    now_iso = datetime.now(timezone.utc).isoformat()

    for idx, item in enumerate(items):
        mem_id = f"mem-{int(datetime.now().timestamp() * 1000)}-{idx}"
        content = item.get("content", "")
        if isinstance(content, list):
            content_text = " ".join([b.get("text", "") for b in content if isinstance(b, dict)])
        else:
            content_text = str(content)

        mem_record = {
            "id": mem_id,
            "text": content_text,
            "type": item.get("type", "experience"),
            "context": item.get("context", "production incident post-mortem"),
            "document_id": document_id or item.get("document_id"),
            "metadata": item.get("metadata", {}),
            "tags": item.get("tags", payload.get("document_tags", [])),
            "entities": item.get("entities", []),
            "mentioned_at": item.get("timestamp") or now_iso,
            "occurred_start": now_iso,
            "occurred_end": now_iso,
            "scores": {"final": 1.0, "semantic": 1.0, "keyword": 1.0},
        }
        memories[bank_id].append(mem_record)
        created_count += 1

    save_storage()
    return {
        "success": True,
        "bank_id": bank_id,
        "items_count": created_count,
        "async": False,
        "operation_id": None,
        "operation_ids": [],
        "usage": {"prompt_tokens": 100, "completion_tokens": 50, "total_tokens": 150},
    }


STOPWORDS = {
    "the", "a", "an", "and", "or", "to", "in", "on", "at", "by", "for", "with",
    "from", "of", "is", "was", "be", "this", "that", "it", "as", "are", "over",
    "under", "into", "after", "before", "during", "all", "any", "some", "via",
    "service", "services", "system", "systems", "error", "errors", "issue", "issues",
    "incident", "incidents", "status", "node", "nodes", "logs", "log", "observed",
    "detected", "active", "under", "over", "within", "without", "between"
}

DOMAIN_KEYWORDS = {
    "postgres", "postgresql", "aurora", "pool", "connections", "timeout", "timeouts",
    "redis", "eviction", "stampede", "jwt", "auth", "token", "tokens", "session",
    "stripe", "webhook", "circuit", "breaker", "kafka", "rebalance", "elasticsearch",
    "jvm", "fielddata", "migration", "alembic", "deadlock", "lock", "wal", "replication",
    "replica", "leak", "sse", "websocket", "sigterm", "crash", "throttle", "throttling",
    "500", "502", "503", "504", "grpc", "dns", "tls", "certificate", "rabbitmq",
    "oom", "memory", "cpu", "disk", "i/o", "gateway", "unlocked", "exhaustion"
}


def compute_relevance(query: str, text: str, tags: Any) -> float:
    words = re.findall(r"\w+", (query or "").lower())
    q_words = set(w for w in words if len(w) > 2 and w not in STOPWORDS)
    if not q_words:
        return 0.0

    safe_tags = [str(t) for t in (tags or []) if t]
    target_words = set(re.findall(r"\w+", (str(text or "") + " " + " ".join(safe_tags)).lower()))
    overlap = q_words.intersection(target_words)
    if not overlap:
        return 0.0

    domain_overlap = overlap.intersection(DOMAIN_KEYWORDS)
    # Require at least 2 distinct overlapping keywords, OR a strong domain keyword match
    if len(overlap) < 2 and not domain_overlap:
        return 0.0

    base_score = len(overlap) / len(q_words)

    # If no domain keywords match and overall overlap is weak, reject as unrelated
    if not domain_overlap and base_score < 0.35:
        return 0.0

    # Domain keyword boost for corroborated technical failure signatures
    boost = min(0.35, len(domain_overlap) * 0.15)
    total_score = min(1.0, base_score + boost)

    return total_score if total_score >= 0.25 else 0.0


@app.post("/v1/default/banks/{bank_id}/memories/recall")
def recall_memories(bank_id: str, payload: Dict[str, Any]):
    bank_memories = memories.get(bank_id, [])
    query = payload.get("query", "")

    scored_results = []
    for m in bank_memories:
        rel = compute_relevance(query, m.get("text", ""), m.get("tags", []))
        if rel >= 0.25:
            item_copy = m.copy()
            score_val = round(rel, 3)
            item_copy["scores"] = {"final": score_val, "semantic": score_val, "keyword": score_val}
            scored_results.append((rel, item_copy))

    scored_results.sort(key=lambda x: x[0], reverse=True)
    results = [item for _, item in scored_results[:8]]

    return {
        "results": results,
        "trace": None,
        "entities": {},
        "chunks": {},
        "source_facts": {},
        "source_facts_truncated": False,
    }


@app.post("/v1/default/banks/{bank_id}/reflect")
def reflect_on_memories(bank_id: str, payload: Dict[str, Any]):
    query = payload.get("query", "")
    bank_memories = memories.get(bank_id, [])

    recalled = []
    for m in bank_memories:
        rel = compute_relevance(query, m.get("text", ""), m.get("tags", []))
        if rel > 0.15:
            recalled.append(m)

    if recalled:
        top = recalled[0]
        text_response = (
            f"Based on historical incident memory in '{bank_id}', this situation strongly matches {top.get('document_id', 'past incident')}. "
            f"Historical observations: {top.get('text', '')[:220]}... "
            f"Operational recommendation: review previous resolution playbook from {top.get('document_id')}."
        )
    else:
        text_response = (
            f"Reflected across {len(bank_memories)} historical memories in bank '{bank_id}'. "
            f"No direct exact-match incident found. Proceed with standard diagnostic triage."
        )

    return {
        "text": text_response,
        "based_on": None,
        "structured_output": None,
        "structured_output_error": None,
        "usage": None,
        "trace": None,
    }


@app.get("/v1/default/banks/{bank_id}/memories/list")
def list_memories_endpoint(
    bank_id: str,
    limit: int = Query(default=100),
    offset: int = Query(default=0),
    search_query: Optional[str] = Query(default=None),
):
    all_mems = memories.get(bank_id, [])
    if search_query:
        all_mems = [
            m for m in all_mems
            if search_query.lower() in m.get("text", "").lower()
            or any(search_query.lower() in t.lower() for t in m.get("tags", []))
        ]

    total = len(all_mems)
    paged = all_mems[offset : offset + limit]

    items = []
    now_iso = datetime.now(timezone.utc).isoformat()
    for m in paged:
        items.append({
            "id": m.get("id"),
            "text": m.get("text", ""),
            "context": m.get("context", ""),
            "date": m.get("mentioned_at", now_iso),
            "fact_type": m.get("type", "experience"),
            "document_id": m.get("document_id"),
            "mentioned_at": m.get("mentioned_at", now_iso),
            "occurred_start": m.get("occurred_start", now_iso),
            "occurred_end": m.get("occurred_end", now_iso),
            "entities": "",
            "chunk_id": None,
            "proof_count": 1,
            "tags": m.get("tags", []),
            "metadata": m.get("metadata", {}),
            "consolidated_at": None,
            "consolidation_failed_at": None,
            "state": "valid",
            "invalidation_reason": None,
            "invalidated_at": None,
            "edited_at": None,
            "updated_at": None,
            "source_memory_ids": None,
        })

    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8888)
