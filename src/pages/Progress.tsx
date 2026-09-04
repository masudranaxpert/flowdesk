import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Bot,
  CalendarCheck,
  CalendarDays,
  Flame,
  GripVertical,
  Layers,
  Milestone,
  Plus,
  Sparkles,
  Target,
  Trash2,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { runAiChat, type AiSettings, defaultAiSettings } from '../lib/ai';
import { PageHeader, Spinner, ConfirmDialog } from '../components/UI';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { Roadmap, RoadmapPhase, DailyHabit, DailyProgressLog, RoutineItem } from '../types';

// Subcomponents
import { DailyTracker } from '../components/progress/DailyTracker';
import { RoadmapCurriculum } from '../components/progress/RoadmapCurriculum';
import { ProgressReport } from '../components/progress/ProgressReport';
import { CreateRoadmapModal } from '../components/progress/CreateRoadmapModal';
import { ImportRoadmapModal } from '../components/progress/ImportRoadmapModal';
import { presets, localDateString } from '../components/progress/presets';

const UNIFIED_HABITS_KEY = 'bookmark_unified_daily_habits';
const UNIFIED_LOGS_KEY = 'bookmark_unified_daily_logs';
const ROADMAPS_ORDER_KEY = 'bookmark_roadmaps_order';

const DEFAULT_HABITS: DailyHabit[] = [
  { id: 'h1', title: 'English speaking happens every day' },
  { id: 'h2', title: 'Daily coding & problem solving (1-2 hours)' },
];

