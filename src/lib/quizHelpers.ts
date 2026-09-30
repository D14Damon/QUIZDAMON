import { Quiz, QuizResponse, Question } from '../types';

export function calculateQuizResults(quiz: Quiz, answers: Record<string, any>, isTimedOutSubmission?: boolean) {
  let totalScore = 0;
  let maxScore = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;

  const evaluatedAnswers = quiz.questions.map((q) => {
    const val = answers[q.id];
    let isCorrect: boolean | undefined = undefined;
    let pointsEarned = 0;
    const maxPoints = q.points || 0;
    maxScore += maxPoints;

    const hasAnswer = val !== undefined && val !== null && val !== '' && !(Array.isArray(val) && val.length === 0);

    if (!hasAnswer) {
      // Question was not answered (due to timeout or skipped)
      // Strictly wrong and 0 points earned
      isCorrect = false;
      pointsEarned = 0;
      unansweredCount++;
      wrongCount++;

      return {
        questionId: q.id,
        questionTitle: q.title,
        questionType: q.type,
        value: null,
        isCorrect: false,
        pointsEarned: 0,
        maxPoints,
        isTimedOut: true,
      };
    }

    if (q.type === 'multiple-choice' || q.type === 'true-false') {
      const correctOpt = q.options?.find((o) => o.isCorrect);
      if (correctOpt) {
        if (val === correctOpt.id || val === correctOpt.text) {
          isCorrect = true;
          pointsEarned = maxPoints;
          correctCount++;
        } else {
          isCorrect = false;
          wrongCount++;
        }
      } else {
        // If no correct option was set by creator, full points for participating
        isCorrect = true;
        pointsEarned = maxPoints;
        correctCount++;
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
          correctCount++;
        } else {
          isCorrect = false;
          wrongCount++;
        }
      } else {
        isCorrect = true;
        pointsEarned = maxPoints;
        correctCount++;
      }
    } else if (q.type === 'short-text') {
      const validAnswers = (q.acceptedAnswers || []).map((a) => a.trim().toLowerCase()).filter(Boolean);
      if (validAnswers.length > 0) {
        const userAns = String(val || '').trim().toLowerCase();
        if (validAnswers.includes(userAns)) {
          isCorrect = true;
          pointsEarned = maxPoints;
          correctCount++;
        } else {
          isCorrect = false;
          pointsEarned = 0;
          wrongCount++;
        }
      } else {
        // Open-ended short-text without strict answer key gets participation points
        pointsEarned = maxPoints;
        isCorrect = true;
        correctCount++;
      }
    } else if (q.type === 'rating-stars' || q.type === 'opinion-scale' || q.type === 'long-text') {
      // subjective / open questions with answer provided get points
      pointsEarned = maxPoints;
      isCorrect = true;
      correctCount++;
    }

    totalScore += pointsEarned;

    return {
      questionId: q.id,
      questionTitle: q.title,
      questionType: q.type,
      value: val,
      isCorrect: isCorrect ?? false,
      pointsEarned,
      maxPoints,
      isTimedOut: false,
    };
  });

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 100;
  const isPassed = percentage >= (quiz.settings.passPercentage || 0);

  const isTimedOut = !!isTimedOutSubmission || unansweredCount > 0;

  return {
    totalScore,
    maxScore,
    percentage,
    isPassed,
    correctCount,
    wrongCount,
    unansweredCount,
    timedOut: isTimedOut,
    isTimedOut,
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
  const quizId = typeof quizOrId === 'string'
    ? quizOrId
    : quizOrId.id;

  if (typeof window === 'undefined') return `?quiz=${quizId}`;
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  return `${origin}${pathname}?quiz=${quizId}`;
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
    'Tab Switches',
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
      String(r.tabSwitchCount ?? 0),
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
        formattedAns = '[Timed Out / Unanswered (0 pts)]';
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

/**
 * Safely extracts the public display name of the quiz creator.
 * Strictly guarantees that user emails (e.g. @gmail.com) are NEVER exposed to respondents.
 */
export function getCreatorDisplayName(quiz?: { creatorName?: string; creatorEmail?: string } | null): string {
  if (!quiz) return 'Creator';
  if (quiz.creatorName && quiz.creatorName.trim()) {
    const raw = quiz.creatorName.trim();
    if (!raw.includes('@')) {
      return raw;
    }
    // If creatorName was saved with an email address, extract clean username
    const prefix = raw.split('@')[0].replace(/[._-]/g, ' ').trim();
    return prefix ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : 'Creator';
  }
  if (quiz.creatorEmail && quiz.creatorEmail.trim()) {
    const prefix = quiz.creatorEmail.split('@')[0].replace(/[._-]/g, ' ').trim();
    return prefix ? prefix.charAt(0).toUpperCase() + prefix.slice(1) : 'Creator';
  }
  return 'Creator';
}

/**
 * Generates and downloads a high-resolution PNG Completion Certificate on HTML5 Canvas
 */
export function downloadCompletionCertificate(params: {
  respondentName: string;
  respondentSection?: string;
  quizTitle: string;
  creatorName: string;
  score: number;
  maxScore: number;
  percentage: number;
  isPassed: boolean;
  primaryColor?: string;
}) {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 1120;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const accent = params.primaryColor || '#18181b';

  // Background
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer decorative frame
  ctx.strokeStyle = '#e4e4e7';
  ctx.lineWidth = 6;
  ctx.strokeRect(48, 48, canvas.width - 96, canvas.height - 96);

  // Inner accent border
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  ctx.strokeRect(68, 68, canvas.width - 136, canvas.height - 136);

  // White card interior
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(72, 72, canvas.width - 144, canvas.height - 144);

  // Top badge pill
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.roundRect(canvas.width / 2 - 170, 150, 340, 48, 24);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(params.isPassed ? 'CERTIFICATE OF ACHIEVEMENT' : 'CERTIFICATE OF COMPLETION', canvas.width / 2, 181);

  // Main Heading
  ctx.fillStyle = '#18181b';
  ctx.font = 'bold 54px serif';
  ctx.fillText('Quizzy Official Record', canvas.width / 2, 280);

  ctx.fillStyle = '#71717a';
  ctx.font = '24px sans-serif';
  ctx.fillText('THIS PROUDLY CERTIFIES THAT', canvas.width / 2, 355);

  // Respondent Name
  const cleanName = (params.respondentName || 'Anonymous Respondent').trim();
  ctx.fillStyle = '#09090b';
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText(cleanName, canvas.width / 2, 450);

  // Underline under name
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 300, 478);
  ctx.lineTo(canvas.width / 2 + 300, 478);
  ctx.stroke();

  if (params.respondentSection) {
    ctx.fillStyle = '#52525b';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`Section / Class: ${params.respondentSection}`, canvas.width / 2, 525);
  }

  // Completed quiz text
  ctx.fillStyle = '#71717a';
  ctx.font = '24px sans-serif';
  ctx.fillText('has successfully completed the assessment', canvas.width / 2, 595);

  // Quiz Title
  ctx.fillStyle = accent;
  ctx.font = 'bold 42px sans-serif';
  const titleText = params.quizTitle.length > 52 ? params.quizTitle.slice(0, 49) + '...' : params.quizTitle;
  ctx.fillText(`"${titleText}"`, canvas.width / 2, 660);

  // Score Box
  ctx.fillStyle = '#f4f4f5';
  ctx.beginPath();
  ctx.roundRect(canvas.width / 2 - 280, 715, 560, 115, 20);
  ctx.fill();

  ctx.fillStyle = '#18181b';
  ctx.font = 'bold 36px monospace';
  ctx.fillText(
    `Score: ${params.score} / ${params.maxScore} pts (${params.percentage}%)`,
    canvas.width / 2,
    785
  );

  // Footer Metadata (Instructor & Date)
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  ctx.fillStyle = '#18181b';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(params.creatorName || 'Creator', 180, 945);
  ctx.fillStyle = '#71717a';
  ctx.font = '18px sans-serif';
  ctx.fillText('Quiz Creator / Instructor', 180, 975);

  ctx.fillStyle = '#18181b';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(dateStr, canvas.width - 180, 945);
  ctx.fillStyle = '#71717a';
  ctx.font = '18px sans-serif';
  ctx.fillText('Date Issued', canvas.width - 180, 975);

  // Download PNG
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  const safeName = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  link.download = `quizzy-certificate-${safeName || 'respondent'}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

