import React from 'react';
import { X, Quote, Sparkles, Brain, CheckCircle2 } from 'lucide-react';
import { RiskItem } from '../types';
import { RiskBadge } from './RiskBadge';
import { ConfidenceScore } from './ConfidenceScore';

interface ClauseDetailsPanelProps {
  risk: RiskItem | null;
  onClose: () => void;
}

export const ClauseDetailsPanel: React.FC<ClauseDetailsPanelProps> = ({ risk, onClose }) => {
  if (!risk) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex justify-end">
      <div className="bg-white border-l border-pastel-lilac w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden animate-slide-left">
        {/* Panel Header */}
        <div className="p-6 border-b border-pastel-lilac flex items-start justify-between bg-pastel-lavender">
          <div className="space-y-2 pr-4">
            <div className="flex items-center space-x-2">
              <RiskBadge level={risk.severity} size="md" />
              <span className="text-xs text-slate-600 font-mono font-bold">
                Similarity: {(risk.semantic_similarity * 100).toFixed(1)}%
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 leading-snug">{risk.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 p-2 rounded-lg hover:bg-pastel-lilac transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* AI Metrics Grid */}
          <div className="grid grid-cols-3 gap-4 bg-pastel-lavender p-4 rounded-xl border border-pastel-lilac shadow-sm">
            <ConfidenceScore
              score={risk.confidence}
              label="Risk Confidence"
              size="sm"
            />
            <ConfidenceScore
              score={risk.semantic_similarity}
              label="Semantic Match"
              size="sm"
            />
            <ConfidenceScore
              score={risk.nli_confidence}
              label="NLI Entailment"
              size="sm"
            />
          </div>

          {/* Detailed Explanation */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-pastel-indigo-dark flex items-center space-x-1.5">
              <Brain className="w-4 h-4 text-pastel-indigo-dark" />
              <span>Risk Explanation</span>
            </h3>
            <p className="text-xs text-slate-800 font-medium leading-relaxed bg-pastel-lavender p-4 rounded-xl border border-pastel-lilac">
              {risk.explanation}
            </p>
          </div>

          {/* Actionable Recommendation */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-risk-low-text flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-risk-low-text" />
              <span>Actionable Recommendation</span>
            </h3>
            <div className="p-4 rounded-xl bg-risk-low-bg border border-risk-low-text/30 text-xs text-risk-low-text leading-relaxed flex items-start space-x-3 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{risk.recommendation}</div>
            </div>
          </div>

          {/* Evidence Quote */}
          {risk.evidence && (
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                <Quote className="w-4 h-4 text-pastel-indigo-dark" />
                <span>Contractual Text Evidence</span>
              </h3>
              <div className="bg-pastel-lavender p-4 rounded-xl border border-pastel-lilac font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap italic font-medium">
                "{risk.evidence}"
              </div>
            </div>
          )}
        </div>

        {/* Panel Footer */}
        <div className="p-4 border-t border-pastel-lilac bg-pastel-lavender flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-pastel-indigo-dark hover:bg-indigo-600 text-white text-xs font-extrabold shadow-md shadow-pastel-indigo-dark/20"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
