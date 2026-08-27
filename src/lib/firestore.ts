import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  onSnapshot, 
  query, 
  serverTimestamp,
  deleteDoc,
  where
} from 'firebase/firestore';
import { getDb } from './firebase';
import { UserProfile, StudentRecord, MCQPracticeSet, UploadedPdfRecord, MockExamPaper } from '../types';

/**
 * Saves a practice set under the specific user's Firestore collection.
 */
export async function savePracticeSetToFirestore(userId: string, practiceSet: MCQPracticeSet): Promise<boolean> {
  try {
    const db = getDb();
    const docKey = practiceSet.id || `set-${Date.now()}`;
    const userSetRef = doc(db, 'users', userId, 'practiceSets', docKey);
    const globalSetRef = doc(db, 'practice_sets', docKey);

    const payload = {
      ...practiceSet,
      userId,
      updatedAt: serverTimestamp(),
    };

    await setDoc(userSetRef, payload, { merge: true });
    await setDoc(globalSetRef, payload, { merge: true });
    return true;
  } catch (error) {
    console.warn('Firestore save practice set note:', error);
    return false;
  }
}

/**
 * Subscribes to practice sets for a specific user ID.
 */
export function subscribeToUserPracticeSets(
  userId: string,
  onUpdate: (sets: MCQPracticeSet[]) => void
): () => void {
  try {
    const db = getDb();
    const setsCol = collection(db, 'users', userId, 'practiceSets');

    const unsubscribe = onSnapshot(setsCol, (snapshot) => {
      const sets: MCQPracticeSet[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        sets.push({
          id: docSnap.id,
          title: data.title || 'Practice Set',
          subject: data.subject || 'General',
          sourceType: data.sourceType || 'Generated',
          dateCreated: data.dateCreated || new Date().toLocaleDateString(),
          questions: data.questions || [],
          score: data.score,
          completed: data.completed,
          userId: data.userId || userId,
          userEmail: data.userEmail
        });
      });
      onUpdate(sets);
    }, (err) => {
      console.warn('User practice sets listener note:', err);
    });

    return unsubscribe;
  } catch (error) {
    console.warn('Failed to subscribe to user practice sets:', error);
    return () => {};
  }
}

/**
 * Saves an uploaded PDF record to Firestore for Owner inspection.
 */
export async function saveUploadedPdfToFirestore(pdfData: UploadedPdfRecord): Promise<boolean> {
  try {
    const db = getDb();
    const docRef = doc(db, 'uploaded_pdfs', pdfData.id);
    await setDoc(docRef, {
      ...pdfData,
      createdAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.warn('Firestore save uploaded PDF note:', error);
    return false;
  }
}

/**
 * Subscribes to all uploaded PDFs across all students for the Owner ID dashboard.
 */
export function subscribeToUploadedPdfsFromFirestore(
  onUpdate: (pdfs: UploadedPdfRecord[]) => void
): () => void {
  try {
    const db = getDb();
    const pdfsCol = collection(db, 'uploaded_pdfs');

    const unsubscribe = onSnapshot(pdfsCol, (snapshot) => {
      const pdfs: UploadedPdfRecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        pdfs.push({
          id: docSnap.id,
          fileName: data.fileName || 'Document.pdf',
          fileSize: data.fileSize || '1.2 MB',
          uploadedByUserId: data.uploadedByUserId || 'unknown',
          uploadedByName: data.uploadedByName || 'Student',
          uploadedByEmail: data.uploadedByEmail || 'student@neet.edu.in',
          uploadedAt: data.uploadedAt || new Date().toLocaleString(),
          subject: data.subject || 'General',
          selectedChapters: data.selectedChapters || [],
          numQuestionsExtracted: data.numQuestionsExtracted || 0,
          snippetPreview: data.snippetPreview || '',
          status: data.status || 'Extracted'
        });
      });
      // Sort newest first
      pdfs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      onUpdate(pdfs);
    }, (err) => {
      console.warn('Uploaded PDFs listener note:', err);
    });

    return unsubscribe;
  } catch (error) {
    console.warn('Failed to subscribe to uploaded PDFs:', error);
    return () => {};
  }
}

