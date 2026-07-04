import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────

export type VizType =
  | 'bubble-sort'
  | 'selection-sort'
  | 'insertion-sort'
  | 'binary-search'
  | 'linear-search'
  | 'stack'
  | 'queue';

export interface VizStep {
  array: number[];
  comparing?: number[];
  swapping?: number[];
  sorted?: number[];
  pointer?: number;
  found?: number;
  rangeStart?: number;
  rangeEnd?: number;
  mid?: number;
  stack?: number[];
  stackOp?: 'push' | 'pop';
  queue?: number[];
  queueOp?: 'enqueue' | 'dequeue';
  comparisons: number;
  swaps: number;
  message: string;
}

// ── Step Generators (pure functions) ────────────────────────────────────────

function bubbleSortSteps(arr: number[]): VizStep[] {
  const steps: VizStep[] = [];
  const a = [...arr];
  const n = a.length;
  const sorted: number[] = [];
  let comparisons = 0;
  let swaps = 0;

  steps.push({
    array: [...a],
    sorted: [],
    comparisons,
    swaps,
    message: `Bubble Sort শুরু — ${n}টি উপাদান`,
  });

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      comparisons++;
      steps.push({
        array: [...a],
        comparing: [j, j + 1],
        sorted: [...sorted],
        comparisons,
        swaps,
        message: `a[${j}]=${a[j]} আর a[${j + 1}]=${a[j + 1]} তুলনা করি`,
      });
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swaps++;
        steps.push({
          array: [...a],
          swapping: [j, j + 1],
          sorted: [...sorted],
          comparisons,
          swaps,
          message: `${a[j + 1]} > ${a[j]} তাই swap করি`,
        });
      }
    }
    sorted.unshift(n - 1 - i);
    steps.push({
      array: [...a],
      sorted: [...sorted],
      comparisons,
      swaps,
      message: `Pass ${i + 1} শেষ — a[${n - 1 - i}]=${a[n - 1 - i]} সঠিক জায়গায়`,
    });
  }
  sorted.unshift(0);
  steps.push({
    array: [...a],
    sorted: [...sorted],
    comparisons,
    swaps,
    message: `সম্পূর্ণ sorted! ${comparisons} comparisons, ${swaps} swaps`,
  });
  return steps;
}

function selectionSortSteps(arr: number[]): VizStep[] {
  const steps: VizStep[] = [];
  const a = [...arr];
  const n = a.length;
  const sorted: number[] = [];
  let comparisons = 0;
  let swaps = 0;

  steps.push({
    array: [...a],
    sorted: [],
    comparisons,
    swaps,
    message: `Selection Sort শুরু — প্রতি pass-এ সবচেয়ে ছোটটা খুঁজি`,
  });

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    steps.push({
      array: [...a],
      pointer: minIdx,
      sorted: [...sorted],
      comparisons,
      swaps,
      message: `Pass ${i + 1}: a[${i}] কে এখন পর্যন্ত সবচেয়ে ছোট ধরি`,
    });
    for (let j = i + 1; j < n; j++) {
      comparisons++;
      steps.push({
        array: [...a],
        comparing: [minIdx, j],
        pointer: minIdx,
        sorted: [...sorted],
        comparisons,
        swaps,
        message: `a[${j}]=${a[j]} কি a[${minIdx}]=${a[minIdx]} থেকে ছোট?`,
      });
      if (a[j] < a[minIdx]) {
        minIdx = j;
        steps.push({
          array: [...a],
          pointer: minIdx,
          sorted: [...sorted],
          comparisons,
          swaps,
          message: `হ্যাঁ! নতুন min = a[${minIdx}]=${a[minIdx]}`,
        });
      }
    }
    if (minIdx !== i) {
      [a[i], a[minIdx]] = [a[minIdx], a[i]];
      swaps++;
    }
    sorted.push(i);
    steps.push({
      array: [...a],
      sorted: [...sorted],
      comparisons,
      swaps,
      message: `a[${i}]=${a[i]} সঠিক জায়গায় বসালাম`,
    });
  }
  sorted.push(n - 1);
  steps.push({
    array: [...a],
    sorted: [...sorted],
    comparisons,
    swaps,
    message: `Sorted! ${comparisons} comparisons, ${swaps} swaps`,
  });
  return steps;
}

