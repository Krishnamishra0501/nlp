import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, AlignLeft, Check } from 'lucide-react';

interface UploadBoxProps {
  onFileSelect: (file: File) => void;
  onTextPaste: (text: string) => void;
}

export const UploadBox: React.FC<UploadBoxProps> = ({ onFileSelect, onTextPaste }) => {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [pastedContent, setPastedContent] = useState('');

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
    },
    maxFiles: 1,
  });

  const handleTextSubmit = () => {
    if (pastedContent.trim()) {
      onTextPaste(pastedContent.trim());
    }
  };

  return (
    <div className="w-full bg-white border border-pastel-lilac rounded-2xl overflow-hidden shadow-sm">
      {/* Mode Switch Tabs */}
      <div className="flex border-b border-pastel-lilac bg-pastel-lavender">
        <button
          onClick={() => setActiveTab('file')}
          className={`flex-1 py-3.5 px-6 flex items-center justify-center space-x-2 text-sm transition-colors ${
            activeTab === 'file'
              ? 'bg-white text-pastel-indigo-dark font-extrabold border-b-2 border-pastel-indigo-dark shadow-sm'
              : 'text-slate-600 font-bold hover:text-slate-900'
          }`}
        >
          <UploadCloud className="w-4 h-4 text-pastel-indigo-dark" />
          <span>Upload Document (.pdf, .docx, .txt)</span>
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 py-3.5 px-6 flex items-center justify-center space-x-2 text-sm transition-colors ${
            activeTab === 'text'
              ? 'bg-white text-pastel-indigo-dark font-extrabold border-b-2 border-pastel-indigo-dark shadow-sm'
              : 'text-slate-600 font-bold hover:text-slate-900'
          }`}
        >
          <AlignLeft className="w-4 h-4 text-pastel-indigo-dark" />
          <span>Paste Contract Text</span>
        </button>
      </div>

      <div className="p-8">
        {activeTab === 'file' ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? 'border-pastel-indigo-dark bg-pastel-indigo/20 scale-[0.99]'
                : isDragReject
                ? 'border-risk-high-text bg-risk-high-bg'
                : 'border-pastel-indigo bg-pastel-lavender/80 hover:border-pastel-indigo-dark hover:bg-pastel-indigo/10'
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 rounded-full bg-pastel-lilac border border-pastel-indigo-dark/20 text-pastel-indigo-dark flex items-center justify-center mb-4 shadow-sm">
              <UploadCloud className="w-8 h-8 text-pastel-indigo-dark" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              {isDragActive ? 'Drop your contract here...' : 'Drag & drop contract document'}
            </h3>
            <p className="text-xs text-slate-600 mb-5 max-w-sm">
              Supports <span className="text-slate-900 font-bold">PDF, DOCX, TXT</span> up to 25MB. Text will be extracted for multi-stage NLP analysis.
            </p>
            <span className="px-5 py-2.5 text-xs font-extrabold rounded-xl bg-pastel-indigo-dark text-white hover:bg-indigo-600 shadow-md shadow-pastel-indigo-dark/20 transition-all">
              Browse Files
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <textarea
                value={pastedContent}
                onChange={(e) => setPastedContent(e.target.value)}
                placeholder="Paste complete contract agreement text here..."
                rows={10}
                className="w-full p-4 rounded-xl bg-white border border-pastel-lilac text-slate-800 text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:border-pastel-indigo-dark focus:ring-2 focus:ring-pastel-indigo/40 leading-relaxed resize-y"
              />
              <div className="absolute bottom-3 right-3 text-[11px] text-slate-500 font-mono font-bold">
                {pastedContent.length.toLocaleString()} characters
              </div>
            </div>
            <button
              onClick={handleTextSubmit}
              disabled={!pastedContent.trim()}
              className="w-full py-3 rounded-xl bg-pastel-indigo-dark hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold shadow-md shadow-pastel-indigo-dark/20 flex items-center justify-center space-x-2 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Use Pasted Text for Analysis</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
