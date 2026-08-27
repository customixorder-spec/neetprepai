export type UserRole = 'student' | 'owner';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  enrolledSubjects: string[];
  targetExams: { name: string; date: string; daysLeft: number }[];
  studyStreak: number;
  overallAccuracy: number;
  totalQuestionsSolved: number;
  studyHoursThisWeek: number;
  studyTimeTodaySeconds?: number;
  lastStreakDate?: string;
}

export interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  hint: string;
  topic: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard' | string;
  userSelectedIndex?: number;
  isBookmarked?: boolean;
}

export interface MCQPracticeSet {
  id: string;
  title: string;
  subject: string;
  sourceType: 'PDF' | 'Image' | 'Text' | 'Generated';
  dateCreated: string;
  questions: MCQQuestion[];
  score?: number;
  completed?: boolean;
  userId?: string;
  userEmail?: string;
}

export interface UploadedPdfRecord {
  id: string;
  fileName: string;
  fileSize: string;
  uploadedByUserId: string;
  uploadedByName: string;
  uploadedByEmail: string;
  uploadedAt: string;
  subject: string;
  selectedChapters: string[];
  numQuestionsExtracted: number;
  snippetPreview?: string;
  status: 'Extracted' | 'Pending Review' | 'Archived';
  fullExamData?: MockExamPaper;
}

export interface ScheduleSession {
  id: string;
  timeSlot: string;
  subject: string;
  topic: string;
  activity: string;
  durationMinutes: number;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
}

export interface DaySchedule {
  dayName: string;
  dateLabel: string;
  focusSubject: string;
  totalMinutes: number;
  dailyTip: string;
  sessions: ScheduleSession[];
}

export interface StudyScheduleData {
  overallStrategy: string;
  weeklyGoals: string[];
  days: DaySchedule[];
}

export interface ExamQuestion {
  id: string;
  qNumber: number;
  topic: string;
  marks: number;
  questionText: string;
  codeSnippet?: string;
  options: string[];
  correctOptionIndex: number;
  detailedSolution: string;
  gradingCriteria?: string;
  userSelectedIndex?: number;
}

export interface MockExamPaper {
  id?: string;
  examTitle: string;
  subject: string;
  code: string;
  durationMinutes: number;
  totalMarks: number;
  instructions: string[];
  questions: ExamQuestion[];
  createdAt?: string;
  uploadedByEmail?: string;
  sourcePdfName?: string;
  isUserUploaded?: boolean;
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  whatToDo?: string;
  howToDo?: string;
  howMuch?: string;
  subject: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedMinutes: number;
  actionType: 'extractor' | 'exam' | 'schedule';
}

export interface StudentRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  enrolledSubjects: string[];
  status: 'Active' | 'Inactive' | 'Flagged';
  accuracyRate: number;
  testsCompleted: number;
  lastActive: string;
  joinDate: string;
}

export interface CohortAnalytics {
  totalStudents: number;
  activeStudentsToday: number;
  averageAccuracy: number;
  totalExamsGenerated: number;
  pdfUploadsCount: number;
  studyHoursLogged: number;
  weakTopicsCohort: { topic: string; subject: string; failureRate: number }[];
  subjectPerformance: { subject: string; avgScore: number; activeStudents: number }[];
  dailyUsageTrend: { day: string; activeUsers: number; practiceSetsSolved: number }[];
}
