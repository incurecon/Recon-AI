import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { ReconciliationSession } from '../types.js';
import { fetchJson } from '../utils/apiHelper.js';

interface FileUploadViewProps {
  onReconciliationComplete: (session: ReconciliationSession) => void;
  onRunDemo: () => void;
}

export const FileUploadView: React.FC<FileUploadViewProps> = ({
  onReconciliationComplete,
  onRunDemo,
}) => {
  const [internalFile, setInternalFile] = useState<File | null>(null);
  const [externalFile, setExternalFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInternalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setInternalFile(e.dataTransfer.files[0]);
    }
  };

  const handleExternalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setExternalFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalFile || !externalFile) {
      setError('Please select both Internal Ledger and External Bank Statement files.');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('internalFile', internalFile);
    formData.append('externalFile', externalFile);

    try {
      const { ok, data } = await fetchJson<{ session: ReconciliationSession; error?: string }>(
        '/api/upload-and-reconcile',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!ok || !data.session) {
        throw new Error(data.error || 'Failed to process financial records.');
      }

      onReconciliationComplete(data.session);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Upload Financial Records</h2>
        <p className="text-xs text-slate-500 mt-1">
          Supports CSV, Excel (.xlsx, .xls), and PDF Bank Statements
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Form with Dual Dropzones */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Internal Ledger Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleInternalDrop}
            className={`p-8 rounded-xl border-2 border-dashed transition flex flex-col items-center justify-center text-center cursor-pointer relative ${
              internalFile
                ? 'bg-blue-50/50 border-blue-500 shadow-sm'
                : 'bg-white border-slate-300 hover:border-blue-400 shadow-sm'
            }`}
          >
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.pdf"
              onChange={(e) => e.target.files && setInternalFile(e.target.files[0])}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600 mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-slate-800 mb-1">Company General Ledger</h4>
            <p className="text-xs text-slate-500 mb-3">Drag & drop or click to select</p>
            {internalFile ? (
              <span className="px-3 py-1 bg-white border border-blue-200 text-blue-700 text-xs font-semibold rounded-md flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {internalFile.name}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 uppercase font-semibold">CSV, XLSX, XLS</span>
            )}
          </div>

          {/* External Bank Statement Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleExternalDrop}
            className={`p-8 rounded-xl border-2 border-dashed transition flex flex-col items-center justify-center text-center cursor-pointer relative ${
              externalFile
                ? 'bg-blue-50/50 border-blue-500 shadow-sm'
                : 'bg-white border-slate-300 hover:border-blue-400 shadow-sm'
            }`}
          >
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.pdf"
              onChange={(e) => e.target.files && setExternalFile(e.target.files[0])}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600 mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-slate-800 mb-1">External Bank Statement</h4>
            <p className="text-xs text-slate-500 mb-3">Drag & drop or click to select</p>
            {externalFile ? (
              <span className="px-3 py-1 bg-white border border-blue-200 text-blue-700 text-xs font-semibold rounded-md flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {externalFile.name}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 uppercase font-semibold">PDF, CSV, XLSX</span>
            )}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onRunDemo}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-medium text-xs rounded-md transition-colors"
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Load Sample Financial Files (1-Click)</span>
          </button>

          <button
            type="submit"
            disabled={uploading}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-md shadow-sm flex items-center justify-center gap-2 transition-colors"
          >
            {uploading ? (
              <span>Running Reconciliation Engine...</span>
            ) : (
              <>
                <span>Run Intelligent Reconciliation</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
