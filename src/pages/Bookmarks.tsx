import { useState, useEffect, useCallback, useMemo } from 'react';
import { ExternalLink, Heart, Plus, Trash2, Edit3, Globe, Bookmark, Share2 } from 'lucide-react';
import { api } from '../lib/api';
import { PageHeader, EmptyState, Spinner, SearchInput, ConfirmDialog, FormField, TagInput, PaginationControls } from '../components/UI';
import { Select } from '../components/Select';
import Dialog from '../components/Dialog';
import { formatDate, getFavicon, normalizeUrl, copyShareUrl, fuzzyMatch, categoryLabel } from '../lib/utils';
import type { Bookmark as BookmarkType, Category } from '../types';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const emptyForm = { url: '', title: '', description: '', tags: [] as string[], category: 'general' };
const PAGE_SIZE = 9;
const fallbackCategory: Category = { _id: 'general', name: 'General', slug: 'general', scope: 'all', color: 'primary', createdAt: '', updatedAt: '' };

export default function BookmarksPage() {
  const [items, setItems] = useState<BookmarkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState<BookmarkType | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [delId, setDelId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([fallbackCategory]);

  const load = useCallback(() => {
    setLoading(true);
    api.bookmarks.list({ category, search, page: String(page), limit: String(PAGE_SIZE) })
      .then((data: any) => {
        setItems(data.items || []);
        setTotal(data.total || 0);
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [category, search, page]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);
  useEffect(() => setPage(1), [search, category]);

  useEffect(() => {
    api.categories.list({ scope: 'bookmark' }).then((items) => setCategories([fallbackCategory, ...items])).catch(() => {});
  }, []);

  const formCategoryOptions = useMemo(() => categories.map((item) => ({ value: item.slug, label: item.name })), [categories]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (b: BookmarkType) => { setEditing(b); setForm({ url: b.url, title: b.title, description: b.description, tags: b.tags, category: b.category }); setDialogOpen(true); };

  const handleSubmit = async () => {
    if (!form.url || !form.title) return toast.error('URL and title are required');
    try {
      const url = normalizeUrl(form.url);
      if (editing) {
        await api.bookmarks.update(editing._id, { ...form, url, favicon: getFavicon(url) });
        toast.success('Bookmark updated');
      } else {
        await api.bookmarks.create({ ...form, url, favicon: getFavicon(url) });
        toast.success('Bookmark created');
      }
      setDialogOpen(false);
      load();
    } catch { toast.error('Failed to save'); }
  };

  const handleDelete = async () => {
    if (!delId) return;
    await api.bookmarks.delete(delId);
    toast.success('Bookmark deleted');
    setDelId(null);
    load();
  };

  const toggleFav = async (b: BookmarkType) => {
    await api.bookmarks.update(b._id, { isFavorite: !b.isFavorite });
    load();
  };

  const share = async (id: string) => {
    await copyShareUrl('bookmarks', id);
    toast.success('Share link copied');
  };

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title="Bookmarks" description="Save platforms, editorials, blogs, tools and tutorial links with category tags." eyebrow="Resource library">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Bookmark
        </Button>
      </PageHeader>

      <div className="surface flex flex-col gap-3 rounded-3xl p-3 sm:flex-row">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search bookmarks..." />
        </div>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        <Button variant={category === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setCategory('all')}>All</Button>
        {categories.map((item) => (
          <Button key={item.slug} variant={category === item.slug ? 'default' : 'outline'} size="sm" onClick={() => setCategory(item.slug)}>
            {item.name}
          </Button>
        ))}
      </div>

      {loading ? <Spinner /> : items.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="h-6 w-6 text-muted-foreground" />}
          title="No bookmarks yet"
          description="Save your first bookmark to get started"
          action={<Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Add Bookmark</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((b, i) => (
            <Card key={b._id} className="interactive-card group rounded-3xl stagger-item" style={{ animationDelay: `${i * 45}ms` }}>
              <CardContent className="flex h-full flex-col p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-border bg-muted/70">
                    <img
                      src={b.favicon || getFavicon(b.url)}
                      alt=""
                      className="h-5 w-5 rounded-sm"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm line-clamp-1">{b.title}</h3>
                      <button onClick={() => toggleFav(b)} className="shrink-0 rounded-full p-1 transition-all duration-200 hover:scale-110 hover:bg-muted">
                        <Heart className={`h-3.5 w-3.5 transition-colors ${b.isFavorite ? 'fill-destructive text-destructive' : 'text-muted-foreground/40 hover:text-destructive'}`} />
                      </button>
                    </div>
                    <a href={normalizeUrl(b.url)} target="_blank" rel="noopener" className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-0.5 truncate transition-colors">
                      <Globe className="h-3 w-3 shrink-0" />
                      <span className="truncate">{b.url}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                    {b.description && <p className="mt-3 text-sm leading-6 text-muted-foreground line-clamp-2">{b.description}</p>}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <Badge variant="outline" className="rounded-full text-[10px] font-normal">{categoryLabel(b.category, categories)}</Badge>
                      {b.tags.length > 0 && (
                        <>
                        {b.tags.map(t => <Badge key={t} variant="secondary" className="rounded-full text-[10px] font-normal">{t}</Badge>)}
                        </>
                      )}
                    </div>
                    <div className="mt-4 flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(b)}>
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => share(b._id)}>
                        <Share2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDelId(b._id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <span className="ml-auto text-[11px] text-muted-foreground">{formatDate(b.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PaginationControls page={page} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? 'Edit Bookmark' : 'Add Bookmark'}>
        <div className="space-y-4">
          <FormField label="URL">
            <Input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
          </FormField>
          <FormField label="Title">
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Bookmark title" />
          </FormField>
          <FormField label="Description">
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
          </FormField>
          <FormField label="Category">
            <Select value={form.category} onChange={v => setForm({ ...form, category: v })} options={formCategoryOptions} />
          </FormField>
          <FormField label="Tags">
            <TagInput tags={form.tags} onChange={tags => setForm({ ...form, tags })} />
          </FormField>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!delId}
        onOpenChange={v => !v && setDelId(null)}
        onConfirm={handleDelete}
        title="Delete Bookmark"
        description="This action cannot be undone. The bookmark will be permanently removed."
      />
    </div>
  );
}
