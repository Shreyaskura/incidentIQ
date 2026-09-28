import React from 'react';
import { X, Clock, Layers, Terminal, CheckCircle2, RotateCw } from 'lucide-react';
import { formatDistanceToNow } from '../utils/timeUtils';

function SevPill({ sev }) {
  const cls = { P1: 'sev-p1', P2: 'sev-p2', P3: 'sev-p3', P4: 'sev-p4' }[sev] || 'sev-p4';
  const label = { P1: 'P1 Critical', P2: 'P2 High', P3: 'P3 Medium', P4: 'P4 Low' }[sev] || sev;
  return <span className={`sev-pill ${cls}`}>{label}</span>;
}

function StatusPill({ status }) {
  const cls = {
    'Investigating': 'status-investigating',
    'Identified':    'status-identified',
    'Monitoring':    'status-monitoring',
    'Mitigating':    'status-mitigating',
    'Resolved':      'status-resolved',
  }[status] || 'status-investigating';
  return <span className={`status-pill ${cls}`}>{status}</span>;
}

function buildTimeline(incident) {
  const events = [];
  const created = incident.createdAt || incident.time;

  if (created) {
    const d = new Date(created);
    events.push({ time: d, label: 'Incident detected', type: 'active' });
    events.push({ time: new Date(d.getTime() + 2 * 60000), label: 'Error rate increased above threshold', type: 'active' });
    events.push({ time: new Date(d.getTime() + 4 * 60000), label: `Alert triggered on ${incident.service}`, type: 'info' });
    events.push({ time: new Date(d.getTime() + 6 * 60000), label: 'Investigation started', type: 'info' });
  }

  if (incident.status === 'Resolved' && incident.resolvedAt) {
    events.push({ time: new Date(incident.resolvedAt), label: 'Incident resolved', type: 'resolved' });
    events.push({ time: new Date(new Date(incident.resolvedAt).getTime() + 30000), label: 'Experience stored in Hindsight', type: 'resolved' });
  }

  return events.sort((a, b) => a.time - b.time);
}

