import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AIRecommendation } from '../types';
import { MockTestScoreGraph } from '../components/MockTestScoreGraph';
import { 
  Sparkles, 
  Flame, 
  Target, 
  Clock, 
  Brain, 
  FileText, 
  GraduationCap, 
  Calendar, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Zap,
  BookOpen,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { getApiUrl } from '../lib/api';

export const DashboardView: React.FC = () => {
  const { currentUser, practiceSets, setActiveView, setSelectedPracticeSet } = useAuth();

  const hasStudentData = Boolean(
    currentUser && (
      (currentUser.totalQuestionsSolved ?? 0) > 0 || 
      (currentUser.overallAccuracy ?? 0) > 0 || 
      practiceSets.length > 0
    )
  );

  const buildDataDrivenRecommendations = (): AIRecommendation[] => {
    if (!hasStudentData || !currentUser) return [];

    const totalQuestions = currentUser.totalQuestionsSolved || practiceSets.reduce((acc, p) => acc + (p.questions?.length || 0), 0);
    const accuracy = currentUser.overallAccuracy || Math.round(practiceSets.reduce((acc, p) => acc + (p.score || 0), 0) / (practiceSets.length || 1));

    const weakSets = practiceSets.filter(p => (p.score || 0) < 80);

    const recs: AIRecommendation[] = [];

    if (weakSets.length > 0) {
      weakSets.slice(0, 3).forEach((set, idx) => {
        recs.push({
          id: `rec-user-${idx}`,
          title: `Revision Drill: ${set.title}`,
          description: `Derived from your test score of ${set.score || 0}% in ${set.subject}.`,
          whatToDo: `Review incorrect questions and solutions for "${set.title}".`,
          howToDo: `Go through the detailed NCERT solution key for ${set.title} and re-solve missed MCQs.`,
          howMuch: `Review ${set.questions?.length || 10} questions and make notes of incorrect formulas/mechanisms.`,
          subject: set.subject || 'NEET Practice',
          priority: (set.score || 0) < 60 ? 'High' : 'Medium',
          estimatedMinutes: 20,
          actionType: 'extractor'
        });
      });
    } else {
      recs.push({
        id: 'rec-user-summary',
        title: `Performance Overview (${accuracy}% Accuracy across ${totalQuestions} Solved Qs)`,
        description: `Grounded in your ${practiceSets.length} completed practice sets.`,
        whatToDo: accuracy < 75 ? 'Focus on high-error NCERT chapters and concept re-reads.' : 'Maintain your momentum with full-length timed mock papers.',
        howToDo: 'Review your recent test answers and practice timed sets to build speed.',
        howMuch: 'Solve 1 set daily to maintain accuracy.',
        subject: 'Overall NEET Target',
        priority: accuracy < 75 ? 'High' : 'Medium',
        estimatedMinutes: 30,
        actionType: 'exam'
      });
    }

    return recs;
  };

  const [recommendations, setRecommendations] = useState<AIRecommendation[]>(() => buildDataDrivenRecommendations());
  const [dailyTip, setDailyTip] = useState<string>('NCERT Highlight Rule: 90%+ of NEET Biology questions come directly from NCERT textbook lines, diagrams, and tables.');
  const [focusMessage, setFocusMessage] = useState<string>('Welcome! Complete practice sets or mock tests to receive personalized recommendations based on your real performance.');
  const [isLoadingRecs, setIsLoadingRecs] = useState<boolean>(false);
  const [tipIndex, setTipIndex] = useState<number>(0);

  useEffect(() => {
    if (hasStudentData) {
      setRecommendations(buildDataDrivenRecommendations());
    } else {
      setRecommendations([]);
    }
  }, [currentUser?.totalQuestionsSolved, currentUser?.overallAccuracy, practiceSets.length]);

  const NEET_TIPS = [
    "NCERT Gold Standard: Over 90% of NEET Biology questions are framed directly from NCERT lines, diagrams, and tables.",
    "Physics Numerical Mastery: Always convert units to SI (meters, kilograms, seconds) before substituting into formulas to prevent calculation errors.",
    "Organic Chemistry Mechanisms: Practice writing Aldol, Cannizzaro, Esterification, and Reimer-Tiemann step-by-step reaction pathways by hand.",
    "Active Recall & Spaced Repetition: Reviewing incorrect mock test answers builds retention twice as fast as re-reading textbook notes.",
    "Mock Test Analysis: Spend twice as much time analyzing mistakes and unattempted questions as you did taking the 3-hour NTA mock.",
    "Genetics & Pedigree Charts: Master autosomal dominant, recessive, and X-linked inheritance patterns to solve complex pedigree MCQs in under 60 seconds.",
    "Inorganic Chemistry Block Wisdom: Read p-block, d-block, and Coordination Compounds periodic trends and exceptions directly from NCERT tables.",
    "Time Management Strategy: Target completing 45 Physics MCQs in 50 minutes, Chemistry in 45 minutes, and Biology in 45 minutes.",
    "Human Physiology Diagrams: Memorize every label in NCERT diagrams for Neural Control, Chemical Coordination, and Excretory System.",
    "Mole Concept & Stoichiometry: Practice limiting reagent and percentage purity calculations to gain speed in Physical Chemistry.",
    "Plant Physiology Cycles: Compare Calvin cycle (C3), C4 pathway, and Kranz anatomy differences meticulously.",
    "Electrostatics & Magnetism: Memorize Gauss's Law applications and Ampere's Circuital Law boundary conditions.",
    "Coordination Compounds: Practice Crystal Field Theory (CFT) splitting energy for octahedral and tetrahedral complexes.",
    "Plant Kingdom & Animal Kingdom: Create comparative tables for algae, bryophytes, pteridophytes, gymnosperms, and non-chordates.",
    "Optics Formulae: Keep a dedicated formula sheet for lens maker's formula, prism deviation, and Young's double slit interference.",
    "Ecology & Biodiversity: Memorize Alexander von Humboldt's species-area relationship equation (log S = log C + z log A).",
    "Chemical Bonding: Master VSEPR theory geometries, dipole moment vectors, and hybridisation states (sp, sp2, sp3, dsp2, d3sp).",
    "Current Electricity: Practice Kirchhoff's Junction and Loop rules with Wheatstone bridge circuit simplifications.",
    "Biomolecules Structure: Learn amino acid zwitterion forms, nucleotide purine/pyrimidine structures, and polysaccharide linkages.",
    "NTA Exam Temperament: Practice maintaining calm during difficult physics numerical blocks by skipping and returning later.",
    "Thermodynamics & Kinetic Theory: Master Carnot engine efficiency formulas and Maxwell-Boltzmann molecular speed distributions.",
    "Cell Cycle & Division: Differentiate clearly between mitosis and meiosis checkpoints, crossing over, and chiasmata formation stages.",
    "Periodic Table Trends: Remember anomalous electronic configurations and trends in electron gain enthalpy across transition series.",
    "Ray & Wave Optics: Differentiate Huygens' principle wavefronts from single slit diffraction angular width formulas.",
    "Biotechnology Principles: Memorize restriction endonuclease nomenclature, plasmid vector markers, and PCR thermal cycling steps."
  ];

  // Recommendations are loaded from default state or manually requested via button
  // to avoid automatic continuous server/AI calls

  const fetchAIRecommendations = async () => {
    if (!currentUser) return;

    if (!hasStudentData) {
      setFocusMessage('Please attempt at least one practice set or mock test to generate AI recommendations based on your real performance.');
      return;
    }

    setIsLoadingRecs(true);

    const realWeakTopics = practiceSets
      .filter(p => (p.score || 0) < 80)
      .map(p => p.title || p.subject);

    try {
      const res = await fetch(getApiUrl('/api/gemini/recommendations'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: currentUser.name,
          weakTopics: realWeakTopics.length > 0 ? realWeakTopics : [`Overall Accuracy: ${currentUser.overallAccuracy || 75}% across ${practiceSets.length} sets`],
          enrolledSubjects: currentUser.enrolledSubjects,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setRecommendations(data.data.recommendations || []);
        if (data.data.studyFocusMessage) setFocusMessage(data.data.studyFocusMessage);
      }
    } catch (err) {
      console.error('Recommendations error:', err);
    } finally {
      setIsLoadingRecs(false);
    }
  };

  if (!currentUser) return null;

  const getSubjectStats = (subjKey: string) => {
    const sets = practiceSets.filter(p => (p.subject || '').toLowerCase().includes(subjKey.toLowerCase()));
    if (sets.length === 0) return { score: 0, weakTopic: 'No test taken' };
    const avg = Math.round(sets.reduce((acc, s) => acc + (s.score || 0), 0) / sets.length);
    const lowestSet = [...sets].sort((a, b) => (a.score || 0) - (b.score || 0))[0];
    return { score: avg, weakTopic: lowestSet ? lowestSet.title : 'Active' };
  };

  const botanyStats = getSubjectStats('botany');
  const zoologyStats = getSubjectStats('zoology');
  const chemStats = getSubjectStats('chem');
  const physStats = getSubjectStats('phys');

  const subjectsWithStats = [
    { name: 'NEET Botany', score: botanyStats.score, weakTopic: botanyStats.weakTopic, icon: '🌱', color: 'from-emerald-500 to-teal-600' },
    { name: 'NEET Zoology', score: zoologyStats.score, weakTopic: zoologyStats.weakTopic, icon: '🧬', color: 'from-purple-500 to-indigo-600' },
    { name: 'NEET Chemistry', score: chemStats.score, weakTopic: chemStats.weakTopic, icon: '🧪', color: 'from-sky-500 to-blue-600' },
    { name: 'NEET Physics', score: physStats.score, weakTopic: physStats.weakTopic, icon: '⚡', color: 'from-amber-500 to-orange-600' },
  ];

  const testedSubjects = subjectsWithStats.filter(s => s.weakTopic !== 'No test taken');
  const avgScore = testedSubjects.length > 0 ? Math.round(testedSubjects.reduce((acc, sub) => acc + sub.score, 0) / testedSubjects.length) : 0;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-3 space-y-3 font-sans">
      
      {/* Top Welcome Header - Ultra-Compact Single Screen Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 p-3 sm:p-4 text-white shadow-xs">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white font-sans">
                  Welcome back, {currentUser.name.split(' ')[0]}!
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                  AI Active
                </span>
              </div>
              <p className="text-indigo-100 text-[11px] sm:text-xs max-w-xl leading-snug line-clamp-1">
                {focusMessage}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-xs border border-white/15 flex items-center gap-2 text-xs">
              <Flame className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
              <span className="font-extrabold">{currentUser.studyStreak || 0}d Streak</span>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-xs border border-white/15 flex items-center gap-2 text-xs">
              <Clock className="w-4 h-4 text-amber-300" />
              <span className="font-extrabold">{Math.floor((currentUser.studyTimeTodaySeconds || 0) / 60)}m Today</span>
            </div>

            <button
              onClick={() => setActiveView('extractor')}
              className="px-3.5 py-1.5 rounded-lg bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs shadow-2xs transition-all flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>Practice</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* Daily Cognitive Study Tip Banner - Single Line Compact */}
      <div className="p-2 px-3 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Brain className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="font-bold text-amber-800 dark:text-amber-300 shrink-0 uppercase tracking-wider text-[10px]">
            Tip:
          </span>
          <p className="text-slate-900 dark:text-slate-100 font-medium text-[11px] truncate">{dailyTip}</p>
        </div>
        <button
          onClick={() => {
            const nextIdx = (tipIndex + 1) % NEET_TIPS.length;
            setTipIndex(nextIdx);
            setDailyTip(NEET_TIPS[nextIdx]);
          }}
          title="Next Tip"
          className="p-1 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300 hover:bg-amber-500/30 transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Responsive 2-Column Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        
        {/* Left Column (7 cols): Mock Test Performance Graph + AI Focus Recommendations */}
        <div className="lg:col-span-7 space-y-3">
          
          {/* Mock Test Score Performance Graph (Ultra-compact) */}
          <MockTestScoreGraph />

          {/* AI Personalized Recommendations Section */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">AI Personal Focus Tasks</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Targeted revision tasks based on test error logs</p>
                </div>
              </div>

              <button
                onClick={fetchAIRecommendations}
                disabled={isLoadingRecs}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 text-indigo-600 dark:text-indigo-400 ${isLoadingRecs ? 'animate-spin' : ''}`} />
                <span>{isLoadingRecs ? 'Generating...' : 'Refresh'}</span>
              </button>
            </div>

            {isLoadingRecs ? (
              <div className="p-4 text-center space-y-1">
                <RefreshCw className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto" />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Analyzing performance and generating recommendations...</p>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                  <Target className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No User Performance Data Yet</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Recommendations are generated strictly from your actual test results and weak topics. Complete your first practice set or mock exam to generate personalized recommendations.
                </p>
                <button
                  onClick={() => setActiveView('extractor')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Start First Practice Set</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {recommendations.slice(0, 3).map((rec, i) => {
                  const borderColors = [
                    'border-l-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20', 
                    'border-l-amber-500 bg-amber-50/30 dark:bg-amber-950/20',
                    'border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                  ];
                  const borderClass = borderColors[i % borderColors.length];
                  return (
                    <div 
                      key={rec.id}
                      className={`p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 border-l-4 ${borderClass} space-y-2`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{rec.title}</span>
                          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                            rec.priority === 'High' ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          }`}>
                            {rec.priority}
                          </span>
                          <span className="text-[9px] text-slate-700 dark:text-slate-200 bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.2 rounded font-bold">
                            {rec.subject}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{rec.estimatedMinutes}m</span>
                          </span>
                          <button
                            onClick={() => setActiveView(rec.actionType)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-900 hover:bg-indigo-800 dark:bg-indigo-600 text-white font-bold text-[10px] transition-colors cursor-pointer"
                          >
                            Start
                          </button>
                        </div>
                      </div>

                      {rec.whatToDo && (
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-tight">
                          <strong className="text-indigo-700 dark:text-indigo-400 font-bold">Task:</strong> {rec.whatToDo}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Column (5 cols): Subject Performance Matrix + Recent Practice Sets */}
        <div className="lg:col-span-5 space-y-3">
          
          {/* Subject Stats Overview Matrix */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Subject Mastery Matrix</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Avg: {avgScore}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {subjectsWithStats.map((sub, sIdx) => (
                <div key={sIdx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <span>{sub.icon}</span>
                      <span className="truncate max-w-[80px]">{sub.name.replace('NEET ', '')}</span>
                    </span>
                    <span className="font-black text-indigo-600 dark:text-indigo-400">{sub.score}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all" 
                      style={{ width: `${Math.max(sub.score, 10)}%` }} 
                    />
                  </div>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
                    Focus: <span className="text-slate-700 dark:text-slate-300 font-semibold">{sub.weakTopic}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Practice Sets Completed */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Recent Practice Sets ({practiceSets.length})</span>
              </h3>
              <button 
                onClick={() => setActiveView('extractor')}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
              >
                <span>New</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {practiceSets.length > 0 ? (
              <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                {practiceSets.map((set, idx) => (
                  <div 
                    key={`${set.id}-${idx}`}
                    className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white truncate max-w-[140px]">{set.title}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {set.sourceType}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {set.subject} • {set.questions.length} Qs
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{set.score || 80}%</span>
                      <button 
                        onClick={() => {
                          setSelectedPracticeSet(set);
                          setActiveView('extractor');
                        }}
                        className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No practice sets extracted yet</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Upload NCERT textbook pages to extract interactive MCQs.</p>
                <button
                  onClick={() => setActiveView('extractor')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-900 hover:bg-indigo-800 dark:bg-indigo-600 text-white font-bold text-xs transition-colors shadow-2xs"
                >
                  Extract MCQ Set
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
