import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock, Download, MapPin, Plus, RotateCcw, Trash2, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { PageHeader, FormField, Spinner } from '../components/UI';
import { Select } from '../components/Select';
import type { RoutineItem } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2);
  const minutes = index % 2 === 0 ? '00' : '30';
  const value = `${String(hours).padStart(2, '0')}:${minutes}`;
  const hour12 = hours % 12 || 12;
  return { value, label: `${hour12}:${minutes} ${hours < 12 ? 'AM' : 'PM'}` };
});

type RoutineForm = {
  type: 'class' | 'event';
  title: string;
  subject: string;
  teacher: string;
  room: string;
  dayOfWeek: number;
  date: string;
  startTime: string;
  endTime: string;
  breakTime: string;
  repeatWeekly: boolean;
  notes: string;
};

const emptyForm: RoutineForm = {
  type: 'class',
  title: '',
  subject: '',
  teacher: '',
  room: '',
  dayOfWeek: new Date().getDay(),
  date: '',
  startTime: '',
  endTime: '',
  breakTime: '',
  repeatWeekly: true,
  notes: '',
};

function statusFor(item: RoutineItem, currentTime: string) {
  if (currentTime > item.endTime) return { label: 'Finished', className: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25' };
  if (currentTime >= item.startTime && currentTime <= item.endTime) return { label: 'Now', className: 'bg-primary/15 text-primary border-primary/25' };
  return { label: 'Upcoming', className: 'bg-blue-500/12 text-blue-300 border-blue-500/25' };
}

function timeLabel(item: RoutineItem) {
  return `${item.startTime || '--:--'} - ${item.endTime || '--:--'}`;
}

function weekDateLabels(todayIndex: number) {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - todayIndex);
  return days.map((_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  });
}

