import React, { useState } from 'react';
import { Quiz } from '../../types';
import { 
  CalendarClock, 
  Check, 
  X, 
  AlertCircle, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Trash2,
  Lock
} from 'lucide-react';

interface DeadlineConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz;
  onUpdateDeadline: (deadline: string | null) => void;
}

export const DeadlineConfigModal: React.FC<DeadlineConfigModalProps> = ({
  isOpen,
  onClose,
  quiz,
  onUpdateDeadline,
}) => {
  const currentDeadline = quiz.settings.deadline || null;
  const [isEnabled, setIsEnabled] = useState<boolean>(!!currentDeadline);
  
  // Format to local datetime-local string (YYYY-MM-DDTHH:MM)
  const formatForInput = (isoString?: string | null) => {
    if (!isoString) {
      // Default: tomorrow at 23:59
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 0, 0);
      return toLocalISO(tomorrow);
    }
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 0, 0);
      return toLocalISO(tomorrow);
    }
    return toLocalISO(d);
  };

  function toLocalISO(d: Date): string {
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  const [deadlineInput, setDeadlineInput] = useState<string>(formatForInput(currentDeadline));

  if (!isOpen) return null;

  // Helpers for quick presets
  const applyPreset = (preset: 'today-night' | 'tomorrow-5pm' | 'in-3days' | 'in-1week' | 'friday') => {
    const now = new Date();
    const target = new Date();

    if (preset === 'today-night') {
      target.setHours(23, 59, 0, 0);
    } else if (preset === 'tomorrow-5pm') {
      target.setDate(now.getDate() + 1);
      target.setHours(17, 0, 0, 0);
    } else if (preset === 'in-3days') {
      target.setDate(now.getDate() + 3);
      target.setHours(23, 59, 0, 0);
    } else if (preset === 'in-1week') {
      target.setDate(now.getDate() + 7);
      target.setHours(23, 59, 0, 0);
    } else if (preset === 'friday') {
      const day = now.getDay();
      const diff = (5 - day + 7) % 7 || 7; // next Friday
      target.setDate(now.getDate() + diff);
      target.setHours(23, 59, 0, 0);
    }

    setDeadlineInput(toLocalISO(target));
    setIsEnabled(true);
  };

  const handleSave = () => {
    if (!isEnabled || !deadlineInput) {
      onUpdateDeadline(null);
    } else {
      const targetDate = new Date(deadlineInput);
      onUpdateDeadline(targetDate.toISOString());
    }
    onClose();
  };

  const handleRemoveDeadline = () => {
    onUpdateDeadline(null);
    onClose();
  };

  // Compute status preview
  const selectedDate = isEnabled && deadlineInput ? new Date(deadlineInput) : null;
  const isPast = selectedDate ? selectedDate.getTime() < Date.now() : false;

  const formatPreviewTime = (date: Date) => {
    return date.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getRemainingText = (date: Date) => {
    const diff = date.getTime() - Date.now();
    if (diff <= 0) return 'Deadline has expired';
    const totalHours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours > 1 ? 's' : ''}`;
    }
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}, ${mins} minute${mins > 1 ? 's' : ''}`;
    }
    return `${mins} minute${mins > 1 ? 's' : ''}`;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 space-y-6 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 tracking-tight font-modern">
                Quiz Submission Deadline
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Set a strict cutoff. When the deadline passes, users cannot answer anymore.
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

        {/* Enable / Disable Toggle */}
        <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-zinc-900 block">Enforce Deadline</span>
            <span className="text-[11px] text-zinc-500 block">
              Quiz will reject new submissions after this exact timestamp
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsEnabled(!isEnabled)}
            className={`w-12 h-6.5 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
              isEnabled ? 'bg-rose-600' : 'bg-zinc-300'
            }`}
          >
            <div
              className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform ${
                isEnabled ? 'translate-x-5.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {isEnabled && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                Quick Preset Shortcuts
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset('today-night')}
                  className="py-1.5 px-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Tonight 11:59 PM
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('tomorrow-5pm')}
                  className="py-1.5 px-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Tomorrow 5:00 PM
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('friday')}
                  className="py-1.5 px-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Next Friday
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('in-3days')}
                  className="py-1.5 px-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  In 3 Days
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('in-1week')}
                  className="py-1.5 px-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  In 1 Week
                </button>
              </div>
            </div>

            {/* DateTime Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                Exact Closing Date & Time (Local Time)
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={deadlineInput}
                  onChange={(e) => setDeadlineInput(e.target.value)}
                  className="w-full text-xs font-mono font-medium p-3 bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Live Status Preview Box */}
            {selectedDate && !isNaN(selectedDate.getTime()) && (
              <div className={`p-4 rounded-2xl border text-xs space-y-1 ${
                isPast 
                  ? 'bg-rose-50 border-rose-200 text-rose-800' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  {isPast ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Deadline Expired (Quiz is currently closed)</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Active Deadline ({getRemainingText(selectedDate)} remaining)</span>
                    </>
                  )}
                </div>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  {isPast 
                    ? `This deadline was in the past (${formatPreviewTime(selectedDate)}). Users opening the quiz will see a "Quiz Closed" notice and will not be able to answer.`
                    : `Submissions will remain open until ${formatPreviewTime(selectedDate)}. After this time, user inputs will be blocked and the quiz will automatically close.`}
                </p>
              </div>
            )}
          </div>
        )}

        {!isEnabled && (
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs text-zinc-500 flex items-center gap-2">
            <Lock className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>No deadline is set. Respondents can take and submit this quiz at any time.</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
          <div>
            {currentDeadline && (
              <button
                type="button"
                onClick={handleRemoveDeadline}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 cursor-pointer py-2 px-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Deadline</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
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
              className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Deadline</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
