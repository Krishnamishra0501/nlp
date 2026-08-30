import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Sparkles,
  Quote,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { useContract } from '../context/ContractContext';
import { RiskBadge } from '../components/RiskBadge';

export const Reports: React.FC = () => {
  const {
    contractId,
    uploadedFile,
    pastedText,
    confirmedDomain,
    detectedDomain,
    analysisResult,
    hasActiveContract,
    contractName,
  } = useContract();

  const navigate = useNavigate();
  const [pdfToast, setPdfToast] = useState(false);

  const handleGeneratePdf = () => {
    console.log('Generate PDF stubbed for Phase 1', {
      contractId,
      contractName,
      riskScore: analysisResult?.risk_score,
      riskLevel: analysisResult?.risk_level,
    });
    setPdfToast(true);
    setTimeout(() => setPdfToast(false), 4000);
  };

  if (!hasActiveContract || !analysisResult) {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-4 bg-pastel-lavender">
        <div className="w-12 h-12 rounded-full bg-pastel-indigo text-pastel-indigo-dark flex items-center justify-center mx-auto">
          <FileText className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-900">No Executive Report Available</h2>
        <p className="text-xs text-slate-600 font-medium">
          Please run contract domain detection and risk analysis first to view the complete executive report summary.
        </p>
        <button
          onClick={() => navigate('/upload')}
          className="px-6 py-2.5 rounded-xl bg-pastel-indigo-dark hover:bg-indigo-600 text-white text-xs font-extrabold mx-auto shadow-md shadow-pastel-indigo-dark/20"
        >
          Go to Upload
        </button>
      </div>
    );
  }

  const activeDomain = confirmedDomain || detectedDomain || 'Unclassified';
  const risks = analysisResult.risks || [];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in bg-pastel-lavender">
      {/* Top Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-pastel-lilac pb-6">
        <div className="space-y-1">
          <button
            onClick={() => navigate('/analysis')}
            className="text-xs text-pastel-indigo-dark hover:text-indigo-600 flex items-center space-x-1 mb-2 font-extrabold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Risk Dashboard</span>
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Executive Contract Audit Report
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Comprehensive legal risk assessment & clause mitigation recommendations
          </p>
        </div>

        <button
          onClick={handleGeneratePdf}
          className="px-6 py-3 rounded-xl bg-pastel-indigo-dark hover:bg-indigo-600 text-white text-xs font-extrabold shadow-md shadow-pastel-indigo-dark/20 flex items-center space-x-2 transition-all hover:scale-105 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Generate PDF Report</span>
        </button>
      </div>

      {pdfToast && (
        <div className="p-4 bg-pastel-indigo text-pastel-indigo-dark border border-pastel-indigo-dark/30 rounded-xl text-xs font-bold flex items-center space-x-2 animate-fade-in shadow-sm">
          <Info className="w-4 h-4 shrink-0" />
          <span>PDF generation functionality stubbed for Phase 1. Logged data payload to browser console.</span>
        </div>
      )}

      {/* Contract Metadata Header Card */}
      <div className="bg-white border border-pastel-lilac rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Contract Document Source
          </span>
          <p className="text-sm font-extrabold text-slate-900 truncate" title={contractName}>
            {contractName}
          </p>
          <p className="text-[11px] text-slate-500 font-mono font-medium">
            ID: {contractId?.slice(0, 18)}...
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Confirmed Legal Domain
          </span>
          <p className="text-sm font-extrabold text-pastel-indigo-dark capitalize">
            {activeDomain}
          </p>
          <p className="text-[11px] text-slate-600 font-medium">
            Clauses Analyzed: {analysisResult.sentences_processed || 0}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Overall Contract Risk Level
          </span>
          <div className="flex items-center space-x-3 pt-0.5">
            <span className="text-2xl font-extrabold text-slate-900 font-mono">
              {analysisResult.risk_score}/100
            </span>
            <RiskBadge level={analysisResult.risk_level} size="md" />
          </div>
        </div>
      </div>

      {/* Full Risks Breakdown Table / Cards */}
      <div className="space-y-6">
        <h2 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-risk-medium-text" />
          <span>Detailed Clause Risk Audit ({risks.length} clauses flagged)</span>
        </h2>

        {risks.map((risk, idx) => (
          <div
            key={idx}
            className="bg-white border border-pastel-lilac rounded-2xl p-6 shadow-sm space-y-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-pastel-lilac pb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-slate-500 font-bold">#{idx + 1}</span>
                  <h3 className="text-base font-extrabold text-slate-900">{risk.title}</h3>
                </div>
              </div>
              <div className="flex items-center space-x-3 shrink-0">
                <RiskBadge level={risk.severity} size="md" />
                <span className="text-xs font-mono text-pastel-indigo-dark bg-pastel-indigo px-2 py-1 rounded-md border border-pastel-indigo-dark/20 font-extrabold">
                  Confidence: {Math.round(risk.confidence * 100)}%
                </span>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Risk Explanation */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-pastel-indigo-dark uppercase tracking-wider text-[10px] flex items-center space-x-1">
                  <Brain className="w-3.5 h-3.5" />
                  <span>Risk Explanation</span>
                </h4>
                <p className="text-slate-800 leading-relaxed bg-pastel-lavender p-3.5 rounded-xl border border-pastel-lilac font-medium">
                  {risk.explanation}
                </p>
              </div>

              {/* Mitigation Recommendation */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-risk-low-text uppercase tracking-wider text-[10px] flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Mitigation Recommendation</span>
                </h4>
                <div className="p-3.5 rounded-xl bg-risk-low-bg border border-risk-low-text/30 text-risk-low-text leading-relaxed flex items-start space-x-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{risk.recommendation}</span>
                </div>
              </div>
            </div>

            {/* Evidence snippet */}
            {risk.evidence && (
              <div className="space-y-1.5 pt-2">
                <h4 className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px] flex items-center space-x-1">
                  <Quote className="w-3.5 h-3.5 text-pastel-indigo-dark" />
                  <span>Text Evidence</span>
                </h4>
                <div className="bg-pastel-lavender p-3 rounded-xl border border-pastel-lilac font-mono text-xs text-slate-800 italic font-medium">
                  "{risk.evidence}"
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
