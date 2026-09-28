import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ActiveIncidents from './components/ActiveIncidents';
import AiInsightPanel from './components/AiInsightPanel';
import MemoryPanel from './components/MemoryPanel';
import CreateIncidentModal from './components/CreateIncidentModal';
import IncidentDetailModal from './components/IncidentDetailModal';
import ResolutionProgressModal from './components/ResolutionProgressModal';
import IncidentsView from './components/IncidentsView';
import ServicesView from './components/ServicesView';
import AnalyticsView from './components/AnalyticsView';
import SettingsView from './components/SettingsView';
import {
  fetchHealth,
  fetchIncidents,
  fetchIncidentById,
  createIncident,
  analyzeIncident,
  resolveIncident,
  fetchMemory,
  resetDemoIncident,
} from './api/incidentApi';
import { AlertTriangle, RefreshCw, X, Plus, Eye } from 'lucide-react';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeIncidents, setActiveIncidents] = useState([]);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDetailIncident, setSelectedDetailIncident] = useState(null);
  const [resolveModalState, setResolveModalState] = useState({
    isOpen: false, incidentId: '', stage: 'resolved', retainedData: null, error: null,
  });
  const [toastMessage, setToastMessage] = useState(null);
  const [isLoading, setIsLoading]       = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing]   = useState(false);
  const [apiError, setApiError]         = useState(null);
  const [memoryCount, setMemoryCount]   = useState(0);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const loadIncidentsData = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      await fetchHealth();
      const data = await fetchIncidents();
      const active   = data.filter((i) => i.status !== 'Resolved');
      const resolved = data.filter((i) => i.status === 'Resolved');
      setActiveIncidents(active);
      setRecentIncidents(resolved);

      try {
        const memData = await fetchMemory(10);
        setMemoryCount(memData.total || 0);
      } catch {}

      if (active.length > 0) {
        const defaultTarget = active.find((i) => i.id === 'INC-204') || active[0];
        setSelectedIncident(defaultTarget);
        try {
          const analysis = await analyzeIncident(defaultTarget.id);
          setAnalysisData(analysis);
        } catch {}
      }
    } catch (err) {
      setApiError(`Backend unreachable: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadIncidentsData(); }, []);

  const handleSelectIncident = async (incidentId) => {
    try {
      const details = await fetchIncidentById(incidentId);
      setSelectedIncident(details);
      handleAnalyzeIncident(incidentId);
    } catch (err) {
      showToast(`Error fetching ${incidentId}: ${err.message}`);
    }
  };

  const handleAnalyzeIncident = async (incidentId) => {
    setIsAnalyzing(true);
    setAnalysisData(null);
    try {
      const analysis = await analyzeIncident(incidentId);
      setAnalysisData(analysis);
      const hasMemories = analysis.historical_memories?.length > 0;
      if (hasMemories) {
        showToast(`Hindsight recalled ${analysis.historical_memories.length} historical precedent(s) for ${incidentId}`);
      } else {
        showToast(`Investigation complete for ${incidentId}: no prior match found`);
      }
    } catch (err) {
      showToast(`Analysis error for ${incidentId}: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateIncident = async (formData) => {
    setIsSubmitting(true);
    try {
      const created = await createIncident(formData);
      setActiveIncidents((prev) => [created, ...prev]);
      setSelectedIncident(created);
      setIsCreateModalOpen(false);
      showToast(`Incident ${created.id} created. Querying Hindsight...`);
      handleAnalyzeIncident(created.id);
    } catch (err) {
      showToast(`Failed to create incident: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveIncident = async (incidentId) => {
    setResolveModalState({ isOpen: true, incidentId, stage: 'resolved', retainedData: null, error: null });
    try {
      await new Promise((r) => setTimeout(r, 700));
      setResolveModalState((prev) => ({ ...prev, stage: 'saving' }));

      const res = await resolveIncident(incidentId);
      const resolved = res.incident || res;

      setActiveIncidents((prev) => prev.filter((i) => i.id !== incidentId));
      setRecentIncidents((prev) => [resolved, ...prev]);
      if (selectedIncident?.id === incidentId) setSelectedIncident(resolved);

      try {
        const memData = await fetchMemory(10);
        setMemoryCount(memData.total || 0);
      } catch {}

      setResolveModalState({ isOpen: true, incidentId, stage: 'saved', retainedData: resolved, error: null });
      showToast(`${incidentId} resolved. Experience stored in Hindsight.`);
    } catch (err) {
      setResolveModalState({ isOpen: true, incidentId, stage: 'error', retainedData: null, error: err.message });
      showToast(`Failed to resolve ${incidentId}: ${err.message}`);
    }
  };

  const handleLoadDemoIncident = async () => {
    setIsLoading(true);
    try {
      const res = await resetDemoIncident();
      await loadIncidentsData();
      setSelectedIncident(res.incident);
      setActiveTab('dashboard');
      showToast('Demo incident INC-204 reset and loaded');
      handleAnalyzeIncident(res.incident.id);
    } catch (err) {
      showToast(`Failed to load demo: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredActiveIncidents = activeIncidents.filter((inc) =>
    inc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inc.service.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Metrics for the status bar
  const criticalCount      = activeIncidents.filter((i) => i.severity === 'P1').length;
  const investigatingCount = activeIncidents.filter((i) => i.status === 'Investigating').length;

  return (
    <div className="app-shell">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        activeCount={activeIncidents.length}
      />

      <div className="main-viewport">
        <Header
          activeTab={activeTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeCount={activeIncidents.length}
          onLoadDemoIncident={handleLoadDemoIncident}
        />

        <main className="content-container">
          {/* Error banner */}
          {apiError && (
            <div className="api-error-banner">
              <div className="api-error-content">
                <AlertTriangle size={15} className="api-error-icon" />
                <div><strong>Connection error:</strong> {apiError}</div>
              </div>
              <button className="api-retry-btn" onClick={loadIncidentsData} disabled={isLoading}>
                <RefreshCw size={12} className={isLoading ? 'spin' : ''} />
                Retry
              </button>
            </div>
          )}

          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="dashboard-view">
              {/* Compact status bar */}
              <div className="status-bar">
                <div className="status-bar-item">
                  <span className="status-dot red" />
                  <span className="status-bar-label">Active</span>
                  <span className={`status-bar-value${activeIncidents.length > 0 ? ' critical' : ' ok'}`}>
                    {activeIncidents.length}
                  </span>
                </div>
                <div className="status-bar-item">
                  <span className="status-bar-label">Critical (P1)</span>
                  <span className={`status-bar-value${criticalCount > 0 ? ' critical' : ''}`}>
                    {criticalCount}
                  </span>
                </div>
                <div className="status-bar-item">
                  <span className="status-bar-label">Investigating</span>
                  <span className="status-bar-value warning">{investigatingCount}</span>
                </div>
                <div className="status-bar-item">
                  <span className="status-dot green" />
                  <span className="status-bar-label">Resolved today</span>
                  <span className="status-bar-value ok">{recentIncidents.length}</span>
                </div>
                <div className="status-bar-item">
                  <span className="status-dot blue" />
                  <span className="status-bar-label">Hindsight memories</span>
                  <span className="status-bar-value">{memoryCount}</span>
                </div>
                <div className="status-bar-right">
                  <span>Env: Production</span>
                  <span>•</span>
                  <span>Cluster: us-east-1</span>
                </div>
              </div>

              {/* Two-column: incidents table + investigation panel (flush split) */}
              <div className="dashboard-grid">
                <div className="dashboard-main">
                  <div className="section-header">
                    <span className="section-title">
                      Active Incidents
                      <span className="section-title-badge">{filteredActiveIncidents.length}</span>
                    </span>
                    <button
                      className="section-action-btn primary"
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      <Plus size={12} />
                      Create Incident
                    </button>
                  </div>

                  <ActiveIncidents
                    incidents={filteredActiveIncidents}
                    selectedIncident={selectedIncident}
                    onSelectIncident={handleSelectIncident}
                    onResolveIncident={handleResolveIncident}
                    onAnalyzeIncident={handleAnalyzeIncident}
                    isAnalyzing={isAnalyzing}
                    isLoading={isLoading}
                    onOpenDetailModal={(inc) => setSelectedDetailIncident(inc)}
                  />

                  {/* Recently Resolved (compact & aligned) */}
                  {recentIncidents.length > 0 && (
                    <>
                      <div className="section-header" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                        <span className="section-title">
                          Recently Resolved
                          <span className="section-title-badge">{recentIncidents.length}</span>
                        </span>
                      </div>
                      <div className="incidents-table-wrap">
                        <table className="incidents-table">
                          <thead>
                            <tr>
                              <th style={{ width: '105px' }}>Severity</th>
                              <th>Incident</th>
                              <th style={{ width: '170px' }}>Service</th>
                              <th style={{ width: '140px' }}>Status</th>
                              <th style={{ textAlign: 'right', paddingRight: '14px', width: '100px' }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentIncidents.slice(0, 5).map((inc) => (
                              <tr key={inc.id} onClick={() => setSelectedDetailIncident(inc)}>
                                <td>
                                  <span className={`sev-pill ${{ P1: 'sev-p1', P2: 'sev-p2', P3: 'sev-p3', P4: 'sev-p4' }[inc.severity] || 'sev-p4'}`}>
                                    {inc.severity}
                                  </span>
                                </td>
                                <td>
                                  <div className="table-incident-title" style={{ color: 'var(--text-secondary)' }}>{inc.title}</div>
                                  <div className="table-incident-id">{inc.id}</div>
                                </td>
                                <td><span className="table-service">{inc.service}</span></td>
                                <td>
                                  <span className="status-pill status-resolved">Resolved</span>
                                  {inc.retained_in_hindsight && (
                                    <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--green)' }}>· retained</span>
                                  )}
                                </td>
                                <td>
                                  <div className="table-row-actions">
                                    <button
                                      className="row-action-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedDetailIncident(inc);
                                      }}
                                      title="View resolved post-mortem"
                                    >
                                      <Eye size={12} />
                                      View
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>

                {/* Right: Investigation panel */}
                <div className="dashboard-aside">
                  <div className="section-header">
                    <span className="section-title">Investigation &amp; Memory</span>
                  </div>
                  <AiInsightPanel
                    selectedIncident={selectedIncident}
                    analysisData={analysisData}
                    onAnalyzeIncident={handleAnalyzeIncident}
                    isAnalyzing={isAnalyzing}
                    onOpenDetailModal={(inc) => setSelectedDetailIncident(inc)}
                    onResolveIncident={handleResolveIncident}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'incidents' && (
            <IncidentsView
              activeIncidents={activeIncidents}
              recentIncidents={recentIncidents}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
              onResolveIncident={handleResolveIncident}
              onOpenDetailModal={(inc) => setSelectedDetailIncident(inc)}
              onAnalyzeIncident={handleAnalyzeIncident}
              isAnalyzing={isAnalyzing}
            />
          )}

          {activeTab === 'memory' && <MemoryPanel />}

          {activeTab === 'services' && (
            <ServicesView
              activeIncidents={activeIncidents}
              recentIncidents={recentIncidents}
              onSelectServiceFilter={(serviceName) => {
                setSearchQuery(serviceName);
                setActiveTab('incidents');
              }}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              activeIncidents={activeIncidents}
              recentIncidents={recentIncidents}
              memoryCount={memoryCount}
            />
          )}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Modals */}
      <CreateIncidentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmitIncident={handleCreateIncident}
        isSubmitting={isSubmitting}
      />

      <IncidentDetailModal
        isOpen={!!selectedDetailIncident}
        incident={selectedDetailIncident}
        analysisData={selectedDetailIncident?.id === selectedIncident?.id ? analysisData : null}
        onClose={() => setSelectedDetailIncident(null)}
        onAnalyze={handleAnalyzeIncident}
        onResolve={handleResolveIncident}
        isAnalyzing={isAnalyzing}
      />

      <ResolutionProgressModal
        isOpen={resolveModalState.isOpen}
        incidentId={resolveModalState.incidentId}
        stage={resolveModalState.stage}
        retainedData={resolveModalState.retainedData}
        error={resolveModalState.error}
        onClose={() => setResolveModalState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Toast */}
      {toastMessage && (
        <div className="toast-bar">
          <span className="toast-dot" />
          <span style={{ flex: 1 }}>{toastMessage}</span>
          <button className="toast-close" onClick={() => setToastMessage(null)} aria-label="Dismiss">
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
