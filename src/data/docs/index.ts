export type DocLevel = 'beginner' | 'intermediate' | 'advanced';

export interface DocChapter {
  id: string;
  title: string;
  subtitle?: string;
  level: DocLevel;
  minutes: number;
  tags?: string[];
  body: string;
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

const chapterModules = import.meta.glob('./chapters/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

function bodyFor(categoryId: string, chapterId: string): string {
  const key = `./chapters/${categoryId}/${chapterId}.md`;
  return chapterModules[key] ?? '# কনটেন্ট শীঘ্রই আসছে\n\nএই চ্যাপ্টারটি এখনো লেখা হচ্ছে।';
}

export const docCategories: DocCategory[] = docMeta.map((category) => ({
  ...category,
  chapters: category.chapters.map((chapter) => ({
    ...chapter,
    body: bodyFor(category.id, chapter.id),
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
  localStorage.setItem(docProgressKey(categoryId), JSON.stringify([...ids]));
}