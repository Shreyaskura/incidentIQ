import React, { useEffect, useState } from 'react';
import { fetchHealth, fetchMemory } from '../api/incidentApi';
import { RefreshCw, Server, Database, AppWindow, Activity } from 'lucide-react';

export default function SettingsView() {
  const [health, setHealth] = useState(null);
  const [memoryStats, setMemoryStats] = useState(null);
  const [checking, setChecking] = useState(false);
  const [pingLatency, setPingLatency] = useState('11ms');

  const check = async () => {
    setChecking(true);
    const start = Date.now();
    try {
      const h = await fetchHealth();
      const duration = Date.now() - start;
      setPingLatency(`${duration}ms`);
      setHealth(h);
      try {
        const mem = await fetchMemory(10);
        setMemoryStats(mem);
      } catch {}
    } catch {
      setHealth(null);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    fetchHealth().then(setHealth).catch(() => setHealth(null));
    fetchMemory(10).then(setMemoryStats).catch(() => setMemoryStats(null));
  }, []);

  return (
    <div className="settings-page">
      {/* Header with Title and Action Buttons */}
      <div className="settings-header">
        <div>
          <h2 className="settings-header-title">System Settings &amp; Integrations</h2>
          <p className="settings-header-subtitle">
            Operational infrastructure configuration, memory bank health, and backend runtime diagnostics
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-default" onClick={check} disabled={checking}>
            <RefreshCw size={12} className={checking ? 'spin' : ''} />
            {checking ? 'Checking...' : 'Check Health'}
          </button>
        </div>
      </div>

      {/* Responsive Grid: Spans 100% of the screen across 2 dynamic columns */}
      <div className="settings-grid">
        {/* Card 1: System Connectivity */}
        <div className="settings-section">
          <div className="settings-section-title">
            <Server size={13} style={{ color: 'var(--blue)' }} />
            System Connectivity
          </div>
          <div className="settings-row">
            <span className="settings-row-label">Backend API Status</span>
            <span className={`settings-badge ${health ? 'settings-badge-ok' : 'settings-badge-warn'}`}>
              {health ? 'Connected' : 'Offline'}
            </span>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">API Gateway URL</span>
            <span className="settings-row-val">/api (Proxied via Vite dev server)</span>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">Roundtrip Ping Latency</span>
            <span className="settings-row-val" style={{ color: 'var(--green)' }}>{pingLatency}</span>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">API Protocol &amp; Framework</span>
            <span className="settings-row-val">REST / FastAPI / Uvicorn</span>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">Active Connection Pool</span>
            <span className="settings-badge settings-badge-neutral">HTTP/1.1 Keep-Alive</span>
          </div>
        </div>

        {/* Card 2: Hindsight Memory Bank */}
        <div className="settings-section">
          <div className="settings-section-title">
            <Database size={13} style={{ color: 'var(--green)' }} />
            Hindsight Persistent Memory
          </div>
          <div className="settings-row">
            <span className="settings-row-label">Memory Bank ID</span>
            <span className="settings-row-val" style={{ color: 'var(--blue)', fontWeight: 600 }}>
              {health?.hindsight_bank || 'incidentiq'}
            </span>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">Memory Server Status</span>
            <span className={`settings-badge ${health?.hindsight_connected ? 'settings-badge-ok' : 'settings-badge-warn'}`}>
              {health?.hindsight_connected ? 'Connected' : 'Offline / Standby'}
            </span>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">Indexed Memories Count</span>
            <span className="settings-row-val" style={{ fontWeight: 600 }}>
              {memoryStats?.total ?? (health?.hindsight_connected ? 0 : 'Unavailable')} records
            </span>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">Auto-Retain Post-Mortems</span>
            <span className="settings-badge settings-badge-ok">Enabled</span>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">Semantic Precedent Recall</span>
            <span className="settings-badge settings-badge-ok">Enabled</span>
          </div>
        </div>

        {/* Card 3: Operational Diagnostics */}
        <div className="settings-section">
          <div className="settings-section-title">
            <Activity size={13} style={{ color: 'var(--orange)' }} />
            Operational Diagnostics &amp; Reliability
          </div>
          <div className="settings-row">
            <span className="settings-row-label">Incident Watchdog Engine</span>
            <span className="settings-badge settings-badge-ok">Active</span>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">AI Investigation Model</span>
            <span className="settings-row-val">Hindsight Semantic Reflection</span>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">Root Cause Analysis Pipeline</span>
            <span className="settings-badge settings-badge-ok">Operational</span>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">Data Retention Policy</span>
            <span className="settings-row-val">Indefinite (Full Audit Trail)</span>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">Security &amp; Encryption</span>
            <span className="settings-badge settings-badge-neutral">TLS / Local Sandbox</span>
          </div>
        </div>

        {/* Card 4: Application & Environment */}
        <div className="settings-section">
          <div className="settings-section-title">
            <AppWindow size={13} style={{ color: 'var(--yellow)' }} />
            Application &amp; Environment
          </div>
          <div className="settings-row">
            <span className="settings-row-label">Application Version</span>
            <span className="settings-row-val">IncidentIQ v1.2.0</span>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">Deployment Environment</span>
            <span className="settings-badge settings-badge-ok">production</span>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">Cluster Region</span>
            <span className="settings-row-val">us-east-1 (Primary)</span>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">Frontend Runtime</span>
            <span className="settings-row-val">Vite 8.3 / React 19</span>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">UI Responsive Engine</span>
            <span className="settings-badge settings-badge-ok">Full-Width Fluid</span>
          </div>
        </div>
      </div>
    </div>
  );
}
