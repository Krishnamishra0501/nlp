import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, FileText, PlusCircle, CheckCircle2 } from 'lucide-react';
import { useContract } from '../context/ContractContext';

export const Navbar: React.FC = () => {
  const { hasActiveContract, contractName, confirmedDomain, resetAll } = useContract();
  const navigate = useNavigate();

  const handleStartNew = () => {
    resetAll();
    navigate('/upload');
  };

  return (
    <header className="h-16 border-b border-pastel-lilac bg-white sticky top-0 z-30 px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-3">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-pastel-lilac flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
            <Shield className="w-6 h-6 text-pastel-indigo-dark" />
          </div>
          <div>
            <span className="text-xl font-extrabold text-slate-900">
              ContractGuard
            </span>
            <span className="block text-[10px] uppercase tracking-widest text-pastel-indigo-dark font-extrabold">
              AI Risk Engine
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        {hasActiveContract && (
          <div className="flex items-center space-x-3 px-3 py-1.5 rounded-xl bg-pastel-lavender border border-pastel-lilac text-xs">
            <FileText className="w-4 h-4 text-pastel-indigo-dark shrink-0" />
            <span className="text-slate-800 font-bold truncate max-w-[200px]" title={contractName}>
              {contractName}
            </span>
            {confirmedDomain && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-extrabold bg-pastel-indigo text-pastel-indigo-dark border border-pastel-indigo-dark/20">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {confirmedDomain}
              </span>
            )}
          </div>
        )}

        <button
          onClick={handleStartNew}
          className="flex items-center space-x-2 px-4 py-2 text-xs font-extrabold rounded-xl bg-pastel-indigo-dark text-white hover:bg-indigo-600 shadow-md shadow-pastel-indigo-dark/20 transition-all duration-150 active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Analysis</span>
        </button>

        <div className="flex items-center space-x-2 pl-2 border-l border-pastel-lilac">
          <span className="w-2.5 h-2.5 rounded-full bg-risk-low-text animate-pulse"></span>
          <span className="text-xs text-slate-600 font-bold">API Connected</span>
        </div>
      </div>
    </header>
  );
};
