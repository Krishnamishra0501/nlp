import React from 'react';
import { Layers, Sparkles, CheckCircle2, ListFilter } from 'lucide-react';
import { DetectDomainResponse } from '../types';
import { ConfidenceScore } from './ConfidenceScore';

interface DomainCardProps {
  detection: DetectDomainResponse;
  confirmedDomain?: string | null;
  onConfirm: () => void;
  onChangeDomain: () => void;
  isConfirming?: boolean;
}

export const DomainCard: React.FC<DomainCardProps> = ({
  detection,
  confirmedDomain,
  onConfirm,
  onChangeDomain,
  isConfirming = false,
}) => {
  const isConfirmed = Boolean(confirmedDomain);

  return (
    <div className="bg-white border border-pastel-lilac rounded-2xl p-8 shadow-sm space-y-6 relative overflow-hidden">
      {/* Top Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="p-2 rounded-lg bg-pastel-indigo text-pastel-indigo-dark border border-pastel-indigo-dark/20">
            <Layers className="w-5 h-5" />
          </span>
          <span className="text-xs font-extrabold uppercase tracking-wider text-pastel-indigo-dark">
            AI Classification Result
          </span>
        </div>
        {isConfirmed ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-risk-low-bg text-risk-low-text border border-risk-low-border">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Confirmed: {confirmedDomain}
          </span>
        ) : (
          <span className="text-xs text-slate-600 bg-pastel-lavender px-2.5 py-1 rounded-md border border-pastel-lilac font-bold">
            Pending Confirmation
          </span>
        )}
      </div>

      {/* Primary Domain Showcase */}
      <div className="text-center py-6 border-y border-pastel-lilac space-y-2">
        <div className="text-xs text-slate-600 font-bold flex items-center justify-center space-x-1">
          <Sparkles className="w-3.5 h-3.5 text-risk-medium-text" />
          <span>Primary Detected Domain</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight capitalize">
          {detection.domain}
        </h2>
        <div className="max-w-md mx-auto pt-3">
          <ConfidenceScore score={detection.confidence} label="Classifier Confidence" size="lg" />
        </div>
      </div>

      {/* Details & Other Predictions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Metadata stats */}
        <div className="bg-pastel-lavender p-4 rounded-xl border border-pastel-lilac space-y-2.5 text-xs">
          <div className="flex justify-between text-slate-600 font-medium">
            <span>Model Engine:</span>
            <span className="text-slate-900 font-mono font-bold">{detection.model_used || 'RoBERTa-Contract'}</span>
          </div>
          <div className="flex justify-between text-slate-600 font-medium">
            <span>Chunks Processed:</span>
            <span className="text-slate-900 font-mono font-bold">{detection.num_chunks_processed}</span>
          </div>
          <div className="flex justify-between text-slate-600 font-medium">
            <span>Status:</span>
            <span className="text-risk-low-text font-bold uppercase">{detection.status}</span>
          </div>
        </div>

        {/* Other predictions */}
        {detection.top_predictions && detection.top_predictions.length > 1 && (
          <div className="bg-pastel-lavender p-4 rounded-xl border border-pastel-lilac space-y-2 text-xs">
            <div className="flex items-center space-x-1.5 text-slate-600 font-bold mb-1">
              <ListFilter className="w-3.5 h-3.5 text-pastel-indigo-dark" />
              <span>Other possibilities</span>
            </div>
            <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
              {detection.top_predictions
                .filter((p) => p.domain.toLowerCase() !== detection.domain.toLowerCase())
                .map((pred, idx) => (
                  <div key={idx} className="flex justify-between items-center text-slate-800 font-medium">
                    <span className="capitalize">{pred.domain}</span>
                    <span className="font-mono text-slate-600 font-bold">
                      {(pred.probability * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-4 pt-2">
        <button
          onClick={onConfirm}
          disabled={isConfirming}
          className="flex-1 py-3.5 rounded-xl bg-pastel-indigo-dark hover:bg-indigo-600 text-white text-xs font-extrabold shadow-md shadow-pastel-indigo-dark/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isConfirming ? 'Confirming...' : `Confirm Domain (${detection.domain})`}</span>
        </button>

        <button
          onClick={onChangeDomain}
          className="px-6 py-3.5 rounded-xl bg-pastel-lilac hover:bg-pastel-indigo text-pastel-indigo-dark border border-pastel-indigo-dark/30 text-xs font-extrabold transition-colors"
        >
          Change / Override
        </button>
      </div>
    </div>
  );
};
