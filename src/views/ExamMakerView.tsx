import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { MockExamPaper, ExamQuestion, UploadedPdfRecord } from '../types';
import { AUTHENTIC_NEET_MOCK_PAPERS } from '../data/neetMockPapers';
import { getApiUrl } from '../lib/api';
import { 
  GraduationCap, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  RotateCcw, 
  Award, 
  FileText, 
  Brain, 
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Check,
  Target,
  Bookmark,
  ListChecks,
  Compass,
  ArrowRight,
  Play,
  ShieldCheck,
  Zap,
  UploadCloud,
  FileUp,
  Dices,
  Layers,
  Trash2,
  AlertCircle,
  Database,
  Calendar,
  SunMedium
} from 'lucide-react';
import { useWakeLock } from '../lib/useWakeLock';

interface PrioritizedNCERTChapter {
  chapterName: string;
  subject: string;
  classLevel?: string;
  ncertPageRange?: string;
  priority: 'Urgent' | 'High' | 'Medium' | string;
  missedQuestionNumbers: number[];
  keyConceptsToReview: string[];
  highYieldDiagrams?: string;
  recommendedStudyAction: string;
  estimatedMinutes?: number;
}

type MakerTab = 'pdf-extract' | 'random-test' | 'pre-made' | 'my-library';

