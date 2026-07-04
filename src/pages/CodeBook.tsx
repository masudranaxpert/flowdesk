import { useState, useEffect, useCallback, useMemo, useRef, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit3, Heart, Copy, Check, Code2, Share2, WrapText, Sparkles, Paperclip, UploadCloud, FileCode2, FileText, X } from 'lucide-react';
import { api } from '../lib/api';
import { PageHeader, EmptyState, Spinner, SearchInput, ConfirmDialog, FormField, TagInput, PaginationControls } from '../components/UI';
import { Select } from '../components/Select';
import Dialog from '../components/Dialog';
import CodeBlock from '../components/CodeBlock';
import { formatDate, LANGUAGES, copyShareUrl, fuzzyMatch, categoryLabel } from '../lib/utils';
import type { Category, CodeSnippet, UploadedFile } from '../types';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const emptyForm = { title: '', code: '', language: 'cpp', description: '', category: 'general', tags: [] as string[], attachments: [] as UploadedFile[] };
const makeEmptyForm = (): typeof emptyForm => ({ ...emptyForm, tags: [] as string[], attachments: [] as UploadedFile[] });
const PAGE_SIZE = 8;
const fallbackCategory: Category = { _id: 'general', name: 'General', slug: 'general', scope: 'all', color: 'primary', createdAt: '', updatedAt: '' };
const favoriteOptions = [
  { value: 'all', label: 'All Snippets' },
  { value: 'true', label: 'Favorites' },
];

const languageOptions = [
  { value: 'all', label: 'All Languages' },
  ...LANGUAGES.map(l => ({ value: l, label: l.toUpperCase() })),
];

const formLanguageOptions = LANGUAGES.map(l => ({ value: l, label: l.toUpperCase() }));

const listCache: Record<string, { items: any[]; total: number }> = {};
const clearCache = () => {
  for (const key in listCache) delete listCache[key];
};

const codeExtensionLanguage: Record<string, string> = {
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  c: 'cpp',
  h: 'cpp',
  hpp: 'cpp',
  py: 'python',
  java: 'java',
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  rs: 'rust',
  go: 'go',
  sh: 'bash',
  bash: 'bash',
  sql: 'sql',
  json: 'json',
  ipynb: 'ipynb',
};

const readableCodeExtensions = new Set([...Object.keys(codeExtensionLanguage), 'txt', 'md', 'csv']);

function extensionOf(name: string) {
  return name.split('.').pop()?.toLowerCase() || '';
}

function titleFromFilename(name: string) {
  return name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
}

function fileSize(size = 0) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function attachmentUrl(file: UploadedFile) {
  const base = file.url || `/api/files/${file.id}`;
  const token = localStorage.getItem('auth-token');
  return token && base.startsWith('/api/') ? `${base}?token=${encodeURIComponent(token)}` : base;
}

function isReadableCodeFile(file: File) {
  const ext = extensionOf(file.name);
  return readableCodeExtensions.has(ext) || file.type.startsWith('text/');
}

