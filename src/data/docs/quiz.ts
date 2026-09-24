// Per-chapter practice and thinking questions. Files live at ./quizzes/<categoryId>/<chapterId>.json
// and are picked up automatically — add a JSON, get questions.

export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export interface QuizQuestion {
  id: string;
  difficulty: QuizDifficulty;
  question: string;
  code?: string;
  hint: string;
}

const modules = import.meta.glob<{ default: QuizQuestion[] }>('./quizzes/**/*.json', {
  eager: true,
  import: 'default',
});

const quizMap = new Map<string, QuizQuestion[]>();
for (const [path, questions] of Object.entries(modules)) {
  const m = path.match(/\/([^/]+)\/([^/]+)\.json$/);
  if (!m || !Array.isArray(questions)) continue;
  quizMap.set(`${m[1]}/${m[2]}`, questions);
}

export function getQuiz(categoryId: string, chapterId: string): QuizQuestion[] {
  return quizMap.get(`${categoryId}/${chapterId}`) ?? [];
}

export const difficultyLabels: Record<QuizDifficulty, string> = {
  easy: 'সহজ',
  medium: 'মাঝারি',
  hard: 'কঠিন',
};
