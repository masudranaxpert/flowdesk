import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  Layers,
  Plus,
  Sparkles,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { presets } from './presets';

// Precompute milestone counts to avoid runtime reduction during renders
const PRESET_CARDS = presets.map((p) => ({
  ...p,
  totalMilestones: p.phases.reduce((acc, ph) => acc + (ph.tasks?.length || 0), 0),
}));

interface CreateRoadmapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyPreset: (preset: (typeof presets)[0]) => Promise<void>;
  onGenerateAi: (prompt: string) => Promise<void>;
  onCreateManual: (title: string, duration: string) => Promise<void>;
}

export function CreateRoadmapModal({
  open,
  onOpenChange,
  onApplyPreset,
  onGenerateAi,
  onCreateManual,
}: CreateRoadmapModalProps) {
  const [createTab, setCreateTab] = useState<'presets' | 'ai' | 'manual'>('presets');
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualDuration, setManualDuration] = useState('12 Months');

  const handleGenerateSubmit = async () => {
    if (!aiPrompt.trim() || generatingAi) return;
    setGeneratingAi(true);
    try {
      await onGenerateAi(aiPrompt);
      setAiPrompt('');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualTitle.trim()) return;
    await onCreateManual(manualTitle, manualDuration);
    setManualTitle('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-6 sm:p-7 rounded-3xl border border-border bg-card shadow-2xl">
        <DialogHeader className="space-y-1.5 pb-2">
          <DialogTitle className="flex items-center gap-2.5 text-base font-semibold">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <span>Create Learning Roadmap</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Choose a starter curriculum preset, generate with AI, or build custom milestones.
          </DialogDescription>
        </DialogHeader>

        {/* Modal Segmented Switcher */}
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-muted/50 p-1 border border-border/60">
          <button
            type="button"
            onClick={() => setCreateTab('presets')}
            className={`flex items-center justify-center gap-2 rounded-xl py-2 px-2 text-xs font-semibold transition-all cursor-pointer ${
              createTab === 'presets'
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span className="truncate">Recommended</span>
          </button>

          <button
            type="button"
            onClick={() => setCreateTab('ai')}
            className={`flex items-center justify-center gap-2 rounded-xl py-2 px-2 text-xs font-semibold transition-all cursor-pointer ${
              createTab === 'ai'
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Bot className="h-3.5 w-3.5 text-primary" />
            <span className="truncate">AI Auto-Planner</span>
          </button>

          <button
            type="button"
            onClick={() => setCreateTab('manual')}
            className={`flex items-center justify-center gap-2 rounded-xl py-2 px-2 text-xs font-semibold transition-all cursor-pointer ${
              createTab === 'manual'
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Plus className="h-3.5 w-3.5 text-primary" />
            <span className="truncate">Custom Manual</span>
          </button>
        </div>

        {/* Tab 1: Presets */}
        {createTab === 'presets' && (
          <div className="space-y-3 pt-1 animate-fade-in">
            {PRESET_CARDS.map((p, idx) => (
              <div
                key={idx}
                className="group rounded-2xl border border-border bg-card/60 p-4 transition-all hover:border-primary/50 hover:bg-muted/20"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm text-foreground tracking-tight">
                        {p.title}
                      </h4>
                      <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5">
                        {p.duration}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5 text-primary" />
                        <span>{p.phases.length} Phases</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span>
                          {p.totalMilestones} Milestones
                        </span>
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => onApplyPreset(p)}
                    className="gap-1.5 shrink-0 rounded-xl cursor-pointer"
                  >
                    Select <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: AI Planner */}
        {createTab === 'ai' && (
          <div className="space-y-4 pt-1 animate-fade-in">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                What do you want to learn?
              </label>
              <Textarea
                placeholder="e.g. Master DevOps & Kubernetes in 6 months from zero, with Docker, CI/CD, Helm, Terraform, and cloud projects."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={4}
                className="text-xs rounded-2xl resize-none"
              />
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-muted-foreground font-medium">Quick ideas:</span>
                {[
                  'Full-Stack Next.js & Rust',
                  'Python Data Science & ML',
                  'Cloud DevOps & Kubernetes',
                  'Advanced DSA & LeetCode',
                ].map((idea) => (
                  <button
                    key={idea}
                    type="button"
                    onClick={() =>
                      setAiPrompt(
                        `Comprehensive curriculum to master ${idea} with milestones and practical projects.`
                      )
                    }
                    className="rounded-lg bg-muted/60 hover:bg-muted px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors border border-border/40 cursor-pointer"
                  >
                    {idea}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerateSubmit}
              disabled={generatingAi || !aiPrompt.trim()}
              className="w-full gap-2 rounded-xl cursor-pointer"
            >
              {generatingAi ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin text-primary-foreground" />
                  Generating Comprehensive Curriculum...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4" />
                  Generate with AI
                </>
              )}
            </Button>
          </div>
        )}

        {/* Tab 3: Custom Manual */}
        {createTab === 'manual' && (
          <div className="space-y-4 pt-1 animate-fade-in">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Roadmap Title
              </label>
              <Input
                placeholder="e.g. Full-Stack Next.js & Rust Systems"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Duration / Timeline
              </label>
              <Input
                placeholder="e.g. 6 Months or 90 Days"
                value={manualDuration}
                onChange={(e) => setManualDuration(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <Button
              onClick={handleManualSubmit}
              disabled={!manualTitle.trim()}
              className="w-full gap-2 rounded-xl cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Create Custom Roadmap
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
