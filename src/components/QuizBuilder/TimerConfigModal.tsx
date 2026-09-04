import React, { useState } from 'react';
import { Quiz, TimerMode, Question } from '../../types';
import { Clock, Check, X, Sparkles, AlertCircle, Timer, Zap, CheckCircle2 } from 'lucide-react';

interface TimerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz;
  onUpdateSettings: (updates: {
    timerMode: TimerMode;
    timeLimitMinutes: number | null;
    questionTimeLimitSeconds: number | null;
  }) => void;
  onUpdateAllQuestionsTimer?: (seconds: number | null) => void;
}

export const TimerConfigModal: React.FC<TimerConfigModalProps> = ({
  isOpen,
  onClose,
  quiz,
  onUpdateSettings,
  onUpdateAllQuestionsTimer,
}) => {
  const currentMode: TimerMode = quiz.settings.timerMode || (quiz.settings.timeLimitMinutes ? 'whole-quiz' : 'none');
  const [selectedMode, setSelectedMode] = useState<TimerMode>(currentMode);
  const [wholeQuizMinutes, setWholeQuizMinutes] = useState<number>(quiz.settings.timeLimitMinutes || 15);
  const [questionSeconds, setQuestionSeconds] = useState<number>(quiz.settings.questionTimeLimitSeconds || 30);
  const [appliedToAllSuccess, setAppliedToAllSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    let finalMinutes: number | null = null;
    let finalQuestionSecs: number | null = null;

    if (selectedMode === 'whole-quiz') {
      finalMinutes = Math.max(1, wholeQuizMinutes || 15);
    } else if (selectedMode === 'per-question') {
      finalQuestionSecs = Math.max(5, questionSeconds || 30);
      // Also apply to all questions if creator selected this
      if (onUpdateAllQuestionsTimer) {
        onUpdateAllQuestionsTimer(finalQuestionSecs);
      }
    }

    onUpdateSettings({
      timerMode: selectedMode,
      timeLimitMinutes: finalMinutes,
      questionTimeLimitSeconds: finalQuestionSecs,
    });
    onClose();
  };

  const handleApplyToAllQuestions = () => {
    if (onUpdateAllQuestionsTimer) {
      onUpdateAllQuestionsTimer(Math.max(5, questionSeconds || 30));
      setAppliedToAllSuccess(true);
      setTimeout(() => setAppliedToAllSuccess(false), 2500);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 space-y-6 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 tracking-tight font-modern">
                Quiz Timer Configuration
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Enforce strict time limits for the whole quiz or individual questions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Timer Modes */}
        <div className="space-y-3">
          {/* Mode 1: Whole Quiz Timer */}
          <div
            onClick={() => setSelectedMode('whole-quiz')}
            className={`p-4 border-2 rounded-2xl cursor-pointer transition-all ${
              selectedMode === 'whole-quiz'
                ? 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500/20'
                : 'border-zinc-200 hover:border-zinc-300 bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  selectedMode === 'whole-quiz' ? 'bg-amber-500 text-white' : 'bg-zinc-100 text-zinc-600'
                }`}>
                  <Timer className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">Whole Quiz Timer</h4>
                  <p className="text-xs text-zinc-500">
                    One overall countdown timer for the entire quiz.
                  </p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                selectedMode === 'whole-quiz' ? 'border-amber-500 bg-amber-500 text-white' : 'border-zinc-300'
              }`}>
                {selectedMode === 'whole-quiz' && <Check className="w-3 h-3" />}
              </div>
            </div>

            {selectedMode === 'whole-quiz' && (
              <div className="mt-4 pt-3 border-t border-amber-200/60 space-y-3 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
                  <span>Total Time Limit:</span>
                  <span className="font-mono text-amber-700 font-bold">{wholeQuizMinutes} minutes</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[5, 10, 15, 20, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setWholeQuizMinutes(mins)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        wholeQuizMinutes === mins
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
                      value={wholeQuizMinutes}
                      onChange={(e) => setWholeQuizMinutes(Math.max(1, Number(e.target.value) || 1))}
                      className="w-12 text-xs font-mono font-bold text-zinc-900 focus:outline-none"
                    />
                    <span className="text-[11px] text-zinc-400">mins</span>
                  </div>
                </div>

                <div className="p-2.5 bg-amber-100/60 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    When the timer runs out, the quiz locks immediately. All remaining unanswered questions will automatically count as <strong>wrong (0 pts)</strong>, and only correct answers are recorded on your dashboard.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Mode 2: Per-Question Timer */}
          <div
            onClick={() => setSelectedMode('per-question')}
            className={`p-4 border-2 rounded-2xl cursor-pointer transition-all ${
              selectedMode === 'per-question'
                ? 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500/20'
                : 'border-zinc-200 hover:border-zinc-300 bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  selectedMode === 'per-question' ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600'
                }`}>
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">Per-Question Timer</h4>
                  <p className="text-xs text-zinc-500">
                    Each individual question has its own countdown clock.
                  </p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                selectedMode === 'per-question' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-zinc-300'
              }`}>
                {selectedMode === 'per-question' && <Check className="w-3 h-3" />}
              </div>
            </div>

            {selectedMode === 'per-question' && (
              <div className="mt-4 pt-3 border-t border-indigo-200/60 space-y-3 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
                  <span>Default Question Time Limit:</span>
                  <span className="font-mono text-indigo-700 font-bold">{questionSeconds} seconds</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[10, 15, 20, 30, 45, 60, 90, 120].map((secs) => (
                    <button
                      key={secs}
                      type="button"
                      onClick={() => setQuestionSeconds(secs)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        questionSeconds === secs
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
                      value={questionSeconds}
                      onChange={(e) => setQuestionSeconds(Math.max(5, Number(e.target.value) || 5))}
                      className="w-12 text-xs font-mono font-bold text-zinc-900 focus:outline-none"
                    />
                    <span className="text-[11px] text-zinc-400">secs</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleApplyToAllQuestions}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl transition-colors cursor-pointer"
                  >
                    {appliedToAllSuccess ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Applied to all {quiz.questions.length} questions!</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Apply {questionSeconds}s to all {quiz.questions.length} questions</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-2.5 bg-indigo-100/60 rounded-xl text-[11px] text-indigo-900 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span>
                    When a question's timer expires, it locks. If unanswered, it counts as <strong>wrong (0 pts)</strong> and immediately advances to the next question. You can also customize time limits for specific questions in the Questions editor.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Mode 3: No Timer */}
          <div
            onClick={() => setSelectedMode('none')}
            className={`p-4 border-2 rounded-2xl cursor-pointer transition-all ${
              selectedMode === 'none'
                ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900/20'
                : 'border-zinc-200 hover:border-zinc-300 bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  selectedMode === 'none' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'
                }`}>
                  <X className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">No Timer (Untimed)</h4>
                  <p className="text-xs text-zinc-500">
                    Respondents can take as much time as they need to complete the quiz.
                  </p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                selectedMode === 'none' ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300'
              }`}>
                {selectedMode === 'none' && <Check className="w-3 h-3" />}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Save Timer Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
