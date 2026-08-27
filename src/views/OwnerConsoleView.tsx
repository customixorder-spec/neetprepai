import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { StudentRecord, UserRole, UploadedPdfRecord } from '../types';
import { getApiUrl } from '../lib/api';
import { 
  ShieldCheck, 
  Users, 
  BarChart3, 
  TrendingUp, 
  UserPlus, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  FileCheck2, 
  GraduationCap, 
  Clock, 
  MoreVertical,
  Activity,
  Layers,
  Sparkles,
  Zap,
  BookOpen,
  Trash2,
  Printer,
  Download,
  FileText,
  Mail,
  Send,
  RefreshCw,
  ExternalLink,
  KeyRound,
  Check,
  Copy,
  Server,
  Settings
} from 'lucide-react';

export const OwnerConsoleView: React.FC = () => {
  const { 
    currentUser, 
    studentsList, 
    addStudent, 
    deleteStudent, 
    updateStudentRole, 
    updateStudentStatus, 
    cohortAnalytics, 
    uploadedPdfs = [], 
    deleteUploadedPdf,
    sendOtp
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'analytics' | 'pdfs' | 'smtp'>('users');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedPdfPreview, setSelectedPdfPreview] = useState<UploadedPdfRecord | null>(null);
  const [pdfSearchQuery, setPdfSearchQuery] = useState<string>('');
  const [pdfSectionFilter, setPdfSectionFilter] = useState<'ALL' | 'Physics' | 'Chemistry' | 'Botany' | 'Zoology'>('ALL');
  
  // SMTP Test State
  const [smtpStatus, setSmtpStatus] = useState<any>(null);
  const [checkingSmtp, setCheckingSmtp] = useState<boolean>(false);
  const [testEmail, setTestEmail] = useState<string>('customix.order@gmail.com');
  const [testSending, setTestSending] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; code?: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const checkSmtpHealth = async () => {
    setCheckingSmtp(true);
    try {
      const res = await fetch(getApiUrl('/api/auth/smtp-status'));
      const data = await res.json();
      setSmtpStatus(data);
    } catch (e: any) {
      setSmtpStatus({ configured: false, error: e.message });
    } finally {
      setCheckingSmtp(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'smtp') {
      checkSmtpHealth();
    }
  }, [activeTab]);

  const handleSendTestOtp = async () => {
    if (!testEmail || !testEmail.includes('@')) return;
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await sendOtp(testEmail.trim(), 'login');
      setTestResult(res);
      // refresh smtp status
      checkSmtpHealth();
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'Failed to dispatch test OTP' });
    } finally {
      setTestSending(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };
  // Delete Student Confirmation Modal State
  const [studentToDelete, setStudentToDelete] = useState<StudentRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // New Student Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newRole, setNewRole] = useState<UserRole>('student');
  const [newSubjects, setNewSubjects] = useState<string>('NEET Botany, NEET Zoology, NEET Chemistry, NEET Physics');

  if (!currentUser || currentUser.role !== 'owner') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6 font-sans">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center shadow-md">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Access Restricted</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            This area is restricted to authorized platform administrators.
          </p>
        </div>
      </div>
    );
  }

  // Filtered Students List
  const filteredStudents = studentsList.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.enrolledSubjects.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && student.status === statusFilter;
  });

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    addStudent({
      name: newName,
      email: newEmail,
      role: newRole,
      enrolledSubjects: newSubjects.split(',').map(s => s.trim()),
      status: 'Active',
      accuracyRate: 0,
      testsCompleted: 0,
    });

    setNewName('');
    setNewEmail('');
    setShowAddModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-4 space-y-4 font-sans">
      
      {/* Top Console Banner - Ultra Compact */}
      <div className="relative overflow-hidden rounded-2xl bg-indigo-900 p-4 text-white border border-indigo-800 shadow-md">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>Owner & Admin Control Hub</span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white font-sans tracking-tight leading-tight">
              Owner Console & Cohort Analytics
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'users'
                  ? 'bg-white text-indigo-950 font-black shadow-2xs'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>User Management</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-white text-indigo-950 font-black shadow-2xs'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytical Insights</span>
            </button>

            <button
              onClick={() => setActiveTab('pdfs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'pdfs'
                  ? 'bg-white text-indigo-950 font-black shadow-2xs'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>PDFs Repo ({uploadedPdfs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('smtp')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'smtp'
                  ? 'bg-white text-indigo-950 font-black shadow-2xs'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>SMTP & Email Engine</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'users' ? (

        /* USER MANAGEMENT MODULE */
        <div className="space-y-4">
          
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search students by name, email, or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Filter Tabs & Add Button */}
            <div className="flex items-center gap-2 overflow-x-auto">
              {['All', 'Active', 'Flagged', 'Inactive'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    statusFilter === status
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {status}
                </button>
              ))}

              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-md flex items-center gap-1.5 shrink-0 ml-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Student</span>
              </button>
            </div>

          </div>

          {/* Students Table */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Registered Students Directory ({filteredStudents.length})
              </h3>
              <span className="text-xs text-slate-400 font-medium">Logged in as Owner</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-y border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Student Name & Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Enrolled Courses</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Accuracy</th>
                    <th className="py-3 px-4">Tests Solved</th>
                    <th className="py-3 px-4 text-right">Owner Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 dark:text-white">{s.name}</p>
                        <p className="text-[11px] text-slate-400">{s.email}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.role === 'owner' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {s.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {s.enrolledSubjects.map((sub, i) => (
                            <span key={i} className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700">
                              {sub}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'Active' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' :
                          s.status === 'Flagged' ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">{s.accuracyRate}%</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">{s.testsCompleted}</td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        {s.status !== 'Active' ? (
                          <button
                            onClick={() => updateStudentStatus(s.id, 'Active')}
                            className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded text-[10px] font-bold border border-emerald-200 dark:border-emerald-800"
                          >
                            Activate
                          </button>
                        ) : (
                          <button
                            onClick={() => updateStudentStatus(s.id, 'Flagged')}
                            className="px-2 py-1 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-100 rounded text-[10px] font-bold border border-rose-200 dark:border-rose-800"
                          >
                            Flag
                          </button>
                        )}

                        <button
                          onClick={() => updateStudentRole(s.id, s.role === 'owner' ? 'student' : 'owner')}
                          className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded text-[10px] font-bold border border-indigo-200 dark:border-indigo-800"
                        >
                          {s.role === 'owner' ? 'Make Student' : 'Make Owner'}
                        </button>

                        <button
                          onClick={() => setStudentToDelete(s)}
                          title="Remove Student from App and Firebase Database"
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold inline-flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      ) : activeTab === 'analytics' ? (

        /* COHORT ANALYTICAL INSIGHTS MODULE */
        <div className="space-y-8">
          
          {/* Key Metric Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Enrolled Students</span>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{cohortAnalytics.totalStudents}</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold pt-1">
                {cohortAnalytics.activeStudentsToday} Active Today (DAU)
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Cohort Avg Accuracy</span>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{cohortAnalytics.averageAccuracy}%</p>
              <p className="text-[11px] text-slate-400 font-medium pt-1">Target benchmark: 80%</p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total AI Mock Exams Made</span>
              <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{cohortAnalytics.totalExamsGenerated}</p>
              <p className="text-[11px] text-slate-400 font-medium pt-1">Across all enrolled students</p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">PDF / Image Uploads Extracted</span>
              <p className="text-3xl font-black text-purple-600 dark:text-purple-400">{cohortAnalytics.pdfUploadsCount}</p>
              <p className="text-[11px] text-slate-400 font-medium pt-1">2,450 Total Hours Logged</p>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Cohort Weak Topics Alert Box */}
            <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>Cohort Weakest Subject Concepts (High Failure Rate)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Concepts where more than 30% of students struggle during practice tests:
              </p>

              <div className="space-y-3">
                {cohortAnalytics.weakTopicsCohort.map((wt, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{wt.topic}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{wt.subject}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                        {wt.failureRate}% Failure Rate
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subject Performance Breakdown */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Subject Score Breakdown</span>
              </h3>

              <div className="space-y-4">
                {cohortAnalytics.subjectPerformance.map((sp, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span>{sp.subject} ({sp.activeStudents} Students)</span>
                      <span>{sp.avgScore}% Avg</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full" 
                        style={{ width: `${sp.avgScore}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      ) : activeTab === 'pdfs' ? (

        /* STUDENT PDFS REPOSITORY MODULE (OWNER ONLY) */
        <div className="space-y-6">
          
          {/* Repository Official 180-Question Paper Card for Owner */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white border border-purple-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>NTA Official Master Test Repository (Full 180 Questions)</span>
              </div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-purple-300" />
                <span>NEET UG Official 180-Question Practice Test Paper PDF</span>
              </h3>
              <p className="text-xs text-purple-200 max-w-xl">
                Master 180-Question / 720-Mark NTA pattern NEET test paper containing Physics (Q1-45), Chemistry (Q46-90), Botany (Q91-135), and Zoology (Q136-180) with NCERT step-by-step solutions.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  const masterPaper = uploadedPdfs.find(p => p.id.includes('official')) || uploadedPdfs[0];
                  if (masterPaper) setSelectedPdfPreview(masterPaper);
                }}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>View / Inspect Test Paper PDF</span>
              </button>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Central Student Uploaded Materials & PDF Repository</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  All PDFs, notes, and study material uploaded by students across the platform are stored here for owner inspection and verification.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold border border-indigo-200 dark:border-indigo-800">
                  {uploadedPdfs.length} Files Stored
                </span>
              </div>
            </div>

            {uploadedPdfs.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <FileCheck2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Student Uploaded PDFs Found</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  When students upload study materials or PDFs in the Extractor, they will automatically appear here in real-time under your Owner account.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-y border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Document Title & Size</th>
                      <th className="py-3 px-4">Uploaded By (Student)</th>
                      <th className="py-3 px-4">Subject & Chapters</th>
                      <th className="py-3 px-4">Extracted MCQs</th>
                      <th className="py-3 px-4">Upload Timestamp</th>
                      <th className="py-3 px-4 text-right">Owner Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                    {uploadedPdfs.map((pdf) => (
                      <tr key={pdf.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{pdf.fileName}</span>
                          </p>
                          <p className="text-[11px] text-slate-400 pl-5">{pdf.fileSize}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900 dark:text-white">{pdf.uploadedByName}</p>
                          <p className="text-[11px] text-slate-400">{pdf.uploadedByEmail}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] border border-indigo-200 dark:border-indigo-800">
                            {pdf.subject}
                          </span>
                          {pdf.selectedChapters && pdf.selectedChapters.length > 0 && (
                            <p className="text-[10px] text-slate-500 mt-1 truncate max-w-xs">
                              {pdf.selectedChapters.join(', ')}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            {pdf.numQuestionsExtracted} Questions
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">{pdf.uploadedAt}</td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => setSelectedPdfPreview(pdf)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>View / Inspect PDF</span>
                          </button>
                          <button
                            onClick={() => deleteUploadedPdf(pdf.id)}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      ) : (

        /* SMTP CONFIGURATION & LIVE TRANSMISSION TESTER MODULE */
        <div className="space-y-6">
          
          {/* Header Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white border border-indigo-800/60 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 text-[10px] font-bold">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Real Email Dispatch Engine</span>
                </div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <span>Gmail SMTP & OTP Delivery Center</span>
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Send OTP verification codes directly to real student inboxes via Google Mail (Gmail SMTP). Configure your 16-character App Password once to enable live email delivery.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={checkSmtpHealth}
                  disabled={checkingSmtp}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checkingSmtp ? 'animate-spin' : ''}`} />
                  <span>{checkingSmtp ? 'Checking...' : 'Refresh Status'}</span>
                </button>
              </div>
            </div>

            {/* Current Status Pill */}
            {smtpStatus && (
              <div className="pt-2 border-t border-indigo-800/40 flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Status:</span>
                  {smtpStatus.configured ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>SMTP Ready ({smtpStatus.user})</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Credentials Pending Setup</span>
                    </span>
                  )}
                </div>
                <div className="text-slate-400">
                  Provider: <strong className="text-white">{smtpStatus.provider || 'Gmail'}</strong>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Live Test Dispatcher Card */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Send Test OTP to Email Inbox</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Trigger an immediate real email OTP transmission to verify your SMTP connection.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Target Recipient Email Address
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="e.g. customix.order@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSendTestOtp}
                  disabled={testSending || !testEmail}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {testSending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Transmitting Email via SMTP...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Live OTP Email Now</span>
                    </>
                  )}
                </button>

                {/* Test Result Message */}
                {testResult && (
                  <div className={`p-3.5 rounded-2xl text-xs space-y-1.5 animate-fadeIn ${
                    testResult.success 
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' 
                      : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5">
                      {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-rose-500" />}
                      <span>{testResult.success ? 'OTP Email Dispatched Successfully!' : 'Email Dispatch Result'}</span>
                    </div>
                    <p className="leading-relaxed">{testResult.message}</p>
                    {testResult.code && (
                      <p className="font-mono text-[11px] pt-1">
                        Generated Security OTP: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{testResult.code}</strong>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Step-by-Step Configuration Guide */}
            <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Settings className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>How to Setup Gmail SMTP (3 Quick Steps)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Google requires a 16-character App Password (not your regular account password) for secure mail sending.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Step 1 */}
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="font-bold text-slate-900 dark:text-white">Enable 2-Step Verification on Google</p>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      Make sure 2-Step Verification is active on your Google account (<strong className="text-indigo-600 dark:text-indigo-400">customix.order@gmail.com</strong>).
                    </p>
                    <a
                      href="https://myaccount.google.com/security"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <span>Google Account Security</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <div className="space-y-1 flex-1">
                    <p className="font-bold text-slate-900 dark:text-white">Generate a 16-Character App Password</p>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      Visit the App Passwords page, name the app "NEET Prep App", and click <strong>Create</strong>. Copy the generated 16-letter code.
                    </p>
                    <a
                      href="https://myaccount.google.com/apppasswords"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <span>Open Google App Passwords</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-black flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <div className="space-y-2 flex-1">
                    <p className="font-bold text-slate-900 dark:text-white">Add Variables to AI Studio Secrets Panel</p>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      Open AI Studio Settings &gt; Secrets / Environment Variables and add these two keys:
                    </p>
                    
                    <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] space-y-2 border border-slate-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-indigo-400">SMTP_USER</span>="customix.order@gmail.com"
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('customix.order@gmail.com', 'user')}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey === 'user' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === 'user' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-indigo-400">SMTP_PASS</span>="your 16 char app password"
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('SMTP_PASS', 'pass')}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey === 'pass' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === 'pass' ? 'Copied' : 'Copy Name'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      )}

      {/* Add New Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Add New Student Account</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samantha Lee"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="sam.lee@student.edu"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Enrolled Courses (Comma separated)</label>
                <input
                  type="text"
                  value={newSubjects}
                  onChange={(e) => setNewSubjects(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
              >
                Create Student Enrollment
              </button>
            </form>

          </div>
        </div>
      )}

      {/* Delete Student Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold border border-rose-200 dark:border-rose-800">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Remove Student Record?</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-slate-900 dark:text-white font-bold">{studentToDelete.name}</strong> (<span className="text-slate-700 dark:text-slate-400">{studentToDelete.email}</span>) from the platform and Firebase database? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setStudentToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await deleteStudent(studentToDelete.id, studentToDelete.email);
                  } finally {
                    setIsDeleting(false);
                    setStudentToDelete(null);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Printable PDF Viewer Modal */}
      {selectedPdfPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 overflow-hidden">
            
            {/* Modal Top Toolbar */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 text-[10px] font-bold uppercase tracking-wider">
                    {selectedPdfPreview.status || 'Verified PDF Document'}
                  </span>
                  <span className="text-xs text-purple-300 font-medium">
                    • {selectedPdfPreview.fileSize}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-400 shrink-0" />
                  <span className="truncate max-w-lg">{selectedPdfPreview.fileName}</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Uploaded by: <strong className="text-white">{selectedPdfPreview.uploadedByName}</strong> ({selectedPdfPreview.uploadedByEmail}) • {selectedPdfPreview.uploadedAt}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  title="Print paper or save as PDF document"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={() => setSelectedPdfPreview(null)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Document Content Scroll Area */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50 dark:bg-slate-900/50">
              
              {/* Metadata Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-0.5">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Subject</p>
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate">{selectedPdfPreview.subject}</p>
                </div>
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-0.5">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Extracted MCQs</p>
                  <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">{selectedPdfPreview.numQuestionsExtracted} Questions</p>
                </div>
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-0.5">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Marking Scheme</p>
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400">+4 Correct / -1 Negative</p>
                </div>
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-0.5">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Pattern</p>
                  <p className="text-xs font-bold text-purple-600 dark:text-purple-400">NTA NEET UG Official</p>
                </div>
              </div>

              {selectedPdfPreview.fullExamData ? (
                /* FULL 180-QUESTION INTERACTIVE PAPER DISPLAY */
                <div className="space-y-4">
                  {/* Paper Filter Toolbar */}
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                    <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 mr-1 flex items-center gap-1">
                        <Filter className="w-3 h-3 text-indigo-500" />
                        <span>Filter:</span>
                      </span>
                      {(['ALL', 'Physics', 'Chemistry', 'Botany', 'Zoology'] as const).map((sec) => (
                        <button
                          key={sec}
                          onClick={() => setPdfSectionFilter(sec)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            pdfSectionFilter === sec
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {sec === 'ALL' ? 'All (180 Qs)' : sec}
                        </button>
                      ))}
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search question or topic..."
                        value={pdfSearchQuery}
                        onChange={(e) => setPdfSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Document Paper Header */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center space-y-1 shadow-2xs">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      {selectedPdfPreview.fullExamData.examTitle}
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Code: {selectedPdfPreview.fullExamData.code} • Duration: {selectedPdfPreview.fullExamData.durationMinutes} Mins • Total Marks: {selectedPdfPreview.fullExamData.totalMarks}
                    </p>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-3">
                    {selectedPdfPreview.fullExamData.questions
                      .filter((q) => {
                        const matchesSec = pdfSectionFilter === 'ALL' || q.topic.toLowerCase().includes(pdfSectionFilter.toLowerCase());
                        const matchesSearch = !pdfSearchQuery || q.questionText.toLowerCase().includes(pdfSearchQuery.toLowerCase()) || q.topic.toLowerCase().includes(pdfSearchQuery.toLowerCase());
                        return matchesSec && matchesSearch;
                      })
                      .map((q) => (
                        <div
                          key={q.id || q.qNumber}
                          className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] border border-indigo-200 dark:border-indigo-800">
                              Q{q.qNumber} • {q.topic}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                              +4 / -1 Marks
                            </span>
                          </div>

                          <p className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
                            {(() => {
                              if (!q.questionText) return '';
                              let str = q.questionText.trim();
                              str = str.replace(/^\[[^\]]+\]\s*/, '');
                              if (str.includes(':')) {
                                const after = str.substring(str.indexOf(':') + 1).trim();
                                if (after.length > 0) str = after;
                              }
                              return str.replace(/^(Question\s*\d+|Q\d+|Q\.\d+)\s*[:.-]?\s*/i, '').trim();
                            })()}
                          </p>

                          {/* Options Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {q.options.map((opt, oIdx) => {
                              const isCorrect = oIdx === q.correctOptionIndex;
                              return (
                                <div
                                  key={oIdx}
                                  className={`p-2.5 rounded-xl border flex items-center gap-2 font-medium ${
                                    isCorrect
                                      ? 'bg-emerald-50/80 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 font-bold'
                                      : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                  }`}>
                                    {oIdx + 1}
                                  </span>
                                  <span className="flex-1">{opt}</span>
                                  {isCorrect && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Detailed Solution */}
                          {q.detailedSolution && (
                            <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50 text-[11px] space-y-1">
                              <p className="font-extrabold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                <span>NCERT Step-by-Step Solution:</span>
                              </p>
                              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                {q.detailedSolution}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                /* STANDARD TEXT SNIPPET & CONTENT PREVIEW */
                <div className="space-y-3">
                  {selectedPdfPreview.selectedChapters && selectedPdfPreview.selectedChapters.length > 0 && (
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl space-y-1 border border-slate-200 dark:border-slate-700">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Targeted NCERT Chapters</p>
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                        {selectedPdfPreview.selectedChapters.join(' • ')}
                      </p>
                    </div>
                  )}

                  <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl space-y-2 font-mono text-[11px] max-h-96 overflow-y-auto">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Document Text Extract & Snippet</p>
                    <p className="leading-relaxed whitespace-pre-wrap">{selectedPdfPreview.snippetPreview || 'No text snippet saved.'}</p>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Bottom Footer */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 font-medium">
                Showing {selectedPdfPreview.fileName}
              </span>
              <button
                onClick={() => setSelectedPdfPreview(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Close Document Reader
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
