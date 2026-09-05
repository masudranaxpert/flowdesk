import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Hash,
  Languages,
  ListTree,
  LockKeyhole,
  PanelLeft,
  PanelLeftClose,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { docLevelLabels, getChapter } from '@/data/docs';
import { useDocProgress } from '@/hooks/useDocProgress';
import { useAuth } from '@/hooks/useAuth';
import { docIcon, docAccent } from '@/components/docs/docMeta';
import DocContent from '@/components/docs/DocContent';
import { cn } from '@/lib/utils';

export default function DocReader() {
  const { categoryId, chapterId } = useParams();
  const navigate = useNavigate();
  const data = useMemo(
    () => (categoryId && chapterId ? getChapter(categoryId, chapterId) : undefined),
    [categoryId, chapterId],
  );

  const { readIds, toggle } = useDocProgress(categoryId);
  const isAuthed = useAuth();
  const [lang, setLang] = useState<'bn' | 'en'>(() =>
    localStorage.getItem('docs-lang') === 'en' ? 'en' : 'bn',
  );
  const [sidebarHidden, setSidebarHidden] = useState(
    () => localStorage.getItem('docs-sidebar-hidden') === 'true',
  );

  const switchLang = (l: 'bn' | 'en') => {
    setLang(l);
    localStorage.setItem('docs-lang', l);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (data) {
      document.title = `${data.chapter.title} — ${data.category.titleEn} Docs | FlowDesk`;
    }
  }, [chapterId, data]);

  useEffect(() => {
    localStorage.setItem('docs-sidebar-hidden', String(sidebarHidden));
  }, [sidebarHidden]);

  if (!data) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-center">
        <div className="space-y-3">
          <LockKeyhole className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">চ্যাপ্টারটি খুঁজে পাওয়া যায়নি।</p>
          <Button variant="outline" onClick={() => navigate(categoryId ? `/docs/${categoryId}` : '/docs')}>Docs-এ ফিরে যাই</Button>
        </div>
      </div>
    );
  }

  const { category, chapter, index, prev, next } = data;
  const Icon = docIcon(category.icon);
  const accent = docAccent(category.accent);
  const isRead = readIds.has(chapter.id);
  const percent = Math.round((readIds.size / category.chapters.length) * 100);
  const backHref = category.id ? `/docs/${category.id}` : '/docs';

  return (
    <div className={cn('grid gap-8', sidebarHidden ? 'lg:grid-cols-1' : 'lg:grid-cols-[16rem_minmax(0,1fr)]')}>
      {!sidebarHidden && (
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="flex items-center justify-between">
              <Link to={backHref} className="flex items-center gap-2 text-xs text-muted-foreground transition hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> সব চ্যাপ্টার
              </Link>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSidebarHidden(true)} aria-label="Hide sidebar">
                <PanelLeftClose className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
            <div className={cn('flex items-center gap-2.5 rounded-2xl p-3 ring-1', accent.bg, accent.ring)}>
              <Icon className={cn('h-5 w-5 shrink-0', accent.text)} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{category.titleEn}</p>
                <p className="text-[11px] text-muted-foreground">{category.chapters.length} চ্যাপ্টার</p>
              </div>
            </div>
            {isAuthed && (
              <div className="h-1 overflow-hidden rounded-full bg-muted">
                <div className={cn('h-full rounded-full transition-all', accent.bar)} style={{ width: `${percent}%` }} />
              </div>
            )}
            <p className="px-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/70">সূচি</p>
            <nav className="max-h-[55vh] space-y-0.5 overflow-y-auto pr-1">
              {category.chapters.map((item, i) => {
                const active = item.id === chapter.id;
                const done = isAuthed && readIds.has(item.id);
                return (
                  <Link
                    key={item.id}
                    to={`/docs/${category.id}/${item.id}`}
                    className={cn(
                      'group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] transition',
                      active ? cn('font-medium', accent.bg, accent.text) : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    )}
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-muted/60 text-[10px] tabular-nums">
                      {done ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : i + 1}
                    </span>
                    <span className="line-clamp-2 leading-snug">{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
      )}

      <article className="min-w-0 space-y-6">
        <div className="flex items-center justify-between gap-2 lg:hidden">
          <Link to={backHref} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> সব চ্যাপ্টার
          </Link>
        </div>
        {sidebarHidden && (
          <div className="hidden items-center gap-2 lg:flex">
            <Button variant="outline" size="sm" className="gap-1.5 rounded-full" onClick={() => setSidebarHidden(false)}>
              <PanelLeft className="h-3.5 w-3.5" /> সূচি দেখাই
            </Button>
            <Link to={backHref} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> সব চ্যাপ্টার
            </Link>
          </div>
        )}

        <header className="space-y-3 border-b border-border/60 pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full text-[11px]">
              <Hash className="mr-1 h-3 w-3" /> চ্যাপ্টার {index + 1}/{category.chapters.length}
            </Badge>
            <Badge variant="outline" className="rounded-full text-[11px]">{docLevelLabels[chapter.level]}</Badge>
            <Badge variant="outline" className="rounded-full text-[11px]">
              <Clock className="mr-1 h-3 w-3" /> {chapter.minutes} মিনিট
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{chapter.title}</h1>
          {chapter.subtitle && <p className="text-sm text-muted-foreground">{chapter.subtitle}</p>}
          <div className="flex flex-wrap items-center gap-2">
            {isAuthed ? (
              <Button variant={isRead ? 'default' : 'outline'} size="sm" className="rounded-full" onClick={() => toggle(chapter.id)}>
                {isRead ? <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> : <Circle className="mr-1.5 h-3.5 w-3.5" />}
                {isRead ? 'পড়া হয়ে গেছে' : 'পড়া শেষ চিহ্নিত করি'}
              </Button>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm" className="rounded-full" >
                  <Circle className="mr-1.5 h-3.5 w-3.5" /> প্রগ্রেসের জন্য Login
                </Button>
              </Link>
            )}

            {chapter.bodyEn && (
              <div className="inline-flex items-center rounded-full border border-border bg-card/50 p-0.5 text-[11px] font-medium">
                <button
                  onClick={() => switchLang('bn')}
                  className={cn('rounded-full px-3 py-1 transition', lang === 'bn' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
                >
                  বাংলা
                </button>
                <button
                  onClick={() => switchLang('en')}
                  className={cn('flex items-center gap-1 rounded-full px-3 py-1 transition', lang === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
                >
                  <Languages className="h-3 w-3" /> English
                </button>
              </div>
            )}
          </div>
        </header>

        <DocContent body={lang === 'en' && chapter.bodyEn ? chapter.bodyEn : chapter.body} categoryId={category.id} chapterId={chapter.id} showNotes={isAuthed} />

        <footer className="grid gap-3 border-t border-border/60 pt-6 sm:grid-cols-2">
          {prev ? (
            <Link to={`/docs/${category.id}/${prev.id}`} className="group flex items-center gap-3 rounded-2xl border border-border bg-card/50 p-4 transition hover:bg-card">
              <ArrowLeft className="h-4 w-4 text-muted-foreground transition group-hover:text-foreground" />
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">আগের চ্যাপ্টার</p>
                <p className="truncate text-sm font-medium">{prev.title}</p>
              </div>
            </Link>
          ) : <div />}
          {next ? (
            <Link to={`/docs/${category.id}/${next.id}`} className="group flex items-center justify-end gap-3 rounded-2xl border border-border bg-card/50 p-4 text-right transition hover:bg-card">
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">পরের চ্যাপ্টার</p>
                <p className="truncate text-sm font-medium">{next.title}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:text-foreground" />
            </Link>
          ) : (
            <Link to="/docs" className="group flex items-center justify-end gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 text-right transition hover:bg-primary/10">
              <div className="min-w-0">
                <p className="text-[11px] text-primary/80">এই টপিক শেষ!</p>
                <p className="text-sm font-medium text-primary">আরেকটা টপিক বেছে নিই</p>
              </div>
              <ListTree className="h-4 w-4 text-primary" />
            </Link>
          )}
        </footer>
      </article>
    </div>
  );
}