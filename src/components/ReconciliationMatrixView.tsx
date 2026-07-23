import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  HelpCircle,
  Copy,
  Check,
  BrainCircuit,
  ArrowRight,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { ReconciliationSession, ReconciliationPair } from '../types.js';
import { downloadExcelReport } from '../utils/downloadHelper.js';

interface ReconciliationMatrixViewProps {
  session: ReconciliationSession | null;
  onNavigateToUpload: () => void;
}

export const ReconciliationMatrixView: React.FC<ReconciliationMatrixViewProps> = ({
  session,
  onNavigateToUpload,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedPair, setSelectedPair] = useState<ReconciliationPair | null>(null);
  const [copiedJournal, setCopiedJournal] = useState(false);

  if (!session) {
    return (
      <div className="text-center py-20 bg-white border border-slate-200 rounded-xl p-8 max-w-xl mx-auto space-y-4 shadow-sm">
        <AlertCircle className="w-12 h-12 text-blue-600 mx-auto" />
        <h3 className="text-xl font-bold text-slate-900">No Analysis Session Loaded</h3>
        <p className="text-xs text-slate-500">
          Upload financial records or trigger a 1-click sample reconciliation run to view the interactive matrix.
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

  const filteredPairs = session.pairs.filter((pair) => {
    // Filter by tab
    if (filterStatus === 'matched' && pair.status !== 'perfect' && pair.status !== 'near') return false;
    if (filterStatus === 'discrepancies' && (pair.status === 'perfect' || pair.status === 'near')) return false;
    if (filterStatus === 'missing_ledger' && pair.status !== 'missing_ledger') return false;
    if (filterStatus === 'missing_bank' && pair.status !== 'missing_bank') return false;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const intRef = pair.internalTxn?.reference.toLowerCase() || '';
      const extRef = pair.externalTxn?.reference.toLowerCase() || '';
      const intDesc = pair.internalTxn?.description.toLowerCase() || '';
      const extDesc = pair.externalTxn?.description.toLowerCase() || '';
      return (
        intRef.includes(term) ||
        extRef.includes(term) ||
        intDesc.includes(term) ||
        extDesc.includes(term)
      );
    }
    return true;
  });

  const handleCopyJournal = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedJournal(true);
    setTimeout(() => setCopiedJournal(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Reconciliation Analysis Matrix</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Side-by-side transaction comparison, AI discrepancy reasoning & journal adjustments
          </p>
        </div>

        <button
          onClick={() => session && downloadExcelReport(session)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-md shadow-sm transition-colors self-start md:self-auto cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export Excel Workbook
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All ({session.pairs.length})
          </button>
          <button
            onClick={() => setFilterStatus('matched')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              filterStatus === 'matched'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Matched ({session.matchedCount})
          </button>
          <button
            onClick={() => setFilterStatus('discrepancies')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              filterStatus === 'discrepancies'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Discrepancies ({session.unmatchedCount})
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search ref, vendor, amount..."
            className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 uppercase text-[11px] font-bold border-b border-slate-200">
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Internal Ledger Item</th>
                <th className="py-3 px-4">Bank Statement Item</th>
                <th className="py-3 px-4 text-right">Ledger Amt</th>
                <th className="py-3 px-4 text-right">Bank Amt</th>
                <th className="py-3 px-4 text-right">Diff</th>
                <th className="py-3 px-4">AI Confidence</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPairs.map((pair) => (
                <tr
                  key={pair.id}
                  onClick={() => setSelectedPair(pair)}
                  className="hover:bg-blue-50/30 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        pair.status === 'perfect' || pair.status === 'near'
                          ? 'bg-emerald-100 text-emerald-700'
                          : pair.status === 'amount_discrepancy'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {pair.status.replace(/_/g, ' ')}
                    </span>
                  </td>

                  {/* Internal Ledger Info */}
                  <td className="py-3.5 px-4 max-w-xs">
                    {pair.internalTxn ? (
                      <div>
                        <p className="font-mono text-blue-600 font-bold">
                          {pair.internalTxn.reference}
                        </p>
                        <p className="text-slate-700 truncate text-[11px]">
                          {pair.internalTxn.description}
                        </p>
                        <p className="text-[10px] text-slate-400">{pair.internalTxn.date}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Not in Ledger</span>
                    )}
                  </td>

                  {/* External Bank Info */}
                  <td className="py-3.5 px-4 max-w-xs">
                    {pair.externalTxn ? (
                      <div>
                        <p className="font-mono text-slate-800 font-bold">
                          {pair.externalTxn.reference}
                        </p>
                        <p className="text-slate-700 truncate text-[11px]">
                          {pair.externalTxn.description}
                        </p>
                        <p className="text-[10px] text-slate-400">{pair.externalTxn.date}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Not in Bank</span>
                    )}
                  </td>

                  {/* Ledger Amount */}
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-800">
                    {pair.internalTxn ? `$${pair.internalTxn.amount.toFixed(2)}` : '-'}
                  </td>

                  {/* Bank Amount */}
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-800">
                    {pair.externalTxn ? `$${pair.externalTxn.amount.toFixed(2)}` : '-'}
                  </td>

                  {/* Difference */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-red-600">
                    {pair.amountDiff > 0 ? `$${pair.amountDiff.toFixed(2)}` : '$0.00'}
                  </td>

                  {/* Confidence meter */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            pair.confidence > 80
                              ? 'bg-emerald-500'
                              : pair.confidence > 50
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${pair.confidence}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600">
                        {pair.confidence}%
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <button className="p-1.5 bg-slate-100 hover:bg-slate-200 text-blue-600 rounded-md transition-colors">
                      <BrainCircuit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discrepancy Detail Drawer Modal */}
      {selectedPair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-xl shadow-2xl p-6 text-slate-800 relative space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedPair(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600 border border-blue-100">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">AI Discrepancy Audit Inspection</h3>
                <p className="text-xs text-slate-500">
                  Pair ID: {selectedPair.id} | Status:{' '}
                  <span className="text-red-600 font-bold uppercase">
                    {selectedPair.status.replace(/_/g, ' ')}
                  </span>
                </p>
              </div>
            </div>

            {/* Side-by-side comparison box */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-blue-600 font-bold uppercase">Internal Ledger Record</span>
                <p className="font-mono text-slate-900 font-bold mt-1">
                  {selectedPair.internalTxn?.reference || 'None'}
                </p>
                <p className="text-slate-600">{selectedPair.internalTxn?.description || 'N/A'}</p>
                <p className="text-emerald-700 font-bold mt-1">
                  Amount: ${selectedPair.internalTxn?.amount.toFixed(2) || '0.00'}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase">Bank Statement Record</span>
                <p className="font-mono text-slate-900 font-bold mt-1">
                  {selectedPair.externalTxn?.reference || 'None'}
                </p>
                <p className="text-slate-600">{selectedPair.externalTxn?.description || 'N/A'}</p>
                <p className="text-blue-600 font-bold mt-1">
                  Amount: ${selectedPair.externalTxn?.amount.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>

            {/* AI Explanation Details */}
            {selectedPair.aiExplanation ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-1">
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Root Cause Analysis
                  </h4>
                  <p className="text-xs text-blue-950 leading-relaxed">
                    {selectedPair.aiExplanation.cause}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-1">
                  <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                    Recommended Resolution
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {selectedPair.aiExplanation.resolution}
                  </p>
                </div>

                {/* Suggested Journal Entry Box */}
                <div className="bg-slate-900 text-white p-4 rounded-lg space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Suggested Journal Adjustment Entry
                    </h4>
                    <button
                      onClick={() =>
                        handleCopyJournal(selectedPair.aiExplanation?.journalEntry || '')
                      }
                      className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 bg-slate-800 px-2 py-1 rounded border border-slate-700"
                    >
                      {copiedJournal ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy Journal Entry
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="font-mono text-xs text-blue-200 bg-slate-950 p-3 rounded border border-slate-800 whitespace-pre-wrap">
                    {selectedPair.aiExplanation.journalEntry}
                  </pre>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-1 text-xs">
                  <h4 className="font-bold text-slate-800">Preventive Internal Control:</h4>
                  <p className="text-slate-600">{selectedPair.aiExplanation.preventiveMeasure}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-lg text-center text-xs text-slate-500">
                Exact match verified. No adjustment journal entry needed.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
