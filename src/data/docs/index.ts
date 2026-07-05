export type DocLevel = 'beginner' | 'intermediate' | 'advanced';

export interface DocChapter {
  id: string;
  title: string;
  subtitle?: string;
  level: DocLevel;
  minutes: number;
  tags?: string[];
  body: string;
  bodyEn?: string;
}

export interface DocCategory {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  icon: string;
  accent: string;
  group: 'language' | 'data' | 'devops' | 'security' | 'ai';
  chapters: DocChapter[];
}

import { docMeta } from './meta';

const chapterModules = import.meta.glob(['./chapters/**/*.md', './chapters/**/*.en.md'], {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const FALLBACK = '# কনটেন্ট শীঘ্রই আসছে\n\nএই চ্যাপ্টারটি এখনো লেখা হচ্ছে।';

function bodyFor(categoryId: string, chapterId: string): string {
  return chapterModules[`./chapters/${categoryId}/${chapterId}.md`] ?? FALLBACK;
}

function bodyForEn(categoryId: string, chapterId: string): string | undefined {
  return chapterModules[`./chapters/${categoryId}/${chapterId}.en.md`];
}

export const docCategories: DocCategory[] = docMeta.map((category) => ({
  ...category,
  chapters: category.chapters.map((chapter) => ({
    ...chapter,
    body: bodyFor(category.id, chapter.id),
    bodyEn: bodyForEn(category.id, chapter.id),
  })),
}));

export const docGroupLabels: Record<DocCategory['group'], string> = {
  language: 'Programming',
  data: 'Data Science',
  devops: 'DevOps & Tools',
  security: 'Security',
  ai: 'AI / ML',
};

export const docGroupOrder: DocCategory['group'][] = [
  'language',
  'data',
  'devops',
  'security',
  'ai',
];

export const docLevelLabels: Record<DocLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export function getCategory(id: string) {
  return docCategories.find((category) => category.id === id);
}

export function getChapter(categoryId: string, chapterId: string) {
  const category = getCategory(categoryId);
  if (!category) return undefined;
  const index = category.chapters.findIndex((chapter) => chapter.id === chapterId);
  if (index === -1) return undefined;
  return {
    category,
    chapter: category.chapters[index],
    index,
    prev: index > 0 ? category.chapters[index - 1] : undefined,
    next: index < category.chapters.length - 1 ? category.chapters[index + 1] : undefined,
  };
}

export function docProgressKey(categoryId: string) {
  return `docs-progress:${categoryId}`;
}

export function readProgress(categoryId: string): Set<string> {
  try {
    const stored = localStorage.getItem(docProgressKey(categoryId));
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

export function writeProgress(categoryId: string, ids: Set<string>) {
  try {
    localStorage.setItem(docProgressKey(categoryId), JSON.stringify([...ids]));
    window.dispatchEvent(new CustomEvent('docs-progress-change', { detail: { categoryId } }));
  } catch {}
}

export function clearAllProgress() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('docs-progress:'))
      .forEach((key) => localStorage.removeItem(key));
    window.dispatchEvent(new CustomEvent('docs-progress-change'));
  } catch {}
}

export function totalReadCount(): number {
  return docCategories.reduce((sum, category) => {
    return sum + category.chapters.filter((ch) => readProgress(category.id).has(ch.id)).length;
  }, 0);
}

export function totalChapterCount(): number {
  return docCategories.reduce((sum, category) => sum + category.chapters.length, 0);
}