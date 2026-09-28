import React from 'react';
import {
  LayoutDashboard,
  AlertTriangle,
  Brain,
  BarChart2,
  Settings,
  Plus,
  Server,
  Zap,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
  { id: 'memory',   label: 'Memory',   icon: Brain },
  { id: 'services', label: 'Services', icon: Server },
  { id: 'analytics',label: 'Analytics',icon: BarChart2 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeTab, setActiveTab, onOpenCreateModal, activeCount }) {
  return (
    <nav className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <span className="sidebar-logo-mark">
          <span className="logo-icon">
            <Zap size={13} strokeWidth={2.5} />
          </span>
          <span className="logo-text">IncidentIQ</span>
        </span>
      </div>

      {/* Navigation */}
      <div className="sidebar-section">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`sidebar-nav-item${activeTab === id ? ' active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={14} />
            <span>{label}</span>
            {id === 'incidents' && activeCount > 0 && (
              <span className="sidebar-badge">{activeCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Create Incident */}
      <div className="sidebar-footer">
        <button className="sidebar-create-btn" onClick={onOpenCreateModal}>
          <Plus size={13} strokeWidth={2.5} />
          <span>Create Incident</span>
        </button>
      </div>
    </nav>
  );
}
