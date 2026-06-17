import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bold, Bot, Code2, Download, Eye, Heading2, Italic, List, Palette, Save, Sparkles, Type } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { runAiChat, type AiSettings, defaultAiSettings } from '../lib/ai';
import { FormField, Spinner } from '../components/UI';
import { Select } from '../components/Select';
import { categoryLabel } from '../lib/utils';
import type { Category } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const fallbackCategory: Category = {
  _id: 'general',
  name: 'General',
  slug: 'general',
  scope: 'all',
  color: 'primary',
  createdAt: '',
  updatedAt: '',
};

const colors = [
  { value: '#facc15', label: 'Yellow' },
  { value: '#38bdf8', label: 'Blue' },
  { value: '#4ade80', label: 'Green' },
  { value: '#fb7185', label: 'Rose' },
  { value: '#c084fc', label: 'Purple' },
];

const fontSizes = [
  { value: '14px', label: 'Small' },
  { value: '16px', label: 'Normal' },
  { value: '20px', label: 'Large' },
  { value: '26px', label: 'Title' },
];

export default function NoteEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const selectionRef = useRef<{ start: number; end: number } | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [categories, setCategories] = useState<Category[]>([fallbackCategory]);
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [settings, setSettings] = useState<AiSettings>(defaultAiSettings);
  const [aiActiveTask, setAiActiveTask] = useState<'summarize' | 'polish' | 'custom' | null>(null);
  const [selectedModelId, setSelectedModelId] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedColor, setSelectedColor] = useState(colors[0].value);
  const [selectedFontSize, setSelectedFontSize] = useState(fontSizes[1].value);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    api.categories.list({ scope: 'notebook' })
      .then((items) => setCategories([fallbackCategory, ...items]))
      .catch(() => setCategories([fallbackCategory]));
    api.aiSettings.get()
      .then((value) => {
        const next = { ...defaultAiSettings, ...value, models: value.models || [] };
        setSettings(next);
        const firstActive = next.models?.find((model) => model.active);
        setSelectedModelId((current) => current || firstActive?.id || '');
      })
      .catch(() => setSettings(defaultAiSettings));
  }, []);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    window.addEventListener('keydown', closeMenu);
    return () => {
      window.removeEventListener('click', closeMenu);
      window.removeEventListener('keydown', closeMenu);
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    api.notebooks.get(id)
      .then((note) => {
        setTitle(note.title);
        setContent(note.content);
        setCategory(note.category || 'general');
      })
      .catch(() => toast.error('Note not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const rememberSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start !== end) selectionRef.current = { start, end };
  };

  const insert = (before: string, after = '', placeholder = 'text') => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent((value) => `${value}${before}${placeholder}${after}`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end) || placeholder;
    const next = `${content.slice(0, start)}${before}${selected}${after}${content.slice(end)}`;
    setContent(next);
    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const selectedRange = () => {
    const textarea = textareaRef.current;
    const liveStart = textarea?.selectionStart ?? content.length;
    const liveEnd = textarea?.selectionEnd ?? content.length;
    if (liveStart !== liveEnd) {
      selectionRef.current = { start: liveStart, end: liveEnd };
      return { start: liveStart, end: liveEnd, text: content.slice(liveStart, liveEnd) };
    }
    const stored = selectionRef.current;
    if (stored && stored.end > stored.start && stored.end <= content.length) {
      return { start: stored.start, end: stored.end, text: content.slice(stored.start, stored.end) };
    }
    return { start: liveStart, end: liveEnd, text: '' };
  };

  const replaceRange = (start: number, end: number, nextText: string) => {
    const next = `${content.slice(0, start)}${nextText}${content.slice(end)}`;
    selectionRef.current = { start, end: start + nextText.length };
    setContent(next);
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(start, start + nextText.length);
    });
  };

  const wrapSelection = (before: string, after = '', placeholder = 'text') => {
    const { start, end, text } = selectedRange();
    const selected = text || placeholder;
    replaceRange(start, end, `${before}${selected}${after}`);
  };

  const applyColor = (color = selectedColor) => {
    wrapSelection(`<span style="color: ${color}">`, '</span>');
    setContextMenu(null);
  };

  const applyFontSize = (size = selectedFontSize) => {
    wrapSelection(`<span style="font-size: ${size}">`, '</span>');
    setContextMenu(null);
  };

  const openSelectionMenu = (event: MouseEvent<HTMLTextAreaElement>) => {
    const { text } = selectedRange();
    if (!text.trim()) return;
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY });
  };

  const runNoteAi = async (task: 'summarize' | 'polish' | 'custom') => {
    const { start, end, text } = selectedRange();
    const target = text.trim() ? text : content;
    if (!target.trim()) return toast.error('Write or select some text first');
    if (task === 'custom' && !customPrompt.trim()) return toast.error('Write your AI prompt first');
    setAiActiveTask(task);
    setContextMenu(null);
    try {
      const instruction = task === 'summarize'
        ? 'Summarize this notebook text into clean markdown bullet points. Return only the replacement markdown.'
        : task === 'polish'
          ? 'Polish and rewrite this notebook text in clear, organized markdown. Keep the original meaning. Return only the replacement markdown.'
          : `${customPrompt.trim()}\nReturn only the replacement markdown.`;
      const selectedModel = settings.models?.find((model) => model.id === selectedModelId);
      const runnableSettings = selectedModel
        ? { ...settings, models: (settings.models || []).map((model) => ({ ...model, active: model.id === selectedModel.id })) }
        : settings;
      const answer = await runAiChat(runnableSettings, [{ role: 'user', content: `${instruction}\n\nText:\n${target}` }], 'Notebook editor selected text rewrite mode. Do not create app actions.', []);
      const cleaned = answer.replace(/```(?:markdown)?/gi, '').replace(/```/g, '').trim();
      if (!cleaned) return toast.error('AI returned empty text');
      if (text.trim()) replaceRange(start, end, cleaned);
      else setContent(cleaned);
      toast.success(task === 'summarize' ? 'Summary inserted' : 'Text updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'AI failed');
    } finally {
      setAiActiveTask(null);
    }
  };

  const save = async () => {
    if (!title.trim()) return toast.error('Title is required');
    try {
      const payload = { title: title.trim(), content, category, tags: [] };
      if (id) await api.notebooks.update(id, payload);
      else await api.notebooks.create(payload);
      toast.success('Note saved');
      navigate('/notebooks');
    } catch {
      toast.error('Failed to save note');
    }
  };

  const downloadMarkdown = () => {
    if (!content) return toast.error('Content is empty');
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title.trim() || 'note'}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Markdown exported');
  };

  if (loading) return <Spinner />;

  const categoryOptions = categories.map((item) => ({ value: item.slug, label: item.name }));
  const activeModels = (settings.models || []).filter((model) => model.active);
  const modelOptions = activeModels.length > 0
    ? activeModels.map((model) => ({ value: model.id, label: `${model.label} - ${model.model}` }))
    : [{ value: 'default', label: `${settings.provider} - ${settings.provider === 'gemini' ? settings.geminiModel : settings.provider === 'openrouter' ? settings.openRouterModel : settings.openAiModel}` }];

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" asChild>
          <Link to="/notebooks">
            <ArrowLeft className="h-4 w-4" />
            Notes
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadMarkdown}>
            <Download className="h-4 w-4" />
            Export Markdown
          </Button>
          <Button onClick={save}>
            <Save className="h-4 w-4" />
            Save Note
          </Button>
        </div>
      </div>

      <Card className="rounded-3xl">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
            <FormField label="Title">
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Research note title..." />
            </FormField>
            <FormField label="Category">
              <Select value={category} onChange={setCategory} options={categoryOptions} />
            </FormField>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-muted/35 p-2">
            <Button variant={mode === 'write' ? 'secondary' : 'ghost'} size="sm" onClick={() => setMode('write')}>
              <Type className="h-4 w-4" /> Write
            </Button>
            <Button variant={mode === 'preview' ? 'secondary' : 'ghost'} size="sm" onClick={() => setMode('preview')}>
              <Eye className="h-4 w-4" /> Preview
            </Button>
            <span className="mx-1 h-6 w-px bg-border" />
            <Button variant="ghost" size="icon" onClick={() => insert('## ', '', 'Heading')}>
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => insert('**', '**')}>
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => insert('*', '*')}>
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => insert('- ', '', 'list item')}>
              <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => insert('```cpp\n', '\n```', 'code here')}>
              <Code2 className="h-4 w-4" />
            </Button>
            <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">{categoryLabel(category, categories)}</span>
          </div>

          <Card className="rounded-2xl border-primary/20 bg-muted/25">
            <CardContent className="space-y-3 p-3">
              <div className="grid gap-2 lg:grid-cols-[minmax(14rem,22rem)_1fr] lg:items-center">
                <FormField label="AI model">
                  <Select value={selectedModelId || modelOptions[0]?.value || 'default'} onChange={setSelectedModelId} options={modelOptions} />
                </FormField>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <Button variant="secondary" size="sm" disabled={aiActiveTask !== null} onClick={() => runNoteAi('summarize')}>
                    {aiActiveTask === 'summarize' ? (
                      <>
                        <div className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Summarizing...
                      </>
                    ) : (
                      <>
                        <Bot className="h-4 w-4" /> Summarize selection
                      </>
                    )}
                  </Button>
                  <Button variant="secondary" size="sm" disabled={aiActiveTask !== null} onClick={() => runNoteAi('polish')}>
                    {aiActiveTask === 'polish' ? (
                      <>
                        <div className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Polishing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" /> Polish text
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input value={customPrompt} onChange={(event) => setCustomPrompt(event.target.value)} placeholder="Ask AI to rewrite selected text your way..." disabled={aiActiveTask !== null} />
                <Button disabled={aiActiveTask !== null} onClick={() => runNoteAi('custom')}>
                  {aiActiveTask === 'custom' ? (
                    <>
                      <div className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Apply AI
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Select text first to edit only that part. If nothing is selected, AI updates the full note.</p>
            </CardContent>
          </Card>

          {mode === 'write' ? (
            <Textarea
              ref={textareaRef}
              id="note-content"
              value={content}
              onChange={(event) => {
                selectionRef.current = null;
                setContent(event.target.value);
              }}
              onSelect={rememberSelection}
              onMouseUp={rememberSelection}
              onKeyUp={rememberSelection}
              onBlur={rememberSelection}
              onContextMenu={openSelectionMenu}
              className="min-h-[55vh] rounded-2xl font-mono text-sm"
              placeholder="Start writing. Use toolbar buttons if markdown is unfamiliar..."
            />
          ) : (
            <div className="min-h-[55vh] rounded-2xl border border-border bg-card/70 p-4">
              {content ? (
                <div className="prose-dark max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Preview will appear here.</p>
              )}
            </div>
          )}
          <div className="mt-3 flex justify-between text-xs text-muted-foreground px-1">
            <span>{wordCount} words / {charCount} characters</span>
          </div>
        </CardContent>
      </Card>

      {contextMenu && (
        <div
          className="fixed z-50 w-64 rounded-2xl border border-border bg-popover p-2 shadow-xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <p className="px-2 pb-2 text-xs font-semibold text-muted-foreground">Selection tools</p>
          <div className="grid grid-cols-5 gap-1 px-1">
            {colors.map((item) => (
              <button
                key={item.value}
                type="button"
                className="h-8 rounded-xl border border-border"
                style={{ background: item.value }}
                title={item.label}
                onClick={() => applyColor(item.value)}
              />
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" onClick={() => applyFontSize('20px')}>Large</Button>
            <Button variant="secondary" size="sm" onClick={() => applyFontSize('26px')}>Title</Button>
            <Button variant="secondary" size="sm" disabled={aiActiveTask !== null} onClick={() => runNoteAi('summarize')}>
              {aiActiveTask === 'summarize' ? 'Summarizing...' : 'Summarize'}
            </Button>
            <Button variant="secondary" size="sm" disabled={aiActiveTask !== null} onClick={() => runNoteAi('polish')}>
              {aiActiveTask === 'polish' ? 'Polishing...' : 'Polish'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
