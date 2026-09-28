import React from 'react';
import { formatDistanceToNow } from '../utils/timeUtils';
import { Eye, RotateCw, CheckCircle2 } from 'lucide-react';

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

export default function ActiveIncidents({
  incidents,
  selectedIncident,
  onSelectIncident,
  onResolveIncident,
  onAnalyzeIncident,
  isAnalyzing,
  isLoading,
  onOpenDetailModal,
}) {
  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Loading incidents...</p>
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="empty-state">
        <p>No active incidents. System is operating normally.</p>
      </div>
    );
  }

  return (
    <div className="incidents-table-wrap">
      <table className="incidents-table">
        <thead>
          <tr>
            <th style={{ width: '105px' }}>Severity</th>
            <th>Incident</th>
            <th style={{ width: '170px' }}>Service</th>
            <th style={{ width: '120px' }}>Status</th>
            <th style={{ width: '95px' }}>Started</th>
            <th style={{ width: '120px' }}>Assignee</th>
            <th style={{ textAlign: 'right', paddingRight: '14px', width: '220px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((inc) => {
            const isSelected = selectedIncident?.id === inc.id;
            const started = inc.createdAt || inc.time;
            const timeAgo = started
              ? formatDistanceToNow(new Date(started))
              : 'Unknown';

            return (
              <tr
                key={inc.id}
                className={isSelected ? 'row-selected' : ''}
                onClick={() => onSelectIncident(inc.id)}
              >
                <td>
                  <SevPill sev={inc.severity} />
                </td>
                <td>
                  <div className="table-incident-title">{inc.title}</div>
                  <div className="table-incident-id">{inc.id}</div>
                </td>
                <td>
                  <span className="table-service">{inc.service}</span>
                </td>
                <td>
                  <StatusPill status={inc.status} />
                </td>
                <td className="table-time">{timeAgo}</td>
                <td className="table-assignee">{inc.lead || inc.responder || 'Unassigned'}</td>
                <td>
                  <div className="table-row-actions">
                    <button
                      className="row-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDetailModal(inc);
                      }}
                      title="View full incident details"
                    >
                      <Eye size={12} />
                      View
                    </button>
                    <button
                      className="row-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAnalyzeIncident(inc.id);
                      }}
                      disabled={isAnalyzing}
                      title="Analyze with Hindsight operational memory"
                    >
                      <RotateCw size={11} className={isAnalyzing && isSelected ? 'spin' : ''} />
                      Analyze
                    </button>
                    <button
                      className="row-action-btn resolve-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onResolveIncident(inc.id);
                      }}
                      title="Mark as resolved and retain post-mortem in memory"
                    >
                      <CheckCircle2 size={12} />
                      Resolve
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
