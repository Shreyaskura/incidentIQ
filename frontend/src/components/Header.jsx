import React from 'react';
import { Search, Bell, RefreshCw } from 'lucide-react';

const PAGE_TITLES = {
  dashboard:  'Overview',
  incidents:  'Incidents',
  memory:     'Memory',
  services:   'Services',
  analytics:  'Analytics',
  settings:   'Settings',
};

export default function Header({
  activeTab,
  searchQuery,
  setSearchQuery,
  activeCount,
  onLoadDemoIncident,
}) {
  return (
    <header className="topbar">
      <span className="topbar-title">{PAGE_TITLES[activeTab] || 'Overview'}</span>
      <div className="topbar-divider" />

      {/* Search */}
      <div className="topbar-search">
        <Search size={13} />
        <input
          type="text"
          placeholder="Search incidents, services..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="topbar-right">
        {/* Environment badge */}
        <span className="topbar-env-badge">production</span>

        {activeCount > 0 && (
          <span className="sidebar-badge" style={{ margin: 0, padding: '2px 7px', fontSize: 11 }} title={`${activeCount} active incidents`}>
            {activeCount} active
          </span>
        )}

        {/* Demo reset */}
        <button className="topbar-demo-btn" onClick={onLoadDemoIncident}>
          <RefreshCw size={11} />
          Load Demo
        </button>

        {/* Notifications */}
        <button className="topbar-icon-btn" aria-label="Notifications">
          <Bell size={15} />
        </button>

        {/* User avatar */}
        <div className="topbar-user" title="K. Shreyas">KS</div>
      </div>
    </header>
  );
}
