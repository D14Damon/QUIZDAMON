import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  increment,
  addDoc,
  limit
} from './firebase';
import { Quiz, QuizResponse, MAX_QUIZZES_PER_USER } from '../types';
import { STARTER_TEMPLATES } from '../data/presets';
import { generateDefaultQuizSlug } from './quizHelpers';

// Fetch all quizzes created by a specific user
export async function getQuizzesByUser(userId: string): Promise<Quiz[]> {
  try {
    const q = query(
      collection(db, 'quizzes'),
      where('creatorId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const quizzes: Quiz[] = [];
    snapshot.forEach((docSnap) => {
      quizzes.push({ id: docSnap.id, ...docSnap.data() } as Quiz);
    });
    // Sort descending by createdAt or updatedAt
    quizzes.sort((a, b) => {
      const timeA = a.updatedAt?.toMillis?.() || (typeof a.updatedAt === 'number' ? a.updatedAt : 0);
      const timeB = b.updatedAt?.toMillis?.() || (typeof b.updatedAt === 'number' ? b.updatedAt : 0);
      return timeB - timeA;
    });
    return quizzes;
  } catch (error) {
    console.error('Error fetching quizzes by user:', error);
    return [];
  }
}

// Fetch a single quiz by ID or custom slug (can be accessed by respondents)
export async function getQuizById(quizIdOrSlug: string): Promise<Quiz | null> {
  if (!quizIdOrSlug || !quizIdOrSlug.trim()) return null;
  const cleanParam = quizIdOrSlug.trim();

  try {
    // 1. First attempt: Direct document ID lookup
    const docRef = doc(db, 'quizzes', cleanParam);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Quiz;
    }
  } catch (err1) {
    // If invalid ID format or not found directly, proceed to slug search
  }

  try {
    // 2. Second attempt: Custom slug lookup (e.g. damonquiz-title)
    const slugQuery = query(
      collection(db, 'quizzes'),
      where('customSlug', '==', cleanParam.toLowerCase()),
      limit(1)
    );
    const querySnap = await getDocs(slugQuery);
    if (!querySnap.empty) {
      const docSnap = querySnap.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as Quiz;
    }

    return null;
  } catch (error) {
    console.error('Error fetching quiz by ID or customSlug:', error);
    return null;
  }
}

/**
 * Deeply sanitizes any object or array before sending to Firestore, stripping out
 * all `undefined` fields. Firestore strictly rejects documents with undefined properties
 * with the error: "Function setDoc() called with invalid data. Unsupported field value: undefined".
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === undefined) {
    return null as any;
  }
  if (data === null || typeof data !== 'object') {
    return data;
  }
  if (data instanceof Date) {
    return data;
  }
  // Preserve Firestore Sentinel FieldValues (serverTimestamp(), increment(), etc.)
  if ('_methodName' in (data as any) || typeof (data as any).isEqual === 'function') {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => cleanForFirestore(item)) as any;
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      clean[key] = cleanForFirestore(value);
    }
  }
  return clean as T;
}

// Save or Update a quiz (Enforces max 15 quizzes limit for creators)
export async function saveQuiz(quiz: Partial<Quiz> & { id?: string; creatorId: string }): Promise<string> {
  try {
    const sanitizedSlug = quiz.customSlug 
      ? quiz.customSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
      : (quiz.title ? generateDefaultQuizSlug(quiz.title) : undefined);

    if (quiz.id) {
      const docRef = doc(db, 'quizzes', quiz.id);
      const updatePayload: Record<string, any> = {
        ...quiz,
        updatedAt: serverTimestamp(),
      };
      if (sanitizedSlug) {
        updatePayload.customSlug = sanitizedSlug;
      }
      await updateDoc(docRef, cleanForFirestore(updatePayload));
      return quiz.id;
    } else {
      // Check current quiz count for this user
      const existingQuizzes = await getQuizzesByUser(quiz.creatorId);
      if (existingQuizzes.length >= MAX_QUIZZES_PER_USER) {
        throw new Error(`Quiz creation limit reached: you already have ${existingQuizzes.length} of ${MAX_QUIZZES_PER_USER} quizzes. Please delete some of your existing quizzes before creating a new one.`);
      }

      const colRef = collection(db, 'quizzes');
      const docRef = doc(colRef);
      const newQuizData = {
        ...quiz,
        id: docRef.id,
        customSlug: sanitizedSlug || generateDefaultQuizSlug(quiz.title || 'untitled-quiz'),
        responseCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(docRef, cleanForFirestore(newQuizData));
      return docRef.id;
    }
  } catch (error) {
    console.error('Error saving quiz:', error);
    throw error;
  }
}

// Update just the custom slug for an existing quiz
export async function updateQuizCustomSlug(quizId: string, customSlug: string): Promise<string> {
  try {
    const cleanSlug = customSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
    const docRef = doc(db, 'quizzes', quizId);
    await updateDoc(docRef, {
      customSlug: cleanSlug,
      updatedAt: serverTimestamp(),
    });
    return cleanSlug;
  } catch (error) {
    console.error('Error updating quiz custom slug:', error);
    throw error;
  }
}

// Delete a quiz
export async function deleteQuiz(quizId: string): Promise<void> {
  try {
    const docRef = doc(db, 'quizzes', quizId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting quiz:', error);
    throw error;
  }
}

// Check if a specific email has already submitted this quiz
export async function checkEmailAlreadySubmitted(quizId: string, email: string): Promise<boolean> {
  if (!email || !email.trim()) return false;
  try {
    const key = `${quizId}_${email.trim().toLowerCase().replace(/[^a-z0-9@._-]/g, '_')}`;
    const subDoc = await getDoc(doc(db, 'quiz_submissions', key));
    return subDoc.exists();
  } catch (err) {
    console.warn('Error checking existing submission in Firestore:', err);
    return false;
  }
}

// Submit a quiz response
export async function submitQuizResponse(
  quizId: string,
  responseData: Omit<QuizResponse, 'id' | 'submittedAt'>
): Promise<string> {
  try {
    // 1. Add to top-level 'responses' collection
    const colRef = collection(db, 'responses');
    const docRef = await addDoc(colRef, cleanForFirestore({
      ...responseData,
      quizId,
      submittedAt: serverTimestamp(),
    }));

    // 2. If email is provided, record to quiz_submissions to lock 1-submission-per-user
    if (responseData.respondentEmail && responseData.respondentEmail.trim()) {
      try {
        const key = `${quizId}_${responseData.respondentEmail.trim().toLowerCase().replace(/[^a-z0-9@._-]/g, '_')}`;
        await setDoc(doc(db, 'quiz_submissions', key), cleanForFirestore({
          quizId,
          email: responseData.respondentEmail.trim().toLowerCase(),
          respondentName: responseData.respondentName || 'Anonymous',
          respondentSection: responseData.respondentSection || '',
          score: responseData.totalScore,
          percentage: responseData.percentage,
          submittedAt: serverTimestamp(),
        }));
      } catch (lockErr) {
        console.warn('Could not record quiz_submissions lock:', lockErr);
      }
    }

    // 3. Increment response count on the quiz document
    try {
      const quizRef = doc(db, 'quizzes', quizId);
      await updateDoc(quizRef, {
        responseCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Could not increment quiz responseCount:', e);
    }

    return docRef.id;
  } catch (error) {
    console.error('Error submitting response:', error);
    throw error;
  }
}

// Fetch all responses for a quiz (for the creator dashboard)
export async function getQuizResponses(quizId: string): Promise<QuizResponse[]> {
  try {
    const responsesMap = new Map<string, QuizResponse>();

    // 1. Fetch from top-level 'responses' collection
    try {
      const q = query(
        collection(db, 'responses'),
        where('quizId', '==', quizId)
      );
      const snapshot = await getDocs(q);
      snapshot.forEach((docSnap) => {
        responsesMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() } as QuizResponse);
      });
    } catch (e1) {
      console.warn('Error querying responses collection:', e1);
    }

    // 2. Also check subcollection quizzes/{quizId}/responses if any were stored there
    try {
      const subCol = collection(db, 'quizzes', quizId, 'responses');
      const subSnapshot = await getDocs(subCol);
      subSnapshot.forEach((docSnap) => {
        if (!responsesMap.has(docSnap.id)) {
          responsesMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() } as QuizResponse);
        }
      });
    } catch (e2) {
      // Subcollection might not exist, ignore
    }

    const responses = Array.from(responsesMap.values());

    // Sort by submittedAt descending
    responses.sort((a, b) => {
      const timeA = a.submittedAt?.toMillis?.() || (typeof a.submittedAt === 'number' ? a.submittedAt : 0);
      const timeB = b.submittedAt?.toMillis?.() || (typeof b.submittedAt === 'number' ? b.submittedAt : 0);
      return timeB - timeA;
    });

    return responses;
  } catch (error) {
    console.error('Error fetching quiz responses:', error);
    return [];
  }
}

// Seed up to 3 aesthetic starter templates without ever exceeding MAX_QUIZZES_PER_USER (15)
export async function seedStarterQuizzes(userId: string, userEmail: string): Promise<Quiz[]> {
  try {
    const existing = await getQuizzesByUser(userId);
    const slotsRemaining = MAX_QUIZZES_PER_USER - existing.length;
    if (slotsRemaining <= 0) {
      throw new Error(`Limit reached: maximum ${MAX_QUIZZES_PER_USER} quizzes allowed per user.`);
    }

    const countToSeed = Math.min(3, slotsRemaining);
    const created: Quiz[] = [];

    for (let i = 0; i < countToSeed; i++) {
      const template = STARTER_TEMPLATES[i];
      const colRef = collection(db, 'quizzes');
      const docRef = doc(colRef);
      const newQuiz: Quiz = {
        ...template,
        id: docRef.id,
        creatorId: userId,
        creatorEmail: userEmail,
        customSlug: generateDefaultQuizSlug(template.title),
        questions: template.questions.map((q) => ({
          ...q,
          id: 'q_' + Math.random().toString(36).substring(2, 9),
          options: q.options?.map((o) => ({
            ...o,
            id: 'opt_' + Math.random().toString(36).substring(2, 8),
          })),
        })),
        responseCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(docRef, cleanForFirestore({
        ...newQuiz,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }));
      created.push(newQuiz);
    }
    return created;
  } catch (err) {
    console.error('Error seeding starter quizzes:', err);
    throw err;
  }
}
