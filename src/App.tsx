import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { Quiz, UserProfile, MAX_QUIZZES_PER_USER } from './types';
import { 
  getQuizzesByUser, 
  getQuizById, 
  seedStarterQuizzes, 
  deleteQuiz 
} from './lib/quizDbService';
import { getUserProfile } from './lib/userService';
import { STARTER_TEMPLATES, THEME_PRESETS } from './data/presets';
import { generateDefaultQuizSlug } from './lib/quizHelpers';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { QuizBuilder } from './components/QuizBuilder/QuizBuilder';
import { QuizResponsesView } from './components/QuizResponsesView';
import { QuizTaker } from './components/QuizTaker/QuizTaker';
import { AuthScreen } from './components/AuthScreen';
import { UserProfileModal } from './components/UserProfileModal';
import { QuizLimitModal } from './components/QuizLimitModal';
import { AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // App navigation state
  const [currentView, setCurrentView] = useState<'dashboard' | 'builder' | 'responses' | 'taker'>('dashboard');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

  // Direct link respondent state (e.g. ?quiz=abc123xyz)
  const [sharedQuizId, setSharedQuizId] = useState<string | null>(null);
  const [sharedQuiz, setSharedQuiz] = useState<Quiz | null>(null);
  const [sharedQuizLoading, setSharedQuizLoading] = useState(false);
  const [sharedQuizError, setSharedQuizError] = useState<string | null>(null);

  // 1. Detect URL parameter on mount (e.g. ?quiz=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qId = params.get('quiz') || params.get('q');
    if (qId) {
      setSharedQuizId(qId);
      setCurrentView('taker');
      loadSharedQuiz(qId);
    }
  }, []);

  const loadSharedQuiz = async (quizId: string) => {
    try {
      setSharedQuizLoading(true);
      setSharedQuizError(null);
      const found = await getQuizById(quizId);
      if (found) {
        setSharedQuiz(found);
      } else {
        setSharedQuizError('The requested quiz could not be found or has been removed.');
      }
    } catch (err: any) {
      setSharedQuizError('Failed to load quiz. Please try again.');
    } finally {
      setSharedQuizLoading(false);
    }
  };

  // 2. Firebase Auth Listener & Profile loading
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        // Fetch or initialize user profile from Firestore
        try {
          const userProf = await getUserProfile(currentUser.uid);
          if (userProf) {
            setProfile(userProf);
          } else {
            setProfile({
              uid: currentUser.uid,
              displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Creator',
              email: currentUser.email || undefined,
              photoBase64: currentUser.photoURL || undefined,
            });
          }
        } catch (e) {
          console.error('Error fetching user profile:', e);
        }
        loadUserQuizzes(currentUser.uid);
      } else {
        setProfile(null);
        setQuizzes([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch quizzes for active user
  const loadUserQuizzes = async (userId: string) => {
    try {
      setQuizzesLoading(true);
      const userQuizzes = await getQuizzesByUser(userId);
      setQuizzes(userQuizzes);
    } catch (err) {
      console.error('Failed to load user quizzes:', err);
    } finally {
      setQuizzesLoading(false);
    }
  };

  // Seed sample quizzes
  const handleLoadSamples = async () => {
    if (!user) return;
    if (quizzes.length >= MAX_QUIZZES_PER_USER || quizzes.length + 3 > MAX_QUIZZES_PER_USER) {
      setShowLimitModal(true);
      return;
    }
    setQuizzesLoading(true);
    const created = await seedStarterQuizzes(user.uid, user.email || 'creator@damonquiz.local');
    setQuizzes((prev) => [...created, ...prev]);
    setQuizzesLoading(false);
  };

  // Create new quiz
  const handleCreateNewQuiz = (templateIndex?: number) => {
    if (!user) return;
    if (quizzes.length >= MAX_QUIZZES_PER_USER) {
      setShowLimitModal(true);
      return;
    }

    const template = templateIndex !== undefined ? STARTER_TEMPLATES[templateIndex] : null;
    const initialTitle = template ? template.title : 'New Aesthetic Quiz';

    const blankQuiz: Quiz = {
      id: '',
      title: initialTitle,
      customSlug: generateDefaultQuizSlug(initialTitle),
      description: template ? template.description : 'Welcome to this quiz. Please answer the questions carefully.',
      creatorId: user.uid,
      creatorEmail: user.email || '',
      creatorName: profile?.displayName || user.displayName || 'Creator',
      category: template?.category || 'Quiz',
      layout: template ? template.layout : 'step-by-step',
      theme: template ? { ...template.theme } : { ...THEME_PRESETS[0] },
      settings: template ? { ...template.settings } : {
        collectName: true,
        collectEmail: true,
        requireName: true,
        requireEmail: true,
        collectSection: true,
        requireSection: true,
        sectionType: 'free-text',
        sectionOptions: ['Section A', 'Section B', 'Section C'],
        limitOneSubmission: true,
        timeLimitMinutes: null,
        shuffleQuestions: false,
        showScoreImmediately: true,
        allowReview: true,
        passPercentage: 70,
        successTitle: 'Quiz Finished!',
        successMessage: 'Your submission has been recorded. Review your performance below.',
      },
      questions: template
        ? template.questions.map((q) => ({
            ...q,
            id: 'q_' + Math.random().toString(36).substring(2, 9),
            options: q.options
              ? q.options.map((o) => ({
                  ...o,
                  id: 'opt_' + Math.random().toString(36).substring(2, 8),
                }))
              : undefined,
          }))
        : [
            {
              id: 'q_' + Math.random().toString(36).substring(2, 8),
              type: 'multiple-choice',
              title: 'What is your primary goal with this assessment?',
              required: true,
              points: 10,
              options: [
                { id: 'o1', text: 'Evaluate team knowledge', isCorrect: true },
                { id: 'o2', text: 'Collect client feedback', isCorrect: false },
                { id: 'o3', text: 'Engage audience interactively', isCorrect: false },
              ],
              explanation: 'Clear objectives streamline question design and formatting.',
            },
          ],
      status: 'published',
      responseCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setActiveQuiz(blankQuiz);
    setCurrentView('builder');
  };

  // Edit quiz
  const handleEditQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentView('builder');
  };

  // View responses & analytics dashboard for a quiz
  const handleViewResponses = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentView('responses');
  };

  // Delete quiz
  const handleDeleteQuiz = async (quizId: string) => {
    try {
      await deleteQuiz(quizId);
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Test / take quiz
  const handleTakeQuiz = (quizId: string) => {
    const target = quizzes.find((q) => q.id === quizId) || activeQuiz;
    if (target && target.id === quizId) {
      setSharedQuiz(target);
      setCurrentView('taker');
    } else {
      loadSharedQuiz(quizId);
      setCurrentView('taker');
    }
  };

  // 1. Shared direct quiz responder view (?quiz=...)
  if (currentView === 'taker') {
    if (sharedQuizLoading) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-zinc-900 border-t-transparent" />
          <p className="text-sm text-zinc-500 mt-3 font-mono">Loading 𝓓𝓪𝓶𝓸𝓷-𝓠𝓤𝓘𝓩...</p>
        </div>
      );
    }

    if (sharedQuizError || !sharedQuiz) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-4">
          <div className="p-8 max-w-md w-full bg-white border border-zinc-200 rounded-2xl shadow-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900">Quiz Unavailable</h2>
            <p className="text-xs text-zinc-500">{sharedQuizError || 'Quiz not found.'}</p>
            <button
              onClick={() => {
                window.history.pushState({}, '', window.location.pathname);
                setCurrentView('dashboard');
              }}
              className="px-4 py-2 bg-zinc-900 text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              Return to 𝓓𝓪𝓶𝓸𝓷-𝓠𝓤𝓘𝓩 Studio
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="relative">
        {/* Floating top bar allowing creator/user to return to dashboard */}
        <div className="fixed top-3 right-3 z-50 flex items-center gap-2">
          <button
            onClick={() => {
              window.history.pushState({}, '', window.location.pathname);
              setCurrentView('dashboard');
              if (user) loadUserQuizzes(user.uid);
            }}
            className="px-3.5 py-1.5 bg-zinc-900/90 hover:bg-zinc-900 text-white text-xs font-bold rounded-xl backdrop-blur-md shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            <div className="w-5 h-5 rounded-md bg-white p-0.5 overflow-hidden flex items-center justify-center shrink-0">
              <img src="/dq_logo.jpg" alt="D•Q" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <span>𝓓𝓪𝓶𝓸𝓷-𝓠𝓤𝓘𝓩</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <QuizTaker
          quiz={sharedQuiz}
          onSubmissionComplete={() => {
            if (user) loadUserQuizzes(user.uid);
          }}
        />
      </div>
    );
  }

  // 2. Loading state during initial auth check
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-4">
        <div className="inline-block animate-spin rounded-full h-9 w-9 border-3 border-zinc-900 border-t-transparent" />
        <p className="text-xs text-zinc-500 mt-3 font-semibold tracking-wide uppercase">
          Initializing 𝓓𝓪𝓶𝓸𝓷-𝓠𝓤𝓘𝓩...
        </p>
      </div>
    );
  }

  // 3. Mandatory Auth Gate: Before the main screen appears, require auth/login/Google connect
  if (!user) {
    return (
      <AuthScreen
        onAuthSuccess={() => {
          if (auth.currentUser) {
            loadUserQuizzes(auth.currentUser.uid);
          }
        }}
      />
    );
  }

  // 4. Authenticated Main Screen
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        user={user}
        profile={profile}
        currentView={currentView}
        activeQuizTitle={activeQuiz?.title}
        onNavigate={(view) => {
          if (view === 'dashboard' && user) {
            loadUserQuizzes(user.uid);
          }
          setCurrentView(view);
        }}
        onOpenAuth={() => {}}
        onCreateNewQuiz={() => handleCreateNewQuiz()}
        onOpenProfile={() => setShowProfileModal(true)}
      />

      {/* Main Views Container */}
      <div className="flex-1">
        {currentView === 'dashboard' ? (
          <Dashboard
            quizzes={quizzes}
            loading={quizzesLoading}
            onEditQuiz={handleEditQuiz}
            onViewResponses={handleViewResponses}
            onTakeQuiz={handleTakeQuiz}
            onCreateNewQuiz={handleCreateNewQuiz}
            onDeleteQuiz={handleDeleteQuiz}
            onLoadSamples={handleLoadSamples}
          />
        ) : currentView === 'builder' && activeQuiz ? (
          <QuizBuilder
            initialQuiz={activeQuiz}
            userId={user.uid}
            userEmail={user.email || ''}
            creatorName={profile?.displayName || user.displayName || 'Creator'}
            onBack={() => {
              loadUserQuizzes(user.uid);
              setCurrentView('dashboard');
            }}
            onTakeQuiz={handleTakeQuiz}
          />
        ) : currentView === 'responses' && activeQuiz ? (
          <QuizResponsesView
            quiz={activeQuiz}
            onBack={() => {
              loadUserQuizzes(user.uid);
              setCurrentView('dashboard');
            }}
            onTakeQuiz={handleTakeQuiz}
          />
        ) : null}
      </div>

      {/* User Profile & 500x500 Avatar Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        profile={profile}
        onProfileUpdated={(updatedProfile) => {
          setProfile(updatedProfile);
        }}
      />

      {/* Quiz Creation Limit (15) Notification Modal */}
      <QuizLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        currentCount={quizzes.length}
        maxCount={MAX_QUIZZES_PER_USER}
        onManageQuizzes={() => setCurrentView('dashboard')}
      />
    </div>
  );
}

