import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Upload } from 'lucide-react';
import { useContract } from '../context/ContractContext';
import { detectDomain, confirmDomain } from '../services/api';
import { DetectDomainResponse } from '../types';
import { AnalysisProgress } from '../components/AnalysisProgress';
import { DomainCard } from '../components/DomainCard';
import { DomainSelector } from '../components/DomainSelector';

export const DomainDetection: React.FC = () => {
  const {
    contractId,
    uploadedFile,
    pastedText,
    detectedDomain,
    confirmedDomain,
    setDetectedDomain,
    setConfirmedDomain,
    hasActiveContract,
  } = useContract();

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [checklistFinished, setChecklistFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<DetectDomainResponse | null>(null);

  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!hasActiveContract) return;

    let isMounted = true;

    const runDetection = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await detectDomain(uploadedFile, pastedText, false, true);

        if (isMounted) {
          setDetectionResult(res);
          setDetectedDomain(res.domain);
        }
      } catch (err: any) {
        console.error('Domain detection failed:', err);
        if (isMounted) {
          setError(
            err.response?.data?.detail ||
              'Failed to execute AI domain detection request. Ensure FastAPI backend is running.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    runDetection();

    return () => {
      isMounted = false;
    };
  }, [hasActiveContract, uploadedFile, pastedText, setDetectedDomain]);

  if (!hasActiveContract) {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-4 bg-pastel-lavender">
        <div className="w-12 h-12 rounded-full bg-risk-medium-bg text-risk-medium-text flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-900">No Active Contract Loaded</h2>
        <p className="text-xs text-slate-600 font-medium">
          Please upload a contract file or paste contract text first to perform domain detection.
        </p>
        <button
          onClick={() => navigate('/upload')}
          className="px-6 py-2.5 rounded-xl bg-pastel-indigo-dark hover:bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center space-x-2 mx-auto shadow-md shadow-pastel-indigo-dark/20"
        >
          <Upload className="w-4 h-4" />
          <span>Go to Upload Page</span>
        </button>
      </div>
    );
  }

  const handleConfirmPrimaryDomain = async () => {
    if (!detectionResult || !contractId) return;

    try {
      setConfirming(true);
      const res = await confirmDomain({
        contract_id: contractId,
        confirmed_domain: detectionResult.domain,
      });

      setConfirmedDomain(res.active_domain || detectionResult.domain);
      navigate('/analysis');
    } catch (err: any) {
      console.error('Failed to confirm domain:', err);
      setConfirmedDomain(detectionResult.domain);
      navigate('/analysis');
    } finally {
      setConfirming(false);
    }
  };

  const handleSelectCustomDomain = async (customDomain: string) => {
    if (!contractId) return;

    try {
      setConfirming(true);
      const res = await confirmDomain({
        contract_id: contractId,
        confirmed_domain: customDomain,
        notes: 'User manual override',
      });

      setConfirmedDomain(res.active_domain || customDomain);
      navigate('/analysis');
    } catch (err: any) {
      console.error('Failed to apply domain override:', err);
      setConfirmedDomain(customDomain);
      navigate('/analysis');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-fade-in bg-pastel-lavender">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Contract Domain Classification
        </h1>
        <p className="text-xs text-slate-600 font-medium">
          Step 2 of 3: Verifying legal domain taxonomy prior to deep risk evaluation.
        </p>
      </div>

      {/* Progress Animation during analysis */}
      {(loading || !checklistFinished) && !error && (
        <AnalysisProgress
          mode="checklist"
          title="Detecting Contract Domain..."
          subtitle="Analyzing semantic features & text chunk distributions"
          onChecklistComplete={() => setChecklistFinished(true)}
        />
      )}

      {/* Error state */}
      {error && (
        <div className="p-6 bg-risk-high-bg text-risk-high-text border border-risk-high-border rounded-2xl text-xs space-y-3">
          <div className="flex items-center space-x-2 font-bold text-sm">
            <AlertCircle className="w-5 h-5" />
            <span>Domain Classifier Error</span>
          </div>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-risk-high-text text-white rounded-lg font-bold"
          >
            Retry Detection
          </button>
        </div>
      )}

      {/* Detection Result */}
      {!loading && checklistFinished && detectionResult && !error && (
        <div className="space-y-6">
          <DomainCard
            detection={detectionResult}
            confirmedDomain={confirmedDomain}
            onConfirm={handleConfirmPrimaryDomain}
            onChangeDomain={() => setIsSelectorOpen(true)}
            isConfirming={confirming}
          />
        </div>
      )}

      {/* Manual Domain Selector Modal */}
      <DomainSelector
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelectDomain={handleSelectCustomDomain}
        currentDomain={detectionResult?.domain}
      />
    </div>
  );
};
