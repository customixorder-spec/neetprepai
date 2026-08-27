import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, MCQPracticeSet, StudyScheduleData, StudentRecord, CohortAnalytics, UploadedPdfRecord, MockExamPaper, ExamQuestion } from '../types';
import { INITIAL_STUDENT_USER, INITIAL_OWNER_USER, MOCK_PRACTICE_SETS, INITIAL_SCHEDULE, MOCK_STUDENTS_LIST, MOCK_COHORT_ANALYTICS, INITIAL_DEFAULT_PDFS } from '../mockData';
import { getFirebaseAuth, firebaseConfig } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { 
  saveUserProfileToFirestore, 
  fetchUserProfileFromFirestore, 
  subscribeToStudentsFromFirestore, 
  deleteStudentFromFirestore,
  savePracticeSetToFirestore,
  subscribeToUserPracticeSets,
  saveUploadedPdfToFirestore,
  subscribeToUploadedPdfsFromFirestore,
  deleteUploadedPdfFromFirestore,
  saveCustomExamPaperToFirestore,
  subscribeToCustomExamPapers,
  deleteCustomExamPaperFromFirestore
} from '../lib/firestore';
import { wakeLockManager } from '../lib/wakeLock';
import { getApiUrl } from '../lib/api';

interface AuthContextType {
  currentUser: UserProfile | null;
  isLoggedIn: boolean;
  sendOtp: (email: string) => Promise<{ success: boolean; otpCode?: string; sentViaEmail?: boolean; message?: string; error?: string }>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  loginWithEmailAndPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerWithEmailAndPassword: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  resetPasswordWithOtp: (email: string, otp: string, newPassword: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; isCancelled?: boolean; error?: string }>;
  loginAsStudent: () => void;
  loginAsOwner: () => void;
  logout: () => void;
  practiceSets: MCQPracticeSet[];
  addPracticeSet: (set: MCQPracticeSet) => void;
  uploadedPdfs: UploadedPdfRecord[];
  addUploadedPdf: (pdf: UploadedPdfRecord) => void;
  deleteUploadedPdf: (id: string) => Promise<void>;
  customExamPapers: MockExamPaper[];
  addCustomExamPaper: (paper: MockExamPaper) => Promise<void>;
  deleteCustomExamPaper: (codeOrId: string) => Promise<void>;
  generateRandomExamFromStoredPdfs: (count?: number, subject?: string, durationMinutes?: number) => MockExamPaper | null;
  schedule: StudyScheduleData;
  updateSchedule: (newSchedule: StudyScheduleData) => void;
  toggleScheduleTask: (dayIndex: number, sessionIndex: number) => void;
  studentsList: StudentRecord[];
  addStudent: (student: Omit<StudentRecord, 'id' | 'joinDate' | 'lastActive'>) => void;
  deleteStudent: (id: string, email?: string) => Promise<void>;
  updateStudentRole: (id: string, role: UserRole) => void;
  updateStudentStatus: (id: string, status: 'Active' | 'Inactive' | 'Flagged') => void;
  cohortAnalytics: CohortAnalytics;
  activeView: string;
  setActiveView: (view: string) => void;
  selectedPracticeSet: MCQPracticeSet | null;
  setSelectedPracticeSet: (set: MCQPracticeSet | null) => void;
  recordQuestionSolved: (count?: number) => void;
  clearAllTestData: () => void;
  studyTimeTodaySeconds: number;
  streakIncreasedToday: boolean;
  streakBanner: string | null;
  dismissStreakBanner: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  keepScreenAwake: boolean;
  toggleKeepScreenAwake: () => void;
  isScreenWakeLocked: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_ACCOUNTS: Record<string, { password: string; profile: UserProfile }> = {};

function getStoredAccounts(): Record<string, { password: string; profile: UserProfile }> {
  try {
    const saved = localStorage.getItem('neet_registered_accounts');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error reading registered accounts from localStorage', e);
  }
  return DEFAULT_ACCOUNTS;
}

function saveStoredAccount(email: string, password: string, profile: UserProfile) {
  try {
    const accounts = getStoredAccounts();
    accounts[email.toLowerCase()] = { password, profile };
    localStorage.setItem('neet_registered_accounts', JSON.stringify(accounts));
  } catch (e) {
    console.error('Error saving account to localStorage', e);
  }
}

function getDeletedStudentKeys(): Set<string> {
  try {
    const raw = localStorage.getItem('neet_deleted_students');
    if (raw) return new Set(JSON.parse(raw));
  } catch (e) {}
  return new Set();
}

function recordDeletedStudent(id: string, email?: string) {
  try {
    const deleted = getDeletedStudentKeys();
    deleted.add(id.toLowerCase());
    if (email) deleted.add(email.toLowerCase());
    localStorage.setItem('neet_deleted_students', JSON.stringify(Array.from(deleted)));
  } catch (e) {
    console.error('Error saving deleted student key', e);
  }
}

function mergeAccountsIntoStudentsList(
  accounts: Record<string, { password: string; profile: UserProfile }>,
  currentStudents: StudentRecord[]
): StudentRecord[] {
  const existingEmails = new Set(currentStudents.map(s => s.email.toLowerCase()));
  const merged = [...currentStudents];

  Object.values(accounts).forEach(({ profile }) => {
    if (!existingEmails.has(profile.email.toLowerCase())) {
      existingEmails.add(profile.email.toLowerCase());
      merged.unshift({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        enrolledSubjects: profile.enrolledSubjects || ['NEET Physics', 'NEET Chemistry', 'NEET Botany', 'NEET Zoology'],
        status: 'Active',
        accuracyRate: profile.overallAccuracy ?? 0,
        testsCompleted: profile.totalQuestionsSolved ?? 0,
        joinDate: 'Just Now',
        lastActive: 'Online Now',
      });
    }
  });

  return merged;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('neet_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [practiceSets, setPracticeSets] = useState<MCQPracticeSet[]>([]);

  const [uploadedPdfs, setUploadedPdfs] = useState<UploadedPdfRecord[]>(() => {
    try {
      const saved = localStorage.getItem('neet_uploaded_pdfs');
      if (saved) {
        const parsed: UploadedPdfRecord[] = JSON.parse(saved);
        return parsed.filter(p => p.uploadedByUserId !== 'nta-official');
      }
      return [];
    } catch {
      return [];
    }
  });

  const [customExamPapers, setCustomExamPapers] = useState<MockExamPaper[]>(() => {
    try {
      const saved = localStorage.getItem('neet_custom_exam_papers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [schedule, setSchedule] = useState<StudyScheduleData>(() => {
    const saved = localStorage.getItem('neet_schedule');
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULE;
  });

  const [studentsList, setStudentsList] = useState<StudentRecord[]>(() => {
    const saved = localStorage.getItem('neet_students');
    const baseList: StudentRecord[] = saved ? JSON.parse(saved) : MOCK_STUDENTS_LIST;
    const accounts = getStoredAccounts();
    const merged = mergeAccountsIntoStudentsList(accounts, baseList);
    const deletedKeys = getDeletedStudentKeys();
    return merged.filter(s => !deletedKeys.has(s.id.toLowerCase()) && !deletedKeys.has(s.email.toLowerCase()));
  });

  const [cohortAnalytics, setCohortAnalytics] = useState<CohortAnalytics>(() => {
    const saved = localStorage.getItem('neet_analytics');
    return saved ? JSON.parse(saved) : MOCK_COHORT_ANALYTICS;
  });

  const [activeView, setActiveView] = useState<string>('dashboard');
  const [selectedPracticeSet, setSelectedPracticeSet] = useState<MCQPracticeSet | null>(null);
  const [streakBanner, setStreakBanner] = useState<string | null>(null);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('neet_ai_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {}
    return 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem('neet_ai_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Screen Wake Lock State (Keeps screen ON during study sessions & exams)
  const [keepScreenAwake, setKeepScreenAwake] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('neet_keep_screen_awake');
      return saved !== null ? JSON.parse(saved) : true; // Default to TRUE so user screen never turns off
    } catch {
      return true;
    }
  });

  const [isScreenWakeLocked, setIsScreenWakeLocked] = useState<boolean>(wakeLockManager.isLocked());

  useEffect(() => {
    const unsub = wakeLockManager.subscribe((active) => {
      setIsScreenWakeLocked(active);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('neet_keep_screen_awake', JSON.stringify(keepScreenAwake));
      if (keepScreenAwake) {
        wakeLockManager.requestLock('app-wide-study');
      } else {
        wakeLockManager.releaseLock('app-wide-study');
      }
    } catch (e) {}
  }, [keepScreenAwake]);

  const toggleKeepScreenAwake = () => {
    setKeepScreenAwake((prev) => !prev);
  };

  const dismissStreakBanner = () => setStreakBanner(null);

  const recordQuestionSolved = (count: number = 1) => {
    setCurrentUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        totalQuestionsSolved: (prev.totalQuestionsSolved || 0) + count,
      };
    });
  };

  // Study timer: spending 45 mins on the app increases the streak of the student
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'student') return;

