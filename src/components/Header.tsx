import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  GraduationCap, 
  ShieldCheck, 
  LogOut, 
  UserCheck, 
  Flame, 
  ChevronDown,
  RotateCcw,
  Sun,
  Moon,
  SunMedium
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    currentUser, 
    logout, 
    activeView, 
    setActiveView, 
    theme, 
    toggleTheme,
    keepScreenAwake,
    toggleKeepScreenAwake,
    isScreenWakeLocked
  } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  if (!currentUser) return null;

  const isOwner = currentUser.role === 'owner';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'extractor', label: 'PDF & MCQ Extractor', icon: FileText },
    { id: 'schedule', label: 'Schedule & Progress', icon: Calendar },
    { id: 'exam', label: 'AI Paper Maker', icon: GraduationCap },
  ];

  if (isOwner) {
    navItems.push({ id: 'owner', label: 'Owner Console', icon: ShieldCheck });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs shadow-2xs transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 h-12 sm:h-13 flex items-center justify-between">
        
        {/* Brand Logo - Geometric Balance Accent */}
        <div 
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => setActiveView(isOwner ? 'owner' : 'dashboard')}
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-900 dark:bg-indigo-600 text-amber-300 flex items-center justify-center font-black text-base shadow-xs group-hover:scale-105 transition-transform">
            <span>N</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white font-sans">
                NEET<span className="text-indigo-600 dark:text-indigo-400">.AI</span>
              </span>
              <span className="text-[9px] font-black tracking-wider px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 uppercase">
                UG
              </span>
            </div>
          </div>
        </div>

        {/* Center Nav Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-900 dark:bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-300 dark:text-indigo-200' : 'text-slate-500 dark:text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2">
          
          {/* Student Stats Badges (if student) */}
          {!isOwner && (
            <div className="hidden lg:flex items-center gap-2">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800 text-[11px] font-bold shadow-2xs">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{currentUser.studyStreak}d Streak</span>
              </div>
            </div>
          )}

          {/* Global Screen Wake Lock (Keep Screen ON) Toggle */}
          <button
            onClick={toggleKeepScreenAwake}
            title={
              keepScreenAwake || isScreenWakeLocked
                ? 'Screen Stay-Awake Active: Prevents display from sleeping/turning off (Click to toggle)'
                : 'Screen Stay-Awake Inactive (Click to keep screen awake while studying)'
            }
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
              keepScreenAwake || isScreenWakeLocked
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}
          >
            <SunMedium className={`w-3.5 h-3.5 ${keepScreenAwake || isScreenWakeLocked ? 'text-emerald-500 animate-spin' : 'text-slate-400'}`} />
            <span className="hidden sm:inline text-[11px]">
              {keepScreenAwake || isScreenWakeLocked ? 'Screen Awake' : 'Awake Off'}
            </span>
          </button>

          {/* Global Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
            )}
          </button>

          {/* User Profile Avatar & Sign Out */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-700">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-7 h-7 rounded-full object-cover ring-2 ring-indigo-500/30"
            />
            <div className="hidden xl:block text-left">
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">{currentUser.name}</p>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 capitalize">{currentUser.role}</p>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors ml-0.5"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Nav Menu */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 px-2 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[10px] font-medium transition-all ${
                isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
