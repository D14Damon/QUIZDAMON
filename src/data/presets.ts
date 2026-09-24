import { QuizTheme, Quiz, LayoutType, Question } from '../types';

export const THEME_PRESETS: QuizTheme[] = [
  {
    id: 'minimal-studio',
    name: 'Minimal Studio',
    fontFamily: 'modern',
    primaryColor: '#18181b', // zinc-900
    primaryTextColor: '#ffffff',
    backgroundColor: '#fafafa', // zinc-50
    cardBackgroundColor: '#ffffff',
    textColor: '#18181b',
    mutedTextColor: '#71717a',
    borderColor: '#e4e4e7',
    pattern: 'none',
    cardStyle: 'flat',
    borderRadius: 'rounded',
    buttonStyle: 'solid',
    animationPreset: 'fade-slide',
    isDark: false,
  },
  {
    id: 'editorial-paper',
    name: 'Editorial Gazette',
    fontFamily: 'editorial',
    primaryColor: '#78350f', // amber-900
    primaryTextColor: '#fef3c7',
    backgroundColor: '#fbf9f4', // warm paper
    cardBackgroundColor: '#ffffff',
    textColor: '#292524',
    mutedTextColor: '#78716c',
    borderColor: '#e7e5e4',
    pattern: 'none',
    cardStyle: 'elevated',
    borderRadius: 'rounded',
    buttonStyle: 'solid',
    animationPreset: 'paper-unfold',
    isDark: false,
  },
  {
    id: 'sage-botanical',
    name: 'Botanical Sage',
    fontFamily: 'friendly',
    primaryColor: '#2d6a4f', // forest green
    primaryTextColor: '#ffffff',
    backgroundColor: '#f4f7f4', // soft green tint
    cardBackgroundColor: '#ffffff',
    textColor: '#1b4332',
    mutedTextColor: '#52796f',
    borderColor: '#d8f3dc',
    pattern: 'dots',
    cardStyle: 'elevated',
    borderRadius: 'pill',
    buttonStyle: 'pill',
    animationPreset: 'gentle-float',
    isDark: false,
  },
  {
    id: 'midnight-obsidian',
    name: 'Midnight Obsidian',
    fontFamily: 'tech',
    primaryColor: '#6366f1', // indigo-500
    primaryTextColor: '#ffffff',
    backgroundColor: '#09090b', // zinc-950
    cardBackgroundColor: '#18181b', // zinc-900
    textColor: '#f4f4f5',
    mutedTextColor: '#a1a1aa',
    borderColor: '#27272a',
    pattern: 'grid',
    cardStyle: 'glass',
    borderRadius: 'rounded',
    buttonStyle: 'solid',
    animationPreset: 'cinema-zoom',
    isDark: true,
  },
  {
    id: 'sunset-terracotta',
    name: 'Sunset Terracotta',
    fontFamily: 'friendly',
    primaryColor: '#ea580c', // orange-600
    primaryTextColor: '#ffffff',
    backgroundColor: '#fff7ed', // orange-50
    cardBackgroundColor: '#ffffff',
    textColor: '#431407',
    mutedTextColor: '#9a3412',
    borderColor: '#fed7aa',
    pattern: 'mesh',
    cardStyle: 'elevated',
    borderRadius: 'rounded',
    buttonStyle: 'solid',
    animationPreset: 'spring-pop',
    isDark: false,
  },
  {
    id: 'cyber-neon',
    name: 'Cyber Horizon',
    fontFamily: 'code',
    primaryColor: '#06b6d4', // cyan-500
    primaryTextColor: '#09090b',
    backgroundColor: '#0f172a', // slate-900
    cardBackgroundColor: '#1e293b', // slate-800
    textColor: '#f8fafc',
    mutedTextColor: '#94a3b8',
    borderColor: '#334155',
    pattern: 'grid',
    cardStyle: 'border-bold',
    borderRadius: 'none',
    buttonStyle: 'neo',
    animationPreset: 'glitch-tech',
    isDark: true,
  },
  {
    id: 'lavender-dream',
    name: 'Lavender Mist',
    fontFamily: 'friendly',
    primaryColor: '#7c3aed', // violet-600
    primaryTextColor: '#ffffff',
    backgroundColor: '#faf5ff', // purple-50
    cardBackgroundColor: '#ffffff',
    textColor: '#3b0764',
    mutedTextColor: '#7e22ce',
    borderColor: '#f3e8ff',
    pattern: 'dots',
    cardStyle: 'elevated',
    borderRadius: 'pill',
    buttonStyle: 'pill',
    animationPreset: 'stagger-reveal',
    isDark: false,
  },
  {
    id: 'neo-brutalist',
    name: 'Neo Brutalism',
    fontFamily: 'tech',
    primaryColor: '#facc15', // yellow-400
    primaryTextColor: '#000000',
    backgroundColor: '#fef08a', // pale yellow
    cardBackgroundColor: '#ffffff',
    textColor: '#000000',
    mutedTextColor: '#525252',
    borderColor: '#000000',
    pattern: 'dots',
    cardStyle: 'border-bold',
    borderRadius: 'none',
    buttonStyle: 'neo',
    animationPreset: 'elastic-snap',
    isDark: false,
  },
  {
    id: 'luxury-monolith',
    name: 'Monolith Gold',
    fontFamily: 'modern',
    primaryColor: '#d4af37', // champagne gold
    primaryTextColor: '#18181b',
    backgroundColor: '#18181b', // dark charcoal
    cardBackgroundColor: '#27272a', // zinc-800
    textColor: '#fef08a',
    mutedTextColor: '#a1a1aa',
    borderColor: '#3f3f46',
    pattern: 'mesh',
    cardStyle: 'elevated',
    borderRadius: 'rounded',
    buttonStyle: 'solid',
    animationPreset: 'slide-horizontal',
    isDark: true,
  },
  {
    id: 'crimson-scholar',
    name: 'Crimson Scholar',
    fontFamily: 'editorial',
    primaryColor: '#991b1b', // deep ruby red
    primaryTextColor: '#ffffff',
    backgroundColor: '#fdf8f6', // ivory tinted
    cardBackgroundColor: '#ffffff',
    textColor: '#450a0a',
    mutedTextColor: '#7f1d1d',
    borderColor: '#fee2e2',
    pattern: 'dots',
    cardStyle: 'elevated',
    borderRadius: 'rounded',
    buttonStyle: 'solid',
    animationPreset: 'flip-card',
    isDark: false,
  },
];

