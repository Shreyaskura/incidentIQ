import React from 'react';
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function ServicesView({
  activeIncidents,
  recentIncidents,
  onSelectServiceFilter,
}) {
  // Aggregate services
  const allIncidents = [...activeIncidents, ...recentIncidents];
  const serviceNames = Array.from(new Set(allIncidents.map((i) => i.service).filter(Boolean)));

  const services = serviceNames.map((name) => {
    const active = activeIncidents.filter((i) => i.service === name);
    const resolved = recentIncidents.filter((i) => i.service === name);
    const hasP1 = active.some((i) => i.severity === 'P1');
    const isDegraded = active.length > 0;

    return {
      name,
      activeCount: active.length,
      resolvedCount: resolved.length,
      hasP1,
      status: isDegraded ? (hasP1 ? 'Outage' : 'Degraded') : 'Operational',
      tier: name.includes('primary') || name.includes('gateway') ? 'Tier 1' : 'Tier 2',
    };
  });

  const operationalCount = services.filter((s) => s.status === 'Operational').length;
  const degradedCount = services.filter((s) => s.status !== 'Operational').length;

  return (
    <div className="analytics-page">
      {/* Metric Cards */}
      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-card-label">Monitored Services</div>
          <div className="analytics-card-value">{services.length}</div>
          <div className="analytics-card-sub">Core infrastructure services</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-card-label">Operational</div>
          <div className="analytics-card-value" style={{ color: 'var(--green)' }}>
            {operationalCount}
          </div>
          <div className="analytics-card-sub">Healthy &amp; responding normally</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-card-label">Degraded / Outage</div>
          <div className="analytics-card-value" style={{ color: degradedCount > 0 ? 'var(--red)' : 'var(--text-primary)' }}>
            {degradedCount}
          </div>
          <div className="analytics-card-sub">Services with active incidents</div>
        </div>
      </div>

      {/* Services Table */}
      <div className="analytics-panel">
        <div className="incidents-section-header">
          <span className="incidents-section-label">Service Inventory &amp; Status</span>
        </div>

        <table className="incidents-table">
          <thead>
            <tr>
              <th>Service</th>
              <th style={{ width: '100px' }}>Tier</th>
              <th style={{ width: '130px' }}>Active Incidents</th>
              <th style={{ width: '120px' }}>Resolved</th>
              <th style={{ width: '130px' }}>Health Status</th>
              <th style={{ textAlign: 'right', paddingRight: '14px', width: '140px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {services.map((svc) => (
              <tr key={svc.name}>
                <td>
                  <span className="table-service" style={{ fontWeight: 600 }}>
                    {svc.name}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    {svc.tier}
                  </span>
                </td>
                <td>
                  {svc.activeCount > 0 ? (
                    <span className="status-pill status-investigating">
                      {svc.activeCount} active
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>0</span>
                  )}
                </td>
                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {svc.resolvedCount}
                </td>
                <td>
                  {svc.status === 'Operational' ? (
                    <span className="status-pill status-resolved">
                      <CheckCircle2 size={10} style={{ marginRight: 2 }} />
                      Operational
                    </span>
                  ) : svc.status === 'Outage' ? (
                    <span className="status-pill status-investigating">
                      <AlertTriangle size={10} style={{ marginRight: 2 }} />
                      Outage
                    </span>
                  ) : (
                    <span className="status-pill status-identified">
                      Degraded
                    </span>
                  )}
                </td>
                <td>
                  <div className="table-row-actions">
                    <button
                      className="row-action-btn"
                      onClick={() => onSelectServiceFilter && onSelectServiceFilter(svc.name)}
                      title={`View incidents for ${svc.name}`}
                    >
                      Filter Incidents
                      <ArrowRight size={11} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
