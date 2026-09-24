// Per-chapter exam questions. Files live at ./quizzes/<categoryId>/<chapterId>.json
// and are picked up automatically — add a JSON, get a quiz.

export type QuizDifficulty = 'easy' | 'medium' | 'hard';
export type QuizType = 'mcq' | 'output' | 'code';

export interface QuizQuestion {
  id: string;
  difficulty: QuizDifficulty;
  /** mcq — বিকল্প বাছাই; output — কোডের আউটপুট অনুমান; code — কোড লিখে submit */
  type: QuizType;
  prompt: string;
  code?: string;
  options?: string[];
  /** mcq/output: correct index into options */
  answer?: number;
  /** code: accepted answer fragments (whitespace-normalized compare) */
  accept?: string[];
  explanation: string;
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

/** Whitespace-insensitive compare so indent/style differences don't fail a code answer. */
export function normalizeCode(s: string): string {
  return s
    .split('\n')
    .map((line) => line.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .join('\n');
}

/** Normalize punctuation and trailing semicolons for relaxed syntax comparisons. */
function stripPunctuationSpacing(str: string): string {
  return str
    .replace(/;+\s*$/, '')
    .replace(/\s*([=+\-*\/&,:;{}()[\]<>|])\s*/g, '$1')
    .trim();
}

export function isCorrect(q: QuizQuestion, response: number | string | undefined): boolean {
  if (response === undefined || response === '') return false;
  if (q.type === 'code') {
    const given = normalizeCode(String(response));
    const givenClean = stripPunctuationSpacing(given);

    return (q.accept ?? []).some((a) => {
      const aNorm = normalizeCode(a);
      if (given === aNorm) return true;
      return givenClean === stripPunctuationSpacing(aNorm);
    });
  }
  return response === q.answer;
}

export const difficultyLabels: Record<QuizDifficulty, string> = {
  easy: 'সহজ',
  medium: 'মাঝারি',
  hard: 'কঠিন',
};
