import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  GraduationCap, 
  FileCheck2, 
  CalendarClock, 
  BrainCircuit, 
  AlertCircle,
  Loader2,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { loginWithGoogle } = useAuth();
  
  const [error, setError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Handle Google 1-Click Sign-In
  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      if (!result.success && result.error && !result.isCancelled) {
        setError(result.error);
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (!msg.includes('popup-closed-by-user') && !msg.includes('cancelled-popup-request')) {
        setError('Google Sign-In could not be completed. Please try again.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Background Decorative Blur Blobs */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Side: Product Value & Features */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>NEET Prep AI • Official Medical Entrance Platform</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight font-sans">
            Crack NEET UG with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200">NCERT-Focused AI</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
            Extract NTA-pattern MCQs from NCERT PDFs, attempt timed mock tests with +4 / -1 negative marking, and generate personalized 7-day NEET study timetables for Physics, Chemistry, Botany, and Zoology.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 transition-colors backdrop-blur-md flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">NCERT PDF Extractor</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Instant NTA MCQs with line-by-line textbook references.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 transition-colors backdrop-blur-md flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                <CalendarClock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">7-Day Revision Planner</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Personalized study timetable targeting high-yield exam chapters.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 transition-colors backdrop-blur-md flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">NTA Pattern Mock Tests</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Full 180-Q timed mock papers with real score analytics.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-emerald-500/40 transition-colors backdrop-blur-md flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">AI Mistake Notebook</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Auto-diagnose weak concepts and track accuracy in real-time.</p>
              </div>
            </div>

          </div>

        </div>

        {/* Right Side: Exclusive Google Sign-In Card */}
        <div className="lg:col-span-5">
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl relative text-center">
            
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 mx-auto flex items-center justify-center mb-5">
              <GraduationCap className="w-7 h-7" />
            </div>

            <div className="mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800 text-indigo-300 text-xs font-semibold mb-3">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Verified Google Authentication</span>
              </div>
              <h2 className="text-2xl font-black text-white">
                Student & Aspirant Sign In
              </h2>
              <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
                Connect securely with your Google account to access official NEET mock papers, AI notes, and your revision dashboard.
              </p>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 text-left animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed flex-1">{error}</span>
              </div>
            )}

            {/* Google One-Click Sign-In Button */}
            <div className="space-y-4">
              <button
                type="button"
                id="btn-google-login"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full py-4 px-5 rounded-2xl font-bold text-sm text-slate-900 bg-white hover:bg-slate-100 active:bg-slate-200 transition-all flex items-center justify-center gap-3.5 shadow-xl shadow-indigo-950/50 disabled:opacity-60 cursor-pointer group hover:scale-[1.01]"
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                    <span className="text-slate-800">Signing in with Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.8s.7 5.1 1.9 7.5l3.7-2.9c-.8-1.5-1.2-3.1-1.2-4.6z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                      />
                    </svg>
                    <span className="font-extrabold tracking-tight">Continue with Google</span>
                  </>
                )}
              </button>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-center gap-2 text-[11px] text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>100% Genuine Verified Google Accounts Only</span>
              </div>
              <p className="text-[10px] text-slate-500">
                Zero fake accounts • Instant synchronization across all your devices
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
