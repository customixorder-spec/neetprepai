import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { PomodoroWidget } from './components/PomodoroWidget';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { PdfExtractorView } from './views/PdfExtractorView';
import { ProgressScheduleView } from './views/ProgressScheduleView';
import { ExamMakerView } from './views/ExamMakerView';
import { OwnerConsoleView } from './views/OwnerConsoleView';

const MainAppRouter: React.FC = () => {
  const { isLoggedIn, activeView, streakBanner, dismissStreakBanner } = useAuth();

  if (!isLoggedIn || activeView === 'login') {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white transition-colors">
      <Header />
      
      {streakBanner && (
        <div className="bg-amber-500 text-white px-4 py-3 text-center text-sm font-bold flex items-center justify-center gap-3 shadow-md">
          <span>{streakBanner}</span>
          <button onClick={dismissStreakBanner} className="px-3 py-1 rounded bg-white/20 hover:bg-white/30 text-xs transition-colors">
            Dismiss
          </button>
        </div>
      )}

      <main className="flex-1 pb-6">
        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'extractor' && <PdfExtractorView />}
        {activeView === 'schedule' && <ProgressScheduleView />}
        {activeView === 'exam' && <ExamMakerView />}
        {activeView === 'owner' && <OwnerConsoleView />}
      </main>

      <PomodoroWidget />

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 py-2.5 text-center text-[11px] text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-slate-700 dark:text-slate-300">ScholarPulse AI • Next-Gen Student Learning Workspace</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">Powered by Gemini 3.6 Flash Server-Side Intelligence</p>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppRouter />
    </AuthProvider>
  );
}
