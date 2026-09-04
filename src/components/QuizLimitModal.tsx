import React from 'react';
import { AlertTriangle, Trash2, X, Layers } from 'lucide-react';

interface QuizLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCount: number;
  maxCount?: number;
  onManageQuizzes?: () => void;
}

export const QuizLimitModal: React.FC<QuizLimitModalProps> = ({
  isOpen,
  onClose,
  currentCount,
  maxCount = 15,
  onManageQuizzes,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 font-modern">Quiz Limit Reached</h3>
              <p className="text-xs text-amber-700 font-semibold mt-0.5">
                Maximum {maxCount} Quizzes Allowed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Capacity Indicator Bar */}
        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-500" />
              Creator Storage Quota
            </span>
            <span className="font-bold text-rose-600 font-mono">
              {currentCount} / {maxCount} used (100%)
            </span>
          </div>
          <div className="w-full bg-zinc-200 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-rose-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (currentCount / maxCount) * 100)}%` }}
            />
          </div>
        </div>

        {/* Main Description */}
        <div className="space-y-2 text-xs text-zinc-600 leading-relaxed">
          <p className="font-semibold text-zinc-800">
            You have reached the maximum allowed limit of {maxCount} quizzes created on your account.
          </p>
          <p>
            To create a new quiz, use a starter template, or import sample quizzes, please delete some of your existing quizzes to free up creator slots.
          </p>
        </div>

        {/* Guidance Box */}
        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-900">
          <Trash2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">How to free up slots:</span>
            <span>Return to your dashboard, scroll to any quiz card you no longer need, and click <strong>"Yes, delete"</strong> under the card.</span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
          {onManageQuizzes && (
            <button
              onClick={() => {
                onClose();
                onManageQuizzes();
              }}
              className="w-full sm:flex-1 py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer text-center"
            >
              Review & Delete Quizzes
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full sm:w-auto py-2.5 px-4 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer text-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
