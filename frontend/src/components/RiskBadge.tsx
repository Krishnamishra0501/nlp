import React from 'react';
import { ShieldAlert, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { RiskSeverity, OverallRiskLevel } from '../types';

interface RiskBadgeProps {
  level: RiskSeverity | OverallRiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  size = 'md',
  showIcon = true,
}) => {
  const normalized = level.toUpperCase();

  let styles = {
    bg: 'bg-risk-low-bg',
    text: 'text-risk-low-text',
    border: 'border-risk-low-text/30',
    icon: CheckCircle,
  };

  if (normalized === 'CRITICAL' || normalized === 'HIGH') {
    styles = {
      bg: 'bg-risk-high-bg',
      text: 'text-risk-high-text',
      border: 'border-risk-high-text/30',
      icon: normalized === 'CRITICAL' ? ShieldAlert : AlertTriangle,
    };
  } else if (normalized === 'MEDIUM') {
    styles = {
      bg: 'bg-risk-medium-bg',
      text: 'text-risk-medium-text',
      border: 'border-risk-medium-text/30',
      icon: AlertCircle,
    };
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-xs font-extrabold',
  };

  const Icon = styles.icon;

  return (
    <span
      className={`inline-flex items-center rounded-md font-extrabold border ${styles.bg} ${styles.text} ${styles.border} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 mr-1 shrink-0" />}
      <span>{normalized}</span>
    </span>
  );
};
