import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  FileCheck,
  Zap,
  ArrowRight,
  ShieldCheck,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { ReconciliationSession, FraudAlert } from '../types.js';

interface FraudRadarViewProps {
  session: ReconciliationSession | null;
  onNavigateToUpload: () => void;
}

export const FraudRadarView: React.FC<FraudRadarViewProps> = ({
  session,
  onNavigateToUpload,
}) => {
  if (!session) {
    return (
      <div className="text-center py-20 bg-white border border-slate-200 rounded-xl p-8 max-w-xl mx-auto space-y-4 shadow-sm">
        <ShieldAlert className="w-12 h-12 text-red-600 mx-auto" />
        <h3 className="text-xl font-bold text-slate-900">No Active Fraud Scan</h3>
        <p className="text-xs text-slate-500">
          Upload financial records or trigger sample data to activate the ML Fraud Detection Radar.
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

  const criticalCount = session.fraudAlerts.filter((f) => f.riskLevel === 'Critical').length;
  const highCount = session.fraudAlerts.filter((f) => f.riskLevel === 'High').length;
  const mediumCount = session.fraudAlerts.filter((f) => f.riskLevel === 'Medium').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
        <div>
          <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider mb-2">
            <ShieldAlert className="w-4 h-4" />
            <span>Machine Learning Anomaly Radar Active</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Fraud Risk & Anomaly Audit Radar
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Real-time pattern recognition scanning for duplicate payouts, altered numbers, split payment evasions, ghost transfers, and unrecorded bank debits.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
          <div className="text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Flagged Alerts</span>
            <span className="text-2xl font-bold text-red-400">{session.fraudAlerts.length}</span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Highest Risk</span>
            <span className="text-xs font-bold text-red-500 uppercase">
              {criticalCount > 0 ? 'Critical' : highCount > 0 ? 'High' : 'Normal'}
            </span>
          </div>
        </div>
      </div>

      {/* Risk Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-red-600 uppercase">Critical Severity</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{criticalCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Requires immediate CFO sign-off & freeze</p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-amber-600 uppercase">High Risk Flagged</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{highCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Discrepancy exceeds standard threshold</p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-blue-600 uppercase">Medium Risk Flagged</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{mediumCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Unusual round number or timing variance</p>
        </div>
      </div>

      {/* Fraud Alert Cards List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Flagged Suspicious Transactions ({session.fraudAlerts.length})</h3>

        {session.fraudAlerts.length > 0 ? (
          session.fraudAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-slate-300 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      alert.riskLevel === 'Critical'
                        ? 'bg-red-100 text-red-700'
                        : alert.riskLevel === 'High'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {alert.riskLevel} Risk
                  </span>
                  <span className="font-mono text-xs font-bold text-blue-600">
                    Ref: {alert.reference}
                  </span>
                  <span className="text-xs text-slate-400">{alert.date}</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Transaction Value</span>
                    <span className="text-sm font-extrabold text-slate-900 font-mono">
                      ${Math.abs(alert.amount).toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Fraud Score</span>
                    <span className="text-xs font-bold text-red-600">{alert.fraudScore} / 100</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-red-600 uppercase text-[10px] tracking-wider mb-1">
                    Detected Anomaly Pattern ({alert.fraudType.replace(/_/g, ' ')})
                  </h4>
                  <p className="text-slate-700 leading-relaxed">{alert.explanation}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-emerald-700 uppercase text-[10px] tracking-wider mb-1">
                    Recommended Audit Action
                  </h4>
                  <p className="text-slate-700 leading-relaxed">{alert.recommendedAction}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 bg-white border border-slate-200 rounded-xl text-center text-slate-500 text-xs shadow-sm">
            <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <span>No fraud risks detected in this reconciliation session!</span>
          </div>
        )}
      </div>
    </div>
  );
};
