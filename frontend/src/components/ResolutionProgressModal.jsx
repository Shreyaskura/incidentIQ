import React from 'react';
import { CheckCircle2, Database, Loader, AlertCircle } from 'lucide-react';

const STAGE_CONFIG = {
  resolved: {
    icon: CheckCircle2,
    iconClass: 'resolved',
    title: 'Incident Resolved',
    desc: 'Saving operational experience to Hindsight memory bank...',
  },
  saving: {
    icon: Loader,
    iconClass: 'saving',
    title: 'Storing to Memory',
    desc: 'Writing post-mortem to Hindsight bank \'incidentiq\'...',
    spin: true,
  },
  saved: {
    icon: Database,
    iconClass: 'saved',
    title: 'Experience Stored',
    desc: 'Post-mortem retained in Hindsight. Future incidents will benefit from this resolution.',
  },
  error: {
    icon: AlertCircle,
    iconClass: 'error',
    title: 'Storage Failed',
    desc: 'Incident resolved, but failed to store experience in Hindsight. The resolution data may be lost.',
  },
};

export default function ResolutionProgressModal({
  isOpen,
  incidentId,
  stage,
  retainedData,
  error,
  onClose,
}) {
  if (!isOpen) return null;

  const cfg = STAGE_CONFIG[stage] || STAGE_CONFIG.saving;
  const Icon = cfg.icon;
  const isDone = stage === 'saved' || stage === 'error';

  return (
    <div className="modal-backdrop" onClick={isDone ? onClose : undefined}>
      <div className="resolve-modal" onClick={(e) => e.stopPropagation()}>

        <div className={`resolve-stage-icon ${cfg.iconClass}`}>
          <Icon size={22} className={cfg.spin ? 'spin' : ''} />
        </div>

        <div className="resolve-stage-title">{cfg.title}</div>
        <div className="resolve-stage-desc">{cfg.desc}</div>

        {retainedData && stage === 'saved' && (
          <div className="resolve-detail-box">
            <div className="resolve-detail-row">
              <span className="resolve-detail-label">Incident</span>
              <span className="resolve-detail-val">{incidentId}</span>
            </div>
            {retainedData.service && (
              <div className="resolve-detail-row">
                <span className="resolve-detail-label">Service</span>
                <span className="resolve-detail-val">{retainedData.service}</span>
              </div>
            )}
            <div className="resolve-detail-row">
              <span className="resolve-detail-label">Memory bank</span>
              <span className="resolve-detail-val">incidentiq</span>
            </div>
            <div className="resolve-detail-row">
              <span className="resolve-detail-label">Status</span>
              <span className="resolve-detail-val" style={{ color: 'var(--green)' }}>Retained</span>
            </div>
          </div>
        )}

        {error && stage === 'error' && (
          <div className="resolve-detail-box" style={{ borderColor: 'var(--red-border)' }}>
            <div className="resolve-detail-row">
              <span className="resolve-detail-label">Error</span>
              <span className="resolve-detail-val" style={{ color: 'var(--red)' }}>{error}</span>
            </div>
          </div>
        )}

        {isDone && (
          <button
            className={stage === 'saved' ? 'btn btn-resolve' : 'btn btn-default'}
            onClick={onClose}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
