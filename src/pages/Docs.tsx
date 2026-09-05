import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, FileText, GraduationCap, Lock, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  docCategories,
  docGroupLabels,
  docGroupOrder,
  docLevelLabels,
} from '@/data/docs';
import { useDocProgress } from '@/hooks/useDocProgress';
import { useAuth } from '@/hooks/useAuth';
import { searchDocs, type DocSearchResult } from '@/data/docs/search';
import { docIcon, docAccent } from '@/components/docs/docMeta';
import { cn } from '@/lib/utils';

function categoryProgress(chapterCount: number, readIds: Set<string>, category: typeof docCategories[number]) {
  const read = category.chapters.filter((chapter) => readIds.has(chapter.id)).length;
  return { read, total: chapterCount, percent: chapterCount ? Math.round((read / chapterCount) * 100) : 0 };
}

function DocCategoryCard({ category }: { category: typeof docCategories[number] }) {
  const Icon = docIcon(category.icon);
  const accent = docAccent(category.accent);
  const isAuthed = useAuth();
  const { readIds } = useDocProgress(category.id);
  const { read, total, percent } = categoryProgress(category.chapters.length, readIds, category);

  return (
    <Link
      to={`/docs/${category.id}`}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card/60 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-border/80 hover:bg-card"
    >
      <div className="flex items-start gap-4">
        <div className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1', accent.bg, accent.ring, accent.text)}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold tracking-tight">{category.titleEn}</h3>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{category.description}</p>
        </div>
      </div>

      {isAuthed && (
        <div className="mt-4 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className={cn('h-full rounded-full transition-all', accent.bar)} style={{ width: `${percent}%` }} />
          </div>
          <span className="text-[11px] font-medium tabular-nums text-muted-foreground">{percent}%</span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <Badge variant="secondary" className="rounded-full text-[11px]">
          {isAuthed ? `${read}/${total}` : total} চ্যাপ্টার
        </Badge>
        <span className={cn('flex items-center gap-1 text-xs font-medium opacity-0 transition group-hover:opacity-100', accent.text)}>
          পড়া শুরু করি <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

function highlightText(text: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q) return text;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase()
      ? <mark key={i} className="rounded bg-primary/20 px-0.5 text-foreground">{part}</mark>
      : part,
  );
}

function SearchResultRow({
  result,
  active,
  query,
  onClick,
  onHover,
}: {
  result: DocSearchResult;
  active: boolean;
  query: string;
  onClick: () => void;
  onHover: () => void;
}) {
  return (
    <button
      onMouseEnter={onHover}
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition',
        active ? 'bg-accent ring-1 ring-primary/30' : 'hover:bg-accent/50',
      )}
    >
      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{highlightText(result.chapterTitle, query)}</span>
        </div>
        <p className="truncate text-[11px] text-muted-foreground">
          {result.categoryTitle}
        </p>
        {result.snippet && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground/70">
            {highlightText(result.snippet, query)}
          </p>
        )}
      </div>
      <Badge variant="outline" className="shrink-0 rounded-full text-[9px] capitalize">
        {result.level}
      </Badge>
    </button>
  );
}

