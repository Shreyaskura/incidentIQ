import React from 'react';
import { RotateCw, CheckCircle2, Eye, ShieldAlert } from 'lucide-react';

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

export default function AiInsightPanel({
  selectedIncident,
  analysisData,
  onAnalyzeIncident,
  isAnalyzing,
  onOpenDetailModal,
  onResolveIncident,
}) {
  if (!selectedIncident) {
    return (
      <div className="detail-panel">
        <div className="detail-panel-empty">
          <ShieldAlert size={28} />
          <p>Select an incident from the table to view the investigation summary.</p>
        </div>
      </div>
    );
  }

  const isResolved = selectedIncident.status === 'Resolved';

  const rootCause =
    analysisData?.likely_root_cause ||
    analysisData?.likely_cause ||
    selectedIncident.root_cause ||
    null;

  const evidence = analysisData?.evidence || [];
  const memories = analysisData?.historical_memories || [];
  const actions  = analysisData?.recommended_actions || [];

  return (
    <div className="detail-panel">
      {/* Header */}
      <div className="detail-panel-header">
        <div className="detail-panel-id">{selectedIncident.id}</div>
        <div className="detail-panel-title">{selectedIncident.title}</div>
        <div className="detail-panel-badges">
          <SevPill sev={selectedIncident.severity} />
          <StatusPill status={selectedIncident.status} />
        </div>
      </div>

      {/* Metadata Card */}
      <div className="detail-panel-meta">
        <div className="detail-panel-meta-row">
          <span className="detail-meta-key">Service</span>
          <span className="detail-meta-val">{selectedIncident.service}</span>
        </div>
        <div className="detail-panel-meta-row">
          <span className="detail-meta-key">Assignee</span>
          <span className="detail-meta-val">{selectedIncident.lead || selectedIncident.responder || 'Unassigned'}</span>
        </div>
        {selectedIncident.retained_in_hindsight && (
          <div className="detail-panel-meta-row">
            <span className="detail-meta-key">Memory</span>
            <span className="detail-meta-val" style={{ color: 'var(--green)' }}>Stored in Hindsight</span>
          </div>
        )}
      </div>

      {/* Investigation Details */}
      {analysisData ? (
        <>
          {rootCause && (
            <div className="dp-section">
              <div className="dp-section-title">Root Cause</div>
              <div className="dp-section-body">
                <div className="investigation-root-cause">{rootCause}</div>
              </div>
            </div>
          )}

          {evidence.length > 0 && (
            <div className="dp-section">
              <div className="dp-section-title">Evidence</div>
              <div className="dp-section-body">
                <div className="evidence-list">
                  {evidence.map((e, i) => (
                    <div key={i} className="evidence-item">{e}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Historical Context — Hindsight memories */}
          <div className="dp-section">
            <div className="dp-section-title">
              Historical Context
              {memories.length > 0 && (
                <span style={{ marginLeft: 'auto', color: 'var(--blue)', fontSize: '10px', fontWeight: 600 }}>
                  {memories.length} match{memories.length > 1 ? 'es' : ''}
                </span>
              )}
            </div>
            <div className="dp-section-body">
              {memories.length > 0 ? (
                memories.slice(0, 3).map((m, i) => (
                  <div key={i} className="historical-entry">
                    <div className="historical-entry-id">{m.incident_id}</div>
                    <div className="historical-entry-title">{m.title || 'Historical precedent'}</div>
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
                  No prior incident matched. Reasoning from first principles.
                </p>
              )}
            </div>
          </div>

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
        </>
      ) : (
        <div className="dp-section">
          <div className="dp-section-title">Investigation Summary</div>
          <div className="dp-section-body">
            <p className="no-memory-note">
              {isAnalyzing ? 'Querying Hindsight memory...' : 'Click "Investigate" to start analysis.'}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      {!isResolved && (
        <div className="detail-panel-actions">
          <button
            className="dp-btn dp-btn-primary"
            onClick={() => onAnalyzeIncident(selectedIncident.id)}
            disabled={isAnalyzing}
          >
            <RotateCw size={12} className={isAnalyzing ? 'spin' : ''} />
            {isAnalyzing ? 'Investigating...' : 'Re-investigate'}
          </button>

          <div className="detail-panel-actions-row">
            {onOpenDetailModal && (
              <button
                className="dp-btn dp-btn-secondary"
                onClick={() => onOpenDetailModal(selectedIncident)}
                title="Open detailed timeline and error logs"
              >
                <Eye size={12} />
                Full Details
              </button>
            )}
            {onResolveIncident && (
              <button
                className="dp-btn dp-btn-resolve"
                onClick={() => onResolveIncident(selectedIncident.id)}
                title="Resolve incident and store post-mortem"
              >
                <CheckCircle2 size={12} />
                Resolve
              </button>
            )}
          </div>
        </div>
      )}

      {isResolved && (
        <div className="dp-section">
          <div className="dp-section-title">Resolution</div>
          <div className="dp-section-body">
            <div className="historical-entry-field" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <CheckCircle2 size={12} style={{ color: 'var(--green)', flexShrink: 0 }} />
              <span style={{ color: 'var(--green)', fontSize: 11, fontWeight: 500 }}>Resolved &amp; stored in Hindsight</span>
            </div>
            {selectedIncident.resolutionSummary && (
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
                {selectedIncident.resolutionSummary}
              </p>
            )}
            {onOpenDetailModal && (
              <button
                className="dp-btn dp-btn-secondary"
                style={{ marginTop: 10 }}
                onClick={() => onOpenDetailModal(selectedIncident)}
              >
                <Eye size={12} />
                View Post-Mortem
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
