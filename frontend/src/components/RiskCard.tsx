import React from 'react';
import { ChevronRight, Quote, Percent } from 'lucide-react';
import { RiskItem } from '../types';
import { RiskBadge } from './RiskBadge';

interface RiskCardProps {
  risk: RiskItem;
  onSelect: (risk: RiskItem) => void;
}

export const RiskCard: React.FC<RiskCardProps> = ({ risk, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(risk)}
      className="bg-white border border-pastel-lilac hover:border-pastel-indigo-dark rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group space-y-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3">
          <RiskBadge level={risk.severity} size="sm" />
          <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-pastel-indigo-dark transition-colors leading-snug">
            {risk.title}
          </h3>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-extrabold bg-pastel-indigo text-pastel-indigo-dark border border-pastel-indigo-dark/20">
            <Percent className="w-3 h-3 mr-0.5 text-pastel-indigo-dark" />
            {Math.round(risk.confidence * 100)}%
          </span>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-pastel-indigo-dark group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      {/* Explanation snippet */}
      <p className="text-xs text-slate-700 font-medium line-clamp-2 leading-relaxed">
        {risk.explanation}
      </p>

      {/* Evidence snippet */}
      {risk.evidence && (
        <div className="bg-pastel-lavender border-l-2 border-pastel-indigo-dark p-2.5 rounded-r-lg text-[11px] text-slate-700 font-mono italic flex items-start space-x-2">
          <Quote className="w-3.5 h-3.5 text-pastel-indigo-dark shrink-0 mt-0.5" />
          <span className="line-clamp-2">"{risk.evidence}"</span>
        </div>
      )}
    </div>
  );
};
