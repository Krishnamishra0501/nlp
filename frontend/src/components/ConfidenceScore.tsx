import React from 'react';

interface ConfidenceScoreProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ConfidenceScore: React.FC<ConfidenceScoreProps> = ({
  score,
  label = 'Confidence',
  size = 'md',
}) => {
  const percentage = score > 1 ? Math.min(100, Math.round(score)) : Math.min(100, Math.round(score * 100));

  let colorClass = 'text-risk-low-text bg-risk-low-bg';
  let barColor = 'bg-emerald-500';

  if (percentage < 60 && percentage >= 40) {
    colorClass = 'text-risk-medium-text bg-risk-medium-bg';
    barColor = 'bg-amber-500';
  } else if (percentage < 40) {
    colorClass = 'text-risk-high-text bg-risk-high-bg';
    barColor = 'bg-rose-500';
  }

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  return (
    <div className="w-full space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className="text-pastel-muted font-medium">{label}</span>
        <span className={`font-bold font-mono px-1.5 py-0.5 rounded text-[11px] ${colorClass}`}>
          {percentage}%
        </span>
      </div>
      <div className={`w-full bg-pastel-border/60 rounded-full overflow-hidden ${heightClasses[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
