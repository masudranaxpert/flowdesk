import { useMemo, useState } from 'react';
import { CheckCircle2, ClipboardCheck, RotateCcw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CodeBlock from '@/components/CodeBlock';
import { cn } from '@/lib/utils';
import {
  difficultyLabels,
  getQuiz,
  isCorrect,
  type QuizDifficulty,
  type QuizQuestion,
} from '@/data/docs/quiz';

const difficultyCls: Record<QuizDifficulty, string> = {
  easy: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300 ring-emerald-500/30',
  medium: 'bg-amber-500/12 text-amber-600 dark:text-amber-300 ring-amber-500/30',
  hard: 'bg-rose-500/12 text-rose-600 dark:text-rose-300 ring-rose-500/30',
};

const typeLabels: Record<QuizQuestion['type'], string> = {
  mcq: 'বিকল্প বাছাই',
  output: 'আউটপুট কী হবে',
  code: 'কোড লিখো',
};

type Response = number | string;

export default function Quiz({ categoryId, chapterId }: { categoryId: string; chapterId: string }) {
  const questions = useMemo(() => getQuiz(categoryId, chapterId), [categoryId, chapterId]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<QuizDifficulty | 'all'>('all');
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [submitted, setSubmitted] = useState(false);

  const visible = useMemo(
    () => (filter === 'all' ? questions : questions.filter((q) => q.difficulty === filter)),
    [questions, filter],
  );

  const bestKey = `quiz-best:${categoryId}/${chapterId}`;
  const best = Number(localStorage.getItem(bestKey) || 0);

  if (questions.length === 0) return null;

  const answeredCount = visible.filter((q) => {
    const r = responses[q.id];
    return r !== undefined && r !== '';
  }).length;

  const score = submitted ? visible.filter((q) => isCorrect(q, responses[q.id])).length : 0;
  const percent = visible.length ? Math.round((score / visible.length) * 100) : 0;

  const submit = () => {
    setSubmitted(true);
    if (percent > best) localStorage.setItem(bestKey, String(percent));
  };

  const reset = () => {
    setResponses({});
    setSubmitted(false);
  };

  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-muted/40"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/25">
          <ClipboardCheck className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">এক্সাম — এই chapter টা কতটা শিখলে?</span>
          <span className="block text-xs text-muted-foreground">
            {questions.length}টি প্রশ্ন · সহজ/মাঝারি/কঠিন · কোড লিখে submit করা যায়
            {best > 0 ? ` · সেরা স্কোর ${best}%` : ''}
          </span>
        </span>
        <span className="text-xs font-medium text-muted-foreground">{open ? 'লুকাও' : 'শুরু করি'}</span>
      </button>

      {open && (
        <div className="space-y-5 border-t px-5 py-5">
          {/* difficulty filter */}
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
                {f === 'all' ? `সব (${questions.length})` : `${difficultyLabels[f]} (${questions.filter((q) => q.difficulty === f).length})`}
              </button>
            ))}
          </div>

          {visible.map((q, i) => {
            const response = responses[q.id];
            const correct = submitted && isCorrect(q, response);
            const wrong = submitted && !isCorrect(q, response);
            return (
              <div
                key={q.id}
                className={cn(
                  'rounded-xl border p-4 transition',
                  correct && 'border-emerald-500/40 bg-emerald-500/5',
                  wrong && 'border-rose-500/40 bg-rose-500/5',
                )}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-lg bg-muted text-[11px] font-semibold tabular-nums">
                    {i + 1}
                  </span>
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium ring-1', difficultyCls[q.difficulty])}>
                    {difficultyLabels[q.difficulty]}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{typeLabels[q.type]}</span>
                </div>

                <p className="text-sm leading-relaxed">{q.prompt}</p>
                {q.code && <div className="mt-2 -mb-1"><CodeBlock code={q.code} language="rust" maxHeight="14rem" /></div>}

                {/* options */}
                {q.options && (
                  <div className="mt-3 space-y-1.5">
                    {q.options.map((opt, oi) => {
                      const selected = response === oi;
                      return (
                        <button
                          key={oi}
                          type="button"
                          disabled={submitted}
                          onClick={() => setResponses((r) => ({ ...r, [q.id]: oi }))}
                          className={cn(
                            'flex w-full items-start gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition',
                            'text-muted-foreground hover:text-foreground',
                            selected && !submitted && 'border-primary/50 bg-primary/10 text-foreground',
                            submitted && oi === q.answer && 'border-emerald-500/50 bg-emerald-500/10 text-foreground',
                            submitted && selected && oi !== q.answer && 'border-rose-500/50 bg-rose-500/10 text-foreground',
                          )}
                        >
                          <span className="mt-0.5 grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full border text-[10px] font-semibold">
                            {String.fromCharCode(65 + oi)}
                          </span>
                          <span className="min-w-0 flex-1 whitespace-pre-wrap font-mono text-[13px] leading-snug">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* code answer */}
                {q.type === 'code' && (
                  <textarea
                    value={typeof response === 'string' ? response : ''}
                    disabled={submitted}
                    onChange={(e) => setResponses((r) => ({ ...r, [q.id]: e.target.value }))}
                    placeholder="এখানে কোড লিখো…"
                    spellCheck={false}
                    rows={2}
                    className="mt-3 w-full rounded-lg border bg-muted/40 px-3 py-2 font-mono text-[13px] leading-relaxed outline-none transition focus:border-primary/50 focus:bg-background"
                  />
                )}

                {/* verdict + explanation */}
                {submitted && (
                  <div className="mt-3 space-y-2 text-[13px] leading-relaxed">
                    <p className={cn('flex items-center gap-1.5 font-medium', correct ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300')}>
                      {correct ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      {correct ? 'সঠিক!' : q.type === 'code' ? `সঠিক উত্তর: \`${(q.accept ?? ['—'])[0]}\`` : `সঠিক উত্তর: ${String.fromCharCode(65 + (q.answer ?? 0))}`}
                    </p>
                    <p className="text-muted-foreground">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}

          {/* footer */}
          {submitted ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 px-4 py-3">
              <div>
                <p className="text-sm font-semibold">
                  স্কোর: {score}/{visible.length} ({percent}%)
                  {percent >= 80 ? ' — দুর্দান্ত! 🎉' : percent >= 50 ? ' — ভালো, আরেকবার দেখলেই perfect!' : ' — chapter টা আরেকবার পড়ে আয়!'}
                </p>
                <p className="text-xs text-muted-foreground">সেরা স্কোর: {Math.max(percent, best)}%</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setFilter('all'); }}>
                  সব প্রশ্ন দেখাও
                </Button>
                <Button size="sm" onClick={reset}>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> আবার চেষ্টা করি
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                উত্তর দেওয়া হয়েছে {answeredCount}/{visible.length}টি
              </p>
              <Button size="sm" disabled={answeredCount < visible.length} onClick={submit}>
                জমা দাও
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