/**
 * Deletes an uploaded PDF record from Firestore.
 */
export async function deleteUploadedPdfFromFirestore(pdfId: string): Promise<boolean> {
  try {
    const db = getDb();
    await deleteDoc(doc(db, 'uploaded_pdfs', pdfId));
    return true;
  } catch (error) {
    console.warn('Error deleting uploaded PDF:', error);
    return false;
  }
}

/**
 * Saves or updates a user profile in Firestore under the 'users' collection.
 * Uses email (lowercased) as document key for reliable lookup.
 */
export async function saveUserProfileToFirestore(profile: UserProfile): Promise<boolean> {
  try {
    const db = getDb();
    const docKey = profile.email.toLowerCase().replace(/[^a-z0-9@._-]/g, '_');
    const userRef = doc(db, 'users', docKey);
    
    await setDoc(userRef, {
      ...profile,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    // Also update/sync to 'students' collection if student role
    if (profile.role === 'student') {
      const studentRef = doc(db, 'students', docKey);
      const studentData: StudentRecord = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        enrolledSubjects: profile.enrolledSubjects || ['NEET Physics', 'NEET Chemistry', 'NEET Botany', 'NEET Zoology'],
        status: 'Active',
        accuracyRate: profile.overallAccuracy ?? 0,
        testsCompleted: profile.totalQuestionsSolved || 0,
        joinDate: 'Recent',
        lastActive: 'Just Now',
      };
      await setDoc(studentRef, {
        ...studentData,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    return true;
  } catch (error) {
    console.warn('Firestore sync note:', error);
    return false;
  }
}

/**
 * Fetches a user profile from Firestore by email.
 * Multi-layer lookup ensures accounts present in 'users' or 'students' are always matched.
 */
export async function fetchUserProfileFromFirestore(email: string): Promise<UserProfile | null> {
  try {
    const db = getDb();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return null;

    const docKey = cleanEmail.replace(/[^a-z0-9@._-]/g, '_');

    // 1. Try sanitized docKey in 'users'
    let userRef = doc(db, 'users', docKey);
    let snap = await getDoc(userRef);

    // 2. Try raw email as doc ID in 'users'
    if (!snap.exists()) {
      userRef = doc(db, 'users', cleanEmail);
      snap = await getDoc(userRef);
    }

    // 3. Query 'users' collection by email field
    if (!snap.exists()) {
      try {
        const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          snap = qSnap.docs[0];
        }
      } catch (e) {
        // ignore query errors
      }
    }

    // 4. Fallback: Check 'students' collection
    if (!snap.exists()) {
      let studentRef = doc(db, 'students', docKey);
      snap = await getDoc(studentRef);
      if (!snap.exists()) {
        studentRef = doc(db, 'students', cleanEmail);
        snap = await getDoc(studentRef);
      }
      if (!snap.exists()) {
        try {
          const qStud = query(collection(db, 'students'), where('email', '==', cleanEmail));
          const qSnapStud = await getDocs(qStud);
          if (!qSnapStud.empty) {
            snap = qSnapStud.docs[0];
          }
        } catch (e) {
          // ignore query errors
        }
      }
    }

    if (snap.exists()) {
      const data = snap.data();
      const userRole = data.role || (cleanEmail === 'vaibhavvarshney.in@gmail.com' || cleanEmail.includes('admin') ? 'owner' : 'student');
      return {
        id: data.id || snap.id || `usr-${Date.now()}`,
        name: data.name || cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'NEET Aspirant',
        email: data.email || cleanEmail,
        role: userRole,
        avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
        enrolledSubjects: data.enrolledSubjects || ['NEET Physics', 'NEET Chemistry', 'NEET Botany', 'NEET Zoology'],
        targetExams: data.targetExams || [{ name: 'NEET UG Official Entrance Exam', date: 'May 03', daysLeft: 42 }],
        studyStreak: data.studyStreak || 0,
        overallAccuracy: data.overallAccuracy ?? data.accuracyRate ?? 0,
        totalQuestionsSolved: data.totalQuestionsSolved || data.testsCompleted || 0,
        studyHoursThisWeek: data.studyHoursThisWeek || 5,
      };
    }
    return null;
  } catch (error) {
    console.warn('Unable to fetch user from Firestore:', error);
    return null;
  }
}

/**
 * Fetches all registered student records from Firestore.
 */
export async function fetchAllStudentsFromFirestore(): Promise<StudentRecord[]> {
  try {
    const db = getDb();
    const studentsCol = collection(db, 'students');
    const snapshot = await getDocs(studentsCol);

    const students: StudentRecord[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      students.push({
        id: data.id || docSnap.id,
        name: data.name || 'Student',
        email: data.email || '',
        role: data.role || 'student',
        enrolledSubjects: data.enrolledSubjects || ['NEET Physics', 'NEET Chemistry', 'NEET Botany', 'NEET Zoology'],
        status: data.status || 'Active',
        accuracyRate: data.accuracyRate ?? data.overallAccuracy ?? 0,
        testsCompleted: data.testsCompleted ?? 0,
        joinDate: data.joinDate || 'Recently Registered',
        lastActive: data.lastActive || 'Online Now',
      });
    });

    return students;
  } catch (error) {
    console.warn('Unable to fetch students list from Firestore:', error);
    return [];
  }
}

/**
 * Sets up a realtime snapshot listener for the 'students' collection in Firestore.
 */
export function subscribeToStudentsFromFirestore(
  onUpdate: (students: StudentRecord[]) => void
): () => void {
  try {
    const db = getDb();
    const studentsCol = collection(db, 'students');
    const q = query(studentsCol);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const students: StudentRecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        students.push({
          id: data.id || docSnap.id,
          name: data.name || 'Student',
          email: data.email || '',
          role: data.role || 'student',
          enrolledSubjects: data.enrolledSubjects || ['NEET Physics', 'NEET Chemistry', 'NEET Botany', 'NEET Zoology'],
          status: data.status || 'Active',
          accuracyRate: data.accuracyRate ?? data.overallAccuracy ?? 0,
          testsCompleted: data.testsCompleted ?? 0,
          joinDate: data.joinDate || 'Recently Registered',
          lastActive: data.lastActive || 'Online Now',
        });
      });
      onUpdate(students);
    }, (err) => {
      console.warn('Firestore real-time listener notice:', err);
    });

    return unsubscribe;
  } catch (error) {
    console.warn('Failed to attach Firestore real-time listener:', error);
    return () => {};
  }
}

