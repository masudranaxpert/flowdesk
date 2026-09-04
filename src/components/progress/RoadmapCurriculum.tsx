import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Layers,
  Plus,
  Search,
  Share2,
  Trash2,
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
        <h4 className="text-base font-semibold tracking-tight flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          Milestones & Curriculum ({roadmap.phases?.length || 0} Phases)
        </h4>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative min-w-[160px] sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Filter topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-7 text-xs rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleExpandAll}
            className="h-8 text-xs rounded-xl"
          >
            {allExpanded ? 'Collapse' : 'Expand'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExportMarkdown}
            className="h-8 text-xs rounded-xl gap-1.5"
            title="Copy roadmap as Markdown"
          >
            <Share2 className="h-3.5 w-3.5" /> Export
          </Button>
          <Button
            size="sm"
            onClick={onOpenNewPhaseModal}
            className="h-8 text-xs rounded-xl gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Phase
          </Button>
        </div>
      </div>

      {/* Accordion Phases */}
      <div className="space-y-3">
        {filteredPhases.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center text-xs text-muted-foreground">
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
                  className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePhaseExpand(phase.id);
                      }}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {phase.targetMonth && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            Month {phase.targetMonth}
                          </Badge>
                        )}
                        <h4
                          className={`text-sm font-semibold tracking-tight truncate ${
                            isFullyDone ? 'line-through text-muted-foreground' : ''
                          }`}
                        >
                          {phase.title}
                        </h4>
                      </div>
                      {phase.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {phase.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-3 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-xs font-mono font-medium text-muted-foreground">
                      {phaseCompleted}/{phaseTotal} ({phasePct}%)
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeletePhase(phase.id)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10 transition-colors"
                      title="Delete phase"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Task Checklist Items */}
                {isExpanded && (
                  <div className="border-t border-border/60 bg-muted/20 p-4 space-y-2.5 animate-fade-in">
                    {(phase.tasks || []).length === 0 ? (
                      <p className="text-xs text-muted-foreground italic py-2">
                        No tasks in this milestone yet. Add one below.
                      </p>
                    ) : (
                      phase.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="group flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-3 transition-colors hover:border-primary/40 hover:bg-accent/40"
                        >
                          <div
                            onClick={() => onToggleTask(phase.id, task.id)}
                            className="flex cursor-pointer items-center gap-3 flex-1 min-w-0"
                          >
                            <div
                              className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors ${
                                task.completed
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-muted-foreground/40'
                              }`}
                            >
                              {task.completed && <CheckCircle2 className="h-3.5 w-3.5" />}
                            </div>
                            <span
                              className={`text-xs leading-relaxed select-none ${
                                task.completed
                                  ? 'text-muted-foreground line-through'
                                  : 'text-foreground'
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => onDeleteTask(phase.id, task.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10 transition-all shrink-0"
                            title="Delete task"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
                        className="h-9 text-xs"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleAddTaskSubmit(phase.id)}
                        className="h-9 shrink-0 gap-1 text-xs"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add
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