function insertionSortSteps(arr: number[]): VizStep[] {
  const steps: VizStep[] = [];
  const a = [...arr];
  const n = a.length;
  let comparisons = 0;
  let swaps = 0;

  steps.push({
    array: [...a],
    sorted: [0],
    comparisons,
    swaps,
    message: `Insertion Sort — প্রথম উপাদান already sorted`,
  });

  for (let i = 1; i < n; i++) {
    const key = a[i];
    steps.push({
      array: [...a],
      pointer: i,
      sorted: Array.from({ length: i }, (_, k) => k),
      comparisons,
      swaps,
      message: `key = a[${i}] = ${key} কে sorted অংশে বসাবো`,
    });
    let j = i - 1;
    while (j >= 0 && a[j] > key) {
      comparisons++;
      steps.push({
        array: [...a],
        comparing: [j, j + 1],
        pointer: i,
        sorted: Array.from({ length: i }, (_, k) => k),
        comparisons,
        swaps,
        message: `a[${j}]=${a[j]} > ${key}, তাই ডানে সরাই`,
      });
      a[j + 1] = a[j];
      swaps++;
      j--;
    }
    if (j >= 0) comparisons++;
    a[j + 1] = key;
    steps.push({
      array: [...a],
      sorted: Array.from({ length: i + 1 }, (_, k) => k),
      comparisons,
      swaps,
      message: `${key} কে position ${j + 1}-এ বসালাম`,
    });
  }
  steps.push({
    array: [...a],
    sorted: Array.from({ length: n }, (_, k) => k),
    comparisons,
    swaps,
    message: `Sorted! ${comparisons} comparisons, ${swaps} shifts`,
  });
  return steps;
}

function binarySearchSteps(arr: number[]): VizStep[] {
  const sorted = [...arr].sort((a, b) => a - b);
  const target = sorted[Math.floor(sorted.length / 2)];
  const steps: VizStep[] = [];
  let lo = 0;
  let hi = sorted.length - 1;
  let comparisons = 0;

  steps.push({
    array: sorted,
    rangeStart: lo,
    rangeEnd: hi,
    comparisons,
    swaps: 0,
    message: `Binary Search — target = ${target} (sorted array)`,
  });

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    comparisons++;
    steps.push({
      array: sorted,
      rangeStart: lo,
      rangeEnd: hi,
      mid,
      comparisons,
      swaps: 0,
      message: `lo=${lo}, hi=${hi}, mid=${mid} → a[${mid}]=${sorted[mid]}`,
    });
    if (sorted[mid] === target) {
      steps.push({
        array: sorted,
        found: mid,
        rangeStart: lo,
        rangeEnd: hi,
        mid,
        comparisons,
        swaps: 0,
        message: `পেয়ে গেছি! ${target} পড়েছে index ${mid}-এ`,
      });
      break;
    } else if (sorted[mid] < target) {
      lo = mid + 1;
      steps.push({
        array: sorted,
        rangeStart: lo,
        rangeEnd: hi,
        mid,
        comparisons,
        swaps: 0,
        message: `${sorted[mid]} < ${target}, তাই ডান অংশে খুঁজি`,
      });
    } else {
      hi = mid - 1;
      steps.push({
        array: sorted,
        rangeStart: lo,
        rangeEnd: hi,
        mid,
        comparisons,
        swaps: 0,
        message: `${sorted[mid]} > ${target}, তাই বাম অংশে খুঁজি`,
      });
    }
  }
  return steps;
}

