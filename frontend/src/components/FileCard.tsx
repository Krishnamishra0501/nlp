import React from 'react';
import { FileText, CheckCircle2, Trash2, AlignLeft } from 'lucide-react';

interface FileCardProps {
  file: File | null;
  text: string | null;
  contractId: string | null;
  onClear: () => void;
}

export const FileCard: React.FC<FileCardProps> = ({ file, text, contractId, onClear }) => {
  if (!file && !text) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-white border border-pastel-lilac rounded-xl p-5 shadow-sm relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-risk-low-bg border border-risk-low-border text-risk-low-text flex items-center justify-center shrink-0">
            {file ? <FileText className="w-6 h-6" /> : <AlignLeft className="w-6 h-6" />}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-extrabold text-slate-900 truncate max-w-xs">
                {file ? file.name : 'Pasted Contract Content'}
              </h4>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-risk-low-bg text-risk-low-text border border-risk-low-border">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Ready
              </span>
            </div>

            <p className="text-xs text-slate-600 font-medium mt-0.5">
              {file ? (
                <>Size: {formatFileSize(file.size)} &bull; Format: {file.name.split('.').pop()?.toUpperCase()}</>
              ) : (
                <>{text?.length.toLocaleString()} Characters pasted</>
              )}
            </p>

            {contractId && (
              <p className="text-[10px] text-slate-500 font-mono font-medium mt-1">
                Client ID: <span className="text-slate-900 font-bold">{contractId}</span>
              </p>
            )}
          </div>
        </div>

        <button
          onClick={onClear}
          className="p-2 text-slate-400 hover:text-risk-high-text hover:bg-risk-high-bg/50 rounded-lg transition-colors"
          title="Remove Contract"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
