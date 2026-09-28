import json
import logging
import os
import re
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional

from models.memory import AiIncidentAnalysis, HistoricalMemoryItem, SimilarIncidentMatch

logger = logging.getLogger("incidentiq.ai")

# Environment configuration
AI_PROVIDER = os.getenv("AI_PROVIDER", "auto").lower()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or ""
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY") or ""
AI_MODEL = os.getenv("AI_MODEL", "")


class AiService:
    def __init__(self):
        self.provider = AI_PROVIDER
        self.gemini_key = GEMINI_API_KEY
        self.openai_key = OPENAI_API_KEY
        self.model = AI_MODEL

    def analyze_incident(
        self,
        incident: Dict[str, Any],
        recalled_memories: List[Dict[str, Any]],
        hindsight_connected: bool = True,
    ) -> AiIncidentAnalysis:
        """
        AI Reasoning Pipeline:
        1. Current incident details + Hindsight historical memories
        2. If real LLM API keys configured -> Query LLM (Gemini / OpenAI) with strict grounding
        3. If no key or LLM error -> Apply dynamic IncidentIQ operational reasoning engine
        4. Guarantee: NEVER invent historical incidents. If no memories, explicitly say
           'No relevant historical memory found.'
        """
        inc_id = incident.get("id", "INC-UNKNOWN")
        title = incident.get("title", "Untitled Incident")
        service = incident.get("service", "unknown-service")
        error_logs = incident.get("error_logs") or incident.get("impact", "No logs provided.")

        # Check if external LLM provider can be used
        use_gemini = (self.provider in ["gemini", "auto"]) and bool(self.gemini_key)
        use_openai = (self.provider in ["openai", "auto"]) and bool(self.openai_key)

        if use_gemini:
            try:
                logger.info(f"Invoking Gemini AI reasoning for incident {inc_id}...")
                analysis = self._call_gemini(incident, recalled_memories, hindsight_connected)
                if analysis:
                    return analysis
            except Exception as e:
                logger.warning(f"Gemini API call failed ({e}). Falling back to local reasoning engine.")

        elif use_openai:
            try:
                logger.info(f"Invoking OpenAI reasoning for incident {inc_id}...")
                analysis = self._call_openai(incident, recalled_memories, hindsight_connected)
                if analysis:
                    return analysis
            except Exception as e:
                logger.warning(f"OpenAI API call failed ({e}). Falling back to local reasoning engine.")

        # Default / Graceful Fallback: Built-in Operational Reasoning Engine
        return self._reason_dynamically(incident, recalled_memories, hindsight_connected)

    def _call_gemini(
        self,
        incident: Dict[str, Any],
        recalled_memories: List[Dict[str, Any]],
        hindsight_connected: bool,
    ) -> Optional[AiIncidentAnalysis]:
        """Query Gemini API via standard REST endpoint."""
        model_name = self.model or "gemini-1.5-flash"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.gemini_key}"

        prompt = self._build_llm_prompt(incident, recalled_memories, hindsight_connected)

        body = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.2,
            },
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=12) as response:
            if response.status == 200:
                resp_data = json.loads(response.read().decode("utf-8"))
                candidates = resp_data.get("candidates", [])
                if candidates:
                    content_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    parsed = json.loads(content_text)
                    return self._build_analysis_model(incident, parsed, recalled_memories, hindsight_connected, f"gemini/{model_name}")
        return None

    def _call_openai(
        self,
        incident: Dict[str, Any],
        recalled_memories: List[Dict[str, Any]],
        hindsight_connected: bool,
    ) -> Optional[AiIncidentAnalysis]:
        """Query OpenAI API via standard REST endpoint."""
        model_name = self.model or "gpt-4o-mini"
        url = "https://api.openai.com/v1/chat/completions"

        prompt = self._build_llm_prompt(incident, recalled_memories, hindsight_connected)

        body = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": "You are IncidentIQ's AI incident response reasoning engine. Ground all reasoning in real memories."},
                {"role": "user", "content": prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(body).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.openai_key}",
            },
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=12) as response:
            if response.status == 200:
                resp_data = json.loads(response.read().decode("utf-8"))
                content_text = resp_data["choices"][0]["message"]["content"]
                parsed = json.loads(content_text)
                return self._build_analysis_model(incident, parsed, recalled_memories, hindsight_connected, f"openai/{model_name}")
        return None

    def _build_llm_prompt(
        self,
        incident: Dict[str, Any],
        recalled_memories: List[Dict[str, Any]],
        hindsight_connected: bool,
    ) -> str:
        memories_repr = ""
        if recalled_memories:
            for idx, m in enumerate(recalled_memories):
                memories_repr += (
                    f"\nMemory {idx + 1}:\n"
                    f"- Incident ID: {m.get('incident_id', 'N/A')}\n"
                    f"- Title: {m.get('title', 'N/A')}\n"
                    f"- Root Cause: {m.get('relevance_reason', 'N/A')}\n"
                    f"- Previous Resolution: {m.get('previous_resolution', 'N/A')}\n"
                    f"- Outcome: {m.get('outcome', 'Resolved successfully')}\n"
                    f"- Full Text: {m.get('raw_text', '')}\n"
                )
        else:
            memories_repr = "No relevant historical memories retrieved from Hindsight.\n"

        prompt = f"""
You are the AI Reasoning Engine for IncidentIQ, an intelligent incident response assistant.

ACTIVE INCIDENT TO ANALYZE:
- Incident ID: {incident.get('id')}
- Title: {incident.get('title')}
- Affected Service: {incident.get('service')}
- Severity: {incident.get('severity')} ({incident.get('severityLabel', 'Medium')})
- Impact: {incident.get('impact')}
- Error Logs / Stack Trace: {incident.get('error_logs')}
- Timestamp: {incident.get('createdAt') or incident.get('time')}

HINDSIGHT HISTORICAL OPERATIONAL MEMORIES (from memory bank 'incidentiq'):
{memories_repr}

CRITICAL RULES:
1. NEVER invent historical incidents. If no memories were retrieved or none are relevant, set "historical_memories" to [] and explicitly state in "reasoning": "No relevant historical memory found."
2. Do not invent fake percentage similarity numbers like "92%".
3. Return ONLY a valid JSON object matching this schema:
{{
  "summary": "Concise summary of current incident state",
  "likely_root_cause": "Specific technical root cause based on error logs and historical precedent",
  "evidence": ["Evidence point 1", "Evidence point 2"],
  "historical_memories": [
    {{
      "incident_id": "INC-XXX",
      "memory": "Summary of what happened in the past incident",
      "previous_resolution": "What resolved it in the past",
      "why_it_matters": "Why this historical incident explains the active issue"
    }}
  ],
  "recommended_actions": [
    "Concrete actionable step 1",
    "Concrete actionable step 2",
    "Concrete actionable step 3"
  ],
  "risks": [
    "Potential risk or failure mode to watch out for"
  ],
  "confidence": "High / Medium / Low with brief justification",
  "reasoning": "Explanation connecting current symptoms to past operational experience, explaining what happened before, what caused it, what worked, and why this recommendation is being made."
}}
"""
        return prompt

    def _build_analysis_model(
        self,
        incident: Dict[str, Any],
        parsed: Dict[str, Any],
        recalled_memories: List[Dict[str, Any]],
        hindsight_connected: bool,
        provider_name: str,
    ) -> AiIncidentAnalysis:
        inc_id = incident.get("id", "INC-UNKNOWN")

        hist_items: List[HistoricalMemoryItem] = []
        for m in parsed.get("historical_memories", []):
            hist_items.append(
                HistoricalMemoryItem(
                    incident_id=m.get("incident_id", "HISTORICAL"),
                    title=m.get("title") or (m.get("memory", "").split(" - ")[0] if " - " in m.get("memory", "") else None),
                    memory=m.get("memory", ""),
                    previous_resolution=m.get("previous_resolution", ""),
                    why_it_matters=m.get("why_it_matters", "Correlated operational failure pattern"),
                    outcome=m.get("outcome", "Resolved successfully"),
                    similarity_label="Relevant historical memory",
                    similarity_score=None,
                    source="Hindsight memory",
                )
            )

        sim_matches: List[SimilarIncidentMatch] = []
        for h in hist_items:
            sim_matches.append(
                SimilarIncidentMatch(
                    incident_id=h.incident_id,
                    title=f"Historical Incident {h.incident_id}",
                    relevance_reason=h.why_it_matters or h.memory,
                    previous_resolution=h.previous_resolution,
                    outcome=h.outcome or "Resolved successfully",
                    similarity_label="Relevant historical memory",
                    source="Hindsight memory",
                )
            )

        recommended = parsed.get("recommended_actions", [])
        likely_cause = parsed.get("likely_root_cause", "Investigate active application logs.")
        reasoning = parsed.get("reasoning", "")
        summary = parsed.get("summary", f"Degradation observed on service {incident.get('service')}")

        return AiIncidentAnalysis(
            incident_id=inc_id,
            summary=summary,
            likely_root_cause=likely_cause,
            evidence=parsed.get("evidence", [incident.get("error_logs") or "Active service errors"]),
            historical_memories=hist_items,
            recommended_actions=recommended,
            risks=parsed.get("risks", ["Potential service downtime during restart"]),
            confidence=parsed.get("confidence", "Medium"),
            reasoning=reasoning,
            likely_cause=likely_cause,
            recommended_remediation=recommended,
            previous_resolutions=[h.previous_resolution for h in hist_items if h.previous_resolution],
            memory_explanation=reasoning,
            similar_incidents=sim_matches,
            source="Hindsight memory",
            hindsight_connected=hindsight_connected,
            memory_count_recalled=len(hist_items),
            ai_provider=provider_name,
        )

    def _reason_dynamically(
        self,
        incident: Dict[str, Any],
        recalled_memories: List[Dict[str, Any]],
        hindsight_connected: bool,
    ) -> AiIncidentAnalysis:
        """
        IncidentIQ Dynamic Operational Reasoning Engine:
        Connects active telemetry and error codes with real Hindsight memories.
        Strictly avoids inventing memories when none are found.
        """
        inc_id = incident.get("id", "INC-UNKNOWN")
        title = incident.get("title", "")
        service = incident.get("service", "")
        error_logs = incident.get("error_logs") or incident.get("impact", "")
        impact = incident.get("impact", "")
        severity = incident.get("severity", "P2")

        # CASE 1: No Hindsight memories returned
        if not recalled_memories:
            no_mem_reasoning = (
                f"No relevant historical memory found in Hindsight memory bank 'incidentiq' "
                f"matching service '{service}' or error pattern '{title}'. "
                f"Analysis conducted from first-principles operational diagnostics."
            )
            if not hindsight_connected:
                no_mem_reasoning = (
                    "Hindsight memory service is currently offline or unreachable. "
                    "Historical memory could not be retrieved. "
                    "Conducting standalone first-principles incident triage."
                )

            # Heuristic first-principles diagnosis
            likely_root_cause = f"Unhandled failure or resource saturation detected in {service}."
            evidence = [
                f"Service under alert: {service} (Severity: {severity})",
                f"Active symptom: {impact}",
            ]
            if error_logs and error_logs != impact:
                evidence.append(f"Observed log: {error_logs[:160]}")

            recommended_actions = [
                f"Inspect container logs and Prometheus metrics for service '{service}'.",
                "Check upstream load balancer and ingress gateway error budgets.",
                "Verify recent deployment history or feature flag changes.",
            ]
            risks = [
                "Premature restart of active workers could drop in-flight requests.",
                "Lack of historical playbook requires careful manual log inspection.",
            ]

            return AiIncidentAnalysis(
                incident_id=inc_id,
                summary=f"Incident {inc_id} on '{service}' shows active degradation. No prior matching incident exists in operational memory.",
                likely_root_cause=likely_root_cause,
                evidence=evidence,
                historical_memories=[],
                recommended_actions=recommended_actions,
                risks=risks,
                confidence="Medium (First-principles analysis - No prior memory)",
                reasoning=no_mem_reasoning,
                likely_cause=likely_root_cause,
                recommended_remediation=recommended_actions,
                previous_resolutions=[],
                memory_explanation=no_mem_reasoning,
                similar_incidents=[],
                source="Hindsight memory" if hindsight_connected else "Stand-alone triage (Hindsight offline)",
                hindsight_connected=hindsight_connected,
                memory_count_recalled=0,
                ai_provider="incidentiq-reasoning-engine",
            )

        # CASE 2: Relevant memories were recalled from Hindsight
        hist_items: List[HistoricalMemoryItem] = []
        similar_matches: List[SimilarIncidentMatch] = []
        previous_resolutions: List[str] = []

        for m in recalled_memories:
            past_id = m.get("incident_id", "HISTORICAL")
            past_title = m.get("title", "Past Outage")
            relevance = m.get("relevance_reason", "Historical outage correlation")
            prev_res = m.get("previous_resolution", "Standard mitigation playbook")
            outcome = m.get("outcome", "Resolved successfully")
            score = m.get("similarity_score")

            why_it_matters = (
                f"Previous incident {past_id} ('{past_title}') experienced the same failure mode: {relevance}."
            )

            item = HistoricalMemoryItem(
                incident_id=past_id,
                title=past_title,
                memory=f"{past_title} - {relevance}",
                previous_resolution=prev_res,
                why_it_matters=why_it_matters,
                outcome=outcome,
                similarity_score=score,
                similarity_label="Relevant historical memory",
                source="Hindsight memory",
            )
            hist_items.append(item)

            similar_matches.append(
                SimilarIncidentMatch(
                    incident_id=past_id,
                    title=past_title,
                    relevance_reason=relevance,
                    previous_resolution=prev_res,
                    outcome=outcome,
                    similarity_score=score,
                    similarity_label="Relevant historical memory",
                    source="Hindsight memory",
                )
            )
            if prev_res and prev_res not in previous_resolutions:
                previous_resolutions.append(prev_res)

        top_match = hist_items[0]

        # Synthesize technical root cause connecting logs with historical cause
        likely_root_cause = (
            f"Pattern aligns with historical incident {top_match.incident_id}: {top_match.memory}. "
            f"Active telemetry on '{service}' indicates identical resource or communication breakdown."
        )

        # Evidence gathering
        evidence = [
            f"Active symptom on '{service}': {impact}",
            f"Error log match: {error_logs[:140]}",
            f"Historical precedent: {top_match.incident_id} ({top_match.outcome})",
            f"Recalled {len(hist_items)} relevant operational memories from Hindsight bank 'incidentiq'",
        ]

        # Recommended Actions synthesized from prior working resolutions
        recommended_actions = [
            f"Apply verified mitigation from {top_match.incident_id}: {top_match.previous_resolution}",
        ]
        if len(hist_items) > 1 and hist_items[1].previous_resolution:
            recommended_actions.append(f"Secondary operational check (per {hist_items[1].incident_id}): {hist_items[1].previous_resolution}")
        recommended_actions.append(f"Monitor {service} p99 latency and error rates for 10 minutes post-mitigation.")

        # Risks
        risks = [
            f"If mitigation from {top_match.incident_id} is applied without verifying configuration parameters, connection or memory limits may be exceeded.",
            "Avoid aggressive container restarts that drop persistent database transactions.",
        ]

        # Structured Reasoning
        precedent_ids = [h.incident_id for h in hist_items[:3]]
        precedent_text = ", ".join(precedent_ids)
        reasoning = (
            f"The error pattern on service '{service}' matches previous production incident(s) {precedent_text}. "
            f"In previous occurrence {top_match.incident_id}, the root cause was '{top_match.memory}', which was successfully resolved by: "
            f"'{top_match.previous_resolution}'. Because active telemetry shows identical failure dynamics, "
            f"applying the proven remediation from {top_match.incident_id} has the highest likelihood of restoring service "
            f"without introducing untested configuration changes."
        )

        summary = (
            f"Active incident {inc_id} on '{service}' correlates strongly with historical experience {top_match.incident_id}. "
            f"Previous resolution '{top_match.previous_resolution}' is recommended as primary recovery step."
        )

        return AiIncidentAnalysis(
            incident_id=inc_id,
            summary=summary,
            likely_root_cause=likely_root_cause,
            evidence=evidence,
            historical_memories=hist_items,
            recommended_actions=recommended_actions,
            risks=risks,
            confidence="High (Historical Precedent Verified in Bank 'incidentiq')",
            reasoning=reasoning,
            likely_cause=likely_root_cause,
            recommended_remediation=recommended_actions,
            previous_resolutions=previous_resolutions,
            memory_explanation=reasoning,
            similar_incidents=similar_matches,
            source="Hindsight memory",
            hindsight_connected=hindsight_connected,
            memory_count_recalled=len(hist_items),
            ai_provider="incidentiq-reasoning-engine",
        )


# Global singleton instance
ai_service = AiService()
