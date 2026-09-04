import React, { useState } from 'react';
import { Quiz, MAX_QUIZZES_PER_USER } from '../types';
import { getShareableQuizUrl } from '../lib/quizHelpers';
import { 
  Plus, 
  Sparkles, 
  Share2, 
  BarChart2, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Check, 
  Users, 
  Layers, 
  FileQuestion, 
  Copy,
  Clock,
  ArrowRight,
  AlertTriangle,
  Link2,
  Search
} from 'lucide-react';
import { STARTER_TEMPLATES } from '../data/presets';
import { QuizLimitModal } from './QuizLimitModal';
import { CustomSlugModal } from './CustomSlugModal';

interface DashboardProps {
  quizzes: Quiz[];
  loading: boolean;
  onEditQuiz: (quiz: Quiz) => void;
  onViewResponses: (quiz: Quiz) => void;
  onTakeQuiz: (quizId: string) => void;
  onCreateNewQuiz: (templateIndex?: number) => void;
  onDeleteQuiz: (quizId: string) => void;
  onLoadSamples: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  quizzes,
  loading,
  onEditQuiz,
  onViewResponses,
  onTakeQuiz,
  onCreateNewQuiz,
  onDeleteQuiz,
  onLoadSamples,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [customSlugQuiz, setCustomSlugQuiz] = useState<Quiz | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [templateCategory, setTemplateCategory] = useState<string>('All');
  const [templateQuery, setTemplateQuery] = useState<string>('');

  const totalResponses = quizzes.reduce((acc, q) => acc + (q.responseCount || 0), 0);
  const totalQuestions = quizzes.reduce((acc, q) => acc + (q.questions?.length || 0), 0);
  const isLimitReached = quizzes.length >= MAX_QUIZZES_PER_USER;

  // Filter templates by category and search query with original index retained
  const filteredTemplates = STARTER_TEMPLATES.map((tmpl, idx) => ({ ...tmpl, originalIndex: idx })).filter((tmpl) => {
    const matchesCategory = templateCategory === 'All' || tmpl.category === templateCategory;
    const query = templateQuery.toLowerCase().trim();
    const matchesQuery = !query || 
      tmpl.title.toLowerCase().includes(query) || 
      tmpl.description.toLowerCase().includes(query) ||
      tmpl.layout.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });

  const handleInitiateCreateQuiz = () => {
    if (isLimitReached) {
      setShowLimitModal(true);
      return;
    }
    setShowTemplatesModal(true);
  };

  const handleSelectTemplate = (templateIndex?: number) => {
    if (isLimitReached) {
      setShowTemplatesModal(false);
      setShowLimitModal(true);
      return;
    }
    setShowTemplatesModal(false);
    onCreateNewQuiz(templateIndex);
  };

  const handleTriggerLoadSamples = () => {
    if (isLimitReached || quizzes.length + 3 > MAX_QUIZZES_PER_USER) {
      setShowLimitModal(true);
      return;
    }
    onLoadSamples();
  };

