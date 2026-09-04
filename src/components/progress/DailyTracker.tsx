import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Calendar,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  GripVertical,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { DailyHabit, DailyProgressLog } from '../../types';
import { localDateString } from './presets';

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
  onReorderHabits?: (newHabits: DailyHabit[]) => void;
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
  onReorderHabits,
  onImportFromRoutine,
  chartDaysRange,
  setChartDaysRange,
}: DailyTrackerProps) {
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [draggedHabitIndex, setDraggedHabitIndex] = useState<number | null>(null);
  const [dragOverHabitIndex, setDragOverHabitIndex] = useState<number | null>(null);
  const [selectedDayDate, setSelectedDayDate] = useState<string>(() => localDateString());

  const handleDropHabit = (targetIndex: number) => {
    if (draggedHabitIndex === null || draggedHabitIndex === targetIndex || !onReorderHabits) {
      setDraggedHabitIndex(null);
      setDragOverHabitIndex(null);
      return;
    }
    const updated = [...unifiedHabits];
    const [moved] = updated.splice(draggedHabitIndex, 1);
    updated.splice(targetIndex, 0, moved);
    onReorderHabits(updated);
    setDraggedHabitIndex(null);
    setDragOverHabitIndex(null);
  };

  // Daily study consistency data over 14 or 30 days
  const chartDaysData = useMemo(() => {
    const result = [];
    const logsMap = new Map<string, DailyProgressLog>();
    unifiedLogs.forEach((log) => {
      if (log.date) logsMap.set(log.date, log);
    });

    const habitMap = new Map<string, string>();
    unifiedHabits.forEach((h) => {
      habitMap.set(h.id, h.title);
    });

    for (let i = chartDaysRange - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = localDateString(d);
      const log = logsMap.get(dateStr);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthShort = d.toLocaleDateString('en-US', { month: 'short' });

      const completedHabitTitles = (log?.habitsDone || [])
        .map((hid) => habitMap.get(hid))
        .filter(Boolean) as string[];

      result.push({
        date: dateStr,
        dayLabel: `${dayName} ${dayNum}`,
        fullLabel: `${monthShort} ${dayNum} (${dayName})`,
        dayNum,
        shortDay: dayName.slice(0, 3),
        minutes: log?.minutesSpent || 0,
        completedHabits: completedHabitTitles,
        notes: log?.notes || '',
        isToday: i === 0,
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
    return logged.length > 0
      ? Math.round(logged.reduce((acc, d) => acc + d.minutes, 0) / logged.length)
      : 0;
  }, [chartDaysData]);

  const selectedDayData = useMemo(() => {
    return (
      chartDaysData.find((d) => d.date === selectedDayDate) ||
      chartDaysData[chartDaysData.length - 1]
    );
  }, [chartDaysData, selectedDayDate]);

  const handleAddSubmit = () => {
    if (!newHabitTitle.trim()) return;
    onAddHabit(newHabitTitle.trim());
    setNewHabitTitle('');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3 animate-fade-in">
      {/* Left 2 Cols: Consistency Chart & Recent Activity History */}
      <div className="space-y-6 lg:col-span-2">
        {/* Consistency & Study Hours Chart */}
        <Card className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold tracking-tight">Study Consistency</h3>
                <Badge variant="outline" className="text-[10px] font-medium">
                  Last {chartDaysRange} Days
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Daily study session duration and completed habits
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Range Toggle */}
              <div className="flex items-center rounded-xl bg-muted/60 p-0.5 border border-border/60">
                <button
                  type="button"
                  onClick={() => setChartDaysRange(30)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                    chartDaysRange === 30
                      ? 'bg-card text-foreground shadow-sm font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  30 Days
                </button>
                <button
                  type="button"
                  onClick={() => setChartDaysRange(14)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                    chartDaysRange === 14
                      ? 'bg-card text-foreground shadow-sm font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  14 Days
                </button>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-xl border border-border/50">
                <Clock className="h-3 w-3 text-primary" />
                <span>Avg: {avgMinutes}m / session</span>
              </div>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="space-y-3">
            <div className="relative w-full pt-4">
              {/* 60m Goal Reference Line */}
              <div
                className="absolute left-0 right-0 border-b border-dashed border-border/70 pointer-events-none z-10 flex justify-end pr-1"
                style={{
                  bottom: `calc(24px + ${(Math.min(100, Math.round((60 / maxChartMinutes) * 100)) / 100) * 128}px)`,
                }}
              >
                <span className="text-[9px] font-mono text-muted-foreground -translate-y-full bg-card px-1.5 py-0.5 rounded border border-border/50">
                  Target (60m)
                </span>
              </div>

              {/* Bar Columns Container */}
              <div className="relative flex items-end justify-between gap-1 px-1">
                {chartDaysData.map((item, idx) => {
                  const heightPct = Math.min(100, Math.round((item.minutes / maxChartMinutes) * 100));
                  const isToday = idx === chartDaysData.length - 1;
                  const isSelected = item.date === (selectedDayData?.date || selectedDayDate);
                  const isFarRight = idx >= chartDaysData.length - 5;
                  const isFarLeft = idx < 4;
                  const tooltipAlignClass = isFarRight
                    ? 'right-0'
                    : isFarLeft
                    ? 'left-0'
                    : 'left-1/2 -translate-x-1/2';

                  return (
                    <div
                      key={item.date}
                      onClick={() => setSelectedDayDate(item.date)}
                      className="group relative flex-1 flex flex-col items-center cursor-pointer select-none"
                    >
                      {/* Tooltip on hover */}
                      <div
                        className={`absolute bottom-[calc(100%+8px)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-40 w-max max-w-[260px] sm:max-w-[290px] rounded-2xl bg-popover p-3 text-xs text-popover-foreground shadow-2xl border border-border ${tooltipAlignClass}`}
                      >
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{item.fullLabel}</span>
                          {isToday && (
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                              Today
                            </span>
                          )}
                        </div>
                        <div className="text-primary font-semibold mt-1 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Study: {item.minutes}m</span>
                        </div>
                        {item.completedHabits.length > 0 && (
                          <div className="mt-2 border-t border-border/60 pt-1.5 space-y-1">
                            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                              Completed Habits ({item.completedHabits.length})
                            </div>
                            {item.completedHabits.map((title, cIdx) => (
                              <div key={cIdx} className="flex items-start gap-1.5 text-[11px] text-foreground">
                                <Check className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                                <span className="leading-snug break-words">{title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {item.notes && (
                          <div className="mt-2 border-t border-border/60 pt-1.5">
                            <p className="text-[10px] text-muted-foreground italic leading-relaxed break-words">
                              "{item.notes}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* 1. Value label above bar (fixed height h-5, never overlaps bar) */}
                      <div className="h-5 flex items-end justify-center w-full pb-0.5">
                        {item.minutes > 0 && (
                          <span
                            className={`text-[9px] font-mono leading-none transition-colors ${
                              isSelected ? 'font-bold text-primary' : 'font-medium text-muted-foreground'
                            }`}
                          >
                            {item.minutes}m
                          </span>
                        )}
                      </div>

                      {/* 2. Bar Track (fixed height h-32 = 128px, bar strictly grows inside) */}
                      <div className="h-32 w-full flex items-end justify-center px-0.5 relative">
                        <div
                          className={`w-full max-w-[18px] sm:max-w-[22px] rounded-t-sm transition-all duration-150 ${
                            isSelected
                              ? 'bg-primary ring-2 ring-primary/90 ring-offset-1 ring-offset-background shadow-md'
                              : item.minutes > 0
                              ? isToday
                                ? 'bg-primary/90 shadow-sm ring-1 ring-primary/40'
                                : 'bg-primary/75 group-hover:bg-primary'
                              : item.completedHabits.length > 0
                              ? 'bg-emerald-500/40 group-hover:bg-emerald-500/70 rounded-full h-2 w-2'
                              : 'bg-muted/40 group-hover:bg-muted/70 rounded-full h-1.5 w-1.5'
                          }`}
                          style={{
                            height:
                              item.minutes > 0
                                ? `${Math.max(6, heightPct)}%`
                                : undefined,
                          }}
                        />
                      </div>

                      {/* 3. X-axis Day Label (fixed height h-6, border-t separator) */}
                      <div className="h-6 w-full flex items-center justify-center border-t border-border/40 pt-1">
                        <span
                          className={`text-[9px] sm:text-[10px] font-mono select-none transition-colors ${
                            isSelected
                              ? 'font-bold text-primary underline underline-offset-2'
                              : isToday
                              ? 'font-bold text-foreground'
                              : 'text-muted-foreground group-hover:text-foreground'
                          }`}
                        >
                          {chartDaysRange === 30
                            ? idx % 3 === 0 || isToday || isSelected
                              ? item.dayNum
                              : ''
                            : item.shortDay}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
              <span>{chartDaysRange} days ago</span>
              <span className="text-[11px] text-muted-foreground font-medium">Click any day bar to view full details below</span>
              <span className="font-semibold text-foreground">Today</span>
            </div>
          </div>

          {/* Selected Day Details Panel */}
          <div className="border-t border-border/60 pt-5 space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/25 border border-border/50 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-foreground tracking-tight">
                      {selectedDayData.fullLabel}
                    </h4>
                    {selectedDayData.date === localDateString() && (
                      <Badge variant="secondary" className="text-[10px] font-semibold bg-primary/15 text-primary border-primary/20">
                        Today
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {selectedDayData.date}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 text-xs font-semibold">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{selectedDayData.minutes > 0 ? `${selectedDayData.minutes}m Studied` : '0m Studied'}</span>
                </div>
                {selectedDayData.completedHabits.length > 0 && (
                  <div className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1.5 text-xs font-semibold">
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>{selectedDayData.completedHabits.length} Habit{selectedDayData.completedHabits.length > 1 ? 's' : ''} Done</span>
                  </div>
                )}
              </div>
            </div>

            {/* Completed Habits for Selected Day */}
            {selectedDayData.completedHabits.length > 0 ? (
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Completed Habits on this Day
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {selectedDayData.completedHabits.map((habitTitle, hIdx) => (
                    <div
                      key={hIdx}
                      className="flex items-center gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-2.5 text-xs text-foreground"
                    >
                      <div className="grid h-5 w-5 place-items-center rounded-md bg-emerald-500 text-white shrink-0">
                        <Check className="h-3 w-3 stroke-[2.5]" />
                      </div>
                      <span className="font-medium leading-relaxed">{habitTitle}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : selectedDayData.minutes === 0 && !selectedDayData.notes ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 p-4 text-center text-xs text-muted-foreground">
                No study activity recorded on {selectedDayData.fullLabel}. Click any other bar above to inspect that day.
              </div>
            ) : null}

            {/* Reflection / Notes for Selected Day */}
            {selectedDayData.notes && (
              <div className="space-y-1.5 rounded-2xl bg-muted/20 border border-border/50 p-4 text-xs">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Notes & Reflection
                </label>
                <p className="text-muted-foreground text-xs leading-relaxed italic">
                  "{selectedDayData.notes}"
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Right 1 Col: Streak & Today's Check-in */}
      <div className="space-y-6">
        {/* Streak Card */}
        <Card className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold tracking-tight">Active Streak</h4>
                <p className="text-xs text-muted-foreground">Keep studying daily</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-amber-500">{unifiedStreak}</span>
              <span className="text-[11px] text-muted-foreground block font-medium">Days</span>
            </div>
          </div>
        </Card>

        {/* Today's Daily Habit & Study Log Card */}
        <Card className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold tracking-tight">Today's Check-in</h4>
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          {/* Daily Habits Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Daily Habits
              </label>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={onImportFromRoutine}
                className="h-6 text-xs text-primary hover:text-primary/90 gap-1 px-2 cursor-pointer"
                title="Sync subjects from Routine page"
              >
                <RefreshCw className="h-3 w-3" /> Sync Routine
              </Button>
            </div>

            {unifiedHabits.length === 0 ? (
              <p className="text-xs text-muted-foreground italic bg-muted/20 p-3 rounded-xl border border-dashed border-border/60 text-center">
                No habits yet. Add one below or sync from Routine.
              </p>
            ) : (
              <div className="space-y-2">
                {unifiedHabits.map((habit, idx) => {
                  const isDone = Boolean(todayHabitsDone[habit.id]);
                  const isDragging = draggedHabitIndex === idx;
                  const isDragOver = dragOverHabitIndex === idx;

                  return (
                    <div
                      key={habit.id}
                      draggable={Boolean(onReorderHabits)}
                      onDragStart={(e) => {
                        setDraggedHabitIndex(idx);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverHabitIndex !== idx) setDragOverHabitIndex(idx);
                      }}
                      onDragLeave={() => {
                        if (dragOverHabitIndex === idx) setDragOverHabitIndex(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDropHabit(idx);
                      }}
                      onDragEnd={() => {
                        setDraggedHabitIndex(null);
                        setDragOverHabitIndex(null);
                      }}
                      className={`group flex items-center justify-between gap-2.5 rounded-xl border p-2.5 transition-all select-none ${
                        isDone
                          ? 'border-emerald-500/30 bg-emerald-500/5 text-foreground'
                          : 'border-border/60 bg-muted/30 hover:bg-muted/50 text-muted-foreground'
                      } ${isDragging ? 'opacity-40 scale-95' : ''} ${
                        isDragOver ? 'ring-2 ring-primary border-primary scale-[1.02]' : ''
                      }`}
                    >
                      <div
                        className="cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors shrink-0"
                        title="Drag to reorder habit"
                      >
                        <GripVertical className="h-3.5 w-3.5" />
                      </div>

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
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-muted-foreground/40 group-hover:border-primary'
                          }`}
                        >
                          {isDone && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                        </div>
                        <span
                          className={`text-xs font-medium leading-relaxed truncate ${
                            isDone ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}
                        >
                          {habit.title}
                        </span>
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

            {/* Add Habit input */}
            <div className="flex gap-2 pt-1">
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
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddSubmit}
                className="h-8 text-xs rounded-xl px-3 gap-1 shrink-0"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
          </div>

          {/* Study Time Logger */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Today's Study Time
              </label>
              <span className="text-xs font-bold text-primary">{todayMinutes} Minutes</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[30, 45, 60, 120].map((mins) => (
                <Button
                  key={mins}
                  type="button"
                  variant={todayMinutes === mins ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTodayMinutes(mins)}
                  className="h-8 text-xs font-medium rounded-xl cursor-pointer"
                >
                  {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                </Button>
              ))}
            </div>
          </div>

          {/* Notes / Reflection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Notes / What did you learn?
            </label>
            <Textarea
              placeholder="e.g. Read about Rust ownership & completed 2 LeetCode problems."
              value={todayNotes}
              onChange={(e) => setTodayNotes(e.target.value)}
              rows={2}
              className="text-xs rounded-xl"
            />
          </div>

          {/* Save Daily Progress */}
          <Button
            onClick={onSaveDailyLog}
            disabled={savingDailyLog}
            className="w-full gap-2 rounded-xl cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" />
            {savingDailyLog ? 'Saving...' : "Save Today's Check-in"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
