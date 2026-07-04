import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import {
  Banknote, Bot, Bus, Calendar, Check, ChevronDown, CreditCard,
  Gamepad2, Gift, GraduationCap, HeartPulse, Home, Landmark, Lightbulb,
  type LucideProps, Package, Plus, Receipt, RefreshCw, Send, ShoppingBag,
  Smartphone, TabletSmartphone, Trash2, Users, UtensilsCrossed, Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { runAiChat, defaultAiSettings, type AiSettings } from '../lib/ai';
import MarkdownView from '../components/MarkdownView';
import { FormField, PaginationControls, SearchInput, Spinner } from '../components/UI';
import { Select } from '../components/Select';
import type { Budget, Expense, Transfer } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const PAGE_SIZE = 10;

type CategoryInfo = { icon: ComponentType<LucideProps>; label: string; color: string };
type MethodInfo = { icon: ComponentType<LucideProps>; label: string };

const categoryMeta: Record<string, CategoryInfo> = {
  food:          { icon: UtensilsCrossed, label: 'Food',          color: 'oklch(0.7 0.18 50)' },
  transport:     { icon: Bus,             label: 'Transport',     color: 'oklch(0.6 0.16 250)' },
  study:         { icon: GraduationCap,   label: 'Study',         color: 'oklch(0.65 0.19 290)' },
  rent:          { icon: Home,            label: 'Rent',          color: 'oklch(0.6 0.14 30)' },
  shopping:      { icon: ShoppingBag,     label: 'Shopping',      color: 'oklch(0.7 0.2 330)' },
  health:        { icon: HeartPulse,      label: 'Health',        color: 'oklch(0.65 0.18 160)' },
  entertainment: { icon: Gamepad2,        label: 'Entertainment', color: 'oklch(0.7 0.22 300)' },
  bills:         { icon: Receipt,         label: 'Bills',         color: 'oklch(0.6 0.12 200)' },
  other:         { icon: Package,         label: 'Other',         color: 'oklch(0.6 0.08 260)' },
};

const methodMeta: Record<string, MethodInfo> = {
  cash:  { icon: Banknote,          label: 'Cash' },
  bkash: { icon: Smartphone,        label: 'bKash' },
  nagad: { icon: TabletSmartphone,   label: 'Nagad' },
  card:  { icon: CreditCard,        label: 'Card' },
  bank:  { icon: Landmark,          label: 'Bank' },
  other: { icon: RefreshCw,         label: 'Other' },
};

const categories = Object.keys(categoryMeta);
const methods = Object.keys(methodMeta);

function CategoryIcon({ name, size = 16 }: { name: string; size?: number }) {
  const meta = categoryMeta[name] || categoryMeta.other;
  const Icon = meta.icon;
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-lg"
      style={{ width: size + 10, height: size + 10, backgroundColor: `color-mix(in oklch, ${meta.color} 18%, transparent)`, color: meta.color }}
    >
      <Icon style={{ width: size, height: size }} />
    </span>
  );
}

