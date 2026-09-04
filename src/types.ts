export type LayoutType = 'step-by-step' | 'single-page' | 'card-deck';

export type FontFamilyType = 'modern' | 'editorial' | 'friendly' | 'tech' | 'code';

export type PatternType = 'none' | 'dots' | 'grid' | 'mesh';

export type CardStyleType = 'elevated' | 'flat' | 'glass' | 'border-bold';

export type BorderRadiusType = 'none' | 'rounded' | 'pill';

export type ButtonStyleType = 'solid' | 'soft' | 'neo' | 'pill';

export interface QuizTheme {
  id: string;
  name: string;
  fontFamily: FontFamilyType;
  primaryColor: string;      // Accent / button / active highlight
  primaryTextColor: string;  // Text color on primary buttons
  backgroundColor: string;   // Page canvas bg
  cardBackgroundColor: string; // Question card bg
  textColor: string;         // Main heading/body text
  mutedTextColor: string;    // Subtitles, options labels
  borderColor: string;       // Border color of cards/inputs
  pattern: PatternType;
  cardStyle: CardStyleType;
  borderRadius: BorderRadiusType;
  buttonStyle: ButtonStyleType;
  isDark?: boolean;
}

export type QuestionType = 
  | 'multiple-choice'
  | 'multiple-select'
  | 'true-false'
  | 'short-text'
  | 'long-text'
  | 'rating-stars'
  | 'opinion-scale';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  options?: QuestionOption[];
  required: boolean;
  points: number;
  explanation?: string;
  minRating?: number; // e.g. 1
  maxRating?: number; // e.g. 5 or 10
  ratingLabels?: { low?: string; high?: string };
}

export interface QuizSettings {
  collectName: boolean;
  collectEmail: boolean;
  requireName: boolean;
  requireEmail: boolean;
  collectSection?: boolean;
  requireSection?: boolean;
  sectionType?: 'free-text' | 'dropdown';
  sectionOptions?: string[];
  limitOneSubmission?: boolean; // Limit each user 1 submit each
  restrictToAllowedEmails?: boolean;
  allowedEmails?: string[]; // Specific emails authorized to take this quiz
  timeLimitMinutes: number | null; // null = no limit
  shuffleQuestions: boolean;
  showScoreImmediately: boolean;
  allowReview: boolean;
  passPercentage: number;
  successTitle: string;
  successMessage: string;
}

export const MAX_QUIZZES_PER_USER = 15;

export interface Quiz {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creatorEmail: string;
  creatorName?: string;
  customSlug?: string; // Custom URL slug (e.g. damonquiz-title)
  category?: string; // e.g. 'Quiz' | 'Form' | 'Survey'
  layout: LayoutType;
  theme: QuizTheme;
  questions: Question[];
  settings: QuizSettings;
  status: 'published' | 'draft';
  responseCount: number;
  createdAt: any;
  updatedAt: any;
}

export interface QuizResponseAnswer {
  questionId: string;
  questionTitle: string;
  questionType: QuestionType;
  value: any; // string | string[] | number | boolean
  isCorrect?: boolean;
  pointsEarned?: number;
  maxPoints?: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  photoBase64?: string; // 500x500 base64 image data URL
  updatedAt?: any;
}

export interface QuizResponse {
  id: string;
  quizId: string;
  creatorId?: string;
  quizTitle: string;
  respondentName?: string;
  respondentEmail?: string;
  respondentSection?: string; // Class / Group / Department section
  answers: Record<string, any>;
  evaluatedAnswers?: QuizResponseAnswer[];
  totalScore: number;
  maxScore: number;
  percentage: number;
  isPassed: boolean;
  timeSpentSeconds: number;
  submittedAt: any;
}
