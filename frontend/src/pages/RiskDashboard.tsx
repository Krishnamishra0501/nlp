import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  FileCheck,
  BarChart2,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { useContract } from '../context/ContractContext';
import { analyzeRisk } from '../services/api';
import { RiskItem } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { RiskCard } from '../components/RiskCard';
import { RiskChart } from '../components/RiskChart';
import { ClauseDetailsPanel } from '../components/ClauseDetailsPanel';
import { AnalysisProgress } from '../components/AnalysisProgress';

export const RiskDashboard: React.FC = () => {
  const {
    uploadedFile,
    pastedText,
    confirmedDomain,
    analysisResult,
    setAnalysisResult,
    hasActiveContract,
    contractName,
  } = useContract();

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<RiskItem | null>(null);

  useEffect(() => {
    if (!hasActiveContract) return;

    if (analysisResult) return;

    let isMounted = true;

    const runRiskAnalysis = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await analyzeRisk(uploadedFile, pastedText);

        if (isMounted) {
          setAnalysisResult(res);
        }
      } catch (err: any) {
        console.error('Risk analysis failed:', err);
        if (isMounted) {
          setError(
            err.response?.data?.detail ||
              'Failed to execute contract risk analysis. Ensure FastAPI backend is active.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    runRiskAnalysis();

    return () => {
      isMounted = false;
    };
  }, [hasActiveContract, uploadedFile, pastedText, analysisResult, setAnalysisResult]);

  if (!hasActiveContract) {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-4 bg-pastel-lavender">
        <div className="w-12 h-12 rounded-full bg-risk-medium-bg text-risk-medium-text flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-900">No Active Contract</h2>
        <p className="text-xs text-slate-600 font-medium">
          Upload a contract document to view the risk dashboard.
        </p>
        <button
          onClick={() => navigate('/upload')}
          className="px-6 py-2.5 rounded-xl bg-pastel-indigo-dark hover:bg-indigo-600 text-white text-xs font-extrabold mx-auto shadow-md shadow-pastel-indigo-dark/20"
        >
          Upload Contract
        </button>
      </div>
    );
  }

  const risks = analysisResult?.risks || [];
  const highCount = risks.filter((r) => r.severity === 'HIGH').length;
  const mediumCount = risks.filter((r) => r.severity === 'MEDIUM').length;
  const lowCount = risks.filter((r) => r.severity === 'LOW').length;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in bg-pastel-lavender">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Risk Analysis Dashboard
            </h1>
            {confirmedDomain && (
              <span className="px-2.5 py-0.5 rounded text-xs font-extrabold bg-pastel-indigo text-pastel-indigo-dark border border-pastel-indigo-dark/20">
                {confirmedDomain}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Target: <span className="text-slate-900 font-extrabold">{contractName}</span>
          </p>
        </div>

        {analysisResult && (
          <button
            onClick={() => navigate('/reports')}
            className="px-6 py-3 rounded-xl bg-pastel-indigo-dark hover:bg-indigo-600 text-white text-xs font-extrabold shadow-md shadow-pastel-indigo-dark/20 flex items-center space-x-2 transition-all hover:scale-105 shrink-0"
          >
            <FileCheck className="w-4 h-4" />
            <span>View Full Report</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <AnalysisProgress
          mode="indeterminate"
          title="Analyzing Contract Risk Factors..."
          subtitle="Evaluating legal liabilities, indemnification terms, and warranty scopes"
        />
      )}

      {/* Error state */}
      {error && (
        <div className="p-6 bg-risk-high-bg text-risk-high-text border border-risk-high-border rounded-2xl text-xs space-y-3">
          <div className="flex items-center space-x-2 font-bold text-sm">
            <AlertCircle className="w-5 h-5" />
            <span>Risk Analysis Execution Error</span>
          </div>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-risk-high-text text-white rounded-lg font-bold"
          >
            Retry Analysis
          </button>
        </div>
      )}

      {/* Dashboard Main Content */}
      {!loading && analysisResult && !error && (
        <div className="space-y-8">
          {/* Overview Score & Severity Count Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Risk Score Card */}
            <div className="bg-white border border-pastel-lilac rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Overall Risk Score
                </span>
                <RiskBadge level={analysisResult.risk_level} size="sm" />
              </div>

              <div className="py-4 flex items-baseline space-x-2">
                <span className="text-5xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {analysisResult.risk_score}
                </span>
                <span className="text-sm font-extrabold text-slate-600">/ 100</span>
              </div>

              <div className="text-[11px] text-slate-600 font-medium flex items-center justify-between border-t border-pastel-lilac pt-3">
                <span>Sentences analyzed:</span>
                <span className="font-mono text-slate-900 font-extrabold">
                  {analysisResult.sentences_processed || 0}
                </span>
              </div>
            </div>

            {/* High Severity Count */}
            <div className="bg-risk-high-bg border border-risk-high-text/30 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-risk-high-text">
                <span className="text-xs font-extrabold uppercase tracking-wider">HIGH Severity Risks</span>
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="py-4">
                <span className="text-4xl font-extrabold text-risk-high-text font-mono">{highCount}</span>
              </div>
              <p className="text-[11px] text-risk-high-text font-bold border-t border-risk-high-text/20 pt-3">
                Immediate legal review recommended
              </p>
            </div>

            {/* Medium Severity Count */}
            <div className="bg-risk-medium-bg border border-risk-medium-text/30 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-risk-medium-text">
                <span className="text-xs font-extrabold uppercase tracking-wider">MEDIUM Severity Risks</span>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="py-4">
                <span className="text-4xl font-extrabold text-risk-medium-text font-mono">{mediumCount}</span>
              </div>
              <p className="text-[11px] text-risk-medium-text font-bold border-t border-risk-medium-text/20 pt-3">
                Moderate operational exposure
              </p>
            </div>

            {/* Low Severity Count */}
            <div className="bg-risk-low-bg border border-risk-low-text/30 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-risk-low-text">
                <span className="text-xs font-extrabold uppercase tracking-wider">LOW Severity Risks</span>
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="py-4">
                <span className="text-4xl font-extrabold text-risk-low-text font-mono">{lowCount}</span>
              </div>
              <p className="text-[11px] text-risk-low-text font-bold border-t border-risk-low-text/20 pt-3">
                Standard legal parameters
              </p>
            </div>
          </div>

          {/* Recharts Risk Contributions Section */}
          <div className="bg-white border border-pastel-lilac rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-pastel-lilac pb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                  <BarChart2 className="w-4 h-4 text-pastel-indigo-dark" />
                  <span>Risk Contributions by Clause Domain</span>
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  Aggregated risk intensity distribution across contract groups
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-700 font-bold bg-pastel-lavender px-2.5 py-1 rounded-md border border-pastel-lilac">
                Device: {analysisResult.device || 'CPU'}
              </span>
            </div>

            <RiskChart contributions={analysisResult.risk_contributions || []} />
          </div>

          {/* Detected Risks List Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Identified Risk Clauses ({risks.length})
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  Click any risk card to inspect full explanation, evidence quote, and NLI confidence metrics.
                </p>
              </div>
            </div>

            {risks.length === 0 ? (
              <div className="bg-white border border-pastel-lilac rounded-2xl p-8 text-center text-xs text-slate-600 font-bold">
                No high/medium risk items identified in this contract agreement.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {risks.map((riskItem, idx) => (
                  <RiskCard
                    key={idx}
                    risk={riskItem}
                    onSelect={(risk) => setSelectedRisk(risk)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Clause Inspector Side Panel / Drawer */}
      <ClauseDetailsPanel
        risk={selectedRisk}
        onClose={() => setSelectedRisk(null)}
      />
    </div>
  );
};