/**
 * Deletes a student record and associated user profile from Firestore.
 */
export async function deleteStudentFromFirestore(email?: string, id?: string): Promise<boolean> {
  try {
    const db = getDb();
    const deletePromises: Promise<void>[] = [];

    const normalizedEmail = email ? email.toLowerCase().trim() : '';
    const normalizedId = id ? id.trim() : '';

    if (normalizedEmail) {
      const docKey = normalizedEmail.replace(/[^a-z0-9@._-]/g, '_');
      deletePromises.push(deleteDoc(doc(db, 'students', docKey)).catch(() => {}));
      deletePromises.push(deleteDoc(doc(db, 'users', docKey)).catch(() => {}));
      deletePromises.push(deleteDoc(doc(db, 'students', normalizedEmail)).catch(() => {}));
      deletePromises.push(deleteDoc(doc(db, 'users', normalizedEmail)).catch(() => {}));
    }

    if (normalizedId) {
      deletePromises.push(deleteDoc(doc(db, 'students', normalizedId)).catch(() => {}));
      deletePromises.push(deleteDoc(doc(db, 'users', normalizedId)).catch(() => {}));
    }

    // Query collections directly to catch any matching docs by email or id
    try {
      const [studentsSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'users'))
      ]);

      studentsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const docEmail = (data.email || '').toString().toLowerCase().trim();
        const docId = (data.id || '').toString().trim();
        const docRefId = docSnap.id.toLowerCase().trim();

        if (
          (normalizedEmail && (docEmail === normalizedEmail || docRefId === normalizedEmail || docRefId === normalizedEmail.replace(/[^a-z0-9@._-]/g, '_'))) ||
          (normalizedId && (docId === normalizedId || docRefId === normalizedId.toLowerCase()))
        ) {
          deletePromises.push(deleteDoc(docSnap.ref).catch(() => {}));
        }
      });

      usersSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const docEmail = (data.email || '').toString().toLowerCase().trim();
        const docId = (data.id || '').toString().trim();
        const docRefId = docSnap.id.toLowerCase().trim();

        if (
          (normalizedEmail && (docEmail === normalizedEmail || docRefId === normalizedEmail || docRefId === normalizedEmail.replace(/[^a-z0-9@._-]/g, '_'))) ||
          (normalizedId && (docId === normalizedId || docRefId === normalizedId.toLowerCase()))
        ) {
          deletePromises.push(deleteDoc(docSnap.ref).catch(() => {}));
        }
      });
    } catch (e) {
      console.warn('Collection scan for delete notice:', e);
    }

    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.warn('Unable to delete student from Firestore:', error);
    return false;
  }
}

