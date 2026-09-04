import React, { useState, useEffect } from 'react';
import { Quiz, QuizResponse } from '../types';
import { getQuizResponses } from '../lib/quizDbService';
import { getShareableQuizUrl, exportResponsesToCSV, copyResponsesForSpreadsheet } from '../lib/quizHelpers';
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
  Sparkles
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
  const [expandedResponseId, setExpandedResponseId] = useState<string | null>(null);
  const [showSpreadsheetModal, setShowSpreadsheetModal] = useState(false);
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

  const filteredResponses = responses.filter((r) => {
    const name = (r.respondentName || '').toLowerCase();
    const email = (r.respondentEmail || '').toLowerCase();
    const section = (r.respondentSection || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || email.includes(term) || section.includes(term);
  });

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

          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search respondent name or email..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-zinc-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
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
                    <th className="py-3 px-4 text-right">Details</th>
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
                            <div className="flex items-center gap-2">
                              <span>{res.respondentName || 'Anonymous Respondent'}</span>
                              {res.respondentSection && (
                                <span className="px-2 py-0.5 text-[10px] font-semibold bg-zinc-100 text-zinc-700 rounded-md border border-zinc-200">
                                  {res.respondentSection}
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
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedResponseId(isExpanded ? null : res.id);
                              }}
                              className="text-zinc-400 hover:text-zinc-900 p-1 cursor-pointer"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Answers Inspector */}
                        {isExpanded && (
                          <tr className="bg-zinc-50/80">
                            <td colSpan={6} className="p-5">
                              <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-2">
                                  <span>Answers Breakdown for {res.respondentName || 'Respondent'}</span>
                                  {res.respondentSection && (
                                    <span className="text-[11px] font-medium text-zinc-500 lowercase normal-case">
                                      • Section: {res.respondentSection}
                                    </span>
                                  )}
                                </h4>
                                <div className="space-y-2.5">
                                  {quiz.questions.map((q, idx) => {
                                    const ans = res.answers[q.id];
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

                                    return (
                                      <div key={q.id} className="p-3 bg-white border border-zinc-200 rounded-xl text-xs space-y-1">
                                        <div className="font-semibold text-zinc-800">
                                          Q{idx + 1}: {q.title}
                                        </div>
                                        <div className="flex items-center gap-2 text-zinc-600 font-mono">
                                          <span className="text-zinc-400 text-[11px]">Selected:</span>
                                          <span className="font-sans font-medium text-zinc-900">{answerDisplay}</span>
                                        </div>
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
            className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 space-y-6"
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
                Respondent Name, Section / Class Group, Email, Score, Max Score, Percentage (%), Pass Status, Time Spent, Submission Date, and all question answers.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