export default function Progress() {
  const navigate = useNavigate();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});

  // Primary Section: Dedicated Daily Checker vs Learning Roadmaps
  const [mainSection, setMainSection] = useState<'tracker' | 'roadmaps'>('tracker');
  const [roadmapTab, setRoadmapTab] = useState<'curriculum' | 'report'>('curriculum');

  // Unified Daily Tracker state (independent of roadmap templates)
  const [unifiedHabits, setUnifiedHabits] = useState<DailyHabit[]>(() => {
    try {
      const saved = localStorage.getItem(UNIFIED_HABITS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_HABITS;
  });

  const [unifiedLogs, setUnifiedLogs] = useState<DailyProgressLog[]>(() => {
    try {
      const saved = localStorage.getItem(UNIFIED_LOGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // Daily log inputs for today's check-in
  const [todayMinutes, setTodayMinutes] = useState<number>(60);
  const [todayNotes, setTodayNotes] = useState<string>('');
  const [todayHabitsDone, setTodayHabitsDone] = useState<Record<string, boolean>>({});
  const [savingDailyLog, setSavingDailyLog] = useState(false);
  const [chartDaysRange, setChartDaysRange] = useState<30 | 14>(30);

  // Dialogs
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roadmapToDelete, setRoadmapToDelete] = useState<Roadmap | null>(null);

  // Add Phase dialog
  const [newPhaseOpen, setNewPhaseOpen] = useState(false);
  const [newPhaseTitle, setNewPhaseTitle] = useState('');

  // Drag & drop state for roadmap tabs
  const [draggedRoadmapIndex, setDraggedRoadmapIndex] = useState<number | null>(null);
  const [dragOverRoadmapIndex, setDragOverRoadmapIndex] = useState<number | null>(null);

  // Fetch all roadmaps from API
  const fetchRoadmaps = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.roadmaps.list();
      let items: Roadmap[] = Array.isArray(res.items) ? res.items : Array.isArray(res) ? res : [];

      // Sort roadmaps by saved user preference if available
      try {
        const savedOrder = JSON.parse(localStorage.getItem(ROADMAPS_ORDER_KEY) || '[]');
        if (Array.isArray(savedOrder) && savedOrder.length > 0) {
          const orderMap = new Map<string, number>(savedOrder.map((id, index) => [id, index]));
          items = [...items].sort((a, b) => {
            const idA = a._id || a.id || '';
            const idB = b._id || b.id || '';
            const orderA = orderMap.has(idA) ? orderMap.get(idA)! : 999;
            const orderB = orderMap.has(idB) ? orderMap.get(idB)! : 999;
            return orderA - orderB;
          });
        }
      } catch {}

      // Auto-sync Month 1 syllabus if it only had the initial 5 placeholder topics
      const rustPresetM1 = presets[0]?.phases?.[0];
      if (rustPresetM1) {
        items = items.map((r) => {
          if (r.category === 'rust' || r.title?.toLowerCase().includes('rust')) {
            const m1Index = (r.phases || []).findIndex((p) => p.id === 'm1' || p.title?.includes('Month 1'));
            if (m1Index >= 0 && (r.phases[m1Index].tasks?.length || 0) <= 5) {
              const existingTasks = r.phases[m1Index].tasks || [];
              const completedIds = new Set(existingTasks.filter((t) => t.completed).map((t) => t.id));
              const mergedTasks = rustPresetM1.tasks.map((t) => ({
                ...t,
                completed: completedIds.has(t.id),
              }));
              const nextPhases = [...r.phases];
              nextPhases[m1Index] = {
                ...nextPhases[m1Index],
                title: rustPresetM1.title,
                description: rustPresetM1.description,
                tasks: mergedTasks,
              };
              const updatedRoadmap = { ...r, phases: nextPhases };
              const rid = r._id || r.id;
              if (rid) api.roadmaps.update(rid, { phases: nextPhases }).catch(() => {});
              return updatedRoadmap;
            }
          }
          return r;
        });
      }

      setRoadmaps(items);
      if (items.length > 0) {
        setSelectedId((prev) => (items.some((r) => r._id === prev || r.id === prev) ? prev : items[0]._id || items[0].id || ''));

        // Populate unifiedLogs from existing roadmaps if cache is currently empty
        setUnifiedLogs((prevLogs) => {
          if (prevLogs.length > 0) return prevLogs;
          const map = new Map<string, DailyProgressLog>();
          items.forEach((r) => {
            (r.dailyLogs || []).forEach((l) => {
              if (l.date && !map.has(l.date)) map.set(l.date, l);
            });
          });
          const merged = Array.from(map.values());
          if (merged.length > 0) {
            try {
              localStorage.setItem(UNIFIED_LOGS_KEY, JSON.stringify(merged));
            } catch {}
            return merged;
          }
          return prevLogs;
        });
      }
    } catch {
      toast.error('Could not load roadmaps');
    } finally {
      setLoading(false);
    }
  }, []);

  // Reorder roadmap pills via drag & drop
  const handleDropRoadmap = (targetIndex: number) => {
    if (draggedRoadmapIndex === null || draggedRoadmapIndex === targetIndex) {
      setDraggedRoadmapIndex(null);
      setDragOverRoadmapIndex(null);
      return;
    }
    const updated = [...roadmaps];
    const [moved] = updated.splice(draggedRoadmapIndex, 1);
    updated.splice(targetIndex, 0, moved);
    setRoadmaps(updated);
    setDraggedRoadmapIndex(null);
    setDragOverRoadmapIndex(null);

    // Save custom order to localStorage
    try {
      const order = updated.map((r) => r._id || r.id || '');
      localStorage.setItem(ROADMAPS_ORDER_KEY, JSON.stringify(order));
    } catch {}
    toast.success('Roadmap order updated');
  };

  // Reorder daily habits via drag & drop
  const handleReorderHabits = (newHabits: DailyHabit[]) => {
    setUnifiedHabits(newHabits);
    try {
      localStorage.setItem(UNIFIED_HABITS_KEY, JSON.stringify(newHabits));
    } catch {}
    if (roadmaps.length > 0) {
      const primaryId = roadmaps[0]._id || roadmaps[0].id;
      if (primaryId) api.roadmaps.update(primaryId, { dailyHabits: newHabits }).catch(() => {});
    }
  };

  useEffect(() => {
    fetchRoadmaps();
  }, [fetchRoadmaps]);

  // Selected roadmap
  const currentRoadmap = useMemo(() => {
    return roadmaps.find((r) => (r._id || r.id) === selectedId) || roadmaps[0] || null;
  }, [roadmaps, selectedId]);

  // Expand first phase by default
  useEffect(() => {
    if (currentRoadmap?.phases?.length) {
      setExpandedPhases((prev) => {
        if (Object.keys(prev).length > 0) return prev;
        const initial: Record<string, boolean> = {};
        currentRoadmap.phases.forEach((p, idx) => {
          initial[p.id] = idx === 0;
        });
        return initial;
      });
    }
  }, [currentRoadmap]);

  // Sync today's log into check-in inputs
  useEffect(() => {
    const today = localDateString();
    const existingLog = unifiedLogs.find((l) => l.date === today);
    if (existingLog) {
      setTodayMinutes(existingLog.minutesSpent || 60);
      setTodayNotes(existingLog.notes || '');
      const habitsMap: Record<string, boolean> = {};
      (existingLog.habitsDone || []).forEach((hId) => {
        habitsMap[hId] = true;
      });
      setTodayHabitsDone(habitsMap);
    } else {
      setTodayNotes('');
      setTodayHabitsDone({});
    }
  }, [unifiedLogs]);

  // Consecutive streak for Dedicated Daily Checker
  const unifiedStreak = useMemo(() => {
    const logDates = new Set(
      unifiedLogs
        .filter((l) => l.minutesSpent > 0 || (l.habitsDone && l.habitsDone.length > 0))
        .map((l) => l.date)
    );
    let streak = 0;
    let d = new Date();
    const todayStr = localDateString(d);
    if (!logDates.has(todayStr)) {
      d.setDate(d.getDate() - 1);
    }
    while (logDates.has(localDateString(d)) && streak < 3650) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }, [unifiedLogs]);

  // Overall milestone statistics for current roadmap
  const stats = useMemo(() => {
    if (!currentRoadmap) return { totalTasks: 0, completedTasks: 0, percentage: 0 };
    const total = currentRoadmap.phases.reduce((acc, p) => acc + (p.tasks?.length || 0), 0);
    const completed = currentRoadmap.phases.reduce(
      (acc, p) => acc + (p.tasks?.filter((t) => t.completed)?.length || 0),
      0
    );
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { totalTasks: total, completedTasks: completed, percentage };
  }, [currentRoadmap]);

  // Save Today's Check-in (Dedicated Daily Checker)
  const handleSaveDailyLog = async () => {
    setSavingDailyLog(true);
    const today = localDateString();
    const habitsDone = Object.keys(todayHabitsDone).filter((k) => todayHabitsDone[k]);

    const newLog: DailyProgressLog = {
      date: today,
      minutesSpent: todayMinutes,
      habitsDone,
      notes: todayNotes.trim(),
    };

    // Auto-rolling 31-day window
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 31);
    const cutoffDateStr = localDateString(cutoffDate);

    const filtered = unifiedLogs.filter((l) => l.date !== today && l.date >= cutoffDateStr);
    const updatedLogs = [newLog, ...filtered].slice(0, 31);

    setUnifiedLogs(updatedLogs);
    try {
      localStorage.setItem(UNIFIED_LOGS_KEY, JSON.stringify(updatedLogs));
    } catch {}

    // Back up to backend if roadmap exists
    if (roadmaps.length > 0) {
      const primaryId = roadmaps[0]._id || roadmaps[0].id;
      if (primaryId) {
        api.roadmaps.update(primaryId, { dailyLogs: updatedLogs, dailyHabits: unifiedHabits }).catch(() => {});
      }
    }

    toast.success('Daily check-in saved! Keep the streak alive 🔥');
    setSavingDailyLog(false);
  };

  // Add custom habit to Dedicated Daily Checker
  const handleAddHabit = (title: string) => {
    const newHabit: DailyHabit = {
      id: `habit-${Date.now()}`,
      title,
    };
    const updated = [...unifiedHabits, newHabit];
    setUnifiedHabits(updated);
    try {
      localStorage.setItem(UNIFIED_HABITS_KEY, JSON.stringify(updated));
    } catch {}
    if (roadmaps.length > 0) {
      const primaryId = roadmaps[0]._id || roadmaps[0].id;
      if (primaryId) api.roadmaps.update(primaryId, { dailyHabits: updated }).catch(() => {});
    }
    toast.success('Habit added to Daily Checker');
  };

  // Remove habit from Dedicated Daily Checker
  const handleDeleteHabit = (habitId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = unifiedHabits.filter((h) => h.id !== habitId);
    setUnifiedHabits(updated);
    try {
      localStorage.setItem(UNIFIED_HABITS_KEY, JSON.stringify(updated));
    } catch {}
    if (roadmaps.length > 0) {
      const primaryId = roadmaps[0]._id || roadmaps[0].id;
      if (primaryId) api.roadmaps.update(primaryId, { dailyHabits: updated }).catch(() => {});
    }
    toast.success('Habit removed');
  };

  // Import subjects from Routine into Dedicated Daily Checker
  const handleImportFromRoutine = async () => {
    try {
      const res = await api.routines.list();
      const items: RoutineItem[] = Array.isArray(res) ? res : [];
      if (items.length === 0) {
        toast.error('No routines found to import');
        return;
      }
      const existingTitles = new Set(unifiedHabits.map((h) => h.title.toLowerCase().trim()));
      const newHabitsToAdd: DailyHabit[] = [];
      items.forEach((item) => {
        const title = item.subject || item.title;
        if (title && !existingTitles.has(title.toLowerCase().trim())) {
          existingTitles.add(title.toLowerCase().trim());
          newHabitsToAdd.push({
            id: `routine-${item._id || Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            title: `Study ${title} (Routine)`,
          });
        }
      });
      if (newHabitsToAdd.length === 0) {
        toast('All routine subjects already in Daily Checker');
        return;
      }
      const updated = [...unifiedHabits, ...newHabitsToAdd];
      setUnifiedHabits(updated);
      try {
        localStorage.setItem(UNIFIED_HABITS_KEY, JSON.stringify(updated));
      } catch {}
      if (roadmaps.length > 0) {
        const primaryId = roadmaps[0]._id || roadmaps[0].id;
        if (primaryId) api.roadmaps.update(primaryId, { dailyHabits: updated }).catch(() => {});
      }
      toast.success(`Imported ${newHabitsToAdd.length} tasks from Routine!`);
    } catch {
      toast.error('Could not sync from Routine');
    }
  };

  // Toggle task completion
  const handleToggleTask = async (phaseId: string, taskId: string) => {
    if (!currentRoadmap) return;
    const updatedPhases = currentRoadmap.phases.map((phase) => {
      if (phase.id !== phaseId) return phase;
      return {
        ...phase,
        tasks: phase.tasks.map((task) => {
          if (task.id !== taskId) return task;
          const nextCompleted = !task.completed;
          return {
            ...task,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : undefined,
          };
        }),
      };
    });

    const nextRoadmap = { ...currentRoadmap, phases: updatedPhases };
    setRoadmaps((prev) => prev.map((r) => ((r._id || r.id) === (currentRoadmap._id || currentRoadmap.id) ? nextRoadmap : r)));

    try {
      const id = currentRoadmap._id || currentRoadmap.id;
      await api.roadmaps.update(id!, { phases: updatedPhases });
      toast.success('Progress updated', { duration: 1500 });
    } catch {
      toast.error('Failed to sync progress');
      fetchRoadmaps();
    }
  };

  // Add task to phase
  const handleAddTask = async (phaseId: string, title: string) => {
    if (!currentRoadmap) return;
    const newTask = { id: `task-${Date.now()}`, title, completed: false };
    const updatedPhases = currentRoadmap.phases.map((phase) => {
      if (phase.id !== phaseId) return phase;
      return { ...phase, tasks: [...(phase.tasks || []), newTask] };
    });
    const nextRoadmap = { ...currentRoadmap, phases: updatedPhases };
    setRoadmaps((prev) => prev.map((r) => ((r._id || r.id) === (currentRoadmap._id || currentRoadmap.id) ? nextRoadmap : r)));
    try {
      const id = currentRoadmap._id || currentRoadmap.id;
      await api.roadmaps.update(id!, { phases: updatedPhases });
      toast.success('Task added');
    } catch {
      toast.error('Failed to add task');
    }
  };

  // Delete task from phase
  const handleDeleteTask = async (phaseId: string, taskId: string) => {
    if (!currentRoadmap) return;
    const updatedPhases = currentRoadmap.phases.map((phase) => {
      if (phase.id !== phaseId) return phase;
      return { ...phase, tasks: phase.tasks.filter((t) => t.id !== taskId) };
    });
    const nextRoadmap = { ...currentRoadmap, phases: updatedPhases };
    setRoadmaps((prev) => prev.map((r) => ((r._id || r.id) === (currentRoadmap._id || currentRoadmap.id) ? nextRoadmap : r)));
    try {
      const id = currentRoadmap._id || currentRoadmap.id;
      await api.roadmaps.update(id!, { phases: updatedPhases });
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  // Add new phase to roadmap
  const handleAddPhase = async () => {
    if (!newPhaseTitle.trim() || !currentRoadmap) return;
    const newPhase: RoadmapPhase = {
      id: `phase-${Date.now()}`,
      title: newPhaseTitle.trim(),
      description: '',
      targetMonth: (currentRoadmap.phases?.length || 0) + 1,
      tasks: [],
    };
    const updatedPhases = [...(currentRoadmap.phases || []), newPhase];
    const nextRoadmap = { ...currentRoadmap, phases: updatedPhases };
    setRoadmaps((prev) => prev.map((r) => ((r._id || r.id) === (currentRoadmap._id || currentRoadmap.id) ? nextRoadmap : r)));
    setNewPhaseTitle('');
    setNewPhaseOpen(false);
    try {
      const id = currentRoadmap._id || currentRoadmap.id;
      await api.roadmaps.update(id!, { phases: updatedPhases });
      toast.success('Phase added');
    } catch {
      toast.error('Failed to add phase');
    }
  };

  // Delete phase
  const handleDeletePhase = async (phaseId: string) => {
    if (!currentRoadmap) return;
    const updatedPhases = currentRoadmap.phases.filter((p) => p.id !== phaseId);
    const nextRoadmap = { ...currentRoadmap, phases: updatedPhases };
    setRoadmaps((prev) => prev.map((r) => ((r._id || r.id) === (currentRoadmap._id || currentRoadmap.id) ? nextRoadmap : r)));
    try {
      const id = currentRoadmap._id || currentRoadmap.id;
      await api.roadmaps.update(id!, { phases: updatedPhases });
      toast.success('Phase deleted');
    } catch {
      toast.error('Failed to delete phase');
    }
  };

  // Toggle expand / collapse
  const allExpanded = useMemo(() => {
    if (!currentRoadmap?.phases?.length) return false;
    return currentRoadmap.phases.every((p) => expandedPhases[p.id] !== false);
  }, [currentRoadmap, expandedPhases]);

  const handleToggleExpandAll = () => {
    if (!currentRoadmap?.phases?.length) return;
    const nextState = !allExpanded;
    const updated: Record<string, boolean> = {};
    currentRoadmap.phases.forEach((p) => {
      updated[p.id] = nextState;
    });
    setExpandedPhases(updated);
  };

  const handleTogglePhaseExpand = (phaseId: string) => {
    setExpandedPhases((prev) => ({
      ...prev,
      [phaseId]: prev[phaseId] === false ? true : false,
    }));
  };

  // Export roadmap as Markdown
  const handleExportMarkdown = () => {
    if (!currentRoadmap) return;
    let md = `# ${currentRoadmap.title}\n\n`;
    if (currentRoadmap.description) md += `${currentRoadmap.description}\n\n`;
    md += `**Duration:** ${currentRoadmap.duration} | **Status:** ${currentRoadmap.status}\n\n`;
    (currentRoadmap.phases || []).forEach((p, idx) => {
      md += `## Phase ${idx + 1}: ${p.title}\n`;
      if (p.description) md += `*${p.description}*\n`;
      (p.tasks || []).forEach((t) => {
        md += `- [${t.completed ? 'x' : ' '}] ${t.title}\n`;
      });
      md += '\n';
    });
    navigator.clipboard.writeText(md);
    toast.success('Roadmap copied to clipboard as Markdown!');
  };

  // Copy full text report
  const handleCopyFullReport = () => {
    if (!currentRoadmap) return;
    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    let report = `PROGRESS REPORT: ${currentRoadmap.title.toUpperCase()}\nGenerated: ${today}\n\n`;
    report += `Overall Progress: ${stats.percentage}%\n`;
    report += `Milestones Completed: ${stats.completedTasks} of ${stats.totalTasks}\n\n`;
    currentRoadmap.phases.forEach((p, idx) => {
      const comp = p.tasks.filter((t) => t.completed).length;
      report += `[#${idx + 1}] ${p.title}: ${comp}/${p.tasks.length} tasks completed\n`;
    });
    navigator.clipboard.writeText(report);
    toast.success('Progress report copied to clipboard!');
  };

  // Import curriculum phases into active roadmap
  const handleImportToCurrent = async (importedPhases: RoadmapPhase[], mode: 'append' | 'replace') => {
    if (!currentRoadmap) return;
    try {
      let updatedPhases: RoadmapPhase[];
      if (mode === 'append') {
        const startingMonth = (currentRoadmap.phases?.length || 0) + 1;
        const adjusted = importedPhases.map((p, idx) => ({
          ...p,
          id: `phase-${Date.now()}-${idx}`,
          targetMonth: (p.targetMonth || idx + 1) + startingMonth - 1,
        }));
        updatedPhases = [...(currentRoadmap.phases || []), ...adjusted];
      } else {
        updatedPhases = importedPhases;
      }

      const id = currentRoadmap._id || currentRoadmap.id;
      await api.roadmaps.update(id!, { phases: updatedPhases });
      const nextRoadmap = { ...currentRoadmap, phases: updatedPhases };
      setRoadmaps((prev) =>
        prev.map((r) => ((r._id || r.id) === id ? nextRoadmap : r))
      );
      toast.success(
        mode === 'append'
          ? `Appended ${importedPhases.length} phase(s) to "${currentRoadmap.title}"!`
          : `Curriculum updated for "${currentRoadmap.title}"!`
      );
    } catch {
      toast.error('Failed to import curriculum');
    }
  };

  // Import as a brand new roadmap
  const handleImportAsNewRoadmap = async (data: {
    title: string;
    description: string;
    duration: string;
    phases: RoadmapPhase[];
  }) => {
    try {
      setLoading(true);
      const payload: Partial<Roadmap> = {
        title: data.title,
        description: data.description,
        category: 'imported',
        duration: data.duration,
        status: 'active',
        dailyHabits: [],
        phases: data.phases,
        dailyLogs: [],
      };
      const created = await api.roadmaps.create(payload);
      toast.success(`Created roadmap "${data.title}"!`);
      await fetchRoadmaps();
      setSelectedId(created._id || created.id || '');
      setMainSection('roadmaps');
      setRoadmapTab('curriculum');
    } catch {
      toast.error('Failed to create imported roadmap');
      setLoading(false);
    }
  };

  // Preset Application
  const handleApplyPreset = async (preset: (typeof presets)[0]) => {
    try {
      setLoading(true);
      const created = await api.roadmaps.create(preset);
      toast.success(`Created "${preset.title}"!`);
      setCreateModalOpen(false);
      await fetchRoadmaps();
      setSelectedId(created._id || created.id || '');
      setMainSection('roadmaps');
    } catch {
      toast.error('Could not create preset roadmap');
      setLoading(false);
    }
  };

  // AI Roadmap Generation
  const handleGenerateAi = async (prompt: string) => {
    if (!prompt.trim()) return;
    try {
      const aiSettingsData = await api.aiSettings.get().catch(() => defaultAiSettings as AiSettings);
      const systemInstruction = `You are a learning curriculum planner.
Return a STRICT valid JSON object (no markdown, no backticks) with this structure:
{
  "title": "Title of the roadmap",
  "description": "Short summary",
  "category": "subject slug (e.g. rust, python)",
  "duration": "e.g. 12 Months or 30 Days",
  "phases": [
    {
      "id": "p1",
      "title": "Phase/Month 1: ...",
      "description": "...",
      "targetMonth": 1,
      "tasks": [{"id": "t1-1", "title": "...", "completed": false}]
    }
  ]
}`;
      const responseText = await runAiChat(
        aiSettingsData,
        [{ role: 'user', content: prompt }],
        systemInstruction,
        []
      );

      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      parsed.dailyHabits = [];
      parsed.dailyLogs = [];
      parsed.status = 'active';

      const created = await api.roadmaps.create(parsed);
      toast.success(`AI Roadmap "${parsed.title}" created successfully!`);
      setCreateModalOpen(false);
      await fetchRoadmaps();
      setSelectedId(created._id || created.id || '');
      setMainSection('roadmaps');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'AI generation failed');
      throw error;
    }
  };

  // Manual Roadmap Creation
  const handleCreateManual = async (title: string, duration: string) => {
    if (!title.trim()) return;
    try {
      const payload: Partial<Roadmap> = {
        title: title.trim(),
        description: 'Personal study roadmap',
        category: 'general',
        duration,
        status: 'active',
        dailyHabits: [],
        phases: [
          {
            id: 'm1',
            title: 'Phase 1: Getting Started',
            description: 'Core fundamentals',
            targetMonth: 1,
            tasks: [{ id: 't1-1', title: 'Initial setup & orientation', completed: false }],
          },
        ],
        dailyLogs: [],
      };
      const created = await api.roadmaps.create(payload);
      toast.success('Roadmap created!');
      setCreateModalOpen(false);
      await fetchRoadmaps();
      setSelectedId(created._id || created.id || '');
      setMainSection('roadmaps');
    } catch {
      toast.error('Could not create roadmap');
    }
  };

  // Delete Roadmap
  const handleDeleteRoadmap = async () => {
    if (!roadmapToDelete) return;
    try {
      const id = roadmapToDelete._id || roadmapToDelete.id;
      await api.roadmaps.delete(id!);
      toast.success('Roadmap deleted');
      setDeleteConfirmOpen(false);
      setRoadmapToDelete(null);
      await fetchRoadmaps();
    } catch {
      toast.error('Failed to delete roadmap');
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <PageHeader
        eyebrow="Progress & Mastery"
        title="Learning Progress & Roadmaps"
        description="Unified daily consistency tracking, habit accountability, and multi-month curriculum milestones."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              localStorage.setItem('chatbot-pending-prompt', 'আমাকে একটি নতুন লার্নিং রোডম্যাপ ও প্রগ্রেস শিট বানিয়ে দাও।');
              navigate('/chatbot');
            }}
            className="gap-2"
          >
            <Bot className="h-4 w-4 text-primary" />
            Ask AI Chatbot
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportModalOpen(true)}
            className="gap-2"
          >
            <Upload className="h-4 w-4 text-primary" />
            Import Roadmap
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Roadmap
          </Button>
        </div>
      </PageHeader>

      {/* Primary Section Switcher */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3 flex-wrap gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-2xl bg-muted/50 p-1.5 border border-border/60">
          <button
            type="button"
            onClick={() => setMainSection('tracker')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              mainSection === 'tracker'
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <CalendarCheck className="h-4 w-4 text-primary" />
            Daily Checker
            {unifiedStreak > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-500">
                <Flame className="h-3 w-3" />
                {unifiedStreak}d
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMainSection('roadmaps')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              mainSection === 'roadmaps'
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Layers className="h-4 w-4 text-primary" />
            Learning Roadmaps ({roadmaps.length})
          </button>
        </div>
      </div>

      {/* SECTION 1: Dedicated Daily Checker */}
      {mainSection === 'tracker' && (
        <DailyTracker
          unifiedHabits={unifiedHabits}
          unifiedLogs={unifiedLogs}
          unifiedStreak={unifiedStreak}
          todayMinutes={todayMinutes}
          setTodayMinutes={setTodayMinutes}
          todayNotes={todayNotes}
          setTodayNotes={setTodayNotes}
          todayHabitsDone={todayHabitsDone}
          setTodayHabitsDone={setTodayHabitsDone}
          savingDailyLog={savingDailyLog}
          onSaveDailyLog={handleSaveDailyLog}
          onAddHabit={handleAddHabit}
          onDeleteHabit={handleDeleteHabit}
          onReorderHabits={handleReorderHabits}
          onImportFromRoutine={handleImportFromRoutine}
          chartDaysRange={chartDaysRange}
          setChartDaysRange={setChartDaysRange}
        />
      )}

      {/* SECTION 2: Learning Roadmaps & Curricula */}
      {mainSection === 'roadmaps' && (
        <div className="space-y-6 animate-fade-in">
          {loading && roadmaps.length === 0 ? (
            <Spinner />
          ) : roadmaps.length === 0 ? (
            /* Empty State */
            <Card className="rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Milestone className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold tracking-tight">No active roadmaps yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Start tracking your long-term goals. Add the pre-configured 12-Month Rust or 30-Day Pandas roadmap, or let AI generate one.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button onClick={() => handleApplyPreset(presets[0])} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Load 12-Month Rust Roadmap
                </Button>
                <Button variant="outline" onClick={() => setCreateModalOpen(true)}>
                  View Presets & AI Options
                </Button>
              </div>
            </Card>
          ) : (
            <>
              {/* Roadmap Switcher Pills */}
              <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {roadmaps.map((item, idx) => {
                    const id = item._id || item.id || '';
                    const isSelected = id === selectedId;
                    const isDragging = draggedRoadmapIndex === idx;
                    const isDragOver = dragOverRoadmapIndex === idx;

                    return (
                      <div
                        key={id}
                        draggable
                        onDragStart={(e) => {
                          setDraggedRoadmapIndex(idx);
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', String(idx));
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          if (dragOverRoadmapIndex !== idx) setDragOverRoadmapIndex(idx);
                        }}
                        onDragLeave={() => {
                          if (dragOverRoadmapIndex === idx) setDragOverRoadmapIndex(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleDropRoadmap(idx);
                        }}
                        onDragEnd={() => {
                          setDraggedRoadmapIndex(null);
                          setDragOverRoadmapIndex(null);
                        }}
                        onClick={() => setSelectedId(id)}
                        className={`group flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-medium transition-all select-none cursor-grab active:cursor-grabbing ${
                          isSelected
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-card border border-border text-muted-foreground hover:bg-accent/70 hover:text-foreground'
                        } ${isDragging ? 'opacity-40 scale-95' : ''} ${
                          isDragOver ? 'ring-2 ring-primary border-primary scale-105 shadow-lg' : ''
                        }`}
                        title="Drag and drop to change position, click to select"
                      >
                        <GripVertical className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100 shrink-0 transition-opacity" />
                        <Target className="h-4 w-4 shrink-0" />
                        <span className="max-w-[180px] truncate">{item.title}</span>
                        <Badge
                          variant={isSelected ? 'secondary' : 'outline'}
                          className="ml-1 text-[10px] px-1.5 py-0"
                        >
                          {item.duration || 'Track'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>

                {currentRoadmap && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer"
                    onClick={() => {
                      setRoadmapToDelete(currentRoadmap);
                      setDeleteConfirmOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {currentRoadmap && (
                <div className="space-y-6">
                  {/* Hero Overall Progress Card */}
                  <Card className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-sm">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary/15 text-primary border-primary/20">
                            {currentRoadmap.status.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{currentRoadmap.duration}</span>
                        </div>
                        <h3 className="text-2xl font-bold tracking-tight">{currentRoadmap.title}</h3>
                        {currentRoadmap.description && (
                          <p className="max-w-md text-sm text-muted-foreground">{currentRoadmap.description}</p>
                        )}
                      </div>

                      {/* Large Percentage Display */}
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="grid h-24 w-24 place-items-center rounded-3xl border-2 border-primary/30 bg-primary/10 text-primary shadow-inner">
                          <div className="text-center">
                            <span className="text-3xl font-extrabold tracking-tight">{stats.percentage}%</span>
                            <span className="block text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Done</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & Sub Metrics */}
                    <div className="mt-6 space-y-2">
                      <div className="h-3 w-full overflow-hidden rounded-full bg-muted/60">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${stats.percentage}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                        <span>{stats.completedTasks} of {stats.totalTasks} milestones completed</span>
                        <span>{currentRoadmap.phases?.length || 0} curriculum phases</span>
                      </div>
                    </div>
                  </Card>

                  {/* Roadmap Sub-tabs (No daily check-in clutter!) */}
                  <div className="flex items-center gap-2.5 border-b border-border/60 pb-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setRoadmapTab('curriculum')}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                        roadmapTab === 'curriculum'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      }`}
                    >
                      <Layers className="h-4 w-4" />
                      Milestones & Curriculum ({currentRoadmap.phases?.length || 0})
                    </button>

                    <button
                      type="button"
                      onClick={() => setRoadmapTab('report')}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                        roadmapTab === 'report'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      }`}
                    >
                      <BarChart3 className="h-4 w-4" />
                      Progress Charts & Report
                    </button>
                  </div>

                  {/* Sub-tab 1: Milestones & Curriculum */}
                  {roadmapTab === 'curriculum' && (
                    <RoadmapCurriculum
                      roadmap={currentRoadmap}
                      expandedPhases={expandedPhases}
                      onTogglePhaseExpand={handleTogglePhaseExpand}
                      onToggleExpandAll={handleToggleExpandAll}
                      allExpanded={allExpanded}
                      onToggleTask={handleToggleTask}
                      onAddTask={handleAddTask}
                      onDeleteTask={handleDeleteTask}
                      onDeletePhase={handleDeletePhase}
                      onOpenNewPhaseModal={() => setNewPhaseOpen(true)}
                      onExportMarkdown={handleExportMarkdown}
                      onOpenImportModal={() => setImportModalOpen(true)}
                    />
                  )}

                  {/* Sub-tab 2: Progress Charts & Full Report */}
                  {roadmapTab === 'report' && (
                    <ProgressReport
                      roadmap={currentRoadmap}
                      onCopyFullReport={handleCopyFullReport}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Modal Dialogs */}
      <CreateRoadmapModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onApplyPreset={handleApplyPreset}
        onGenerateAi={handleGenerateAi}
        onCreateManual={handleCreateManual}
      />

      <ImportRoadmapModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        currentRoadmap={currentRoadmap}
        onImportToCurrent={handleImportToCurrent}
        onImportAsNewRoadmap={handleImportAsNewRoadmap}
      />

      {/* Add Phase Dialog */}
      <Dialog open={newPhaseOpen} onOpenChange={setNewPhaseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Milestone / Phase</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input
              placeholder="e.g. Month 13: Performance Optimization"
              value={newPhaseTitle}
              onChange={(e) => setNewPhaseTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddPhase();
              }}
              className="text-xs"
            />
            <Button onClick={handleAddPhase} className="w-full">
              Add Phase
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Roadmap"
        description={`Are you sure you want to delete "${roadmapToDelete?.title}"? This cannot be undone.`}
        onConfirm={handleDeleteRoadmap}
      />
    </div>
  );
}
