import React, { useState, useEffect, useMemo } from 'react';
import { Quiz, QuizResponse, EvaluatedAnswer } from '../types';
import { getQuizResponses, deleteQuizResponse, updateQuizResponseGrading } from '../lib/quizDbService';
import { getShareableQuizUrl, exportResponsesToCSV, copyResponsesForSpreadsheet } from '../lib/quizHelpers';
import { QRCodeModal } from './QRCodeModal';
import { 
  ArrowLeft, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  BarChart3, 
  Users, 
  Award, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileSpreadsheet,
  Sheet,
  X,
  Sparkles,
  Trash2,
  ShieldAlert,
  QrCode,
  Filter,
  ArrowUpDown
} from 'lucide-react';

interface QuizResponsesViewProps {
  quiz: Quiz;
  onBack: () => void;
  onTakeQuiz: (quizId: string) => void;
}

export const QuizResponsesView: React.FC<QuizResponsesViewProps> = ({
  quiz,
  onBack,
  onTakeQuiz,
}) => {
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'individual'>('summary');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'score-desc' | 'score-asc' | 'name-asc'>('newest');
  const [expandedResponseId, setExpandedResponseId] = useState<string | null>(null);
  const [confirmDeleteResponseId, setConfirmDeleteResponseId] = useState<string | null>(null);
  const [deletingResponseId, setDeletingResponseId] = useState<string | null>(null);
  const [gradingUpdatingKey, setGradingUpdatingKey] = useState<string | null>(null);
  const [showSpreadsheetModal, setShowSpreadsheetModal] = useState(false);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [spreadsheetToast, setSpreadsheetToast] = useState<string | null>(null);
  const [spreadsheetCopied, setSpreadsheetCopied] = useState(false);

  const fetchResponses = async () => {
    setLoading(true);
    const data = await getQuizResponses(quiz.id);
    setResponses(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchResponses();
  }, [quiz.id]);

  // Extract unique sections from responses + quiz preset sections
  const availableSections = useMemo(() => {
    const set = new Set<string>();
    (quiz.settings.availableSections || []).forEach((s) => {
      if (s && s.trim()) set.add(s.trim());
    });
    responses.forEach((r) => {
      if (r.respondentSection && r.respondentSection.trim()) {
        set.add(r.respondentSection.trim());
      }
    });
    return Array.from(set);
  }, [quiz.settings.availableSections, responses]);

  const handleDeleteResponse = async (res: QuizResponse) => {
    setDeletingResponseId(res.id);
    try {
      await deleteQuizResponse(quiz.id, res.id, res.respondentEmail);
      setResponses((prev) => prev.filter((item) => item.id !== res.id));
      setConfirmDeleteResponseId(null);
      if (expandedResponseId === res.id) setExpandedResponseId(null);
      setSpreadsheetToast(`Deleted submission from "${res.respondentName || 'Anonymous'}" and unlocked their email for retake.`);
      setTimeout(() => setSpreadsheetToast(null), 4500);
    } catch (err) {
      console.error('Failed to delete response:', err);
    } finally {
      setDeletingResponseId(null);
    }
  };

  const handleManualGradeOverride = async (
    res: QuizResponse,
    questionId: string,
    markCorrect: boolean,
    customPoints?: number
  ) => {
    const q = quiz.questions.find((item) => item.id === questionId);
    if (!q) return;

    const key = `${res.id}_${questionId}`;
    setGradingUpdatingKey(key);

    try {
      const maxPts = q.points || 0;
      const newPointsEarned = customPoints !== undefined ? Math.max(0, Math.min(maxPts, customPoints)) : (markCorrect ? maxPts : 0);

      // Build updated evaluatedAnswers list
      const existingEval: EvaluatedAnswer[] = res.evaluatedAnswers && res.evaluatedAnswers.length > 0
        ? [...res.evaluatedAnswers]
        : quiz.questions.map((quest) => ({
            questionId: quest.id,
            answer: res.answers[quest.id],
            isCorrect: false,
            pointsEarned: 0,
            maxPoints: quest.points || 0,
          }));

      const updatedEval = existingEval.map((ea) => {
        if (ea.questionId === questionId) {
          return {
            ...ea,
            isCorrect: markCorrect,
            isTimedOut: false,
            pointsEarned: newPointsEarned,
            maxPoints: maxPts,
          };
        }
        return ea;
      });

      const totalScore = updatedEval.reduce((sum, ea) => sum + (ea.pointsEarned || 0), 0);
      const maxScore = res.maxScore || quiz.questions.reduce((sum, quest) => sum + (quest.points || 0), 0);
      const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 100;
      const isPassed = percentage >= (quiz.settings.passPercentage || 0);
      const correctCount = updatedEval.filter((ea) => ea.isCorrect).length;
      const wrongCount = updatedEval.length - correctCount;

      await updateQuizResponseGrading(quiz.id, res.id, {
        totalScore,
        percentage,
        isPassed,
        correctCount,
        wrongCount,
        evaluatedAnswers: updatedEval,
      });

      setResponses((prev) =>
        prev.map((item) =>
          item.id === res.id
            ? {
                ...item,
                totalScore,
                percentage,
                isPassed,
                correctCount,
                wrongCount,
                evaluatedAnswers: updatedEval,
              }
            : item
        )
      );
    } catch (err) {
      console.error('Error updating manual grade:', err);
    } finally {
      setGradingUpdatingKey(null);
    }
  };

  const copyShareLink = () => {
    const url = getShareableQuizUrl(quiz.id);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadSpreadsheet = () => {
    exportResponsesToCSV(quiz, responses);
    setSpreadsheetToast(`Spreadsheet downloaded! All ${responses.length} respondent records exported to .CSV (Excel & Sheets compatible).`);
    setTimeout(() => setSpreadsheetToast(null), 5000);
  };

  const handleCopyForSpreadsheet = async () => {
    const success = await copyResponsesForSpreadsheet(quiz, responses);
    if (success) {
      setSpreadsheetCopied(true);
      setSpreadsheetToast('✔ Table copied to clipboard! Open your Google Sheet or Excel and press Ctrl+V to paste.');
      setTimeout(() => {
        setSpreadsheetCopied(false);
        setSpreadsheetToast(null);
      }, 4500);
    }
  };

  const handleOpenGoogleSheets = async () => {
    await copyResponsesForSpreadsheet(quiz, responses);
    window.open('https://sheets.new', '_blank');
    setSpreadsheetToast('✔ Records copied! A new Google Sheet has been opened — press Ctrl+V to paste.');
    setTimeout(() => setSpreadsheetToast(null), 5000);
  };

  // Metrics computation
  const totalCount = responses.length;
  const avgScore = totalCount > 0 
    ? Math.round(responses.reduce((acc, r) => acc + (r.totalScore || 0), 0) / totalCount)
    : 0;
  const avgPercentage = totalCount > 0 
    ? Math.round(responses.reduce((acc, r) => acc + (r.percentage || 0), 0) / totalCount)
    : 0;
  const passCount = responses.filter((r) => r.isPassed).length;
  const passRate = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0;
  const avgTimeSeconds = totalCount > 0 
    ? Math.round(responses.reduce((acc, r) => acc + (r.timeSpentSeconds || 0), 0) / totalCount)
    : 0;
  
  const formatTime = (secs: number) => {
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}m ${remainder}s`;
  };

  const filteredResponses = useMemo(() => {
    const list = responses.filter((r) => {
      const name = (r.respondentName || '').toLowerCase();
      const email = (r.respondentEmail || '').toLowerCase();
      const section = (r.respondentSection || '').toLowerCase();
      const term = searchTerm.toLowerCase();
      const matchesSearch = name.includes(term) || email.includes(term) || section.includes(term);
      const matchesSection =
        selectedSectionFilter === 'all' ||
        (r.respondentSection || '').trim().toLowerCase() === selectedSectionFilter.trim().toLowerCase();
      return matchesSearch && matchesSection;
    });

    return list.sort((a, b) => {
      if (sortBy === 'score-desc') return (b.percentage || 0) - (a.percentage || 0);
      if (sortBy === 'score-asc') return (a.percentage || 0) - (b.percentage || 0);
      if (sortBy === 'name-asc') return (a.respondentName || '').localeCompare(b.respondentName || '');
      const timeA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : 0;
      const timeB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : 0;
      return timeB - timeA;
    });
  }, [responses, searchTerm, selectedSectionFilter, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
        <div className="flex items-start gap-4">
          <button
            onClick={onBack}
            className="p-2 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-xl text-zinc-600 transition-colors cursor-pointer mt-0.5"
            title="Back to Quizzes"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-bold bg-zinc-100 text-zinc-700 rounded-md">
                Responses Dashboard
              </span>
              <span className="text-xs text-zinc-400">•</span>
              <span className="text-xs text-zinc-500 font-mono">Quiz ID: {quiz.id.slice(0, 8)}...</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight font-modern mt-1">
              {quiz.title}
            </h1>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchResponses}
            className="p-2.5 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-xl transition-colors cursor-pointer"
            title="Refresh submissions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowQRCodeModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            title="Show Classroom QR Code & Access PIN"
          >
            <QrCode className="w-4 h-4 text-zinc-600" />
            <span>QR Code</span>
          </button>

          <button
            onClick={copyShareLink}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-zinc-500" />
                <span>Copy Quiz Link</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowSpreadsheetModal(true)}
            disabled={totalCount === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            title="Choose how to put records inside a spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Put in Spreadsheet</span>
          </button>

          <button
            onClick={handleDownloadSpreadsheet}
            disabled={totalCount === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            title={`Download all ${totalCount} records as a universal .CSV spreadsheet (supports 100+ respondents)`}
          >
            <Download className="w-4 h-4 text-zinc-500" />
            <span>Download .CSV ({totalCount})</span>
          </button>

          <button
            onClick={() => onTakeQuiz(quiz.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Test Quiz</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Status Toast Banner */}
      {spreadsheetToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{spreadsheetToast}</span>
          </div>
          <button 
            onClick={() => setSpreadsheetToast(null)} 
            className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Respondents</span>
            <Users className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 font-modern">{totalCount}</p>
          <span className="text-[11px] text-zinc-400 mt-1 block">Completed submissions</span>
        </div>

        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Average Score</span>
            <Award className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="text-2xl font-bold text-indigo-600 font-modern">
            {avgPercentage}%
            <span className="text-xs font-normal text-zinc-400 ml-1.5 font-sans">({avgScore} pts)</span>
          </p>
          <span className="text-[11px] text-zinc-400 mt-1 block">Across all questions</span>
        </div>

        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Pass Rate</span>
            <CheckCircle2 className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 font-modern">{passRate}%</p>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            {passCount} of {totalCount} passed ({quiz.settings.passPercentage || 0}% threshold)
          </span>
        </div>

        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Avg. Completion Time</span>
            <Clock className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 font-modern">{formatTime(avgTimeSeconds)}</p>
          <span className="text-[11px] text-zinc-400 mt-1 block">Time spent taking quiz</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-200">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('summary')}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'summary'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Question Breakdown & Summary
          </button>
          <button
            onClick={() => setActiveTab('individual')}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'individual'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Individual Submissions ({responses.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-zinc-900 border-t-transparent" />
          <p className="text-sm text-zinc-500 mt-3">Fetching submission records...</p>
        </div>
      ) : totalCount === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-zinc-200 rounded-3xl bg-zinc-50/50 max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 mx-auto rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900">No responses yet</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1 leading-relaxed">
              Send the quiz link to respondents or test submit an answer yourself. Submissions update here automatically.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={copyShareLink}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Copy Link to Share
            </button>
            <button
              onClick={() => onTakeQuiz(quiz.id)}
              className="px-4 py-2 bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Take Quiz as Respondent
            </button>
          </div>
        </div>
      ) : activeTab === 'summary' ? (
        /* Question Summary Breakdown */
        <div className="space-y-6">
          {quiz.questions.map((question, qIdx) => {
            // Calculate stats for this question across all responses
            const answersForQ = responses.map((r) => r.answers[question.id]).filter((a) => a !== undefined);
            
            return (
              <div key={question.id} className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-2xs space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[11px] font-bold bg-zinc-100 text-zinc-700 rounded">
                        Question {qIdx + 1}
                      </span>
                      <span className="text-xs text-zinc-400 capitalize">
                        {question.type.replace('-', ' ')}
                      </span>
                      {question.points > 0 && (
                        <span className="text-xs text-zinc-500 font-medium">
                          ({question.points} pts)
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-zinc-900 mt-1">
                      {question.title}
                    </h3>
                    {question.description && (
                      <p className="text-xs text-zinc-500 mt-0.5">{question.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500 shrink-0 font-medium">
                    {answersForQ.length} responses
                  </span>
                </div>

                {/* Question Type Visualizer */}
                {question.type === 'multiple-choice' || question.type === 'true-false' ? (
                  <div className="space-y-2 pt-2">
                    {question.options?.map((opt) => {
                      const count = responses.filter((r) => r.answers[question.id] === opt.id || r.answers[question.id] === opt.text).length;
                      const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

                      return (
                        <div key={opt.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-medium">
                            <span className="flex items-center gap-2 text-zinc-800">
                              {opt.text}
                              {opt.isCorrect && (
                                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                                  Correct Answer
                                </span>
                              )}
                            </span>
                            <span className="text-zinc-500 font-mono">
                              {count} ({percentage}%)
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all rounded-full ${
                                opt.isCorrect ? 'bg-emerald-500' : 'bg-zinc-800'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : question.type === 'multiple-select' ? (
                  <div className="space-y-2 pt-2">
                    {question.options?.map((opt) => {
                      const count = responses.filter((r) => {
                        const val = r.answers[question.id];
                        return Array.isArray(val) && (val.includes(opt.id) || val.includes(opt.text));
                      }).length;
                      const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

                      return (
                        <div key={opt.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-medium">
                            <span className="flex items-center gap-2 text-zinc-800">
                              {opt.text}
                              {opt.isCorrect && (
                                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                                  Correct Option
                                </span>
                              )}
                            </span>
                            <span className="text-zinc-500 font-mono">
                              {count} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all rounded-full ${
                                opt.isCorrect ? 'bg-emerald-500' : 'bg-zinc-800'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : question.type === 'rating-stars' || question.type === 'opinion-scale' ? (
                  <div className="pt-2">
                    {(() => {
                      const numValues = responses
                        .map((r) => Number(r.answers[question.id]))
                        .filter((v) => !isNaN(v) && v > 0);
                      const avgRating = numValues.length > 0
                        ? (numValues.reduce((a, b) => a + b, 0) / numValues.length).toFixed(1)
                        : 'N/A';
                      const maxR = question.maxRating || (question.type === 'opinion-scale' ? 10 : 5);

                      return (
                        <div className="flex items-center gap-6 p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
                          <div>
                            <span className="text-xs text-zinc-500 font-medium block">Average Score</span>
                            <span className="text-3xl font-extrabold text-zinc-900 font-modern">{avgRating}</span>
                            <span className="text-xs text-zinc-400 font-sans ml-1">/ {maxR}</span>
                          </div>
                          <div className="h-10 w-px bg-zinc-200" />
                          <div className="text-xs text-zinc-500 space-y-1">
                            <div>Scale: 1 ({question.ratingLabels?.low || 'Min'}) to {maxR} ({question.ratingLabels?.high || 'Max'})</div>
                            <div>Total ratings submitted: {numValues.length}</div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  /* Text Answers list */
                  <div className="pt-2 space-y-2 max-h-56 overflow-y-auto pr-2">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                      Written Submissions ({answersForQ.length})
                    </span>
                    {answersForQ.length === 0 ? (
                      <p className="text-xs text-zinc-400 italic">No written responses yet.</p>
                    ) : (
                      answersForQ.map((ans, idx) => (
                        <div key={idx} className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 leading-relaxed">
                          "{String(ans)}"
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Individual Responses Table */
        <div className="space-y-4">
          {/* Spreadsheet Choice Banner */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  Spreadsheet Records Export
                </h4>
                <p className="text-xs text-emerald-800">
                  Choose how to put these {totalCount} records inside your spreadsheet:
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={handleDownloadSpreadsheet}
                disabled={totalCount === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                title={`Download all ${totalCount} records to .CSV file (supports 100+ respondents)`}
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>Download .CSV ({totalCount})</span>
              </button>
              <button 
                onClick={handleCopyForSpreadsheet}
                disabled={totalCount === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                title="Copy table to clipboard formatted with tabs for instant pasting into any Google Sheet or Excel"
              >
                {spreadsheetCopied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5 text-emerald-700" />}
                <span>{spreadsheetCopied ? 'Copied Table!' : 'Copy for Sheets'}</span>
              </button>
              <button 
                onClick={handleOpenGoogleSheets}
                disabled={totalCount === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                title="Launch a new Google Sheet and copy records ready to paste"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Google Sheets</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name, section, or email..."
                  className="w-full pl-9 pr-4 py-2 text-xs border border-zinc-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              {/* Section / Class Filter */}
              {availableSections.length > 0 && (
                <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-xl px-3 py-1.5">
                  <Filter className="w-3.5 h-3.5 text-zinc-400" />
                  <select
                    value={selectedSectionFilter}
                    onChange={(e) => setSelectedSectionFilter(e.target.value)}
                    className="text-xs font-semibold text-zinc-700 bg-transparent focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Sections ({responses.length})</option>
                    {availableSections.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sort Selector */}
              <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-xl px-3 py-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-xs font-semibold text-zinc-700 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="newest">Sort: Newest First</option>
                  <option value="score-desc">Sort: Highest Score</option>
                  <option value="score-asc">Sort: Lowest Score</option>
                  <option value="name-asc">Sort: Name (A–Z)</option>
                </select>
              </div>
            </div>

            <span className="text-xs text-zinc-500 font-medium">
              Showing {filteredResponses.length} of {responses.length}
            </span>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Respondent</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Time Spent</th>
                    <th className="py-3 px-4">Submitted At</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/70">
                  {filteredResponses.map((res) => {
                    const isExpanded = expandedResponseId === res.id;
                    const dateStr = res.submittedAt?.toDate 
                      ? res.submittedAt.toDate().toLocaleString() 
                      : (typeof res.submittedAt === 'string' ? res.submittedAt : 'Recent');

                    return (
                      <React.Fragment key={res.id}>
                        <tr 
                          onClick={() => setExpandedResponseId(isExpanded ? null : res.id)}
                          className="hover:bg-zinc-50/70 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4 font-semibold text-zinc-900">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span>{res.respondentName || 'Anonymous Respondent'}</span>
                              {res.respondentSection && (
                                <span className="px-2 py-0.5 text-[10px] font-semibold bg-zinc-100 text-zinc-700 rounded-md border border-zinc-200">
                                  {res.respondentSection}
                                </span>
                              )}
                              {(res.timedOut || (res.unansweredCount && res.unansweredCount > 0)) && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200" title="Submitted due to timer running out">
                                  <Clock className="w-2.5 h-2.5 text-amber-600" />
                                  Timed Out ({res.unansweredCount || 0} unanswered)
                                </span>
                              )}
                              {(res.tabSwitchCount ?? 0) > 0 && (
                                <span
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200"
                                  title="Respondent switched tabs or left window during quiz"
                                >
                                  <ShieldAlert className="w-2.5 h-2.5 text-rose-600" />
                                  {res.tabSwitchCount} Tab Switch{res.tabSwitchCount === 1 ? '' : 'es'}
                                </span>
                              )}
                            </div>
                            {res.respondentEmail && (
                              <div className="text-[11px] text-zinc-400 font-normal">{res.respondentEmail}</div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-zinc-900 font-mono">
                              {res.totalScore} / {res.maxScore}
                            </span>
                            <span className="text-[11px] text-zinc-500 ml-1">({res.percentage}%)</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              res.isPassed 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {res.isPassed ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" /> Passed
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3" /> Failed
                                </>
                              )}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-zinc-600 font-mono">
                            {formatTime(res.timeSpentSeconds || 0)}
                          </td>
                          <td className="py-3 px-4 text-zinc-500">
                            {dateStr}
                          </td>
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center justify-end gap-1.5">
                              {confirmDeleteResponseId === res.id ? (
                                <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg">
                                  <span className="text-[10px] font-bold text-rose-800">Reset?</span>
                                  <button
                                    onClick={() => handleDeleteResponse(res)}
                                    disabled={deletingResponseId === res.id}
                                    className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded cursor-pointer"
                                  >
                                    {deletingResponseId === res.id ? '...' : 'Yes'}
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteResponseId(null)}
                                    className="px-1.5 py-0.5 bg-white text-zinc-600 text-[10px] font-semibold rounded border border-zinc-200 cursor-pointer"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteResponseId(res.id)}
                                  className="text-zinc-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Delete submission & unlock respondent email to allow retaking"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                onClick={() => setExpandedResponseId(isExpanded ? null : res.id)}
                                className="text-zinc-400 hover:text-zinc-900 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                                title="Inspect & manually grade answers"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Answers Inspector */}
                        {isExpanded && (
                          <tr className="bg-zinc-50/80">
                            <td colSpan={6} className="p-5">
                              <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-200/80">
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-2 flex-wrap">
                                    <span>Answers Breakdown & Manual Grading for {res.respondentName || 'Respondent'}</span>
                                    {res.respondentSection && (
                                      <span className="text-[11px] font-medium text-zinc-500 normal-case">
                                        • Section: {res.respondentSection}
                                      </span>
                                    )}
                                  </h4>
                                  <span className="text-[11px] text-zinc-500">
                                    Click <strong>Mark Correct</strong> or <strong>Mark Wrong</strong> on any question to override its score.
                                  </span>
                                </div>
                                <div className="space-y-2.5">
                                  {quiz.questions.map((q, idx) => {
                                    const ans = res.answers[q.id];
                                    const evalAns = res.evaluatedAnswers?.find((ea) => ea.questionId === q.id);
                                    const isTimedOut = evalAns?.isTimedOut || ans === undefined || ans === null || ans === '' || (Array.isArray(ans) && ans.length === 0);
                                    const isCorrect = evalAns?.isCorrect;
                                    const pointsEarned = evalAns?.pointsEarned ?? (isCorrect ? q.points : 0);
                                    const isUpdatingThis = gradingUpdatingKey === `${res.id}_${q.id}`;

                                    let answerDisplay = '-';
                                    if (Array.isArray(ans)) {
                                      answerDisplay = ans.map((item) => {
                                        const opt = q.options?.find((o) => o.id === item);
                                        return opt ? opt.text : item;
                                      }).join(', ');
                                    } else if (ans !== undefined && ans !== null) {
                                      const opt = q.options?.find((o) => o.id === ans);
                                      answerDisplay = opt ? opt.text : String(ans);
                                    }

                                    const correctOpt = q.options?.find((o) => o.isCorrect);

                                    return (
                                      <div 
                                        key={q.id} 
                                        className={`p-3.5 bg-white border rounded-xl text-xs space-y-2 ${
                                          isTimedOut
                                            ? 'border-rose-200 bg-rose-50/20'
                                            : isCorrect
                                            ? 'border-emerald-200 bg-emerald-50/20'
                                            : 'border-rose-200 bg-rose-50/10'
                                        }`}
                                      >
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                          <div className="font-semibold text-zinc-800">
                                            Q{idx + 1}: {q.title}
                                            <span className="text-[11px] text-zinc-400 font-normal ml-1">({q.points} pts)</span>
                                          </div>
                                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                                            {isTimedOut ? (
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                                <XCircle className="w-3 h-3 text-rose-600" />
                                                Timed Out / Unanswered (0 pts)
                                              </span>
                                            ) : isCorrect ? (
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                Correct (+{pointsEarned} pts)
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                                <XCircle className="w-3 h-3 text-rose-600" />
                                                Incorrect ({pointsEarned} pts)
                                              </span>
                                            )}

                                            {/* Manual Grading Override Buttons */}
                                            <div className="inline-flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
                                              <button
                                                type="button"
                                                disabled={isUpdatingThis}
                                                onClick={() => handleManualGradeOverride(res, q.id, true, q.points)}
                                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                                                  isCorrect && !isTimedOut
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'text-zinc-600 hover:text-emerald-700'
                                                }`}
                                                title={`Award full ${q.points} pts`}
                                              >
                                                Mark Correct
                                              </button>
                                              <button
                                                type="button"
                                                disabled={isUpdatingThis}
                                                onClick={() => handleManualGradeOverride(res, q.id, false, 0)}
                                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                                                  !isCorrect || isTimedOut
                                                    ? 'bg-rose-600 text-white'
                                                    : 'text-zinc-600 hover:text-rose-700'
                                                }`}
                                                title="Set to 0 pts"
                                              >
                                                Mark Wrong
                                              </button>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-zinc-600 font-mono">
                                          <span className="text-zinc-400 text-[11px]">Selected:</span>
                                          <span className={`font-sans font-medium ${isTimedOut ? 'italic text-rose-600' : 'text-zinc-900'}`}>
                                            {isTimedOut ? 'No answer submitted before timer ran out' : answerDisplay}
                                          </span>
                                        </div>

                                        {!isCorrect && correctOpt && (
                                          <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200/60 flex items-center gap-1.5">
                                            <span className="font-semibold">Correct Answer:</span>
                                            <span>{correctOpt.text}</span>
                                          </div>
                                        )}

                                        {q.type === 'short-text' && q.acceptedAnswers && q.acceptedAnswers.length > 0 && (
                                          <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200/60 flex items-center gap-1.5 flex-wrap">
                                            <span className="font-semibold">Accepted Answer Key:</span>
                                            <span>{q.acceptedAnswers.join(' | ')}</span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Put Records inside Spreadsheet Modal */}
      {showSpreadsheetModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setShowSpreadsheetModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-xl w-full max-h-[90dvh] overflow-y-auto p-5 sm:p-8 shadow-2xl border border-zinc-200 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 tracking-tight font-modern">
                    Put Records inside Spreadsheet
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Choose how you want to put your {totalCount} submission records into a spreadsheet:
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSpreadsheetModal(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3 Choices */}
            <div className="space-y-3">
              {/* Choice 1: Download Spreadsheet File */}
              <div
                onClick={() => {
                  handleDownloadSpreadsheet();
                  setShowSpreadsheetModal(false);
                }}
                className="p-4 border-2 border-zinc-200 hover:border-emerald-600 rounded-2xl cursor-pointer transition-all bg-zinc-50/50 hover:bg-white flex items-start gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Download className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-zinc-900 group-hover:text-emerald-950">
                      1. Download Spreadsheet (.CSV File)
                    </h4>
                    <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                      Universal File
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    Downloads all {totalCount} respondent records without limit (fully supports 100+ submissions). Formatted with UTF-8 BOM so Microsoft Excel, Google Sheets, LibreOffice, and Numbers open all columns with proper encoding.
                  </p>
                </div>
              </div>

              {/* Choice 2: Copy for Google Sheets / Excel */}
              <div
                onClick={() => {
                  handleCopyForSpreadsheet();
                  setShowSpreadsheetModal(false);
                }}
                className="p-4 border-2 border-zinc-200 hover:border-emerald-600 rounded-2xl cursor-pointer transition-all bg-zinc-50/50 hover:bg-white flex items-start gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Copy className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-zinc-900 group-hover:text-blue-950">
                      2. Copy Table to Clipboard (Ctrl+V)
                    </h4>
                    <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold">
                      Instant Paste
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    Copies tab-separated table. Click cell A1 in any sheet and press Ctrl+V (or Cmd+V) to populate all columns and rows instantly.
                  </p>
                </div>
              </div>

              {/* Choice 3: Open in Google Sheets */}
              <div
                onClick={() => {
                  handleOpenGoogleSheets();
                  setShowSpreadsheetModal(false);
                }}
                className="p-4 border-2 border-zinc-200 hover:border-emerald-600 rounded-2xl cursor-pointer transition-all bg-zinc-50/50 hover:bg-white flex items-start gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <ExternalLink className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-zinc-900 group-hover:text-emerald-950">
                      3. Open in Google Sheets (sheets.new)
                    </h4>
                    <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                      Direct Launch
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    Automatically copies your records table and opens a new blank Google Sheet so you can press Ctrl+V right away.
                  </p>
                </div>
              </div>
            </div>

            {/* Included Fields Info */}
            <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-[11px] text-zinc-500 space-y-1">
              <span className="font-bold text-zinc-700 block uppercase tracking-wider text-[10px]">
                Included in your spreadsheet:
              </span>
              <p>
                Respondent Name, Section / Class Group, Email, Score, Max Score, Percentage (%), Pass Status, Time Spent, Tab Switches, Submission Date, and all question answers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Classroom QR Code & Access PIN Modal */}
      {showQRCodeModal && (
        <QRCodeModal
          quiz={quiz}
          onClose={() => setShowQRCodeModal(false)}
        />
      )}
    </div>
  );
};