export const createDefaultBlankQuestion = (id = "q1"): Question => ({
  id,
  type: "multiple-choice",
  title: "",
  description: "",
  required: true,
  points: 10,
  options: [
    { id: "opt_1", text: "", isCorrect: true },
    { id: "opt_2", text: "", isCorrect: false },
    { id: "opt_3", text: "", isCorrect: false },
    { id: "opt_4", text: "", isCorrect: false },
  ],
  explanation: "",
});

export const STARTER_TEMPLATES: Omit<Quiz, 'id' | 'creatorId' | 'creatorEmail' | 'createdAt' | 'updatedAt' | 'responseCount'>[] = [
  // 1. Design Systems Quiz
  {
    title: 'Design Systems & UI Aesthetics Quiz',
    description: 'Test your intuition for visual hierarchy, typography pairings, and spatial balance.',
    category: 'Quiz',
    layout: 'step-by-step',
    theme: THEME_PRESETS[0], // Minimal Studio
    settings: {
      collectName: true,
      collectEmail: true,
      requireName: true,
      requireEmail: false,
      collectSection: true,
      requireSection: false,
      sectionType: 'free-text',
      sectionOptions: ['Cohort A', 'Cohort B', 'Design Team'],
      limitOneSubmission: true,
      timeLimitMinutes: 10,
      shuffleQuestions: false,
      showScoreImmediately: true,
      allowReview: true,
      passPercentage: 70,
      successTitle: 'Quiz Complete!',
      successMessage: 'Thank you for testing your design knowledge. Review your score and detailed explanations below.',
    },
    status: 'published',
    questions: [createDefaultBlankQuestion()],
  },

  // 2. Editorial Gazette Humanities & Literary Quiz
  {
    title: 'Editorial Gazette Humanities & Literary Quiz',
    description: 'A thoughtful literary and philosophical challenge testing classical works, rhetoric, and editorial nuances.',
    category: 'Quiz',
    layout: 'single-page',
    theme: THEME_PRESETS[1], // Editorial Gazette - paper-unfold
    settings: {
      collectName: true,
      collectEmail: true,
      requireName: true,
      requireEmail: false,
      collectSection: true,
      requireSection: false,
      sectionType: 'dropdown',
      sectionOptions: ['Literature Department', 'Philosophy Guild', 'Independent Reader'],
      limitOneSubmission: true,
      timeLimitMinutes: 12,
      shuffleQuestions: false,
      showScoreImmediately: true,
      allowReview: true,
      passPercentage: 70,
      successTitle: 'Editorial Review Completed',
      successMessage: 'Your submission has been evaluated. Review your literary score and historical annotations below.',
    },
    status: 'published',
    questions: [createDefaultBlankQuestion()],
  },

  // 3. Botanical Sage Ecosystems & Biology Quiz
  {
    title: 'Botanical Sage Ecosystems & Biology Quiz',
    description: 'An exploration of botanical science, ecological biodiversity, and plant cellular biology.',
    category: 'Quiz',
    layout: 'step-by-step',
    theme: THEME_PRESETS[2], // Botanical Sage - gentle-float
    settings: {
      collectName: true,
      collectEmail: false,
      requireName: true,
      requireEmail: false,
      collectSection: true,
      requireSection: false,
      sectionType: 'free-text',
      sectionOptions: ['Botany Cohort', 'Field Ecology', 'Horticulture'],
      limitOneSubmission: true,
      timeLimitMinutes: 10,
      shuffleQuestions: false,
      showScoreImmediately: true,
      allowReview: true,
      passPercentage: 65,
      successTitle: 'Ecological Assessment Complete',
      successMessage: 'Well done! Cultivating scientific curiosity nurtures our natural environment.',
    },
    status: 'published',
    questions: [createDefaultBlankQuestion()],
  },

  // 4. Midnight Obsidian Tech & Cloud Architecture Quiz
  {
    title: 'Midnight Obsidian Tech & Cloud Architecture Quiz',
    description: 'A fast-paced test of contemporary distributed systems, cloud security, and reactive frontend patterns.',
    category: 'Quiz',
    layout: 'card-deck',
    theme: THEME_PRESETS[3], // Midnight Obsidian - cinema-zoom
    settings: {
      collectName: true,
      collectEmail: true,
      requireName: true,
      requireEmail: true,
      collectSection: true,
      requireSection: true,
      sectionType: 'free-text',
      sectionOptions: ['Engineering Dept', 'DevOps Team', 'Frontend Guild'],
      limitOneSubmission: true,
      timeLimitMinutes: 8,
      shuffleQuestions: true,
      showScoreImmediately: true,
      allowReview: true,
      passPercentage: 60,
      successTitle: 'Sprint Finished!',
      successMessage: 'Great work! Check your score breakdown and how you compare with standard architectural benchmarks.',
    },
    status: 'published',
    questions: [createDefaultBlankQuestion()],
  },

  // 5. Sunset Terracotta Product Discovery & Sentiment Form
  {
    title: 'Sunset Terracotta Product Discovery & Sentiment Form',
    description: 'A beautifully formatted feedback form to understand user sentiment, satisfaction, and product fit.',
    category: 'Form',
    layout: 'single-page',
    theme: THEME_PRESETS[4], // Sunset Terracotta - spring-pop
    settings: {
      collectName: true,
      collectEmail: true,
      requireName: false,
      requireEmail: false,
      collectSection: true,
      requireSection: false,
      sectionType: 'free-text',
      sectionOptions: ['Beta User', 'Pro Subscriber', 'Free Tier'],
      limitOneSubmission: true,
      timeLimitMinutes: null,
      shuffleQuestions: false,
      showScoreImmediately: false,
      allowReview: false,
      passPercentage: 0,
      successTitle: 'Feedback Received',
      successMessage: 'We deeply appreciate your candid thoughts. Your answers help us build a more thoughtful experience.',
    },
    status: 'published',
    questions: [createDefaultBlankQuestion()],
  },

  // 6. Cyber Horizon General Science Trivia Challenge
  {
    title: 'Cyber Horizon General Science Trivia Challenge',
    description: 'An interactive trivia competition with timed questions, explanations, and instant score leaderboards.',
    category: 'Quiz',
    layout: 'card-deck',
    theme: THEME_PRESETS[5], // Cyber Horizon - glitch-tech
    settings: {
      collectName: true,
      collectEmail: true,
      requireName: true,
      requireEmail: false,
      collectSection: true,
      requireSection: false,
      sectionType: 'free-text',
      sectionOptions: ['Team Alpha', 'Team Beta', 'Solo Competitor'],
      limitOneSubmission: true,
      timeLimitMinutes: 5,
      shuffleQuestions: true,
      showScoreImmediately: true,
      allowReview: true,
      passPercentage: 75,
      successTitle: 'Trivia Challenge Complete!',
      successMessage: 'Challenge concluded! See your final score, check where you placed, and review answers below.',
    },
    status: 'published',
    questions: [createDefaultBlankQuestion()],
  },

  // 7. Lavender Mist Team Culture & Wellness Pulse
  {
    title: 'Lavender Mist Team Culture & Wellness Pulse',
    description: 'Confidential pulse survey to gauge team happiness, psychological safety, and growth opportunities.',
    category: 'Survey',
    layout: 'step-by-step',
    theme: THEME_PRESETS[6], // Lavender Mist - stagger-reveal
    settings: {
      collectName: false,
      collectEmail: false,
      requireName: false,
      requireEmail: false,
      collectSection: true,
      requireSection: true,
      sectionType: 'dropdown',
      sectionOptions: ['Engineering & Product', 'Marketing & Growth', 'Operations & People', 'Customer Support'],
      limitOneSubmission: true,
      timeLimitMinutes: null,
      shuffleQuestions: false,
      showScoreImmediately: false,
      allowReview: false,
      passPercentage: 0,
      successTitle: 'Pulse Recorded',
      successMessage: 'Thank you for taking the time to share your perspective. Leadership reviews these insights every quarter.',
    },
    status: 'published',
    questions: [createDefaultBlankQuestion()],
  },

  // 8. Neo-Brutalism Pop Trivia & Speed Challenge
  {
    title: 'Neo-Brutalism Pop Trivia & Speed Challenge',
    description: 'High-contrast, bold aesthetic pop culture & digital trends quiz with rapid-fire questions.',
    category: 'Quiz',
    layout: 'card-deck',
    theme: THEME_PRESETS[7], // Neo Brutalism - elastic-snap
    settings: {
      collectName: true,
      collectEmail: false,
      requireName: true,
      requireEmail: false,
      collectSection: false,
      requireSection: false,
      limitOneSubmission: true,
      timeLimitMinutes: 6,
      shuffleQuestions: true,
      showScoreImmediately: true,
      allowReview: true,
      passPercentage: 70,
      successTitle: 'CHALLENGE CLEARED!',
      successMessage: 'You survived the high-intensity pop culture sprint. View your standing below!',
    },
    status: 'published',
    questions: [createDefaultBlankQuestion()],
  },

  // 9. Monolith Gold Executive Creative Brief Form
  {
    title: 'Monolith Gold Executive Creative Brief Form',
    description: 'Agency discovery questionnaire for collecting project scope, brand vision, target timeline, and budget.',
    category: 'Form',
    layout: 'single-page',
    theme: THEME_PRESETS[8], // Monolith Gold - slide-horizontal
    settings: {
      collectName: true,
      collectEmail: true,
      requireName: true,
      requireEmail: true,
      collectSection: true,
      requireSection: false,
      sectionType: 'free-text',
      sectionOptions: ['New Client', 'Existing Partner', 'Retainer Account'],
      limitOneSubmission: true,
      timeLimitMinutes: null,
      shuffleQuestions: false,
      showScoreImmediately: false,
      allowReview: true,
      passPercentage: 0,
      successTitle: 'Brief Submitted Successfully',
      successMessage: 'We have received your project specifications. Our strategy team will assemble a preliminary proposal within 48 hours.',
    },
    status: 'published',
    questions: [createDefaultBlankQuestion()],
  },

  // 10. Crimson Scholar Academic Science Olympiad
  {
    title: 'Crimson Scholar Academic Science Olympiad',
    description: 'A rigorous academic competition covering astrophysics, organic chemistry, and advanced genetics.',
    category: 'Quiz',
    layout: 'step-by-step',
    theme: THEME_PRESETS[9], // Crimson Scholar - flip-card
    settings: {
      collectName: true,
      collectEmail: true,
      requireName: true,
      requireEmail: true,
      collectSection: true,
      requireSection: true,
      sectionType: 'dropdown',
      sectionOptions: ['Olympiad Varsity', 'Junior Honors', 'Regional Finalist'],
      limitOneSubmission: true,
      timeLimitMinutes: 15,
      shuffleQuestions: true,
      showScoreImmediately: true,
      allowReview: true,
      passPercentage: 80,
      successTitle: 'Examination Concluded',
      successMessage: 'Your examination sheet has been graded according to Olympiad rubric standards.',
    },
    status: 'published',
    questions: [createDefaultBlankQuestion()],
  },
];

