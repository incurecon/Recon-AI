import React from 'react';
import {
  FileSpreadsheet,
  Download,
  FileCheck,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Calendar,
  Layers,
} from 'lucide-react';
import { ReconciliationSession } from '../types.js';
import { downloadExcelReport } from '../utils/downloadHelper.js';

interface ReportsViewProps {
  session: ReconciliationSession | null;
  onNavigateToUpload: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  session,
  onNavigateToUpload,
}) => {
  if (!session) {
    return (
      <div className="text-center py-20 bg-white border border-slate-200 rounded-xl p-8 max-w-xl mx-auto space-y-4 shadow-sm">
        <FileSpreadsheet className="w-12 h-12 text-emerald-600 mx-auto" />
        <h3 className="text-xl font-bold text-slate-900">No Reconciliation Report Generated</h3>
        <p className="text-xs text-slate-500">
          Upload financial records or trigger a 1-click sample reconciliation run to generate audit reports.
        </p>
        <button
          onClick={onNavigateToUpload}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-md shadow-sm transition-colors"
        >
          Go to File Upload
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            Audit Certification & Export Center
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
            Reconciliation Report Workbook
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Session ID: {session.id} | Generated: {new Date(session.createdAt).toLocaleString()}
          </p>
        </div>

        <button
          onClick={() => downloadExcelReport(session)}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-md shadow-sm transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download Excel Workbook (.xlsx)</span>
        </button>
      </div>

      {/* Audit Certification Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-3 text-emerald-700 font-bold text-sm">
          <ShieldCheck className="w-5 h-5" />
          <span>Automated CPA Audit Certification</span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          This financial reconciliation audit report contains all reconciled transactions, unadjusted variances, AI-recommended journal entries, and machine learning fraud flags processed for{' '}
          <span className="text-slate-900 font-bold">{session.internalFileName}</span> and{' '}
          <span className="text-slate-900 font-bold">{session.externalFileName}</span>.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Internal Records</span>
            <span className="text-base font-bold text-slate-900">{session.totalInternalCount}</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Bank Records</span>
            <span className="text-base font-bold text-slate-900">{session.totalExternalCount}</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Match Rate</span>
            <span className="text-base font-bold text-emerald-600">
              {session.matchRate.toFixed(1)}%
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Unresolved Variance</span>
            <span className="text-base font-bold text-red-600">
              ${session.totalDiscrepancyAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Included Workbook Sheets Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <span>Multi-Sheet Excel Workbook Structure</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-bold text-blue-600 mb-1">Sheet 1: Executive Summary</h4>
            <p className="text-slate-500 text-[11px]">
              High-level overview stats, match rates, upload file metadata, and certification notes.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-bold text-emerald-600 mb-1">Sheet 2: Matched Transactions</h4>
            <p className="text-slate-500 text-[11px]">
              Complete record of 100% exact and near-matched pairs with confidence scores.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-bold text-amber-600 mb-1">Sheet 3: Discrepancies & Adjustments</h4>
            <p className="text-slate-500 text-[11px]">
              Itemized variances, AI root cause explanations, and exact Debit/Credit journal entries.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-bold text-red-600 mb-1">Sheet 4: Fraud Risk Audit Log</h4>
            <p className="text-slate-500 text-[11px]">
              Flagged duplicate payments, altered amounts, ghost transfers, and recommended actions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
