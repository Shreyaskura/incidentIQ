import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Brain,
  TrendingDown,
  TrendingUp,
  Activity,
} from 'lucide-react';

const iconMap = {
  AlertTriangle: AlertTriangle,
  CheckCircle2: CheckCircle2,
  Clock: Clock,
  Brain: Brain,
};

export default function SummaryCards({ metrics, activeCount }) {
  return (
    <section className="summary-cards-grid">
      {metrics.map((metric) => {
        const Icon = iconMap[metric.icon] || Activity;
        const displayValue = metric.id === 'active' ? activeCount : metric.value;

        return (
          <div key={metric.id} className={`summary-card card-${metric.id}`}>
            <div className="summary-card-header">
              <span className="summary-card-label">{metric.label}</span>
              <div
                className="summary-card-icon-wrap"
                style={{
                  backgroundColor: `${metric.color}15`,
                  color: metric.color,
                  borderColor: `${metric.color}30`,
                }}
              >
                <Icon size={18} />
              </div>
            </div>

            <div className="summary-card-body">
              <div className="summary-card-value">{displayValue}</div>
              <div className="summary-card-trend">
                {metric.changeType === 'positive' && (
                  <TrendingDown size={14} className="trend-icon-positive" />
                )}
                {metric.changeType === 'negative' && (
                  <TrendingUp size={14} className="trend-icon-negative" />
                )}
                <span className={`trend-text trend-${metric.changeType}`}>
                  {metric.subtext}
                </span>
              </div>
            </div>

            <div
              className="summary-card-progress"
              style={{
                background: `linear-gradient(90deg, ${metric.color} 0%, transparent 100%)`,
              }}
            ></div>
          </div>
        );
      })}
    </section>
  );
}
