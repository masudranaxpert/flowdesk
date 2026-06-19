import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Pin, Plus, Trash2, Edit3, FileText, Share2 } from 'lucide-react';
import { api } from '../lib/api';
import MarkdownView from '../components/MarkdownView';
import { PageHeader, EmptyState, Spinner, SearchInput, ConfirmDialog, PaginationControls } from '../components/UI';
import { Select } from '../components/Select';
import Dialog from '../components/Dialog';
import { copyShareUrl, fuzzyMatch, categoryLabel, formatDate } from '../lib/utils';
import type { Category, Notebook } from '../types';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const PAGE_SIZE = 9;
const fallbackCategory: Category = { _id: 'general', name: 'General', slug: 'general', scope: 'all', color: 'primary', createdAt: '', updatedAt: '' };

const listCache: Record<string, { items: any[]; total: number }> = {};
const clearCache = () => {
  for (const key in listCache) delete listCache[key];
};

export default function NotebooksPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('all');
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

  const cacheKey = `${category}-${debouncedSearch}-${page}`;
  const cached = listCache[cacheKey] || { items: [], total: 0 };

  const [items, setItems] = useState<Notebook[]>(cached.items);
  const [total, setTotal] = useState(cached.total);
  const [loading, setLoading] = useState(cached.items.length === 0);

  const [delId, setDelId] = useState<string | null>(null);
  const [viewNote, setViewNote] = useState<Notebook | null>(null);
  const [categories, setCategories] = useState<Category[]>([fallbackCategory]);

  const load = useCallback(() => {
    const key = `${category}-${debouncedSearch}-${page}`;
    if (!listCache[key]) setLoading(true);
    api.notebooks.list({ category, search: debouncedSearch, page: String(page), limit: String(PAGE_SIZE) })
      .then((data: any) => {
        const resItems = data.items || [];
        const resTotal = data.total || 0;
        setItems(resItems);
        setTotal(resTotal);
        listCache[key] = { items: resItems, total: resTotal };
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [category, debouncedSearch, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => setPage(1), [debouncedSearch, category]);

  useEffect(() => {
    api.categories.list({ scope: 'notebook' }).then((items) => setCategories([fallbackCategory, ...items])).catch(() => {});
  }, []);

  const categoryOptions = useMemo(
    () => [{ value: 'all', label: 'All Categories' }, ...categories.map((item) => ({ value: item.slug, label: item.name }))],
    [categories]
  );

  const handleDelete = async () => {
    if (!delId) return;
    await api.notebooks.delete(delId);
    toast.success('Note deleted');
    clearCache();
    setDelId(null);
    load();
  };

  const togglePin = async (n: Notebook) => {
    await api.notebooks.update(n._id, { isPinned: !n.isPinned });
    clearCache();
    load();
  };

  const share = async (id: string) => {
    await copyShareUrl('notes', id);
    toast.success('Share link copied');
  };

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title="Notebooks" description="Write markdown notes for research, study plans, ideas, algorithms and learning logs." eyebrow="Study notes">
        <Button asChild>
          <Link to="/notebooks/new">
            <Plus className="h-4 w-4" /> New Note
          </Link>
        </Button>
      </PageHeader>

      <div className="surface flex flex-col gap-3 rounded-3xl p-3 sm:flex-row">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search notes..." />
        </div>
        <Select value={category} onChange={setCategory} options={categoryOptions} className="sm:w-40" />
      </div>

      {loading ? <Spinner /> : items.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6 text-muted-foreground" />}
          title="No notes yet"
          description="Create your first notebook to get started"
          action={<Button asChild><Link to="/notebooks/new"><Plus className="h-4 w-4 mr-2" /> New Note</Link></Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((n, i) => (
            <Card
              key={n._id}
              className="interactive-card group cursor-pointer rounded-3xl stagger-item"
              style={{ animationDelay: `${i * 50}ms` }}
              onClick={() => setViewNote(n)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {n.isPinned && <Pin className="h-3.5 w-3.5 text-warning shrink-0 fill-current" />}
                    <h3 className="font-semibold text-sm line-clamp-1">{n.title}</h3>
                  </div>
                  <div className="flex shrink-0 gap-0.5" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePin(n)}>
                      <Pin className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                      <Link to={`/notebooks/${n._id}/edit`}><Edit3 className="h-3.5 w-3.5" /></Link>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => share(n._id)}>
                      <Share2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDelId(n._id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <div className="prose-dark max-h-28 max-w-none overflow-hidden text-sm text-muted-foreground">
                    <MarkdownView allowHtml>{n.content || 'Empty note...'}</MarkdownView>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                </div>
                <div className="flex items-center gap-1.5 mt-4">
                  <Badge variant="outline" className="rounded-full text-[10px] font-normal">{categoryLabel(n.category, categories)}</Badge>
                  {n.tags.slice(0, 3).map(t => <Badge key={t} variant="secondary" className="rounded-full text-[10px] font-normal">{t}</Badge>)}
                  <span className="text-[11px] text-muted-foreground ml-auto">{formatDate(n.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PaginationControls page={page} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />

      <Dialog open={!!viewNote} onOpenChange={v => !v && setViewNote(null)} title={viewNote?.title || ''} maxWidth="sm:max-w-4xl">
        {viewNote && (
          <div className="prose-dark note-reading max-w-none">
            <MarkdownView allowHtml>{viewNote.content}</MarkdownView>
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={!!delId}
        onOpenChange={v => !v && setDelId(null)}
        onConfirm={handleDelete}
        title="Delete Note"
        description="This action cannot be undone. The note will be permanently removed."
      />
    </div>
  );
}
