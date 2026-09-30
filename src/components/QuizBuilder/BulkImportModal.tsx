import React, { useState, useMemo } from 'react';
import { Question, QuestionOption } from '../../types';
import { FileText, Plus, X, CheckCircle2, HelpCircle, Sparkles } from 'lucide-react';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportQuestions: (questions: Question[]) => void;
}

const SAMPLE_IMPORT_TEXT = `1. What is the powerhouse of the cell?
A) Nucleus
*B) Mitochondria
C) Ribosome
D) Golgi apparatus

2. Which planet is known as the Red Planet?
A. Venus
B. Mars
C. Jupiter
D. Saturn
Answer: B

3. Water boils at 100 degrees Celsius at standard atmospheric pressure.
True
False
Answer: True

4. What does HTML stand for?
Answer: HyperText Markup Language | Hypertext Markup Language`;

export function parseBulkQuestionsText(rawText: string, defaultPoints = 10): Question[] {
  if (!rawText || !rawText.trim()) return [];

  const blocks = rawText
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  const parsed: Question[] = [];

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) continue;

    // 1. Extract question title (strip leading "1.", "Q1:", etc.)
    const rawTitle = lines[0].replace(/^(?:Q\d+|Question\s+\d+|\d+)[\.\)\:\-]\s*/i, '').trim();
    if (!rawTitle) continue;

    let answerLine: string | null = null;
    let explanationLine: string | null = null;
    const optionLines: { letter?: string; text: string; starred: boolean }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      // Check for Answer: or ANS: or Correct:
      const ansMatch = line.match(/^(?:ANSWER|ANS|CORRECT(?:\s+ANSWER)?)\s*[\:\-]\s*(.+)$/i);
      if (ansMatch) {
        answerLine = ansMatch[1].trim();
        continue;
      }

      // Check for Explanation:
      const expMatch = line.match(/^(?:EXPLANATION|FEEDBACK|HINT)\s*[\:\-]\s*(.+)$/i);
      if (expMatch) {
        explanationLine = expMatch[1].trim();
        continue;
      }

      // Check for Option format: "*A) Text", "A. Text", "(A) Text", "- Text"
      const starred = line.startsWith('*');
      const cleanLine = starred ? line.slice(1).trim() : line;

      const optMatch = cleanLine.match(/^(?:\(?([A-Ha-h])[\.\)\:\-]|[\-\•])\s*(.+)$/);
      if (optMatch) {
        optionLines.push({
          letter: optMatch[1] ? optMatch[1].toUpperCase() : undefined,
          text: optMatch[2].trim(),
          starred,
        });
      } else if (/^(true|false)$/i.test(cleanLine)) {
        optionLines.push({
          text: cleanLine.charAt(0).toUpperCase() + cleanLine.slice(1).toLowerCase(),
          starred,
        });
      } else {
        optionLines.push({
          text: cleanLine,
          starred,
        });
      }
    }

    // Determine Question Type
    if (optionLines.length === 0 && answerLine) {
      // Short-text question with auto-graded acceptedAnswers
      const accepted = answerLine
        .split(/[|,]/)
        .map((s) => s.trim())
        .filter(Boolean);

      parsed.push({
        id: 'q_' + Math.random().toString(36).substring(2, 9),
        type: 'short-text',
        title: rawTitle,
        acceptedAnswers: accepted,
        required: true,
        points: defaultPoints,
        explanation: explanationLine || '',
      });
      continue;
    }

    if (optionLines.length === 0) {
      // Short-text open question
      parsed.push({
        id: 'q_' + Math.random().toString(36).substring(2, 9),
        type: 'short-text',
        title: rawTitle,
        required: true,
        points: defaultPoints,
        explanation: explanationLine || '',
      });
      continue;
    }

    // Check if True / False
    const isTrueFalse =
      optionLines.length === 2 &&
      optionLines.every((o) => /^(true|false)$/i.test(o.text));

    const options: QuestionOption[] = optionLines.map((o, idx) => {
      const letter = o.letter || String.fromCharCode(65 + idx);
      let isCorrect = o.starred;

      if (!isCorrect && answerLine) {
        const cleanAns = answerLine.replace(/^[\(\[]|[\)\]]$/g, '').trim();
        if (
          cleanAns.toUpperCase() === letter ||
          cleanAns.toLowerCase() === o.text.toLowerCase() ||
          cleanAns.toUpperCase().startsWith(letter + ')') ||
          cleanAns.toUpperCase().startsWith(letter + '.')
        ) {
          isCorrect = true;
        }
      }

      return {
        id: 'opt_' + Math.random().toString(36).substring(2, 8) + '_' + idx,
        text: o.text,
        isCorrect,
      };
    });

    // Ensure at least one option is marked correct (default to first if none specified)
    if (!options.some((o) => o.isCorrect) && options.length > 0) {
      options[0].isCorrect = true;
    }

    const correctCount = options.filter((o) => o.isCorrect).length;

    parsed.push({
      id: 'q_' + Math.random().toString(36).substring(2, 9),
      type: isTrueFalse
        ? 'true-false'
        : correctCount > 1
        ? 'multiple-select'
        : 'multiple-choice',
      title: rawTitle,
      options,
      required: true,
      points: defaultPoints,
      explanation: explanationLine || '',
    });
  }

  return parsed;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onImportQuestions,
}) => {
  const [rawText, setRawText] = useState('');
  const [defaultPoints, setDefaultPoints] = useState(10);

  const previewQuestions = useMemo(
    () => parseBulkQuestionsText(rawText, defaultPoints),
    [rawText, defaultPoints]
  );

  if (!isOpen) return null;

  const handleConfirmImport = () => {
    if (previewQuestions.length === 0) return;
    onImportQuestions(previewQuestions);
    setRawText('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90dvh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-zinc-200 p-5 sm:p-7 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 tracking-tight font-modern">
                Bulk Import Questions from Text
              </h3>
              <p className="text-xs text-zinc-500">
                Paste questions from Word, Google Docs, or Aiken format to create cards automatically.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions & Sample Loader */}
        <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2 text-zinc-600">
            <HelpCircle className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
            <span>
              Separate each question with a blank line. Prefix the correct choice with{' '}
              <strong className="font-mono text-zinc-900">*</strong> (e.g.{' '}
              <code className="bg-white px-1 py-0.5 rounded border border-zinc-200">*B) Mars</code>) or add{' '}
              <code className="bg-white px-1 py-0.5 rounded border border-zinc-200">Answer: B</code> at the end.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setRawText(SAMPLE_IMPORT_TEXT)}
            className="px-3 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 font-semibold rounded-xl shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Load Example</span>
          </button>
        </div>

        {/* Main Editor & Live Preview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold uppercase tracking-wider text-zinc-500 text-[11px]">
                Paste Questions Text
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 text-[11px]">Points each:</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={defaultPoints}
                  onChange={(e) => setDefaultPoints(Number(e.target.value) || 0)}
                  className="w-14 border border-zinc-200 rounded-lg px-2 py-0.5 text-xs font-mono"
                />
              </div>
            </div>
            <textarea
              rows={12}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={SAMPLE_IMPORT_TEXT}
              className="w-full p-3.5 text-xs font-mono text-zinc-800 bg-zinc-50 focus:bg-white border border-zinc-200 focus:border-zinc-900 rounded-2xl focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Live Parsed Preview */}
          <div className="space-y-2 flex flex-col">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-zinc-500 text-[11px]">
                Live Detected Questions ({previewQuestions.length})
              </span>
              {previewQuestions.length > 0 && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Ready to import
                </span>
              )}
            </div>

            <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-2xl p-3 max-h-[300px] overflow-y-auto space-y-2.5">
              {previewQuestions.length === 0 ? (
                <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-4 text-zinc-400 text-xs">
                  <FileText className="w-7 h-7 mb-2 opacity-50" />
                  <p>Paste your questions on the left to preview how they will be imported.</p>
                </div>
              ) : (
                previewQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white border border-zinc-200 rounded-xl text-xs space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-zinc-900">
                        Q{idx + 1}. {q.title}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 shrink-0">
                        {q.type}
                      </span>
                    </div>

                    {q.options && q.options.length > 0 && (
                      <div className="space-y-1 pl-1 pt-1">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`flex items-center gap-1.5 text-[11px] ${
                              opt.isCorrect ? 'text-emerald-700 font-bold' : 'text-zinc-600'
                            }`}
                          >
                            <CheckCircle2
                              className={`w-3 h-3 shrink-0 ${
                                opt.isCorrect ? 'text-emerald-600' : 'text-zinc-300'
                              }`}
                            />
                            <span>{opt.text}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {q.acceptedAnswers && q.acceptedAnswers.length > 0 && (
                      <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                        <strong>Accepted Answer(s):</strong> {q.acceptedAnswers.join(', ')}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={previewQuestions.length === 0}
            onClick={handleConfirmImport}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>
              Import {previewQuestions.length}{' '}
              {previewQuestions.length === 1 ? 'Question' : 'Questions'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
