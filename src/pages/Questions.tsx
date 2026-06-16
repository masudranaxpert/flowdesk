import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit3, CheckCircle2, Circle, ExternalLink, HelpCircle, Code2, Share2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../lib/api';
import { PageHeader, EmptyState, Spinner, SearchInput, ConfirmDialog, FormField, TagInput, PaginationControls } from '../components/UI';
import { Select } from '../components/Select';
import Dialog from '../components/Dialog';
import CodeBlock from '../components/CodeBlock';
import { PLATFORMS, DIFFICULTIES, LANGUAGES, capitalize, normalizeUrl, copyShareUrl, fuzzyMatch, categoryLabel } from '../lib/utils';
import type { Category, Question } from '../types';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

type QuestionForm = {
  title: string;
  problem: string;
  solution: string;
  code: string;
  language: string;
  difficulty: 'easy' | 'medium' | 'hard';
  platform: string;
  category: string;
  tags: string[];
  link: string;
};

const emptyForm: QuestionForm = {
  title: '',
  problem: '',
  solution: '',
  code: '',
  language: 'cpp',
  difficulty: 'medium',
  platform: 'codeforces',
  category: 'general',
  tags: [],
  link: '',
};
const PAGE_SIZE = 10;
const fallbackCategory: Category = { _id: 'general', name: 'General', slug: 'general', scope: 'all', color: 'primary', createdAt: '', updatedAt: '' };

const diffConfig = {
  easy: { badge: 'default', bg: 'bg-success/10 text-success border-success/20 hover:bg-success/20', label: 'Easy', border: 'border-l-success' },
  medium: { badge: 'default', bg: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20', label: 'Medium', border: 'border-l-warning' },
  hard: { badge: 'destructive', bg: '', label: 'Hard', border: 'border-l-destructive' },
};

const difficultyOptions = [
  { value: 'all', label: 'All Levels' },
  ...DIFFICULTIES.map(d => ({ value: d, label: capitalize(d) })),
];

const platformOptions = [
  { value: 'all', label: 'All Platforms' },
  ...PLATFORMS.map(p => ({ value: p, label: capitalize(p) })),
];

const solvedOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'true', label: 'Solved' },
  { value: 'false', label: 'Unsolved' },
];

const formDifficultyOptions = DIFFICULTIES.map(d => ({ value: d, label: capitalize(d) }));
const formPlatformOptions = PLATFORMS.map(p => ({ value: p, label: capitalize(p) }));
const formLanguageOptions = LANGUAGES.map(l => ({ value: l, label: l.toUpperCase() }));

