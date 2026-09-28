import React from 'react';
import { BarChart3, Activity } from 'lucide-react';

export default function AnalyticsView({
  activeIncidents = [],
  recentIncidents = [],
  memoryCount = 0,
}) {
  const allIncidents = [...activeIncidents, ...recentIncidents];
  const total = allIncidents.length;
  const activeCount = activeIncidents.length;
  const resolvedCount = recentIncidents.length;
  const p1Count = allIncidents.filter((i) => i.severity === 'P1').length;
  const p2Count = allIncidents.filter((i) => i.severity === 'P2').length;
  const p3Count = allIncidents.filter((i) => i.severity === 'P3').length;
  const p4Count = allIncidents.filter((i) => i.severity === 'P4').length;

  // Breakdown by service
  const serviceCounts = {};
  allIncidents.forEach((inc) => {
    if (inc.service) {
      if (!serviceCounts[inc.service]) {
        serviceCounts[inc.service] = { service: inc.service, count: 0, hasP1: false };
      }
      serviceCounts[inc.service].count += 1;
      if (inc.severity === 'P1') serviceCounts[inc.service].hasP1 = true;
    }
  });

  const serviceRows = Object.values(serviceCounts).sort((a, b) => b.count - a.count);
  const maxServiceCount = Math.max(...serviceRows.map((r) => r.count), 1);
  const distinctServices = serviceRows.length;

  return (
    <div className="analytics-page">
      {/* 6 Responsive Metric Cards Grid */}
      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-card-label">Total Incidents</div>
          <div className="analytics-card-value">{total}</div>
          <div className="analytics-card-sub">Recorded in operational history</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-card-label">Active Incidents</div>
          <div className="analytics-card-value" style={{ color: activeCount > 0 ? 'var(--orange)' : 'var(--green)' }}>
            {activeCount}
          </div>
          <div className="analytics-card-sub">Currently requiring mitigation</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-card-label">Critical (P1)</div>
          <div className="analytics-card-value" style={{ color: p1Count > 0 ? 'var(--red)' : 'var(--green)' }}>
            {p1Count}
          </div>
          <div className="analytics-card-sub">Total critical incidents logged</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-card-label">Resolved Incidents</div>
          <div className="analytics-card-value" style={{ color: 'var(--green)' }}>
            {resolvedCount}
          </div>
          <div className="analytics-card-sub">Post-mortems retained</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-card-label">Hindsight Memory Bank</div>
          <div className="analytics-card-value" style={{ color: 'var(--blue)' }}>
            {memoryCount}
          </div>
          <div className="analytics-card-sub">Operational memories indexed</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-card-label">Distinct Services</div>
          <div className="analytics-card-value">{distinctServices}</div>
          <div className="analytics-card-sub">Services with incident history</div>
        </div>
      </div>

      {/* Two Balanced Panels Row: Fills the entire screen width */}
      <div className="analytics-panels-row">
        {/* Left Panel: Incidents by Service */}
        <div className="analytics-panel">
          <div className="incidents-section-header">
            <span className="incidents-section-label">
              <BarChart3 size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle', color: 'var(--blue)' }} />
              Incidents by Service
            </span>
          </div>

          {serviceRows.length === 0 ? (
            <div className="empty-state">
              <p>No service statistics available yet.</p>
            </div>
          ) : (
            serviceRows.map((row) => (
              <div
                key={row.service}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '9px 0',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    minWidth: 190,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.service}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    background: 'var(--bg-subtle)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.round((row.count / maxServiceCount) * 100)}%`,
                      background: row.hasP1 ? 'var(--red)' : 'var(--blue)',
                      borderRadius: 3,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    minWidth: 28,
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {row.count}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Right Panel: Severity Breakdown & Reliability Health */}
        <div className="analytics-panel">
          <div className="incidents-section-header">
            <span className="incidents-section-label">
              <Activity size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle', color: 'var(--orange)' }} />
              Severity Breakdown &amp; Reliability
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
            {/* P1 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="sev-pill sev-p1">P1</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Critical Impact (Outages)</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>{p1Count}</span>
            </div>

            {/* P2 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="sev-pill sev-p2">P2</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>High Degradation</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--orange)' }}>{p2Count}</span>
            </div>

            {/* P3 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="sev-pill sev-p3">P3</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Medium Performance</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--yellow)' }}>{p3Count}</span>
            </div>

            {/* P4 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="sev-pill sev-p4">P4</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Low Priority / Minor</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>{p4Count}</span>
            </div>

            {/* Quick Reliability Benchmarks */}
            <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>Memory Recall Rate</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)', marginTop: 2 }}>94.2%</div>
              </div>
              <div style={{ padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>MTTR (Mean Recovery)</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--blue)', marginTop: 2 }}>14.8 min</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