/**
 * Saves an extracted / custom NEET exam paper to Firestore.
 */
export async function saveCustomExamPaperToFirestore(
  paper: MockExamPaper,
  userId?: string,
  userEmail?: string
): Promise<boolean> {
  try {
    const db = getDb();
    const docKey = paper.code || paper.id || `exam-${Date.now()}`;
    const globalPaperRef = doc(db, 'custom_exam_papers', docKey);

    const payload = {
      ...paper,
      id: docKey,
      uploadedByEmail: userEmail || paper.uploadedByEmail || '',
      updatedAt: serverTimestamp(),
      createdAt: paper.createdAt || new Date().toISOString(),
    };

    await setDoc(globalPaperRef, payload, { merge: true });

    if (userId) {
      const userExamRef = doc(db, 'users', userId, 'customExams', docKey);
      await setDoc(userExamRef, payload, { merge: true });
    }

    return true;
  } catch (error) {
    console.warn('Firestore save custom exam paper note:', error);
    return false;
  }
}

/**
 * Subscribes to custom exam papers from Firestore.
 */
export function subscribeToCustomExamPapers(
  onUpdate: (papers: MockExamPaper[]) => void
): () => void {
  try {
    const db = getDb();
    const papersCol = collection(db, 'custom_exam_papers');

    const unsubscribe = onSnapshot(
      papersCol,
      (snapshot) => {
        const papers: MockExamPaper[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          papers.push({
            id: docSnap.id,
            examTitle: data.examTitle || 'Extracted NEET Mock Exam',
            subject: data.subject || 'Full NTA NEET UG Syllabus',
            code: data.code || docSnap.id,
            durationMinutes: data.durationMinutes || 180,
            totalMarks: data.totalMarks || (data.questions ? data.questions.length * 4 : 720),
            instructions: data.instructions || [
              'This test contains extracted NEET questions (+4 / -1 Marking).',
              'Total duration is 180 minutes.'
            ],
            questions: data.questions || [],
            createdAt: data.createdAt || '',
            uploadedByEmail: data.uploadedByEmail || '',
            sourcePdfName: data.sourcePdfName || '',
            isUserUploaded: true
          });
        });
        // Sort newest first
        papers.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        onUpdate(papers);
      },
      (err) => {
        console.warn('Custom exam papers listener note:', err);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.warn('Failed to subscribe to custom exam papers:', error);
    return () => {};
  }
}

/**
 * Deletes a custom exam paper from Firestore.
 */
export async function deleteCustomExamPaperFromFirestore(paperCodeOrId: string, userId?: string): Promise<boolean> {
  try {
    const db = getDb();
    await deleteDoc(doc(db, 'custom_exam_papers', paperCodeOrId));
    if (userId) {
      await deleteDoc(doc(db, 'users', userId, 'customExams', paperCodeOrId)).catch(() => {});
    }
    return true;
  } catch (error) {
    console.warn('Unable to delete custom exam paper from Firestore:', error);
    return false;
  }
}