function detectLanguage(code: string): string {
  const text = code.trim();
  if (/^\s*\{[\s\S]*"cells"\s*:\s*\[/i.test(text)) return 'ipynb';
  if (/^\s*[\[{]/.test(text)) return 'json';
  if (/^\s*(#include|using namespace std|int main\s*\()/i.test(text)) return 'cpp';
  if (/^\s*(import java\.|public class |class Main)/i.test(text)) return 'java';
  if (/^\s*(def |import |from |class [a-zA-Z0-9_]+\(object\):)/i.test(text)) return 'python';
  if (/^\s*(import type |interface |type [A-Z]|const [a-zA-Z0-9_]+:|let [a-zA-Z0-9_]+:)/i.test(text)) return 'typescript';
  if (/^\s*(import React|const |let |function |import \{)/i.test(text)) return 'javascript';
  if (/^\s*(package |import "fmt"|func main)/i.test(text)) return 'go';
  if (/^\s*(#\s*!.*bash|echo |if \[ |for i in)/i.test(text)) return 'bash';
  if (/^\s*(select |insert |update |delete |create table)/i.test(text)) return 'sql';
  return 'cpp';
}

export default function CodeBookPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [language, setLanguage] = useState('all');
  const [category, setCategory] = useState('all');
  const [favorite, setFavorite] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (search === '') {
      setDebouncedSearch('');
      return;
    }
    const t = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const cacheKey = `${language}-${category}-${favorite}-${debouncedSearch}-${page}`;
  const cached = listCache[cacheKey] || { items: [], total: 0 };

  const [items, setItems] = useState<CodeSnippet[]>(cached.items);
  const [total, setTotal] = useState(cached.total);
  const [loading, setLoading] = useState(cached.items.length === 0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CodeSnippet | null>(null);
  const [form, setForm] = useState(makeEmptyForm);
  const [delId, setDelId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([fallbackCategory]);
  const [viewSnippet, setViewSnippet] = useState<CodeSnippet | null>(null);
  const [wrapCode, setWrapCode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [draggingFile, setDraggingFile] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Array<{ name: string; status: string }>>([]);

  useEffect(() => {
    if (editing || !dialogOpen || !form.code) return;
    const detected = detectLanguage(form.code);
    if (detected !== form.language && form.language === 'cpp') {
      setForm(prev => ({ ...prev, language: detected }));
    }
  }, [form.code, dialogOpen, editing, form.language]);

  const load = useCallback(() => {
    const key = `${language}-${category}-${favorite}-${debouncedSearch}-${page}`;
    if (!listCache[key]) setLoading(true);
    api.codes.list({ language, category, favorite: favorite === 'true' ? 'true' : '', search: debouncedSearch, page: String(page), limit: String(PAGE_SIZE) })
      .then((data: any) => {
        const resItems = data.items || [];
        const resTotal = data.total || 0;
        setItems(resItems);
        setTotal(resTotal);
        listCache[key] = { items: resItems, total: resTotal };
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [language, category, favorite, debouncedSearch, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => setPage(1), [debouncedSearch, language, category, favorite]);

  useEffect(() => {
    api.categories.list({ scope: 'code' }).then((items) => setCategories([fallbackCategory, ...items])).catch(() => {});
  }, []);

  const categoryOptions = useMemo(() => [{ value: 'all', label: 'All Categories' }, ...categories.map((item) => ({ value: item.slug, label: item.name }))], [categories]);
  const formCategoryOptions = useMemo(() => categories.map((item) => ({ value: item.slug, label: item.name })), [categories]);

  const openCreate = () => { setEditing(null); setForm(makeEmptyForm()); setDialogOpen(true); };
  const openEdit = (c: CodeSnippet) => {
    setEditing(c);
    setForm({ title: c.title, code: c.code, language: c.language, description: c.description, category: c.category?.toLowerCase() || '', tags: c.tags || [], attachments: c.attachments || [] });
    setDialogOpen(true);
  };

  const markUpload = (name: string, status: string) => {
    setUploadingFiles((current) => current.map((item) => item.name === name ? { ...item, status } : item));
  };

  const uploadCodeFiles = async (incoming: FileList | File[]) => {
    const files = Array.from(incoming).filter(Boolean);
    if (files.length === 0) return;

    setUploadingFiles(files.map((file) => ({ name: file.name, status: 'Queued' })));

    for (const file of files) {
      const ext = extensionOf(file.name);
      const languageFromName = codeExtensionLanguage[ext];

      if (isReadableCodeFile(file)) {
        try {
          markUpload(file.name, 'Reading');
          const text = await file.text();
          setForm((prev) => {
            const shouldUseInEditor = !prev.code.trim() || ext === 'ipynb';
            if (!shouldUseInEditor) return prev;
            return {
              ...prev,
              title: prev.title || titleFromFilename(file.name),
              code: text,
              language: languageFromName || detectLanguage(text),
            };
          });
        } catch {
          markUpload(file.name, 'Read failed');
        }
      }

      try {
        markUpload(file.name, 'Uploading');
        const uploaded = await api.files.upload(file);
        setForm((prev) => {
          const existing = prev.attachments.some((item) => item.id === uploaded.id);
          return existing ? prev : { ...prev, attachments: [...prev.attachments, uploaded] };
        });
        markUpload(file.name, 'Attached');
      } catch (error) {
        markUpload(file.name, 'Upload unavailable');
        toast.error(`Could not attach ${file.name}. R2 binding may be missing.`);
      }
    }

    window.setTimeout(() => setUploadingFiles([]), 2200);
  };

  const removeAttachment = async (id: string) => {
    await api.files.delete(id).catch(() => {});
    setForm((prev) => ({ ...prev, attachments: prev.attachments.filter((item) => item.id !== id) }));
  };

  const onDropFiles = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDraggingFile(false);
    uploadCodeFiles(event.dataTransfer.files);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.code) return toast.error('Title and code are required');
    try {
      if (editing) {
        await api.codes.update(editing._id, form);
        toast.success('Snippet updated');
      } else {
        await api.codes.create(form);
        toast.success('Snippet created');
      }
      clearCache();
      setDialogOpen(false);
      load();
    } catch { toast.error('Failed to save'); }
  };

  const handleDelete = async () => {
    if (!delId) return;
    await api.codes.delete(delId);
    toast.success('Snippet deleted');
    clearCache();
    setDelId(null);
    load();
  };

  const copyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleFav = async (c: CodeSnippet) => {
    await api.codes.update(c._id, { isFavorite: !c.isFavorite });
    clearCache();
    load();
  };

  const share = async (id: string) => {
    await copyShareUrl('codes', id);
    toast.success('Share link copied');
  };

  const handleExplainWithAi = (code: string, language: string) => {
    const prompt = `Please explain the following ${language.toUpperCase()} code snippet:\n\n\`\`\`${language}\n${code}\n\`\`\``;
    localStorage.setItem('chatbot-pending-prompt', prompt);
    navigate('/chatbot');
  };

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title="Code Book" description="Keep templates, snippets, notebooks and reusable utilities ready." eyebrow="Snippet vault">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Snippet
        </Button>
      </PageHeader>

      <div className="surface flex flex-col gap-3 rounded-3xl p-3 sm:flex-row">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search titles, code, descriptions, categories, tags..." />
        </div>
        <Select value={language} onChange={setLanguage} options={languageOptions} className="sm:w-44" />
        <Select value={category} onChange={setCategory} options={categoryOptions} className="sm:w-48" />
        <Select value={favorite} onChange={setFavorite} options={favoriteOptions} className="sm:w-44" />
      </div>

      {loading ? <Spinner /> : items.length === 0 ? (
        <EmptyState
          icon={<Code2 className="h-6 w-6 text-muted-foreground" />}
          title="No snippets yet"
          description="Save your first code snippet to get started"
          action={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add Snippet</Button>}
        />
      ) : (
        <div className="space-y-3">
          {items.map((c, i) => (
            <Card
              key={c._id}
              className="interactive-card group cursor-pointer rounded-3xl stagger-item"
              style={{ animationDelay: `${i * 50}ms` }}
              onClick={() => setViewSnippet(c)}
            >
              <CardContent className="p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="font-semibold text-sm line-clamp-1">{c.title}</h3>
                    <Badge variant="secondary" className="shrink-0 rounded-full text-[10px] font-normal">{c.language.toUpperCase()}</Badge>
                    {(c.attachments?.length || 0) > 0 && (
                      <Badge variant="outline" className="shrink-0 rounded-full text-[10px] font-normal">
                        <Paperclip className="mr-1 h-3 w-3" /> {c.attachments?.length}
                      </Badge>
                    )}
                    <button onClick={(event) => { event.stopPropagation(); toggleFav(c); }} className="shrink-0 transition-all duration-200 hover:scale-110 outline-none">
                      <Heart className={`h-3.5 w-3.5 transition-colors ${c.isFavorite ? 'fill-destructive text-destructive' : 'text-muted-foreground/40 hover:text-destructive'}`} />
                    </button>
                  </div>
                  <div className="flex gap-0.5" onClick={(event) => event.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleExplainWithAi(c.code, c.language)} title="Explain with AI">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyCode(c.code, c._id)}>
                      {copiedId === c._id ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => share(c._id)}>
                      <Share2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDelId(c._id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {c.description && <p className="mb-3 text-sm leading-6 text-muted-foreground">{c.description}</p>}
                <CodeBlock code={c.code} language={c.language} maxHeight="12rem" />
                {(c.attachments?.length || 0) > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.attachments?.slice(0, 4).map((file) => (
                      <Badge key={file.id} variant="outline" className="rounded-full text-[10px] font-normal">
                        <Paperclip className="mr-1 h-3 w-3" /> {file.name}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="rounded-full text-[10px] font-normal">{categoryLabel(c.category, categories)}</Badge>
                  {c.tags.map(t => <Badge key={t} variant="secondary" className="rounded-full text-[10px] font-normal">{t}</Badge>)}
                  <span className="text-[11px] text-muted-foreground ml-auto">{formatDate(c.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PaginationControls page={page} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? 'Edit Snippet' : 'Add Snippet'} maxWidth="sm:max-w-2xl">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
          <FormField label="Title">
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Snippet title" />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Language">
              <Select value={form.language} onChange={v => setForm({ ...form, language: v })} options={formLanguageOptions} />
            </FormField>
            <FormField label="Description">
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
            </FormField>
          </div>
          <FormField label="Category">
            <Select value={form.category} onChange={v => setForm({ ...form, category: v })} options={formCategoryOptions} />
          </FormField>
          <FormField label="Code">
            <Textarea
              value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value })}
              onPaste={(event) => {
                const files = Array.from(event.clipboardData.files || []);
                if (files.length > 0) {
                  event.preventDefault();
                  uploadCodeFiles(files);
                }
              }}
              className="min-h-[200px] font-mono text-sm"
              placeholder="Paste your code or drop an .ipynb/code file..."
            />
          </FormField>
          <div
            onDragOver={(event) => { event.preventDefault(); setDraggingFile(true); }}
            onDragLeave={() => setDraggingFile(false)}
            onDrop={onDropFiles}
            className={`rounded-2xl border border-dashed p-4 transition-colors ${draggingFile ? 'border-primary bg-primary/10' : 'border-border bg-muted/25'}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept=".ipynb,.cpp,.cc,.cxx,.c,.h,.hpp,.py,.java,.js,.jsx,.ts,.tsx,.rs,.go,.sh,.sql,.json,.csv,.txt,.md,.zip,.pdf,image/*"
              onChange={(event) => {
                if (event.target.files) uploadCodeFiles(event.target.files);
                event.currentTarget.value = '';
              }}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-primary/15 p-2 text-primary">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Attach code files, notebooks or datasets</p>
                  <p className="text-xs text-muted-foreground">Drag and drop, paste, or upload. IPYNB opens in a notebook-style preview.</p>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="h-4 w-4" /> Attach files
              </Button>
            </div>
            {uploadingFiles.length > 0 && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {uploadingFiles.map((file) => (
                  <div key={file.name} className="rounded-xl border border-border bg-background/60 px-3 py-2">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate font-medium">{file.name}</span>
                      <span className="shrink-0 text-primary">{file.status}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full bg-primary transition-all ${file.status === 'Attached' ? 'w-full' : file.status === 'Uploading' ? 'w-3/4' : file.status === 'Reading' ? 'w-1/3' : 'w-1/6'}`} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {form.attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.attachments.map((file) => (
                  <span key={file.id} className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    <span className="max-w-[13rem] truncate">{file.name}</span>
                    <span className="text-muted-foreground">{fileSize(file.size)}</span>
                    <button type="button" className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => removeAttachment(file.id)} aria-label={`Remove ${file.name}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <FormField label="Tags">
            <TagInput tags={form.tags} onChange={tags => setForm({ ...form, tags })} />
          </FormField>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={!!viewSnippet} onOpenChange={(open) => !open && setViewSnippet(null)} title={viewSnippet?.title || 'Code'} maxWidth="sm:max-w-5xl">
        {viewSnippet && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="rounded-full">{viewSnippet.language.toUpperCase()}</Badge>
                <Badge variant="outline" className="rounded-full">{categoryLabel(viewSnippet.category, categories)}</Badge>
                <span className="text-xs text-muted-foreground">{formatDate(viewSnippet.createdAt)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExplainWithAi(viewSnippet.code, viewSnippet.language)}>
                  <Sparkles className="h-4 w-4 mr-1 text-primary" /> Explain
                </Button>
                <Button variant={wrapCode ? 'default' : 'outline'} size="sm" onClick={() => setWrapCode((value) => !value)}>
                  <WrapText className="h-4 w-4" /> Wrap
                </Button>
                <Button variant="outline" size="sm" onClick={() => copyCode(viewSnippet.code, viewSnippet._id)}>
                  {copiedId === viewSnippet._id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copy
                </Button>
                <Button variant="outline" size="sm" onClick={() => share(viewSnippet._id)}>
                  <Share2 className="h-4 w-4" /> Share
                </Button>
                <Button size="sm" onClick={() => { setViewSnippet(null); openEdit(viewSnippet); }}>
                  <Edit3 className="h-4 w-4" /> Edit
                </Button>
              </div>
            </div>
            {viewSnippet.description && <p className="text-sm leading-6 text-muted-foreground">{viewSnippet.description}</p>}
            <CodeBlock code={viewSnippet.code} language={viewSnippet.language} maxHeight="65vh" wrap={wrapCode} />
            {(viewSnippet.attachments?.length || 0) > 0 && (
              <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Paperclip className="h-4 w-4 text-primary" /> Attached files
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {viewSnippet.attachments?.map((file) => {
                    const url = attachmentUrl(file);
                    const isImage = file.mimeType?.startsWith('image/');
                    return (
                      <a
                        key={file.id}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center gap-3 rounded-2xl border border-border bg-background/60 p-3 transition-colors hover:border-primary/50 hover:bg-primary/5"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                          {isImage ? <img src={url} alt={file.name} className="h-full w-full object-cover" /> : <FileCode2 className="h-5 w-5 text-primary" />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium group-hover:text-primary">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{file.mimeType || 'file'} - {fileSize(file.size)}</p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
            {viewSnippet.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {viewSnippet.tags.map((tag) => <Badge key={tag} variant="secondary" className="rounded-full text-[10px] font-normal">{tag}</Badge>)}
              </div>
            )}
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={!!delId}
        onOpenChange={v => !v && setDelId(null)}
        onConfirm={handleDelete}
        title="Delete Snippet"
        description="This action cannot be undone. The code snippet will be permanently removed."
      />
    </div>
  );
}