export const ExamMakerView: React.FC = () => {
  const { 
    currentUser, 
    customExamPapers, 
    addCustomExamPaper, 
    deleteCustomExamPaper, 
    generateRandomExamFromStoredPdfs,
    uploadedPdfs,
    addUploadedPdf,
    recordQuestionSolved
  } = useAuth();

  // Navigation tab inside AI Paper Maker
  const [makerTab, setMakerTab] = useState<MakerTab>('pdf-extract');

  // Active Exam Solving State
  const [activeExam, setActiveExam] = useState<MockExamPaper | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<{ [qId: string]: number }>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExamSubmitted, setIsExamSubmitted] = useState<boolean>(false);
  const [examResult, setExamResult] = useState<{ score: number; totalMarks: number; grade: string; percentage: number } | null>(null);

  // PDF Extraction Form State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>('');
  const [pdfFileSize, setPdfFileSize] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [targetSubject, setTargetSubject] = useState<string>('Full NTA NEET UG Syllabus');
  const [durationMinutes, setDurationMinutes] = useState<number>(180); // 3 Hours default
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extractionSuccessBanner, setExtractionSuccessBanner] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Random Test Generator State
  const [randomCount, setRandomCount] = useState<number>(45);
  const [randomSubject, setRandomSubject] = useState<string>('All Subjects');
  const [randomDuration, setRandomDuration] = useState<number>(180); // 3 Hours default


  // NCERT Chapter Analysis State
  const [isAnalyzingIncorrect, setIsAnalyzingIncorrect] = useState<boolean>(false);
  const [ncertAnalysis, setNcertAnalysis] = useState<{
    summary: string;
    prioritizedChapters: PrioritizedNCERTChapter[];
  } | null>(null);
  const [savedChapters, setSavedChapters] = useState<{ [key: string]: boolean }>({});
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'all' | 'urgent' | 'high'>('all');

  // Keep screen awake while taking the exam
  const { isLocked: isExamWakeLocked } = useWakeLock({
    enabled: !!(activeExam && !isExamSubmitted),
    tag: 'exam-active-session',
  });

  // Countdown timer effect for 3-hour exam
  useEffect(() => {
    if (!activeExam || isExamSubmitted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeExam, isExamSubmitted, timeLeft]);

  if (!currentUser) return null;

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setExtractionError('Please upload a valid PDF document (.pdf).');
      return;
    }
    setExtractionError(null);
    setPdfFile(file);
    setPdfFileName(file.name);
    setPdfFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPdfBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // Start exam execution
  const handleStartExam = (exam: MockExamPaper) => {
    setActiveExam(exam);
    setCurrentQIndex(0);
    setUserAnswers({});
    setIsExamSubmitted(false);
    setExamResult(null);
    setNcertAnalysis(null);
    setSavedChapters({});
    setTimeLeft((exam.durationMinutes || 180) * 60);
  };

  // Extract NEET Paper from PDF and Store in Firebase & LocalStorage
  const handleExtractPaperFromPdf = async () => {
    if (!pdfBase64 && !pdfFile) {
      setExtractionError('Please select or drag-and-drop a NEET Question Paper PDF first.');
      return;
    }

    setIsExtracting(true);
    setExtractionError(null);

    try {
      const res = await fetch(getApiUrl('/api/gemini/extract-pdf-paper'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: pdfBase64,
          mimeType: 'application/pdf',
          fileName: pdfFileName || 'NEET_Question_Paper.pdf',
          subject: targetSubject,
          durationMinutes: durationMinutes || 180,
        }),
      });

      const data = await res.json();
      if (!data.success || !data.exam) {
        throw new Error(data.error || 'Failed to extract structured exam from PDF.');
      }

      const extractedPaper: MockExamPaper = {
        ...data.exam,
        id: `pdf-exam-${Date.now()}`,
        code: data.exam.code || `PDF-NEET-${Date.now().toString().slice(-6)}`,
        examTitle: data.exam.examTitle || `NEET Mock Paper - ${pdfFileName.replace(/\.[^/.]+$/, '')}`,
        subject: targetSubject,
        durationMinutes: durationMinutes || 180,
        totalMarks: data.exam.totalMarks || (data.exam.questions ? data.exam.questions.length * 4 : 720),
        uploadedByEmail: currentUser.email,
        sourcePdfName: pdfFileName,
        createdAt: new Date().toISOString(),
        isUserUploaded: true,
      };

      // 1. Save exam paper to Firebase & Local Storage
      await addCustomExamPaper(extractedPaper);

      // 2. Also register in UploadedPdfRecord so it is tracked in the PDF manager & central DB
      const newPdfRecord: UploadedPdfRecord = {
        id: `pdf-doc-${Date.now()}`,
        fileName: pdfFileName,
        fileSize: pdfFileSize || '1.5 MB',
        uploadedByUserId: currentUser.id,
        uploadedByName: currentUser.name,
        uploadedByEmail: currentUser.email,
        uploadedAt: new Date().toLocaleString(),
        subject: targetSubject,
        selectedChapters: ['Extracted NEET Full Paper'],
        numQuestionsExtracted: extractedPaper.questions.length,
        snippetPreview: `Extracted ${extractedPaper.questions.length} NEET questions with 3-Hour timer (+4/-1 marking).`,
        status: 'Extracted',
        fullExamData: extractedPaper,
      };
      addUploadedPdf(newPdfRecord);

      setExtractionSuccessBanner(`Successfully extracted ${extractedPaper.questions.length} questions into a structured 3-Hour NEET Paper! Saved to Firebase & Local Storage.`);

      // Reset form
      setPdfFile(null);
      setPdfBase64(null);
      setPdfFileName('');
      setPdfFileSize('');

      // Launch paper immediately
      handleStartExam(extractedPaper);
    } catch (err: any) {
      console.error('PDF extraction error:', err);
      setExtractionError(err.message || 'An error occurred while extracting the PDF paper.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Generate Random Test from Stored PDFs in Firebase / Local Storage
  const handleGenerateRandomTest = () => {
    const randomExam = generateRandomExamFromStoredPdfs(randomCount, randomSubject, randomDuration || 180);
    if (!randomExam) {
      // If no stored questions yet, pick from authentic NEET paper questions
      const pool: ExamQuestion[] = [];
      AUTHENTIC_NEET_MOCK_PAPERS.forEach((p) => {
        pool.push(...p.questions);
      });
      // Shuffle
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      const selected = pool.slice(0, Math.min(randomCount, pool.length)).map((q, idx) => ({
        ...q,
        id: `random-fallback-q-${idx + 1}-${Date.now().toString().slice(-4)}`,
        qNumber: idx + 1,
        marks: 4
      }));

      const syntheticPaper: MockExamPaper = {
        id: `random-nta-${Date.now()}`,
        examTitle: `Random Practice Mock (${selected.length} Qs) - Authentic NTA Pool`,
        subject: randomSubject,
        code: `RANDOM-NTA-${Date.now().toString().slice(-6)}`,
        durationMinutes: randomDuration || 180,
        totalMarks: selected.length * 4,
        instructions: [
          `Random NEET Practice set with ${selected.length} questions.`,
          'Marking: +4 for correct option, -1 penalty for incorrect response.',
          `Time allocated: ${randomDuration || 180} minutes.`
        ],
        questions: selected,
        createdAt: new Date().toISOString(),
        isUserUploaded: true
      };

      addCustomExamPaper(syntheticPaper);
      handleStartExam(syntheticPaper);
      return;
    }

    // Save random paper to user custom exams and start
    addCustomExamPaper(randomExam);
    handleStartExam(randomExam);
  };


  // Analyze incorrect answers and identify NCERT chapter priorities
  const analyzeIncorrectAnswers = async (exam: MockExamPaper, answers: { [qId: string]: number }) => {
    setIsAnalyzingIncorrect(true);
    try {
      const incorrectQuestions = exam.questions
        .filter((q) => answers[q.id] !== q.correctOptionIndex)
        .map((q) => {
          const selectedIdx = answers[q.id];
          const userSelectedOption = selectedIdx !== undefined ? q.options[selectedIdx] : 'Unanswered / Skipped';
          const correctOption = q.options[q.correctOptionIndex];
          return {
            qNumber: q.qNumber,
            topic: q.topic,
            questionText: q.questionText,
            userSelectedOption,
            correctOption,
            detailedSolution: q.detailedSolution,
          };
        });

      const res = await fetch(getApiUrl('/api/gemini/analyze-incorrect'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: exam.subject,
          examTitle: exam.examTitle,
          incorrectQuestions,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNcertAnalysis({
          summary: data.summary,
          prioritizedChapters: data.prioritizedChapters || [],
        });
      }
    } catch (err) {
      console.error('Failed to analyze incorrect answers:', err);
    } finally {
      setIsAnalyzingIncorrect(false);
    }
  };

  const handleToggleSaveChapter = (chapterName: string) => {
    setSavedChapters((prev) => {
      const nextState = { ...prev, [chapterName]: !prev[chapterName] };
      try {
        const savedList = JSON.parse(localStorage.getItem('neet_prioritized_ncert_chapters') || '[]');
        if (nextState[chapterName]) {
          if (!savedList.includes(chapterName)) savedList.push(chapterName);
        } else {
          const idx = savedList.indexOf(chapterName);
          if (idx > -1) savedList.splice(idx, 1);
        }
        localStorage.setItem('neet_prioritized_ncert_chapters', JSON.stringify(savedList));
      } catch (e) {
        console.error('Failed to sync chapter to localStorage:', e);
      }
      return nextState;
    });
  };

  // Submit Exam
  const handleFinishExam = () => {
    if (!activeExam) return;

    let totalMarksEarned = 0;
    let attemptedCount = 0;
    activeExam.questions.forEach((q) => {
      const selected = userAnswers[q.id];
      if (selected !== undefined) {
        attemptedCount++;
        if (selected === q.correctOptionIndex) {
          totalMarksEarned += q.marks;
        } else {
          totalMarksEarned -= 1; // -1 penalty
        }
      }
    });

    const pct = Math.max(0, Math.round((totalMarksEarned / activeExam.totalMarks) * 100));
    let grade = 'C';
    if (pct >= 90) grade = 'A+';
    else if (pct >= 80) grade = 'A';
    else if (pct >= 70) grade = 'B';
    else if (pct >= 60) grade = 'C';
    else grade = 'D';

    setExamResult({
      score: totalMarksEarned,
      totalMarks: activeExam.totalMarks,
      grade,
      percentage: pct,
    });

    setIsExamSubmitted(true);
    recordQuestionSolved(attemptedCount);

    // Automatically trigger AI analysis of incorrect answers for NCERT chapter prioritization
    analyzeIncorrectAnswers(activeExam, userAnswers);
  };

  // Format seconds into HH:MM:SS or MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate total questions stored in custom papers
  const totalCustomQuestionsCount = customExamPapers.reduce((acc, p) => acc + (p.questions ? p.questions.length : 0), 0);

  return (
    <div id="exam-maker-container" className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-4 space-y-4 font-sans">
      
      {/* Title Header */}
      <div id="exam-maker-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900 text-purple-700 dark:text-purple-300 text-[10px] font-bold mb-1">
            <GraduationCap className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>AI Paper Maker & 3-Hour NTA NEET Exam Engine</span>
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            AI NEET Paper Maker & PDF Exam Extractor
          </h1>
        </div>

        {activeExam && (
          <button
            id="btn-back-to-maker"
            onClick={() => setActiveExam(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors shrink-0 border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Exit Active Exam</span>
          </button>
        )}
      </div>

      {/* Success Notification Banner */}
      {extractionSuccessBanner && !activeExam && (
        <div id="banner-success-extracted" className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-2 text-xs text-emerald-900 dark:text-emerald-200 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{extractionSuccessBanner}</span>
          </div>
          <button
            onClick={() => setExtractionSuccessBanner(null)}
            className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {!activeExam ? (
        <div className="space-y-4">
          
          {/* Navigation Mode Tabs */}
          <div id="exam-maker-tabs" className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
            
            <button
              id="tab-pdf-extract"
              onClick={() => setMakerTab('pdf-extract')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                makerTab === 'pdf-extract'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Extract NEET Paper from PDF</span>
              <span className="px-1.5 py-0.2 rounded-full bg-purple-200/30 text-[10px]">3-Hr Limit</span>
            </button>

            <button
              id="tab-random-test"
              onClick={() => setMakerTab('random-test')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                makerTab === 'random-test'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Dices className="w-4 h-4" />
              <span>Random Questions from Stored PDFs</span>
              {totalCustomQuestionsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-purple-200/30 text-[10px] font-extrabold">
                  {totalCustomQuestionsCount} Qs
                </span>
              )}
            </button>

            <button
              id="tab-pre-made"
              onClick={() => setMakerTab('pre-made')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                makerTab === 'pre-made'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Authentic NTA Mock Papers</span>
            </button>


            <button
              id="tab-my-library"
              onClick={() => setMakerTab('my-library')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                makerTab === 'my-library'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Stored Papers Library</span>
              {customExamPapers.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px]">
                  {customExamPapers.length}
                </span>
              )}
            </button>

          </div>

          {/* TAB 1: EXTRACT NEET PAPER FROM PDF (DRAG & DROP) */}
          {makerTab === 'pdf-extract' && (
            <div id="section-pdf-extract" className="space-y-4">
              
              {/* Drag and Drop Box */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-xs font-black uppercase tracking-wider mb-1">
                      <FileUp className="w-4 h-4" />
                      <span>Drag & Drop PDF Question Paper Extractor</span>
                    </div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      Extract & Form Structured 3-Hour NEET Paper from PDF
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Upload your NEET question paper PDF. Our AI parses all MCQs with questions, options, marking schemes, sets a 3-hour timer (180 mins), and synchronizes with Firebase & Local Storage.
                    </p>
                  </div>
                </div>

                {/* Dropzone */}
                <div
                  id="pdf-dropzone"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 ${
                    isDragging
                      ? 'border-purple-600 bg-purple-50/80 dark:bg-purple-950/40 scale-[1.01]'
                      : pdfFile
                      ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                      : 'border-slate-300 dark:border-slate-700 hover:border-purple-500 bg-slate-50/50 dark:bg-slate-800/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  {pdfFile ? (
                    <div className="space-y-2">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
                        <FileText className="w-7 h-7" />
                      </div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        {pdfFileName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        File Size: <strong>{pdfFileSize}</strong> • PDF Ready for AI Extraction
                      </p>
                      <span className="inline-block px-3 py-1 rounded-full bg-emerald-500 text-white font-bold text-[11px]">
                        ✓ PDF Loaded Successfully (Click to Change)
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 flex items-center justify-center mx-auto border border-purple-200 dark:border-purple-800 group-hover:scale-105 transition-transform">
                        <UploadCloud className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                          Drag and Drop your NEET Question Paper PDF here
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          or <span className="text-purple-600 dark:text-purple-400 font-bold underline">browse from your computer</span> (.pdf supported)
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-2">
                        <span>• Full 180-Question Mock Papers</span>
                        <span>• Subject Practice Papers</span>
                        <span>• Coaching & NCERT Worksheets</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Full 180-Question Exam Guarantee Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200/70 dark:border-purple-800/70 text-xs">
                  <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span>Full NTA Standard: <strong>180 Questions • 720 Marks • 3 Hours (180 mins) • +4/-1 Marking</strong></span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-200/60 dark:bg-purple-900 text-purple-800 dark:text-purple-300 font-bold text-[11px]">
                    Physics • Chemistry • Botany • Zoology
                  </span>
                </div>

                {extractionError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{extractionError}</span>
                  </div>
                )}

                {/* Extract Action Button */}
                <button
                  id="btn-extract-paper"
                  disabled={isExtracting || !pdfFile}
                  onClick={handleExtractPaperFromPdf}
                  className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500 disabled:opacity-50 text-white font-black text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isExtracting ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Extracting Questions & Generating Structured 3-Hour Paper...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>Extract & Generate 3-Hour NEET Exam Paper Now</span>
                    </>
                  )}
                </button>

              </div>

            </div>
          )}

          {/* TAB 2: RANDOM QUESTIONS FROM STORED PDFS IN FIREBASE & LOCAL STORAGE */}
          {makerTab === 'random-test' && (
            <div id="section-random-test" className="space-y-4">
              
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-xs font-black uppercase tracking-wider mb-1">
                      <Dices className="w-4 h-4" />
                      <span>Stored PDF Random Practice Engine</span>
                    </div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      Synthesize Random Practice Test from Stored PDF Papers
                    </h2>
                  </div>

                  <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-right shrink-0">
                    <span className="block text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300">Question Pool Available</span>
                    <span className="text-base font-black text-purple-900 dark:text-purple-100">
                      {totalCustomQuestionsCount > 0 ? `${totalCustomQuestionsCount} Extracted Questions` : 'Authentic NTA Pool Ready'}
                    </span>
                  </div>
                </div>

                {/* Form Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Number of Random Questions
                    </label>
                    <select
                      id="select-random-count"
                      value={randomCount}
                      onChange={(e) => setRandomCount(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value={5}>5 Questions (Micro Drill - 10 min)</option>
                      <option value={10}>10 Questions (Quick Review - 20 min)</option>
                      <option value={15}>15 Questions (Speed Test - 30 min)</option>
                      <option value={25}>25 Questions (Chapter Test - 45 min)</option>
                      <option value={45}>45 Questions (Standard Subject Section - 45-60 min)</option>
                      <option value={90}>90 Questions (Half Mock - 90 min)</option>
                      <option value={180}>180 Questions (Full NEET UG Simulation - 3 Hours)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Subject Filter
                    </label>
                    <select
                      id="select-random-subject"
                      value={randomSubject}
                      onChange={(e) => setRandomSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value="All Subjects">All Subjects (Physics + Chem + Botany + Zoo)</option>
                      <option value="Physics">Physics Only</option>
                      <option value="Chemistry">Chemistry Only</option>
                      <option value="Botany">Botany Only</option>
                      <option value="Zoology">Zoology Only</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Test Duration
                    </label>
                    <select
                      id="select-random-duration"
                      value={randomDuration}
                      onChange={(e) => setRandomDuration(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value={180}>3 Hours (180 Minutes)</option>
                      <option value={120}>2 Hours (120 Minutes)</option>
                      <option value={90}>1.5 Hours (90 Minutes)</option>
                      <option value={60}>1 Hour (60 Minutes)</option>
                      <option value={45}>45 Minutes</option>
                      <option value={20}>20 Minutes</option>
                    </select>
                  </div>
                </div>


                <button
                  id="btn-start-random-test"
                  onClick={handleGenerateRandomTest}
                  className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white text-white" />
                  <span>Generate & Start Random Test ({randomCount} Questions • {randomDuration}m)</span>
                </button>

              </div>

            </div>
          )}

          {/* TAB 3: AUTHENTIC PRE-MADE NTA PAPERS */}
          {makerTab === 'pre-made' && (
            <div id="section-pre-made-papers" className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white border border-purple-800/50 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>NTA Official Pattern & Marking (+4 / -1)</span>
                  </div>
                  <h2 className="text-base font-extrabold text-white">
                    Official & Model NEET Mock Test Papers (180 Questions • 720 Marks • 3 Hours)
                  </h2>
                  <p className="text-xs text-purple-200">
                    Solve complete 180-question NEET UG entrance papers with step-by-step NCERT explanations, timers, and instant AIR analysis.
                  </p>
                </div>
              </div>

              {/* Papers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AUTHENTIC_NEET_MOCK_PAPERS.map((paper) => (
                  <div 
                    key={paper.code}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-purple-300 dark:hover:border-purple-700 transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-bold tracking-wider">
                          {paper.code}
                        </span>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-purple-500" /> {paper.durationMinutes}m
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-amber-500" /> {paper.totalMarks} Marks
                          </span>
                        </div>
                      </div>

                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-snug">
                        {paper.examTitle}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {paper.subject}
                      </p>

                      <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold">
                          {paper.questions.length} MCQs
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold text-emerald-600 dark:text-emerald-400">
                          +4 / -1 Marking
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold">
                          NCERT References
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartExam(paper)}
                      className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <Play className="w-4 h-4 fill-white text-white" />
                      <span>Attempt 3-Hour Paper</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* TAB 5: MY STORED PAPERS LIBRARY (FIREBASE & LOCAL STORAGE) */}
          {makerTab === 'my-library' && (
            <div id="section-my-library" className="space-y-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-purple-600" />
                    <span>Your Extracted PDF & Custom Exam Papers</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Stored in Firebase Firestore and LocalStorage for rapid, offline-capable access anytime.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-bold">
                  {customExamPapers.length} Saved Papers
                </span>
              </div>

              {customExamPapers.length === 0 ? (
                <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-center space-y-3">
                  <FileText className="w-10 h-10 text-slate-400 mx-auto" />
                  <h3 className="text-sm font-black text-slate-700 dark:text-slate-200">No Custom PDF Papers Extracted Yet</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Drag and drop your first NEET Question Paper PDF in the "Extract NEET Paper from PDF" tab to store your first exam!
                  </p>
                  <button
                    onClick={() => setMakerTab('pdf-extract')}
                    className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition-all cursor-pointer"
                  >
                    Extract Your First PDF Paper
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customExamPapers.map((paper, pIdx) => (
                    <div
                      key={paper.code || paper.id || `custom-p-${pIdx}`}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-purple-300 dark:hover:border-purple-700 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                            {paper.code || 'CUSTOM-PAPER'}
                          </span>
                          <button
                            onClick={() => deleteCustomExamPaper(paper.code || paper.id || '')}
                            title="Delete exam paper"
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                          {paper.examTitle}
                        </h3>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {paper.subject} • {paper.sourcePdfName ? `Extracted from: ${paper.sourcePdfName}` : 'Custom NEET Test'}
                        </p>

                        <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold">
                            {paper.questions.length} Questions
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-purple-500" /> {paper.durationMinutes || 180}m
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                            {paper.totalMarks} Marks
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartExam(paper)}
                        className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer mt-2"
                      >
                        <Play className="w-4 h-4 fill-white text-white" />
                        <span>Start 3-Hour Exam Paper</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      ) : (

        /* LIVE 3-HOUR EXAM & MODEL SOLUTIONS ENVIRONMENT VIEW */
        <div id="live-exam-workspace" className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in">
          
          <div className="lg:col-span-8 space-y-6">
            
            {/* Exam Header Paper Box */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    Exam Code: {activeExam.code}
                  </span>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1">{activeExam.examTitle}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{activeExam.subject} • Total Marks: {activeExam.totalMarks}</p>
                </div>

                {/* 3-Hour Countdown Timer */}
                {!isExamSubmitted && (
                  <div className="flex items-center gap-2">
                    <div id="timer-box" className="p-3 rounded-2xl bg-slate-950 dark:bg-slate-800 text-white flex items-center gap-3 shrink-0 border border-slate-800 shadow-sm">
                      <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                      <div>
                        <span className="block text-[10px] text-slate-400 font-semibold uppercase">3-Hour Exam Timer</span>
                        <span className="text-base font-black text-white tracking-widest">{formatTime(timeLeft)}</span>
                      </div>
                    </div>
                    {isExamWakeLocked && (
                      <div className="hidden sm:flex items-center gap-1.5 px-3 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold" title="Screen Stay-Awake Active: Display will not turn off during the exam">
                        <SunMedium className="w-4 h-4 text-emerald-500 animate-spin" />
                        <span className="leading-tight">Screen Awake<br/><span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400">No Sleep Mode</span></span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Instructions & Subject Jump Toolbar */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-3">
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 mr-1 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Section Quick Jump:</span>
                  </span>
                  
                  {activeExam.questions.length >= 180 ? (
                    <>
                      <button
                        onClick={() => setCurrentQIndex(0)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          currentQIndex >= 0 && currentQIndex < 45
                            ? 'bg-purple-600 text-white shadow-2xs font-extrabold'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Physics (Q1 - 45)
                      </button>

                      <button
                        onClick={() => setCurrentQIndex(45)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          currentQIndex >= 45 && currentQIndex < 90
                            ? 'bg-purple-600 text-white shadow-2xs font-extrabold'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Chemistry (Q46 - 90)
                      </button>

                      <button
                        onClick={() => setCurrentQIndex(90)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          currentQIndex >= 90 && currentQIndex < 135
                            ? 'bg-purple-600 text-white shadow-2xs font-extrabold'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Botany (Q91 - 135)
                      </button>

                      <button
                        onClick={() => setCurrentQIndex(135)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          currentQIndex >= 135 && currentQIndex < 180
                            ? 'bg-purple-600 text-white shadow-2xs font-extrabold'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Zoology (Q136 - 180)
                      </button>
                    </>
                  ) : (
                    <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                      Active Test Mode • {activeExam.questions.length} Questions Loaded
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Exam Instructions:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {activeExam.instructions.map((inst, i) => (
                      <li key={i}>{inst}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Active Exam Question Card */}
            {(() => {
              const currentQ = activeExam.questions[currentQIndex];
              if (!currentQ) return null;
              const selectedOpt = userAnswers[currentQ.id];

              return (
                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-6">
                  
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-black border border-purple-200/50 dark:border-purple-800">
                      Question {currentQ.qNumber || currentQIndex + 1} of {activeExam.questions.length}
                    </span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      [+{currentQ.marks || 4} / -1 Marks] • Topic: {currentQ.topic || 'NEET Syllabus'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <p className="text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                      {(() => {
                        if (!currentQ.questionText) return '';
                        let str = currentQ.questionText.trim();
                        str = str.replace(/^\[[^\]]+\]\s*/, '');
                        if (str.includes(':')) {
                          const after = str.substring(str.indexOf(':') + 1).trim();
                          if (after.length > 0) str = after;
                        }
                        return str.replace(/^(Question\s*\d+|Q\d+|Q\.\d+)\s*[:.-]?\s*/i, '').trim();
                      })()}
                    </p>
                    
                    {currentQ.codeSnippet && (
                      <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 text-xs font-mono overflow-x-auto border border-slate-800">
                        {currentQ.codeSnippet}
                      </pre>
                    )}
                  </div>

                  {/* MCQ Options */}
                  <div className="space-y-3 pt-2">
                    {currentQ.options.map((opt, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isSelected = selectedOpt === optIdx;
                      const isCorrect = optIdx === currentQ.correctOptionIndex;

                      let btnStyle = 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 hover:bg-purple-50 dark:hover:bg-purple-950/60 hover:border-purple-300 dark:hover:border-purple-600 text-slate-900 dark:text-slate-100';
                      let letterStyle = 'bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 text-slate-800 dark:text-slate-100 font-bold';
                      let textStyle = 'text-slate-900 dark:text-slate-100 font-medium';

                      if (isExamSubmitted) {
                        if (isCorrect) {
                          btnStyle = 'border-emerald-500 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/90 ring-2 ring-emerald-500/40';
                          letterStyle = 'bg-emerald-600 dark:bg-emerald-500 text-white font-bold';
                          textStyle = 'text-emerald-950 dark:text-emerald-100 font-bold';
                        } else if (isSelected && !isCorrect) {
                          btnStyle = 'border-rose-400 dark:border-rose-500 bg-rose-50 dark:bg-rose-950/90 ring-2 ring-rose-400/40';
                          letterStyle = 'bg-rose-600 dark:bg-rose-500 text-white font-bold';
                          textStyle = 'text-rose-950 dark:text-rose-100 font-bold';
                        } else {
                          btnStyle = 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 opacity-60';
                          letterStyle = 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold';
                          textStyle = 'text-slate-700 dark:text-slate-300 font-normal';
                        }
                      } else if (isSelected) {
                        btnStyle = 'border-purple-600 dark:border-purple-500 bg-purple-50 dark:bg-purple-950/90 ring-2 ring-purple-500/40';
                        letterStyle = 'bg-purple-600 dark:bg-purple-500 text-white font-bold';
                        textStyle = 'text-purple-950 dark:text-purple-100 font-bold';
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={selectedOpt !== undefined || isExamSubmitted}
                          onClick={() => {
                            if (selectedOpt !== undefined || isExamSubmitted) return;
                            setUserAnswers(prev => ({ ...prev, [currentQ.id]: optIdx }));
                            if (optIdx === currentQ.correctOptionIndex) {
                              if (activeExam && currentQIndex < activeExam.questions.length - 1) {
                                setTimeout(() => setCurrentQIndex(prev => prev + 1), 550);
                              }
                            }
                          }}
                          className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-3 text-xs sm:text-sm ${btnStyle}`}
                        >
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${letterStyle}`}>
                            {letter}
                          </span>
                          <span className={`pt-0.5 leading-relaxed ${textStyle}`}>
                            {opt}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Post-exam Model Solution */}
                  {isExamSubmitted && (
                    <div className="p-4 rounded-2xl bg-slate-900 dark:bg-slate-950 text-white space-y-2 border border-slate-800 animate-in fade-in">
                      <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">Model Solution & Step-by-Step NCERT Derivation:</p>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{currentQ.detailedSolution}</p>
                    </div>
                  )}

                  {/* Nav controls */}
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
                    <button
                      disabled={currentQIndex === 0}
                      onClick={() => setCurrentQIndex(prev => prev - 1)}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>

                    {currentQIndex < activeExam.questions.length - 1 ? (
                      <button
                        onClick={() => setCurrentQIndex(prev => prev + 1)}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Next Question</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : !isExamSubmitted ? (
                      <button
                        onClick={handleFinishExam}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Submit Exam Paper</span>
                      </button>
                    ) : null}
                  </div>

                </div>
              );
            })()}

            {/* NCERT CHAPTER STUDY PRIORITIZATION SECTION */}
            {isExamSubmitted && (
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-6 animate-in fade-in slide-in-from-bottom-4">
                
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 shrink-0">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[10px] font-bold mb-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>AI Diagnostic Engine</span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        Suggested NCERT Chapters for Next Study Session
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Mapped from your exam mistakes to specific NCERT textbook chapters & high-yield topics.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => analyzeIncorrectAnswers(activeExam, userAnswers)}
                    disabled={isAnalyzingIncorrect}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors flex items-center gap-1.5 shrink-0 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isAnalyzingIncorrect ? 'animate-spin text-purple-600' : ''}`} />
                    <span>Re-Analyze Mistakes</span>
                  </button>
                </div>

                {/* Loading State */}
                {isAnalyzingIncorrect && (
                  <div className="p-8 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/60 text-center space-y-3">
                    <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin mx-auto" />
                    <p className="text-sm font-bold text-purple-950 dark:text-purple-200">
                      Analyzing incorrect answers against NCERT syllabus database...
                    </p>
                    <p className="text-xs text-purple-700 dark:text-purple-400">
                      Extracting chapter page numbers, high-yield diagrams, and recommended revision steps.
                    </p>
                  </div>
                )}

                {/* Analysis Results */}
                {!isAnalyzingIncorrect && ncertAnalysis && (
                  <div className="space-y-6">
                    
                    {/* Diagnostic Overview Banner */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-950 text-white space-y-2 border border-purple-800 shadow-xs">
                      <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                        <Brain className="w-4 h-4 text-amber-400" />
                        <span>Mistake Pattern Analysis & Diagnostic Summary</span>
                      </div>
                      <p className="text-xs sm:text-sm text-purple-100 leading-relaxed font-medium">
                        {ncertAnalysis.summary}
                      </p>
                    </div>

                    {/* Priority Filter & Chapter Count */}
                    {ncertAnalysis.prioritizedChapters.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                            <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span>{ncertAnalysis.prioritizedChapters.length} NCERT Chapter(s) Requiring Attention</span>
                          </span>

                          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                            {(['all', 'urgent', 'high'] as const).map((filter) => (
                              <button
                                key={filter}
                                onClick={() => setActiveAnalysisTab(filter)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer ${
                                  activeAnalysisTab === filter
                                    ? 'bg-purple-600 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                              >
                                {filter}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* List of Prioritized Chapter Cards */}
                        <div className="grid grid-cols-1 gap-4">
                          {ncertAnalysis.prioritizedChapters
                            .filter((ch) => {
                              if (activeAnalysisTab === 'urgent') return ch.priority.toLowerCase() === 'urgent';
                              if (activeAnalysisTab === 'high') return ch.priority.toLowerCase() === 'high';
                              return true;
                            })
                            .map((ch, idx) => {
                              const isSaved = savedChapters[ch.chapterName];
                              const isUrgent = ch.priority.toLowerCase() === 'urgent';

                              return (
                                <div
                                  key={idx}
                                  className={`p-5 rounded-2xl border transition-all space-y-4 ${
                                    isUrgent
                                      ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/10'
                                      : 'border-purple-200/80 dark:border-purple-900/50 bg-slate-50/50 dark:bg-slate-800/40'
                                  }`}
                                >
                                  {/* Chapter Title & Badges */}
                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                          isUrgent
                                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                                            : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                        }`}>
                                          {ch.priority} Priority Focus
                                        </span>

                                        {ch.classLevel && (
                                          <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-bold">
                                            {ch.classLevel}
                                          </span>
                                        )}

                                        {ch.ncertPageRange && (
                                          <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800">
                                            {ch.ncertPageRange}
                                          </span>
                                        )}
                                      </div>

                                      <h4 className="text-base font-black text-slate-900 dark:text-white pt-1">
                                        {ch.chapterName}
                                      </h4>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Subject: <strong className="text-slate-700 dark:text-slate-200">{ch.subject}</strong>
                                        {ch.missedQuestionNumbers && ch.missedQuestionNumbers.length > 0 && (
                                          <span className="ml-2 text-rose-600 dark:text-rose-400 font-semibold">
                                            • Missed Questions: {ch.missedQuestionNumbers.map((q) => `Q${q}`).join(', ')}
                                          </span>
                                        )}
                                      </p>
                                    </div>

                                    {/* Save / Bookmark Button */}
                                    <button
                                      type="button"
                                      onClick={() => handleToggleSaveChapter(ch.chapterName)}
                                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                        isSaved
                                          ? 'bg-emerald-600 text-white shadow-xs'
                                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                      }`}
                                    >
                                      {isSaved ? (
                                        <>
                                          <Check className="w-3.5 h-3.5 text-emerald-100" />
                                          <span>Added to Study Plan</span>
                                        </>
                                      ) : (
                                        <>
                                          <Bookmark className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                          <span>+ Add to Next Study Session</span>
                                        </>
                                      )}
                                    </button>
                                  </div>

                                  {/* Content Grid */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                    
                                    {/* Key Concepts */}
                                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-1.5">
                                      <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-purple-700 dark:text-purple-300">
                                        <ListChecks className="w-3.5 h-3.5 text-purple-600" />
                                        <span>Key Concepts to Revise</span>
                                      </p>
                                      <ul className="space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
                                        {ch.keyConceptsToReview.map((concept, cIdx) => (
                                          <li key={cIdx} className="flex items-start gap-1.5">
                                            <span className="text-purple-500 font-bold">•</span>
                                            <span>{concept}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>

                                    {/* High Yield Diagrams & Action */}
                                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-2">
                                      {ch.highYieldDiagrams && (
                                        <div className="space-y-0.5">
                                          <p className="font-bold text-amber-700 dark:text-amber-400 text-[11px] uppercase tracking-wider flex items-center gap-1">
                                            <Compass className="w-3.5 h-3.5" />
                                            <span>High-Yield Diagram / Table</span>
                                          </p>
                                          <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                                            {ch.highYieldDiagrams}
                                          </p>
                                        </div>
                                      )}

                                      <div className="space-y-0.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                                        <p className="font-bold text-emerald-700 dark:text-emerald-400 text-[11px] uppercase tracking-wider flex items-center gap-1">
                                          <ArrowRight className="w-3.5 h-3.5" />
                                          <span>Recommended Study Action</span>
                                        </p>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                          {ch.recommendedStudyAction}
                                        </p>
                                      </div>
                                    </div>

                                  </div>

                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                        <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">No Major Weakness Found!</h4>
                        <p className="text-xs text-emerald-800 dark:text-emerald-300">
                          You scored 100% on this paper. Keep attempting more full mock tests to maintain your high speed and accuracy!
                        </p>
                      </div>
                    )}

                  </div>
                )}

              </div>
            )}

          </div>

          {/* Right Column: Score Report & Question Palette */}
          <div className="lg:col-span-4 space-y-6">
            
            {examResult && (
              <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900 to-purple-950 text-white shadow-xl space-y-4 border border-purple-800 animate-in zoom-in-95">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-300">Exam Performance Report</span>
                  <Award className="w-6 h-6 text-amber-400" />
                </div>

                <div className="text-center py-2">
                  <span className="text-4xl font-black text-white">{examResult.percentage}%</span>
                  <p className="text-xs text-purple-200 font-semibold mt-1">Grade Earned: <strong className="text-amber-400 font-black text-lg">{examResult.grade}</strong></p>
                  <p className="text-[11px] text-purple-300 mt-0.5">Score: {examResult.score} / {examResult.totalMarks}</p>
                </div>

                <div className="p-3 rounded-xl bg-white/10 text-[11px] text-purple-100 leading-relaxed text-center font-medium">
                  🎉 Excellent work! You earned <strong>+200 XP</strong> for completing this 3-Hour NEET exam simulation.
                </div>
              </div>
            )}

            {/* Question Palette */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Question Palette</h4>
                <span className="text-[11px] text-slate-500 font-semibold">
                  {Object.keys(userAnswers).length} of {activeExam.questions.length} Attempted
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto pr-1">
                {activeExam.questions.map((q, idx) => {
                  const selectedOpt = userAnswers[q.id];
                  const isAns = selectedOpt !== undefined;
                  const isCorrect = selectedOpt === q.correctOptionIndex;
                  const isCur = idx === currentQIndex;

                  let btnStyle = "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700";

                  if (isCur) {
                    btnStyle = "ring-2 ring-purple-600 bg-purple-600 text-white font-extrabold";
                  } else if (isAns) {
                    if (isExamSubmitted) {
                      if (isCorrect) {
                        btnStyle = "bg-emerald-500 text-white font-bold border border-emerald-600";
                      } else {
                        btnStyle = "bg-rose-500 text-white font-bold border border-rose-600";
                      }
                    } else {
                      btnStyle = "bg-purple-700 text-white font-bold border border-purple-800";
                    }
                  }

                  return (
                    <button
                      key={q.id || `q-${idx}`}
                      onClick={() => setCurrentQIndex(idx)}
                      className={`h-9 rounded-xl font-bold text-xs transition-all cursor-pointer ${btnStyle}`}
                    >
                      Q{idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

      )}

    </div>
  );
};
