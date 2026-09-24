import { useMemo, useState } from 'react';
import { BrainCircuit, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import CodeBlock from '@/components/CodeBlock';
import { cn } from '@/lib/utils';
import {
  difficultyLabels,
  getQuiz,
  type QuizDifficulty,
} from '@/data/docs/quiz';

const difficultyCls: Record<QuizDifficulty, string> = {
  easy: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300 ring-emerald-500/30',
  medium: 'bg-amber-500/12 text-amber-600 dark:text-amber-300 ring-amber-500/30',
  hard: 'bg-rose-500/12 text-rose-600 dark:text-rose-300 ring-rose-500/30',
};

export default function Quiz({ categoryId, chapterId }: { categoryId: string; chapterId: string }) {
  const questions = useMemo(() => getQuiz(categoryId, chapterId), [categoryId, chapterId]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<QuizDifficulty | 'all'>('all');
  const [openHints, setOpenHints] = useState<Record<string, boolean>>({});

  const visible = useMemo(
    () => (filter === 'all' ? questions : questions.filter((q) => q.difficulty === filter)),
    [questions, filter],
  );

  if (questions.length === 0) return null;

  const toggleHint = (id: string) => {
    setOpenHints((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAllHints = () => {
    const allOpen = visible.every((q) => openHints[q.id]);
    const nextState: Record<string, boolean> = { ...openHints };
    visible.forEach((q) => {
      nextState[q.id] = !allOpen;
    });
    setOpenHints(nextState);
  };

  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-muted/40"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/25">
          <BrainCircuit className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">অনুশীলন ও গভীর চিন্তার প্রশ্নাবলী</span>
          <span className="block text-xs text-muted-foreground">
            {questions.length}টি চিন্তা-উদ্দীপক প্রশ্ন ও দিকনির্দেশনামূলক সংকেত (Hint) · সহজ/মাঝারি/কঠিন
          </span>
        </span>
        <span className="text-xs font-medium text-muted-foreground">{open ? 'লুকাও' : 'প্রশ্নগুলো দেখুন'}</span>
      </button>

      {open && (
        <div className="space-y-5 border-t px-5 py-5">
          {/* Controls bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {(['all', 'easy', 'medium', 'hard'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium ring-1 transition',
                    filter === f
                      ? 'bg-primary/15 text-primary ring-primary/40'
                      : 'text-muted-foreground ring-border hover:text-foreground',
                  )}
                >
                  {f === 'all'
                    ? `সব (${questions.length})`
                    : `${difficultyLabels[f]} (${questions.filter((q) => q.difficulty === f).length})`}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={toggleAllHints}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium text-muted-foreground transition hover:text-foreground hover:bg-muted/40"
            >
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              <span>সব সংকেত টগল করো</span>
            </button>
          </div>

          {/* Question cards */}
          <div className="space-y-4">
            {visible.map((q, i) => {
              const hintVisible = !!openHints[q.id];
              return (
                <div
                  key={q.id}
                  className="rounded-xl border bg-background/50 p-4 transition hover:border-primary/30"
                >
                  <div className="mb-2.5 flex flex-wrap items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-lg bg-muted text-[11px] font-semibold tabular-nums">
                      {i + 1}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-medium ring-1',
                        difficultyCls[q.difficulty],
                      )}
                    >
                      {difficultyLabels[q.difficulty]}
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed font-normal whitespace-pre-line text-foreground/95">
                    {q.question}
                  </p>

                  {q.code && (
                    <div className="mt-3">
                      <CodeBlock code={q.code} language="rust" maxHeight="18rem" />
                    </div>
                  )}

                  <div className="mt-3.5 pt-2 border-t border-border/40">
                    <button
                      type="button"
                      onClick={() => toggleHint(q.id)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition',
                        hintVisible
                          ? 'border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-200'
                          : 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20',
                      )}
                    >
                      <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                      <span>{hintVisible ? 'সংকেত (Hint) লুকাও' : 'সংকেত (Hint) দেখুন'}</span>
                      {hintVisible ? (
                        <ChevronUp className="h-3 w-3 opacity-70" />
                      ) : (
                        <ChevronDown className="h-3 w-3 opacity-70" />
                      )}
                    </button>

                    {hintVisible && (
                      <div className="mt-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
                        <span className="font-semibold block mb-1 text-amber-800 dark:text-amber-300">
                          💡 চিন্তা করার দিকনির্দেশনা (Hint):
                        </span>
                        {q.hint}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
