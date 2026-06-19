import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bot, Calendar, CreditCard, Lightbulb, Plus, Trash2, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { runAiChat, defaultAiSettings, type AiSettings } from '../lib/ai';
import MarkdownView from '../components/MarkdownView';
import { FormField, SearchInput, Spinner } from '../components/UI';
import type { Budget, Expense } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const categories = ['food', 'transport', 'study', 'rent', 'shopping', 'health', 'entertainment', 'bills', 'other'];
const methods = ['cash', 'bkash', 'nagad', 'card', 'bank', 'other'];

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function money(value: number, currency = 'BDT') {
  return `${currency} ${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function HisabPage() {
  const [month, setMonth] = useState(currentMonth());
  const [budget, setBudget] = useState<Budget | null>(null);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetNotes, setBudgetNotes] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingBudget, setSavingBudget] = useState(false);
  const [search, setSearch] = useState('');
  const [aiPlan, setAiPlan] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [settings, setSettings] = useState<AiSettings>(defaultAiSettings);
  const [form, setForm] = useState({ title: '', amount: '', category: 'food', date: today(), method: 'cash', notes: '' });

  useEffect(() => {
    api.aiSettings.get()
      .then((value) => setSettings({ ...defaultAiSettings, ...value, models: value.models || [] }))
      .catch(() => setSettings(defaultAiSettings));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.budgets.list({ month, limit: '1' }),
      api.expenses.list({ month, limit: '100' }),
    ])
      .then(([budgetData, expenseData]) => {
        const currentBudget = (budgetData.items || [])[0] || null;
        setBudget(currentBudget);
        setBudgetAmount(currentBudget ? String(currentBudget.amount) : '');
        setBudgetNotes(currentBudget?.notes || '');
        setExpenses(expenseData.items || []);
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Failed to load hisab'))
      .finally(() => setLoading(false));
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const spent = useMemo(() => expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0), [expenses]);
  const limit = Number(budgetAmount || budget?.amount || 0);
  const remaining = limit - spent;
  const percent = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return expenses;
    return expenses.filter((item) => [item.title, item.category, item.method, item.notes].some((value) => String(value || '').toLowerCase().includes(q)));
  }, [expenses, search]);
  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((item) => map.set(item.category, (map.get(item.category) || 0) + Number(item.amount || 0)));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [expenses]);

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
      setForm({ title: '', amount: '', category: form.category, date: form.date, method: form.method, notes: '' });
      toast.success('Expense added');
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add expense');
    }
  };

  const deleteExpense = async (id: string) => {
    await api.expenses.delete(id);
    toast.success('Expense deleted');
    load();
  };

  const aiBudgetPlan = async () => {
    setAiLoading(true);
    try {
      const selected = settings.models?.find((model) => model.active);
      const runnableSettings = selected
        ? { ...settings, models: (settings.models || []).map((model) => ({ ...model, active: model.id === selected.id })) }
        : settings;
      const answer = await runAiChat(
        runnableSettings,
        [{
          role: 'user',
          content: `Create a practical monthly spending plan.\nMonth: ${month}\nBudget: ${money(limit, budget?.currency || 'BDT')}\nSpent so far: ${money(spent, budget?.currency || 'BDT')}\nRemaining: ${money(remaining, budget?.currency || 'BDT')}\nCategory totals: ${JSON.stringify(Object.fromEntries(categoryTotals))}\nRecent expenses: ${JSON.stringify(expenses.slice(0, 25).map(({ title, amount, category, date, method }) => ({ title, amount, category, date, method })))}\nReturn concise markdown with: status, risk, recommended daily limit, what to cut, what is safe, next 7-day plan.`,
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

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5 animate-fade-in">
      <section className="surface rounded-3xl p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Money planner</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Hisab</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">Track monthly budget, spending categories, and get an AI plan for smarter decisions.</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card/80 px-3 py-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input type="month" value={month} onChange={(event) => setMonth(event.target.value || currentMonth())} className="h-9 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" />
          </div>
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="rounded-3xl">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Monthly budget</p>
            <p className="mt-2 text-3xl font-semibold">{money(limit, budget?.currency || 'BDT')}</p>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full ${percent >= 90 ? 'bg-destructive' : percent >= 70 ? 'bg-primary' : 'bg-success'}`} style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{percent}% used</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Spent</p>
            <p className="mt-2 text-3xl font-semibold">{money(spent, budget?.currency || 'BDT')}</p>
            <p className="mt-3 text-sm text-muted-foreground">{expenses.length} expense{expenses.length === 1 ? '' : 's'} this month</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className={`mt-2 text-3xl font-semibold ${remaining < 0 ? 'text-destructive' : 'text-success'}`}>{money(remaining, budget?.currency || 'BDT')}</p>
            <p className="mt-3 text-sm text-muted-foreground">{remaining < 0 ? 'Over budget' : 'Available to spend'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card className="rounded-3xl">
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Budget setup</h2>
            </div>
            <FormField label="Monthly amount">
              <Input type="number" min="0" value={budgetAmount} onChange={(event) => setBudgetAmount(event.target.value)} placeholder="30000" />
            </FormField>
            <FormField label="Notes">
              <Textarea value={budgetNotes} onChange={(event) => setBudgetNotes(event.target.value)} placeholder="Goal, fixed cost, saving target..." />
            </FormField>
            <Button className="w-full" disabled={savingBudget} onClick={saveBudget}>{savingBudget ? 'Saving...' : 'Save budget'}</Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Add expense</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Title">
                <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Lunch, bus, book..." />
              </FormField>
              <FormField label="Amount">
                <Input type="number" min="0" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="250" />
              </FormField>
              <FormField label="Category">
                <select className="h-11 rounded-2xl border border-border bg-background px-3" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                  {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </FormField>
              <FormField label="Method">
                <select className="h-11 rounded-2xl border border-border bg-background px-3" value={form.method} onChange={(event) => setForm({ ...form, method: event.target.value })}>
                  {methods.map((item) => <option key={item} value={item}>{item}</option>)}
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
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="rounded-3xl">
          <CardContent className="p-4 sm:p-5">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold">Expenses</h2>
              <div className="sm:w-72"><SearchInput value={search} onChange={setSearch} placeholder="Search expenses..." /></div>
            </div>
            <div className="space-y-2">
              {filtered.length === 0 ? (
                <p className="rounded-2xl border border-border bg-muted/25 p-5 text-center text-sm text-muted-foreground">No expense found.</p>
              ) : filtered.map((item) => (
                <div key={item._id} className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/25 p-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{item.title}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="rounded-full">{item.category}</Badge>
                      <Badge variant="outline" className="rounded-full">{item.method}</Badge>
                      <span className="text-xs text-muted-foreground">{item.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span className="font-semibold">{money(Number(item.amount), budget?.currency || 'BDT')}</span>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteExpense(item._id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-3xl">
            <CardContent className="p-4 sm:p-5">
              <h2 className="text-lg font-semibold">Category breakdown</h2>
              <div className="mt-3 space-y-3">
                {categoryTotals.length === 0 ? <p className="text-sm text-muted-foreground">No category data yet.</p> : categoryTotals.map(([name, value]) => (
                  <div key={name}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="capitalize">{name}</span>
                      <span>{money(value, budget?.currency || 'BDT')}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${spent ? Math.round((value / spent) * 100) : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-primary/25">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">AI plan</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Use your active AI model to create a practical spending plan from current hisab.</p>
              <Button className="mt-4 w-full" disabled={aiLoading} onClick={aiBudgetPlan}>
                {aiLoading ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> Planning...</> : <><Bot className="h-4 w-4" /> Generate plan</>}
              </Button>
              {aiPlan && (
                <div className="prose-dark note-reading mt-4 rounded-2xl border border-border bg-muted/20 p-3">
                  <MarkdownView>{aiPlan}</MarkdownView>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