export default function QuestionsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [platform, setPlatform] = useState('all');
  const [category, setCategory] = useState('all');
  const [solved, setSolved] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [delId, setDelId] = useState<string | null>(null);
  const [viewQ, setViewQ] = useState<Question | null>(null);
  const [categories, setCategories] = useState<Category[]>([fallbackCategory]);

  const load = useCallback(() => {
    setLoading(true);
    api.questions.list({ difficulty, platform, category, solved, search, page: String(page), limit: String(PAGE_SIZE) })
      .then((data: any) => {
        setItems(data.items || []);
        setTotal(data.total || 0);
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [difficulty, platform, category, solved, search, page]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);
  useEffect(() => setPage(1), [search, difficulty, platform, category, solved]);

  useEffect(() => {
    api.categories.list({ scope: 'question' }).then((items) => setCategories([fallbackCategory, ...items])).catch(() => {});
  }, []);

  const categoryOptions = useMemo(() => [{ value: 'all', label: 'All Categories' }, ...categories.map((item) => ({ value: item.slug, label: item.name }))], [categories]);
  const formCategoryOptions = useMemo(() => categories.map((item) => ({ value: item.slug, label: item.name })), [categories]);

  const openCreate = () => navigate('/questions/new');
  const openEdit = (q: Question) => navigate(`/questions/${q._id}/edit`);

  const handleSubmit = async () => {
    if (!form.title) return toast.error('Title is required');
    try {
      if (editing) {
        await api.questions.update(editing._id, { ...form, link: form.link ? normalizeUrl(form.link) : '' });
        toast.success('Question updated');
      } else {
        await api.questions.create({ ...form, link: form.link ? normalizeUrl(form.link) : '' });
        toast.success('Question created');
      }
      setDialogOpen(false);
      load();
    } catch { toast.error('Failed to save'); }
  };

  const handleDelete = async () => {
    if (!delId) return;
    await api.questions.delete(delId);
    toast.success('Question deleted');
    setDelId(null);
    load();
  };

  const toggleSolved = async (q: Question) => {
    await api.questions.update(q._id, { isSolved: !q.isSolved });
    load();
  };

  const share = async (id: string) => {
    await copyShareUrl('questions', id);
    toast.success('Share link copied');
  };

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title="Q&A" description="Save questions, links, explanations, final code and solved status in one place." eyebrow="Question tracker">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Question
        </Button>
      </PageHeader>

      <div className="surface flex flex-col items-stretch gap-3 rounded-3xl p-3 sm:flex-row">
        <div className="flex-1 min-w-0">
          <SearchInput value={search} onChange={setSearch} placeholder="Search questions..." />
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Select value={difficulty} onChange={setDifficulty} options={difficultyOptions} className="w-full sm:w-32" />
          <Select value={platform} onChange={setPlatform} options={platformOptions} className="w-full sm:w-36" />
          <Select value={category} onChange={setCategory} options={categoryOptions} className="w-full sm:w-40" />
          <Select value={solved} onChange={setSolved} options={solvedOptions} className="w-full sm:w-32" />
        </div>
      </div>

      {loading ? <Spinner /> : items.length === 0 ? (
        <EmptyState
          icon={<HelpCircle className="h-6 w-6 text-muted-foreground" />}
          title="No questions yet"
          description="Add your first question and answer to get started"
          action={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add Question</Button>}
        />
      ) : (
        <div className="space-y-3">
          {items.map((q, i) => (
            <Card
              key={q._id}
              className={`interactive-card group cursor-pointer rounded-2xl border-l-[4px] stagger-item ${q.isSolved ? 'solved-card border-l-success ring-success/20' : diffConfig[q.difficulty].border}`}
              style={{ animationDelay: `${i * 40}ms` }}
              onClick={() => setViewQ(q)}
            >
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <button onClick={e => { e.stopPropagation(); toggleSolved(q); }} className="shrink-0 focus-ring rounded-sm transition-transform hover:scale-110 outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {q.isSolved
                    ? <CheckCircle2 className="h-5 w-5 text-success" />
                    : <Circle className="h-5 w-5 text-muted-foreground hover:text-success transition-colors" />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{q.title}</h3>
                    <Badge variant={diffConfig[q.difficulty].badge as any} className={`rounded-full text-[10px] ${diffConfig[q.difficulty].bg}`}>{diffConfig[q.difficulty].label}</Badge>
                    <Badge variant="outline" className="rounded-full text-[10px] font-normal">{q.platform}</Badge>
                    <Badge variant="outline" className="rounded-full text-[10px] font-normal">{categoryLabel(q.category, categories)}</Badge>
                    {q.isSolved && <Badge variant="secondary" className="rounded-full bg-success/12 text-success text-[10px]">Solved</Badge>}
                  </div>
                  {q.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {q.tags.slice(0, 5).map(t => <Badge key={t} variant="secondary" className="rounded-full text-[10px] font-normal">{t}</Badge>)}
                    </div>
                  )}
                </div>
                <div className="flex gap-0.5" onClick={e => e.stopPropagation()}>
                  {q.link && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                      <a href={normalizeUrl(q.link)} target="_blank" rel="noopener">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(q)}>
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => share(q._id)}>
                    <Share2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDelId(q._id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PaginationControls page={page} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />

      <Dialog open={!!viewQ} onOpenChange={v => !v && setViewQ(null)} title={viewQ?.title || ''} maxWidth="sm:max-w-2xl">
        {viewQ && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={diffConfig[viewQ.difficulty].badge as any} className={diffConfig[viewQ.difficulty].bg}>{diffConfig[viewQ.difficulty].label}</Badge>
              <Badge variant="outline">{viewQ.platform}</Badge>
              {viewQ.link && (
                <a href={normalizeUrl(viewQ.link)} target="_blank" rel="noopener" className="text-xs text-primary hover:underline flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" /> Problem Link
                </a>
              )}
            </div>
            {viewQ.problem && (
              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Problem</h4>
                <div className="prose-dark max-w-none text-muted-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{viewQ.problem}</ReactMarkdown>
                </div>
              </div>
            )}
            {viewQ.solution && (
              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Solution</h4>
                <div className="prose-dark max-w-none text-muted-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{viewQ.solution}</ReactMarkdown>
                </div>
              </div>
            )}
            {viewQ.code && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ fontFamily: 'var(--font-heading)' }}><Code2 className="h-4 w-4" /> Code</h4>
                <CodeBlock code={viewQ.code} language={viewQ.language} />
              </div>
            )}
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={!!delId}
        onOpenChange={v => !v && setDelId(null)}
        onConfirm={handleDelete}
        title="Delete Question"
        description="This action cannot be undone. The question will be permanently removed."
      />
    </div>
  );
}
