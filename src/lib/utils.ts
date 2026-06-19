import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const CATEGORIES = [
  'general',
  'research',
  'study',
  'programming',
  'algorithms',
  'data-structures',
  'math',
  'ai',
  'web-dev',
  'tools',
  'tutorials',
  'contest-logs',
] as const;
export const BOOKMARK_CATEGORIES = CATEGORIES;
export const PLATFORMS = ['codeforces', 'leetcode', 'codechef', 'atcoder', 'cses', 'hackerrank', 'other'] as const;
export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export const LANGUAGES = ['cpp', 'python', 'java', 'javascript', 'typescript', 'rust', 'go', 'bash', 'sql', 'json', 'ipynb', 'other'] as const;

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

export function getFavicon(url: string) {
  try {
    const domain = new URL(normalizeUrl(url)).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return '';
  }
}

export function normalizeUrl(url: string) {
  const value = url.trim();
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export function capitalize(str: string) {
  return str
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function categoryLabel(slug: string, categories: { slug: string; name: string }[]) {
  return categories.find((category) => category.slug === slug)?.name ?? capitalize(slug || 'general');
}

export function normalizeSearchText(value: unknown) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function isSubsequence(needle: string, haystack: string) {
  let index = 0;
  for (const char of haystack) {
    if (char === needle[index]) index += 1;
    if (index === needle.length) return true;
  }
  return false;
}

function editDistanceAtMostOne(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
    } else {
      edits += 1;
      if (edits > 1) return false;
      if (a.length > b.length) i += 1;
      else if (b.length > a.length) j += 1;
      else {
        i += 1;
        j += 1;
      }
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let wordA = a;
  let wordB = b;
  if (wordA.length > wordB.length) {
    const tmp = wordA;
    wordA = wordB;
    wordB = tmp;
  }
  const row = new Int32Array(wordA.length + 1);
  for (let i = 0; i <= wordA.length; i++) {
    row[i] = i;
  }
  for (let i = 1; i <= wordB.length; i++) {
    let prev = i;
    for (let j = 1; j <= wordA.length; j++) {
      let val;
      if (wordB[i - 1] === wordA[j - 1]) {
        val = row[j - 1];
      } else {
        val = Math.min(
          row[j - 1] + 1,
          Math.min(
            row[j] + 1,
            prev + 1
          )
        );
      }
      row[j - 1] = prev;
      prev = val;
    }
    row[wordA.length] = prev;
  }
  return row[wordA.length];
}

export function fuzzyMatch(search: string, fields: unknown[]) {
  const query = normalizeSearchText(search);
  if (!query) return true;

  const haystack = normalizeSearchText(fields.flat().join(' '));
  if (haystack.includes(query)) return true;

  const queryTokens = query.split(/\s+/).filter(Boolean);
  const hayTokens = haystack.split(/\s+/).filter(Boolean);

  const tokenMatch = queryTokens.every((token) =>
    hayTokens.some((candidate) => candidate.includes(token) || isSubsequence(token, candidate) || editDistanceAtMostOne(token, candidate))
  );
  if (tokenMatch) return true;

  const dist = levenshtein(query, haystack);
  const maxLen = Math.max(query.length, haystack.length);
  return dist / maxLen <= 0.35;
}

export function getShareUrl(type: 'notes' | 'codes' | 'questions' | 'bookmarks', id: string) {
  return `${window.location.origin}/share/${type}/${id}`;
}

export async function copyShareUrl(type: 'notes' | 'codes' | 'questions' | 'bookmarks', id: string) {
  let url = getShareUrl(type, id);
  try {
    const token = localStorage.getItem('auth-token');
    const response = await fetch('/api/shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ type, id }),
    });
    if (response.ok) {
      const data = await response.json();
      const routeType = data.type === 'notebooks' ? 'notebooks' : data.type;
      if (data.code && routeType) url = `${window.location.origin}/${routeType}/${data.code}`;
    }
  } catch {
    url = getShareUrl(type, id);
  }
  await navigator.clipboard.writeText(url);
  return url;
}
