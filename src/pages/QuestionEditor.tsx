import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { PageHeader, FormField, TagInput, Spinner } from '../components/UI';
import { Select } from '../components/Select';
import { DIFFICULTIES, LANGUAGES, PLATFORMS, capitalize, normalizeUrl } from '../lib/utils';
import type { Category, Question } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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

const fallbackCategory: Category = { _id: 'general', name: 'General', slug: 'general', scope: 'all', color: 'primary', createdAt: '', updatedAt: '' };
const difficultyOptions = DIFFICULTIES.map((item) => ({ value: item, label: capitalize(item) }));
const platformOptions = PLATFORMS.map((item) => ({ value: item, label: capitalize(item) }));
const languageOptions = LANGUAGES.map((item) => ({ value: item, label: item.toUpperCase() }));

export default function QuestionEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<QuestionForm>(emptyForm);
  const [categories, setCategories] = useState<Category[]>([fallbackCategory]);
  const [loading, setLoading] = useState(Boolean(id));
  const editing = Boolean(id);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    if (editing || !form.link) return;
    let active = true;
    const url = form.link.trim();
    if (!/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/.*)?$/i.test(url)) return;
    const t = setTimeout(async () => {
      setDetecting(true);
      try {
        const meta = await api.questions.getMeta(url);
        if (active && meta && !meta.error) {
          setForm(prev => ({
            ...prev,
            title: prev.title || meta.title || '',
            platform: meta.platform || prev.platform,
            difficulty: meta.difficulty || prev.difficulty,
            tags: prev.tags.length === 0 ? (meta.tags || []) : prev.tags
          }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setDetecting(false);
      }
    }, 800);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [form.link, editing]);

  useEffect(() => {
    api.categories.list({ scope: 'question' }).then((items) => setCategories([fallbackCategory, ...items])).catch(() => { });
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.questions.get(id)
      .then((item: Question) => setForm({
        title: item.title,
        problem: item.problem,
        solution: item.solution,
        code: item.code,
        language: item.language,
        difficulty: item.difficulty,
        platform: item.platform,
        category: item.category || 'general',
        tags: item.tags,
        link: item.link,
      }))
      .catch(() => toast.error('Question not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const categoryOptions = useMemo(() => categories.map((item) => ({ value: item.slug, label: item.name })), [categories]);

  const save = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    const payload = { ...form, link: form.link ? normalizeUrl(form.link) : '' };
    try {
      if (id) {
        await api.questions.update(id, payload);
        toast.success('Question updated');
      } else {
        await api.questions.create(payload);
        toast.success('Question created');
      }
      navigate('/questions');
    } catch {
      toast.error('Failed to save question');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title={editing ? 'Edit Q&A' : 'New Q&A'} eyebrow="Answer editor" description="Save the link, notes, explanation and final answer in one focused page.">
        <Button variant="outline" asChild>
          <Link to="/questions"><ArrowLeft className="h-4 w-4" /> Back</Link>
        </Button>
        <Button onClick={save}><Save className="h-4 w-4" /> Save</Button>
      </PageHeader>

      <Card className="rounded-3xl">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <FormField label={detecting ? "Title (fetching...)" : "Title"}>
            <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={detecting ? "Fetching details..." : "Problem title"} />
          </FormField>
          <div className="grid gap-4 md:grid-cols-4">
            <FormField label="Difficulty">
              <Select value={form.difficulty} onChange={(value) => setForm({ ...form, difficulty: value as QuestionForm['difficulty'] })} options={difficultyOptions} />
            </FormField>
            <FormField label="Platform">
              <Select value={form.platform} onChange={(value) => setForm({ ...form, platform: value })} options={platformOptions} />
            </FormField>
            <FormField label="Language">
              <Select value={form.language} onChange={(value) => setForm({ ...form, language: value })} options={languageOptions} />
            </FormField>
            <FormField label="Category">
              <Select value={form.category} onChange={(value) => setForm({ ...form, category: value })} options={categoryOptions} />
            </FormField>
          </div>
          <FormField label="Problem link">
            <Input value={form.link} onChange={(event) => setForm({ ...form, link: event.target.value })} placeholder="https://..." />
          </FormField>
          <FormField label="Problem description">
            <Textarea value={form.problem} onChange={(event) => setForm({ ...form, problem: event.target.value })} className="min-h-36" placeholder="Problem statement or key notes" />
          </FormField>
          <FormField label="Solution / explanation">
            <Textarea value={form.solution} onChange={(event) => setForm({ ...form, solution: event.target.value })} className="min-h-40" placeholder="Approach, proof, complexity..." />
          </FormField>
          <FormField label="Code">
            <Textarea value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} className="min-h-56 font-mono text-sm" placeholder="Paste final code" />
          </FormField>
          <FormField label="Tags">
            <TagInput tags={form.tags} onChange={(tags) => setForm({ ...form, tags })} />
          </FormField>
          <div className="flex justify-end">
            <Button onClick={save}><Save className="h-4 w-4" /> Save question</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
