import React, { useState } from 'react';
import { 
  Quiz, 
  Question, 
  QuestionType, 
  QuizTheme, 
  LayoutType, 
  FontFamilyType, 
  PatternType, 
  CardStyleType, 
  BorderRadiusType, 
  ButtonStyleType 
} from '../../types';
import { THEME_PRESETS } from '../../data/presets';
import { saveQuiz } from '../../lib/quizDbService';
import { getShareableQuizUrl } from '../../lib/quizHelpers';
import { 
  ArrowLeft, 
  Save, 
  Share2, 
  Eye, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  CopyCheck, 
  ChevronUp, 
  ChevronDown, 
  Settings as SettingsIcon, 
  Palette, 
  ListChecks, 
  Sparkles,
  CheckCircle2,
  Sliders,
  Type,
  Maximize2,
  ExternalLink,
  HelpCircle,
  Clock,
  LayoutGrid,
  Pencil,
  X,
  Lock,
  Users,
  Mail,
  Link2,
  Globe,
  AlertTriangle,
  CalendarClock
} from 'lucide-react';
import { QuizTaker } from '../QuizTaker/QuizTaker';
import { QuizLimitModal } from '../QuizLimitModal';
import { TimerConfigModal } from './TimerConfigModal';
import { DeadlineConfigModal } from './DeadlineConfigModal';
import { formatQuizSlug, generateDefaultQuizSlug } from '../../lib/quizHelpers';

interface QuizBuilderProps {
  initialQuiz: Quiz;
  userId: string;
  userEmail: string;
  creatorName?: string;
  onBack: () => void;
  onTakeQuiz: (quizId: string) => void;
}