export default function IncidentDetailModal({
  incident,
  analysisData,
  isOpen,
  onClose,
  onAnalyze,
  onResolve,
  isAnalyzing,
}) {
  if (!isOpen || !incident) return null;

  const isResolved = incident.status === 'Resolved';
  const timeline   = buildTimeline(incident);

  const rootCause =
    analysisData?.likely_root_cause ||
    analysisData?.likely_cause ||
    incident.root_cause ||
    null;

  const evidence  = analysisData?.evidence || [];
  const memories  = analysisData?.historical_memories || [];
  const actions   = analysisData?.recommended_actions || [];

  const startedAt = incident.createdAt || incident.time;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="incident-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="incident-modal-header">
          <div className="incident-modal-header-left">
            <span className="incident-modal-id">{incident.id}</span>
            <div className="incident-modal-title">{incident.title}</div>
            <div className="incident-modal-badges">
              <SevPill sev={incident.severity} />
              <StatusPill status={incident.status} />
            </div>
            <div className="incident-modal-meta-row">
              <span className="incident-modal-meta-item">
                <Layers size={12} />
                <code>{incident.service}</code>
              </span>
              <span className="incident-modal-meta-item">
                Production
              </span>
              {startedAt && (
                <span className="incident-modal-meta-item">
                  <Clock size={12} />
                  Started {formatDistanceToNow(new Date(startedAt))}
                </span>
              )}
            </div>
          </div>
          <button className="incident-modal-close" onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        </div>

        {/* Body — two column */}
        <div className="incident-modal-body">

          {/* Left: main content */}
          <div className="incident-modal-main">

            {/* Timeline */}
            <div className="modal-section">
              <div className="modal-section-title">Timeline</div>
              <div className="timeline-list">
                {timeline.map((ev, i) => (
                  <div key={i} className="timeline-item">
                    <div className={`timeline-dot ${ev.type}`} />
                    <span className="timeline-time">
                      {ev.time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                    <span className="timeline-event">{ev.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Logs */}
            <div className="modal-section">
              <div className="modal-section-title">
                <Terminal size={11} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
                Error Logs
              </div>
              <pre className="modal-log-viewer">
                <code>{incident.error_logs || incident.impact || 'No raw logs recorded for this incident.'}</code>
              </pre>
            </div>

            {/* Investigation */}
            <div className="modal-section">
              <div className="modal-section-title">Investigation Summary</div>

              {rootCause && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 5 }}>
                    Likely Root Cause
                  </div>
                  <div className="investigation-root-cause">{rootCause}</div>
                </div>
              )}

              {evidence.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: 5 }}>
                    Supporting Evidence
                  </div>
                  <div className="evidence-list">
                    {evidence.map((e, i) => (
                      <div key={i} className="evidence-item">{e}</div>
                    ))}
                  </div>
                </div>
              )}

              {!rootCause && evidence.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                  {isAnalyzing ? 'Querying Hindsight memory...' : 'Click "Investigate" to run analysis.'}
                </p>
              )}
            </div>

            {/* Resolution */}
            {isResolved && (
              <div className="modal-section">
                <div className="modal-section-title">Resolution</div>
                <div className="investigation-root-cause" style={{ borderLeftColor: 'var(--green)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <CheckCircle2 size={12} style={{ color: 'var(--green)', flexShrink: 0 }} />
                    <span style={{ color: 'var(--green)', fontWeight: 600, fontSize: 11 }}>Incident resolved</span>
                  </div>
                  {incident.resolutionSummary && (
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {incident.resolutionSummary}
                    </p>
                  )}
                  {incident.retained_in_hindsight && (
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                      Post-mortem stored in Hindsight bank 'incidentiq'.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: historical context + actions */}
          <div className="incident-modal-side">

            {/* Historical Context */}
            <div className="dp-section">
              <div className="dp-section-title">
                Historical Context
                {memories.length > 0 && (
                  <span style={{ marginLeft: 'auto', color: 'var(--blue)', fontSize: 10, fontWeight: 600 }}>
                    {memories.length} found
                  </span>
                )}
              </div>
              <div className="dp-section-body">
                {memories.length > 0 ? (
                  memories.slice(0, 3).map((m, i) => (
                    <div key={i} className="historical-entry">
                      <div className="historical-entry-id">{m.incident_id}</div>
                      <div className="historical-entry-title">{m.title || 'Historical incident'}</div>
                      <div className="historical-entry-field">
                        <strong>Why relevant</strong>
                        {m.relevance_reason || m.memory || '—'}
                      </div>
                      <div className="historical-entry-field">
                        <strong>Previous resolution</strong>
                        {m.previous_resolution || '—'}
                      </div>
                      {m.outcome && (
                        <div className="historical-entry-field">
                          <strong>Outcome</strong>
                          {m.outcome}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="no-memory-note">
                    {isAnalyzing
                      ? 'Querying Hindsight memory...'
                      : 'No historical precedent matched.'}
                  </p>
                )}
              </div>
            </div>

            {/* Recommended Actions */}
            {actions.length > 0 && (
              <div className="dp-section">
                <div className="dp-section-title">Recommended Actions</div>
                <div className="dp-section-body">
                  <div className="action-list">
                    {actions.map((a, i) => (
                      <div key={i} className="action-item">
                        <span className="action-item-num">0{i + 1}</span>
                        <span>{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="incident-modal-footer">
          <div className="modal-footer-left">
            {!isResolved && (
              <button
                className="btn btn-default"
                onClick={() => onAnalyze(incident.id)}
                disabled={isAnalyzing}
              >
                <RotateCw size={13} className={isAnalyzing ? 'spin' : ''} />
                {isAnalyzing ? 'Investigating...' : 'Investigate'}
              </button>
            )}
          </div>
          <div className="modal-footer-right">
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
            {!isResolved && (
              <button
                className="btn btn-resolve"
                onClick={() => { onResolve(incident.id); onClose(); }}
              >
                <CheckCircle2 size={13} />
                Resolve &amp; Retain
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
