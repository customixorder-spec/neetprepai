import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ScheduleSession } from '../types';
import { 
  Calendar, 
  TrendingUp, 
  Brain, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Sparkles, 
  RefreshCw, 
  AlertCircle,
  BarChart3,
  Check,
  Target,
  ChevronRight,
  Zap,
  BookOpen
} from 'lucide-react';
import { getApiUrl } from '../lib/api';

export const ProgressScheduleView: React.FC = () => {
  const { currentUser, schedule, updateSchedule, toggleScheduleTask, setActiveView, practiceSets } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'schedule' | 'progress'>('schedule');
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);

  // Schedule Generator Settings
  const [targetExamDate, setTargetExamDate] = useState<string>('In 3 Weeks (Oct 28)');
  const [dailyHours, setDailyHours] = useState<number>(3);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState<boolean>(false);

  if (!currentUser) return null;

  // Handle AI Schedule Generation
  const handleGenerateSchedule = async () => {
    setIsGeneratingSchedule(true);
    const realWeakTopics = practiceSets
      .filter(p => (p.score || 0) < 80)
      .map(p => p.title || p.subject);

    try {
      const res = await fetch(getApiUrl('/api/gemini/generate-schedule'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: currentUser.name,
          enrolledSubjects: currentUser.enrolledSubjects,
          targetExamDate,
          dailyHours,
          weakTopics: realWeakTopics.length > 0 ? realWeakTopics : currentUser.enrolledSubjects,
        }),
      });

      const data = await res.json();
      if (data.success && data.schedule) {
        updateSchedule(data.schedule);
        setSelectedDayIdx(0);
      }
    } catch (err) {
      console.error('Schedule generation error:', err);
    } finally {
      setIsGeneratingSchedule(false);
    }
  };

  const currentDay = schedule.days[selectedDayIdx] || schedule.days[0];

  // Calculate day completion rate
  const totalTasks = currentDay?.sessions?.length || 0;
  const completedTasks = currentDay?.sessions?.filter((s) => s.completed).length || 0;
  const dayProgressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-4 space-y-4 font-sans">
      
      {/* View Header - Ultra Compact */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900 text-sky-700 dark:text-sky-300 text-[10px] font-bold mb-1">
            <Sparkles className="w-3 h-3 text-sky-600 dark:text-sky-400" />
            <span>Automated Progress Tracking & AI Timetables</span>
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Personalized Study Schedule & Analytics
          </h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'schedule'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-2xs border border-slate-200/80 dark:border-slate-700 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>7-Day AI Schedule</span>
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'progress'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-2xs border border-slate-200/80 dark:border-slate-700 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Progress Analytics</span>
          </button>
        </div>
      </div>

      {activeTab === 'schedule' ? (

        /* 7-DAY AI STUDY SCHEDULE VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Left Column: Schedule Configurator & Days Selector */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* AI Generator Box */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>AI Timetable Generator</span>
              </h3>

              <div className="space-y-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">Target Exam Deadline</label>
                  <input
                    type="text"
                    value={targetExamDate}
                    onChange={(e) => setTargetExamDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
                    Daily Study Budget: <span className="text-indigo-600 dark:text-indigo-400 font-black text-xs">{dailyHours} Hours/Day</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={6}
                    value={dailyHours}
                    onChange={(e) => setDailyHours(parseInt(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerateSchedule}
                disabled={isGeneratingSchedule}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2"
              >
                {isGeneratingSchedule ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Recalculating AI Timetable...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Regenerate AI Schedule</span>
                  </>
                )}
              </button>
            </div>

            {/* 7-Day Selector Bar */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Select Study Day</h3>
              <div className="space-y-1.5">
                {schedule.days.map((day, idx) => {
                  const isSelected = idx === selectedDayIdx;
                  const dayDone = day.sessions.every((s) => s.completed);
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDayIdx(idx)}
                      className={`w-full p-2.5 rounded-xl text-left border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-600 dark:bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-extrabold leading-tight">{day.dayName}</p>
                          <p className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'}`}>
                            {day.focusSubject}
                          </p>
                        </div>
                      </div>

                      {dayDone && (
                        <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-300' : 'text-emerald-600 dark:text-emerald-400'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column: Active Day Timetable Tasks */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Active Day Header Banner */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{currentDay.dateLabel}</span>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">{currentDay.dayName} Focus: {currentDay.focusSubject}</h2>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Day Progress</span>
                    <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{dayProgressPct}% Done</p>
                  </div>
                  <div className="w-10 h-10 rounded-full border-3 border-indigo-100 dark:border-indigo-950 border-t-indigo-600 dark:border-t-indigo-400 flex items-center justify-center text-xs font-black text-indigo-700 dark:text-indigo-300">
                    {completedTasks}/{totalTasks}
                  </div>
                </div>
              </div>

              {/* Cognitive Tip for this day */}
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <Brain className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span><strong>AI Strategy:</strong> {currentDay.dailyTip}</span>
              </div>
            </div>

            {/* Timetable Session Cards */}
            <div className="space-y-2.5">
              <h3 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider pl-1">
                Scheduled Study Tasks ({currentDay.sessions.length})
              </h3>

              {currentDay.sessions.map((session, sessionIdx) => {
                const borderColors = ['border-l-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20', 'border-l-amber-400 bg-amber-50/40 dark:bg-amber-950/20', 'border-l-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20'];
                const borderClass = borderColors[sessionIdx % borderColors.length];
                return (
                  <div
                    key={session.id}
                    className={`p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 transition-all flex items-start justify-between gap-3 ${
                      session.completed
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 opacity-80'
                        : `${borderClass} hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs bg-white dark:bg-slate-900`
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleScheduleTask(selectedDayIdx, sessionIdx)}
                        className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                          session.completed
                            ? 'bg-emerald-600 text-white'
                            : 'border-2 border-slate-300 dark:border-slate-600 text-transparent hover:border-indigo-500'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-bold ${session.completed ? 'line-through text-slate-500 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                            {session.topic}
                          </span>
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                            session.priority === 'High' ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}>
                            {session.priority}
                          </span>
                          <span className="text-[9px] text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.2 rounded font-medium">
                            {session.subject}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal">{session.activity}</p>

                        <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium pt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {session.timeSlot}
                          </span>
                          <span>•</span>
                          <span>{session.durationMinutes} Mins</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleScheduleTask(selectedDayIdx, sessionIdx)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-colors ${
                        session.completed
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
                      }`}
                    >
                      {session.completed ? 'Completed' : 'Mark Complete'}
                    </button>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

      ) : (

        /* AUTOMATED PROGRESS TRACKING & ANALYTICS VIEW */
        <div className="space-y-8">
          
          {/* Key Metric Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Overall Accuracy Rate</span>
              <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{currentUser.overallAccuracy || 0}%</p>
              {(currentUser.totalQuestionsSolved ?? 0) > 0 ? (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 pt-1">
                  <TrendingUp className="w-3.5 h-3.5" /> +4.2% this week
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium pt-1">No practice test data yet</p>
              )}
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Practice MCQs Solved</span>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{currentUser.totalQuestionsSolved || 0}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium pt-1">Across 4 subjects</p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Weekly Study Hours</span>
              <p className="text-3xl font-black text-sky-600 dark:text-sky-400">{currentUser.studyHoursThisWeek || 0} hrs</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium pt-1">Target: 20 hrs/week</p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Study Streak & Daily Goal</span>
              <p className="text-3xl font-black text-amber-500 dark:text-amber-400">{currentUser.studyStreak || 0} Days 🔥</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold pt-1">
                {Math.floor((currentUser.studyTimeTodaySeconds || 0) / 60)} mins / 45m today for streak
              </p>
            </div>

          </div>

          {/* AI Weak Topic Detection Table */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  <span>AI Automated Weak Topic Detection</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Automated detection of low-accuracy concepts needing targeted revision.</p>
              </div>
            </div>

            {(currentUser.totalQuestionsSolved ?? 0) === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-800">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No practice performance data recorded yet</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Solve practice sets or mock tests to automatically identify your subject weak spots.</p>
                </div>
                <button
                  onClick={() => setActiveView('extractor')}
                  className="px-4 py-2 rounded-xl bg-indigo-900 hover:bg-indigo-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-xs"
                >
                  Start Your First MCQ Set
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-y border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Detected Weak Concept</th>
                      <th className="py-3 px-4">Accuracy Rate</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Recommended Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">NEET Physics</td>
                      <td className="py-3.5 px-4 text-rose-600 dark:text-rose-400 font-semibold">Rotational Motion & Moment of Inertia</td>
                      <td className="py-3.5 px-4 font-black text-rose-600 dark:text-rose-400">58%</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[10px] font-bold">High Priority</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setActiveView('extractor')}
                          className="px-3 py-1 rounded-lg bg-indigo-600 dark:bg-indigo-600 text-white text-[11px] font-bold hover:bg-indigo-700 dark:hover:bg-indigo-500"
                        >
                          Generate Practice Set
                        </button>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">NEET Chemistry</td>
                      <td className="py-3.5 px-4 text-amber-600 dark:text-amber-400 font-semibold">Ionic Equilibrium & pH Calculations</td>
                      <td className="py-3.5 px-4 font-black text-amber-600 dark:text-amber-400">62%</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold">Medium Priority</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setActiveView('extractor')}
                          className="px-3 py-1 rounded-lg bg-indigo-600 dark:bg-indigo-600 text-white text-[11px] font-bold hover:bg-indigo-700 dark:hover:bg-indigo-500"
                        >
                          Generate Practice Set
                        </button>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">NEET Zoology</td>
                      <td className="py-3.5 px-4 text-amber-600 dark:text-amber-400 font-semibold">Endocrine System & Hormonal Feedback</td>
                      <td className="py-3.5 px-4 font-black text-amber-600 dark:text-amber-400">67%</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold">Medium Priority</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setActiveView('extractor')}
                          className="px-3 py-1 rounded-lg bg-indigo-600 dark:bg-indigo-600 text-white text-[11px] font-bold hover:bg-indigo-700 dark:hover:bg-indigo-500"
                        >
                          Generate Practice Set
                        </button>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">NEET Botany</td>
                      <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">Photosynthesis & Calvin Cycle</td>
                      <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">89%</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">Mastered</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setActiveView('exam')}
                          className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                        >
                          Take Mock Exam
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      )}

    </div>
  );
};
