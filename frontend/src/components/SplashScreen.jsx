import React from 'react';
import { Zap } from 'lucide-react';
import './SplashScreen.css';

/**
 * Professional animated splash/loading screen for IncidentIQ.
 * Designed with a modern DevOps/SRE dark aesthetic matching the system UI.
 */
export default function SplashScreen({ isFading }) {
  return (
    <div
      className={`splash-overlay${isFading ? ' fade-out' : ''}`}
      aria-label="IncidentIQ Initializing"
      role="status"
    >
      {/* Background Atmosphere & Tech Grid */}
      <div className="splash-bg-grid" />
      <div className="splash-ambient-glow" />
      <div className="splash-ambient-secondary" />

      {/* Main Brand Content */}
      <div className="splash-content">
        {/* Animated Emblem with Radar Scanner Rings */}
        <div className="splash-emblem-wrap">
          <div className="splash-ring-outer" />
          <div className="splash-ring-scanner" />
          <div className="splash-ring-inner" />
          <div className="splash-logo-core">
            <Zap size={26} strokeWidth={2.4} />
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="splash-title-group">
          <h1 className="splash-title">
            Incident<span className="accent-iq">IQ</span>
          </h1>
          <p className="splash-subtitle">AI Incident Response Agent</p>
        </div>

        {/* Animated Loading Bar & Status */}
        <div className="splash-loader-wrap">
          <div className="splash-progress-track">
            <div className="splash-progress-fill" />
          </div>
          <div className="splash-status">
            <span className="splash-status-dot" />
            <span>Initializing IncidentIQ...</span>
          </div>
        </div>
      </div>

      {/* DevOps System Metadata */}
      <div className="splash-footer-meta">
        <span>SRE Core v0.4.0</span>
        <span className="splash-meta-sep">/</span>
        <span>Hindsight Memory Engine</span>
      </div>
    </div>
  );
}
