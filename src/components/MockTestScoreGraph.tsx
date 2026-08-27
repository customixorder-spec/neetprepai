import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  Trophy, 
  TrendingUp, 
  BarChart2, 
  PieChart as PieChartIcon, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Award,
  Sparkles,
  Target
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export interface FullMockTestScore {
  id: string;
  testName: string;
  date: string;
  physicsScore: number;   // Max 180
  chemistryScore: number; // Max 180
  biologyScore: number;   // Max 360
  totalScore: number;     // Max 720
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  negativeMarks: number;
  accuracyPct: number;
  estimatedAir: string;
}

export const ZERO_MOCK_TEST_SCORES: FullMockTestScore[] = [
  {
    id: 'mock-0',
    testName: 'Baseline',
    date: 'No Tests Yet',
    physicsScore: 0,
    chemistryScore: 0,
    biologyScore: 0,
    totalScore: 0,
    correctCount: 0,
    incorrectCount: 0,
    unattemptedCount: 0,
    negativeMarks: 0,
    accuracyPct: 0,
    estimatedAir: 'N/A',
  },
];

export const MockTestScoreGraph: React.FC = () => {
  const { practiceSets, setActiveView } = useAuth();
  const [chartView, setChartView] = useState<'total' | 'subject' | 'accuracy'>('total');

  // Derive real chart scores from completed practice sets
  const userScores: FullMockTestScore[] = practiceSets.map((set, idx) => {
    const totalQ = set.questions?.length || 10;
    const scorePct = set.score || 80;
    const correctCount = Math.round((scorePct / 100) * totalQ);
    const incorrectCount = totalQ - correctCount;
    const scaledScore = Math.round((scorePct / 100) * 720);
    const estRank = scaledScore > 650 ? 'AIR < 1,000' : scaledScore > 550 ? 'AIR ~ 8,000' : 'AIR ~ 25,000';

    const isPhysics = (set.subject || '').toLowerCase().includes('physics');
    const isChem = (set.subject || '').toLowerCase().includes('chem');
    const isBio = (set.subject || '').toLowerCase().includes('botany') || (set.subject || '').toLowerCase().includes('zoo') || (set.subject || '').toLowerCase().includes('bio');

    return {
      id: set.id || `set-${idx}`,
      testName: set.title.length > 15 ? set.title.slice(0, 15) + '...' : set.title,
      date: `Set ${idx + 1}`,
      physicsScore: isPhysics ? Math.round((scorePct / 100) * 180) : Math.round(scaledScore * 0.25),
      chemistryScore: isChem ? Math.round((scorePct / 100) * 180) : Math.round(scaledScore * 0.25),
      biologyScore: isBio ? Math.round((scorePct / 100) * 360) : Math.round(scaledScore * 0.50),
      totalScore: scaledScore,
      correctCount,
      incorrectCount,
      unattemptedCount: 0,
      negativeMarks: incorrectCount,
      accuracyPct: scorePct,
      estimatedAir: estRank,
    };
  });

  const hasUserData = userScores.length > 0;
  const activeScores = hasUserData ? userScores : ZERO_MOCK_TEST_SCORES;
  const latestMock = activeScores[activeScores.length - 1];
  const bestScore = hasUserData ? Math.max(...activeScores.map((m) => m.totalScore)) : 0;

  // Breakdown data for the donut chart of questions
  const pieData = [
    { name: 'Correct (+4)', value: latestMock.correctCount, color: '#10b981' },
    { name: 'Incorrect (-1)', value: latestMock.incorrectCount, color: '#f43f5e' },
    { name: 'Unattempted (0)', value: latestMock.unattemptedCount, color: '#94a3b8' },
  ];

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
              <Trophy className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                NEET Practice Performance & Analytics
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {hasUserData ? `Tracking ${userScores.length} completed practice tests` : 'No practice test history recorded yet'}
              </p>
            </div>
          </div>
        </div>

        {/* Chart View Switcher */}
        <div className="flex flex-wrap items-center gap-1 shrink-0">
          <div className="flex items-center gap-0.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setChartView('total')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                chartView === 'total'
                  ? 'bg-indigo-600 dark:bg-indigo-600 text-white shadow-2xs font-extrabold'
                  : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              <span>Trend</span>
            </button>
            <button
              onClick={() => setChartView('subject')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                chartView === 'subject'
                  ? 'bg-indigo-600 dark:bg-indigo-600 text-white shadow-2xs font-extrabold'
                  : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <BarChart2 className="w-3 h-3" />
              <span>Subject</span>
            </button>
            <button
              onClick={() => setChartView('accuracy')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                chartView === 'accuracy'
                  ? 'bg-indigo-600 dark:bg-indigo-600 text-white shadow-2xs font-extrabold'
                  : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <PieChartIcon className="w-3 h-3" />
              <span>Accuracy</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800">
          <span className="block text-[10px] font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">
            Latest Score
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black text-indigo-950 dark:text-indigo-100">
              {hasUserData ? latestMock.totalScore : '--'}
            </span>
            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">/ 720</span>
          </div>
          <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 block mt-0.5">
            {hasUserData ? `${latestMock.accuracyPct}% accuracy` : 'No tests taken'}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800">
          <span className="block text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
            Highest Score
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black text-amber-950 dark:text-amber-100">
              {hasUserData ? bestScore : '--'}
            </span>
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">/ 720</span>
          </div>
          <span className="text-[10px] font-medium text-amber-800 dark:text-amber-300 mt-0.5 block">
            {hasUserData ? 'Personal Best' : 'No tests taken'}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800">
          <span className="block text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
            Predicted AIR
          </span>
          <div className="text-xl font-black text-emerald-950 dark:text-emerald-100 mt-0.5">
            {hasUserData ? latestMock.estimatedAir : 'No Data'}
          </div>
          <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 mt-0.5 block">
            {hasUserData ? 'Based on test results' : 'No tests taken'}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800">
          <span className="block text-[10px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
            Incorrect Qs
          </span>
          <div className="text-xl font-black text-rose-950 dark:text-rose-100 mt-0.5">
            {hasUserData ? `${latestMock.incorrectCount} Qs` : '--'}
          </div>
          <span className="text-[10px] font-medium text-rose-700 dark:text-rose-300 mt-0.5 block">
            {hasUserData ? `-${latestMock.negativeMarks} negative marks` : 'No tests taken'}
          </span>
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div className="h-[180px] w-full pt-1">
        {!hasUserData ? (
          <div className="h-full w-full rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-4 text-center space-y-2">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No Mock Test Performance Recorded Yet</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm">
              Attempt a practice set or full NTA mock exam to record your performance analytics here.
            </p>
            <button
              onClick={() => setActiveView('extractor')}
              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              Take First Practice Test
            </button>
          </div>
        ) : chartView === 'total' ? (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={activeScores} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="testName" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis domain={[0, 720]} stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderColor: '#334155', 
                  borderRadius: '10px', 
                  color: '#fff',
                  fontSize: '11px',
                  padding: '6px 10px'
                }}
                formatter={(value: any) => [`${value} / 720 Marks`, 'Total Score']}
              />
              <ReferenceLine y={650} label={{ value: 'Target 650', fill: '#f59e0b', fontSize: 9, position: 'insideTopRight' }} stroke="#f59e0b" strokeDasharray="3 3" />
              <Area 
                type="monotone" 
                dataKey="totalScore" 
                stroke="#4f46e5" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#scoreColor)" 
                activeDot={{ r: 5, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : chartView === 'subject' ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={activeScores} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="testName" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis domain={[0, 720]} stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderColor: '#334155', 
                  borderRadius: '10px', 
                  color: '#fff',
                  fontSize: '11px',
                  padding: '6px 10px'
                }} 
              />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
              <Bar dataKey="physicsScore" name="Physics (180)" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} />
              <Bar dataKey="chemistryScore" name="Chemistry (180)" stackId="a" fill="#0284c7" radius={[0, 0, 0, 0]} />
              <Bar dataKey="biologyScore" name="Biology (360)" stackId="a" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-around h-full gap-4">
            <div className="h-36 w-36 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#334155', 
                      borderRadius: '10px', 
                      color: '#fff',
                      fontSize: '11px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Detail side stats */}
            <div className="space-y-1.5 w-full max-w-xs">
              <h4 className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Breakdown ({latestMock.testName})
              </h4>

              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/70 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">Correct</span>
                </div>
                <span className="font-black text-emerald-700 dark:text-emerald-300">
                  {latestMock.correctCount}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200/70 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">Incorrect</span>
                </div>
                <span className="font-black text-rose-700 dark:text-rose-300">
                  {latestMock.incorrectCount}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Insight Banner */}
      <div className="p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-[11px] text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="line-clamp-1">
            <strong>User Data Status:</strong> {hasUserData 
              ? `Displaying performance analytics across your ${userScores.length} completed practice tests.`
              : "No test performance recorded yet. Complete a practice set to generate real performance insights."
            }
          </span>
        </div>
      </div>
    </div>
  );
};

