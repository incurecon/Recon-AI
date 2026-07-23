import React, { useState, useEffect } from 'react';
import { Lock, LogIn, Sparkles, UserCheck } from 'lucide-react';
import { Navbar } from './components/Navbar.js';
import { LandingPage } from './components/LandingPage.js';
import { AuthModal } from './components/AuthModal.js';
import { DashboardView } from './components/DashboardView.js';
import { FileUploadView } from './components/FileUploadView.js';
import { ReconciliationMatrixView } from './components/ReconciliationMatrixView.js';
import { FraudRadarView } from './components/FraudRadarView.js';
import { ReportsView } from './components/ReportsView.js';
import { AIAssistantView } from './components/AIAssistantView.js';
import { User, ReconciliationSession } from './types.js';
import { fetchJson } from './utils/apiHelper.js';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [session, setSession] = useState<ReconciliationSession | null>(null);
  const [userSessions, setUserSessions] = useState<ReconciliationSession[]>([]);
  const [loadingDemo, setLoadingDemo] = useState(false);

  // Restore user session if token exists
  useEffect(() => {
    const token = localStorage.getItem('incurecon_token');
    if (token) {
      fetchJson<{ user: User }>('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(({ ok, data }) => {
          if (ok && data?.user) {
            setUser(data.user);
          } else {
            localStorage.removeItem('incurecon_token');
          }
        })
        .catch((err) => {
          console.error('Error fetching current user:', err);
          localStorage.removeItem('incurecon_token');
        });
    }
  }, []);

  // Fetch reconciliation sessions belonging exclusively to the logged in user
  useEffect(() => {
    if (user) {
      fetchJson<{ sessions: ReconciliationSession[] }>('/api/sessions')
        .then(({ ok, data }) => {
          if (ok && data?.sessions) {
            setUserSessions(data.sessions);
            if (data.sessions.length > 0) {
              setSession(data.sessions[0]);
            } else {
              setSession(null);
            }
          }
        })
        .catch((err) => console.error('Error fetching user sessions:', err));
    } else {
      setUserSessions([]);
      setSession(null);
    }
  }, [user]);

  const navigateView = (view: string) => {
    if (view !== 'landing' && !user) {
      setAuthModalOpen(true);
      return;
    }
    setCurrentView(view);
  };

  const handleLogout = () => {
    localStorage.removeItem('incurecon_token');
    setUser(null);
    setUserSessions([]);
    setSession(null);
    setCurrentView('landing');
  };

  const handleRunDemo = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setLoadingDemo(true);
    try {
      const { ok, data } = await fetchJson<{ session: ReconciliationSession; error?: string }>(
        '/api/upload-and-reconcile',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ useSampleData: true }),
        }
      );

      if (!ok || !data.session) {
        throw new Error(data.error || 'Failed to run sample reconciliation.');
      }

      setSession(data.session);
      setUserSessions((prev) => [data.session, ...prev.filter((s) => s.id !== data.session.id)]);
      setCurrentView('dashboard');
    } catch (err: any) {
      console.error('Error running sample demo:', err);
      if (err.message?.includes('Authentication required') || err.message?.includes('expired')) {
        setUser(null);
        localStorage.removeItem('incurecon_token');
        setAuthModalOpen(true);
      }
    } finally {
      setLoadingDemo(false);
    }
  };

  const handleReconciliationComplete = (newSession: ReconciliationSession) => {
    setSession(newSession);
    setUserSessions((prev) => [newSession, ...prev.filter((s) => s.id !== newSession.id)]);
    setCurrentView('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-500 selection:text-white flex flex-col">
      <Navbar
        currentView={currentView}
        setCurrentView={navigateView}
        user={user}
        onLogout={handleLogout}
        onOpenAuth={() => setAuthModalOpen(true)}
        onQuickDemo={handleRunDemo}
        fraudAlertCount={session?.fraudAlerts.length || 0}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loadingDemo && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs flex items-center justify-between animate-pulse shadow-sm">
            <span className="font-medium">Executing AI Reconciliation Engine on Q1 Sample Dataset...</span>
          </div>
        )}

        {currentView === 'landing' && (
          <LandingPage
            user={user}
            onOpenAuth={() => setAuthModalOpen(true)}
            onStartReconciliation={() => {
              if (!user) {
                setAuthModalOpen(true);
              } else {
                setCurrentView('upload');
              }
            }}
            onRunDemo={handleRunDemo}
          />
        )}

        {/* PROTECTED VIEW GUARD */}
        {currentView !== 'landing' && !user && (
          <div className="my-12 p-8 max-w-lg mx-auto bg-white border border-slate-200 rounded-2xl shadow-xl text-center">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl mx-auto flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Authentication Required</h3>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              To perform financial reconciliation, analyze fraud alerts, or query the AI assistant, you must sign in or register an accountant account.
            </p>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Create Account</span>
            </button>
          </div>
        )}

        {currentView === 'dashboard' && user && (
          <DashboardView
            session={session}
            userSessions={userSessions}
            onSelectSession={setSession}
            onNavigate={navigateView}
            onRunDemo={handleRunDemo}
          />
        )}

        {currentView === 'upload' && user && (
          <FileUploadView
            onReconciliationComplete={handleReconciliationComplete}
            onRunDemo={handleRunDemo}
          />
        )}

        {currentView === 'matrix' && user && (
          <ReconciliationMatrixView
            session={session}
            onNavigateToUpload={() => navigateView('upload')}
          />
        )}

        {currentView === 'fraud' && user && (
          <FraudRadarView
            session={session}
            onNavigateToUpload={() => navigateView('upload')}
          />
        )}

        {currentView === 'reports' && user && (
          <ReportsView
            session={session}
            onNavigateToUpload={() => navigateView('upload')}
          />
        )}

        {currentView === 'assistant' && user && <AIAssistantView session={session} />}
      </main>

      {/* Professional Polish Footer */}
      <footer className="h-10 bg-white border-t border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0 text-[10px] text-slate-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="uppercase font-bold text-slate-600">AI Processing Engine: Online</span>
          </div>
          <div className="h-3 w-[1px] bg-slate-200"></div>
          <span className="font-medium text-slate-400">
            {user ? `Logged In: ${user.fullName}` : 'Access: Authentication Required'}
          </span>
        </div>
        <span className="font-medium">IncuRecon AI v2.4.1 (Enterprise Build)</span>
      </footer>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(u, token) => {
          setUser(u);
          if (currentView === 'landing') setCurrentView('dashboard');
        }}
      />
    </div>
  );
}