function MethodIcon({ name, size = 14 }: { name: string; size?: number }) {
  const meta = methodMeta[name] || methodMeta.other;
  const Icon = meta.icon;
  return <Icon style={{ width: size, height: size }} className="text-muted-foreground" />;
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function money(value: number, currency = 'BDT') {
  return `${currency} ${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

const personPalette = [
  'oklch(0.65 0.20 350)', 'oklch(0.65 0.19 290)', 'oklch(0.65 0.18 250)',
  'oklch(0.65 0.18 160)', 'oklch(0.70 0.18 50)', 'oklch(0.65 0.16 30)',
  'oklch(0.65 0.19 330)', 'oklch(0.65 0.18 200)',
];

function personColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return personPalette[Math.abs(hash) % personPalette.length];
}

function personInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function useCountUp(target: number, duration = 700) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    const from = prevTarget.current;
    prevTarget.current = target;
    if (from === target) { setValue(target); return; }
    cancelAnimationFrame(rafRef.current);
    startRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

function RingChart({ data, size = 140, strokeWidth = 16 }: { data: [string, number][]; size?: number; strokeWidth?: number }) {
  const total = data.reduce((sum, [, v]) => sum + v, 0);
  if (total === 0) return null;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  let accumulatedOffset = 0;
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const segments = data.map(([name, value], i) => {
    const fraction = value / total;
    const dashLength = fraction * circumference;
    const offset = accumulatedOffset;
    accumulatedOffset += dashLength;
    const color = categoryMeta[name]?.color || `oklch(0.6 0.15 ${(i * 40) % 360})`;
    return { name, value, fraction, dashLength, offset, color, index: i };
  });

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--color-muted)" strokeWidth={strokeWidth} opacity={0.3} />
        {segments.map((seg) => (
          <circle
            key={seg.name}
            className="hisab-ring-segment"
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={hoveredIdx === seg.index ? strokeWidth + 3 : strokeWidth}
            strokeDasharray={`${seg.dashLength} ${circumference - seg.dashLength}`}
            strokeDashoffset={-seg.offset}
            strokeLinecap="round"
            style={{
              '--ring-circumference': circumference,
              '--ring-offset': -seg.offset,
              animationDelay: `${seg.index * 120}ms`,
            } as React.CSSProperties}
            onMouseEnter={() => setHoveredIdx(seg.index)}
            onMouseLeave={() => setHoveredIdx(null)}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {hoveredIdx !== null ? (
          <>
            <CategoryIcon name={segments[hoveredIdx].name} size={20} />
            <span className="mt-1 text-xs font-semibold capitalize">{segments[hoveredIdx].name}</span>
            <span className="text-xs text-muted-foreground">{Math.round(segments[hoveredIdx].fraction * 100)}%</span>
          </>
        ) : (
          <>
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-sm font-semibold">{data.length}</span>
          </>
        )}
      </div>
    </div>
  );
}

function ExpenseItem({
  item,
  currency,
  index,
  onDelete,
  onUpdate,
}: {
  item: Expense;
  currency: string;
  index: number;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<Expense>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [slidingOut, setSlidingOut] = useState(false);
  const [editField, setEditField] = useState<'title' | 'amount' | null>(null);
  const [editValue, setEditValue] = useState('');
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editField && editRef.current) editRef.current.focus();
  }, [editField]);

  const handleDelete = () => {
    setSlidingOut(true);
    setTimeout(() => onDelete(item._id), 350);
  };

  const startEdit = (field: 'title' | 'amount') => {
    setEditField(field);
    setEditValue(field === 'amount' ? String(item.amount) : item.title);
  };

  const commitEdit = () => {
    if (!editField) return;
    const trimmed = editValue.trim();
    if (editField === 'title' && trimmed && trimmed !== item.title) {
      onUpdate(item._id, { title: trimmed });
    } else if (editField === 'amount' && Number(trimmed) && Number(trimmed) !== item.amount) {
      onUpdate(item._id, { amount: Number(trimmed) });
    }
    setEditField(null);
  };

  const meta = categoryMeta[item.category] || categoryMeta.other;

  return (
    <div
      className={`hisab-expense-item rounded-2xl border border-border bg-muted/25 p-3 ${slidingOut ? 'hisab-slide-out' : ''}`}
      style={{ animationDelay: `${index * 60}ms`, animation: slidingOut ? undefined : `staggerIn 400ms ease-out ${index * 60}ms both` }}
    >
      <div
        className="flex flex-col gap-3 cursor-pointer sm:flex-row sm:items-center"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <CategoryIcon name={item.category} />
            {editField === 'title' ? (
              <input
                ref={editRef}
                className="hisab-inline-edit font-semibold"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditField(null); }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <p
                className="truncate font-semibold hover:text-primary cursor-text transition-colors"
                onDoubleClick={(e) => { e.stopPropagation(); startEdit('title'); }}
                title="Double-click to edit"
              >
                {item.title}
              </p>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="rounded-full">{item.category}</Badge>
            <Badge variant="outline" className="flex items-center gap-1 rounded-full"><MethodIcon name={item.method} /> {item.method}</Badge>
            <span className="text-xs text-muted-foreground">{item.date}</span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          {editField === 'amount' ? (
            <input
              ref={editRef}
              type="number"
              className="hisab-inline-edit w-24 text-right font-semibold"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditField(null); }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="font-semibold hover:text-primary cursor-text transition-colors"
              onDoubleClick={(e) => { e.stopPropagation(); startEdit('amount'); }}
              title="Double-click to edit"
            >
              {money(Number(item.amount), currency)}
            </span>
          )}
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className={`hisab-expand-content ${expanded ? 'expanded' : ''}`}>
        <div>
          <div className="mt-3 rounded-xl border border-border/50 bg-card/50 p-3">
            {item.notes ? (
              <p className="text-sm text-muted-foreground">{item.notes}</p>
            ) : (
              <p className="text-sm italic text-muted-foreground/50">No notes for this expense.</p>
            )}
            <div className="mt-2 flex gap-3 text-xs text-muted-foreground/70">
              <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransferItem({
  item,
  currency,
  index,
  onDelete,
}: {
  item: Transfer;
  currency: string;
  index: number;
  onDelete: (id: string) => void;
}) {
  const [slidingOut, setSlidingOut] = useState(false);
  const color = personColor(item.person);

  const handleDelete = () => {
    setSlidingOut(true);
    setTimeout(() => onDelete(item._id), 350);
  };

  return (
    <div
      className={`hisab-expense-item rounded-2xl border border-border bg-muted/25 p-3 ${slidingOut ? 'hisab-slide-out' : ''}`}
      style={{ animationDelay: `${index * 60}ms`, animation: slidingOut ? undefined : `staggerIn 400ms ease-out ${index * 60}ms both` }}
    >
      <div className="flex items-center gap-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold"
          style={{ backgroundColor: `color-mix(in oklch, ${color} 18%, transparent)`, color }}
        >
          {personInitial(item.person)}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{item.person}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {item.reason && <Badge variant="secondary" className="rounded-full">{item.reason}</Badge>}
            <Badge variant="outline" className="flex items-center gap-1 rounded-full"><MethodIcon name={item.method} /> {item.method}</Badge>
            <span className="text-xs text-muted-foreground">{item.date}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-semibold">{money(Number(item.amount), currency)}</span>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {item.notes && <p className="mt-2 pl-13 text-sm text-muted-foreground">{item.notes}</p>}
    </div>
  );
}

export default function HisabPage() {
  const [month, setMonth] = useState(currentMonth());
  const [budget, setBudget] = useState<Budget | null>(null);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetNotes, setBudgetNotes] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [summary, setSummary] = useState<{
    totalAmount: number;
    totalCount: number;
    categories: Array<{ category: string; amount: number; count: number }>;
    recent: Array<Pick<Expense, 'title' | 'amount' | 'category' | 'date' | 'method'>>;
  }>({ totalAmount: 0, totalCount: 0, categories: [], recent: [] });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [savingBudget, setSavingBudget] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [aiPlan, setAiPlan] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [settings, setSettings] = useState<AiSettings>(defaultAiSettings);
  const [selectedModelId, setSelectedModelId] = useState('');
  const [aiInstruction, setAiInstruction] = useState('');
  const [form, setForm] = useState({ title: '', amount: '', category: 'food', date: today(), method: 'cash', notes: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [progressMounted, setProgressMounted] = useState(false);

  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [transferSummary, setTransferSummary] = useState<{ totalAmount: number; totalCount: number; persons: Array<{ person: string; amount: number; count: number }> }>({ totalAmount: 0, totalCount: 0, persons: [] });
  const [transferForm, setTransferForm] = useState({ person: '', amount: '', reason: '', date: today(), method: 'cash', notes: '' });
  const [transferFormOpen, setTransferFormOpen] = useState(false);
  const [transferCheck, setTransferCheck] = useState(false);

  useEffect(() => {
    api.aiSettings.get()
      .then((value) => {
        const next = { ...defaultAiSettings, ...value, models: value.models || [] };
        setSettings(next);
        setSelectedModelId(next.models.find((model) => model.active)?.id || '');
      })
      .catch(() => setSettings(defaultAiSettings));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [month, debouncedSearch]);

  const load = useCallback(() => {
    setLoading(true);
    setProgressMounted(false);
    Promise.all([
      api.budgets.list({ month, limit: '1' }),
      api.expenses.list({ month, page: String(page), limit: String(PAGE_SIZE), search: debouncedSearch }),
      api.expenses.summary({ month }),
      api.transfers.list({ month }),
      api.transfers.summary({ month }),
    ])
      .then(([budgetData, expenseData, summaryData, transferData, transferSumData]) => {
        const currentBudget = (budgetData.items || [])[0] || null;
        setBudget(currentBudget);
        setBudgetAmount(currentBudget ? String(currentBudget.amount) : '');
        setBudgetNotes(currentBudget?.notes || '');
        setExpenses(expenseData.items || []);
        setExpenseTotal(Number(expenseData.total || 0));
        setSummary({
          totalAmount: Number(summaryData.totalAmount || 0),
          totalCount: Number(summaryData.totalCount || 0),
          categories: summaryData.categories || [],
          recent: summaryData.recent || [],
        });
        setTransfers(transferData.items || transferData || []);
        setTransferSummary({
          totalAmount: Number(transferSumData.totalAmount || 0),
          totalCount: Number(transferSumData.totalCount || 0),
          persons: transferSumData.persons || [],
        });
        requestAnimationFrame(() => setProgressMounted(true));
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Failed to load hisab'))
      .finally(() => setLoading(false));
  }, [month, page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const spent = summary.totalAmount;
  const limit = Number(budgetAmount || budget?.amount || 0);
  const remaining = limit - spent;
  const percent = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
  const categoryTotals = useMemo(() => {
    return summary.categories.map((item) => [item.category, Number(item.amount || 0)] as [string, number]);
  }, [summary.categories]);

  const animatedSpent = useCountUp(spent);
  const animatedRemaining = useCountUp(remaining);
  const animatedLimit = useCountUp(limit);
  const animatedGiven = useCountUp(transferSummary.totalAmount);

  const statusGlow = percent >= 90 ? 'hisab-card-glow-red' : percent >= 70 ? 'hisab-card-glow-amber' : 'hisab-card-glow-green';

  const activeModelOptions = useMemo(() => {
    const activeModels = (settings.models || []).filter((model) => model.active);
    if (activeModels.length === 0) {
      const fallbackModel = settings.provider === 'gemini' ? settings.geminiModel : settings.provider === 'openrouter' ? settings.openRouterModel : settings.openAiModel;
      return [{ value: 'default', label: `${settings.provider} - ${fallbackModel || 'default model'}` }];
    }
    return activeModels.map((model) => ({ value: model.id, label: `${model.label || model.provider} - ${model.model}` }));
  }, [settings]);

  useEffect(() => {
    if (!selectedModelId && activeModelOptions[0]) setSelectedModelId(activeModelOptions[0].value);
  }, [activeModelOptions, selectedModelId]);

  const saveBudget = async () => {
    setSavingBudget(true);
    try {
      const payload = { month, amount: Number(budgetAmount || 0), currency: budget?.currency || 'BDT', notes: budgetNotes };
      const next = budget ? await api.budgets.update(budget._id, payload) : await api.budgets.create(payload);
      setBudget(next);
      toast.success('Budget saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save budget');
    } finally {
      setSavingBudget(false);
    }
  };

  const addExpense = async () => {
    if (!form.title.trim()) return toast.error('Expense title is required');
    if (!Number(form.amount)) return toast.error('Amount is required');
    try {
      await api.expenses.create({ ...form, amount: Number(form.amount) });
      setShowCheck(true);
      setTimeout(() => {
        setShowCheck(false);
        setForm({ title: '', amount: '', category: form.category, date: form.date, method: form.method, notes: '' });
        setFormOpen(false);
      }, 800);
      setPage(1);
      toast.success('Expense added');
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add expense');
    }
  };

  const deleteExpense = async (id: string) => {
    await api.expenses.delete(id);
    toast.success('Expense deleted');
    if (expenses.length === 1 && page > 1) setPage((current) => current - 1);
    else load();
  };

  const updateExpense = async (id: string, data: Partial<Expense>) => {
    try {
      await api.expenses.update(id, data);
      toast.success('Expense updated');
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update');
    }
  };

  const addTransfer = async () => {
    if (!transferForm.person.trim()) return toast.error('Person name is required');
    if (!Number(transferForm.amount)) return toast.error('Amount is required');
    try {
      await api.transfers.create({ ...transferForm, amount: Number(transferForm.amount) });
      setTransferCheck(true);
      setTimeout(() => {
        setTransferCheck(false);
        setTransferForm({ person: '', amount: '', reason: '', date: transferForm.date, method: transferForm.method, notes: '' });
        setTransferFormOpen(false);
      }, 800);
      toast.success('Transfer added');
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add transfer');
    }
  };

  const deleteTransfer = async (id: string) => {
    await api.transfers.delete(id);
    toast.success('Transfer deleted');
    load();
  };

  const aiBudgetPlan = async () => {
    setAiLoading(true);
    try {
      const selected = settings.models?.find((model) => model.id === selectedModelId) || settings.models?.find((model) => model.active);
      const runnableSettings = selected
        ? { ...settings, models: (settings.models || []).map((model) => ({ ...model, active: model.id === selected.id })) }
        : settings;
      const extra = aiInstruction.trim() ? `\nExtra user instruction: ${aiInstruction.trim()}` : '';
      const answer = await runAiChat(
        runnableSettings,
        [{
          role: 'user',
          content: `Create a practical monthly spending plan.\nMonth: ${month}\nBudget: ${money(limit, budget?.currency || 'BDT')}\nSpent so far: ${money(spent, budget?.currency || 'BDT')}\nRemaining: ${money(remaining, budget?.currency || 'BDT')}\nCategory totals: ${JSON.stringify(Object.fromEntries(categoryTotals))}\nRecent expenses: ${JSON.stringify(summary.recent)}${extra}\nReturn concise markdown with: status, risk, recommended daily limit, what to cut, what is safe, next 7-day plan.`,
        }],
        'Personal budgeting assistant. Give practical spending advice only. Do not create app actions.',
        []
      );
      setAiPlan(answer.trim());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'AI plan failed');
    } finally {
      setAiLoading(false);
    }
  };

  const sliderMax = Math.max(limit * 2 || 100000, 200000);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5 animate-fade-in">
      <section className="surface rounded-3xl p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Money planner</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Hisab</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">Track monthly budget, spending categories, and create a practical AI plan.</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card/80 px-3 py-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input type="month" value={month} onChange={(event) => setMonth(event.target.value || currentMonth())} className="h-9 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" />
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className={`rounded-3xl hisab-card-interactive ${statusGlow}`} style={{ animationDelay: '0ms' }}>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Monthly budget</p>
            <p className="mt-2 text-3xl font-semibold">{money(animatedLimit, budget?.currency || 'BDT')}</p>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full hisab-progress-bar ${percent >= 90 ? 'bg-destructive' : percent >= 70 ? 'bg-primary' : 'bg-success'}`}
                style={{ width: progressMounted ? `${percent}%` : '0%' }}
              />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{percent}% used</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl hisab-card-interactive hisab-card-glow-amber" style={{ animationDelay: '80ms' }}>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Spent</p>
            <p className="mt-2 text-3xl font-semibold">{money(animatedSpent, budget?.currency || 'BDT')}</p>
            <p className="mt-3 text-sm text-muted-foreground">{summary.totalCount} expense{summary.totalCount === 1 ? '' : 's'} this month</p>
          </CardContent>
        </Card>

        <Card className={`rounded-3xl hisab-card-interactive ${remaining < 0 ? 'hisab-card-glow-red hisab-over-budget' : 'hisab-card-glow-green'}`} style={{ animationDelay: '160ms' }}>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className={`mt-2 text-3xl font-semibold ${remaining < 0 ? 'text-destructive' : 'text-success'}`}>{money(animatedRemaining, budget?.currency || 'BDT')}</p>
            <p className="mt-3 text-sm text-muted-foreground">{remaining < 0 ? 'Over budget' : 'Available to spend'}</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl hisab-card-interactive hisab-card-glow-violet" style={{ animationDelay: '240ms' }}>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Given away</p>
            <p className="mt-2 text-3xl font-semibold">{money(animatedGiven, budget?.currency || 'BDT')}</p>
            <p className="mt-3 text-sm text-muted-foreground">{transferSummary.totalCount} transfer{transferSummary.totalCount === 1 ? '' : 's'} this month</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-5 pb-0 sm:pb-0">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Add expense</h2>
          </div>
          <button
            className={`hisab-fab grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground ${formOpen ? 'open' : ''}`}
            onClick={() => setFormOpen(!formOpen)}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className={`hisab-expand-content ${formOpen ? 'expanded' : ''}`}>
          <div>
            <CardContent className="space-y-4 p-4 pt-4 sm:p-5 sm:pt-4">
              {showCheck && (
                <div className="flex items-center justify-center py-6">
                  <div className="hisab-check grid h-16 w-16 place-items-center rounded-full bg-success/15">
                    <Check className="h-8 w-8 text-success" />
                  </div>
                </div>
              )}
              {!showCheck && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <FormField label="Title">
                      <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Lunch, bus, book..." />
                    </FormField>
                    <FormField label="Amount">
                      <Input type="number" min="0" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="250" />
                    </FormField>
                    <FormField label="Category">
                      <select className="h-11 w-full rounded-2xl border border-border bg-background px-3" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                        {categories.map((item) => <option key={item} value={item}>{categoryMeta[item].label}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Method">
                      <select className="h-11 w-full rounded-2xl border border-border bg-background px-3" value={form.method} onChange={(event) => setForm({ ...form, method: event.target.value })}>
                        {methods.map((item) => <option key={item} value={item}>{methodMeta[item].label}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Date">
                      <Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
                    </FormField>
                    <FormField label="Notes">
                      <Input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Optional" />
                    </FormField>
                  </div>
                  <Button onClick={addExpense}><Plus className="h-4 w-4" /> Add expense</Button>
                </>
              )}
            </CardContent>
          </div>
        </div>
      </Card>

      <Card className="rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-5 pb-0 sm:pb-0">
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Given to people</h2>
            {transferSummary.totalAmount > 0 && (
              <Badge variant="secondary" className="rounded-full">{money(transferSummary.totalAmount, budget?.currency || 'BDT')}</Badge>
            )}
          </div>
          <button
            className={`hisab-fab grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground ${transferFormOpen ? 'open' : ''}`}
            onClick={() => setTransferFormOpen(!transferFormOpen)}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className={`hisab-expand-content ${transferFormOpen ? 'expanded' : ''}`}>
          <div>
            <CardContent className="space-y-4 p-4 pt-4 sm:p-5 sm:pt-4">
              {transferCheck ? (
                <div className="flex items-center justify-center py-6">
                  <div className="hisab-check grid h-16 w-16 place-items-center rounded-full bg-success/15">
                    <Check className="h-8 w-8 text-success" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <FormField label="Person">
                      <Input value={transferForm.person} onChange={(e) => setTransferForm({ ...transferForm, person: e.target.value })} placeholder="Mom, GF, Rakib..." />
                    </FormField>
                    <FormField label="Amount">
                      <Input type="number" min="0" value={transferForm.amount} onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })} placeholder="3000" />
                    </FormField>
                    <FormField label="Reason">
                      <Input value={transferForm.reason} onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })} placeholder="Gift, allowance, emergency..." />
                    </FormField>
                    <FormField label="Method">
                      <select className="h-11 w-full rounded-2xl border border-border bg-background px-3" value={transferForm.method} onChange={(e) => setTransferForm({ ...transferForm, method: e.target.value })}>
                        {methods.map((m) => <option key={m} value={m}>{methodMeta[m].label}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Date">
                      <Input type="date" value={transferForm.date} onChange={(e) => setTransferForm({ ...transferForm, date: e.target.value })} />
                    </FormField>
                    <FormField label="Notes">
                      <Input value={transferForm.notes} onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })} placeholder="Optional" />
                    </FormField>
                  </div>
                  <Button onClick={addTransfer}><Plus className="h-4 w-4" /> Add transfer</Button>
                </>
              )}
            </CardContent>
          </div>
        </div>

        <CardContent className="p-4 sm:p-5 pt-0">
          {transfers.length === 0 ? (
            <p className="rounded-2xl border border-border bg-muted/25 p-5 text-center text-sm text-muted-foreground">
              No transfers yet. Money given to people will show here — separate from expenses &amp; budget.
            </p>
          ) : (
            <div className="space-y-2">
              {transfers.map((item, i) => (
                <TransferItem
                  key={item._id}
                  item={item}
                  currency={budget?.currency || 'BDT'}
                  index={i}
                  onDelete={deleteTransfer}
                />
              ))}
            </div>
          )}

          {transferSummary.persons.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
              <Users className="h-4 w-4 text-muted-foreground" />
              {transferSummary.persons.slice(0, 8).map((p) => (
                <span
                  key={p.person}
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{ backgroundColor: `color-mix(in oklch, ${personColor(p.person)} 12%, transparent)`, color: personColor(p.person) }}
                >
                  {p.person} · {money(p.amount, budget?.currency || 'BDT')}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="rounded-3xl">
          <CardContent className="p-4 sm:p-5">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold">Expenses</h2>
              <div className="sm:w-72"><SearchInput value={search} onChange={setSearch} placeholder="Search expenses..." /></div>
            </div>
            <div className="space-y-2">
              {expenses.length === 0 ? (
                <p className="rounded-2xl border border-border bg-muted/25 p-5 text-center text-sm text-muted-foreground">No expense found.</p>
              ) : expenses.map((item, i) => (
                <ExpenseItem
                  key={item._id}
                  item={item}
                  currency={budget?.currency || 'BDT'}
                  index={i}
                  onDelete={deleteExpense}
                  onUpdate={updateExpense}
                />
              ))}
            </div>
            <div className="mt-4">
              <PaginationControls page={page} total={expenseTotal} pageSize={PAGE_SIZE} onPageChange={setPage} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-3xl">
            <CardContent className="p-4 sm:p-5">
              <h2 className="text-lg font-semibold">Category breakdown</h2>

              {categoryTotals.length > 0 && (
                <div className="mt-4 flex justify-center">
                  <RingChart data={categoryTotals} />
                </div>
              )}

              <div className="mt-4 space-y-3">
                {categoryTotals.length === 0 ? <p className="text-sm text-muted-foreground">No category data yet.</p> : categoryTotals.map(([name, value], i) => (
                  <div key={name}>
                    <div className="mb-1 flex justify-between gap-3 text-sm">
                      <span className="flex items-center gap-1.5 capitalize">
                        <CategoryIcon name={name} size={14} />
                        {name}
                      </span>
                      <span>{money(value, budget?.currency || 'BDT')}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full hisab-category-bar"
                        style={{
                          width: `${spent ? Math.round((value / spent) * 100) : 0}%`,
                          backgroundColor: categoryMeta[name]?.color || 'var(--color-primary)',
                          animationDelay: `${i * 100 + 300}ms`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-primary/25">
            <CardContent className="space-y-4 p-4 sm:p-5">
              <div>
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">AI plan</h2>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Choose a model and add optional instruction for the plan.</p>
              </div>
              <FormField label="AI model">
                <Select value={selectedModelId || activeModelOptions[0]?.value || 'default'} onChange={setSelectedModelId} options={activeModelOptions} />
              </FormField>
              <FormField label="Extra instruction">
                <Textarea value={aiInstruction} onChange={(event) => setAiInstruction(event.target.value)} placeholder="Example: make it strict, focus on saving, explain in Bangla..." />
              </FormField>
              <Button className="w-full" disabled={aiLoading} onClick={aiBudgetPlan}>
                {aiLoading ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> Planning...</> : <><Bot className="h-4 w-4" /> Generate plan</>}
              </Button>
              {aiPlan && (
                <div className="prose-dark note-reading rounded-2xl border border-border bg-muted/20 p-3">
                  <MarkdownView>{aiPlan}</MarkdownView>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardContent className="space-y-4 p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Budget setup</h2>
              </div>
              <FormField label="Monthly amount">
                <Input type="number" min="0" value={budgetAmount} onChange={(event) => setBudgetAmount(event.target.value)} placeholder="30000" />
              </FormField>
              <div>
                <input
                  type="range"
                  className="hisab-slider"
                  min="0"
                  max={sliderMax}
                  step="500"
                  value={Number(budgetAmount) || 0}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                />
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>{money(sliderMax / 2)}</span>
                  <span>{money(sliderMax)}</span>
                </div>
              </div>
              <FormField label="Notes">
                <Textarea value={budgetNotes} onChange={(event) => setBudgetNotes(event.target.value)} placeholder="Goal, fixed cost, saving target..." />
              </FormField>
              <Button className="w-full" disabled={savingBudget} onClick={saveBudget}>{savingBudget ? 'Saving...' : 'Save budget'}</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
