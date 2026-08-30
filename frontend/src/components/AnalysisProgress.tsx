import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, Cpu, ShieldAlert, Sparkles } from 'lucide-react';

interface AnalysisProgressProps {
  mode: 'checklist' | 'indeterminate';
  title?: string;
  subtitle?: string;
  onChecklistComplete?: () => void;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  mode,
  title = 'Processing Contract...',
  subtitle = 'Please wait while AI deep learning models process contract clauses',
  onChecklistComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const checklistSteps = [
    { label: 'Extracting text and chunking document', icon: Cpu },
    { label: 'Processing clauses with Transformer model', icon: Sparkles },
    { label: 'Detecting domain & calculating probability', icon: ShieldAlert },
  ];

  useEffect(() => {
    if (mode === 'checklist') {
      const timer1 = setTimeout(() => setCurrentStep(1), 700);
      const timer2 = setTimeout(() => setCurrentStep(2), 1400);
      const timer3 = setTimeout(() => {
        setCurrentStep(3);
        if (onChecklistComplete) onChecklistComplete();
      }, 2000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [mode, onChecklistComplete]);

  return (
    <div className="bg-white border border-pastel-lilac rounded-2xl p-8 shadow-xl max-w-xl mx-auto space-y-6 text-center">
      <div className="space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-pastel-lilac border border-pastel-indigo-dark/20 text-pastel-indigo-dark flex items-center justify-center mx-auto mb-3">
          <Loader2 className="w-7 h-7 animate-spin text-pastel-indigo-dark" />
        </div>
        <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-600 font-medium max-w-md mx-auto">{subtitle}</p>
      </div>

      {mode === 'checklist' ? (
        <div className="space-y-3 pt-2 text-left max-w-md mx-auto">
          {checklistSteps.map((step, idx) => {
            const Icon = step.icon;
            const isDone = currentStep > idx;
            const isCurrent = currentStep === idx;

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex items-center space-x-3 text-xs transition-all duration-300 ${
                  isDone
                    ? 'bg-risk-low-bg border-risk-low-text/30 text-risk-low-text font-extrabold'
                    : isCurrent
                    ? 'bg-pastel-indigo border-pastel-indigo-dark/30 text-pastel-indigo-dark font-extrabold shadow-sm'
                    : 'bg-pastel-lavender border-pastel-lilac text-slate-500 font-medium'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-risk-low-text shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-pastel-indigo-dark animate-spin shrink-0" />
                ) : (
                  <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span className="flex-1">{step.label}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3 max-w-md mx-auto pt-2">
          <div className="h-2.5 w-full bg-pastel-lavender rounded-full overflow-hidden border border-pastel-lilac relative">
            <div className="absolute inset-0 bg-gradient-to-r from-pastel-indigo via-pastel-indigo-dark to-indigo-600 rounded-full animate-pulse-bar" />
          </div>
          <p className="text-[11px] text-slate-500 font-mono font-bold">
            Running RoBERTa risk inference & entailment verification...
          </p>
        </div>
      )}
    </div>
  );
};
