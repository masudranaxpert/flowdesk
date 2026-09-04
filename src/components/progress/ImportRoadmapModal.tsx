import React, { useState, useMemo, useRef } from 'react';
import {
  AlertCircle,
  FileCode,
  Layers,
  ListChecks,
  Plus,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { Roadmap, RoadmapPhase, RoadmapTask } from '../../types';

export interface ParsedRoadmapData {
  title?: string;
  description?: string;
  duration?: string;
  phases: RoadmapPhase[];
}

// Sample Markdown template for quick testing and demonstration
const SAMPLE_MARKDOWN = `# Python Full-Stack Roadmap
From beginner syntax to production web applications.

**Duration:** 6 Months

## Phase 1: Python Core & Algorithms
*Variables, control flow, functions, OOP, and data structures*
- [x] Python installation and environment setup
- [ ] Data structures: lists, dicts, sets, tuples
- [ ] Object-Oriented Programming (Classes & Inheritance)
- [ ] Error handling with try/except blocks

## Phase 2: Web Frameworks (FastAPI & Django)
*Building REST APIs and full-featured web applications*
- [ ] FastAPI routing, Pydantic models & dependency injection
- [ ] Relational databases: PostgreSQL & SQLAlchemy ORM
- [ ] User authentication with JWT tokens
- [ ] Asynchronous task processing with Celery`;

// Smart parser for Markdown, raw text, or JSON formats
export function parseRoadmapContent(raw: string): ParsedRoadmapData {
  const content = raw.trim();
  if (!content) {
    return { phases: [] };
  }

  // 1. Check for JSON format
  if (content.startsWith('{') || content.startsWith('[')) {
    try {
      const parsed = JSON.parse(content);
      return parseJsonRoadmap(parsed);
    } catch {
      // Fall through to markdown parser if JSON parsing fails
    }
  }

  // 2. Parse Markdown / Text
  return parseMarkdownRoadmap(content);
}

function parseJsonRoadmap(data: any): ParsedRoadmapData {
  const title = typeof data.title === 'string' ? data.title.trim() : undefined;
  const description = typeof data.description === 'string' ? data.description.trim() : undefined;
  const duration = typeof data.duration === 'string' ? data.duration.trim() : '12 Months';
  let rawPhases: any[] = [];

  if (Array.isArray(data)) {
    rawPhases = data;
  } else if (Array.isArray(data.phases)) {
    rawPhases = data.phases;
  } else if (Array.isArray(data.tasks)) {
    rawPhases = [{ title: title || 'Phase 1: Imported Topics', tasks: data.tasks }];
  }

  const phases: RoadmapPhase[] = rawPhases.map((phase: any, pIdx: number) => {
    const pTitle = typeof phase === 'string' ? phase : (phase.title || `Phase ${pIdx + 1}`);
    const pDesc = typeof phase.description === 'string' ? phase.description : '';
    const pMonth = typeof phase.targetMonth === 'number' ? phase.targetMonth : pIdx + 1;
    const rawTasks = Array.isArray(phase.tasks) ? phase.tasks : [];

    const tasks: RoadmapTask[] = rawTasks.map((task: any, tIdx: number) => {
      if (typeof task === 'string') {
        return {
          id: `task-${Date.now()}-${pIdx}-${tIdx}`,
          title: task.trim(),
          completed: false,
        };
      }
      return {
        id: task.id || `task-${Date.now()}-${pIdx}-${tIdx}`,
        title: (task.title || `Task ${tIdx + 1}`).trim(),
        completed: Boolean(task.completed),
        completedAt: task.completedAt,
        notes: task.notes,
      };
    });

    return {
      id: phase.id || `phase-${Date.now()}-${pIdx}`,
      title: pTitle,
      description: pDesc,
      targetMonth: pMonth,
      tasks,
    };
  });

  return { title, description, duration, phases };
}

function parseMarkdownRoadmap(content: string): ParsedRoadmapData {
  const lines = content.split(/\r?\n/);
  let title: string | undefined;
  let description: string | undefined;
  let duration: string | undefined;
  const phases: RoadmapPhase[] = [];
  let currentPhase: RoadmapPhase | null = null;
  let phaseIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (!line) continue;

    // Skip horizontal rules and code fence delimiters
    if (/^(?:---+|\*\*\*+|```.*)$/.test(line)) continue;

    // Check for main roadmap title (# Title)
    const h1Match = line.match(/^#\s+(.+)$/);
    if (h1Match && !title) {
      title = h1Match[1].replace(/^\*\*|\*\*$/g, '').trim();
      continue;
    }

    // Check for duration metadata (**Duration:** ...)
    const durMatch = line.match(/Duration:\*\*?\s*([^\s|*]+(?:\s+[^\s|*]+)?)/i);
    if (durMatch && !duration) {
      duration = durMatch[1].trim();
    }

    // Check for phase headings (##, ###, or "Phase X: ...", "Month X: ...")
    const isPhaseHeading =
      /^#{2,4}\s+/.test(line) ||
      /^(?:\*{1,2})?(?:Phase|Month|Stage|Step|Module|Part|Section)\s*\d*[:.-]\s*/i.test(line);

    if (isPhaseHeading) {
      const headingText = line
        .replace(/^#{2,4}\s+/, '')
        .replace(/^\*\*|\*\*$/g, '')
        .trim();

      currentPhase = {
        id: `phase-${Date.now()}-${++phaseIndex}`,
        title: headingText,
        description: '',
        targetMonth: phaseIndex,
        tasks: [],
      };
      phases.push(currentPhase);
      continue;
    }

    // Check for task checklists: "- [ ]", "- [x]", "* [ ]", etc.
    const checkMatch = line.match(/^[-*+]\s*\[([ xX])\]\s*(.+)$/);
    if (checkMatch) {
      if (!currentPhase) {
        currentPhase = {
          id: `phase-${Date.now()}-${++phaseIndex}`,
          title: 'Phase 1: Curriculum Overview',
          description: '',
          targetMonth: phaseIndex,
          tasks: [],
        };
        phases.push(currentPhase);
      }
      currentPhase.tasks.push({
        id: `task-${Date.now()}-${currentPhase.tasks.length + 1}-${Math.random().toString(36).slice(2, 5)}`,
        title: checkMatch[2].trim(),
        completed: checkMatch[1].toLowerCase() === 'x',
      });
      continue;
    }

    // Check for standard bullet points: "- Task", "* Task", "+ Task"
    const bulletMatch = line.match(/^[-*+]\s+(.+)$/);
    if (bulletMatch) {
      if (!currentPhase) {
        currentPhase = {
          id: `phase-${Date.now()}-${++phaseIndex}`,
          title: 'Phase 1: Curriculum Overview',
          description: '',
          targetMonth: phaseIndex,
          tasks: [],
        };
        phases.push(currentPhase);
      }
      currentPhase.tasks.push({
        id: `task-${Date.now()}-${currentPhase.tasks.length + 1}-${Math.random().toString(36).slice(2, 5)}`,
        title: bulletMatch[1].trim(),
        completed: false,
      });
      continue;
    }

    // Check for numbered list items: "1. Task", "2) Task"
    const numMatch = line.match(/^\d+[.)]\s+(.+)$/);
    if (numMatch) {
      if (!currentPhase) {
        currentPhase = {
          id: `phase-${Date.now()}-${++phaseIndex}`,
          title: 'Phase 1: Curriculum Overview',
          description: '',
          targetMonth: phaseIndex,
          tasks: [],
        };
        phases.push(currentPhase);
      }
      currentPhase.tasks.push({
        id: `task-${Date.now()}-${currentPhase.tasks.length + 1}-${Math.random().toString(36).slice(2, 5)}`,
        title: numMatch[1].trim(),
        completed: false,
      });
      continue;
    }

    // If we have a current phase with 0 tasks, line could be phase description
    if (currentPhase && currentPhase.tasks.length === 0 && !currentPhase.description) {
      currentPhase.description = line.replace(/^\*|\*$|^_|_$/g, '').trim();
      continue;
    }

    // If roadmap title exists but no description yet and no phases, treat as roadmap description
    if (title && !description && !currentPhase) {
      description = line;
    }
  }

  // Fallback: If no phases were detected but there are raw lines, create a phase from lines
  if (phases.length === 0 && lines.some((l) => l.trim())) {
    const validLines = lines.map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
    if (validLines.length > 0) {
      phases.push({
        id: `phase-${Date.now()}-1`,
        title: title || 'Phase 1: Imported Topics',
        description: description || '',
        targetMonth: 1,
        tasks: validLines.map((l, idx) => ({
          id: `task-${Date.now()}-${idx}`,
          title: l,
          completed: false,
        })),
      });
    }
  }

  return { title, description, duration, phases };
}

interface ImportRoadmapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRoadmap?: Roadmap | null;
  onImportToCurrent: (phases: RoadmapPhase[], mode: 'append' | 'replace') => Promise<void>;
  onImportAsNewRoadmap: (roadmap: {
    title: string;
    description: string;
    duration: string;
    phases: RoadmapPhase[];
  }) => Promise<void>;
}

export function ImportRoadmapModal({
  open,
  onOpenChange,
  currentRoadmap,
  onImportToCurrent,
  onImportAsNewRoadmap,
}: ImportRoadmapModalProps) {
  const [inputText, setInputText] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'replace' | 'new'>(
    currentRoadmap ? 'append' : 'new'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live parsed roadmap data
  const parsedData = useMemo(() => {
    return parseRoadmapContent(inputText);
  }, [inputText]);

  const totalTasks = useMemo(() => {
    return parsedData.phases.reduce((acc, p) => acc + (p.tasks?.length || 0), 0);
  }, [parsedData.phases]);

  // Handle file upload (.md, .json, .txt)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setInputText(result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Submit the import action
  const handleSubmit = async () => {
    if (parsedData.phases.length === 0 || totalTasks === 0) return;

    setIsSubmitting(true);
    try {
      if (importMode === 'new' || !currentRoadmap) {
        await onImportAsNewRoadmap({
          title: parsedData.title || (currentRoadmap?.title ? `${currentRoadmap.title} (Imported)` : 'Imported Roadmap'),
          description: parsedData.description || 'Imported curriculum and milestones',
          duration: parsedData.duration || `${parsedData.phases.length || 1} Months`,
          phases: parsedData.phases,
        });
      } else {
        await onImportToCurrent(parsedData.phases, importMode);
      }
      setInputText('');
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-7 rounded-3xl border border-border bg-card shadow-2xl">
        <DialogHeader className="space-y-1.5 pb-2">
          <DialogTitle className="flex items-center gap-2.5 text-base sm:text-lg font-semibold">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <Upload className="h-4.5 w-4.5" />
            </div>
            <span>Import Roadmap Curriculum</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Paste Markdown, raw text, or JSON. You can also upload a <code>.md</code> or <code>.json</code> file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Action Toolbar above Textarea */}
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown,.json,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 text-xs rounded-xl gap-1.5 cursor-pointer"
              >
                <FileCode className="h-3.5 w-3.5" /> Upload File (.md / .json)
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setInputText(SAMPLE_MARKDOWN)}
                className="h-8 text-xs rounded-xl gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Load Sample
              </Button>
            </div>

            {inputText && (
              <button
                type="button"
                onClick={() => setInputText('')}
                className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 cursor-pointer transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>

          {/* Textarea Input */}
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`# Paste your roadmap here...\n\n## Phase 1: Topic Name\n- [ ] Task item 1\n- [x] Task item 2\n\n## Phase 2: Next Topic\n- [ ] Task item 3`}
            className="min-h-[170px] max-h-[260px] font-mono text-xs sm:text-sm rounded-2xl border-border/80 bg-muted/20 focus:bg-card p-3 leading-relaxed"
          />

          {/* Live Parser Detection Bar */}
          {inputText.trim() && (
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-3.5 space-y-2.5 animate-fade-in">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">Detected Curriculum</span>
                  {parsedData.title && (
                    <Badge variant="outline" className="text-[10px] font-mono max-w-[200px] truncate">
                      {parsedData.title}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <Badge
                    variant={parsedData.phases.length > 0 ? 'secondary' : 'outline'}
                    className="text-[11px] font-medium"
                  >
                    {parsedData.phases.length} {parsedData.phases.length === 1 ? 'Phase' : 'Phases'}
                  </Badge>
                  <Badge
                    variant={totalTasks > 0 ? 'secondary' : 'outline'}
                    className="text-[11px] font-medium"
                  >
                    {totalTasks} {totalTasks === 1 ? 'Milestone' : 'Milestones'}
                  </Badge>
                </div>
              </div>

              {/* Preview list of detected phases */}
              {parsedData.phases.length > 0 ? (
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 pt-1">
                  {parsedData.phases.map((p, pIdx) => (
                    <div
                      key={pIdx}
                      className="rounded-xl border border-border/50 bg-card/60 px-3 py-2 text-xs flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-muted-foreground">#{pIdx + 1}</span>
                        <span className="font-semibold text-foreground truncate">{p.title}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {p.tasks?.length || 0} tasks
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-amber-500 py-1">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>No phases or bullet tasks detected yet. Use markdown headings (##) and bullets (-).</span>
                </div>
              )}
            </div>
          )}

          {/* Import Destination Mode Selector */}
          {currentRoadmap && (
            <div className="space-y-2 pt-1">
              <label className="text-xs font-semibold text-foreground block">
                Choose Import Destination:
              </label>
              <div className="grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setImportMode('append')}
                  className={`rounded-2xl border p-3 text-left transition-all cursor-pointer ${
                    importMode === 'append'
                      ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                      : 'border-border/70 bg-card/50 text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  <div className="font-semibold text-xs flex items-center gap-1.5 text-foreground">
                    <Plus className="h-3.5 w-3.5 text-primary" /> Append
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                    Add new phases to "{currentRoadmap.title}"
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`rounded-2xl border p-3 text-left transition-all cursor-pointer ${
                    importMode === 'replace'
                      ? 'border-amber-500 bg-amber-500/10 text-foreground ring-1 ring-amber-500'
                      : 'border-border/70 bg-card/50 text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  <div className="font-semibold text-xs flex items-center gap-1.5 text-foreground">
                    <Layers className="h-3.5 w-3.5 text-amber-500" /> Replace
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                    Overwrite phases of "{currentRoadmap.title}"
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setImportMode('new')}
                  className={`rounded-2xl border p-3 text-left transition-all cursor-pointer ${
                    importMode === 'new'
                      ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                      : 'border-border/70 bg-card/50 text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  <div className="font-semibold text-xs flex items-center gap-1.5 text-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-primary" /> New Roadmap
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                    Create as a brand new roadmap
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Submit and Cancel Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 text-xs sm:text-sm rounded-xl px-4 cursor-pointer"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || parsedData.phases.length === 0 || totalTasks === 0}
              className="h-10 text-xs sm:text-sm rounded-xl px-5 gap-2 font-medium cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              <span>
                {isSubmitting
                  ? 'Importing...'
                  : importMode === 'new' || !currentRoadmap
                  ? 'Import as New Roadmap'
                  : importMode === 'replace'
                  ? 'Replace Curriculum'
                  : `Append ${totalTasks} Tasks`}
              </span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
