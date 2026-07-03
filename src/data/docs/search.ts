import Fuse from 'fuse.js';
import { docCategories } from './index';

export interface DocSearchResult {
  categoryId: string;
  categoryTitle: string;
  chapterId: string;
  chapterTitle: string;
  chapterSubtitle?: string;
  level: string;
  minutes: number;
  score: number;
  snippet: string;
  matchField: 'title' | 'subtitle' | 'tag' | 'body';
}

interface SearchableDoc {
  categoryId: string;
  categoryTitle: string;
  chapterId: string;
  chapterTitle: string;
  chapterSubtitle: string;
  tags: string;
  body: string;
  level: string;
  minutes: number;
}

const docs: SearchableDoc[] = docCategories.flatMap((category) =>
  category.chapters.map((chapter) => ({
    categoryId: category.id,
    categoryTitle: category.titleEn,
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    chapterSubtitle: chapter.subtitle ?? '',
    tags: (chapter.tags ?? []).join(' '),
    body: chapter.body,
    level: chapter.level,
    minutes: chapter.minutes,
  })),
);

const fuse = new Fuse(docs, {
  keys: [
    { name: 'chapterTitle', weight: 0.4 },
    { name: 'tags', weight: 0.25 },
    { name: 'chapterSubtitle', weight: 0.15 },
    { name: 'body', weight: 0.2 },
  ],
  includeScore: true,
  includeMatches: true,
  threshold: 0.4,
  ignoreLocation: true,
  minMatchCharLength: 2,
});

function extractSnippet(
  text: string,
  indices: ReadonlyArray<readonly [number, number]>,
  radius = 70,
): string {
  if (!indices.length) {
    const firstLine = text.split('\n').find((l) => l.trim().length > 20);
    return (firstLine ?? text.slice(0, 120)).replace(/[#*>`|]/g, '').trim().slice(0, 120);
  }
  const [start, end] = indices[0];
  const left = Math.max(0, start - radius);
  const right = Math.min(text.length, end + radius);
  const raw = text
    .slice(left, right)
    .replace(/[#*>`|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return (left > 0 ? '… ' : '') + raw + (right < text.length ? ' …' : '');
}

const fieldMap: Record<string, DocSearchResult['matchField']> = {
  chapterTitle: 'title',
  tags: 'tag',
  chapterSubtitle: 'subtitle',
  body: 'body',
};

export function searchDocs(query: string, limit = 8): DocSearchResult[] {
  const q = query.trim();
  if (q.length < 2) return [];

  return fuse.search(q, { limit }).map(({ item, score, matches }) => {
    const match =
      matches?.find((m) => m.key === 'chapterTitle') ??
      matches?.find((m) => m.key === 'tags') ??
      matches?.find((m) => m.key === 'chapterSubtitle') ??
      matches?.[0];

    const matchField = match?.key ? (fieldMap[match.key] ?? 'body') : 'body';

    const snippet =
      matchField === 'body' && match?.value
        ? extractSnippet(match.value, match.indices)
        : matchField === 'title'
          ? item.chapterSubtitle || extractSnippet(item.body, [])
          : matchField === 'tag'
            ? `ট্যাগ: ${item.tags}`
            : item.chapterSubtitle || extractSnippet(item.body, []);

    return {
      categoryId: item.categoryId,
      categoryTitle: item.categoryTitle,
      chapterId: item.chapterId,
      chapterTitle: item.chapterTitle,
      chapterSubtitle: item.chapterSubtitle || undefined,
      level: item.level,
      minutes: item.minutes,
      score: Math.round((1 - (score ?? 0)) * 100),
      snippet,
      matchField,
    };
  });
}