export default function RoutinePage() {
  const [items, setItems] = useState<RoutineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<RoutineForm>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);

  const todayIndex = new Date().getDay();
  const todayDate = localDateString();
  const [currentTime, setCurrentTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const dateLabels = useMemo(() => weekDateLabels(todayIndex), [todayIndex]);
  const dayOptions = days.map((day, index) => ({ value: String(index), label: day }));
  const isEvent = form.type === 'event';

  const load = useCallback(() => {
    setLoading(true);
    api.routines.list().then(setItems).catch(() => toast.error('Failed to load routine')).finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  useEffect(() => {
    const t = setInterval(() => {
      setCurrentTime(new Date().toTimeString().slice(0, 5));
    }, 30000);
    return () => clearInterval(t);
  }, []);

  const grouped = useMemo(() => days.map((day, index) => ({
    day,
    items: items.filter((item) => item.repeatWeekly && item.dayOfWeek === index).sort((a, b) => a.startTime.localeCompare(b.startTime)),
  })), [items]);

  const todayItems = useMemo(
    () => items
      .filter((item) => (item.repeatWeekly && item.dayOfWeek === todayIndex) || (!item.repeatWeekly && item.date === todayDate))
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [items, todayIndex, todayDate]
  );

  const upcomingEvents = useMemo(
    () => items.filter((item) => !item.repeatWeekly && item.date && item.date >= todayDate).sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)),
    [items, todayDate]
  );

  const setType = (type: 'class' | 'event') => {
    setForm((current) => ({
      ...current,
      type,
      repeatWeekly: type === 'class',
      date: type === 'event' ? (current.date || localDateString()) : '',
      teacher: type === 'event' ? '' : current.teacher,
      breakTime: type === 'event' ? '' : current.breakTime,
    }));
  };

  const save = async () => {
    if (!form.title.trim() || !form.startTime || !form.endTime) return toast.error('Title, start and end time are required');
    if (form.type === 'event' && !form.date) return toast.error('Event date is required');
    const payload = {
      ...form,
      repeatWeekly: form.type === 'class',
      date: form.type === 'event' ? form.date : '',
      subject: form.type === 'class' ? (form.subject || form.title) : '',
      teacher: form.type === 'class' ? form.teacher : '',
      breakTime: form.type === 'class' ? form.breakTime : '',
    };
    try {
      await api.routines.create(payload);
      toast.success(form.type === 'event' ? 'Event saved' : 'Class routine saved');
      setForm({ ...emptyForm, dayOfWeek: todayIndex });
      setFormOpen(false);
      load();
    } catch {
      toast.error('Failed to save routine item');
    }
  };

  const remove = async (id: string) => {
    try {
      await api.routines.delete(id);
      toast.success('Deleted');
      load();
    } catch {
      toast.error('Failed to delete routine item');
    }
  };

  const reset = async () => {
    try {
      await api.routines.reset('all');
      toast.success('Routine reset');
      load();
    } catch {
      toast.error('Failed to reset routine');
    }
  };

  const exportToIcs = () => {
    if (items.length === 0) return toast.error('No routine items to export');

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//BookmarkVault//Routine Calendar//EN',
      'CALSCALE:GREGORIAN'
    ];

    const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const byDayCodes = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

    items.forEach((item) => {
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${item._id || Math.random().toString(36).substring(2)}@bookmarkvault`);
      lines.push(`DTSTAMP:${nowStr}`);
      lines.push(`SUMMARY:${item.title}`);
      
      const descParts = [];
      if (item.subject) descParts.push(`Subject: ${item.subject}`);
      if (item.teacher) descParts.push(`Teacher: ${item.teacher}`);
      if (item.notes) descParts.push(`Notes: ${item.notes}`);
      lines.push(`DESCRIPTION:${descParts.join('\\n')}`);
      
      if (item.room) lines.push(`LOCATION:Room ${item.room}`);

      const startTimeClean = (item.startTime || '09:00').replace(':', '') + '00';
      const endTimeClean = (item.endTime || '10:00').replace(':', '') + '00';

      if (item.repeatWeekly) {
        const today = new Date();
        const currentDay = today.getDay();
        const targetDay = item.dayOfWeek;
        const daysDiff = (targetDay - currentDay + 7) % 7;
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + daysDiff);
        
        const y = targetDate.getFullYear();
        const m = String(targetDate.getMonth() + 1).padStart(2, '0');
        const d = String(targetDate.getDate()).padStart(2, '0');
        const dateStr = `${y}${m}${d}`;
        lines.push(`DTSTART:${dateStr}T${startTimeClean}`);
        lines.push(`DTEND:${dateStr}T${endTimeClean}`);
        lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${byDayCodes[item.dayOfWeek]}`);
      } else {
        let dateStr = '';
        if (item.date) {
          dateStr = item.date.replace(/-/g, '');
        } else {
          const fallbackDate = new Date();
          const y = fallbackDate.getFullYear();
          const m = String(fallbackDate.getMonth() + 1).padStart(2, '0');
          const d = String(fallbackDate.getDate()).padStart(2, '0');
          dateStr = `${y}${m}${d}`;
        }
        lines.push(`DTSTART:${dateStr}T${startTimeClean}`);
        lines.push(`DTEND:${dateStr}T${endTimeClean}`);
      }

      lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');

    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'study_routine.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Routine exported to study_routine.ics');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Class Routine" eyebrow="Planner" description="Weekly classes and one-time events in a clean schedule view.">
        <Button className="xl:hidden" onClick={() => setFormOpen((value) => !value)}>
          <Plus className="h-4 w-4" /> {formOpen ? 'Close' : 'Add'}
        </Button>
        <Button variant="outline" onClick={exportToIcs}>
          <Download className="h-4 w-4" /> Export Calendar
        </Button>
        <Button variant="outline" onClick={reset}>
          <RotateCcw className="h-4 w-4" /> Reset
        </Button>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[24rem_1fr]">
        <Card className={`rounded-3xl border-primary/15 ${formOpen ? 'block' : 'hidden xl:block'}`}>
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Add class or event</p>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-muted/25 p-1">
              <Button type="button" variant={!isEvent ? 'secondary' : 'ghost'} className="h-10 rounded-xl" onClick={() => setType('class')}>
                Weekly class
              </Button>
              <Button type="button" variant={isEvent ? 'secondary' : 'ghost'} className="h-10 rounded-xl" onClick={() => setType('event')}>
                Event
              </Button>
            </div>

            <FormField label={isEvent ? 'Event title' : 'Title / Subject'}>
              <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value, subject: isEvent ? '' : event.target.value })} placeholder={isEvent ? 'Research meetup, exam, reminder...' : 'Algorithms Lab, Physics class...'} />
            </FormField>

            <div className="grid gap-3 sm:grid-cols-2">
              {isEvent ? (
                <FormField label="Event date">
                  <Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value, repeatWeekly: false })} />
                </FormField>
              ) : (
                <FormField label="Day">
                  <Select value={String(form.dayOfWeek)} onChange={(day) => setForm({ ...form, dayOfWeek: Number(day), repeatWeekly: true, date: '' })} options={dayOptions} />
                </FormField>
              )}
              <FormField label="Start">
                <Select value={form.startTime} onChange={(startTime) => setForm({ ...form, startTime })} options={timeOptions} placeholder="Start time" />
              </FormField>
              <FormField label="End">
                <Select value={form.endTime} onChange={(endTime) => setForm({ ...form, endTime })} options={timeOptions} placeholder="End time" />
              </FormField>
            </div>

            {isEvent ? (
              <>
                <FormField label="Location optional">
                  <Input value={form.room} onChange={(event) => setForm({ ...form, room: event.target.value })} placeholder="Auditorium, online, library..." />
                </FormField>
                <FormField label="Notes optional">
                  <Input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Short event note" />
                </FormField>
              </>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="Class room">
                    <Input value={form.room} onChange={(event) => setForm({ ...form, room: event.target.value })} placeholder="G1-003" />
                  </FormField>
                  <FormField label="Break time">
                    <Input value={form.breakTime} onChange={(event) => setForm({ ...form, breakTime: event.target.value })} placeholder="10 min" />
                  </FormField>
                </div>
                <FormField label="Teacher name optional">
                  <Input value={form.teacher} onChange={(event) => setForm({ ...form, teacher: event.target.value })} placeholder="Teacher name" />
                </FormField>
              </>
            )}
            <Button onClick={save} className="w-full">
              <Plus className="h-4 w-4" /> {isEvent ? 'Save event' : 'Save routine'}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {loading ? <Spinner /> : (
            <>
              <Card className="rounded-3xl border-primary/25 bg-card/95">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">Today&apos;s schedule</p>
                    <Badge variant="secondary" className="ml-auto rounded-full">{days[todayIndex]} - {dateLabels[todayIndex]}</Badge>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {todayItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No class or event today.</p>
                    ) : todayItems.map((item) => {
                      const state = statusFor(item, currentTime);
                      return (
                        <div key={item._id} className="rounded-2xl border border-border bg-muted/30 p-3">
                          <div className="flex items-center gap-2">
                            <p className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight">{item.title}</p>
                            <Badge variant="outline" className="h-7 rounded-full px-3 text-xs font-semibold">{item.type === 'event' ? 'Event' : 'Class'}</Badge>
                            <Badge variant="outline" className={`h-7 rounded-full px-3 text-xs font-semibold ${state.className}`}>{state.label}</Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <Badge variant="secondary" className="h-7 rounded-full bg-primary/12 px-3 text-sm font-semibold text-primary"><Clock className="h-3.5 w-3.5" /> {timeLabel(item)}</Badge>
                            {item.room && <Badge variant="secondary" className="h-7 rounded-full bg-sky-500/15 px-3 text-sm font-semibold text-sky-300"><MapPin className="h-3.5 w-3.5" /> {item.type === 'event' ? item.room : `Room ${item.room}`}</Badge>}
                            {item.breakTime && <Badge variant="secondary" className="h-7 rounded-full bg-amber-500/15 px-3 text-xs font-semibold text-amber-300">Break {item.breakTime}</Badge>}
                            {item.teacher && <Badge variant="secondary" className="h-7 rounded-full bg-violet-500/15 px-3 text-xs font-semibold text-violet-300"><UserRound className="h-3 w-3" /> {item.teacher}</Badge>}
                            {item.notes && <Badge variant="secondary" className="h-7 rounded-full bg-muted px-3 text-xs font-semibold text-muted-foreground">{item.notes}</Badge>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                {grouped.map((group) => (
                  <Card key={group.day} className="rounded-3xl">
                    <CardContent className="grid gap-3 p-4 lg:grid-cols-[12rem_1fr] lg:items-start">
                      <div className="flex items-center justify-between gap-3 lg:block">
                        <div>
                          <p className="text-lg font-semibold tracking-tight">{group.day}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{dateLabels[days.indexOf(group.day)]}</p>
                        </div>
                        <Badge variant={group.items.length ? 'secondary' : 'outline'} className="h-7 rounded-full px-3 text-sm font-semibold">
                          {group.items.length} class{group.items.length === 1 ? '' : 'es'}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {group.items.length === 0 ? <p className="rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">No class</p> : group.items.map((item) => (
                          <div key={item._id} className="rounded-2xl border border-border bg-muted/30 p-3">
                            <div className="flex items-start gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-base font-semibold tracking-tight sm:text-lg">{item.title}</p>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  <Badge variant="secondary" className="h-7 rounded-full bg-primary/12 px-3 text-sm font-semibold text-primary">{timeLabel(item)}</Badge>
                                  {item.room && <Badge variant="secondary" className="h-7 rounded-full bg-sky-500/15 px-3 text-sm font-semibold text-sky-300">Room {item.room}</Badge>}
                                  {item.breakTime && <Badge variant="secondary" className="h-7 rounded-full bg-amber-500/15 px-3 text-xs font-semibold text-amber-300">Break {item.breakTime}</Badge>}
                                  {item.teacher && <Badge variant="secondary" className="h-7 rounded-full bg-violet-500/15 px-3 text-xs font-semibold text-violet-300">{item.teacher}</Badge>}
                                </div>
                              </div>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(item._id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="rounded-3xl">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold">Upcoming events</p>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {upcomingEvents.length === 0 ? <p className="text-sm text-muted-foreground">No upcoming events.</p> : upcomingEvents.map((item) => (
                      <div key={item._id} className="flex items-start gap-3 rounded-2xl border border-border bg-muted/30 p-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.date} - {timeLabel(item)}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {item.room && <Badge variant="secondary" className="h-6 rounded-full bg-sky-500/15 px-2 text-xs font-semibold text-sky-300"><MapPin className="h-3 w-3" /> {item.room}</Badge>}
                            {item.notes && <Badge variant="secondary" className="h-6 rounded-full bg-muted px-2 text-xs font-semibold text-muted-foreground">{item.notes}</Badge>}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(item._id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