export default function Docs() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const isAuthed = useAuth();
  const activeCategory = categoryId ? docCategories.find((c) => c.id === categoryId) : undefined;
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);

  const searchResults = useMemo(() => searchDocs(query, 8), [query]);
  const isSearching = isAuthed && query.trim().length >= 2;

  useEffect(() => {
    if (activeCategory) {
      document.title = `${activeCategory.titleEn} — Docs | FlowDesk`;
    } else {
      document.title = 'Docs — A to Z গাইড | FlowDesk';
    }
  }, [activeCategory]);

  useEffect(() => {
    if (!isSearching) return;
    function onClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [isSearching]);

  useEffect(() => setActiveIndex(0), [query]);

  useEffect(() => {
    function onSlash(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        document.getElementById('docs-search-input')?.focus();
        setSearchOpen(true);
      }
    }
    document.addEventListener('keydown', onSlash);
    return () => document.removeEventListener('keydown', onSlash);
  }, []);

  const handleSearchKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isSearching || searchResults.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % searchResults.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + searchResults.length) % searchResults.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const result = searchResults[activeIndex];
        if (result) navigate(`/docs/${result.categoryId}/${result.chapterId}`);
      } else if (e.key === 'Escape') {
        setQuery('');
        setSearchOpen(false);
      }
    },
    [isSearching, searchResults, activeIndex, navigate],
  );

  const grouped = useMemo(() => {
    return docGroupOrder.map((group) => ({
      group,
      categories: docCategories.filter((category) => category.group === group),
    })).filter((entry) => entry.categories.length > 0);
  }, []);

  const totalChapters = docCategories.reduce((sum, category) => sum + category.chapters.length, 0);

  if (activeCategory) {
    return <CategoryView category={activeCategory} />;
  }

  return (
    <div className="space-y-8">
      <section className="relative rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card/40 to-card p-7 sm:p-9">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
        </div>
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-3">
            <Badge variant="secondary" className="rounded-full">
              <GraduationCap className="mr-1.5 h-3.5 w-3.5" /> বাংলায় শেখার ভান্ডার
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Docs — A to Z গাইড</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Python, NumPy, Pandas, Git/CI-CD, Linux, Docker, JWT-OAuth থেকে Machine Learning, NLP, Deep Learning পর্যন্ত — সব এক জায়গায়, সম্পূর্ণ বাংলায়, কোড উদাহরণ সহ। মোট <span className="font-semibold text-foreground">{totalChapters}</span> চ্যাপ্টার।
            </p>
          </div>
          {isAuthed ? (
            <div ref={searchRef} className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="docs-search-input"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={handleSearchKey}
              placeholder="চ্যাপ্টার, টপিক বা কীওয়ার্ড খুঁজি..."
              className="rounded-2xl bg-background/70 pl-9 pr-9"
            />
            {query ? (
              <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2" onClick={() => { setQuery(''); setSearchOpen(false); }}>
                <X className="h-4 w-4" />
              </Button>
            ) : (
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">/</kbd>
            )}

            {isSearching && searchOpen && (
              <div className="absolute left-0 right-0 top-full z-[100] mt-2 max-h-[60vh] overflow-y-auto rounded-2xl border border-border bg-popover shadow-2xl backdrop-blur-xl p-2">
                {searchResults.length > 0 ? (
                  <div className="space-y-1">
                    {searchResults.map((result, i) => (
                      <SearchResultRow
                        key={`${result.categoryId}-${result.chapterId}`}
                        result={result}
                        active={i === activeIndex}
                        query={query}
                        onClick={() => navigate(`/docs/${result.categoryId}/${result.chapterId}`)}
                        onHover={() => setActiveIndex(i)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">কোনো ফলাফল পাওয়া যায়নি</p>
                    <p className="mt-1 text-xs text-muted-foreground/60">অন্য কীওয়ার্ড দিয়ে চেষ্টা করুন</p>
                  </div>
                )}
              </div>
            )}
          </div>
          ) : null}
        </div>
      </section>

      {!isAuthed && (
        <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Lock className="h-4 w-4" />
            </span>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Login করলে</span> প্রতিটা চ্যাপ্টারে নিজের নোট, পড়ার প্রগ্রেস ও সার্চ সেভ থাকবে।
            </p>
          </div>
          <Link to="/login">
            <Button size="sm" className="shrink-0 rounded-full">Login করি</Button>
          </Link>
        </div>
      )}

      {grouped.map(({ group, categories }) => (
        <section key={group} className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {docGroupLabels[group]}
            </h2>
            <div className="h-px flex-1 bg-border/60" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <DocCategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function CategoryView({ category }: { category: typeof docCategories[number] }) {
  const Icon = docIcon(category.icon);
  const accent = docAccent(category.accent);
  const isAuthed = useAuth();
  const { readIds } = useDocProgress(category.id);
  const readCount = category.chapters.filter((c) => readIds.has(c.id)).length;
  const percent = category.chapters.length ? Math.round((readCount / category.chapters.length) * 100) : 0;

  return (
    <div className="space-y-7">
      <Link to="/docs" className="flex items-center gap-2 text-xs text-muted-foreground transition hover:text-foreground">
        <ArrowRight className="h-3.5 w-3.5 rotate-180" /> সব Docs
      </Link>

      <section className={cn('relative overflow-hidden rounded-3xl border border-border p-7 sm:p-9', accent.bg)}>
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className={cn('grid h-12 w-12 place-items-center rounded-2xl ring-1', accent.ring, accent.text)}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <Badge variant="secondary" className="rounded-full text-[11px]">{docGroupLabels[category.group]}</Badge>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{category.titleEn}</h1>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{category.description}</p>
            </div>
          </div>
          {isAuthed && (
            <div className="w-full space-y-1.5 sm:w-56">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>প্রগ্রেস</span>
                <span className="font-medium tabular-nums">{percent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted/60">
                <div className={cn('h-full rounded-full transition-all', accent.bar)} style={{ width: `${percent}%` }} />
              </div>
              <p className="text-[11px] text-muted-foreground">{readCount}/{category.chapters.length} চ্যাপ্টার পড়া হয়েছে</p>
            </div>
          )}
        </div>
      </section>

      <div className="space-y-2.5">
        {category.chapters.map((chapter, index) => {
          const done = isAuthed && readIds.has(chapter.id);
          return (
            <Link
              key={chapter.id}
              to={`/docs/${category.id}/${chapter.id}`}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card/50 p-4 transition hover:border-border/80 hover:bg-card"
            >
              <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-semibold tabular-nums ring-1', done ? 'bg-emerald-500/12 text-emerald-300 ring-emerald-500/30' : cn(accent.bg, accent.text, accent.ring))}>
                {done ? '✓' : index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{chapter.title}</p>
                {chapter.subtitle && <p className="truncate text-xs text-muted-foreground">{chapter.subtitle}</p>}
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <Badge variant="outline" className="rounded-full text-[10px]">{docLevelLabels[chapter.level]}</Badge>
                <span className="text-[11px] text-muted-foreground">{chapter.minutes} মিঃ</span>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}