export interface ThemeAtmosphereInfo {
  name: string;
  effectName: string;
  badge: string;
  description: string;
}

export const THEME_ATMOSPHERES: Record<string, ThemeAtmosphereInfo> = {
  'minimal-studio': {
    name: 'Minimal Studio',
    effectName: 'Blueprint Drafting Grid',
    badge: '📐 Precision Grid',
    description: 'Architectural coordinates, alignment crosshairs, and slow scanning precision guidelines.',
  },
  'editorial-paper': {
    name: 'Editorial Gazette',
    effectName: 'Warm Parchment & Ink Dust',
    badge: '📜 Vintage Ink',
    description: 'Warm study ambient light, vintage ink specks, and delicate antique dust motes.',
  },
  'sage-botanical': {
    name: 'Botanical Sage',
    effectName: 'Falling Leaves & Forest Spores',
    badge: '🌿 Falling Leaves',
    description: 'Gently tumbling botanical leaves, glowing forest spores, and organic sunbeams.',
  },
  'midnight-obsidian': {
    name: 'Midnight Obsidian',
    effectName: 'Constellation Synaptic Tech',
    badge: '🌌 Neural Cosmos',
    description: 'Deep space cosmic aurora wave, interconnected neural nodes, and glowing data pulses.',
  },
  'sunset-terracotta': {
    name: 'Sunset Terracotta',
    effectName: 'Tuscan Twilight & Rising Embers',
    badge: '🌅 Golden Glow',
    description: 'Radiating golden hour horizon bloom, gentle heat shimmers, and ascending dusk embers.',
  },
  'cyber-neon': {
    name: 'Cyber Horizon',
    effectName: '3D Synthwave Grid & Electric Sparks',
    badge: '⚡ 3D Horizon',
    description: 'Receding 3D perspective grid floor, neon horizon glow, and high-speed cyber sparks.',
  },
  'lavender-dream': {
    name: 'Lavender Mist',
    effectName: 'Iridescent Wellness Orbs',
    badge: '🫧 Iridescent Fog',
    description: 'Soothing pastel mist clouds and floating translucent iridescent wellness bubbles.',
  },
  'neo-brutalist': {
    name: 'Neo Brutalism',
    effectName: 'Kinetic Pop-Art Geometry',
    badge: '💥 Pop Geometry',
    description: 'Crisp tumbling pop shapes (triangles, lightning, stars, crosses) with snappy physics.',
  },
  'luxury-monolith': {
    name: 'Monolith Gold',
    effectName: '24k Sparkling Diamond Dust',
    badge: '✦ 24k Gold Stars',
    description: 'Microscopic champagne gold glitter, four-point diamond star flares, and metallic sheen.',
  },
  'crimson-scholar': {
    name: 'Crimson Scholar',
    effectName: 'Atomic Orbits & Scholarly Embers',
    badge: '⚛️ Atomic Orbits',
    description: '3D rotating atomic orbital rings with electron paths and ascending scholarly ruby embers.',
  },
};

export const getThemeAtmosphere = (themeId?: string): ThemeAtmosphereInfo => {
  if (!themeId) return THEME_ATMOSPHERES['minimal-studio'];
  const tid = themeId.toLowerCase();
  for (const [key, info] of Object.entries(THEME_ATMOSPHERES)) {
    if (tid.includes(key) || key.includes(tid)) return info;
  }
  return {
    name: 'Custom Ambient',
    effectName: 'Dynamic Ambient Field',
    badge: '✨ Live Atmosphere',
    description: 'Subtle ambient atmospheric particles matching this theme.',
  };
};