function linearSearchSteps(arr: number[]): VizStep[] {
  const target = arr[Math.floor(arr.length / 2)];
  const steps: VizStep[] = [];
  let comparisons = 0;

  steps.push({
    array: [...arr],
    comparisons,
    swaps: 0,
    message: `Linear Search — target = ${target}`,
  });

  for (let i = 0; i < arr.length; i++) {
    comparisons++;
    steps.push({
      array: [...arr],
      pointer: i,
      comparisons,
      swaps: 0,
      message: `a[${i}]=${arr[i]} চেক করি`,
    });
    if (arr[i] === target) {
      steps.push({
        array: [...arr],
        found: i,
        comparisons,
        swaps: 0,
        message: `পেয়ে গেছি! index ${i}`,
      });
      break;
    }
  }
  return steps;
}

function stackSteps(arr: number[]): VizStep[] {
  const steps: VizStep[] = [];
  const stack: number[] = [];
  const operations = [3, 1, 4, 1, 5];
  let comparisons = 0;

  steps.push({
    array: arr,
    stack: [],
    comparisons,
    swaps: 0,
    message: 'Stack — LIFO (Last In First Out)',
  });

  for (const val of operations) {
    stack.push(val);
    steps.push({
      array: arr,
      stack: [...stack],
      stackOp: 'push',
      comparisons,
      swaps: 0,
      message: `push(${val}) → top-এ বসালাম`,
    });
  }
  steps.push({
    array: arr,
    stack: [...stack],
    comparisons,
    swaps: 0,
    message: `Stack এখন ${stack.length}টি উপাদান — top = ${stack[stack.length - 1]}`,
  });
  for (let i = 0; i < 2; i++) {
    const popped = stack.pop();
    steps.push({
      array: arr,
      stack: [...stack],
      stackOp: 'pop',
      comparisons,
      swaps: 0,
      message: `pop() → ${popped} বের হলো (সবার উপর থেকে)`,
    });
  }
  steps.push({
    array: arr,
    stack: [...stack],
    comparisons,
    swaps: 0,
    message: `এখন ${stack.length}টি উপাদান আছে`,
  });
  return steps;
}

function queueSteps(arr: number[]): VizStep[] {
  const steps: VizStep[] = [];
  const queue: number[] = [];
  const operations = [10, 20, 30, 40];
  let comparisons = 0;

  steps.push({
    array: arr,
    queue: [],
    comparisons,
    swaps: 0,
    message: 'Queue — FIFO (First In First Out)',
  });

  for (const val of operations) {
    queue.push(val);
    steps.push({
      array: arr,
      queue: [...queue],
      queueOp: 'enqueue',
      comparisons,
      swaps: 0,
      message: `enqueue(${val}) → পেছনে বসালাম`,
    });
  }
  for (let i = 0; i < 2; i++) {
    const dequeued = queue.shift();
    steps.push({
      array: arr,
      queue: [...queue],
      queueOp: 'dequeue',
      comparisons,
      swaps: 0,
      message: `dequeue() → ${dequeued} বের হলো (সামন থেকে)`,
    });
  }
  steps.push({
    array: arr,
    queue: [...queue],
    comparisons,
    swaps: 0,
    message: `এখন ${queue.length}টি উপাদান`,
  });
  return steps;
}

// ── Generator registry ──────────────────────────────────────────────────────

const generators: Record<VizType, (arr: number[]) => VizStep[]> = {
  'bubble-sort': bubbleSortSteps,
  'selection-sort': selectionSortSteps,
  'insertion-sort': insertionSortSteps,
  'binary-search': binarySearchSteps,
  'linear-search': linearSearchSteps,
  stack: stackSteps,
  queue: queueSteps,
};

