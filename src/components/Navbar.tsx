import React from 'react';
import {
  Sparkles,
  LayoutDashboard,
  ArrowRightLeft,
  ShieldAlert,
  FileSpreadsheet,
  MessageSquare,
  UploadCloud,
  LogOut,
  User as UserIcon,
  HelpCircle,
  Home,
} from 'lucide-react';
import { User } from '../types.js';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  user: User | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  onQuickDemo: () => void;
  fraudAlertCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  user,
  onLogout,
  onOpenAuth,
  onQuickDemo,
  fraudAlertCount = 0,
}) => {
  const handleNav = (targetView: string) => {
    if (targetView === 'landing') {
      setCurrentView('landing');
      return;
    }
    if (!user) {
      onOpenAuth();
    } else {
      setCurrentView(targetView);
    }
  };

  const handleQuickDemoClick = () => {
    if (!user) {
      onOpenAuth();
    } else {
      onQuickDemo();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900 text-slate-300 border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => setCurrentView('landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shadow-md shadow-blue-900/50 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              IncuRecon <span className="text-blue-400 font-extrabold">AI</span>
            </span>
            <span className="text-[10px] text-slate-400 tracking-wider uppercase block -mt-1 font-semibold">
              Financial Intelligence Platform
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => handleNav('landing')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentView === 'landing'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            Home
          </button>

          <button
            onClick={() => handleNav('dashboard')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentView === 'dashboard'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </button>

          <button
            onClick={() => handleNav('upload')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentView === 'upload'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            File Upload
          </button>

          <button
            onClick={() => handleNav('matrix')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentView === 'matrix'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Reconciliation
          </button>

          <button
            onClick={() => handleNav('fraud')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition relative ${
              currentView === 'fraud'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Fraud Detection
            {fraudAlertCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-red-600 text-white text-[10px] font-bold rounded-full">
                {fraudAlertCount}
              </span>
            )}
          </button>

          <button
            onClick={() => handleNav('reports')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentView === 'reports'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel Reports
          </button>

          <button
            onClick={() => handleNav('assistant')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentView === 'assistant'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            AI Assistant
          </button>
        </nav>

        {/* User / Auth Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleQuickDemoClick}
            className="hidden sm:flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3.5 py-2 rounded-md shadow-sm transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            1-Click Demo
          </button>

          {user ? (
            <div className="flex items-center gap-3 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                {user.fullName.charAt(0)}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-medium text-white truncate">{user.fullName}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.companyName || 'Principal Auditor'}</p>
              </div>
              <button
                onClick={onLogout}
                title="Sign out"
                className="text-slate-400 hover:text-red-400 p-1 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-md transition shadow-sm"
            >
              <UserIcon className="w-3.5 h-3.5" />
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
