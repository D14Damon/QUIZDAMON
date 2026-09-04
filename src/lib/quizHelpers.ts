import { Quiz, QuizResponse, Question } from '../types';

export function calculateQuizResults(quiz: Quiz, answers: Record<string, any>) {
  let totalScore = 0;
  let maxScore = 0;

  const evaluatedAnswers = quiz.questions.map((q) => {
    const val = answers[q.id];
    let isCorrect: boolean | undefined = undefined;
    let pointsEarned = 0;
    const maxPoints = q.points || 0;
    maxScore += maxPoints;

    if (q.type === 'multiple-choice' || q.type === 'true-false') {
      const correctOpt = q.options?.find((o) => o.isCorrect);
      if (correctOpt) {
        if (val === correctOpt.id || val === correctOpt.text) {
          isCorrect = true;
          pointsEarned = maxPoints;
        } else {
          isCorrect = false;
        }
      }
    } else if (q.type === 'multiple-select') {
      const correctOptIds = (q.options || []).filter((o) => o.isCorrect).map((o) => o.id);
      if (correctOptIds.length > 0) {
        const selectedIds: string[] = Array.isArray(val) ? val : [];
        const allCorrectChosen = correctOptIds.every((id) => selectedIds.includes(id));
        const noWrongChosen = selectedIds.every((id) => correctOptIds.includes(id));
        if (allCorrectChosen && noWrongChosen) {
          isCorrect = true;
          pointsEarned = maxPoints;
        } else {
          isCorrect = false;
        }
      }
    } else if (q.type === 'rating-stars' || q.type === 'opinion-scale' || q.type === 'short-text' || q.type === 'long-text') {
      // subjective/open questions get full points if answered (or 0 if points wasn't graded)
      if (val !== undefined && val !== null && val !== '') {
        pointsEarned = maxPoints;
      }
    }

    totalScore += pointsEarned;

    return {
      questionId: q.id,
      questionTitle: q.title,
      questionType: q.type,
      value: val,
      isCorrect,
      pointsEarned,
      maxPoints,
    };
  });

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 100;
  const isPassed = percentage >= (quiz.settings.passPercentage || 0);

  return {
    totalScore,
    maxScore,
    percentage,
    isPassed,
    evaluatedAnswers,
  };
}

export function formatQuizSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function generateDefaultQuizSlug(title: string): string {
  const cleanTitle = formatQuizSlug(title);
  if (!cleanTitle) return 'damonquiz';
  if (cleanTitle.startsWith('damonquiz')) return cleanTitle;
  return `damonquiz-${cleanTitle}`;
}

export function getShareableQuizUrl(quizOrId: string | { id: string; customSlug?: string }): string {
  const slugOrId = typeof quizOrId === 'string'
    ? quizOrId
    : (quizOrId.customSlug?.trim() || quizOrId.id);

  if (typeof window === 'undefined') return `?quiz=${slugOrId}`;
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  return `${origin}${pathname}?quiz=${slugOrId}`;
}

/**
 * Builds formatted rows for CSV and Spreadsheet clipboard pasting
 */
function buildSpreadsheetData(quiz: Quiz, responses: QuizResponse[]) {
  const headers = [
    '#',
    'Respondent Name', 
    'Section / Class Group', 
    'Respondent Email', 
    'Score', 
    'Max Score', 
    'Percentage (%)', 
    'Result', 
    'Time Spent (s)', 
    'Submitted At'
  ];

  quiz.questions.forEach((q, idx) => {
    headers.push(`Q${idx + 1}: ${q.title}`);
  });

  const rawRows = responses.map((r, rowIdx) => {
    let dateStr = '';
    if (r.submittedAt?.toDate) {
      dateStr = r.submittedAt.toDate().toLocaleString();
    } else if (r.submittedAt instanceof Date) {
      dateStr = r.submittedAt.toLocaleString();
    } else if (typeof r.submittedAt === 'number') {
      dateStr = new Date(r.submittedAt).toLocaleString();
    } else if (typeof r.submittedAt === 'string') {
      dateStr = r.submittedAt;
    } else {
      dateStr = '-';
    }

    const baseCols = [
      String(rowIdx + 1),
      r.respondentName || 'Anonymous',
      r.respondentSection || '-',
      r.respondentEmail || '-',
      String(r.totalScore ?? 0),
      String(r.maxScore ?? 0),
      `${r.percentage ?? 0}%`,
      r.isPassed ? 'Passed' : 'Failed',
      String(r.timeSpentSeconds ?? 0),
      dateStr,
    ];

    quiz.questions.forEach((q) => {
      const ans = r.answers ? r.answers[q.id] : undefined;
      let formattedAns = '';

      if (Array.isArray(ans)) {
        formattedAns = ans.map((item) => {
          const opt = q.options?.find((o) => o.id === item);
          return opt ? opt.text : String(item);
        }).join(', ');
      } else if (typeof ans === 'boolean') {
        formattedAns = ans ? 'True' : 'False';
      } else if (ans !== undefined && ans !== null) {
        const opt = q.options?.find((o) => o.id === ans);
        formattedAns = opt ? opt.text : String(ans);
      } else {
        formattedAns = '-';
      }

      baseCols.push(formattedAns || '-');
    });

    return baseCols;
  });

  return { headers, rawRows };
}

/**
 * Downloads records as a clean UTF-8 CSV spreadsheet file with BOM (\uFEFF)
 * compatible directly with Microsoft Excel, Google Sheets, LibreOffice, and Numbers.
 * Reliably handles all respondents, including datasets with more than 100, 500, or 1,000+ entries.
 */
export function exportResponsesToCSV(quiz: Quiz, responses: QuizResponse[]): void {
  if (!responses || !responses.length) return;

  const { headers, rawRows } = buildSpreadsheetData(quiz, responses);

  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    return `"${str.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
  };

  const csvHeader = headers.map(escapeCSV).join(',');
  const csvRows = rawRows.map((row) => row.map(escapeCSV).join(','));

  // Prepend UTF-8 BOM (\uFEFF) so Excel & Google Sheets open cleanly with proper character encoding
  const csvContent = '\uFEFF' + [csvHeader, ...csvRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const sanitizedTitle = quiz.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 50);
  link.setAttribute('download', `${sanitizedTitle || 'quiz'}-all-${responses.length}-records.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Formats all response records as Tab-Separated Values (TSV) and copies to clipboard.
 * User can simply open any Google Sheet or Excel file and press Ctrl+V (Cmd+V)
 * to paste all records directly into cells and columns!
 */
export async function copyResponsesForSpreadsheet(quiz: Quiz, responses: QuizResponse[]): Promise<boolean> {
  if (!responses.length) return false;

  const { headers, rawRows } = buildSpreadsheetData(quiz, responses);

  // Tab-separated lines format natively inside Google Sheets and Excel
  const tsvHeader = headers.join('\t');
  const tsvRows = rawRows.map((row) => row.map((cell) => cell.replace(/\t/g, ' ').replace(/\r?\n/g, ' ')).join('\t'));
  const tsvContent = [tsvHeader, ...tsvRows].join('\r\n');

  try {
    await navigator.clipboard.writeText(tsvContent);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}
