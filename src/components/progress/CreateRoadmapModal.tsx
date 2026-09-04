import React from 'react';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Layers,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { presets } from './presets';

interface CreateRoadmapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createTab: 'presets' | 'ai' | 'manual';
  setCreateTab: (tab: 'presets' | 'ai' | 'manual') => void;
  onApplyPreset: (preset: (typeof presets)[0]) => Promise<void>;
  aiPrompt: string;
  setAiPrompt: (prompt: string) => void;
  generatingAi: boolean;
  onGenerateAi: () => Promise<void>;
  manualTitle: string;
  setManualTitle: (title: string) => void;
  manualDuration: string;
  setManualDuration: (duration: string) => void;
  onCreateManual: () => Promise<void>;
}

export function CreateRoadmapModal({
  open,
  onOpenChange,
  createTab,
  setCreateTab,
  onApplyPreset,
  aiPrompt,
  setAiPrompt,
  generatingAi,
  onGenerateAi,
  manualTitle,
  setManualTitle,
  manualDuration,
  setManualDuration,
  onCreateManual,
}: CreateRoadmapModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Create Learning Roadmap
          </DialogTitle>
          <DialogDescription>
            Choose a starter curriculum preset, have AI generate one, or create custom milestones.
          </DialogDescription>
        </DialogHeader>

        {/* Modal Tab Buttons */}
        <div className="flex border-b border-border/60 pb-2 gap-2 mt-2">
          <Button
            variant={createTab === 'presets' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCreateTab('presets')}
            className="text-xs"
          >
            Recommended Presets
          </Button>
          <Button
            variant={createTab === 'ai' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCreateTab('ai')}
            className="text-xs gap-1.5"
          >
            <Bot className="h-3.5 w-3.5" /> AI Auto-Planner
          </Button>
          <Button
            variant={createTab === 'manual' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCreateTab('manual')}
            className="text-xs"
          >
            Custom Manual
          </Button>
        </div>

        {/* Tab 1: Presets */}
        {createTab === 'presets' && (
          <div className="space-y-4 pt-2">
            {presets.map((p, idx) => (
              <div
                key={idx}
                className="group relative rounded-2xl border border-border p-4 transition-all hover:border-primary/50 hover:bg-accent/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{p.title}</h4>
                      <Badge variant="outline" className="text-[10px]">
                        {p.duration}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-2">
                      <span className="flex items-center gap-1">
                        <Layers className="h-3 w-3 text-amber-500" /> {p.phases.length} Phases
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />{' '}
                        {p.phases.reduce((acc, ph) => acc + ph.tasks.length, 0)} Milestones
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onApplyPreset(p)}
                    className="gap-1.5 shrink-0"
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
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                What do you want to learn?
              </label>
              <Textarea
                placeholder="e.g. Master DevOps & Kubernetes in 6 months from zero, with Docker, CI/CD, Helm, Terraform, and cloud projects."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={4}
                className="text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                AI will design a comprehensive monthly curriculum with detailed milestones and tasks.
              </p>
            </div>

            <Button
              onClick={onGenerateAi}
              disabled={generatingAi || !aiPrompt.trim()}
              className="w-full gap-2"
            >
              {generatingAi ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin text-amber-400" />
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
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Roadmap Title
              </label>
              <Input
                placeholder="e.g. Full-Stack Next.js & Rust Systems"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Duration / Timeline
              </label>
              <Input
                placeholder="e.g. 6 Months or 90 Days"
                value={manualDuration}
                onChange={(e) => setManualDuration(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <Button
              onClick={onCreateManual}
              disabled={!manualTitle.trim()}
              className="w-full gap-2"
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
