import React, { useState, useEffect, useRef } from 'react';
import { 
  Timer, 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  X, 
  Volume2, 
  VolumeX, 
  Sparkles,
  Sliders,
  CheckCircle2,
  SunMedium,
  Eye,
  ShieldCheck,
  Power
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWakeLock } from '../lib/useWakeLock';

type TimerMode = 'study' | 'shortBreak' | 'longBreak';

export const PomodoroWidget: React.FC = () => {
  const { currentUser, keepScreenAwake, toggleKeepScreenAwake } = useAuth();
  
  // State for drawer & fullscreen zen mode
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mode, setMode] = useState<TimerMode>('study');
  
  // Customizable durations in minutes
  const [studyMinutes, setStudyMinutes] = useState(25);
  const [shortBreakMinutes, setShortBreakMinutes] = useState(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(15);
  
  // Custom timer editor state
  const [showSettings, setShowSettings] = useState(false);
  const [customInput, setCustomInput] = useState(25);

  // Active countdown state (in seconds)
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  // Local setting for focus timer wake lock (enabled by default)
  const [focusWakeLockEnabled, setFocusWakeLockEnabled] = useState(true);

  // Screen Wake Lock Hook: Keeps screen strictly awake whenever timer is running
  const { isLocked: isWakeLockActive } = useWakeLock({
    enabled: (isRunning && focusWakeLockEnabled) || keepScreenAwake,
    tag: 'pomodoro-focus-session',
  });

  // Timer ref
  const timerRef = useRef<number | null>(null);

  // Get current target duration based on mode
  const getCurrentDuration = (currentMode: TimerMode) => {
    switch (currentMode) {
      case 'study': return studyMinutes * 60;
      case 'shortBreak': return shortBreakMinutes * 60;
      case 'longBreak': return longBreakMinutes * 60;
    }
  };

  // Update time left when mode or default minutes change while stopped
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(getCurrentDuration(mode));
    }
  }, [studyMinutes, shortBreakMinutes, longBreakMinutes, mode]);

  // Audio ring chime using Web Audio API
  const playRingSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
        
        gain.gain.setValueAtTime(0.3, ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
      };

      playTone(523.25, 0.0, 0.4); // C5
      playTone(659.25, 0.2, 0.4); // E5
      playTone(783.99, 0.4, 0.6); // G5
      playTone(1046.50, 0.6, 0.8); // C6
    } catch {
      // Audio context error fallback
    }
  };

  // Timer countdown / count-up effect
  useEffect(() => {
    if (isRunning) {
      const initialDuration = getCurrentDuration(mode);
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          // If starting at 0 or duration is 0, count up as stopwatch
          if (initialDuration === 0) {
            return prev + 1;
          }
          // Otherwise count down
          if (prev <= 1) {
            playRingSound();
            if (mode === 'study') {
              setSessionsCompleted(c => c + 1);
            }
            // Continue counting up into overtime if desired, or stop at 0
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, soundEnabled, studyMinutes, shortBreakMinutes, longBreakMinutes]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleModeSwitch = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    let mins = studyMinutes;
    if (newMode === 'shortBreak') mins = shortBreakMinutes;
    if (newMode === 'longBreak') mins = longBreakMinutes;
    setTimeLeft(mins * 60);
    setCustomInput(mins);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(getCurrentDuration(mode));
  };

  const handleSaveCustomTime = () => {
    const val = Math.max(0, Math.min(180, customInput));
    if (mode === 'study') {
      setStudyMinutes(val);
      setTimeLeft(val * 60);
    } else if (mode === 'shortBreak') {
      setShortBreakMinutes(val);
      setTimeLeft(val * 60);
    } else {
      setLongBreakMinutes(val);
      setTimeLeft(val * 60);
    }
    setShowSettings(false);
  };

  const totalDuration = getCurrentDuration(mode);
  const progressPct = totalDuration > 0 ? Math.min(100, ((totalDuration - timeLeft) / totalDuration) * 100) : 100;

  return (
    <>
      {/* Floating Button in Bottom Right */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-3 px-4.5 py-3.5 rounded-2xl bg-indigo-900 hover:bg-indigo-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-xs shadow-xl transition-all border border-indigo-700/60 dark:border-indigo-400/50 group hover:scale-[1.02]"
            title="Open Focus Timer (Screen stays awake while running)"
          >
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
              <Timer className="w-4 h-4" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-[10px] text-indigo-200 uppercase tracking-widest font-extrabold flex items-center gap-1">
                <span>Focus Timer</span>
                {isWakeLockActive && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" title="Screen Stay-Awake Active" />
                )}
              </p>
              <p className="text-sm font-black text-white tracking-tight">{formatTime(timeLeft)}</p>
            </div>
            {isRunning && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 ml-0.5 animate-pulse" />
            )}
          </button>
        </div>
      )}

      {/* Right-Side Slide-Out Drawer or Fullscreen Zen Mode */}
      {isOpen && (
        <div className={`fixed inset-0 z-50 flex ${isFullscreen ? 'items-center justify-center p-4 bg-slate-950/90' : 'justify-end'}`}>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => { setIsOpen(false); setIsFullscreen(false); }}
          />

          {/* Drawer / Zen Container */}
          <div className={`relative z-10 bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 overflow-y-auto ${
            isFullscreen 
              ? 'w-full max-w-2xl h-[80vh] rounded-3xl p-8 sm:p-12 justify-between animate-in zoom-in-95' 
              : 'w-full max-w-sm h-full border-l p-6 space-y-6 animate-in slide-in-from-right'
          }`}>
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900">
                  <Timer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Focus Studio</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{sessionsCompleted} sessions today</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Wake Lock Screen Indicator in Header */}
                <button
                  onClick={() => {
                    setFocusWakeLockEnabled(!focusWakeLockEnabled);
                    if (!focusWakeLockEnabled) toggleKeepScreenAwake();
                  }}
                  className={`p-2 rounded-xl transition-colors border ${
                    isWakeLockActive 
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                      : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent'
                  }`}
                  title={isWakeLockActive ? 'Screen Stay-Awake: Active (Display will not sleep)' : 'Screen Stay-Awake: Inactive'}
                >
                  <SunMedium className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title={soundEnabled ? 'Mute Chime' : 'Enable Chime'}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                </button>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title={isFullscreen ? 'Exit Zen View' : 'Zen Fullscreen Timer'}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => { setIsOpen(false); setIsFullscreen(false); }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* If Fullscreen Zen Mode: Show ONLY the timer and minimal controls, hiding complex tabs/settings for pure focus */}
            {isFullscreen ? (
              <div className="flex flex-col items-center justify-center my-auto space-y-8 text-center py-6">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 text-xs font-black uppercase tracking-wider border border-indigo-200 dark:border-indigo-800">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{mode === 'study' ? 'Deep Focus Mode' : 'Rest & Recharge'}</span>
                  </div>

                  {isWakeLockActive && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                      <SunMedium className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                      <span>Screen Awake: ON</span>
                    </div>
                  )}
                </div>

                <div className="text-7xl sm:text-9xl font-black font-mono tracking-tighter text-slate-900 dark:text-white">
                  {formatTime(timeLeft)}
                </div>

                <div className="w-full max-w-md bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      mode === 'study' ? 'bg-indigo-600' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <button
                    onClick={() => setIsRunning(!isRunning)}
                    className={`px-10 py-4 rounded-2xl font-black text-sm text-white shadow-xl flex items-center gap-3 transition-transform active:scale-95 ${
                      isRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-500'
                    }`}
                  >
                    {isRunning ? <><Pause className="w-5 h-5" /> Pause</> : <><Play className="w-5 h-5 fill-current" /> Start</>}
                  </button>
                  <button
                    onClick={handleReset}
                    className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700"
                    title="Reset"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Standard Right-Side Drawer Mode */}
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0">
                  <button
                    onClick={() => handleModeSwitch('study')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      mode === 'study'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Study ({studyMinutes}m)
                  </button>
                  <button
                    onClick={() => handleModeSwitch('shortBreak')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      mode === 'shortBreak'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Short ({shortBreakMinutes}m)
                  </button>
                  <button
                    onClick={() => handleModeSwitch('longBreak')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      mode === 'longBreak'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Long ({longBreakMinutes}m)
                  </button>
                </div>

                {/* Main Countdown Display */}
                <div className="flex flex-col items-center justify-center py-4 space-y-5 my-auto">
                  <div className="relative w-48 h-48 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-800/60 border-8 border-slate-100 dark:border-slate-800 shadow-lg">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="44%"
                        className="stroke-slate-200 dark:stroke-slate-700 fill-none"
                        strokeWidth="6"
                      />
                      <circle
                        cx="50%"
                        cy="50%"
                        r="44%"
                        className={`fill-none transition-all duration-1000 ${
                          mode === 'study' ? 'stroke-indigo-600 dark:stroke-indigo-400' :
                          mode === 'shortBreak' ? 'stroke-emerald-500' : 'stroke-sky-500'
                        }`}
                        strokeWidth="6"
                        strokeDasharray="276"
                        strokeDashoffset={276 - (276 * progressPct) / 100}
                        strokeLinecap="round"
                      />
                    </svg>

                    <div className="text-center z-10 space-y-1">
                      <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                        {formatTime(timeLeft)}
                      </span>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {mode === 'study' ? 'Focus' : 'Break'}
                      </p>
                    </div>
                  </div>

                  {/* Screen Stay Awake Indicator */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    <SunMedium className={`w-3.5 h-3.5 ${isWakeLockActive ? 'text-emerald-500 animate-spin' : 'text-slate-400'}`} />
                    <span>{isWakeLockActive ? 'Screen Locked Awake (No Sleep)' : 'Screen Wake Lock Idle'}</span>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsRunning(!isRunning)}
                      className={`px-6 py-3 rounded-2xl font-black text-xs text-white shadow-lg flex items-center gap-2 transition-transform active:scale-95 ${
                        isRunning 
                          ? 'bg-amber-600 hover:bg-amber-700' 
                          : mode === 'study' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {isRunning ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4 fill-current" /> Start</>}
                    </button>
                    <button
                      onClick={handleReset}
                      className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700"
                      title="Reset"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className={`p-3 rounded-2xl font-bold border transition-colors ${
                        showSettings ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                      title="Settings"
                    >
                      <Sliders className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Settings Panel */}
                {showSettings && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-4 shrink-0 animate-in fade-in">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase">Set Duration</h4>
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{customInput}m</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="120"
                        value={customInput}
                        onChange={(e) => setCustomInput(parseInt(e.target.value) || 0)}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex gap-1">
                          {[0, 15, 25, 45, 60].map((p) => (
                            <button
                              key={p}
                              onClick={() => setCustomInput(p)}
                              className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-bold text-slate-700 dark:text-slate-200"
                            >
                              {p === 0 ? '0m (Count Up)' : `${p}m`}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={handleSaveCustomTime}
                          className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                        >
                          Save
                        </button>
                      </div>
                    </div>

                    {/* Keep Screen Awake Setting Toggle */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <SunMedium className="w-4 h-4 text-amber-500" />
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">Keep Screen Awake</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Prevents screen from turning off while studying</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setFocusWakeLockEnabled(!focusWakeLockEnabled)}
                          className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                            focusWakeLockEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                            focusWakeLockEnabled ? 'right-1' : 'left-1'
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Footer removed per user request */}
          </div>
        </div>
      )}
    </>
  );
};
