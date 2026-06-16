import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  Code2,
  HelpCircle,
  Layers3,
  LibraryBig,
  MapPin,
  Plus,
  Target,
} from 'lucide-react';
import { api } from '../lib/api';
import { Spinner } from '../components/UI';
import type { Stats } from '../types';
import type { RoutineItem } from '../types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const sections = [
  {
    key: 'bookmarks',
    label: 'Bookmarks',
    title: 'Save useful CP links',
    description: 'Research links, blogs, tools, tutorials and references in one clean library.',
    icon: Bookmark,
    to: '/bookmarks',
    accent: 'text-chart-1',
    bg: 'bg-chart-1/12',
  },
  {
    key: 'notebooks',
    label: 'Notebooks',
    title: 'Write markdown notes',
    description: 'Keep research notes, study plans, ideas and observations searchable.',
    icon: BookOpen,
    to: '/notebooks',
    accent: 'text-chart-2',
    bg: 'bg-chart-2/12',
  },
  {
    key: 'codes',
    label: 'Snippets',
    title: 'Store reusable code',
    description: 'Templates, utilities and useful code ready when you need them.',
    icon: Code2,
    to: '/codes',
    accent: 'text-chart-3',
    bg: 'bg-chart-3/12',
  },
  {
    key: 'questions',
    label: 'Q&A',
    title: 'Track solved problems',
    description: 'Questions, explanations, links, code and solved status together.',
    icon: HelpCircle,
    to: '/questions',
    accent: 'text-chart-4',
    bg: 'bg-chart-4/12',
  },
] as const;

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [upcoming, setUpcoming] = useState<RoutineItem[]>([]);
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [routineOpen, setRoutineOpen] = useState(false);

  useEffect(() => {
    api.stats
      .get()
      .then(setStats)
      .catch(() => setStats({ bookmarks: 0, notebooks: 0, codes: 0, questions: 0, solved: 0 }));
    api.routines.list().then((items) => {
      setRoutines(items);
      const today = new Date().toISOString().slice(0, 10);
      setUpcoming(items.filter((item) => !item.repeatWeekly && item.date >= today).slice(0, 3));
    }).catch(() => {});
  }, []);

  const total = useMemo(() => {
    if (!stats) return 0;
    return stats.bookmarks + stats.notebooks + stats.codes + stats.questions;
  }, [stats]);

  const solvedPercent = useMemo(() => {
    if (!stats || !stats.questions) return 0;
    return Math.round((stats.solved / stats.questions) * 100);
  }, [stats]);

  const today = new Date();
  const todayIndex = today.getDay();
  const todayDate = today.toISOString().slice(0, 10);
  const todayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(today);
  const todaySchedule = routines
    .filter((item) => (item.repeatWeekly && item.dayOfWeek === todayIndex) || (!item.repeatWeekly && item.date === todayDate))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-5 animate-fade-in">
      <Card className="rounded-3xl border-primary/20 bg-card/95">
        <CardContent className="p-4 sm:p-5">
          <button
            type="button"
            onClick={() => setRoutineOpen((value) => !value)}
            className="flex w-full cursor-pointer items-center gap-3 text-left"
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold tracking-tight">Today&apos;s routine</p>
              <p className="text-sm text-muted-foreground">{todayLabel} - {todaySchedule.length} item{todaySchedule.length === 1 ? '' : 's'}</p>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${routineOpen ? 'rotate-180' : ''}`} />
          </button>
          {routineOpen && (
            <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {todaySchedule.length === 0 ? (
                <div className="rounded-2xl border border-border bg-muted/30 p-3 text-sm text-muted-foreground">No class or event today.</div>
              ) : todaySchedule.map((item) => (
                <div key={item._id} className="rounded-2xl border border-border bg-muted/30 p-3">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold tracking-tight">{item.title}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/12 px-2.5 py-1 text-xs font-semibold text-primary">
                          <Clock className="h-3.5 w-3.5" /> {item.startTime || '--:--'} - {item.endTime || '--:--'}
                        </span>
                        {item.room && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2.5 py-1 text-xs font-semibold text-sky-300">
                            <MapPin className="h-3.5 w-3.5" /> Room {item.room}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <section className="surface overflow-hidden rounded-3xl p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_22rem] lg:items-center">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:block">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <LibraryBig className="h-3.5 w-3.5" />
              Personal knowledge base
            </div>
            <div className="flex flex-wrap gap-2 lg:mt-4">
              <Button asChild>
                <Link to="/questions/new">
                  <Plus className="h-4 w-4" />
                  Add Question
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/codes">Open Code Book</Link>
              </Button>
            </div>
          </div>

          <Card className="rounded-3xl border-primary/20 bg-primary/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Solved progress</p>
                  {!stats ? (
                    <div className="mt-1.5 h-8 w-20 animate-pulse rounded bg-foreground/20" />
                  ) : (
                    <p className="mt-1 text-3xl font-semibold tracking-tight">{solvedPercent}%</p>
                  )}
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
                  <Target className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-background/70">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${solvedPercent}%` }}
                />
              </div>
              {!stats ? (
                <div className="mt-3.5 h-4 w-48 animate-pulse rounded bg-foreground/10" />
              ) : (
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{stats.solved} solved</span>
                  <span>{stats.questions} total questions</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {sections.map((section, index) => {
          const value = stats ? (stats[section.key as keyof Stats] as number) : null;
          return (
            <Link key={section.key} to={section.to} className="stagger-item block" style={{ animationDelay: `${index * 55}ms` }}>
              <Card className="interactive-card h-full rounded-3xl">
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`grid h-12 w-12 place-items-center rounded-2xl ${section.bg}`}>
                      <section.icon className={`h-5 w-5 ${section.accent}`} />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover/card:translate-x-0.5 group-hover/card:text-foreground" />
                  </div>
                  {value === null ? (
                    <div className="mt-5 h-9 w-16 animate-pulse rounded-lg bg-muted" />
                  ) : (
                    <p className="mt-5 text-3xl font-semibold tracking-tight">{value}</p>
                  )}
                  <p className="mt-1 text-sm font-medium">{section.label}</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{section.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-3xl">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-success/12 text-success">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                {!stats ? (
                  <div className="h-8 w-16 animate-pulse rounded bg-muted" />
                ) : (
                  <p className="text-2xl font-semibold tracking-tight">{total}</p>
                )}
                <p className="text-sm text-muted-foreground">Total saved items</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              Use this app as your own memory system: collect resources, turn concepts into notes, and save complete answers with explanation.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-muted text-foreground">
                <Layers3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-semibold tracking-tight">Recommended workflow</p>
                <p className="text-sm text-muted-foreground">Fast path for learning</p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {['Save useful link', 'Write explanation', 'Store final answer'].map((step, index) => (
                <div key={step} className="rounded-2xl border border-border bg-muted/35 p-3">
                  <p className="text-xs font-semibold text-primary">0{index + 1}</p>
                  <p className="mt-1 text-sm font-medium">{step}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {upcoming.length > 0 && (
        <Card className="rounded-3xl">
          <CardContent className="p-5 sm:p-6">
            <p className="text-base font-semibold tracking-tight">Upcoming events</p>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {upcoming.map((item) => (
                <div key={item._id} className="rounded-2xl border border-border bg-muted/35 p-3">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.date} · {item.startTime} - {item.endTime}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
