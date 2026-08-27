import { UserProfile, MCQPracticeSet, StudyScheduleData, StudentRecord, CohortAnalytics, UploadedPdfRecord } from './types';
import { AUTHENTIC_NEET_MOCK_PAPERS } from './data/neetMockPapers';

export const INITIAL_DEFAULT_PDFS: UploadedPdfRecord[] = [];

export const INITIAL_STUDENT_USER: UserProfile = {
  id: 'usr-student-1',
  name: 'Aarav Sharma',
  email: 'aarav.sharma@neet.edu.in',
  role: 'student',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
  enrolledSubjects: ['NEET Physics', 'NEET Chemistry', 'NEET Botany', 'NEET Zoology'],
  targetExams: [
    { name: 'NEET UG Official Entrance Exam', date: 'May 03', daysLeft: 42 }
  ],
  studyStreak: 0,
  overallAccuracy: 0,
  totalQuestionsSolved: 0,
  studyHoursThisWeek: 0
};

export const INITIAL_OWNER_USER: UserProfile = {
  id: 'usr-owner-1',
  name: 'Vaibhav Varshney',
  email: 'vaibhavvarshney.in@gmail.com',
  role: 'owner',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
  enrolledSubjects: ['NEET Physics', 'NEET Chemistry', 'NEET Biology (Botany & Zoology)'],
  targetExams: [],
  studyStreak: 0,
  overallAccuracy: 0,
  totalQuestionsSolved: 0,
  studyHoursThisWeek: 0
};

export const MOCK_PRACTICE_SETS: MCQPracticeSet[] = [];

export const INITIAL_SCHEDULE: StudyScheduleData = {
  overallStrategy: 'Welcome to your NEET Study Planner. Click "Generate AI Schedule" to automatically create a 7-day personalized timetable tailored to your subjects and target exam date.',
  weeklyGoals: [
    'Upload NCERT textbook PDFs or notes to extract practice MCQs',
    'Generate a personalized 7-day study schedule',
    'Complete your first NTA NEET pattern mock test'
  ],
  days: [
    {
      dayName: 'Monday',
      dateLabel: 'Day 1',
      focusSubject: 'NEET Biology',
      totalMinutes: 0,
      dailyTip: 'NCERT Gold Standard: Over 90% of NEET Biology questions are framed directly from NCERT lines.',
      sessions: []
    },
    {
      dayName: 'Tuesday',
      dateLabel: 'Day 2',
      focusSubject: 'NEET Chemistry',
      totalMinutes: 0,
      dailyTip: 'Named Reactions: Practice writing Aldol, Cannizzaro, and Reimer-Tiemann mechanisms by hand.',
      sessions: []
    },
    {
      dayName: 'Wednesday',
      dateLabel: 'Day 3',
      focusSubject: 'NEET Physics',
      totalMinutes: 0,
      dailyTip: 'Time Management: Target 45 Physics MCQs in 50 minutes.',
      sessions: []
    },
    {
      dayName: 'Thursday',
      dateLabel: 'Day 4',
      focusSubject: 'NEET Genetics',
      totalMinutes: 0,
      dailyTip: 'Pedigree Analysis: Practice sex-linked vs autosomal pedigree charts.',
      sessions: []
    },
    {
      dayName: 'Friday',
      dateLabel: 'Day 5',
      focusSubject: 'NEET Inorganic Chem',
      totalMinutes: 0,
      dailyTip: 'Read p-block and Coordination Compounds tables directly from NCERT.',
      sessions: []
    },
    {
      dayName: 'Saturday',
      dateLabel: 'Day 6',
      focusSubject: 'Full Mock Test Day',
      totalMinutes: 0,
      dailyTip: 'Simulate full NTA exam environment with +4/-1 scoring.',
      sessions: []
    },
    {
      dayName: 'Sunday',
      dateLabel: 'Day 7',
      focusSubject: 'Weekly Error Review',
      totalMinutes: 0,
      dailyTip: 'Reviewing incorrect answers builds retention twice as fast as re-reading notes.',
      sessions: []
    }
  ]
};

export const MOCK_STUDENTS_LIST: StudentRecord[] = [];

export const MOCK_COHORT_ANALYTICS: CohortAnalytics = {
  totalStudents: 0,
  activeStudentsToday: 0,
  averageAccuracy: 0,
  totalExamsGenerated: 0,
  pdfUploadsCount: 0,
  studyHoursLogged: 0,
  weakTopicsCohort: [],
  subjectPerformance: [
    { subject: 'NEET Zoology', avgScore: 0, activeStudents: 0 },
    { subject: 'NEET Botany', avgScore: 0, activeStudents: 0 },
    { subject: 'NEET Chemistry', avgScore: 0, activeStudents: 0 },
    { subject: 'NEET Physics', avgScore: 0, activeStudents: 0 }
  ],
  dailyUsageTrend: [
    { day: 'Mon', activeUsers: 0, practiceSetsSolved: 0 },
    { day: 'Tue', activeUsers: 0, practiceSetsSolved: 0 },
    { day: 'Wed', activeUsers: 0, practiceSetsSolved: 0 },
    { day: 'Thu', activeUsers: 0, practiceSetsSolved: 0 },
    { day: 'Fri', activeUsers: 0, practiceSetsSolved: 0 },
    { day: 'Sat', activeUsers: 0, practiceSetsSolved: 0 },
    { day: 'Sun', activeUsers: 0, practiceSetsSolved: 0 }
  ]
};


