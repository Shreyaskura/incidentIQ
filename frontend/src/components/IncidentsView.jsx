import React, { useState } from 'react';
import { Plus, Eye, RotateCw, CheckCircle2 } from 'lucide-react';
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

export default function IncidentsView({
  activeIncidents,
  recentIncidents,
  onOpenCreateModal,
  onResolveIncident,
  onOpenDetailModal,
  onAnalyzeIncident,
  isAnalyzing,
}) {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? [...activeIncidents, ...recentIncidents]
    : filter === 'active'
    ? activeIncidents
    : recentIncidents;

  return (
    <div className="incidents-page">
      {/* Filter bar */}
      <div className="incidents-filter-bar">
        <button
          className={`filter-btn${filter === 'all' ? ' active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All incidents ({activeIncidents.length + recentIncidents.length})
        </button>
        <button
          className={`filter-btn${filter === 'active' ? ' active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Active ({activeIncidents.length})
        </button>
        <button
          className={`filter-btn${filter === 'resolved' ? ' active' : ''}`}
          onClick={() => setFilter('resolved')}
        >
          Resolved ({recentIncidents.length})
        </button>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary" onClick={onOpenCreateModal}>
            <Plus size={13} />
            Create Incident
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="incidents-table-section">
        <div className="incidents-section-header">
          <span className="incidents-section-label">{filtered.length} incidents found</span>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>No incidents match the selected filter.</p>
          </div>
        ) : (
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
              {filtered.map((inc) => {
                const isResolved = inc.status === 'Resolved';
                const started = inc.createdAt || inc.time;
                const timeAgo = started ? formatDistanceToNow(new Date(started)) : '—';

                return (
                  <tr key={inc.id} onClick={() => onOpenDetailModal(inc)}>
                    <td><SevPill sev={inc.severity} /></td>
                    <td>
                      <div className="table-incident-title">{inc.title}</div>
                      <div className="table-incident-id">{inc.id}</div>
                    </td>
                    <td><span className="table-service">{inc.service}</span></td>
                    <td><StatusPill status={inc.status} /></td>
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
                          title="View incident details"
                        >
                          <Eye size={12} />
                          View
                        </button>
                        {!isResolved && onAnalyzeIncident && (
                          <button
                            className="row-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAnalyzeIncident(inc.id);
                            }}
                            disabled={isAnalyzing}
                            title="Analyze with Hindsight operational memory"
                          >
                            <RotateCw size={11} className={isAnalyzing ? 'spin' : ''} />
                            Analyze
                          </button>
                        )}
                        {!isResolved && (
                          <button
                            className="row-action-btn resolve-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              onResolveIncident(inc.id);
                            }}
                            title="Resolve & store in memory"
                          >
                            <CheckCircle2 size={12} />
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
