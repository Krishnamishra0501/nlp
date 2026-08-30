import React, { useState, useEffect } from 'react';
import { X, Search, Check, AlertCircle } from 'lucide-react';
import { fetchDomains } from '../services/api';
import { DomainItem } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface DomainSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDomain: (domainName: string) => void;
  currentDomain?: string;
}

export const DomainSelector: React.FC<DomainSelectorProps> = ({
  isOpen,
  onClose,
  onSelectDomain,
  currentDomain,
}) => {
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState(currentDomain || '');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      fetchDomains()
        .then((res) => {
          setDomains(res.domains || []);
        })
        .catch((err) => {
          console.error('Failed to fetch domains:', err);
          setError('Failed to load domains from backend.');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredDomains = domains.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.keywords?.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleConfirm = () => {
    if (selected) {
      onSelectDomain(selected);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-pastel-lilac rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-fade-in">
        {/* Modal Header */}
        <div className="p-5 border-b border-pastel-lilac flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Select Contract Domain</h3>
            <p className="text-xs text-slate-600">Choose the exact industry domain for clause modeling</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 p-1 rounded-lg hover:bg-pastel-lavender transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 bg-pastel-lavender border-b border-pastel-lilac">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search domains or keywords..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-pastel-lilac rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-pastel-indigo-dark"
            />
          </div>
        </div>

        {/* Domains List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner message="Loading domain taxonomy..." />
            </div>
          ) : error ? (
            <div className="p-4 bg-risk-high-bg text-risk-high-text border border-risk-high-border rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : filteredDomains.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No domains matched "{searchQuery}"
            </div>
          ) : (
            filteredDomains.map((domain) => {
              const isSelected = selected.toLowerCase() === domain.name.toLowerCase();
              return (
                <div
                  key={domain.id || domain.name}
                  onClick={() => setSelected(domain.name)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-pastel-indigo border-pastel-indigo-dark text-pastel-indigo-dark font-extrabold shadow-sm'
                      : 'bg-white border-pastel-lilac text-slate-800 hover:border-pastel-indigo hover:bg-pastel-lavender'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-sm capitalize">{domain.name}</span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-pastel-indigo-dark text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  {domain.description && (
                    <p className="text-slate-600 text-[11px] leading-relaxed mb-2">
                      {domain.description}
                    </p>
                  )}
                  {domain.keywords && domain.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {domain.keywords.slice(0, 5).map((kw, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded bg-pastel-lavender border border-pastel-lilac text-slate-600 text-[10px]"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-pastel-lilac bg-pastel-lavender flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-pastel-lilac text-slate-800 text-xs font-bold border border-pastel-lilac"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected}
            className="px-5 py-2 rounded-xl bg-pastel-indigo-dark hover:bg-indigo-600 text-white text-xs font-extrabold disabled:opacity-50 shadow-md shadow-pastel-indigo-dark/20"
          >
            Apply Selected Domain
          </button>
        </div>
      </div>
    </div>
  );
};
