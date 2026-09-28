import React, { useState } from 'react';
import {
  History,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Search,
} from 'lucide-react';

export default function RecentIncidents({ incidents }) {
  const [expandedId, setExpandedId] = useState(null);
  const [filterText, setFilterText] = useState('');

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredIncidents = incidents.filter(
    (inc) =>
      inc.title.toLowerCase().includes(filterText.toLowerCase()) ||
      inc.id.toLowerCase().includes(filterText.toLowerCase()) ||
      inc.service.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <section className="dashboard-section recent-incidents-section">
      <div className="section-header">
        <div className="section-title-wrap">
          <div className="section-icon-badge icon-indigo">
            <History size={18} />
          </div>
          <div>
            <h2 className="section-title">Recent Incidents</h2>
            <p className="section-subtitle">
              Past incidents resolved and indexed into post-incident memory
            </p>
          </div>
        </div>

        <div className="section-filter-wrap">
          <div className="inline-search-input-wrap">
            <Search size={14} className="inline-search-icon" />
            <input
              type="text"
              placeholder="Filter recent incidents..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="inline-search-input"
            />
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="enterprise-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>Incident ID</th>
              <th>Incident Name</th>
              <th>Severity</th>
              <th>Service Affected</th>
              <th>Duration</th>
              <th>Resolved At</th>
              <th>Responder</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredIncidents.length === 0 ? (
              <tr>
                <td colSpan="9" className="table-empty-cell">
                  No matching incidents found.
                </td>
              </tr>
            ) : (
              filteredIncidents.map((incident) => {
                const isExpanded = expandedId === incident.id;
                return (
                  <React.Fragment key={incident.id}>
                    <tr
                      className={`table-row ${isExpanded ? 'row-expanded' : ''}`}
                      onClick={() => toggleExpand(incident.id)}
                    >
                      <td className="expand-cell">
                        {isExpanded ? (
                          <ChevronDown size={15} />
                        ) : (
                          <ChevronRight size={15} />
                        )}
                      </td>
                      <td className="id-cell">
                        <span className="incident-table-id">{incident.id}</span>
                      </td>
                      <td className="title-cell">
                        <span className="incident-table-title">
                          {incident.title}
                        </span>
                      </td>
                      <td>
                        <span className={`table-sev-badge sev-${incident.severity.toLowerCase()}`}>
                          {incident.severity}
                        </span>
                      </td>
                      <td>
                        <code className="service-code-badge">{incident.service}</code>
                      </td>
                      <td className="text-secondary">{incident.duration}</td>
                      <td className="text-secondary">{incident.resolvedAt}</td>
                      <td>
                        <div className="responder-badge">
                          <span className="responder-initials">
                            {(incident.responder || incident.lead || 'On Call')
                              .split(' ')
                              .map((n) => n[0])
                              .filter(Boolean)
                              .slice(0, 2)
                              .join('')}
                          </span>
                          <span className="responder-name">
                            {incident.responder || incident.lead || 'On-Call SRE'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="resolved-status-pill">
                          <CheckCircle size={12} />
                          Resolved
                        </span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="expansion-row">
                        <td colSpan="9">
                          <div className="expansion-panel">
                            <div className="expansion-item">
                              <span className="expansion-label">
                                Resolution Summary & Playbook Taken:
                              </span>
                              <p className="expansion-text">
                                {incident.resolutionSummary}
                              </p>
                            </div>
                            <div className="expansion-meta-footer">
                              <span className="indexed-badge">
                                ✓ Indexed in Hindsight Memory Store
                              </span>
                              <span className="audit-ref">
                                Audit Log Ref: <code>postmortem-{incident.id.toLowerCase()}</code>
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
