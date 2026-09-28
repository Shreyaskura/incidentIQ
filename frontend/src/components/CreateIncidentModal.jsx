import React, { useState } from 'react';
import { X } from 'lucide-react';

const SERVICES = [
  'api-gateway-us-east',
  'aurora-postgres-primary',
  'cache-redis-cluster',
  'auth-service',
  'payment-service',
  'kafka-broker-cluster',
  'elasticsearch-cluster',
  'k8s-node-pool',
  'load-balancer',
];

export default function CreateIncidentModal({ isOpen, onClose, onSubmitIncident, isSubmitting }) {
  const [form, setForm] = useState({
    title: '',
    severity: 'P2',
    service: '',
    environment: 'production',
    impact: '',
    error_logs: '',
  });
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.service.trim()) e.service = 'Service is required';
    if (!form.impact.trim()) e.impact = 'Description is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    await onSubmitIncident({
      title:          form.title.trim(),
      severity:       form.severity,
      service:        form.service.trim(),
      environment:    form.environment,
      impact:         form.impact.trim(),
      error_logs:     form.error_logs.trim(),
      affected_service: form.service.trim(),
      description:    form.impact.trim(),
    });
    setForm({ title: '', severity: 'P2', service: '', environment: 'production', impact: '', error_logs: '' });
    setErrors({});
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="create-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="create-modal-header">
          <div>
            <div className="create-modal-title">Create Incident</div>
            <div className="create-modal-subtitle">Open a new incident for investigation</div>
          </div>
          <button className="incident-modal-close" onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="create-modal-body">

            {/* Title */}
            <div className="form-field">
              <label className="form-label">
                Title <span className="required">*</span>
              </label>
              <input
                className={`form-input${errors.title ? ' has-error' : ''}`}
                type="text"
                placeholder="e.g. API Gateway returning 500 errors"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                autoFocus
              />
              {errors.title && <div className="form-error">{errors.title}</div>}
            </div>

            {/* Severity + Environment */}
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Severity <span className="required">*</span></label>
                <select
                  className="form-select"
                  value={form.severity}
                  onChange={(e) => set('severity', e.target.value)}
                >
                  <option value="P1">P1 — Critical</option>
                  <option value="P2">P2 — High</option>
                  <option value="P3">P3 — Medium</option>
                  <option value="P4">P4 — Low</option>
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Environment</label>
                <select
                  className="form-select"
                  value={form.environment}
                  onChange={(e) => set('environment', e.target.value)}
                >
                  <option value="production">production</option>
                  <option value="staging">staging</option>
                  <option value="development">development</option>
                </select>
              </div>
            </div>

            {/* Affected Service */}
            <div className="form-field">
              <label className="form-label">
                Affected Service <span className="required">*</span>
              </label>
              <input
                className={`form-input${errors.service ? ' has-error' : ''}`}
                type="text"
                placeholder="e.g. aurora-postgres-primary"
                list="service-suggestions"
                value={form.service}
                onChange={(e) => set('service', e.target.value)}
              />
              <datalist id="service-suggestions">
                {SERVICES.map((s) => <option key={s} value={s} />)}
              </datalist>
              {errors.service && <div className="form-error">{errors.service}</div>}
            </div>

            {/* Description */}
            <div className="form-field">
              <label className="form-label">
                Description <span className="required">*</span>
              </label>
              <textarea
                className={`form-textarea${errors.impact ? ' has-error' : ''}`}
                placeholder="Describe the observed symptoms, user impact, and scope..."
                value={form.impact}
                onChange={(e) => set('impact', e.target.value)}
                rows={3}
              />
              {errors.impact && <div className="form-error">{errors.impact}</div>}
            </div>

            {/* Error Logs */}
            <div className="form-field">
              <label className="form-label">Error Logs</label>
              <textarea
                className="form-textarea form-mono"
                placeholder="Paste relevant error logs or stack traces..."
                value={form.error_logs}
                onChange={(e) => set('error_logs', e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <div className="create-modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Incident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
