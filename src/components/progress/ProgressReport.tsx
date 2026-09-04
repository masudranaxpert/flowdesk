import React, { useMemo } from 'react';
import { Award, CheckCircle2, FileText, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Roadmap } from '../../types';

interface ProgressReportProps {
  roadmap: Roadmap;
  onCopyFullReport: () => void;
}

export function ProgressReport({ roadmap, onCopyFullReport }: ProgressReportProps) {
  const phaseStats = useMemo(() => {
    if (!roadmap?.phases) return [];
    return roadmap.phases.map((phase) => {
      const total = phase.tasks?.length || 0;
      const completed = phase.tasks?.filter((t) => t.completed).length || 0;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        id: phase.id,
        title: phase.title,
        targetMonth: phase.targetMonth,
        total,
        completed,
        pct,
        isDone: total > 0 && completed === total,
      };
    });
  }, [roadmap?.phases]);

  const overallTotal = phaseStats.reduce((acc, p) => acc + p.total, 0);
  const overallCompleted = phaseStats.reduce((acc, p) => acc + p.completed, 0);
  const overallPct = overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0;
  const completedPhases = phaseStats.filter((p) => p.isDone).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Phase-by-Phase Progress Breakdown */}
      <Card className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div>
            <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Phase-by-Phase Progress Breakdown
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Detailed milestones completion across all curriculum phases
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-semibold">
            {completedPhases} of {phaseStats.length} Phases Completed
          </Badge>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {phaseStats.map((phase, idx) => (
            <div
              key={phase.id}
              className="space-y-1.5 rounded-2xl bg-muted/30 border border-border/50 p-3"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-muted-foreground">#{idx + 1}</span>
                  <span className="font-semibold text-foreground">{phase.title}</span>
                  {phase.isDone && (
                    <Badge variant="secondary" className="h-4 text-[9px] bg-emerald-500/15 text-emerald-500">
                      Completed
                    </Badge>
                  )}
                </div>
                <span className="font-mono font-bold text-foreground">{phase.pct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    phase.isDone ? 'bg-emerald-500' : 'bg-primary'
                  }`}
                  style={{ width: `${phase.pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>
                  {phase.completed} of {phase.total} tasks finished
                </span>
                {phase.targetMonth && <span>Month {phase.targetMonth} target</span>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Executive Summary Metrics Card */}
      <Card className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold tracking-tight">Executive Summary & Export</h3>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onCopyFullReport}
            className="h-7 text-xs gap-1.5"
          >
            <FileText className="h-3.5 w-3.5" /> Copy Full Text Report
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-muted/30 border border-border/50 p-3.5 text-center">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              Curriculum Progress
            </span>
            <span className="text-2xl font-black text-primary mt-1 block">{overallPct}%</span>
            <span className="text-[11px] text-muted-foreground">
              {overallCompleted} / {overallTotal} tasks
            </span>
          </div>

          <div className="rounded-2xl bg-muted/30 border border-border/50 p-3.5 text-center">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              Phases Mastered
            </span>
            <span className="text-2xl font-black text-emerald-500 mt-1 block">
              {completedPhases}
            </span>
            <span className="text-[11px] text-muted-foreground">out of {phaseStats.length} phases</span>
          </div>

          <div className="rounded-2xl bg-muted/30 border border-border/50 p-3.5 text-center">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              Current Status
            </span>
            <span className="text-2xl font-black text-amber-500 mt-1 block uppercase">
              {roadmap.status}
            </span>
            <span className="text-[11px] text-muted-foreground">{roadmap.duration} Plan</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
