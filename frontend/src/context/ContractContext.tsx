import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AnalyzeRiskResponse } from '../types';

interface ContractContextType {
  contractId: string | null;
  uploadedFile: File | null;
  pastedText: string | null;
  detectedDomain: string | null;
  confirmedDomain: string | null;
  analysisResult: AnalyzeRiskResponse | null;
  setContractData: (file: File | null, text: string | null) => void;
  setDetectedDomain: (domain: string | null) => void;
  setConfirmedDomain: (domain: string | null) => void;
  setAnalysisResult: (result: AnalyzeRiskResponse | null) => void;
  resetAll: () => void;
  hasActiveContract: boolean;
  contractName: string;
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

export const ContractProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [contractId, setContractId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState<string | null>(null);
  const [detectedDomain, setDetectedDomain] = useState<string | null>(null);
  const [confirmedDomain, setConfirmedDomain] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeRiskResponse | null>(null);

  const setContractData = (file: File | null, text: string | null) => {
    const newId = crypto.randomUUID();
    setContractId(newId);
    setUploadedFile(file);
    setPastedText(text);
    setDetectedDomain(null);
    setConfirmedDomain(null);
    setAnalysisResult(null);
  };

  const resetAll = () => {
    setContractId(null);
    setUploadedFile(null);
    setPastedText(null);
    setDetectedDomain(null);
    setConfirmedDomain(null);
    setAnalysisResult(null);
  };

  const hasActiveContract = Boolean(uploadedFile || pastedText);
  const contractName = uploadedFile 
    ? uploadedFile.name 
    : pastedText 
      ? `Pasted Text (${pastedText.slice(0, 25)}...)`
      : 'No Active Contract';

  return (
    <ContractContext.Provider
      value={{
        contractId,
        uploadedFile,
        pastedText,
        detectedDomain,
        confirmedDomain,
        analysisResult,
        setContractData,
        setDetectedDomain,
        setConfirmedDomain,
        setAnalysisResult,
        resetAll,
        hasActiveContract,
        contractName,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};

export const useContract = (): ContractContextType => {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error('useContract must be used within a ContractProvider');
  }
  return context;
};
