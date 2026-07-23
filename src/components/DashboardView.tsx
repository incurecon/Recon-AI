import React from 'react';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  TrendingUp,
  UploadCloud,
  Download,
  MessageSquare,
  ArrowRight,
  Clock,
  Zap,
} from 'lucide-react';
import { ReconciliationSession } from '../types.js';
import { downloadExcelReport } from '../utils/downloadHelper.js';

interface DashboardViewProps {
  session: ReconciliationSession | null;
  userSessions?: ReconciliationSession[];
  onSelectSession?: (session: ReconciliationSession) => void;
  onNavigate: (view: string) => void;
  onRunDemo: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  session,
  userSessions = [],
  onSelectSession,
  onNavigate,
  onRunDemo,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
              Reconciliation Overview
            </span>
            {userSessions.length > 1 && (
              <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-full border border-blue-200">
                {userSessions.length} Sessions Saved
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
            Financial Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {session
              ? `Active Session: ${session.internalFileName} vs ${session.externalFileName}`
              : 'No active analysis session. Upload files or run 1-Click Demo to inspect records.'}
          </p>

          {/* Session History Switcher Dropdown */}
          {userSessions.length > 1 && (
            <div className="mt-3 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-600">Your Past Reconciliations:</span>
              <select
                value={session?.id || ''}
                onChange={(e) => {
                  const selected = userSessions.find((s) => s.id === e.target.value);
                  if (selected && onSelectSession) {
                    onSelectSession(selected);
                  }
                }}
                className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-md px-2.5 py-1 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {userSessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.internalFileName} vs {s.externalFileName} ({new Date(s.createdAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {session && (
            <button
              onClick={() => downloadExcelReport(session)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-md shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Excel Workbook
            </button>
          )}

          <button
            onClick={() => onNavigate('upload')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-md shadow-sm transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            New Upload
          </button>

          {!session && (
            <button
              onClick={onRunDemo}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-medium text-xs rounded-md transition-colors"
            >
              <Zap className="w-4 h-4 text-amber-500" />
              Load Demo Data
            </button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Matched Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-medium uppercase">Reconciliation Match Rate</p>
          <div className="flex items-end justify-between mt-1">
            <h2 className="text-2xl font-bold text-slate-900">
              {session ? `${session.matchRate.toFixed(1)}%` : '0.0%'}
            </h2>
            <span className="text-emerald-600 text-xs font-bold mb-1">
              {session ? `${session.matchedCount} Matched` : 'No Data'}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${session ? session.matchRate : 0}%` }}
            />
          </div>
        </div>

        {/* Card 2: Discrepancies */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-medium uppercase">Unmatched Items</p>
          <div className="flex items-end justify-between mt-1">
            <h2 className="text-2xl font-bold text-slate-900">
              {session ? session.unmatchedCount : 0}
            </h2>
            <span className="text-amber-600 text-xs font-bold mb-1">
              ${session ? session.totalDiscrepancyAmount.toLocaleString() : '0.00'}
            </span>
          </div>
          <button
            onClick={() => onNavigate('matrix')}
            className="mt-3 text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"
          >
            Inspect Discrepancies <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 3: Fraud Alerts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-medium uppercase">Fraud Alerts</p>
          <div className="flex items-end justify-between mt-1">
            <h2 className="text-2xl font-bold text-red-600">
              {session ? session.fraudCount : 0}
            </h2>
            <span className="text-slate-400 text-xs font-medium mb-1">
              {session && session.fraudCount > 0 ? 'High Risk' : 'Clean'}
            </span>
          </div>
          <button
            onClick={() => onNavigate('fraud')}
            className="mt-3 text-xs text-red-600 font-medium hover:underline flex items-center gap-1"
          >
            Open Fraud Radar <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 4: AI Confidence Score */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-medium uppercase">AI Confidence Score</p>
          <div className="flex items-end justify-between mt-1">
            <h2 className="text-2xl font-bold text-blue-600">98.8%</h2>
            <span className="text-slate-400 text-xs font-medium mb-1">High Precision</span>
          </div>
          <button
            onClick={() => onNavigate('assistant')}
            className="mt-3 text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"
          >
            Consult AI Auditor <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Grid: Comparison Table & AI Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table Section */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700 text-sm">Recent Comparison Results</h3>
            <button
              onClick={() => onNavigate('matrix')}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600 uppercase hover:bg-slate-100 transition-colors flex items-center gap-1"
            >
              Full Matrix <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            {session && session.pairs.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[11px] font-bold text-slate-400 uppercase bg-white border-b border-slate-100">
                    <th className="px-4 py-3">Internal Ref</th>
                    <th className="px-4 py-3">External Ref</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3">Confidence</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-50">
                  {session.pairs.slice(0, 6).map((pair) => (
                    <tr key={pair.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-700 font-medium">
                        {pair.internalTxn?.reference || 'N/A'}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {pair.externalTxn?.reference || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">
                        $
                        {(
                          pair.internalTxn?.amount ||
                          pair.externalTxn?.amount ||
                          0
                        ).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full"
                            style={{ width: `${pair.confidence}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {pair.status === 'perfect' || pair.status === 'near' ? (
                          <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold uppercase">
                            Match
                          </span>
                        ) : pair.status === 'amount_discrepancy' ? (
                          <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold uppercase">
                            Discrepancy
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold uppercase">
                            High Risk
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs">
                No active reconciliation session. Load sample demo or upload files to view live comparisons.
              </div>
            )}
          </div>
        </div>

        {/* AI Auditor / Side Panel */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI Auditor Insights Card */}
          <div className="bg-blue-900 text-white p-5 rounded-xl border border-blue-800 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 bg-blue-400 rounded-full flex items-center justify-center">
                  <Zap className="w-3 h-3 text-blue-900 fill-current" />
                </div>
                <h3 className="text-xs font-bold tracking-wide uppercase text-blue-100">
                  AI Auditor Insights
                </h3>
              </div>
              <p className="text-xs text-blue-100 leading-relaxed italic mb-4">
                "{session && session.fraudAlerts.length > 0
                  ? session.fraudAlerts[0].explanation
                  : 'All transactions match expected variance limits. Run reconciliation to detect duplicate vendor payouts and unadjusted ledger entries.'}"
              </p>
            </div>
            <button
              onClick={() => onNavigate('assistant')}
              className="w-full bg-blue-500 hover:bg-blue-400 text-white py-2 rounded font-bold text-[10px] uppercase transition-all shadow-sm"
            >
              Consult Financial Assistant
            </button>
          </div>

          {/* Quick Workbook Export Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase">
              Excel Report Export
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Export complete audit workbooks containing Executive Summaries, Matched Pairs, Discrepancies with Journal Entries, and Fraud Risk Logs.
            </p>
            {session ? (
              <button
                onClick={() => downloadExcelReport(session)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export Multi-Sheet .xlsx
              </button>
            ) : (
              <button
                disabled
                className="w-full py-2 bg-slate-100 text-slate-400 text-xs font-medium rounded-md cursor-not-allowed"
              >
                No Data to Export
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
