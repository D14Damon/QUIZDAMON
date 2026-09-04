import React, { useState, useEffect, useRef } from 'react';
import { Quiz, Question } from '../../types';
import { calculateQuizResults } from '../../lib/quizHelpers';
import { submitQuizResponse, checkEmailAlreadySubmitted } from '../../lib/quizDbService';
import confetti from 'canvas-confetti';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Clock, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  RotateCcw,
  Star,
  Award,
  ChevronRight,
  Send,
  EyeOff,
  Lock,
  Loader2
} from 'lucide-react';

interface QuizTakerProps {
  quiz: Quiz;
  isPreviewMode?: boolean;
  onExitPreview?: () => void;
  onSubmissionComplete?: () => void;
}

export const QuizTaker: React.FC<QuizTakerProps> = ({
  quiz,
  isPreviewMode = false,
  onExitPreview,
  onSubmissionComplete,
}) => {
  // Step tracker (0 = Welcome/Identity, 1..N = questions in step-by-step, N+1 = submitted)
  const [currentStep, setCurrentStep] = useState(0);
  const [respondentName, setRespondentName] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [respondentSection, setRespondentSection] = useState(
    quiz.settings.sectionType === 'dropdown' && quiz.settings.sectionOptions && quiz.settings.sectionOptions.length > 0
      ? quiz.settings.sectionOptions[0]
      : ''
  );
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSubmission, setIsCheckingSubmission] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState<ReturnType<typeof calculateQuizResults> | null>(null);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number | null>(
    quiz.settings.timeLimitMinutes ? quiz.settings.timeLimitMinutes * 60 : null
  );

  // Check if device already submitted this quiz
  const [existingSubmission, setExistingSubmission] = useState<{
    submittedAt: string;
    name?: string;
    section?: string;
    email?: string;
    totalScore?: number;
    maxScore?: number;
    percentage?: number;
    isPassed?: boolean;
  } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || isPreviewMode) return;
    if (quiz.settings.limitOneSubmission !== false) {
      try {
        const stored = localStorage.getItem(`damon_quiz_sub_${quiz.id}`);
        if (stored) {
          setExistingSubmission(JSON.parse(stored));
        }
      } catch (e) {}
    }
  }, [quiz.id, isPreviewMode, quiz.settings.limitOneSubmission]);

  const timerRef = useRef<any>(null);

  // Fonts class resolver
  const fontClass = 
    quiz.theme.fontFamily === 'editorial' ? 'font-editorial' :
    quiz.theme.fontFamily === 'friendly' ? 'font-friendly' :
    quiz.theme.fontFamily === 'tech' ? 'font-tech' :
    quiz.theme.fontFamily === 'code' ? 'font-code' : 'font-modern';

  // Pattern class resolver
  const patternClass = 
    quiz.theme.pattern === 'dots' ? 'pattern-dots' :
    quiz.theme.pattern === 'grid' ? 'pattern-grid' :
    quiz.theme.pattern === 'mesh' ? 'pattern-mesh' : '';

  // Rounded class resolver
  const roundedClass = 
    quiz.theme.borderRadius === 'none' ? 'rounded-none' :
    quiz.theme.borderRadius === 'pill' ? 'rounded-3xl' : 'rounded-2xl';

  // Timer countdown
  useEffect(() => {
    if (isSubmitted) return;
    timerRef.current = setInterval(() => {
      setTimeSpentSeconds((prev) => prev + 1);
      setTimeRemainingSeconds((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleForceSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isSubmitted]);

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  // Keyboard navigation for step-by-step
  useEffect(() => {
    if (quiz.layout !== 'step-by-step' || isSubmitted || currentStep === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter to go to next question
      if (e.key === 'Enter' && !e.shiftKey) {
        const activeQ = quiz.questions[currentStep - 1];
        if (activeQ && activeQ.type !== 'long-text') {
          e.preventDefault();
          handleNextStep();
        }
      }
      // Keys 1..9 for multiple choice
      const activeQ = quiz.questions[currentStep - 1];
      if (activeQ && (activeQ.type === 'multiple-choice' || activeQ.type === 'true-false') && activeQ.options) {
        const num = parseInt(e.key);
        if (!isNaN(num) && num >= 1 && num <= activeQ.options.length) {
          const selectedOption = activeQ.options[num - 1];
          handleOptionSelect(activeQ.id, selectedOption.id, false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, quiz.layout, answers, isSubmitted]);

  const handleOptionSelect = (qId: string, value: any, isMultipleSelect: boolean) => {
    setValidationError(null);
    if (isMultipleSelect) {
      const currentList: string[] = Array.isArray(answers[qId]) ? answers[qId] : [];
      if (currentList.includes(value)) {
        setAnswers({ ...answers, [qId]: currentList.filter((item) => item !== value) });
      } else {
        setAnswers({ ...answers, [qId]: [...currentList, value] });
      }
    } else {
      setAnswers({ ...answers, [qId]: value });
    }
  };

  // Step transitions
  const handleStartQuiz = async () => {
    if (existingSubmission && quiz.settings.limitOneSubmission !== false) {
      setValidationError('You have already submitted this quiz. Only 1 submission is allowed per person.');
      return;
    }
    if (quiz.settings.collectName && quiz.settings.requireName && !respondentName.trim()) {
      setValidationError('Please enter your name to begin.');
      return;
    }
    if ((quiz.settings.collectSection ?? true) && (quiz.settings.requireSection ?? true) && !respondentSection.trim()) {
      setValidationError('Please enter or select your section / class group to begin.');
      return;
    }
    if (quiz.settings.collectEmail && quiz.settings.requireEmail && !respondentEmail.trim()) {
      setValidationError('Please enter your email address to begin.');
      return;
    }
    if (respondentEmail.trim() && !respondentEmail.includes('@')) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    // Check allowed emails restriction
    if (quiz.settings.restrictToAllowedEmails && quiz.settings.allowedEmails && quiz.settings.allowedEmails.length > 0) {
      const normalizedEmail = respondentEmail.trim().toLowerCase();
      const isAllowed = quiz.settings.allowedEmails.some((em) => em.trim().toLowerCase() === normalizedEmail);
      if (!isAllowed) {
        setValidationError('This email is not authorized to take this quiz. Please use your registered email address.');
        return;
      }
    }

    // Check 1 submission limit in Firestore if email provided
    if (quiz.settings.limitOneSubmission !== false && respondentEmail.trim() && !isPreviewMode) {
      setIsCheckingSubmission(true);
      try {
        const alreadySubmitted = await checkEmailAlreadySubmitted(quiz.id, respondentEmail.trim());
        if (alreadySubmitted) {
          setValidationError('This email address has already submitted this quiz. Multiple submissions are disabled.');
          setIsCheckingSubmission(false);
          return;
        }
      } catch (e) {
        console.warn('Submission check error:', e);
      } finally {
        setIsCheckingSubmission(false);
      }
    }

    setValidationError(null);
    setCurrentStep(1);
  };

  const handleNextStep = () => {
    const activeQ = quiz.questions[currentStep - 1];
    if (activeQ && activeQ.required) {
      const ans = answers[activeQ.id];
      if (ans === undefined || ans === null || ans === '' || (Array.isArray(ans) && ans.length === 0)) {
        setValidationError('This question is required before advancing.');
        return;
      }
    }
    setValidationError(null);

    if (currentStep < quiz.questions.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final submission
      handleSubmit();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setValidationError(null);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleForceSubmit = () => {
    handleSubmit();
  };

  // Submission handler
  const handleSubmit = async () => {
    // Validate required questions (crucial for single-page layout)
    if (quiz.layout === 'single-page') {
      if (quiz.settings.collectName && quiz.settings.requireName && !respondentName.trim()) {
        setValidationError('Please provide your name.');
        return;
      }
      if ((quiz.settings.collectSection ?? true) && (quiz.settings.requireSection ?? true) && !respondentSection.trim()) {
        setValidationError('Please provide your section / class group.');
        return;
      }
      if (quiz.settings.collectEmail && quiz.settings.requireEmail && !respondentEmail.trim()) {
        setValidationError('Please provide your email address.');
        return;
      }
      for (let i = 0; i < quiz.questions.length; i++) {
        const q = quiz.questions[i];
        if (q.required) {
          const val = answers[q.id];
          if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
            setValidationError(`Please answer question ${i + 1}: "${q.title}"`);
            return;
          }
        }
      }
    }

    setIsSubmitting(true);
    const calculated = calculateQuizResults(quiz, answers);
    setResults(calculated);

    if (!isPreviewMode) {
      try {
        await submitQuizResponse(quiz.id, {
          quizId: quiz.id,
          creatorId: quiz.creatorId,
          quizTitle: quiz.title,
          respondentName: respondentName.trim() || 'Anonymous Respondent',
          respondentEmail: respondentEmail.trim() || undefined,
          respondentSection: respondentSection.trim() || undefined,
          answers,
          evaluatedAnswers: calculated.evaluatedAnswers,
          totalScore: calculated.totalScore,
          maxScore: calculated.maxScore,
          percentage: calculated.percentage,
          isPassed: calculated.isPassed,
          timeSpentSeconds,
        });

        // Store local submission record to enforce 1-submission limit
        if (quiz.settings.limitOneSubmission !== false) {
          const rec = {
            submittedAt: new Date().toLocaleString(),
            name: respondentName.trim() || 'Anonymous',
            section: respondentSection.trim() || undefined,
            email: respondentEmail.trim() || undefined,
            totalScore: calculated.totalScore,
            maxScore: calculated.maxScore,
            percentage: calculated.percentage,
            isPassed: calculated.isPassed,
          };
          try {
            localStorage.setItem(`damon_quiz_sub_${quiz.id}`, JSON.stringify(rec));
          } catch (e) {}
          setExistingSubmission(rec);
        }
      } catch (err) {
        console.error('Error recording submission:', err);
      }
    }

    setIsSubmitting(false);
    setIsSubmitted(true);

    // Fire celebratory confetti if completed or passed
    try {
      confetti({
        particleCount: calculated.isPassed ? 100 : 50,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    onSubmissionComplete?.();
  };

  const restartQuiz = () => {
    setAnswers({});
    setCurrentStep(0);
    setIsSubmitted(false);
    setResults(null);
    setTimeSpentSeconds(0);
    setTimeRemainingSeconds(
      quiz.settings.timeLimitMinutes ? quiz.settings.timeLimitMinutes * 60 : null
    );
  };

  // Render question card contents
  const renderQuestionInput = (question: Question) => {
    const val = answers[question.id];

    switch (question.type) {
      case 'multiple-choice':
      case 'true-false':
        return (
          <div className="space-y-3 pt-2">
            {question.options?.map((opt, idx) => {
              const isSelected = val === opt.id || val === opt.text;
              const letter = String.fromCharCode(65 + idx); // A, B, C...

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleOptionSelect(question.id, opt.id, false)}
                  className={`w-full text-left p-4 ${roundedClass} border-2 flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-current shadow-sm scale-[1.01]'
                      : 'border-zinc-200/80 hover:border-zinc-400 bg-white/70'
                  }`}
                  style={{
                    borderColor: isSelected ? quiz.theme.primaryColor : undefined,
                    backgroundColor: isSelected ? `${quiz.theme.primaryColor}15` : undefined,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span 
                      className={`w-7 h-7 ${roundedClass} flex items-center justify-center text-xs font-bold font-mono transition-colors`}
                      style={{
                        backgroundColor: isSelected ? quiz.theme.primaryColor : '#f4f4f5',
                        color: isSelected ? quiz.theme.primaryTextColor : '#52525b',
                      }}
                    >
                      {letter}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: quiz.theme.textColor }}>
                      {opt.text}
                    </span>
                  </div>
                  {isSelected && (
                    <div 
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: quiz.theme.primaryColor }}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        );

      case 'multiple-select':
        return (
          <div className="space-y-3 pt-2">
            <span className="text-xs text-zinc-400 font-medium block">
              Choose all options that apply:
            </span>
            {question.options?.map((opt) => {
              const selectedList: string[] = Array.isArray(val) ? val : [];
              const isSelected = selectedList.includes(opt.id) || selectedList.includes(opt.text);

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleOptionSelect(question.id, opt.id, true)}
                  className={`w-full text-left p-4 ${roundedClass} border-2 flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-current shadow-sm scale-[1.01]'
                      : 'border-zinc-200/80 hover:border-zinc-400 bg-white/70'
                  }`}
                  style={{
                    borderColor: isSelected ? quiz.theme.primaryColor : undefined,
                    backgroundColor: isSelected ? `${quiz.theme.primaryColor}15` : undefined,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isSelected ? 'border-transparent text-white' : 'border-zinc-300 bg-white'
                      }`}
                      style={{ backgroundColor: isSelected ? quiz.theme.primaryColor : undefined }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-sm font-semibold" style={{ color: quiz.theme.textColor }}>
                      {opt.text}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        );

      case 'short-text':
        return (
          <div className="pt-2">
            <input
              type="text"
              value={val || ''}
              onChange={(e) => handleOptionSelect(question.id, e.target.value, false)}
              placeholder="Type your answer here..."
              className={`w-full p-4 ${roundedClass} border-2 bg-white/90 text-sm font-medium focus:outline-none focus:ring-2`}
              style={{
                borderColor: quiz.theme.borderColor,
                color: quiz.theme.textColor,
              }}
            />
          </div>
        );

      case 'long-text':
        return (
          <div className="pt-2">
            <textarea
              rows={4}
              value={val || ''}
              onChange={(e) => handleOptionSelect(question.id, e.target.value, false)}
              placeholder="Type your detailed response here..."
              className={`w-full p-4 ${roundedClass} border-2 bg-white/90 text-sm font-medium focus:outline-none focus:ring-2 resize-none`}
              style={{
                borderColor: quiz.theme.borderColor,
                color: quiz.theme.textColor,
              }}
            />
          </div>
        );

      case 'rating-stars':
        const maxStars = question.maxRating || 5;
        const currentRating = Number(val) || 0;
        return (
          <div className="pt-4 space-y-3">
            <div className="flex items-center gap-2">
              {Array.from({ length: maxStars }).map((_, idx) => {
                const starNum = idx + 1;
                const isFilled = starNum <= currentRating;
                return (
                  <button
                    key={starNum}
                    type="button"
                    onClick={() => handleOptionSelect(question.id, starNum, false)}
                    className="p-1 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        isFilled ? 'fill-amber-400 text-amber-500' : 'text-zinc-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            {question.ratingLabels && (
              <div className="flex justify-between text-xs text-zinc-400 font-medium max-w-xs">
                <span>{question.ratingLabels.low}</span>
                <span>{question.ratingLabels.high}</span>
              </div>
            )}
          </div>
        );

      case 'opinion-scale':
        const maxSteps = question.maxRating || 10;
        const currentStepVal = Number(val) || 0;
        return (
          <div className="pt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: maxSteps }).map((_, idx) => {
                const stepNum = idx + 1;
                const isChosen = stepNum === currentStepVal;
                return (
                  <button
                    key={stepNum}
                    type="button"
                    onClick={() => handleOptionSelect(question.id, stepNum, false)}
                    className={`w-10 h-11 ${roundedClass} font-bold font-mono text-sm border-2 transition-all cursor-pointer ${
                      isChosen
                        ? 'border-current shadow-md scale-105'
                        : 'border-zinc-200 hover:border-zinc-400 bg-white'
                    }`}
                    style={{
                      borderColor: isChosen ? quiz.theme.primaryColor : undefined,
                      backgroundColor: isChosen ? quiz.theme.primaryColor : undefined,
                      color: isChosen ? quiz.theme.primaryTextColor : quiz.theme.textColor,
                    }}
                  >
                    {stepNum}
                  </button>
                );
              })}
            </div>
            {question.ratingLabels && (
              <div className="flex justify-between text-xs text-zinc-400 font-medium">
                <span>{question.ratingLabels.low}</span>
                <span>{question.ratingLabels.high}</span>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`min-h-screen ${fontClass} relative flex flex-col justify-between transition-colors`}
      style={{
        backgroundColor: quiz.theme.backgroundColor,
        color: quiz.theme.textColor,
      }}
    >
      {/* Pattern background overlay */}
      <div 
        className={`absolute inset-0 pointer-events-none opacity-25 ${patternClass}`}
        style={{ color: quiz.theme.textColor }}
      />

      {/* Top Banner: Timer & Progress (Step by Step) */}
      <header className="relative z-20 w-full max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isPreviewMode && (
            <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-500 text-black rounded-lg flex items-center gap-1 shadow-xs">
              <EyeOff className="w-3.5 h-3.5" />
              Preview Mode
            </span>
          )}
          <span className="text-xs font-semibold uppercase tracking-wider opacity-60">
            {quiz.title}
          </span>
        </div>

        {/* Countdown timer pill */}
        {timeRemainingSeconds !== null && !isSubmitted && (
          <div 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold shadow-xs"
            style={{
              backgroundColor: timeRemainingSeconds < 60 ? '#fef2f2' : quiz.theme.cardBackgroundColor,
              color: timeRemainingSeconds < 60 ? '#dc2626' : quiz.theme.textColor,
              borderColor: quiz.theme.borderColor,
            }}
          >
            <Clock className={`w-3.5 h-3.5 ${timeRemainingSeconds < 60 ? 'animate-pulse' : ''}`} />
            <span>{formatCountdown(timeRemainingSeconds)}</span>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl mx-auto">

          {/* ================= 1. SUBMISSION COMPLETE / RESULTS VIEW ================= */}
          {isSubmitted && results ? (
            <div 
              className={`p-8 sm:p-10 ${roundedClass} border shadow-xl text-center space-y-6 animate-in zoom-in-95`}
              style={{
                backgroundColor: quiz.theme.cardBackgroundColor,
                borderColor: quiz.theme.borderColor,
              }}
            >
              <div 
                className="w-16 h-16 mx-auto rounded-3xl flex items-center justify-center shadow-md"
                style={{
                  backgroundColor: results.isPassed ? '#10b981' : '#6366f1',
                  color: '#ffffff',
                }}
              >
                {results.isPassed ? <Award className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {quiz.settings.successTitle || 'Quiz Completed!'}
                </h2>
                <p className="text-sm opacity-75 max-w-md mx-auto leading-relaxed">
                  {quiz.settings.successMessage || 'Thank you for taking the time to complete this quiz.'}
                </p>
              </div>

              {/* Score Display (if creator enabled immediate score) */}
              {quiz.settings.showScoreImmediately && (
                <div 
                  className="p-6 rounded-2xl border flex flex-col sm:flex-row items-center justify-around gap-4"
                  style={{ borderColor: quiz.theme.borderColor, backgroundColor: `${quiz.theme.primaryColor}08` }}
                >
                  <div>
                    <span className="text-xs uppercase tracking-wider opacity-60 block font-semibold">Your Score</span>
                    <span className="text-3xl font-extrabold font-mono" style={{ color: quiz.theme.primaryColor }}>
                      {results.totalScore} / {results.maxScore}
                    </span>
                    <span className="text-xs opacity-60 ml-1">pts</span>
                  </div>

                  <div className="h-10 w-px bg-zinc-200 hidden sm:block" />

                  <div>
                    <span className="text-xs uppercase tracking-wider opacity-60 block font-semibold">Accuracy</span>
                    <span className="text-3xl font-extrabold font-mono">
                      {results.percentage}%
                    </span>
                  </div>

                  <div className="h-10 w-px bg-zinc-200 hidden sm:block" />

                  <div>
                    <span className="text-xs uppercase tracking-wider opacity-60 block font-semibold">Result</span>
                    <span className={`inline-flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-full ${
                      results.isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {results.isPassed ? 'Passed' : 'Completed'}
                    </span>
                  </div>
                </div>
              )}

              {/* Answers & Explanations Review */}
              {quiz.settings.showScoreImmediately && results.evaluatedAnswers && (
                <div className="text-left space-y-4 pt-4 border-t" style={{ borderColor: quiz.theme.borderColor }}>
                  <h3 className="text-xs font-bold uppercase tracking-wider opacity-70">
                    Review Your Answers
                  </h3>
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                    {results.evaluatedAnswers.map((ea, idx) => (
                      <div 
                        key={ea.questionId}
                        className="p-4 rounded-xl border text-xs space-y-1.5"
                        style={{ borderColor: quiz.theme.borderColor }}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span>Q{idx + 1}: {ea.questionTitle}</span>
                          {ea.isCorrect !== undefined && (
                            <span className={ea.isCorrect ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                              {ea.isCorrect ? '✓ Correct' : '✕ Incorrect'}
                            </span>
                          )}
                        </div>

                        {/* Explanation */}
                        {quiz.questions[idx]?.explanation && (
                          <p className="text-[11px] opacity-70 italic pt-1 border-t border-zinc-100">
                            Note: {quiz.questions[idx].explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                {quiz.settings.limitOneSubmission !== false && !isPreviewMode ? (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-100 text-zinc-600 border border-zinc-200">
                    <Lock className="w-3.5 h-3.5 text-zinc-500" />
                    Submission Recorded (1 of 1 allowed)
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={restartQuiz}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border hover:bg-black/5 transition-colors cursor-pointer flex items-center gap-1.5"
                    style={{ borderColor: quiz.theme.borderColor }}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Retake Quiz
                  </button>
                )}

                {isPreviewMode && onExitPreview && (
                  <button
                    type="button"
                    onClick={onExitPreview}
                    className="px-5 py-2 text-xs font-semibold rounded-xl text-white shadow-xs cursor-pointer"
                    style={{ backgroundColor: quiz.theme.primaryColor }}
                  >
                    Return to Designer
                  </button>
                )}
              </div>
            </div>
          ) : currentStep === 0 ? (
            /* ================= 2. WELCOME / START SCREEN ================= */
            <div
              className={`p-8 sm:p-12 ${roundedClass} border shadow-lg space-y-6 animate-in fade-in`}
              style={{
                backgroundColor: quiz.theme.cardBackgroundColor,
                borderColor: quiz.theme.borderColor,
              }}
            >
              <div className="space-y-3">
                <span 
                  className="inline-block px-3.5 py-1 text-xs font-bold rounded-full"
                  style={{
                    backgroundColor: `${quiz.theme.primaryColor}20`,
                    color: quiz.theme.primaryColor,
                  }}
                >
                  {quiz.questions.length} {quiz.questions.length === 1 ? 'Question' : 'Questions'}
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                  {quiz.title || 'Welcome to the Quiz'}
                </h1>
                <p className="text-sm opacity-80 leading-relaxed max-w-xl">
                  {quiz.description || 'Answer the questions thoughtfully and submit your responses.'}
                </p>
              </div>

              {/* Already Submitted State for 1-submission limit */}
              {existingSubmission && quiz.settings.limitOneSubmission !== false && !isPreviewMode ? (
                <div className="space-y-5 pt-4 border-t" style={{ borderColor: quiz.theme.borderColor }}>
                  <div className="p-4 sm:p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3.5">
                    <div className="p-2.5 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm sm:text-base font-bold" style={{ color: quiz.theme.textColor }}>
                        You've Already Submitted This Quiz
                      </h3>
                      <p className="text-xs opacity-75 leading-relaxed">
                        The quiz creator has restricted responses to <strong>1 submission per person</strong>. Your response has already been safely saved.
                      </p>
                    </div>
                  </div>

                  {/* Submission Receipt Box */}
                  <div
                    className="p-4 sm:p-5 rounded-2xl border text-xs space-y-2.5"
                    style={{
                      backgroundColor: `${quiz.theme.primaryColor}08`,
                      borderColor: quiz.theme.borderColor,
                    }}
                  >
                    <div className="font-bold uppercase tracking-wider text-[10px] opacity-60">
                      Your Submission Summary
                    </div>
                    {existingSubmission.name && (
                      <div className="flex justify-between items-center">
                        <span className="opacity-60">Respondent:</span>
                        <span className="font-semibold">{existingSubmission.name}</span>
                      </div>
                    )}
                    {existingSubmission.section && (
                      <div className="flex justify-between items-center">
                        <span className="opacity-60">Section / Class:</span>
                        <span className="font-semibold">{existingSubmission.section}</span>
                      </div>
                    )}
                    {existingSubmission.email && (
                      <div className="flex justify-between items-center">
                        <span className="opacity-60">Email:</span>
                        <span className="font-semibold">{existingSubmission.email}</span>
                      </div>
                    )}
                    {existingSubmission.totalScore !== undefined && quiz.settings.showScoreImmediately && (
                      <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: quiz.theme.borderColor }}>
                        <span className="opacity-60">Recorded Score:</span>
                        <span className="font-bold text-sm font-mono" style={{ color: quiz.theme.primaryColor }}>
                          {existingSubmission.totalScore} / {existingSubmission.maxScore} ({existingSubmission.percentage}%)
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-[11px] opacity-50 pt-1">
                      <span>Submitted:</span>
                      <span>{existingSubmission.submittedAt}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center pt-2">
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Response Confirmed & Recorded
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Respondent Identity Fields */}
                  {(quiz.settings.collectName || (quiz.settings.collectSection ?? true) || quiz.settings.collectEmail) && (
                    <div className="space-y-4 pt-4 border-t" style={{ borderColor: quiz.theme.borderColor }}>
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider opacity-60">
                          Respondent Details
                        </h3>
                        {quiz.settings.limitOneSubmission !== false && (
                          <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                            <Lock className="w-3 h-3" /> 1 submit per user
                          </span>
                        )}
                      </div>

                      {/* Full Name */}
                      {quiz.settings.collectName && (
                        <div>
                          <label className="block text-xs font-semibold opacity-80 mb-1">
                            Your Full Name {quiz.settings.requireName && <span className="text-rose-500">*</span>}
                          </label>
                          <input
                            type="text"
                            value={respondentName}
                            onChange={(e) => setRespondentName(e.target.value)}
                            placeholder=""
                            className={`w-full p-3.5 ${roundedClass} border text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
                              quiz.theme.isDark 
                                ? 'bg-zinc-900/90 text-white border-zinc-700 placeholder:text-zinc-500 focus:ring-zinc-400' 
                                : 'bg-white text-zinc-900 border-zinc-300 placeholder:text-zinc-400 focus:ring-zinc-900'
                            }`}
                          />
                        </div>
                      )}

                      {/* Section / Class Group */}
                      {(quiz.settings.collectSection ?? true) && (
                        <div>
                          <label className="block text-xs font-semibold opacity-80 mb-1">
                            Section / Class Group {(quiz.settings.requireSection ?? true) && <span className="text-rose-500">*</span>}
                          </label>
                          {quiz.settings.sectionType === 'dropdown' && quiz.settings.sectionOptions && quiz.settings.sectionOptions.length > 0 ? (
                            <select
                              value={respondentSection}
                              onChange={(e) => setRespondentSection(e.target.value)}
                              className={`w-full p-3.5 ${roundedClass} border text-sm font-medium transition-all focus:outline-none focus:ring-2 cursor-pointer ${
                                quiz.theme.isDark 
                                  ? 'bg-zinc-900 text-white border-zinc-700 focus:ring-zinc-400' 
                                  : 'bg-white text-zinc-900 border-zinc-300 focus:ring-zinc-900'
                              }`}
                            >
                              <option value="" disabled>Select your section / class...</option>
                              {quiz.settings.sectionOptions.map((sec, idx) => (
                                <option key={idx} value={sec}>{sec}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={respondentSection}
                              onChange={(e) => setRespondentSection(e.target.value)}
                              placeholder=""
                              className={`w-full p-3.5 ${roundedClass} border text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
                                quiz.theme.isDark 
                                  ? 'bg-zinc-900/90 text-white border-zinc-700 placeholder:text-zinc-500 focus:ring-zinc-400' 
                                  : 'bg-white text-zinc-900 border-zinc-300 placeholder:text-zinc-400 focus:ring-zinc-900'
                              }`}
                            />
                          )}
                        </div>
                      )}

                      {/* Email Address */}
                      {quiz.settings.collectEmail && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-semibold opacity-80">
                              Your Email Address {quiz.settings.requireEmail && <span className="text-rose-500">*</span>}
                            </label>
                            {quiz.settings.restrictToAllowedEmails && (
                              <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Authorized email list
                              </span>
                            )}
                          </div>
                          <input
                            type="email"
                            value={respondentEmail}
                            onChange={(e) => setRespondentEmail(e.target.value)}
                            placeholder=""
                            className={`w-full p-3.5 ${roundedClass} border text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
                              quiz.theme.isDark 
                                ? 'bg-zinc-900/90 text-white border-zinc-700 placeholder:text-zinc-500 focus:ring-zinc-400' 
                                : 'bg-white text-zinc-900 border-zinc-300 placeholder:text-zinc-400 focus:ring-zinc-900'
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {validationError && (
                    <div className="p-3.5 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{validationError}</span>
                    </div>
                  )}

                  {/* Start Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleStartQuiz}
                      disabled={isCheckingSubmission}
                      className={`w-full sm:w-auto px-8 py-3.5 ${roundedClass} text-sm font-bold shadow-md hover:scale-[1.02] active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer`}
                      style={{
                        backgroundColor: quiz.theme.primaryColor,
                        color: quiz.theme.primaryTextColor,
                      }}
                    >
                      {isCheckingSubmission ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying Access...</span>
                        </>
                      ) : (
                        <>
                          <span>Start Quiz</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : quiz.layout === 'step-by-step' || quiz.layout === 'card-deck' ? (
            /* ================= 3. STEP-BY-STEP / CARD DECK ================= */
            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold opacity-70">
                  <span>Question {currentStep} of {quiz.questions.length}</span>
                  <span className="font-mono">{Math.round((currentStep / quiz.questions.length) * 100)}%</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden bg-black/10">
                  <div
                    className="h-full transition-all duration-300 rounded-full"
                    style={{
                      width: `${(currentStep / quiz.questions.length) * 100}%`,
                      backgroundColor: quiz.theme.primaryColor,
                    }}
                  />
                </div>
              </div>

              {/* Active Question Card */}
              {(() => {
                const activeQ = quiz.questions[currentStep - 1];
                if (!activeQ) return null;

                return (
                  <div
                    key={activeQ.id}
                    className={`p-6 sm:p-8 ${roundedClass} border shadow-lg space-y-5 animate-in slide-in-from-right-4 duration-200`}
                    style={{
                      backgroundColor: quiz.theme.cardBackgroundColor,
                      borderColor: quiz.theme.borderColor,
                    }}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span 
                          className="px-2 py-0.5 text-[11px] font-bold rounded-md"
                          style={{
                            backgroundColor: `${quiz.theme.primaryColor}15`,
                            color: quiz.theme.primaryColor,
                          }}
                        >
                          Q{currentStep}
                        </span>
                        {activeQ.points > 0 && (
                          <span className="text-xs opacity-60">({activeQ.points} points)</span>
                        )}
                        {activeQ.required && (
                          <span className="text-[11px] text-rose-500 font-semibold">*Required</span>
                        )}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight pt-1">
                        {activeQ.title}
                      </h2>
                      {activeQ.description && (
                        <p className="text-xs opacity-70 leading-relaxed">{activeQ.description}</p>
                      )}
                    </div>

                    {/* Inputs */}
                    <div>{renderQuestionInput(activeQ)}</div>

                    {validationError && (
                      <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{validationError}</span>
                      </div>
                    )}

                    {/* Bottom Navigation Buttons */}
                    <div className="pt-4 border-t flex items-center justify-between" style={{ borderColor: quiz.theme.borderColor }}>
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        disabled={currentStep <= 1}
                        className="px-4 py-2 text-xs font-semibold rounded-xl border hover:bg-black/5 disabled:opacity-30 transition-colors flex items-center gap-1.5 cursor-pointer"
                        style={{ borderColor: quiz.theme.borderColor }}
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back
                      </button>

                      <button
                        type="button"
                        onClick={handleNextStep}
                        disabled={isSubmitting}
                        className={`px-6 py-2.5 ${roundedClass} text-xs font-bold shadow-sm hover:scale-[1.02] active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer`}
                        style={{
                          backgroundColor: quiz.theme.primaryColor,
                          color: quiz.theme.primaryTextColor,
                        }}
                      >
                        {currentStep === quiz.questions.length ? (
                          isSubmitting ? 'Submitting...' : 'Submit Quiz'
                        ) : (
                          <>
                            Next
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* ================= 4. SINGLE-PAGE LAYOUT (Google Forms style) ================= */
            <div className="space-y-6">
              {/* Header Hero */}
              <div 
                className={`p-6 sm:p-8 ${roundedClass} border shadow-md space-y-3`}
                style={{
                  backgroundColor: quiz.theme.cardBackgroundColor,
                  borderColor: quiz.theme.borderColor,
                }}
              >
                <div className="flex items-center justify-between">
                  <span 
                    className="inline-block px-3 py-1 text-xs font-bold rounded-full"
                    style={{
                      backgroundColor: `${quiz.theme.primaryColor}20`,
                      color: quiz.theme.primaryColor,
                    }}
                  >
                    {quiz.questions.length} {quiz.questions.length === 1 ? 'Question' : 'Questions'}
                  </span>
                  {quiz.settings.limitOneSubmission !== false && (
                    <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> 1 submit per user
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {quiz.title}
                </h1>
                <p className="text-sm opacity-80 leading-relaxed">
                  {quiz.description}
                </p>

                {existingSubmission && quiz.settings.limitOneSubmission !== false && !isPreviewMode ? (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 mt-4">
                    <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 text-xs">
                      <h4 className="font-bold" style={{ color: quiz.theme.textColor }}>
                        You have already submitted this quiz
                      </h4>
                      <p className="opacity-80 leading-relaxed">
                        The creator allows 1 submission per person. Recorded on {existingSubmission.submittedAt}.
                      </p>
                    </div>
                  </div>
                ) : (quiz.settings.collectName || (quiz.settings.collectSection ?? true) || quiz.settings.collectEmail) && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t" style={{ borderColor: quiz.theme.borderColor }}>
                    {quiz.settings.collectName && (
                      <div>
                        <label className="block text-xs font-semibold opacity-80 mb-1">
                          Respondent Name {quiz.settings.requireName && <span className="text-rose-500">*</span>}
                        </label>
                        <input
                          type="text"
                          value={respondentName}
                          onChange={(e) => setRespondentName(e.target.value)}
                          placeholder=""
                          className={`w-full p-2.5 ${roundedClass} border text-xs focus:outline-none ${
                            quiz.theme.isDark ? 'bg-zinc-900 text-white border-zinc-700' : 'bg-white text-zinc-900 border-zinc-300'
                          }`}
                        />
                      </div>
                    )}
                    {(quiz.settings.collectSection ?? true) && (
                      <div>
                        <label className="block text-xs font-semibold opacity-80 mb-1">
                          Section / Class {(quiz.settings.requireSection ?? true) && <span className="text-rose-500">*</span>}
                        </label>
                        {quiz.settings.sectionType === 'dropdown' && quiz.settings.sectionOptions && quiz.settings.sectionOptions.length > 0 ? (
                          <select
                            value={respondentSection}
                            onChange={(e) => setRespondentSection(e.target.value)}
                            className={`w-full p-2.5 ${roundedClass} border text-xs focus:outline-none cursor-pointer ${
                              quiz.theme.isDark ? 'bg-zinc-900 text-white border-zinc-700' : 'bg-white text-zinc-900 border-zinc-300'
                            }`}
                          >
                            <option value="" disabled>Select section...</option>
                            {quiz.settings.sectionOptions.map((sec, idx) => (
                              <option key={idx} value={sec}>{sec}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={respondentSection}
                            onChange={(e) => setRespondentSection(e.target.value)}
                            placeholder=""
                            className={`w-full p-2.5 ${roundedClass} border text-xs focus:outline-none ${
                              quiz.theme.isDark ? 'bg-zinc-900 text-white border-zinc-700' : 'bg-white text-zinc-900 border-zinc-300'
                            }`}
                          />
                        )}
                      </div>
                    )}
                    {quiz.settings.collectEmail && (
                      <div>
                        <label className="block text-xs font-semibold opacity-80 mb-1">
                          Respondent Email {quiz.settings.requireEmail && <span className="text-rose-500">*</span>}
                        </label>
                        <input
                          type="email"
                          value={respondentEmail}
                          onChange={(e) => setRespondentEmail(e.target.value)}
                          placeholder=""
                          className={`w-full p-2.5 ${roundedClass} border text-xs focus:outline-none ${
                            quiz.theme.isDark ? 'bg-zinc-900 text-white border-zinc-700' : 'bg-white text-zinc-900 border-zinc-300'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* All Questions in a continuous elegant stream */}
              {!(existingSubmission && quiz.settings.limitOneSubmission !== false && !isPreviewMode) && (
                <>
                  {quiz.questions.map((question, qIdx) => (
                    <div
                      key={question.id}
                      className={`p-6 sm:p-8 ${roundedClass} border shadow-xs space-y-4`}
                      style={{
                        backgroundColor: quiz.theme.cardBackgroundColor,
                        borderColor: quiz.theme.borderColor,
                      }}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span 
                            className="px-2 py-0.5 text-[11px] font-bold rounded"
                            style={{
                              backgroundColor: `${quiz.theme.primaryColor}15`,
                              color: quiz.theme.primaryColor,
                            }}
                          >
                            Q{qIdx + 1}
                          </span>
                          {question.points > 0 && (
                            <span className="text-xs opacity-60">({question.points} pts)</span>
                          )}
                          {question.required && (
                            <span className="text-[11px] text-rose-500 font-semibold">*Required</span>
                          )}
                        </div>
                        <h3 className="text-base sm:text-lg font-bold">
                          {question.title}
                        </h3>
                        {question.description && (
                          <p className="text-xs opacity-70">{question.description}</p>
                        )}
                      </div>

                      {renderQuestionInput(question)}
                    </div>
                  ))}

                  {validationError && (
                    <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{validationError}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className={`px-8 py-3.5 ${roundedClass} text-sm font-bold shadow-md hover:scale-[1.02] active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer`}
                      style={{
                        backgroundColor: quiz.theme.primaryColor,
                        color: quiz.theme.primaryTextColor,
                      }}
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSubmitting ? 'Submitting Answers...' : 'Submit All Answers'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-4 text-center text-xs opacity-50">
        Powered by Quiz Aesthetic Studio • Firebase Backend
      </footer>
    </div>
  );
};