  const copyQuizLink = (quiz: Quiz, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getShareableQuizUrl(quiz);
    navigator.clipboard.writeText(url);
    setCopiedId(quiz.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSlugUpdated = (newSlug: string) => {
    if (customSlugQuiz) {
      customSlugQuiz.customSlug = newSlug;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in">
      {/* Top Banner / Stats Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight font-modern">
            Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleInitiateCreateQuiz}
            className={`flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer ${
              isLimitReached
                ? 'bg-zinc-800 hover:bg-zinc-700'
                : 'bg-zinc-900 hover:bg-zinc-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Create Quiz</span>
            <span className={`text-[11px] px-1.5 py-0.5 rounded font-mono ${
              isLimitReached ? 'bg-rose-500/30 text-rose-200' : 'bg-white/20 text-white'
            }`}>
              {quizzes.length}/{MAX_QUIZZES_PER_USER}
            </span>
          </button>
        </div>
      </div>

      {/* 15 Quizzes Limit Alert Notification Banner */}
      {isLimitReached && (
        <div className="p-4 sm:p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start justify-between gap-3 text-rose-950 shadow-2xs animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-rose-900">
                  Quiz Creation Limit Reached (15 / 15)
                </h4>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-200/80 text-rose-800 border border-rose-300">
                  Account Quota Full
                </span>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed max-w-2xl">
                You have created the maximum allowed 15 quizzes. To create a new quiz or load templates, please delete some of your existing quizzes below.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowLimitModal(true)}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shrink-0"
          >
            Details
          </button>
        </div>
      )}

      {/* Metrics Row - Only Total Quizzes, Submissions, Questions Created */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Quizzes</span>
            <Layers className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold text-zinc-900 font-modern">
              {quizzes.length}
              <span className="text-xs font-medium text-zinc-400 ml-1.5">/ {MAX_QUIZZES_PER_USER}</span>
            </p>
            {isLimitReached ? (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                15 / 15 Full
              </span>
            ) : (
              <span className="text-[11px] font-medium text-zinc-500">
                {MAX_QUIZZES_PER_USER - quizzes.length} slots left
              </span>
            )}
          </div>
        </div>

        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Submissions</span>
            <Users className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 font-modern">{totalResponses}</p>
        </div>

        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Questions Created</span>
            <FileQuestion className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 font-modern">{totalQuestions}</p>
        </div>
      </div>

      {/* Quizzes List */}
      <div id="quizzes-section">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-zinc-900">Your Quizzes</h2>
          {quizzes.length > 0 && (
            <span className="text-xs text-zinc-500">
              Click "Copy Link" to send to your respondents
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-zinc-900 border-t-transparent" />
            <p className="text-sm text-zinc-500 mt-3">Loading your quizzes from Firestore...</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="p-10 border-2 border-dashed border-zinc-200 rounded-3xl bg-zinc-50/60 text-center max-w-2xl mx-auto space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900">No quizzes created yet</h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1 leading-relaxed">
                Build your first quiz from scratch, or instantly import one of our free aesthetically designed starter templates to see how it works.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={handleInitiateCreateQuiz}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Choose Design Template
              </button>
              <button
                onClick={handleTriggerLoadSamples}
                className="px-4 py-2 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Load 3 Aesthetic Samples
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {quizzes.map((quiz) => {
              const shareUrl = getShareableQuizUrl(quiz);
              const isCopied = copiedId === quiz.id;

              return (
                <div
                  key={quiz.id}
                  className="group relative bg-white border border-zinc-200 hover:border-zinc-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  {/* Card Top: Badges & Actions */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Layout badge */}
                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-zinc-100 text-zinc-700 rounded-md capitalize">
                          {quiz.layout === 'step-by-step' ? 'Step-by-step' : quiz.layout === 'single-page' ? 'Single page' : 'Card deck'}
                        </span>
                        {/* Theme chip */}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-zinc-50 border border-zinc-200 text-zinc-600 rounded-md">
                          <span 
                            className="w-2 h-2 rounded-full border border-black/10" 
                            style={{ backgroundColor: quiz.theme?.primaryColor || '#18181b' }}
                          />
                          {quiz.theme?.name || 'Custom Theme'}
                        </span>
                        {/* Custom slug badge if present */}
                        {quiz.customSlug && (
                          <span className="px-2 py-0.5 text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 rounded-md truncate max-w-[120px]">
                            {quiz.customSlug}
                          </span>
                        )}
                      </div>

                      {/* Submissions count chip */}
                      <button
                        onClick={() => onViewResponses(quiz)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer"
                        title="View response analytics"
                      >
                        <Users className="w-3 h-3" />
                        <span>{quiz.responseCount || 0} answers</span>
                      </button>
                    </div>

                    <h3 className="text-base font-bold text-zinc-900 group-hover:text-black line-clamp-1">
                      {quiz.title}
                    </h3>
                    <p className="text-xs text-zinc-500 line-clamp-2 mt-1 leading-relaxed min-h-[32px]">
                      {quiz.description || 'No description provided.'}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-3 pt-3 border-t border-zinc-100">
                      <span className="flex items-center gap-1">
                        <FileQuestion className="w-3 h-3" />
                        {quiz.questions?.length || 0} questions
                      </span>
                      {quiz.settings?.timeLimitMinutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {quiz.settings.timeLimitMinutes} mins
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom: Share & Action Buttons */}
                  <div className="pt-4 mt-3 border-t border-zinc-100 space-y-2.5">
                    {/* Shareable Link Box with Edit Link button */}
                    <div className="flex items-center gap-1 p-1 bg-zinc-50 border border-zinc-200 rounded-xl">
                      <input
                        type="text"
                        readOnly
                        value={shareUrl}
                        className="bg-transparent text-[11px] font-mono text-zinc-600 px-2 flex-1 truncate focus:outline-none"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCustomSlugQuiz(quiz);
                        }}
                        className="px-2 py-1 text-[11px] font-semibold rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                        title="Edit custom quiz link (e.g. damonquiz-title)"
                      >
                        <Link2 className="w-3 h-3 text-zinc-500" />
                        <span>Edit Link</span>
                      </button>
                      <button
                        onClick={(e) => copyQuizLink(quiz, e)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Quick navigation buttons */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      <button
                        onClick={() => onViewResponses(quiz)}
                        className="py-1.5 px-2 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Responses & Analytics"
                      >
                        <BarChart2 className="w-3.5 h-3.5 text-zinc-600" />
                        <span>Responses</span>
                      </button>

                      <button
                        onClick={() => onEditQuiz(quiz)}
                        className="py-1.5 px-2 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Edit Quiz & Layout"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-zinc-600" />
                        <span>Edit Design</span>
                      </button>

                      <button
                        onClick={() => onTakeQuiz(quiz.customSlug || quiz.id)}
                        className="py-1.5 px-2 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Test link as respondent"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-600" />
                        <span>Test Link</span>
                      </button>
                    </div>

                    {/* Delete Confirm */}
                    <div className="flex justify-end pt-1">
                      {deleteConfirmId === quiz.id ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-zinc-500">Delete quiz?</span>
                          <button
                            onClick={() => {
                              onDeleteQuiz(quiz.id);
                              setDeleteConfirmId(null);
                            }}
                            className="text-rose-600 hover:text-rose-700 font-bold px-1.5 py-0.5 rounded cursor-pointer"
                          >
                            Yes, delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-zinc-500 hover:text-zinc-700 px-1.5 py-0.5 rounded cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(quiz.id)}
                          className="text-[11px] text-zinc-400 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Choose Template Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-zinc-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div>
                <h3 className="text-xl font-bold text-zinc-900 tracking-tight font-modern">
                  Create a New Quiz
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Pick a curated aesthetic design template or start completely fresh.
                </p>
              </div>
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 pt-4">
              {/* Blank Option */}
              <div 
                onClick={() => handleSelectTemplate()}
                className="p-4 sm:p-5 border-2 border-zinc-200 hover:border-zinc-900 rounded-2xl cursor-pointer transition-all flex items-center justify-between group bg-white hover:shadow-xs"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-zinc-100 text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white flex items-center justify-center transition-colors">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">Blank Canvas</h4>
                    <p className="text-xs text-zinc-500">Design your own quiz or form completely from scratch.</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-1 transition-all" />
              </div>

              {/* Filter Tabs & Search Bar */}
              <div className="pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  {/* Category Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {['All', 'Quiz', 'Form', 'Survey'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setTemplateCategory(cat)}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                          templateCategory === cat
                            ? 'bg-zinc-900 text-white shadow-2xs'
                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
                        }`}
                      >
                        {cat === 'All' ? `All (${STARTER_TEMPLATES.length})` : cat}
                      </button>
                    ))}
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={templateQuery}
                      onChange={(e) => setTemplateQuery(e.target.value)}
                      placeholder="Search templates..."
                      className="pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 w-full sm:w-44"
                    />
                  </div>
                </div>

                {filteredTemplates.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-zinc-200 rounded-2xl">
                    <p className="text-xs text-zinc-500">No templates match your search.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                    {filteredTemplates.map((tmpl) => (
                      <div
                        key={tmpl.originalIndex}
                        onClick={() => handleSelectTemplate(tmpl.originalIndex)}
                        className="p-4 border border-zinc-200 hover:border-zinc-900 rounded-2xl cursor-pointer transition-all hover:shadow-xs bg-zinc-50/50 hover:bg-white flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1.5 mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-zinc-200 text-zinc-700 font-mono">
                                {tmpl.layout}
                              </span>
                              {tmpl.category && (
                                <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-zinc-100 text-zinc-600 border border-zinc-200/60">
                                  {tmpl.category}
                                </span>
                              )}
                            </div>
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-500">
                              <span 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: tmpl.theme.primaryColor }}
                              />
                              {tmpl.theme.name}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-zinc-900 line-clamp-1 group-hover:text-zinc-950">{tmpl.title}</h4>
                          <p className="text-[11px] text-zinc-500 line-clamp-2 mt-1 leading-relaxed">{tmpl.description}</p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-zinc-200/60 flex items-center justify-between text-[10px] text-zinc-400 font-semibold">
                          <span>{tmpl.questions.length} Questions</span>
                          <span className="text-zinc-900 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            Use Template <ArrowRight className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 15 Quizzes Maximum Limit Modal */}
      <QuizLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        currentCount={quizzes.length}
        maxCount={MAX_QUIZZES_PER_USER}
        onManageQuizzes={() => {
          setShowLimitModal(false);
          const el = document.getElementById('quizzes-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Edit Custom Quiz Link Slug Modal */}
      {customSlugQuiz && (
        <CustomSlugModal
          isOpen={!!customSlugQuiz}
          onClose={() => setCustomSlugQuiz(null)}
          quiz={customSlugQuiz}
          onSlugUpdated={handleSlugUpdated}
        />
      )}
    </div>
  );
};