const defaultArrays: Record<VizType, number[]> = {
  'bubble-sort': [64, 34, 25, 12, 22, 11, 90],
  'selection-sort': [29, 10, 14, 37, 13],
  'insertion-sort': [12, 11, 13, 5, 6],
  'binary-search': [2, 5, 8, 12, 16, 23, 38, 56, 72, 91],
  'linear-search': [9, 4, 7, 2, 8, 1, 5],
  stack: [],
  queue: [],
};

const BAR_COLORS = {
  default: 'bg-slate-600',
  comparing: 'bg-amber-500',
  swapping: 'bg-rose-500',
  sorted: 'bg-emerald-500',
  pointer: 'bg-cyan-500',
  found: 'bg-green-400',
  mid: 'bg-violet-500',
};

// ── Bar visualization (for sorting/searching) ───────────────────────────────

function ArrayBars({ step }: { step: VizStep }) {
  const max = Math.max(...step.array, 1);
  return (
    <div className="flex items-end justify-center gap-1.5 sm:gap-2" style={{ minHeight: '160px' }}>
      {step.array.map((val, i) => {
        const isComparing = step.comparing?.includes(i);
        const isSwapping = step.swapping?.includes(i);
        const isSorted = step.sorted?.includes(i);
        const isPointer = step.pointer === i;
        const isFound = step.found === i;
        const isMid = step.mid === i;
        const inRange =
          step.rangeStart !== undefined && step.rangeEnd !== undefined && i >= step.rangeStart && i <= step.rangeEnd;
        const isDimmed =
          step.rangeStart !== undefined && step.rangeEnd !== undefined && !inRange;

        let color = BAR_COLORS.default;
        if (isFound) color = BAR_COLORS.found;
        else if (isSwapping) color = BAR_COLORS.swapping;
        else if (isComparing) color = BAR_COLORS.comparing;
        else if (isMid) color = BAR_COLORS.mid;
        else if (isSorted) color = BAR_COLORS.sorted;
        else if (isPointer) color = BAR_COLORS.pointer;

        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
              {isMid ? 'mid' : step.pointer === i ? '←' : ''}
            </span>
            <div
              className={`flex w-8 items-end justify-center rounded-t-md transition-all duration-300 sm:w-10 ${color} ${isDimmed ? 'opacity-30' : ''}`}
              style={{ height: `${(val / max) * 130 + 20}px` }}
            >
              <span className="pb-1 text-[10px] font-bold text-white">{val}</span>
            </div>
            <span className="text-[9px] text-muted-foreground/60">{i}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Stack visualization ─────────────────────────────────────────────────────

function StackViz({ step }: { step: VizStep }) {
  if (!step.stack) return null;
  return (
    <div className="flex flex-col items-center gap-1.5" style={{ minHeight: '200px' }}>
      <span className="mb-1 text-[10px] font-medium text-muted-foreground">← top</span>
      {[...step.stack].reverse().map((val, i) => {
        const isTop = i === 0;
        const justChanged = step.stackOp && isTop;
        return (
          <div
            key={`${i}-${val}`}
            className={`flex h-10 w-24 items-center justify-center rounded-lg border-2 text-sm font-bold transition-all duration-300 ${
              justChanged
                ? step.stackOp === 'push'
                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                  : 'border-rose-400 bg-rose-500/20 text-rose-300'
                : 'border-slate-600 bg-slate-700/50 text-slate-200'
            }`}
          >
            {val}
          </div>
        );
      })}
      {step.stack.length === 0 && (
        <div className="grid h-32 w-24 place-items-center rounded-lg border-2 border-dashed border-slate-700 text-xs text-muted-foreground">
          empty
        </div>
      )}
    </div>
  );
}

// ── Queue visualization ─────────────────────────────────────────────────────

function QueueViz({ step }: { step: VizStep }) {
  if (!step.queue) return null;
  return (
    <div className="flex flex-col items-center gap-2" style={{ minHeight: '160px' }}>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium text-cyan-400">front ←</span>
        <div className="flex gap-1.5">
          {step.queue.length === 0 ? (
            <div className="grid h-10 w-20 place-items-center rounded-lg border-2 border-dashed border-slate-700 text-xs text-muted-foreground">
              empty
            </div>
          ) : (
            step.queue.map((val, i) => {
              const isFront = i === 0;
              const isRear = i === step.queue!.length - 1;
              const justChanged =
                (step.queueOp === 'enqueue' && isRear) || (step.queueOp === 'dequeue' && isFront);
              return (
                <div
                  key={`${i}-${val}`}
                  className={`flex h-10 w-12 items-center justify-center rounded-lg border-2 text-sm font-bold transition-all duration-300 ${
                    justChanged
                      ? step.queueOp === 'enqueue'
                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                        : 'border-rose-400 bg-rose-500/20 text-rose-300'
                      : 'border-slate-600 bg-slate-700/50 text-slate-200'
                  }`}
                >
                  {val}
                </div>
              );
            })
          )}
        </div>
        <span className="text-[10px] font-medium text-amber-400">→ rear</span>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function DSAViz({ type }: { type: VizType }) {
  const inputArr = defaultArrays[type] ?? [5, 3, 8, 1, 9, 2, 7];
  const steps = useMemo(() => generators[type]?.(inputArr) ?? [], [type]);

  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(700);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = steps[current] ?? steps[0];

  const next = useCallback(() => setCurrent((c) => Math.min(c + 1, steps.length - 1)), [steps.length]);
  const prev = useCallback(() => setCurrent((c) => Math.max(c - 1, 0)), []);
  const reset = useCallback(() => {
    setPlaying(false);
    setCurrent(0);
  }, []);

  useEffect(() => {
    setCurrent(0);
    setPlaying(false);
  }, [type]);

  useEffect(() => {
    if (!playing) return;
    if (current >= steps.length - 1) {
      setPlaying(false);
      return;
    }
    timerRef.current = setTimeout(() => setCurrent((c) => c + 1), speed);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing, current, steps.length, speed]);

  const isStack = type === 'stack';
  const isQueue = type === 'queue';

  return (
    <div className="my-6 overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-900/60">
      <div className="flex items-center justify-between border-b border-slate-700/50 px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
          Interactive Visualization
        </span>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          Step {current + 1}/{steps.length}
        </span>
      </div>

      <div className="flex items-center justify-center px-4 py-6">
        {isStack ? (
          <StackViz step={step} />
        ) : isQueue ? (
          <QueueViz step={step} />
        ) : (
          <ArrayBars step={step} />
        )}
      </div>

      <div className="border-t border-slate-700/50 px-4 py-3">
        <p className="mb-3 text-center text-sm text-slate-300">{step.message}</p>

        {!isStack && !isQueue && (
          <div className="mb-3 flex justify-center gap-4 text-[11px] text-muted-foreground">
            <span>Comparisons: <span className="font-bold text-amber-400">{step.comparisons}</span></span>
            <span>Swaps: <span className="font-bold text-rose-400">{step.swaps}</span></span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={prev}
            disabled={current === 0}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-600 text-slate-300 transition hover:bg-slate-700 disabled:opacity-30"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            disabled={current >= steps.length - 1 && !playing}
            className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-500 text-white transition hover:bg-cyan-400 disabled:opacity-30"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            onClick={next}
            disabled={current >= steps.length - 1}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-600 text-slate-300 transition hover:bg-slate-700 disabled:opacity-30"
          >
            <SkipForward className="h-4 w-4" />
          </button>
          <button
            onClick={reset}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-600 text-slate-300 transition hover:bg-slate-700"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <div className="ml-2 flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">Speed</span>
            <input
              type="range"
              min={200}
              max={1500}
              step={100}
              value={1800 - speed}
              onChange={(e) => setSpeed(1800 - Number(e.target.value))}
              className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-slate-600 accent-cyan-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}