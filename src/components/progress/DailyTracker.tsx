import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock,
  Flame,
  History,
  Plus,
  Trash2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { DailyHabit, DailyProgressLog } from '../../types';
import { getHabitTheme, localDateString, type HabitTheme } from './presets';

interface DailyTrackerProps {
  unifiedHabits: DailyHabit[];
  unifiedLogs: DailyProgressLog[];
  unifiedStreak: number;
  todayMinutes: number;
  setTodayMinutes: (mins: number) => void;
  todayNotes: string;
  setTodayNotes: (notes: string) => void;
  todayHabitsDone: Record<string, boolean>;
  setTodayHabitsDone: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  savingDailyLog: boolean;
  onSaveDailyLog: () => Promise<void>;
  onAddHabit: (title: string) => void;
  onDeleteHabit: (habitId: string, e?: React.MouseEvent) => void;
  onImportFromRoutine: () => Promise<void>;
  chartDaysRange: 30 | 14;
  setChartDaysRange: (range: 30 | 14) => void;
}

export function DailyTracker({
  unifiedHabits,
  unifiedLogs,
  unifiedStreak,
  todayMinutes,
  setTodayMinutes,
  todayNotes,
  setTodayNotes,
  todayHabitsDone,
  setTodayHabitsDone,
  savingDailyLog,
  onSaveDailyLog,
  onAddHabit,
  onDeleteHabit,
  onImportFromRoutine,
  chartDaysRange,
  setChartDaysRange,
}: DailyTrackerProps) {
  const [newHabitTitle, setNewHabitTitle] = useState('');

  // 30-Day or 14-Day daily study time & habit activity logs
  const chartDaysData = useMemo(() => {
    const result = [];
    const logsMap = new Map<string, DailyProgressLog>();
    unifiedLogs.forEach((log) => {
      if (log.date) logsMap.set(log.date, log);
    });

    const habitMap = new Map<string, { title: string; theme: HabitTheme }>();
    unifiedHabits.forEach((h, idx) => {
      habitMap.set(h.id, { title: h.title, theme: getHabitTheme(h.title, idx) });
    });

    for (let i = chartDaysRange - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = localDateString(d);
      const log = logsMap.get(dateStr);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthShort = d.toLocaleDateString('en-US', { month: 'short' });

      const completedHabitIds = log?.habitsDone || [];
      const completedHabits = completedHabitIds
        .map((hid) => habitMap.get(hid))
        .filter(Boolean) as Array<{ title: string; theme: HabitTheme }>;

      const hasEnglish = completedHabits.some((h) => h.theme.colorName === 'purple');
      const hasCoding = completedHabits.some((h) => h.theme.colorName === 'amber');
      const hasOther = completedHabits.some((h) => h.theme.colorName !== 'purple' && h.theme.colorName !== 'amber');

      result.push({
        date: dateStr,
        dayLabel: `${dayName} ${dayNum}`,
        fullLabel: `${monthShort} ${dayNum} (${dayName})`,
        dayNum,
        shortDay: dayName[0],
        minutes: log?.minutesSpent || 0,
        completedHabits,
        hasEnglish,
        hasCoding,
        hasOther,
        notes: log?.notes || '',
      });
    }
    return result;
  }, [unifiedLogs, unifiedHabits, chartDaysRange]);

  const maxChartMinutes = useMemo(() => {
    const max = Math.max(...chartDaysData.map((d) => d.minutes), 60);
    return Math.ceil(max / 30) * 30;
  }, [chartDaysData]);

  const avgMinutes = useMemo(() => {
    const logged = chartDaysData.filter((d) => d.minutes > 0);
    return logged.length > 0 ? Math.round(logged.reduce((acc, d) => acc + d.minutes, 0) / logged.length) : 0;
  }, [chartDaysData]);

  const handleAddSubmit = () => {
    if (!newHabitTitle.trim()) return;
    onAddHabit(newHabitTitle.trim());
    setNewHabitTitle('');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3 animate-fade-in">
      {/* Left 2 Cols: 30-Day Consistency Chart & Recent History */}
      <div className="space-y-6 lg:col-span-2">
        {/* 30-Day / 14-Day Consistency & Study Hours Chart */}
        <Card className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-semibold tracking-tight">
                  {chartDaysRange === 30 ? '30-Day Study & Habit Consistency' : '14-Day Study Consistency'}
                </h3>
                <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                  Rolling {chartDaysRange} Days
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Dedicated daily tracking: distinct colors for English, Coding, and study consistency
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Range Toggle */}
              <div className="flex items-center rounded-xl bg-muted/60 p-0.5 border border-border">
                <button
                  type="button"
                  onClick={() => setChartDaysRange(30)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                    chartDaysRange === 30
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  30 Days (1 Month)
                </button>
                <button
                  type="button"
                  onClick={() => setChartDaysRange(14)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                    chartDaysRange === 14
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  14 Days
                </button>
              </div>

              <Badge variant="secondary" className="text-[11px] gap-1">
                <Clock className="h-3 w-3" /> Avg: {avgMinutes}m / session
              </Badge>
            </div>
          </div>

          {/* Color Category Legend */}
          <div className="flex items-center gap-2.5 flex-wrap text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded-2xl border border-border/50">
            <span className="font-semibold text-foreground text-[10px] uppercase tracking-wider">Legend:</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 font-medium">
              <span className="h-2 w-2 rounded-full bg-purple-500" /> English Practice
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Coding & Study
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30 font-medium">
              <span className="h-2 w-2 rounded-full bg-sky-500" /> Routine
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gradient-to-r from-purple-500/30 to-amber-500/30 text-amber-300 border border-amber-500/40 font-medium">
              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-purple-500 to-amber-500" /> Both Completed
            </span>
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-amber-500/80">
              <span className="inline-block w-3 border-b border-dashed border-amber-500" /> 60m Target
            </span>
          </div>

          {/* Chart Bars */}
          <div className="space-y-2">
            <div className="relative h-48 w-full flex items-end justify-between gap-1 pt-8 pb-2 px-0.5">
              {/* 60m Goal Reference Line */}
              <div
                className="absolute left-0 right-0 border-b border-dashed border-amber-500/40 pointer-events-none z-10 flex justify-end pr-1"
                style={{ bottom: `${Math.round((60 / maxChartMinutes) * 100)}%` }}
              >
                <span className="text-[9px] font-mono text-amber-500/80 -translate-y-full bg-card/80 px-1 rounded">
                  60m Target
                </span>
              </div>

              {chartDaysData.map((item, idx) => {
                const heightPct = Math.min(100, Math.round((item.minutes / maxChartMinutes) * 100));
                const isToday = idx === chartDaysData.length - 1;

                // Determine bar background color based on habits
                let barClass = 'bg-muted/40';
                if (item.minutes > 0 || item.completedHabits.length > 0) {
                  if (item.hasEnglish && item.hasCoding) {
                    barClass = isToday
                      ? 'bg-gradient-to-t from-purple-500 via-amber-400 to-amber-500 shadow-md shadow-amber-500/25 ring-2 ring-primary/40'
                      : 'bg-gradient-to-t from-purple-500 to-amber-500 hover:brightness-110';
                  } else if (item.hasEnglish) {
                    barClass = isToday
                      ? 'bg-purple-500 shadow-md shadow-purple-500/25 ring-2 ring-purple-500/50'
                      : 'bg-purple-500/90 hover:bg-purple-500';
                  } else if (item.hasCoding) {
                    barClass = isToday
                      ? 'bg-amber-500 shadow-md shadow-amber-500/25 ring-2 ring-amber-500/50'
                      : 'bg-amber-500/90 hover:bg-amber-500';
                  } else {
                    barClass = isToday
                      ? 'bg-primary shadow-md shadow-primary/25 ring-2 ring-primary/50'
                      : 'bg-primary/90 hover:bg-primary';
                  }
                }

                return (
                  <div
                    key={item.date}
                    className="group relative flex-1 flex flex-col items-center h-full justify-end"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 whitespace-nowrap rounded-xl bg-popover px-2.5 py-1.5 text-[10px] font-medium text-popover-foreground shadow-xl border border-border">
                      <div className="font-bold text-foreground flex items-center gap-1">
                        {item.fullLabel} {isToday ? '(Today)' : ''}
                      </div>
                      <div className="text-amber-400 font-semibold mt-0.5">
                        Study: {item.minutes}m
                      </div>
                      {item.completedHabits.length > 0 ? (
                        <div className="flex flex-col gap-0.5 mt-1 border-t border-border/50 pt-1">
                          {item.completedHabits.map((ch, cIdx) => (
                            <span key={cIdx} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                              <span className={`h-1.5 w-1.5 rounded-full ${ch.theme.dot}`} />
                              {ch.title}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[9px] text-muted-foreground italic block">No habits checked</span>
                      )}
                      {item.notes && <p className="text-[9px] text-muted-foreground italic truncate max-w-[150px] mt-0.5">"{item.notes}"</p>}
                    </div>

                    {/* Value label above bar if > 0 */}
                    {item.minutes > 0 && (
                      <span className="text-[8px] font-mono font-semibold text-muted-foreground mb-0.5">
                        {item.minutes}m
                      </span>
                    )}

                    {/* Bar Pill */}
                    <div
                      className={`w-full max-w-[22px] rounded-t-md transition-all duration-300 ${barClass}`}
                      style={{ height: item.minutes > 0 ? `${Math.max(8, heightPct)}%` : item.completedHabits.length > 0 ? '8px' : '4px' }}
                    />

                    {/* Micro activity dots underneath bar */}
                    <div className="flex items-center justify-center gap-0.5 mt-1 h-2">
                      {item.hasEnglish && (
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" title="English practice" />
                      )}
                      {item.hasCoding && (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" title="Coding & study" />
                      )}
                      {item.hasOther && (
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" title="Other routine/habit" />
                      )}
                    </div>

                    {/* X-axis Day Label */}
                    <span
                      className={`mt-1 text-[9px] font-mono select-none ${
                        isToday
                          ? 'font-bold text-amber-500'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {chartDaysRange === 30 ? (idx % 3 === 0 || isToday ? item.dayNum : '') : item.shortDay}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/40">
              <span>{chartDaysRange} days ago</span>
              <span className="text-[10px] italic">Hover bars to view exact English / Coding / Study details</span>
              <span className="font-semibold text-foreground">Today</span>
            </div>
          </div>
        </Card>

        {/* Recent Daily Logs History */}
        <Card className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" /> Recent Activity History (Last 30 Days)
            </h4>
            <span className="text-[10px] text-muted-foreground font-medium">
              Auto-rolling 1 Month
            </span>
          </div>
          {unifiedLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No logged activity yet. Save your first check-in on the right!</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {unifiedLogs.slice(0, 15).map((log, idx) => {
                const habitMap = new Map<string, { title: string; theme: HabitTheme }>();
                unifiedHabits.forEach((h, hIdx) => {
                  habitMap.set(h.id, { title: h.title, theme: getHabitTheme(h.title, hIdx) });
                });
                const completedHabits = (log.habitsDone || [])
                  .map((hid) => habitMap.get(hid))
                  .filter(Boolean) as Array<{ title: string; theme: HabitTheme }>;

                return (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl bg-muted/30 border border-border/50 p-3 text-xs">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{log.date}</span>
                        {log.minutesSpent > 0 && (
                          <Badge variant="secondary" className="text-[10px] font-mono">
                            ⏱️ {log.minutesSpent}m
                          </Badge>
                        )}
                      </div>
                      {completedHabits.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {completedHabits.map((ch, cIdx) => (
                            <span
                              key={cIdx}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${ch.theme.badgeBg}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${ch.theme.dot}`} />
                              {ch.theme.label}
                            </span>
                          ))}
                        </div>
                      )}
                      {log.notes && <p className="text-muted-foreground text-xs">{log.notes}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Right 1 Col: Streak & Today's Check-in */}
      <div className="space-y-6">
        {/* Streak & Consistency Card */}
        <Card className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500/15 text-amber-500">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold tracking-tight">Active Streak</h4>
                <p className="text-xs text-muted-foreground">Keep studying daily</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-amber-500">{unifiedStreak}</span>
              <span className="text-xs text-muted-foreground block">Days Streak</span>
            </div>
          </div>
        </Card>

        {/* Today's Daily Habit & Study Log Card */}
        <Card className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold tracking-tight">Today's Check-in</h4>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          {/* Daily Habits Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Daily Habits & Commitments
              </label>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={onImportFromRoutine}
                className="h-6 text-[11px] text-primary hover:text-primary/90 gap-1 px-1.5 cursor-pointer"
                title="Import subjects and schedules from your Routine page"
              >
                <Clock className="h-3 w-3" /> Sync from Routine
              </Button>
            </div>

            {unifiedHabits.length === 0 ? (
              <p className="text-xs text-muted-foreground italic bg-muted/20 p-3 rounded-xl border border-dashed border-border/60">
                No habits added yet. Add a custom habit below or sync from your Routine.
              </p>
            ) : (
              <div className="space-y-2">
                {unifiedHabits.map((habit, idx) => {
                  const isDone = Boolean(todayHabitsDone[habit.id]);
                  const theme = getHabitTheme(habit.title, idx);
                  return (
                    <div
                      key={habit.id}
                      className={`group flex items-center justify-between gap-3 rounded-2xl border p-2.5 transition-all ${
                        isDone
                          ? `${theme.badgeBg}`
                          : 'border-border bg-muted/40 hover:bg-muted/70 text-muted-foreground'
                      }`}
                    >
                      <div
                        onClick={() =>
                          setTodayHabitsDone((prev) => ({
                            ...prev,
                            [habit.id]: !isDone,
                          }))
                        }
                        className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer select-none"
                      >
                        <div
                          className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-all ${
                            isDone
                              ? `${theme.dot} text-white border-transparent`
                              : 'border-muted-foreground/40 group-hover:border-primary'
                          }`}
                        >
                          {isDone && <CheckCircle2 className="h-3.5 w-3.5" />}
                        </div>
                        <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${theme.badgeBg}`}>
                            {theme.label}
                          </span>
                          <span className={`text-xs font-medium leading-relaxed truncate ${isDone ? 'line-through opacity-80' : ''}`}>
                            {habit.title}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => onDeleteHabit(habit.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10 transition-all shrink-0 cursor-pointer"
                        title="Delete habit"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Custom Habit Input */}
            <div className="flex items-center gap-2 pt-1">
              <Input
                placeholder="Add habit (e.g. 2 LeetCode problems)..."
                value={newHabitTitle}
                onChange={(e) => setNewHabitTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSubmit();
                }}
                className="h-8 text-xs rounded-xl"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={handleAddSubmit}
                className="h-8 text-xs rounded-xl shrink-0 gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
          </div>

          {/* Study Time Logger */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Today's Study Time
              </label>
              <span className="text-xs font-bold text-primary">{todayMinutes} Minutes</span>
            </div>

            {/* Preset buttons */}
            <div className="grid grid-cols-4 gap-1.5">
              {[30, 45, 60, 120].map((mins) => (
                <Button
                  key={mins}
                  type="button"
                  variant={todayMinutes === mins ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTodayMinutes(mins)}
                  className="h-8 text-xs font-semibold"
                >
                  {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                </Button>
              ))}
            </div>
          </div>

          {/* Notes / Reflection for today */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Notes / What did you learn?
            </label>
            <Textarea
              placeholder="e.g. Read about Rust ownership & completed 2 LeetCode problems."
              value={todayNotes}
              onChange={(e) => setTodayNotes(e.target.value)}
              rows={2}
              className="text-xs"
            />
          </div>

          {/* Save Log Button */}
          <Button
            onClick={onSaveDailyLog}
            disabled={savingDailyLog}
            className="w-full gap-2 rounded-xl"
          >
            <CheckCircle2 className="h-4 w-4" />
            {savingDailyLog ? 'Saving...' : 'Save Today\'s Progress'}
          </Button>
        </Card>
      </div>
    </div>
  );
}