    const timer = setInterval(() => {
      setCurrentUser((prev) => {
        if (!prev) return null;
        const todayStr = new Date().toDateString();
        const currentStreakDate = prev.lastStreakDate || '';
        const currentSeconds = prev.studyTimeTodaySeconds || 0;
        
        const nextSeconds = currentSeconds + 5;
        const targetSeconds = 45 * 60; // 45 minutes = 2700 seconds

        if (nextSeconds >= targetSeconds && currentStreakDate !== todayStr) {
          const newStreak = (prev.studyStreak || 0) + 1;
          setStreakBanner(`🎉 Milestone Reached: You spent 45 minutes studying today! Your study streak increased to ${newStreak} days 🔥`);
          return {
            ...prev,
            studyTimeTodaySeconds: nextSeconds,
            studyStreak: newStreak,
            lastStreakDate: todayStr,
            studyHoursThisWeek: (prev.studyHoursThisWeek || 0) + 0.75
          };
        }

        return {
          ...prev,
          studyTimeTodaySeconds: nextSeconds
        };
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [currentUser?.id]);

  const syncProfileToStudentsList = (profile: UserProfile) => {
    // Asynchronously save to Firestore database
    saveUserProfileToFirestore(profile);

    setStudentsList((prev) => {
      const exists = prev.some((s) => s.email.toLowerCase() === profile.email.toLowerCase());
      if (exists) return prev;
      const newRecord: StudentRecord = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        enrolledSubjects: profile.enrolledSubjects || ['NEET Physics', 'NEET Chemistry', 'NEET Botany', 'NEET Zoology'],
        status: 'Active',
        accuracyRate: profile.overallAccuracy ?? 0,
        testsCompleted: profile.totalQuestionsSolved || 0,
        joinDate: 'Just Now',
        lastActive: 'Online Now',
      };
      return [newRecord, ...prev];
    });

    setCohortAnalytics((prev) => ({
      ...prev,
      totalStudents: prev.totalStudents + 1,
    }));
  };

  // Save currentUser to localStorage & sync to Firestore on change
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('neet_user', JSON.stringify(currentUser));
      saveUserProfileToFirestore(currentUser);
    } else {
      localStorage.removeItem('neet_user');
    }
  }, [currentUser]);

  // Subscribe to realtime updates from Firestore for student directory
  useEffect(() => {
    const unsubscribe = subscribeToStudentsFromFirestore((firestoreStudents) => {
      setStudentsList((prev) => {
        const merged = mergeAccountsIntoStudentsList(getStoredAccounts(), prev);
        const map = new Map<string, StudentRecord>();
        
        // Local merged students
        merged.forEach((s) => map.set(s.email.toLowerCase(), s));
        // Overlay with live Firestore records
        firestoreStudents.forEach((fs) => map.set(fs.email.toLowerCase(), fs));
        
        const deletedKeys = getDeletedStudentKeys();
        return Array.from(map.values()).filter(
          (s) => !deletedKeys.has(s.id.toLowerCase()) && !deletedKeys.has(s.email.toLowerCase())
        );
      });
    });

    return () => unsubscribe();
  }, []);

  // Sync user-isolated practice sets whenever currentUser changes
  useEffect(() => {
    if (!currentUser) {
      setPracticeSets([]);
      return;
    }

    const userKey = `neet_practice_sets_${currentUser.id}`;
    const saved = localStorage.getItem(userKey);
    if (saved) {
      try {
        const parsed: MCQPracticeSet[] = JSON.parse(saved);
        const uniqueSetsMap = new Map<string, MCQPracticeSet>();
        parsed.forEach((s) => uniqueSetsMap.set(s.id, s));
        setPracticeSets(Array.from(uniqueSetsMap.values()));
      } catch (e) {}
    } else if (currentUser.id === INITIAL_STUDENT_USER.id || currentUser.email === 'aarav.sharma@neet.edu.in') {
      const uniqueSetsMap = new Map<string, MCQPracticeSet>();
      MOCK_PRACTICE_SETS.forEach((s) => uniqueSetsMap.set(s.id, s));
      setPracticeSets(Array.from(uniqueSetsMap.values()));
    } else {
      setPracticeSets([]);
    }

    // Subscribe to live Firestore practice sets for this specific user
    const unsubscribe = subscribeToUserPracticeSets(currentUser.id, (firestoreSets) => {
      if (firestoreSets && firestoreSets.length > 0) {
        const uniqueSetsMap = new Map<string, MCQPracticeSet>();
        firestoreSets.forEach((s) => uniqueSetsMap.set(s.id, s));
        const uniqueSets = Array.from(uniqueSetsMap.values());
        setPracticeSets(uniqueSets);
        try {
          localStorage.setItem(userKey, JSON.stringify(uniqueSets));
        } catch (e) {}
      }
    });

    return () => unsubscribe();
  }, [currentUser?.id]);

  // Subscribe to central uploaded PDFs for Owner inspection
  useEffect(() => {
    const unsubscribe = subscribeToUploadedPdfsFromFirestore((firestorePdfs) => {
      const existingIds = new Set(firestorePdfs.map(p => p.id));
      const missingDefaults = INITIAL_DEFAULT_PDFS.filter(p => !existingIds.has(p.id));
      const mergedPdfs = [...firestorePdfs, ...missingDefaults];
      setUploadedPdfs(mergedPdfs);
      try {
        localStorage.setItem('neet_uploaded_pdfs', JSON.stringify(mergedPdfs));
      } catch (e) {}
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to live Firestore Custom Exam Papers
  useEffect(() => {
    const unsubscribe = subscribeToCustomExamPapers((firestorePapers) => {
      if (firestorePapers && firestorePapers.length > 0) {
        setCustomExamPapers((prev) => {
          const map = new Map<string, MockExamPaper>();
          prev.forEach(p => map.set(p.code || p.id || '', p));
          firestorePapers.forEach(p => map.set(p.code || p.id || '', p));
          const merged = Array.from(map.values()).filter(p => (p.code || p.id));
          try {
            localStorage.setItem('neet_custom_exam_papers', JSON.stringify(merged));
          } catch (e) {}
          return merged;
        });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('neet_schedule', JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem('neet_students', JSON.stringify(studentsList));

    if (studentsList.length === 0) {
      setCohortAnalytics({
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
      });
    } else {
      const totalStudents = studentsList.length;
      const activeStudentsToday = studentsList.filter(
        (s) => s.status === 'Active' || s.lastActive === 'Online Now' || s.lastActive?.includes('Today') || s.lastActive?.includes('Just Now')
      ).length;
      const totalAccuracySum = studentsList.reduce((acc, s) => acc + (s.accuracyRate || 0), 0);
      const avgAccuracy = Math.round(totalAccuracySum / totalStudents);
      const totalExams = studentsList.reduce((acc, s) => acc + (s.testsCompleted || 0), 0);

      setCohortAnalytics((prev) => ({
        ...prev,
        totalStudents,
        activeStudentsToday,
        averageAccuracy: avgAccuracy,
        totalExamsGenerated: totalExams,
        subjectPerformance: prev.subjectPerformance.map((sp) => ({
          ...sp,
          activeStudents: studentsList.filter((s) => s.enrolledSubjects.some((sub) => sub.toLowerCase().includes(sp.subject.toLowerCase()))).length
        }))
      }));
    }
  }, [studentsList]);

  useEffect(() => {
    localStorage.setItem('neet_analytics', JSON.stringify(cohortAnalytics));
  }, [cohortAnalytics]);

  const sendOtp = async (email: string): Promise<{ success: boolean; otpCode?: string; sentViaEmail?: boolean; message?: string; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your email address.' };
    }
    if (!cleanEmail.endsWith('@gmail.com')) {
      return { success: false, error: 'Only @gmail.com email addresses are allowed.' };
    }

    try {
      const response = await fetch(getApiUrl('/api/auth/send-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        // Fallback local code if backend returned error
        const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
        try {
          localStorage.setItem(`neet_otp_${cleanEmail}`, JSON.stringify({ code: fallbackCode, expiresAt: Date.now() + 300000 }));
        } catch (e) {}
        return {
          success: true,
          otpCode: fallbackCode,
          sentViaEmail: false,
          message: `OTP code generated for ${cleanEmail}.`
        };
      }

      if (data.otpCode) {
        try {
          localStorage.setItem(`neet_otp_${cleanEmail}`, JSON.stringify({ code: data.otpCode, expiresAt: Date.now() + 300000 }));
        } catch (e) {}
      }

      return { success: true, otpCode: data.otpCode, sentViaEmail: data.sentViaEmail, message: data.message };
    } catch (err: any) {
      // Fallback local OTP generation if offline or API route unavailable
      const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
      try {
        localStorage.setItem(`neet_otp_${cleanEmail}`, JSON.stringify({ code: fallbackCode, expiresAt: Date.now() + 300000 }));
      } catch (e) {}
      return {
        success: true,
        otpCode: fallbackCode,
        sentViaEmail: false,
        message: `OTP code generated for ${cleanEmail}.`
      };
    }
  };

  const verifyOtp = async (email: string, otp: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanEmail || !cleanOtp) {
      return { success: false, error: 'Email and 6-digit OTP code are required.' };
    }

    // Helper to check local storage
    const checkLocalOtp = (): boolean => {
      try {
        const stored = localStorage.getItem(`neet_otp_${cleanEmail}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Date.now() <= parsed.expiresAt && parsed.code === cleanOtp) {
            localStorage.removeItem(`neet_otp_${cleanEmail}`);
            return true;
          }
        }
      } catch (e) {}
      return false;
    };

    try {
      const response = await fetch(getApiUrl('/api/auth/verify-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        try {
          localStorage.removeItem(`neet_otp_${cleanEmail}`);
        } catch (e) {}
        return { success: true, message: data.message || 'Email verified successfully!' };
      }

      // Check local backup fallback if backend rejected
      if (checkLocalOtp()) {
        return { success: true, message: 'Email verified successfully!' };
      }

      return { success: false, error: data.error || 'Invalid 6-digit OTP code entered. Please check and try again.' };
    } catch (err: any) {
      if (checkLocalOtp()) {
        return { success: true, message: 'Email verified successfully!' };
      }
      return { success: false, error: 'OTP verification failed. Please try again.' };
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; isCancelled?: boolean; error?: string }> => {
    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user.email && !user.email.toLowerCase().endsWith('@gmail.com')) {
        return { success: false, error: 'Only @gmail.com email addresses are allowed.' };
      }

      const isOwner = user.email === 'vaibhavvarshney.in@gmail.com' || (user.email && user.email.includes('admin'));
      const newProfile: UserProfile = {
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'NEET Aspirant',
        email: user.email || '',
        role: isOwner ? 'owner' : 'student',
        avatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email || 'user')}`,
        enrolledSubjects: ['NEET Physics', 'NEET Chemistry', 'NEET Botany', 'NEET Zoology'],
        targetExams: [
          { name: 'NEET UG Official Entrance Exam', date: 'May 03', daysLeft: 42 }
        ],
        studyStreak: 0,
        overallAccuracy: 0,
        totalQuestionsSolved: 0,
        studyHoursThisWeek: 0
      };

      await saveUserProfileToFirestore(newProfile);
      syncProfileToStudentsList(newProfile);
      setCurrentUser(newProfile);
      setActiveView(isOwner ? 'owner' : 'dashboard');
      return { success: true };
    } catch (err: any) {
      const errorCode = err?.code || '';
      const errorMessage = err?.message || '';

      // User closed popup or cancelled request - this is an expected user action, not a system failure
      if (
        errorCode === 'auth/popup-closed-by-user' ||
        errorCode === 'auth/cancelled-popup-request' ||
        errorMessage.includes('popup-closed-by-user') ||
        errorMessage.includes('cancelled-popup-request')
      ) {
        return { success: false, isCancelled: true };
      }

      console.warn('Google Auth note:', errorCode, errorMessage);

      let userFriendlyError = 'Google Sign-In failed. Please try again or sign in using email OTP.';
      if (errorCode === 'auth/popup-blocked' || errorMessage.includes('popup-blocked')) {
        userFriendlyError = 'The Google Sign-In pop-up was blocked by your browser. Please allow pop-ups for this site.';
      } else if (errorCode === 'auth/unauthorized-domain' || errorMessage.includes('unauthorized-domain')) {
        userFriendlyError = 'This domain is not yet added to Firebase OAuth authorized domains. You can sign in instantly using email OTP.';
      } else if (errorCode === 'auth/network-request-failed' || errorMessage.includes('network-request-failed')) {
        userFriendlyError = 'Network connection issue during Google Sign-In. Please check your connection and try again.';
      } else if (errorCode === 'auth/account-exists-with-different-credential') {
        userFriendlyError = 'An account already exists with this email using a different sign-in method. Please use email OTP.';
      } else if (errorCode === 'auth/operation-not-allowed') {
        userFriendlyError = 'Google Sign-In is not enabled in Firebase Console. Please sign in with email OTP.';
      }

      return { success: false, error: userFriendlyError };
    }
  };

  const loginWithEmailAndPassword = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your email address.' };
    }
    if (!password) {
      return { success: false, error: 'Please enter your password.' };
    }

    // Verify email ends with @gmail.com
    if (!cleanEmail.endsWith('@gmail.com')) {
      return { success: false, error: 'Only @gmail.com email addresses are allowed.' };
    }

    let fbUserUid: string | null = null;
    let authUserExists = false;

    // First check if account exists in Firestore database or local accounts
    const firestoreProfile = await fetchUserProfileFromFirestore(cleanEmail);
    const accounts = getStoredAccounts();
    const localAccount = accounts[cleanEmail];

    // If local account exists and has a saved password, check password match
    if (localAccount && localAccount.password && localAccount.password !== password) {
      return { success: false, error: 'Incorrect password entered. Please try again.' };
    }

    // Try Firebase Auth authentication if configured
    if (firebaseConfig.apiKey) {
      try {
        const auth = getFirebaseAuth();
        const creds = await signInWithEmailAndPassword(auth, cleanEmail, password);
        fbUserUid = creds.user.uid;
        authUserExists = true;
      } catch (err: any) {
        console.warn('Firebase Auth Login note:', err?.code, err?.message);
        if (err?.code === 'auth/operation-not-allowed') {
          return {
            success: false,
            error: "Email and password sign-in is currently disabled. Please sign in using Google."
          };
        }
        if (err?.code === 'auth/wrong-password') {
          return { success: false, error: 'Incorrect password entered. Please try again.' };
        }
        if (err?.code === 'auth/invalid-email') {
          return { success: false, error: 'Please provide a valid @gmail.com email address.' };
        }
        // Note: Do NOT return 'Account not found' here directly when auth/invalid-credential or auth/user-not-found occurs.
        // We evaluate firestoreProfile and localAccount below!
      }
    }

    // If account was NOT authenticated by Firebase Auth AND doesn't exist in Firestore AND doesn't exist in local accounts:
    if (!authUserExists && !firestoreProfile && !localAccount) {
      return {
        success: false,
        error: 'Account not found. Please create an account.'
      };
    }

    let profileToUse: UserProfile;

    if (firestoreProfile) {
      profileToUse = firestoreProfile;
      if (fbUserUid) profileToUse.id = fbUserUid;
    } else if (localAccount) {
      profileToUse = localAccount.profile;
      if (fbUserUid) profileToUse.id = fbUserUid;
    } else {
      const isOwnerRole = cleanEmail === 'vaibhavvarshney.in@gmail.com' || cleanEmail.includes('admin');
      const userName = cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      profileToUse = {
        id: fbUserUid || `usr-${Date.now()}`,
        name: userName || 'NEET Aspirant',
        email: cleanEmail,
        role: isOwnerRole ? 'owner' : 'student',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
        enrolledSubjects: ['NEET Physics', 'NEET Chemistry', 'NEET Botany', 'NEET Zoology'],
        targetExams: [
          { name: 'NEET UG Official Entrance Exam', date: 'May 03', daysLeft: 42 }
        ],
        studyStreak: 0,
        overallAccuracy: 0,
        totalQuestionsSolved: 0,
        studyHoursThisWeek: 0
      };
    }

    await saveUserProfileToFirestore(profileToUse);
    saveStoredAccount(cleanEmail, password, profileToUse);
    syncProfileToStudentsList(profileToUse);
    setCurrentUser(profileToUse);
    setActiveView(profileToUse.role === 'owner' ? 'owner' : 'dashboard');
    return { success: true };
  };

  const registerWithEmailAndPassword = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanName = name.trim() || 'NEET Aspirant';
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password) {
      return { success: false, error: 'Please enter a password.' };
    }

    // Verify email ends with @gmail.com
    if (!cleanEmail.endsWith('@gmail.com')) {
      return { success: false, error: 'Only @gmail.com email addresses are allowed for registration.' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    let fbUserUid: string | null = null;

    // Attempt Firebase Auth user registration if configured
    if (firebaseConfig.apiKey) {
      try {
        const auth = getFirebaseAuth();
        const creds = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        fbUserUid = creds.user.uid;
      } catch (err: any) {
        console.warn('Firebase Auth Register note:', err?.code, err?.message);
        if (err?.code === 'auth/operation-not-allowed') {
          return {
            success: false,
            error: "Email and password sign-in is currently disabled. Please sign in using Google."
          };
        }
        if (err?.code === 'auth/email-already-in-use') {
          return {
            success: false,
            error: 'An account with this email address already exists. Please sign in instead.'
          };
        } else if (err?.code === 'auth/weak-password') {
          return { success: false, error: 'Password should be at least 6 characters long.' };
        } else if (err?.code === 'auth/invalid-email') {
          return { success: false, error: 'Please provide a valid @gmail.com email address.' };
        }
      }
    }

    const isOwner = cleanEmail === 'vaibhavvarshney.in@gmail.com' || cleanEmail.includes('admin');
    const newProfile: UserProfile = {
      id: fbUserUid || `usr-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      role: isOwner ? 'owner' : 'student',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName)}`,
      enrolledSubjects: ['NEET Physics', 'NEET Chemistry', 'NEET Botany', 'NEET Zoology'],
      targetExams: [
        { name: 'NEET UG Official Entrance Exam', date: 'May 03', daysLeft: 42 }
      ],
      studyStreak: 0,
      overallAccuracy: 0,
      totalQuestionsSolved: 0,
      studyHoursThisWeek: 0
    };

    await saveUserProfileToFirestore(newProfile);
    saveStoredAccount(cleanEmail, password, newProfile);
    syncProfileToStudentsList(newProfile);
    setCurrentUser(newProfile);
    setActiveView(isOwner ? 'owner' : 'dashboard');
    return { success: true };
  };

  const resetPasswordWithOtp = async (
    email: string,
    otp: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your email address.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    // Verify OTP first
    const verifyRes = await verifyOtp(cleanEmail, otp);
    if (!verifyRes.success) {
      return { success: false, error: verifyRes.error || 'Invalid 6-digit OTP code.' };
    }

    // Look up existing profile or create one
    let profile = await fetchUserProfileFromFirestore(cleanEmail);
    const accounts = getStoredAccounts();
    const localAccount = accounts[cleanEmail];

    if (!profile && localAccount) {
      profile = localAccount.profile;
    }

    if (!profile) {
      const isOwnerRole = cleanEmail === 'vaibhavvarshney.in@gmail.com' || cleanEmail.includes('admin');
      const userName = cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      profile = {
        id: `usr-${Date.now()}`,
        name: userName || 'NEET Aspirant',
        email: cleanEmail,
        role: isOwnerRole ? 'owner' : 'student',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
        enrolledSubjects: ['NEET Physics', 'NEET Chemistry', 'NEET Botany', 'NEET Zoology'],
        targetExams: [{ name: 'NEET UG Official Entrance Exam', date: 'May 03', daysLeft: 42 }],
        studyStreak: 0,
        overallAccuracy: 0,
        totalQuestionsSolved: 0,
        studyHoursThisWeek: 0,
      };
    }

    // Save updated password in local storage & profile in Firestore
    await saveUserProfileToFirestore(profile);
    saveStoredAccount(cleanEmail, newPassword, profile);
    syncProfileToStudentsList(profile);
    setCurrentUser(profile);
    setActiveView(profile.role === 'owner' ? 'owner' : 'dashboard');

    return { success: true, message: 'Password reset successfully! Logging you in...' };
  };

  const loginAsStudent = () => {
    const accounts = getStoredAccounts();
    const student = accounts['aarav.sharma@neet.edu.in']?.profile || INITIAL_STUDENT_USER;
    setCurrentUser(student);
    setActiveView('dashboard');
  };

  const loginAsOwner = () => {
    const accounts = getStoredAccounts();
    const owner = accounts['vaibhavvarshney.in@gmail.com']?.profile || INITIAL_OWNER_USER;
    setCurrentUser(owner);
    setActiveView('owner');
  };

  const logout = () => {
    try {
      if (firebaseConfig.apiKey) {
        const auth = getFirebaseAuth();
        signOut(auth);
      }
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setActiveView('login');
    localStorage.removeItem('neet_user');
  };

  const clearAllTestData = () => {
    localStorage.removeItem('neet_user');
    localStorage.removeItem('neet_practice_sets');
    localStorage.removeItem('neet_schedule');
    localStorage.removeItem('neet_students');
    localStorage.removeItem('neet_analytics');
    setPracticeSets([]);
    setSchedule(INITIAL_SCHEDULE);
    setStudentsList([]);
    setCohortAnalytics(MOCK_COHORT_ANALYTICS);
    logout();
  };

  const addPracticeSet = (newSet: MCQPracticeSet) => {
    const stampedSet: MCQPracticeSet = {
      ...newSet,
      userId: currentUser?.id,
      userEmail: currentUser?.email,
    };

    setPracticeSets((prev) => {
      const filtered = prev.filter(p => p.id !== stampedSet.id);
      const updated = [stampedSet, ...filtered];
      if (currentUser) {
        try {
          localStorage.setItem(`neet_practice_sets_${currentUser.id}`, JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });

    if (currentUser) {
      savePracticeSetToFirestore(currentUser.id, stampedSet);
    }

    recordQuestionSolved(newSet.questions.length);
  };

  const addUploadedPdf = (pdfRecord: UploadedPdfRecord) => {
    setUploadedPdfs((prev) => {
      const updated = [pdfRecord, ...prev];
      try {
        localStorage.setItem('neet_uploaded_pdfs', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    saveUploadedPdfToFirestore(pdfRecord);

    setCohortAnalytics((prev) => ({
      ...prev,
      pdfUploadsCount: prev.pdfUploadsCount + 1,
    }));
  };

  const deleteUploadedPdf = async (pdfId: string) => {
    setUploadedPdfs((prev) => {
      const updated = prev.filter((p) => p.id !== pdfId);
      try {
        localStorage.setItem('neet_uploaded_pdfs', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    await deleteUploadedPdfFromFirestore(pdfId);

    setCohortAnalytics((prev) => ({
      ...prev,
      pdfUploadsCount: Math.max(0, prev.pdfUploadsCount - 1),
    }));
  };

  const addCustomExamPaper = async (paper: MockExamPaper) => {
    const stampedPaper: MockExamPaper = {
      ...paper,
      id: paper.code || paper.id || `exam-${Date.now()}`,
      code: paper.code || `PDF-EXAM-${Date.now().toString().slice(-6)}`,
      uploadedByEmail: currentUser?.email || paper.uploadedByEmail || '',
      createdAt: paper.createdAt || new Date().toISOString(),
      isUserUploaded: true
    };

    setCustomExamPapers((prev) => {
      const filtered = prev.filter(p => (p.code !== stampedPaper.code && p.id !== stampedPaper.id));
      const updated = [stampedPaper, ...filtered];
      try {
        localStorage.setItem('neet_custom_exam_papers', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    await saveCustomExamPaperToFirestore(stampedPaper, currentUser?.id, currentUser?.email);

    setCohortAnalytics((prev) => ({
      ...prev,
      totalExamsGenerated: prev.totalExamsGenerated + 1,
    }));
  };

  const deleteCustomExamPaper = async (codeOrId: string) => {
    setCustomExamPapers((prev) => {
      const updated = prev.filter(p => p.code !== codeOrId && p.id !== codeOrId);
      try {
        localStorage.setItem('neet_custom_exam_papers', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    await deleteCustomExamPaperFromFirestore(codeOrId, currentUser?.id);
  };

  const generateRandomExamFromStoredPdfs = (
    count: number = 45,
    subjectFilter?: string,
    durationMinutes: number = 180
  ): MockExamPaper | null => {
    // Gather all questions from customExamPapers and uploadedPdfs
    const questionPool: ExamQuestion[] = [];
    const seenTexts = new Set<string>();

    // 1. From customExamPapers
    customExamPapers.forEach((paper) => {
      if (Array.isArray(paper.questions)) {
        paper.questions.forEach((q) => {
          const norm = q.questionText.toLowerCase().trim();
          if (!seenTexts.has(norm)) {
            seenTexts.add(norm);
            questionPool.push(q);
          }
        });
      }
    });

    // 2. From uploadedPdfs that might contain fullExamData or extracted questions
    uploadedPdfs.forEach((pdf) => {
      if (pdf.fullExamData && Array.isArray(pdf.fullExamData.questions)) {
        pdf.fullExamData.questions.forEach((q) => {
          const norm = q.questionText.toLowerCase().trim();
          if (!seenTexts.has(norm)) {
            seenTexts.add(norm);
            questionPool.push(q);
          }
        });
      }
    });

    if (questionPool.length === 0) {
      return null;
    }

    // Filter by subject if specified
    let filteredPool = questionPool;
    if (subjectFilter && subjectFilter !== 'All Subjects' && subjectFilter !== 'Full NTA NEET UG Syllabus') {
      const sub = subjectFilter.toLowerCase();
      const matched = questionPool.filter((q) =>
        (q.topic && q.topic.toLowerCase().includes(sub)) ||
        (q.questionText && q.questionText.toLowerCase().includes(sub))
      );
      if (matched.length > 0) {
        filteredPool = matched;
      }
    }

    // Shuffle pool using Fisher-Yates
    const shuffled = [...filteredPool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selectedQuestions = shuffled.slice(0, Math.min(count, shuffled.length)).map((q, idx) => ({
      ...q,
      id: `random-pdf-q-${idx + 1}-${Date.now().toString().slice(-4)}`,
      qNumber: idx + 1,
      marks: 4
    }));

    const randomExam: MockExamPaper = {
      id: `random-exam-${Date.now()}`,
      examTitle: `Random Practice Exam (${selectedQuestions.length} Qs) from Uploaded PDFs`,
      subject: subjectFilter || "Full NTA NEET UG Syllabus",
      code: `RANDOM-PDF-${Date.now().toString().slice(-6)}`,
      durationMinutes: durationMinutes || 180,
      totalMarks: selectedQuestions.length * 4,
      instructions: [
        `Randomly synthesized test with ${selectedQuestions.length} questions extracted from your uploaded NEET PDF question papers.`,
        "Marking Scheme: +4 Marks for correct answer, -1 Mark for wrong option.",
        `Time Allocated: ${durationMinutes || 180} minutes.`
      ],
      questions: selectedQuestions,
      createdAt: new Date().toISOString(),
      isUserUploaded: true
    };

    return randomExam;
  };

  const updateSchedule = (newSchedule: StudyScheduleData) => {
    setSchedule(newSchedule);
  };

  const toggleScheduleTask = (dayIndex: number, sessionIndex: number) => {
    setSchedule((prev) => {
      const updatedDays = [...prev.days];
      const day = { ...updatedDays[dayIndex] };
      const sessions = [...day.sessions];
      const task = { ...sessions[sessionIndex] };
      task.completed = !task.completed;
      sessions[sessionIndex] = task;
      day.sessions = sessions;
      updatedDays[dayIndex] = day;

      if (task.completed) {
        recordQuestionSolved(5);
      }
      return { ...prev, days: updatedDays };
    });
  };

  const addStudent = (studentData: Omit<StudentRecord, 'id' | 'joinDate' | 'lastActive'>) => {
    const newStudent: StudentRecord = {
      ...studentData,
      id: `usr-student-${Date.now()}`,
      joinDate: 'Just Now',
      lastActive: 'Online Now',
    };
    setStudentsList((prev) => [newStudent, ...prev]);
    setCohortAnalytics((prev) => ({
      ...prev,
      totalStudents: prev.totalStudents + 1,
    }));
  };

  const deleteStudent = async (id: string, email?: string) => {
    recordDeletedStudent(id, email);

    setStudentsList((prev) => {
      const updated = prev.filter((s) => s.id !== id && (email ? s.email.toLowerCase() !== email.toLowerCase() : true));
      try {
        localStorage.setItem('neet_students', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setCohortAnalytics((prev) => ({
      ...prev,
      totalStudents: Math.max(0, prev.totalStudents - 1),
    }));

    if (email) {
      try {
        const accounts = getStoredAccounts();
        if (accounts[email.toLowerCase()]) {
          delete accounts[email.toLowerCase()];
          localStorage.setItem('neet_registered_accounts', JSON.stringify(accounts));
        }
      } catch (e) {
        console.error('Error removing student from registered accounts', e);
      }
    }

    await deleteStudentFromFirestore(email, id);
  };

  const updateStudentRole = (id: string, newRole: UserRole) => {
    setStudentsList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, role: newRole } : s))
    );
  };

  const updateStudentStatus = (id: string, newStatus: 'Active' | 'Inactive' | 'Flagged') => {
    setStudentsList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoggedIn: !!currentUser,
        sendOtp,
        verifyOtp,
        loginWithEmailAndPassword,
        registerWithEmailAndPassword,
        resetPasswordWithOtp,
        loginWithGoogle,
        loginAsStudent,
        loginAsOwner,
        logout,
        practiceSets,
        addPracticeSet,
        uploadedPdfs,
        addUploadedPdf,
        deleteUploadedPdf,
        customExamPapers,
        addCustomExamPaper,
        deleteCustomExamPaper,
        generateRandomExamFromStoredPdfs,
        schedule,
        updateSchedule,
        toggleScheduleTask,
        studentsList,
        addStudent,
        deleteStudent,
        updateStudentRole,
        updateStudentStatus,
        cohortAnalytics,
        activeView,
        setActiveView,
        selectedPracticeSet,
        setSelectedPracticeSet,
        recordQuestionSolved,
        clearAllTestData,
        studyTimeTodaySeconds: currentUser?.studyTimeTodaySeconds || 0,
        streakIncreasedToday: false,
        streakBanner,
        dismissStreakBanner,
        theme,
        toggleTheme,
        keepScreenAwake,
        toggleKeepScreenAwake,
        isScreenWakeLocked,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

