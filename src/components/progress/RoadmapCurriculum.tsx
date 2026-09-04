import React, { useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Layers,
  Plus,
  Search,
  Share2,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Roadmap } from '../../types';

interface RoadmapCurriculumProps {
  roadmap: Roadmap;
  expandedPhases: Record<string, boolean>;
  onTogglePhaseExpand: (phaseId: string) => void;
  onToggleExpandAll: () => void;
  allExpanded: boolean;
  onToggleTask: (phaseId: string, taskId: string) => Promise<void>;
  onAddTask: (phaseId: string, title: string) => Promise<void>;
  onDeleteTask: (phaseId: string, taskId: string) => Promise<void>;
  onDeletePhase: (phaseId: string) => Promise<void>;
  onOpenNewPhaseModal: () => void;
  onExportMarkdown: () => void;
  onOpenImportModal: () => void;
}

export function RoadmapCurriculum({
  roadmap,
  expandedPhases,
  onTogglePhaseExpand,
  onToggleExpandAll,
  allExpanded,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onDeletePhase,
  onOpenNewPhaseModal,
  onExportMarkdown,
  onOpenImportModal,
}: RoadmapCurriculumProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [newTaskTitles, setNewTaskTitles] = useState<Record<string, string>>({});

  // Filter phases & tasks based on search keyword
  const filteredPhases = useMemo(() => {
    if (!roadmap?.phases) return [];
    if (!searchQuery.trim()) return roadmap.phases;
    const query = searchQuery.toLowerCase();
    return roadmap.phases
      .map((phase) => {
        const matchesPhase =
          phase.title.toLowerCase().includes(query) ||
          (phase.description && phase.description.toLowerCase().includes(query));
        const matchingTasks = (phase.tasks || []).filter((task) =>
          task.title.toLowerCase().includes(query)
        );
        if (matchesPhase || matchingTasks.length > 0) {
          return {
            ...phase,
            tasks: matchesPhase ? phase.tasks : matchingTasks,
          };
        }
        return null;
      })
      .filter(Boolean) as typeof roadmap.phases;
  }, [roadmap?.phases, searchQuery]);

  const handleAddTaskSubmit = (phaseId: string) => {
    const title = (newTaskTitles[phaseId] || '').trim();
    if (!title) return;
    onAddTask(phaseId, title);
    setNewTaskTitles((prev) => ({ ...prev, [phaseId]: '' }));
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <h4 className="text-base sm:text-lg font-semibold tracking-tight flex items-center gap-2">
          <Layers className="h-4.5 w-4.5 text-primary" />
          Milestones & Curriculum ({roadmap.phases?.length || 0} Phases)
        </h4>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative min-w-[160px] sm:w-52">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 pr-7 text-xs sm:text-sm rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleExpandAll}
            className="h-9 text-xs sm:text-sm px-3 rounded-xl"
          >
            {allExpanded ? 'Collapse' : 'Expand'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExportMarkdown}
            className="h-9 text-xs sm:text-sm px-3 rounded-xl gap-1.5 cursor-pointer"
            title="Copy roadmap as Markdown"
          >
            <Share2 className="h-4 w-4" /> Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenImportModal}
            className="h-9 text-xs sm:text-sm px-3 rounded-xl gap-1.5 cursor-pointer"
            title="Import curriculum or milestones (Markdown / JSON)"
          >
            <Upload className="h-4 w-4" /> Import
          </Button>
          <Button
            size="sm"
            onClick={onOpenNewPhaseModal}
            className="h-9 text-xs sm:text-sm px-3 rounded-xl gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Phase
          </Button>
        </div>
      </div>

      {/* Accordion Phases */}
      <div className="space-y-3">
        {filteredPhases.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
            No milestones match "{searchQuery}". Try a different keyword.
          </div>
        ) : (
          filteredPhases.map((phase) => {
            const isExpanded = expandedPhases[phase.id] !== false;
            const phaseCompleted = (phase.tasks || []).filter((t) => t.completed).length;
            const phaseTotal = (phase.tasks || []).length;
            const phasePct = phaseTotal > 0 ? Math.round((phaseCompleted / phaseTotal) * 100) : 0;
            const isFullyDone = phaseTotal > 0 && phaseCompleted === phaseTotal;

            return (
              <Card
                key={phase.id}
                className={`overflow-hidden rounded-3xl border transition-all ${
                  isFullyDone ? 'border-emerald-500/30 bg-card/60' : 'border-border bg-card'
                }`}
              >
                {/* Phase Header */}
                <div
                  onClick={() => onTogglePhaseExpand(phase.id)}
                  className="flex cursor-pointer items-center justify-between p-4 sm:p-4.5 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground p-0.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePhaseExpand(phase.id);
                      }}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4.5 w-4.5" />
                      ) : (
                        <ChevronRight className="h-4.5 w-4.5" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {phase.targetMonth && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5">
                            Month {phase.targetMonth}
                          </Badge>
                        )}
                        <h4
                          className={`roadmap-task-text text-sm sm:text-base font-medium tracking-normal truncate ${
                            isFullyDone ? 'line-through text-muted-foreground' : ''
                          }`}
                        >
                          {phase.title}
                        </h4>
                      </div>
                      {phase.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground/80 line-clamp-1 mt-0.5 tracking-normal font-normal">
                          {phase.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-3 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-xs sm:text-sm font-mono font-medium text-muted-foreground">
                      {phaseCompleted}/{phaseTotal} ({phasePct}%)
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeletePhase(phase.id)}
                      className="text-muted-foreground hover:text-destructive p-1.5 rounded hover:bg-destructive/10 transition-colors"
                      title="Delete phase"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Task Checklist Items */}
                {isExpanded && (
                  <div className="border-t border-border/60 bg-muted/20 p-4 sm:p-5 space-y-2.5 sm:space-y-3 animate-fade-in">
                    {(phase.tasks || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground italic py-2">
                        No tasks in this milestone yet. Add one below.
                      </p>
                    ) : (
                      phase.tasks.map((task) => (
                        <div
                          key={task.id}
                          className={`group flex items-center justify-between gap-3 sm:gap-4 rounded-xl border p-3 sm:py-3.5 sm:px-4 transition-colors ${
                            task.completed
                              ? 'border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/10'
                              : 'border-border/60 bg-card hover:border-primary/40 hover:bg-accent/40'
                          }`}
                        >
                          <div
                            onClick={() => onToggleTask(phase.id, task.id)}
                            className="flex cursor-pointer items-center gap-3 sm:gap-3.5 flex-1 min-w-0"
                          >
                            <div
                              className={`grid h-5.5 w-5.5 sm:h-6 sm:w-6 shrink-0 place-items-center rounded-lg border transition-colors ${
                                task.completed
                                  ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                                  : 'border-muted-foreground/40 hover:border-primary'
                              }`}
                            >
                              {task.completed && <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[2.5]" />}
                            </div>
                            <span
                              className={`roadmap-task-text text-sm sm:text-[15px] leading-relaxed tracking-wide select-none ${
                                task.completed
                                  ? 'text-muted-foreground/60 line-through font-normal'
                                  : 'text-foreground/90 font-normal'
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => onDeleteTask(phase.id, task.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1.5 rounded hover:bg-destructive/10 transition-all shrink-0"
                            title="Delete task"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}

                    {/* Add Task Input */}
                    <div className="flex items-center gap-2 pt-2">
                      <Input
                        placeholder="Add specific task / topic..."
                        value={newTaskTitles[phase.id] || ''}
                        onChange={(e) =>
                          setNewTaskTitles((prev) => ({ ...prev, [phase.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddTaskSubmit(phase.id);
                        }}
                        className="h-10 text-sm"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleAddTaskSubmit(phase.id)}
                        className="h-10 shrink-0 gap-1.5 text-sm px-4 font-medium"
                      >
                        <Plus className="h-4 w-4" /> Add
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
