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
  History,
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
            <div className="relative h-44 w-full flex items-end justify-between gap-1 pt-6 pb-2 px-1">
              {/* 60m Goal Reference Line */}
              <div
                className="absolute left-0 right-0 border-b border-dashed border-border pointer-events-none z-10 flex justify-end pr-1"
                style={{ bottom: `${Math.round((60 / maxChartMinutes) * 100)}%` }}
              >
                <span className="text-[9px] font-mono text-muted-foreground -translate-y-full bg-card px-1.5 py-0.5 rounded border border-border/50">
                  Target (60m)
                </span>
              </div>

              {chartDaysData.map((item, idx) => {
                const heightPct = Math.min(100, Math.round((item.minutes / maxChartMinutes) * 100));
                const isToday = idx === chartDaysData.length - 1;
                const hasActivity = item.minutes > 0 || item.completedHabits.length > 0;

                return (
                  <div
                    key={item.date}
                    className="group relative flex-1 flex flex-col items-center h-full justify-end"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 whitespace-nowrap rounded-xl bg-popover px-3 py-2 text-xs text-popover-foreground shadow-xl border border-border">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {item.fullLabel} {isToday ? '(Today)' : ''}
                      </div>
                      <div className="text-primary font-medium mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Study: {item.minutes}m
                      </div>
                      {item.completedHabits.length > 0 && (
                        <div className="mt-1 border-t border-border/50 pt-1 text-[11px] text-muted-foreground space-y-0.5">
                          {item.completedHabits.map((title, cIdx) => (
                            <div key={cIdx} className="flex items-center gap-1">
                              <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                              <span className="truncate max-w-[160px]">{title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {item.notes && (
                        <p className="text-[10px] text-muted-foreground italic truncate max-w-[160px] mt-1">
                          "{item.notes}"
                        </p>
                      )}
                    </div>

                    {/* Value label above bar if > 0 */}
                    {item.minutes > 0 && (
                      <span className="text-[8px] font-mono font-medium text-muted-foreground mb-1">
                        {item.minutes}m
                      </span>
                    )}

                    {/* Bar Pill */}
                    <div
                      className={`w-full max-w-[20px] rounded-t-sm transition-all duration-200 ${
                        item.minutes > 0
                          ? isToday
                            ? 'bg-primary shadow-sm ring-1 ring-primary/40'
                            : 'bg-primary/75 group-hover:bg-primary'
                          : item.completedHabits.length > 0
                          ? 'bg-emerald-500/40 rounded-full h-2 w-2'
                          : 'bg-muted/40 rounded-full h-1 w-1.5'
                      }`}
                      style={{
                        height:
                          item.minutes > 0
                            ? `${Math.max(8, heightPct)}%`
                            : undefined,
                      }}
                    />

                    {/* X-axis Day Label */}
                    <span
                      className={`mt-1.5 text-[9px] font-mono select-none ${
                        isToday
                          ? 'font-bold text-primary'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {chartDaysRange === 30
                        ? idx % 3 === 0 || isToday
                          ? item.dayNum
                          : ''
                        : item.shortDay}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
              <span>{chartDaysRange} days ago</span>
              <span className="text-[11px] text-muted-foreground/80">Hover bars to view session details</span>
              <span className="font-semibold text-foreground">Today</span>
            </div>
          </div>
        </Card>

        {/* Recent Daily Logs History */}
        <Card className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-primary" /> Recent Activity History
            </h4>
            <Badge variant="outline" className="text-[10px] font-medium">
              Last 30 Days
            </Badge>
          </div>

          {unifiedLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3 text-center">
              No logged activity yet. Save your first check-in on the right!
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {unifiedLogs.slice(0, 15).map((log, idx) => {
                const habitMap = new Map<string, string>();
                unifiedHabits.forEach((h) => habitMap.set(h.id, h.title));
                const completedTitles = (log.habitsDone || [])
                  .map((hid) => habitMap.get(hid))
                  .filter(Boolean) as string[];

                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-muted/20 border border-border/50 p-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {log.date}
                        </span>
                        {log.minutesSpent > 0 && (
                          <Badge variant="secondary" className="text-[10px] font-mono gap-1">
                            <Clock className="h-3 w-3 text-primary" /> {log.minutesSpent}m
                          </Badge>
                        )}
                        {completedTitles.length > 0 && (
                          <span className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            {completedTitles.length} habit{completedTitles.length > 1 ? 's' : ''} completed
                          </span>
                        )}
                      </div>
                      {log.notes && (
                        <p className="text-muted-foreground text-xs line-clamp-2">{log.notes}</p>
                      )}
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
