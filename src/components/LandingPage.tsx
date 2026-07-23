import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  FileSpreadsheet,
  BrainCircuit,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Search,
  Download,
  BarChart3,
  HelpCircle,
} from 'lucide-react';

import { User } from '../types.js';

interface LandingPageProps {
  user: User | null;
  onOpenAuth: () => void;
  onStartReconciliation: () => void;
  onRunDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  user,
  onOpenAuth,
  onStartReconciliation,
  onRunDemo,
}) => {
  const handleAction = (callback: () => void) => {
    if (!user) {
      onOpenAuth();
    } else {
      callback();
    }
  };
  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen font-sans selection:bg-indigo-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-900 to-slate-950 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-xs font-semibold mb-8 shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Next-Gen Enterprise Financial Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            AI-Driven Financial Reconciliation &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">
              Fraud Radar
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Automatically reconcile bank statements, general ledgers, CSVs, and Excel spreadsheets. Detect suspicious anomalies, receive AI audit explanations, and generate multi-sheet Excel reports in seconds.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleAction(onStartReconciliation)}
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Upload & Reconcile Records</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleAction(onRunDemo)}
              className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Run Live 1-Click Demo</span>
            </button>
          </div>

          {!user && (
            <div className="mt-4 text-xs text-amber-300/90 font-medium bg-amber-950/60 border border-amber-800/60 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Note: Signing in or registering is required before performing operations.</span>
            </div>
          )}

          {/* Interactive Feature Badges */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
              <div className="text-indigo-400 font-bold text-2xl mb-1">99.8%</div>
              <div className="text-xs text-slate-400">Matching Accuracy with Fuzzy Logic</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
              <div className="text-rose-400 font-bold text-2xl mb-1">10+</div>
              <div className="text-xs text-slate-400">Fraud Pattern Detectors</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
              <div className="text-emerald-400 font-bold text-2xl mb-1">Multi-Sheet</div>
              <div className="text-xs text-slate-400">Excel Workbook Export</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
              <div className="text-sky-400 font-bold text-2xl mb-1">Gemini AI</div>
              <div className="text-xs text-slate-400">Auditor Explanations & Assistant</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities Grid */}
      <section className="py-20 bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">
              Comprehensive Financial Engine
            </h2>
            <p className="text-3xl font-extrabold text-white">
              Built for CPAs, Auditors, CFOs & Business Leaders
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition">
              <div className="w-12 h-12 rounded-xl bg-indigo-900/60 border border-indigo-700/50 flex items-center justify-center text-indigo-400 mb-6">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Intelligent Reconciliation</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Uses hybrid matching: exact transaction reference checks, date window alignment, and fuzzy token similarity to pair records across CSV, Excel, and PDF statements.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition">
              <div className="w-12 h-12 rounded-xl bg-rose-900/60 border border-rose-700/50 flex items-center justify-center text-rose-400 mb-6">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Machine Learning Fraud Radar</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Flags duplicate invoices, altered transaction amounts, ghost bank debits, split payment threshold evasions, and round-number anomalies with risk scores.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-900/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400 mb-6">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Multi-Sheet Audit Workbooks</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Generate downloadable, audit-ready Excel workbooks containing Executive Summaries, Matched Pairs, Discrepancies with AI Journal Entries, and Fraud Risk Audit Logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-white">4 Simple Steps to Complete Reconciliation</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700 relative">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center mb-4">
                1
              </div>
              <h4 className="font-bold text-white mb-2">Upload Statements</h4>
              <p className="text-xs text-slate-400">
                Drop your Company Ledger (CSV/XLSX) and Bank Statement (PDF/CSV/XLSX).
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700 relative">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center mb-4">
                2
              </div>
              <h4 className="font-bold text-white mb-2">AI Engine Run</h4>
              <p className="text-xs text-slate-400">
                Algorithmic parser standardizes dates, references, debit/credit values, and balances.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700 relative">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center mb-4">
                3
              </div>
              <h4 className="font-bold text-white mb-2">Inspect Discrepancies</h4>
              <p className="text-xs text-slate-400">
                Review confidence scores, Gemini AI root causes, and recommended journal entries.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700 relative">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center mb-4">
                4
              </div>
              <h4 className="font-bold text-white mb-2">Export Excel Workbook</h4>
              <p className="text-xs text-slate-400">
                Download structured Excel reports ready for auditors, CFOs, or board presentations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
              <h4 className="font-bold text-white text-base mb-2">What file formats are supported?</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                IncuRecon AI supports CSV files, Microsoft Excel (.xlsx, .xls), and PDF bank statement extracts. Columns are automatically mapped.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
              <h4 className="font-bold text-white text-base mb-2">How does the AI Discrepancy Explanation work?</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                When two records don't match exactly, Gemini 3.6 Flash analyzes the discrepancy, determines potential accounting causes (e.g. bank fee deductions, timing delays), recommends adjusting journal entries, and suggests preventive controls.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
              <h4 className="font-bold text-white text-base mb-2">Is my financial data secure?</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                All uploaded files are processed securely in sandboxed server instances, with option for full session cleanup and encrypted token authentication.
              </p>
            </div>
          </div>

          {/* CTA Banner */}
          <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 border border-indigo-700/50 text-center shadow-2xl">
            <h3 className="text-2xl font-extrabold text-white mb-3">Ready to Streamline Your Financial Audits?</h3>
            <p className="text-sm text-indigo-200 mb-6 max-w-xl mx-auto">
              Eliminate manual spreadsheet comparison errors today. Run a 1-click demo reconciliation in seconds.
            </p>
            <button
              onClick={() => handleAction(onRunDemo)}
              className="px-8 py-3.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm rounded-xl shadow-lg transition cursor-pointer"
            >
              Start Free Demo Reconciliation
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-950 border-t border-slate-900 text-slate-500 text-xs text-center">
        <p>© 2026 IncuRecon AI Financial Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};
