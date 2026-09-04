import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
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
  Milestone,
  Plus,
  Sparkles,
  Target,
} from 'lucide-react';
import { api } from '../lib/api';
import { Spinner } from '../components/UI';
import type { Stats, RoutineItem, Roadmap } from '../types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const sections = [
  {
    key: 'bookmarks',
    label: 'Bookmarks',
    title: 'Save useful links',
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
    title: 'Track questions and answers',
    description: 'Questions, explanations, links, code and completion status together.',
    icon: HelpCircle,
    to: '/questions',
    accent: 'text-chart-4',
    bg: 'bg-chart-4/12',
  },
] as const;

let cachedStats: Stats | null = null;
let cachedRoutines: RoutineItem[] = [];

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(cachedStats);
  const [upcoming, setUpcoming] = useState<RoutineItem[]>(() => {
    const today = localDateString();
    return cachedRoutines.filter((item) => !item.repeatWeekly && item.date >= today).slice(0, 3);
  });
  const [routines, setRoutines] = useState<RoutineItem[]>(cachedRoutines);
  const [activeRoadmap, setActiveRoadmap] = useState<Roadmap | null>(null);
  const [routineOpen, setRoutineOpen] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState(() => new Date().toTimeString().slice(0, 5));
  const [scratchpad, setScratchpad] = useState(() => localStorage.getItem('dashboard-scratchpad') || '');

  useEffect(() => {
    api.stats
      .get()
      .then((data) => {
        setStats(data);
        cachedStats = data;
      })
      .catch(() => setStats({ bookmarks: 0, notebooks: 0, codes: 0, questions: 0, solved: 0 }));
    api.routines.list().then((items) => {
      setRoutines(items);
      cachedRoutines = items;
      const today = localDateString();
      setUpcoming(items.filter((item) => !item.repeatWeekly && item.date >= today).slice(0, 3));
    }).catch(() => {});
    api.roadmaps.list().then((res) => {
      const items: Roadmap[] = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
      if (items.length > 0) setActiveRoadmap(items[0]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setCurrentTimeStr(new Date().toTimeString().slice(0, 5));
    }, 30000);
    return () => clearInterval(t);
  }, []);

  const total = useMemo(() => {
    if (!stats) return 0;
    return stats.bookmarks + stats.notebooks + stats.codes + stats.questions;
  }, [stats]);

  const solvedPercent = useMemo(() => {
    if (!stats || !stats.questions) return 0;
    return Math.round((stats.solved / stats.questions) * 100);
  }, [stats]);

  const roadmapProgress = useMemo(() => {
    if (!activeRoadmap) return { percentage: 0, completed: 0, total: 0 };
    let total = 0;
    let completed = 0;
    (activeRoadmap.phases || []).forEach((p) => {
      (p.tasks || []).forEach((t) => {
        total += 1;
        if (t.completed) completed += 1;
      });
    });
    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [activeRoadmap]);

  const today = new Date();
  const todayIndex = today.getDay();
  const todayDate = localDateString(today);
  const todayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(today);
  const todaySchedule = routines
    .filter((item) => (item.repeatWeekly && item.dayOfWeek === todayIndex) || (!item.repeatWeekly && item.date === todayDate))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const activeRoutine = useMemo(() => {
    if (todaySchedule.length === 0) return null;
    const [h, m] = currentTimeStr.split(':').map(Number);
    const currentMinutes = h * 60 + m;

    const parseTime = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const ongoing = todaySchedule.find(item => {
      const start = parseTime(item.startTime);
      const end = parseTime(item.endTime);
      return currentMinutes >= start && currentMinutes <= end;
    });

    if (ongoing) {
      const end = parseTime(ongoing.endTime);
      const remaining = end - currentMinutes;
      return { type: 'ongoing', item: ongoing, remaining };
    }

    const upcoming = todaySchedule.find(item => {
      const start = parseTime(item.startTime);
      return start > currentMinutes;
    });

    if (upcoming) {
      const start = parseTime(upcoming.startTime);
      const countdown = start - currentMinutes;
      return { type: 'upcoming', item: upcoming, countdown };
    }

    return null;
  }, [todaySchedule]);

  const heatmapData = useMemo(() => {
    const todayObj = new Date();
    const currentDay = todayObj.getDay();
    const startDate = new Date(todayObj);
    startDate.setDate(startDate.getDate() - (11 * 7 + currentDay));

    const countsMap = new Map();
    if (stats?.heatmap) {
      stats.heatmap.forEach((item) => {
        countsMap.set(item.date, item.count);
      });
    }

    const grid = [];
    for (let w = 0; w < 12; w++) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + (w * 7 + d));
        const dateStr = date.toISOString().slice(0, 10);
        const isFuture = date > todayObj;
        week.push({
          date: dateStr,
          count: isFuture ? -1 : (countsMap.get(dateStr) || 0),
        });
      }
      grid.push(week);
    }
    return grid;
  }, [stats]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Today's Routine Card ── */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-card/95 shadow-lg shadow-primary/5">
        {/* subtle gradient accent top-left */}
        <div className="pointer-events-none absolute -left-8 -top-8 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-8 bottom-0 h-32 w-32 rounded-full bg-primary/6 blur-2xl" />

        <div className="relative p-4 sm:p-5">
          {/* header row */}
          <button
            type="button"
            onClick={() => setRoutineOpen((v) => !v)}
            className="flex w-full cursor-pointer items-center gap-4 text-left"
          >
            {/* icon */}
            <div className="relative grid h-13 w-13 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 text-primary ring-1 ring-primary/20 shadow-inner">
              <CalendarDays className="h-6 w-6" />
              {activeRoutine?.type === 'ongoing' && (
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-red-500 ring-2 ring-card">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                </span>
              )}
            </div>

            {/* text block */}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-semibold tracking-tight">Today's routine</span>

                {activeRoutine && (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${
                      activeRoutine.type === 'ongoing'
                        ? 'border-red-500/30 bg-red-500/15 text-red-400'
                        : 'border-primary/30 bg-primary/12 text-primary'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${activeRoutine.type === 'ongoing' ? 'bg-red-400 animate-pulse' : 'bg-primary'}`} />
                    {activeRoutine.type === 'ongoing'
                      ? `${activeRoutine.item.title} · ${formatMinutes(activeRoutine.remaining!)} left`
                      : `Next: ${activeRoutine.item.title} in ${formatMinutes(activeRoutine.countdown!)}`}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {todayLabel}
                <span className="mx-1.5 text-muted-foreground/40">·</span>
                <span className="font-medium text-foreground/70">{todaySchedule.length} {todaySchedule.length === 1 ? 'item' : 'items'}</span>
              </p>
            </div>

            <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${routineOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* expanded schedule */}
          {routineOpen && (
            <div className="mt-4 space-y-2">
              {todaySchedule.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                  No classes or events scheduled for today 🎉
                </div>
              ) : (
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {todaySchedule.map((item) => {
                    const [h, m] = currentTimeStr.split(':').map(Number);
                    const cur = h * 60 + m;
                    const parse = (t: string) => { const [hh, mm] = t.split(':').map(Number); return hh * 60 + mm; };
                    const isNow = cur >= parse(item.startTime) && cur <= parse(item.endTime);
                    return (
                      <div
                        key={item._id}
                        className={`relative overflow-hidden rounded-2xl border p-3.5 transition-all ${
                          isNow
                            ? 'border-red-500/30 bg-red-500/8 shadow-sm shadow-red-500/10'
                            : 'border-border bg-muted/20 hover:bg-muted/35'
                        }`}
                      >
                        {isNow && <div className="absolute left-0 top-0 h-full w-0.5 rounded-r bg-red-500" />}
                        <p className={`truncate text-sm font-semibold ${isNow ? 'text-red-300' : ''}`}>{item.title}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            <Clock className="h-3 w-3" /> {item.startTime} – {item.endTime}
                          </span>
                          {item.room && (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-sky-500/12 px-2 py-0.5 text-xs font-medium text-sky-400">
                              <MapPin className="h-3 w-3" /> {item.room}
                            </span>
                          )}
                          {isNow && (
                            <span className="rounded-lg bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-400">Live</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Active Learning Roadmap Card ── */}
      {activeRoadmap ? (
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-card via-card to-primary/5 p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3.5">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Milestone className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">Active Learning Track</span>
                  <span className="text-xs text-muted-foreground">· {activeRoadmap.duration}</span>
                </div>
                <h4 className="text-base font-semibold tracking-tight text-foreground">{activeRoadmap.title}</h4>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xl font-bold text-foreground">{roadmapProgress.percentage}%</span>
                <span className="block text-[11px] text-muted-foreground">{roadmapProgress.completed}/{roadmapProgress.total} milestones</span>
              </div>
              <div className="w-24 hidden sm:block h-2.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${roadmapProgress.percentage}%` }} />
              </div>
              <Button size="sm" variant="outline" asChild className="gap-1.5 shrink-0">
                <Link to="/progress">
                  View Roadmap <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-3xl border border-dashed border-border bg-card/40 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Milestone className="h-5 w-5" />
            </div>
            <div>
              <h5 className="text-sm font-semibold">Start a 12-Month Learning Roadmap</h5>
              <p className="text-xs text-muted-foreground">Track Rust, DSA, systems, or data science goals step by step.</p>
            </div>
          </div>
          <Button size="sm" asChild className="gap-1.5 shrink-0">
            <Link to="/progress">
              <Sparkles className="h-3.5 w-3.5" /> Start Track
            </Link>
          </Button>
        </div>
      )}

      <section className="surface overflow-hidden rounded-3xl p-4 sm:p-5">
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:block">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <LibraryBig className="h-3.5 w-3.5" />
              Personal knowledge base
            </div>
            <div className="flex flex-wrap gap-2 lg:mt-4">
              <Button asChild>
                <Link to="/questions/new">
                  <Plus className="h-4 w-4" />
                  Add Answer
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
                  <p className="text-sm text-muted-foreground">Completion progress</p>
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
                  <span>{stats.solved} completed</span>
                  <span>{stats.questions} total items</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Card className="rounded-3xl border-primary/15 bg-card/95 overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold tracking-tight">Consistency Heatmap</p>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span>Less</span>
                <div className="h-3 w-3 rounded-[3px] bg-muted/20 border border-muted-foreground/5" />
                <div className="h-3 w-3 rounded-[3px] bg-primary/20 border border-primary/5" />
                <div className="h-3 w-3 rounded-[3px] bg-primary/50 border border-primary/20" />
                <div className="h-3 w-3 rounded-[3px] bg-primary border border-primary" />
                <span>More</span>
              </div>
            </div>
            <div className="flex items-center justify-start overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
              <div className="grid grid-flow-col gap-[3px]">
                {heatmapData.map((week, wIndex) => (
                  <div key={wIndex} className="grid grid-rows-7 gap-[3px]">
                    {week.map((day) => {
                      if (day.count === -1) {
                        return <div key={day.date} className="h-3 w-3 rounded-[2.5px] opacity-0" />;
                      }
                      let colorClass = 'bg-muted/20 border border-muted-foreground/5 hover:border-muted-foreground/25';
                      if (day.count > 0 && day.count <= 2) {
                        colorClass = 'bg-primary/25 border border-primary/10 hover:border-primary/30';
                      } else if (day.count > 2 && day.count <= 5) {
                        colorClass = 'bg-primary/55 border border-primary/30 hover:border-primary/50';
                      } else if (day.count > 5) {
                        colorClass = 'bg-primary border border-primary hover:brightness-110';
                      }

                      const formattedDate = new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }).format(new Date(day.date + 'T00:00:00'));

                      return (
                        <div
                          key={day.date}
                          className={`h-3 w-3 rounded-[2.5px] transition-all cursor-pointer ${colorClass}`}
                          title={`${day.count} contribution${day.count === 1 ? '' : 's'} on ${formattedDate}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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

      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card className="rounded-3xl border-primary/20 bg-card/95">
          <CardContent className="flex flex-col h-full p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-base font-semibold tracking-tight">Quick Scratchpad</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 rounded-xl"
                onClick={() => navigate('/notebooks/new?source=scratchpad')}
              >
                Convert to Note
              </Button>
            </div>
            <Textarea
              value={scratchpad}
              onChange={(e) => {
                setScratchpad(e.target.value);
                localStorage.setItem('dashboard-scratchpad', e.target.value);
              }}
              placeholder="Jot down quick thoughts, links, draft notes, or logs. Converts into a permanent markdown Note with one click..."
              className="flex-1 min-h-[140px] resize-none rounded-2xl font-mono text-sm bg-muted/20 border-border"
            />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3">
          <Card className="rounded-3xl">
            <CardContent className="p-5">
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
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardContent className="p-5 flex-1 flex flex-col justify-center">
              <div className="mb-3 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-muted text-foreground">
                  <Layers3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base font-semibold tracking-tight">Recommended workflow</p>
                  <p className="text-sm text-muted-foreground">Fast path for learning</p>
                </div>
              </div>
              <div className="grid gap-2 grid-cols-3">
                {['Save useful link', 'Write explanation', 'Store final answer'].map((step, index) => (
                  <div key={step} className="rounded-2xl border border-border bg-muted/35 p-2 text-center">
                    <p className="text-[10px] font-semibold text-primary">0{index + 1}</p>
                    <p className="mt-0.5 text-xs font-medium">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
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
