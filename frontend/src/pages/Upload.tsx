import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Info } from 'lucide-react';
import { useContract } from '../context/ContractContext';
import { UploadBox } from '../components/UploadBox';
import { FileCard } from '../components/FileCard';

export const Upload: React.FC = () => {
  const {
    contractId,
    uploadedFile,
    pastedText,
    setContractData,
    resetAll,
    hasActiveContract,
  } = useContract();

  const navigate = useNavigate();

  const handleFileSelect = (file: File) => {
    setContractData(file, null);
  };

  const handleTextPaste = (text: string) => {
    setContractData(null, text);
  };

  const handleProceedToDetection = () => {
    if (hasActiveContract) {
      navigate('/domain-detection');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-fade-in bg-pastel-lavender">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Upload Contract Agreement
        </h1>
        <p className="text-xs text-slate-600 font-medium">
          Upload a legal contract file (.pdf, .docx, .txt) or paste raw agreement text to initialize AI domain classification and risk evaluation.
        </p>
      </div>

      {/* Main Upload / Selection */}
      {!hasActiveContract ? (
        <UploadBox onFileSelect={handleFileSelect} onTextPaste={handleTextPaste} />
      ) : (
        <div className="space-y-6">
          <FileCard
            file={uploadedFile}
            text={pastedText}
            contractId={contractId}
            onClear={resetAll}
          />

          <div className="bg-pastel-indigo/30 border border-pastel-indigo-dark/30 p-4 rounded-xl text-xs text-slate-800 flex items-start space-x-3 shadow-sm">
            <Info className="w-5 h-5 text-pastel-indigo-dark shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <p className="font-extrabold text-pastel-indigo-dark">Contract Ready for Domain Detection</p>
              <p className="text-[11px] text-slate-600 font-medium">
                A unique client session ID (<span className="font-mono text-slate-900 font-extrabold">{contractId}</span>) has been generated. Proceeding will trigger multi-chunk domain classification.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={resetAll}
              className="px-5 py-3 rounded-xl bg-pastel-lilac hover:bg-pastel-indigo text-pastel-indigo-dark border border-pastel-indigo-dark/30 text-xs font-extrabold shadow-sm"
            >
              Choose Different File
            </button>

            <button
              onClick={handleProceedToDetection}
              className="px-8 py-3 rounded-xl bg-pastel-indigo-dark hover:bg-indigo-600 text-white text-xs font-extrabold shadow-md shadow-pastel-indigo-dark/25 flex items-center space-x-2 transition-all hover:scale-105"
            >
              <span>Proceed to Domain Detection</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
