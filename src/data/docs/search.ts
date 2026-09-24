import { docCategories } from './index';

export interface DocSearchResult {
  categoryId: string;
  categoryTitle: string;
  categoryIcon?: string;
  categoryAccent?: string;
  chapterId: string;
  chapterTitle: string;
  chapterSubtitle?: string;
  level: string;
  minutes: number;
  score: number;
  snippet: string;
  matchedHeading?: string;
  matchField: 'title' | 'subtitle' | 'heading' | 'tag' | 'body';
  matchCount: number;
}

interface ChapterSection {
  heading: string;
  level: number;
  text: string;
}

interface SearchableDoc {
  categoryId: string;
  categoryTitle: string;
  categoryIcon: string;
  categoryAccent: string;
  chapterId: string;
  chapterTitle: string;
  chapterSubtitle: string;
  tags: string[];
  level: string;
  minutes: number;
  sections: ChapterSection[];
  cleanBody: string;
}

function cleanMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, (code) => code.replace(/```[a-z]*\n?/gi, ' ').replace(/```/g, ' '))
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~#]/g, ' ')
    .replace(/>\s*/g, ' ')
    .replace(/\|/g, ' ')
    .replace(/-{3,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Pre-index all chapters into memory once at module load
const indexedDocs: SearchableDoc[] = docCategories.flatMap((category) =>
  category.chapters.map((chapter) => {
    const rawSections = chapter.body.split(/\n(?=#{2,3}\s+)/);
    let currentH2 = '';
    const sections: ChapterSection[] = rawSections.map((sec, idx) => {
      const firstLine = sec.trim().split('\n')[0];
      const headingMatch = firstLine.match(/^(#{2,3})\s+(.*)$/);
      let heading = '';
      let level = 2;
      if (headingMatch) {
        level = headingMatch[1].length;
        const hText = cleanMarkdown(headingMatch[2]);
        if (level === 2) {
          currentH2 = hText;
          heading = hText;
        } else {
          heading = currentH2 ? `${currentH2} › ${hText}` : hText;
        }
      } else {
        heading = idx === 0 ? 'ভূমিকা' : '';
      }
      return {
        heading,
        level,
        text: cleanMarkdown(sec),
      };
    });

    return {
      categoryId: category.id,
      categoryTitle: category.titleEn,
      categoryIcon: category.icon,
      categoryAccent: category.accent,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      chapterSubtitle: chapter.subtitle ?? '',
      tags: chapter.tags ?? [],
      level: chapter.level,
      minutes: chapter.minutes,
      sections,
      cleanBody: cleanMarkdown(chapter.body),
    };
  }),
);

// Bidirectional technical synonyms (English <-> Bangla)
const SYNONYMS: Record<string, string[]> = {
  assignment: ['অ্যাসাইনমেন্ট', 'অ্যাসাইন', 'operator'],
  variable: ['ভ্যারিয়েবল', 'চলক', 'var'],
  constant: ['কনস্ট্যান্ট', 'ধ্রুবক', 'final', 'const'],
  datatype: ['ডেটা টাইপ', 'ডাটা টাইপ', 'টাইপ', 'primitive'],
  loop: ['লুপ', 'পুনরাবৃত্তি', 'while', 'for'],
  array: ['অ্যারে', 'arrays'],
  function: ['ফাংশন', 'মেথড', 'method'],
  method: ['মেথড', 'ফাংশন'],
  class: ['ক্লাস', 'classes'],
  object: ['অবজেক্ট'],
  constructor: ['কনস্ট্রাকটর'],
  inheritance: ['ইনহেরিটেন্স', 'উত্তরাধিকার'],
  polymorphism: ['পলিমরফিজম', 'বহুরূপতা'],
  encapsulation: ['এনক্যাপসুলেশন'],
  abstraction: ['অ্যাবস্ট্রাকশন'],
  interface: ['ইন্টারফেস'],
  exception: ['এক্সেপশন', 'ব্যতিক্রম', 'try', 'catch', 'throw'],
  error: ['এরর', 'ত্রুটি'],
  thread: ['থ্রেড', 'threading'],
  concurrency: ['কনকারেন্সি', 'async'],
  memory: ['মেমোরি', 'heap', 'stack', 'ram'],
  heap: ['হিপ'],
  stack: ['স্ট্যাক'],
  pointer: ['পয়েন্টার'],
  reference: ['রেফারেন্স'],
  borrow: ['বরোয়িং', 'ধার', 'borrowing'],
  borrowing: ['বরোয়িং', 'borrow', 'ধার'],
  lifetime: ['লাইফটাইম'],
  ownership: ['ওনারশিপ'],
  struct: ['স্ট্রাক্ট'],
  generic: ['জেনেরিক', 'generics'],
  stream: ['স্ট্রিম'],
  lambda: ['ল্যাম্বডা'],
  garbage: ['গার্বেজ', 'জিসি', 'gc'],
  operator: ['অপারেটর'],
};

const REVERSE_SYNONYMS: Record<string, string[]> = {};
for (const [key, list] of Object.entries(SYNONYMS)) {
  for (const item of list) {
    const k = item.toLowerCase();
    if (!REVERSE_SYNONYMS[k]) REVERSE_SYNONYMS[k] = [];
    if (!REVERSE_SYNONYMS[k].includes(key)) REVERSE_SYNONYMS[k].push(key);
  }
}

function getQueryExpansions(q: string): string[] {
  const norm = q.trim().toLowerCase();
  const res = new Set<string>();
  res.add(norm);
  if (SYNONYMS[norm]) {
    SYNONYMS[norm].forEach((s) => res.add(s.toLowerCase()));
  }
  if (REVERSE_SYNONYMS[norm]) {
    REVERSE_SYNONYMS[norm].forEach((s) => res.add(s.toLowerCase()));
  }
  return Array.from(res);
}

// Safely match Bengali conjuncts (prevent false positive matches like 'ব্লুপ্রিন্ট' matching 'লুপ')
function matchesWordBoundary(text: string, term: string): { matches: boolean; count: number; firstIndex: number } {
  let count = 0;
  let firstIndex = -1;
  let pos = 0;
  while ((pos = text.indexOf(term, pos)) !== -1) {
    // If preceded by a virama/hasant (\u09cd), this is the tail of a conjunct, not the start
    if (pos > 0 && text.charCodeAt(pos - 1) === 0x09cd) {
      pos += term.length;
      continue;
    }
    // If followed by a virama/hasant, this is the start of a conjunct
    const end = pos + term.length;
    if (end < text.length && text.charCodeAt(end) === 0x09cd) {
      pos += term.length;
      continue;
    }
    count++;
    if (firstIndex === -1) firstIndex = pos;
    pos += term.length;
  }
  return { matches: count > 0, count, firstIndex };
}

function extractSnippet(text: string, query: string, radius = 75): string {
  const q = query.toLowerCase();
  const lower = text.toLowerCase();
  let idx = -1;

  // Try direct match first with boundary check
  const direct = matchesWordBoundary(lower, q);
  if (direct.matches) {
    idx = direct.firstIndex;
  } else {
    // Try expansions
    const expansions = getQueryExpansions(q);
    for (const exp of expansions) {
      const m = matchesWordBoundary(lower, exp.toLowerCase());
      if (m.matches) {
        idx = m.firstIndex;
        break;
      }
    }
  }

  if (idx === -1) {
    const clean = text.slice(0, 130).trim();
    return clean + (text.length > 130 ? ' …' : '');
  }

  let start = Math.max(0, idx - radius);
  let end = Math.min(text.length, idx + query.length + radius);

  // Align to whitespace
  if (start > 0) {
    const space = text.indexOf(' ', start);
    if (space !== -1 && space < idx) start = space + 1;
  }
  if (end < text.length) {
    const space = text.lastIndexOf(' ', end);
    if (space !== -1 && space > idx + query.length) end = space;
  }

  let snip = text.slice(start, end).trim();
  if (start > 0) snip = '… ' + snip;
  if (end < text.length) snip = snip + ' …';
  return snip;
}

export function searchDocs(query: string, limit = 8, categoryId?: string): DocSearchResult[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const expansions = getQueryExpansions(q);
  const tokens = q.split(/\s+/).filter(Boolean);

  const results: DocSearchResult[] = [];

  for (const doc of indexedDocs) {
    if (categoryId && doc.categoryId !== categoryId) continue;

    let score = 0;
    let matchField: DocSearchResult['matchField'] = 'body';
    let matchedHeading = '';
    let bestSectionText = '';
    let matchCount = 0;

    const lowerTitle = doc.chapterTitle.toLowerCase();
    const lowerSubtitle = doc.chapterSubtitle.toLowerCase();
    const lowerId = doc.chapterId.toLowerCase();

    // 1. Chapter Title Matches
    if (lowerTitle === q) {
      score += 1500;
      matchField = 'title';
    } else if (matchesWordBoundary(lowerTitle, q).matches) {
      score += 900;
      matchField = 'title';
    } else if (tokens.length > 1 && tokens.every((t) => matchesWordBoundary(lowerTitle, t).matches)) {
      score += 700;
      matchField = 'title';
    } else {
      const titleMatches = tokens.filter((t) => matchesWordBoundary(lowerTitle, t).matches).length;
      if (titleMatches > 0) {
        score += titleMatches * 250;
        if (score > 300) matchField = 'title';
      }
    }

    // 2. Subtitle Matches
    if (matchesWordBoundary(lowerSubtitle, q).matches) {
      score += 500;
      if (score < 700) matchField = 'subtitle';
    } else if (tokens.length > 1 && tokens.every((t) => matchesWordBoundary(lowerSubtitle, t).matches)) {
      score += 400;
      if (score < 700) matchField = 'subtitle';
    }

    // 3. Tags Matches
    for (const tag of doc.tags) {
      const lowerTag = tag.toLowerCase();
      if (lowerTag === q) {
        score += 700;
        if (score < 700) matchField = 'tag';
      } else if (matchesWordBoundary(lowerTag, q).matches) {
        score += 450;
        if (score < 700) matchField = 'tag';
      }
    }

    // 4. Chapter ID Matches (e.g. 'syntax-basics', 'arrays')
    if (lowerId === q) {
      score += 600;
    } else if (lowerId.includes(q)) {
      score += 350;
    }

    // 5. Sections / Headings / Body Full-Text
    let maxSectionScore = 0;
    for (const sec of doc.sections) {
      const lowerH = sec.heading.toLowerCase();
      const lowerText = sec.text.toLowerCase();
      let secScore = 0;

      // Heading match
      const hMatch = matchesWordBoundary(lowerH, q);
      if (hMatch.matches) {
        secScore += 600;
      } else if (tokens.length > 1 && tokens.every((t) => matchesWordBoundary(lowerH, t).matches)) {
        secScore += 400;
      }

      // Text match
      const textMatch = matchesWordBoundary(lowerText, q);
      if (textMatch.matches) {
        matchCount += textMatch.count;
        secScore += 300 + Math.min(textMatch.count * 25, 200);
      } else if (tokens.length > 1 && tokens.every((t) => matchesWordBoundary(lowerText, t).matches)) {
        secScore += 220;
        matchCount += 1;
      }

      // Expansions & Synonyms
      for (const exp of expansions) {
        if (exp === q) continue;
        if (matchesWordBoundary(lowerH, exp).matches) {
          secScore += 250;
        }
        const expMatch = matchesWordBoundary(lowerText, exp);
        if (expMatch.matches) {
          secScore += 150;
          matchCount += expMatch.count;
        }
      }

      if (secScore > maxSectionScore) {
        maxSectionScore = secScore;
        matchedHeading = sec.heading;
        bestSectionText = sec.text;
        if (sec.heading && hMatch.matches && score < 700) {
          matchField = 'heading';
        }
      }
    }

    score += maxSectionScore;

    if (score > 0) {
      const snippet = extractSnippet(bestSectionText || doc.cleanBody, q);
      results.push({
        categoryId: doc.categoryId,
        categoryTitle: doc.categoryTitle,
        categoryIcon: doc.categoryIcon,
        categoryAccent: doc.categoryAccent,
        chapterId: doc.chapterId,
        chapterTitle: doc.chapterTitle,
        chapterSubtitle: doc.chapterSubtitle || undefined,
        level: doc.level,
        minutes: doc.minutes,
        score,
        matchField,
        matchedHeading: matchedHeading !== 'ভূমিকা' ? matchedHeading : undefined,
        snippet,
        matchCount,
      });
    }
  }

  // Sort by highest score first
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}