export const QuizBuilder: React.FC<QuizBuilderProps> = ({
  initialQuiz,
  userId,
  userEmail,
  creatorName,
  onBack,
  onTakeQuiz,
}) => {
  const [quiz, setQuiz] = useState<Quiz>(initialQuiz);
  const [activeTab, setActiveTab] = useState<'questions' | 'design' | 'settings'>('questions');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [showLivePreviewModal, setShowLivePreviewModal] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [newSectionInput, setNewSectionInput] = useState('');
  const [allowedEmailInput, setAllowedEmailInput] = useState('');

  const updateQuizField = <K extends keyof Quiz>(field: K, value: Quiz[K]) => {
    setQuiz((prev) => ({ ...prev, [field]: value }));
  };

  const updateSettingsField = <K extends keyof Quiz['settings']>(field: K, value: Quiz['settings'][K]) => {
    setQuiz((prev) => ({
      ...prev,
      settings: { ...prev.settings, [field]: value },
    }));
  };

  const handleUpdateAllQuestionsTimer = (seconds: number | null) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => ({
        ...q,
        timeLimitSeconds: seconds,
      })),
    }));
  };

  const updateThemeField = <K extends keyof QuizTheme>(field: K, value: QuizTheme[K]) => {
    setQuiz((prev) => ({
      ...prev,
      theme: { ...prev.theme, [field]: value },
    }));
  };

  const applyPresetTheme = (preset: QuizTheme) => {
    setQuiz((prev) => ({
      ...prev,
      theme: { ...preset },
    }));
  };

  // Questions manipulation
  const addQuestion = (type: QuestionType = 'multiple-choice') => {
    const newQ: Question = {
      id: 'q_' + Math.random().toString(36).substring(2, 9),
      type,
      title: '',
      description: '',
      required: true,
      points: 10,
      options: type === 'multiple-choice' || type === 'multiple-select' ? [
        { id: 'opt_1', text: 'Option 1', isCorrect: true },
        { id: 'opt_2', text: 'Option 2', isCorrect: false },
        { id: 'opt_3', text: 'Option 3', isCorrect: false },
      ] : type === 'true-false' ? [
        { id: 'tf_1', text: 'True', isCorrect: true },
        { id: 'tf_2', text: 'False', isCorrect: false },
      ] : undefined,
      minRating: 1,
      maxRating: type === 'opinion-scale' ? 10 : 5,
      ratingLabels: { low: 'Poor', high: 'Excellent' },
    };

    setQuiz((prev) => ({
      ...prev,
      questions: [...prev.questions, newQ],
    }));
  };

  const updateQuestion = (qId: string, updates: Partial<Question>) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === qId ? { ...q, ...updates } : q)),
    }));
  };

  const deleteQuestion = (qId: string) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== qId),
    }));
  };

  const duplicateQuestion = (qId: string) => {
    const target = quiz.questions.find((q) => q.id === qId);
    if (!target) return;
    const duplicated: Question = {
      ...target,
      id: 'q_' + Math.random().toString(36).substring(2, 9),
      title: target.title ? `${target.title} (Copy)` : 'Copy',
      options: target.options?.map((o) => ({ ...o, id: 'opt_' + Math.random().toString(36).substring(2, 7) })),
    };
    const idx = quiz.questions.findIndex((q) => q.id === qId);
    const newQuestions = [...quiz.questions];
    newQuestions.splice(idx + 1, 0, duplicated);
    setQuiz((prev) => ({ ...prev, questions: newQuestions }));
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === quiz.questions.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newQuestions = [...quiz.questions];
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[targetIndex];
    newQuestions[targetIndex] = temp;
    setQuiz((prev) => ({ ...prev, questions: newQuestions }));
  };

  // Option manipulation
  const addOption = (qId: string) => {
    const q = quiz.questions.find((x) => x.id === qId);
    if (!q) return;
    const currentOptions = q.options || [];
    const newOption = {
      id: 'opt_' + Math.random().toString(36).substring(2, 9),
      text: `Option ${currentOptions.length + 1}`,
      isCorrect: false,
    };
    updateQuestion(qId, { options: [...currentOptions, newOption] });
  };

  const updateOptionText = (qId: string, optId: string, text: string) => {
    const q = quiz.questions.find((x) => x.id === qId);
    if (!q || !q.options) return;
    updateQuestion(qId, {
      options: q.options.map((o) => (o.id === optId ? { ...o, text } : o)),
    });
  };

  const setCorrectOption = (qId: string, optId: string, isMultipleSelect: boolean) => {
    const q = quiz.questions.find((x) => x.id === qId);
    if (!q || !q.options) return;
    if (isMultipleSelect) {
      updateQuestion(qId, {
        options: q.options.map((o) => (o.id === optId ? { ...o, isCorrect: !o.isCorrect } : o)),
      });
    } else {
      updateQuestion(qId, {
        options: q.options.map((o) => ({ ...o, isCorrect: o.id === optId })),
      });
    }
  };

  const deleteOption = (qId: string, optId: string) => {
    const q = quiz.questions.find((x) => x.id === qId);
    if (!q || !q.options || q.options.length <= 1) return;
    updateQuestion(qId, {
      options: q.options.filter((o) => o.id !== optId),
    });
  };

  // Save to Firestore
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const savedId = await saveQuiz({
        ...quiz,
        creatorId: userId,
        creatorEmail: userEmail,
        creatorName: creatorName || quiz.creatorName,
      });
      setQuiz((prev) => ({ ...prev, id: savedId }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to save quiz:', err);
      if (err?.message?.includes('limit') || err?.message?.includes('15')) {
        setShowLimitModal(true);
      } else {
        alert(err?.message || 'Error saving quiz to Firestore. Check console for details.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const copyShareLink = async () => {
    let currentQuizId = quiz.id;
    if (!currentQuizId || currentQuizId.startsWith('q_') || currentQuizId.startsWith('sample_')) {
      try {
        setIsSaving(true);
        const savedId = await saveQuiz({
          ...quiz,
          creatorId: userId,
          creatorEmail: userEmail,
          creatorName: creatorName || quiz.creatorName,
        });
        currentQuizId = savedId;
        setQuiz((prev) => ({ ...prev, id: savedId }));
        setSaveSuccess(true);
      } catch (err: any) {
        console.error('Auto-save error before sharing:', err);
      } finally {
        setIsSaving(false);
      }
    }
    const url = getShareableQuizUrl(currentQuizId || quiz.id);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      {/* Sticky Top Bar - Clean, professional alignment with single-line controls */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200 px-3 sm:px-6 py-2 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto no-scrollbar flex-nowrap">
          
          {/* Left: Back button, Quiz Title, Question count badge */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onBack}
              className="h-8.5 w-8.5 flex items-center justify-center hover:bg-zinc-100 rounded-xl text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer shrink-0"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
            </button>
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative flex items-center group">
                <input
                  type="text"
                  value={quiz.title}
                  onChange={(e) => updateQuizField('title', e.target.value)}
                  placeholder="Quiz Title..."
                  className="h-8.5 text-sm sm:text-base font-bold text-zinc-900 bg-transparent hover:bg-zinc-100 focus:bg-white border border-transparent hover:border-zinc-200 focus:border-zinc-300 rounded-lg px-2.5 py-1 pr-6 transition-all focus:outline-none w-36 sm:w-48 md:w-56 truncate cursor-text whitespace-nowrap"
                  title="Click to rename quiz"
                />
                <Pencil className="w-3.5 h-3.5 text-zinc-400 absolute right-2 pointer-events-none group-focus-within:opacity-0 shrink-0" />
              </div>
              <span className="hidden xl:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200 whitespace-nowrap shrink-0">
                {quiz.questions.length} {quiz.questions.length === 1 ? 'question' : 'questions'}
              </span>
            </div>
          </div>

          {/* Center Tabs: Questions, Design Studio, Settings */}
          <div className="flex items-center bg-zinc-100/90 p-1 rounded-xl shrink-0 h-9 border border-zinc-200/50">
            <button
              onClick={() => setActiveTab('questions')}
              className={`h-7 flex items-center gap-1.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'questions'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <ListChecks className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Questions</span>
            </button>

            <button
              onClick={() => setActiveTab('design')}
              className={`h-7 flex items-center gap-1.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'design'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Palette className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Design Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`h-7 flex items-center gap-1.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'settings'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <SettingsIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Settings</span>
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-nowrap">
            <button
              onClick={() => setShowTimerModal(true)}
              className={`h-8.5 flex items-center gap-1.5 px-3 border text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 select-none ${
                quiz.settings.timerMode === 'whole-quiz' || (!quiz.settings.timerMode && quiz.settings.timeLimitMinutes)
                  ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900 shadow-2xs'
                  : quiz.settings.timerMode === 'per-question'
                  ? 'bg-indigo-50 hover:bg-indigo-100 border-indigo-300 text-indigo-900 shadow-2xs'
                  : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-700'
              }`}
              title="Configure countdown timer (whole quiz or per question)"
            >
              <Clock className={`w-3.5 h-3.5 shrink-0 ${
                quiz.settings.timerMode === 'whole-quiz' || (!quiz.settings.timerMode && quiz.settings.timeLimitMinutes)
                  ? 'text-amber-600'
                  : quiz.settings.timerMode === 'per-question'
                  ? 'text-indigo-600'
                  : 'text-zinc-500'
              }`} />
              <span className="whitespace-nowrap">
                {quiz.settings.timerMode === 'whole-quiz' || (!quiz.settings.timerMode && quiz.settings.timeLimitMinutes)
                  ? `Timer: ${quiz.settings.timeLimitMinutes || 15}m`
                  : quiz.settings.timerMode === 'per-question'
                  ? `Timer: ${quiz.settings.questionTimeLimitSeconds || 30}s/q`
                  : 'Timer'}
              </span>
            </button>

            <button
              onClick={() => setShowDeadlineModal(true)}
              className={`h-8.5 flex items-center gap-1.5 px-3 border text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 select-none ${
                quiz.settings.deadline
                  ? new Date(quiz.settings.deadline).getTime() < Date.now()
                    ? 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-900 shadow-2xs'
                    : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900 shadow-2xs'
                  : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-700'
              }`}
              title="Configure quiz submission deadline cutoff"
            >
              <CalendarClock className={`w-3.5 h-3.5 shrink-0 ${
                quiz.settings.deadline
                  ? new Date(quiz.settings.deadline).getTime() < Date.now()
                    ? 'text-rose-600'
                    : 'text-emerald-600'
                  : 'text-zinc-500'
              }`} />
              <span className="whitespace-nowrap">
                {quiz.settings.deadline
                  ? new Date(quiz.settings.deadline).getTime() < Date.now()
                    ? 'Deadline: Expired'
                    : 'Deadline Set'
                  : 'Deadline'}
              </span>
            </button>

            <button
              onClick={() => setShowLivePreviewModal(true)}
              className="h-8.5 flex items-center gap-1.5 px-3 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0 select-none"
              title="Preview quiz with chosen theme and layout"
            >
              <Eye className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
              <span className="whitespace-nowrap">Live Preview</span>
            </button>

            <button
              onClick={copyShareLink}
              className="h-8.5 flex items-center gap-1.5 px-3 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0 select-none"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-emerald-700 whitespace-nowrap font-medium">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                  <span className="whitespace-nowrap">Share Link</span>
                </>
              )}
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="h-8.5 flex items-center gap-1.5 px-3.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-60 cursor-pointer whitespace-nowrap shrink-0 select-none"
            >
              {isSaving ? (
                <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent shrink-0" />
              ) : saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="whitespace-nowrap">Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">Save Quiz</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">

        {/* ================= QUESTIONS TAB ================= */}
        {activeTab === 'questions' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Title & Description Card */}
            <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Quiz Title
                </label>
                <input
                  type="text"
                  value={quiz.title}
                  onChange={(e) => updateQuizField('title', e.target.value)}
                  placeholder="e.g. Design Systems & Aesthetics Quiz"
                  className="w-full text-2xl font-bold text-zinc-900 placeholder:text-zinc-300 border-b border-zinc-200 focus:border-zinc-900 pb-2 focus:outline-none font-modern"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Description / Instructions
                </label>
                <textarea
                  rows={2}
                  value={quiz.description}
                  onChange={(e) => updateQuizField('description', e.target.value)}
                  placeholder="Explain the purpose of this quiz, instructions, or who this is intended for..."
                  className="w-full text-sm text-zinc-700 placeholder:text-zinc-400 border border-zinc-200 rounded-xl p-3 focus:border-zinc-900 focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {quiz.questions.map((question, qIdx) => (
                <div
                  key={question.id}
                  className="p-6 bg-white border border-zinc-200 hover:border-zinc-300 rounded-2xl shadow-xs transition-all space-y-4 group"
                >
                  {/* Question Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-zinc-900 text-white text-xs font-bold flex items-center justify-center font-mono">
                        {qIdx + 1}
                      </span>
                      {/* Question Type selector */}
                      <select
                        value={question.type}
                        onChange={(e) => updateQuestion(question.id, { type: e.target.value as QuestionType })}
                        className="text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 border-none rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-zinc-900 cursor-pointer"
                      >
                        <option value="multiple-choice">Multiple Choice</option>
                        <option value="multiple-select">Multiple Select (Checkboxes)</option>
                        <option value="true-false">True / False</option>
                        <option value="short-text">Short Answer</option>
                        <option value="long-text">Paragraph / Long Text</option>
                        <option value="rating-stars">Star Rating</option>
                        <option value="opinion-scale">Opinion Scale (1 - 10)</option>
                      </select>
                    </div>

                    {/* Question Controls */}
                    <div className="flex items-center gap-1 text-zinc-400">
                      <button
                        onClick={() => moveQuestion(qIdx, 'up')}
                        disabled={qIdx === 0}
                        title="Move Up"
                        className="p-1 hover:text-zinc-800 disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveQuestion(qIdx, 'down')}
                        disabled={qIdx === quiz.questions.length - 1}
                        title="Move Down"
                        className="p-1 hover:text-zinc-800 disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <div className="w-px h-4 bg-zinc-200 mx-1" />
                      <button
                        onClick={() => duplicateQuestion(question.id)}
                        title="Duplicate Question"
                        className="p-1 hover:text-zinc-800 cursor-pointer"
                      >
                        <CopyCheck className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteQuestion(question.id)}
                        title="Delete Question"
                        className="p-1 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question Title & Subtitle */}
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={question.title}
                      onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
                      placeholder="Write your question here..."
                      className="w-full text-base font-bold text-zinc-900 placeholder:text-zinc-400 border border-transparent hover:border-zinc-200 focus:border-zinc-900 rounded-lg px-2.5 py-1.5 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={question.description || ''}
                      onChange={(e) => updateQuestion(question.id, { description: e.target.value })}
                      placeholder="Optional hint or explanation..."
                      className="w-full text-xs text-zinc-500 placeholder:text-zinc-300 border border-transparent hover:border-zinc-200 focus:border-zinc-900 rounded-lg px-2.5 py-1 focus:outline-none"
                    />
                  </div>

                  {/* Options Editor (for Multiple Choice, Multiple Select, True/False) */}
                  {(question.type === 'multiple-choice' || question.type === 'multiple-select' || question.type === 'true-false') && (
                    <div className="space-y-2.5 pt-2 pl-2">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                        Options (Click circle to mark correct answer)
                      </span>

                      {question.options?.map((opt, optIdx) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCorrectOption(question.id, opt.id, question.type === 'multiple-select')}
                            title={opt.isCorrect ? 'Correct Answer' : 'Mark as Correct'}
                            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                              opt.isCorrect
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'border-2 border-zinc-300 hover:border-zinc-500 bg-white'
                            }`}
                          >
                            {opt.isCorrect && <Check className="w-3 h-3" />}
                          </button>

                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => updateOptionText(question.id, opt.id, e.target.value)}
                            placeholder={`Option ${optIdx + 1}`}
                            className="flex-1 text-xs text-zinc-800 border border-zinc-200 hover:border-zinc-300 focus:border-zinc-900 rounded-lg px-3 py-1.5 focus:outline-none"
                          />

                          {question.type !== 'true-false' && (question.options?.length || 0) > 1 && (
                            <button
                              type="button"
                              onClick={() => deleteOption(question.id, opt.id)}
                              className="text-zinc-300 hover:text-rose-600 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}

                      {question.type !== 'true-false' && (
                        <button
                          type="button"
                          onClick={() => addOption(question.id)}
                          className="text-xs text-zinc-600 hover:text-zinc-900 font-semibold flex items-center gap-1.5 pt-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Option
                        </button>
                      )}
                    </div>
                  )}

                  {/* Rating or Scale Config */}
                  {(question.type === 'rating-stars' || question.type === 'opinion-scale') && (
                    <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
                      <div className="flex items-center gap-4 text-xs">
                        <span className="font-semibold text-zinc-700">Max Rating / Steps:</span>
                        <div className="flex gap-2">
                          {[5, 7, 10].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => updateQuestion(question.id, { maxRating: num })}
                              className={`px-2.5 py-1 rounded-lg font-mono font-bold cursor-pointer ${
                                question.maxRating === num
                                  ? 'bg-zinc-900 text-white'
                                  : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="text-zinc-500 block mb-1">Low Label (e.g. Strongly Disagree)</label>
                          <input
                            type="text"
                            value={question.ratingLabels?.low || ''}
                            onChange={(e) => updateQuestion(question.id, {
                              ratingLabels: { ...question.ratingLabels, low: e.target.value },
                            })}
                            className="w-full border border-zinc-200 rounded-lg px-2 py-1 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-zinc-500 block mb-1">High Label (e.g. Strongly Agree)</label>
                          <input
                            type="text"
                            value={question.ratingLabels?.high || ''}
                            onChange={(e) => updateQuestion(question.id, {
                              ratingLabels: { ...question.ratingLabels, high: e.target.value },
                            })}
                            className="w-full border border-zinc-200 rounded-lg px-2 py-1 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Question Footer: Points & Required */}
                  <div className="pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                          className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                        />
                        <span className="font-medium text-zinc-700">Required question</span>
                      </label>

                      <div className="flex items-center gap-1.5 pl-3 border-l border-zinc-200">
                        <span className="text-zinc-500">Points:</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={question.points}
                          onChange={(e) => updateQuestion(question.id, { points: Number(e.target.value) || 0 })}
                          className="w-16 border border-zinc-200 rounded-lg px-2 py-1 text-xs font-mono"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 pl-3 border-l border-zinc-200" title="Optional countdown time in seconds for this question">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-zinc-500">Timer:</span>
                        <input
                          type="number"
                          min={5}
                          max={600}
                          placeholder={quiz.settings.timerMode === 'per-question' ? `${quiz.settings.questionTimeLimitSeconds || 30}s` : 'Off'}
                          value={question.timeLimitSeconds ?? ''}
                          onChange={(e) => updateQuestion(question.id, { timeLimitSeconds: e.target.value ? Number(e.target.value) : null })}
                          className="w-16 border border-zinc-200 rounded-lg px-2 py-1 text-xs font-mono"
                        />
                        <span className="text-[11px] text-zinc-400">s</span>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={question.explanation || ''}
                      onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })}
                      placeholder="Feedback shown after completion (explanation)..."
                      className="text-xs text-zinc-500 placeholder:text-zinc-300 border-b border-zinc-200 focus:border-zinc-700 px-2 py-1 focus:outline-none flex-1 max-w-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Add Question Button */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => addQuestion('multiple-choice')}
                className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Multiple Choice
              </button>
              <button
                type="button"
                onClick={() => addQuestion('true-false')}
                className="px-3.5 py-2.5 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                + True / False
              </button>
              <button
                type="button"
                onClick={() => addQuestion('multiple-select')}
                className="px-3.5 py-2.5 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                + Multiple Select
              </button>
              <button
                type="button"
                onClick={() => addQuestion('short-text')}
                className="px-3.5 py-2.5 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                + Short Text
              </button>
              <button
                type="button"
                onClick={() => addQuestion('rating-stars')}
                className="px-3.5 py-2.5 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                + Star Rating
              </button>
            </div>
          </div>
        )}

        {/* ================= DESIGN & LAYOUT STUDIO TAB ================= */}
        {activeTab === 'design' && (
          <div className="space-y-8 animate-in fade-in">
            {/* 1. Quiz Layout Style */}
            <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-zinc-900 font-modern">1. Choose Quiz Presentation Layout</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  How respondents will experience answering questions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Step-by-Step */}
                <div
                  onClick={() => updateQuizField('layout', 'step-by-step')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    quiz.layout === 'step-by-step'
                      ? 'border-zinc-900 bg-zinc-50 shadow-xs'
                      : 'border-zinc-200 hover:border-zinc-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-zinc-900">Step-by-Step</span>
                    {quiz.layout === 'step-by-step' && <Check className="w-4 h-4 text-zinc-900" />}
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Typeform style. Shows one question at a time with keyboard shortcuts (Enter/Keys) and progress bar.
                  </p>
                </div>

                {/* Single Page */}
                <div
                  onClick={() => updateQuizField('layout', 'single-page')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    quiz.layout === 'single-page'
                      ? 'border-zinc-900 bg-zinc-50 shadow-xs'
                      : 'border-zinc-200 hover:border-zinc-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-zinc-900">Single Page Form</span>
                    {quiz.layout === 'single-page' && <Check className="w-4 h-4 text-zinc-900" />}
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Google Forms style. All questions displayed in a clean responsive vertical stream.
                  </p>
                </div>

                {/* Card Deck */}
                <div
                  onClick={() => updateQuizField('layout', 'card-deck')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    quiz.layout === 'card-deck'
                      ? 'border-zinc-900 bg-zinc-50 shadow-xs'
                      : 'border-zinc-200 hover:border-zinc-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-zinc-900">Card Deck</span>
                    {quiz.layout === 'card-deck' && <Check className="w-4 h-4 text-zinc-900" />}
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Interactive card carousel with next/prev slides and subtle card elevation depth.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Aesthetic Theme Presets */}
            <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 font-modern">2. Free Aesthetic Theme Presets</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    1-click curated color schemes, typography, and contrast pairings.
                  </p>
                </div>
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {THEME_PRESETS.map((preset) => {
                  const isSelected = quiz.theme.id === preset.id;

                  return (
                    <div
                      key={preset.id}
                      onClick={() => applyPresetTheme(preset)}
                      className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-zinc-900 shadow-sm'
                          : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                      style={{ backgroundColor: preset.backgroundColor }}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span 
                            className="text-xs font-bold"
                            style={{ color: preset.textColor }}
                          >
                            {preset.name}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-zinc-900" />}
                        </div>

                        {/* Theme preview swatch */}
                        <div className="p-2 rounded-xl border border-black/10 flex items-center gap-2" style={{ backgroundColor: preset.cardBackgroundColor }}>
                          <span 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: preset.primaryColor }}
                          />
                          <span 
                            className="text-[10px] font-medium truncate"
                            style={{ color: preset.textColor }}
                          >
                            Sample Option
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 text-[10px] uppercase font-mono text-zinc-400">
                        {preset.fontFamily} • {preset.cardStyle}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Deep Customization Controls */}
            <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-zinc-900 font-modern">3. Fine-Tune Colors, Typography & Shapes</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Customize every visual element to match your brand or aesthetic taste.
                </p>
              </div>

              {/* Typography Font Picker */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Typography Style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'modern', label: 'Plus Jakarta', desc: 'Modern Sans' },
                    { id: 'editorial', label: 'Fraunces', desc: 'Editorial Serif' },
                    { id: 'friendly', label: 'Outfit', desc: 'Rounded Friendly' },
                    { id: 'tech', label: 'Space Grotesk', desc: 'Modern Display' },
                    { id: 'code', label: 'JetBrains Mono', desc: 'Monospace' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => updateThemeField('fontFamily', f.id as FontFamilyType)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        quiz.theme.fontFamily === f.id
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800'
                      }`}
                    >
                      <div className="text-xs font-bold leading-tight">{f.label}</div>
                      <div className={`text-[10px] mt-0.5 ${quiz.theme.fontFamily === f.id ? 'text-zinc-400' : 'text-zinc-400'}`}>
                        {f.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Customizers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Primary Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={quiz.theme.primaryColor}
                      onChange={(e) => updateThemeField('primaryColor', e.target.value)}
                      className="w-9 h-9 rounded-lg border border-zinc-200 p-0.5 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={quiz.theme.primaryColor}
                      onChange={(e) => updateThemeField('primaryColor', e.target.value)}
                      className="w-full text-xs font-mono border border-zinc-200 rounded-lg px-2.5 py-2 uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Canvas Background Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={quiz.theme.backgroundColor}
                      onChange={(e) => updateThemeField('backgroundColor', e.target.value)}
                      className="w-9 h-9 rounded-lg border border-zinc-200 p-0.5 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={quiz.theme.backgroundColor}
                      onChange={(e) => updateThemeField('backgroundColor', e.target.value)}
                      className="w-full text-xs font-mono border border-zinc-200 rounded-lg px-2.5 py-2 uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Card Background Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={quiz.theme.cardBackgroundColor}
                      onChange={(e) => updateThemeField('cardBackgroundColor', e.target.value)}
                      className="w-9 h-9 rounded-lg border border-zinc-200 p-0.5 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={quiz.theme.cardBackgroundColor}
                      onChange={(e) => updateThemeField('cardBackgroundColor', e.target.value)}
                      className="w-full text-xs font-mono border border-zinc-200 rounded-lg px-2.5 py-2 uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Background Pattern & Card Style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Background Pattern
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['none', 'dots', 'grid', 'mesh'] as PatternType[]).map((pat) => (
                      <button
                        key={pat}
                        type="button"
                        onClick={() => updateThemeField('pattern', pat)}
                        className={`py-2 px-1 text-xs font-semibold rounded-xl border capitalize cursor-pointer transition-colors ${
                          quiz.theme.pattern === pat
                            ? 'border-zinc-900 bg-zinc-900 text-white'
                            : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                        }`}
                      >
                        {pat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Corner Rounding
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['none', 'rounded', 'pill'] as BorderRadiusType[]).map((rad) => (
                      <button
                        key={rad}
                        type="button"
                        onClick={() => updateThemeField('borderRadius', rad)}
                        className={`py-2 px-1 text-xs font-semibold rounded-xl border capitalize cursor-pointer transition-colors ${
                          quiz.theme.borderRadius === rad
                            ? 'border-zinc-900 bg-zinc-900 text-white'
                            : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                        }`}
                      >
                        {rad === 'none' ? 'Sharp' : rad === 'rounded' ? 'Curved' : 'Pill'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= SETTINGS TAB ================= */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Quiz Name & Description Card */}
            <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-zinc-600" />
                <div>
                  <h3 className="text-base font-bold text-zinc-900 font-modern">Quiz Name & Description</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Update the title and welcome instructions displayed to respondents.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Quiz Name / Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={quiz.title}
                    onChange={(e) => updateQuizField('title', e.target.value)}
                    placeholder="e.g. Science Assessment 2026"
                    className="w-full text-sm font-bold text-zinc-900 border border-zinc-200 rounded-xl p-3 focus:border-zinc-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Description / Welcome Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={quiz.description}
                    onChange={(e) => updateQuizField('description', e.target.value)}
                    placeholder="Provide context or instructions for respondents..."
                    className="w-full text-xs text-zinc-700 border border-zinc-200 rounded-xl p-3 focus:border-zinc-900 focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* System Generated Quiz Share Link Card */}
            <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 font-modern">Quiz Share Link</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Official direct link provided by the system for respondents and students to take this quiz.
                  </p>
                </div>
              </div>

              {/* System Provided URL Box */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-zinc-500 uppercase tracking-wider">
                    System Shareable Link
                  </span>
                  <button
                    type="button"
                    onClick={copyShareLink}
                    className="font-semibold text-zinc-800 hover:text-black flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg shadow-2xs cursor-pointer transition-colors"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-zinc-600" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-2.5 bg-white border border-zinc-200 rounded-lg shadow-2xs">
                  <p className="text-xs font-mono text-zinc-800 break-all select-all font-semibold">
                    {getShareableQuizUrl(quiz)}
                  </p>
                </div>

                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Anyone who clicks or opens this link can immediately participate and submit answers. Responses are saved automatically to your dashboard.
                </p>
              </div>
            </div>

            {/* Respondent Data Collection & Access */}
            <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-6">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-zinc-600" />
                <div>
                  <h3 className="text-base font-bold text-zinc-900 font-modern">Respondent Details & Access</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Configure respondent fields (Name, Section, Email), limit submissions, and authorized email list.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Limit 1 submission per user */}
                <label className="flex items-center justify-between p-4 bg-amber-50/70 border border-amber-200 rounded-xl cursor-pointer hover:bg-amber-50 transition-colors">
                  <div className="space-y-0.5 pr-4">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-700" />
                      Limit each user to 1 submission only
                    </span>
                    <span className="text-[11px] text-amber-700/90 block">
                      Enforces exactly 1 response per respondent based on their email and device to prevent retakes.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={quiz.settings.limitOneSubmission ?? true}
                    onChange={(e) => updateSettingsField('limitOneSubmission', e.target.checked)}
                    className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-zinc-900 shrink-0"
                  />
                </label>

                {/* Name Collection */}
                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-zinc-800 block">Collect Respondent Name</span>
                      <span className="text-[11px] text-zinc-500">Prompts respondent for their name on the start screen</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={quiz.settings.collectName}
                      onChange={(e) => updateSettingsField('collectName', e.target.checked)}
                      className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-zinc-900"
                    />
                  </div>
                  {quiz.settings.collectName && (
                    <label className="flex items-center gap-2 pt-2 border-t border-zinc-200/60 text-xs text-zinc-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={quiz.settings.requireName}
                        onChange={(e) => updateSettingsField('requireName', e.target.checked)}
                        className="w-3.5 h-3.5 text-zinc-900 rounded"
                      />
                      <span>Require name before allowing respondent to begin</span>
                    </label>
                  )}
                </div>

                {/* Section / Class Group */}
                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-zinc-800 block">Collect Section / Class Group</span>
                      <span className="text-[11px] text-zinc-500">Prompts respondent for their class, grade section, or group</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={quiz.settings.collectSection ?? true}
                      onChange={(e) => updateSettingsField('collectSection', e.target.checked)}
                      className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-zinc-900"
                    />
                  </div>

                  {(quiz.settings.collectSection ?? true) && (
                    <div className="space-y-3 pt-2.5 border-t border-zinc-200/70">
                      <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={quiz.settings.requireSection ?? true}
                          onChange={(e) => updateSettingsField('requireSection', e.target.checked)}
                          className="w-3.5 h-3.5 text-zinc-900 rounded"
                        />
                        <span>Require section before allowing respondent to begin</span>
                      </label>

                      {/* Section input type */}
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                          Section Input Style
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => updateSettingsField('sectionType', 'free-text')}
                            className={`p-2 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer ${
                              (quiz.settings.sectionType || 'free-text') === 'free-text'
                                ? 'bg-zinc-900 text-white border-zinc-900'
                                : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                            }`}
                          >
                            Free-Text Input
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSettingsField('sectionType', 'dropdown')}
                            className={`p-2 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer ${
                              quiz.settings.sectionType === 'dropdown'
                                ? 'bg-zinc-900 text-white border-zinc-900'
                                : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                            }`}
                          >
                            Predefined Dropdown
                          </button>
                        </div>
                      </div>

                      {/* If Dropdown: creator can add predefined sections */}
                      {quiz.settings.sectionType === 'dropdown' && (
                        <div className="space-y-2.5 p-3.5 bg-white rounded-xl border border-zinc-200">
                          <label className="block text-xs font-semibold text-zinc-700">
                            Predefined Section Choices
                          </label>
                          <div className="flex flex-wrap gap-1.5 mb-1.5">
                            {(quiz.settings.sectionOptions || ['Section A', 'Section B', 'Section C']).map((sec, sIdx) => (
                              <span
                                key={sIdx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 text-zinc-800 text-xs font-medium rounded-lg"
                              >
                                {sec}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const curr = quiz.settings.sectionOptions || ['Section A', 'Section B', 'Section C'];
                                    updateSettingsField('sectionOptions', curr.filter((_, i) => i !== sIdx));
                                  }}
                                  className="text-zinc-400 hover:text-rose-600 cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={newSectionInput}
                              onChange={(e) => setNewSectionInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (newSectionInput.trim()) {
                                    const curr = quiz.settings.sectionOptions || ['Section A', 'Section B', 'Section C'];
                                    updateSettingsField('sectionOptions', [...curr, newSectionInput.trim()]);
                                    setNewSectionInput('');
                                  }
                                }
                              }}
                              placeholder="e.g. Grade 10 - Diamond (Press Enter to add)"
                              className="flex-1 text-xs border border-zinc-200 rounded-lg p-2 focus:border-zinc-900 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (newSectionInput.trim()) {
                                  const curr = quiz.settings.sectionOptions || ['Section A', 'Section B', 'Section C'];
                                  updateSettingsField('sectionOptions', [...curr, newSectionInput.trim()]);
                                  setNewSectionInput('');
                                }
                              }}
                              className="px-3 py-2 bg-zinc-900 text-white text-xs font-semibold rounded-lg hover:bg-zinc-800 cursor-pointer"
                            >
                              Add Section
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Email Collection & Access restriction */}
                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-zinc-800 block">Collect Respondent Email</span>
                      <span className="text-[11px] text-zinc-500">Prompts respondent for their email address</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={quiz.settings.collectEmail}
                      onChange={(e) => updateSettingsField('collectEmail', e.target.checked)}
                      className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-zinc-900"
                    />
                  </div>

                  {quiz.settings.collectEmail && (
                    <div className="space-y-3 pt-2.5 border-t border-zinc-200/70">
                      <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={quiz.settings.requireEmail}
                          onChange={(e) => updateSettingsField('requireEmail', e.target.checked)}
                          className="w-3.5 h-3.5 text-zinc-900 rounded"
                        />
                        <span>Require email before starting</span>
                      </label>

                      {/* Restrict to specific respondent emails */}
                      <div className="p-3.5 bg-white border border-zinc-200 rounded-xl space-y-2.5">
                        <label className="flex items-center justify-between cursor-pointer">
                          <div>
                            <span className="text-xs font-semibold text-zinc-800 block">
                              Restrict to Specific Allowed Emails
                            </span>
                            <span className="text-[11px] text-zinc-500">
                              Only users entering an email from your authorized list will be permitted to answer
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={quiz.settings.restrictToAllowedEmails ?? false}
                            onChange={(e) => updateSettingsField('restrictToAllowedEmails', e.target.checked)}
                            className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-zinc-900 shrink-0"
                          />
                        </label>

                        {quiz.settings.restrictToAllowedEmails && (
                          <div className="space-y-2 pt-2 border-t border-zinc-100">
                            <label className="block text-[11px] font-semibold text-zinc-600">
                              Allowed Respondent Emails ({(quiz.settings.allowedEmails || []).length} registered)
                            </label>
                            <div className="flex flex-wrap gap-1.5 mb-1.5">
                              {(quiz.settings.allowedEmails || []).map((em, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 text-zinc-800 text-xs font-medium rounded-lg"
                                >
                                  {em}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const curr = quiz.settings.allowedEmails || [];
                                      updateSettingsField('allowedEmails', curr.filter((_, i) => i !== idx));
                                    }}
                                    className="text-zinc-400 hover:text-rose-600 cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="email"
                                value={allowedEmailInput}
                                onChange={(e) => setAllowedEmailInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (allowedEmailInput.trim() && allowedEmailInput.includes('@')) {
                                      const curr = quiz.settings.allowedEmails || [];
                                      if (!curr.includes(allowedEmailInput.trim().toLowerCase())) {
                                        updateSettingsField('allowedEmails', [...curr, allowedEmailInput.trim().toLowerCase()]);
                                      }
                                      setAllowedEmailInput('');
                                    }
                                  }
                                }}
                                placeholder="Add email, e.g. student@school.edu"
                                className="flex-1 text-xs border border-zinc-200 rounded-lg p-2 focus:border-zinc-900 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (allowedEmailInput.trim() && allowedEmailInput.includes('@')) {
                                    const curr = quiz.settings.allowedEmails || [];
                                    if (!curr.includes(allowedEmailInput.trim().toLowerCase())) {
                                      updateSettingsField('allowedEmails', [...curr, allowedEmailInput.trim().toLowerCase()]);
                                    }
                                    setAllowedEmailInput('');
                                  }
                                }}
                                className="px-3 py-2 bg-zinc-900 text-white text-xs font-semibold rounded-lg hover:bg-zinc-800 cursor-pointer"
                              >
                                Add Email
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 font-modern">Quiz Countdown Timer</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Set a strict countdown for the whole quiz or each individual question.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTimerModal(true)}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Configure Timer Modal</span>
                </button>
              </div>

              {/* Timer Mode Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => {
                    updateSettingsField('timerMode', 'none');
                    updateSettingsField('timeLimitMinutes', null);
                  }}
                  className={`p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                    (quiz.settings.timerMode === 'none' || (!quiz.settings.timerMode && !quiz.settings.timeLimitMinutes))
                      ? 'border-zinc-900 bg-zinc-50'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900">Untimed</span>
                    <span className="text-[10px] text-zinc-400">No limits</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">Users answer at their own pace.</p>
                </div>

                <div
                  onClick={() => {
                    updateSettingsField('timerMode', 'whole-quiz');
                    if (!quiz.settings.timeLimitMinutes) updateSettingsField('timeLimitMinutes', 15);
                  }}
                  className={`p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                    quiz.settings.timerMode === 'whole-quiz' || (!quiz.settings.timerMode && quiz.settings.timeLimitMinutes)
                      ? 'border-amber-500 bg-amber-50/50'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900">Whole Quiz</span>
                    <span className="text-[10px] text-amber-600 font-bold font-mono">
                      {quiz.settings.timeLimitMinutes || 15}m
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">Single timer for entire quiz.</p>
                </div>

                <div
                  onClick={() => {
                    updateSettingsField('timerMode', 'per-question');
                    if (!quiz.settings.questionTimeLimitSeconds) updateSettingsField('questionTimeLimitSeconds', 30);
                  }}
                  className={`p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                    quiz.settings.timerMode === 'per-question'
                      ? 'border-indigo-600 bg-indigo-50/50'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900">Per-Question</span>
                    <span className="text-[10px] text-indigo-600 font-bold font-mono">
                      {quiz.settings.questionTimeLimitSeconds || 30}s/q
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">Individual timer per question.</p>
                </div>
              </div>

              {/* Conditional Inputs */}
              {(quiz.settings.timerMode === 'whole-quiz' || (!quiz.settings.timerMode && quiz.settings.timeLimitMinutes)) && (
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-800">
                      Total Quiz Duration (Minutes)
                    </label>
                    <span className="text-xs font-mono font-bold text-amber-700">
                      {quiz.settings.timeLimitMinutes || 15} mins
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[5, 10, 15, 20, 30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => updateSettingsField('timeLimitMinutes', mins)}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                          quiz.settings.timeLimitMinutes === mins
                            ? 'bg-amber-500 text-white shadow-2xs'
                            : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                    <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-lg px-2 py-1">
                      <input
                        type="number"
                        min={1}
                        max={300}
                        value={quiz.settings.timeLimitMinutes || ''}
                        onChange={(e) => updateSettingsField('timeLimitMinutes', e.target.value ? Math.max(1, Number(e.target.value)) : null)}
                        placeholder="Custom"
                        className="w-14 text-xs font-mono font-bold text-zinc-900 focus:outline-none"
                      />
                      <span className="text-[11px] text-zinc-400">mins</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    When the timer runs out, the quiz automatically locks and submits. Questions unanswered at timeout will be marked as <strong>wrong (0 pts)</strong> on your dashboard.
                  </p>
                </div>
              )}

              {quiz.settings.timerMode === 'per-question' && (
                <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-800">
                      Default Question Timer (Seconds)
                    </label>
                    <span className="text-xs font-mono font-bold text-indigo-700">
                      {quiz.settings.questionTimeLimitSeconds || 30} secs
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[10, 15, 20, 30, 45, 60, 90].map((secs) => (
                      <button
                        key={secs}
                        type="button"
                        onClick={() => updateSettingsField('questionTimeLimitSeconds', secs)}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                          quiz.settings.questionTimeLimitSeconds === secs
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        {secs}s
                      </button>
                    ))}
                    <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-lg px-2 py-1">
                      <input
                        type="number"
                        min={5}
                        max={600}
                        value={quiz.settings.questionTimeLimitSeconds || ''}
                        onChange={(e) => updateSettingsField('questionTimeLimitSeconds', e.target.value ? Math.max(5, Number(e.target.value)) : 30)}
                        placeholder="Custom"
                        className="w-14 text-xs font-mono font-bold text-zinc-900 focus:outline-none"
                      />
                      <span className="text-[11px] text-zinc-400">secs</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => handleUpdateAllQuestionsTimer(quiz.settings.questionTimeLimitSeconds || 30)}
                      className="text-xs font-semibold px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg transition-colors cursor-pointer"
                    >
                      Apply {quiz.settings.questionTimeLimitSeconds || 30}s to all {quiz.questions.length} questions
                    </button>
                  </div>
                  <p className="text-[11px] text-indigo-900 leading-relaxed">
                    When question timer runs out, it locks. If unanswered, it counts as <strong>wrong (0 pts)</strong> and automatically advances to the next question.
                  </p>
                </div>
              )}
            </div>

            {/* Quiz Submission Deadline Card */}
            <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 font-modern">Quiz Submission Deadline</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Set a strict cutoff timestamp. When the deadline passes, respondents are blocked from answering.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeadlineModal(true)}
                  className={`px-3 py-1.5 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    quiz.settings.deadline
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200'
                  }`}
                >
                  <CalendarClock className={`w-3.5 h-3.5 ${quiz.settings.deadline ? 'text-rose-600' : 'text-zinc-500'}`} />
                  <span>{quiz.settings.deadline ? 'Edit Deadline' : 'Set Deadline'}</span>
                </button>
              </div>

              {quiz.settings.deadline ? (
                (() => {
                  const deadlineDate = new Date(quiz.settings.deadline);
                  const isExpired = deadlineDate.getTime() < Date.now();
                  const formattedTime = deadlineDate.toLocaleString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  });

                  return (
                    <div className={`p-4 rounded-xl border text-xs space-y-3 ${
                      isExpired
                        ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                        : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-xs uppercase tracking-wider block opacity-70">
                            {isExpired ? 'Quiz Status: Closed' : 'Quiz Status: Active until deadline'}
                          </span>
                          <span className="text-sm font-bold block mt-0.5">
                            {formattedTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowDeadlineModal(true)}
                            className="px-2.5 py-1 bg-white border border-current rounded-lg text-xs font-semibold hover:bg-white/80 cursor-pointer"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSettingsField('deadline', null)}
                            className="px-2.5 py-1 bg-white border border-rose-300 text-rose-700 rounded-lg text-xs font-semibold hover:bg-rose-50 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] opacity-80 leading-relaxed">
                        {isExpired
                          ? 'This deadline has already passed. Anyone attempting to take this quiz will see a "Deadline Expired" notice and will not be able to submit answers.'
                          : 'Respondents can take this quiz until the specified timestamp. Once that time arrives, answers can no longer be submitted.'}
                      </p>
                    </div>
                  );
                })()
              ) : (
                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-500 flex items-center justify-between">
                  <span>No deadline is set. The quiz is open indefinitely for respondents.</span>
                  <button
                    type="button"
                    onClick={() => setShowDeadlineModal(true)}
                    className="text-xs font-bold text-zinc-900 hover:underline cursor-pointer"
                  >
                    Add a deadline
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-zinc-900 font-modern">Scoring & Completion Experience</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Customize the passing grade, immediate score display, and completion message.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                      Passing Percentage Threshold (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={quiz.settings.passPercentage}
                      onChange={(e) => updateSettingsField('passPercentage', Number(e.target.value) || 0)}
                      className="w-full text-xs border border-zinc-200 rounded-xl p-2.5 font-mono"
                    />
                    <span className="text-[11px] text-zinc-400 mt-1 block">Respondents at or above this % will receive a Passed badge</span>
                  </div>
                </div>

                <label className="flex items-center justify-between p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl cursor-pointer">
                  <div>
                    <span className="text-xs font-semibold text-zinc-800 block">Show Score & Correct Answers Immediately</span>
                    <span className="text-[11px] text-zinc-500">Upon submission, shows the score badge, confetti, and question explanations</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={quiz.settings.showScoreImmediately}
                    onChange={(e) => updateSettingsField('showScoreImmediately', e.target.checked)}
                    className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-zinc-900"
                  />
                </label>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Completion Screen Title
                  </label>
                  <input
                    type="text"
                    value={quiz.settings.successTitle}
                    onChange={(e) => updateSettingsField('successTitle', e.target.value)}
                    placeholder="e.g. Quiz Complete!"
                    className="w-full text-xs border border-zinc-200 rounded-xl p-2.5 font-semibold text-zinc-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Completion Message
                  </label>
                  <textarea
                    rows={2}
                    value={quiz.settings.successMessage}
                    onChange={(e) => updateSettingsField('successMessage', e.target.value)}
                    placeholder="Thank you message displayed after completing the quiz..."
                    className="w-full text-xs border border-zinc-200 rounded-xl p-2.5 text-zinc-800 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Live Preview Modal */}
      {showLivePreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-6 animate-in fade-in">
          <div className="relative w-full max-w-5xl h-[92vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-zinc-300">
            {/* Modal Header */}
            <div className="px-6 py-3.5 bg-zinc-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold tracking-tight font-modern">
                  Live Preview: {quiz.title || 'Untitled Quiz'}
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  [{quiz.layout} • {quiz.theme.name}]
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center bg-zinc-800 rounded-lg p-0.5">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      previewDevice === 'desktop' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Desktop
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      previewDevice === 'mobile' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Mobile
                  </button>
                </div>

                <button
                  onClick={() => setShowLivePreviewModal(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Preview Frame Container */}
            <div className="flex-1 overflow-y-auto bg-zinc-800/40 p-4 flex items-center justify-center">
              <div 
                className={`transition-all duration-300 h-full w-full overflow-y-auto rounded-2xl shadow-xl border border-zinc-300 bg-white ${
                  previewDevice === 'mobile' ? 'max-w-sm max-h-[720px]' : 'max-w-4xl'
                }`}
              >
                <QuizTaker
                  quiz={quiz}
                  isPreviewMode={true}
                  onExitPreview={() => setShowLivePreviewModal(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Creation Limit Notification Modal */}
      <QuizLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        currentCount={15}
        maxCount={15}
        onManageQuizzes={onBack}
      />

      {/* Timer Configuration Modal */}
      <TimerConfigModal
        isOpen={showTimerModal}
        onClose={() => setShowTimerModal(false)}
        quiz={quiz}
        onUpdateSettings={({ timerMode, timeLimitMinutes, questionTimeLimitSeconds }) => {
          setQuiz((prev) => ({
            ...prev,
            settings: {
              ...prev.settings,
              timerMode,
              timeLimitMinutes,
              questionTimeLimitSeconds,
            },
          }));
        }}
        onUpdateAllQuestionsTimer={handleUpdateAllQuestionsTimer}
      />

      {/* Deadline Configuration Modal */}
      <DeadlineConfigModal
        isOpen={showDeadlineModal}
        onClose={() => setShowDeadlineModal(false)}
        quiz={quiz}
        onUpdateDeadline={(deadline) => updateSettingsField('deadline', deadline)}
      />
    </div>
  );
};
