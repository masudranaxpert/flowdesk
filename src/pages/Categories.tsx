import { useCallback, useEffect, useMemo, useState } from 'react';
import { FolderPlus, Tags, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { PageHeader, EmptyState, Spinner, FormField, PaginationControls } from '../components/UI';
import { Select } from '../components/Select';
import type { Category } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const scopeOptions = [
  { value: 'all', label: 'All Sections' },
  { value: 'bookmark', label: 'Bookmarks only' },
  { value: 'notebook', label: 'Notebooks only' },
  { value: 'code', label: 'Code Book only' },
  { value: 'question', label: 'Q&A only' },
];
const PAGE_SIZE = 12;

const listCache: Record<string, { items: any[]; total: number }> = {};
const clearCache = () => {
  for (const key in listCache) delete listCache[key];
};

export default function CategoriesPage() {
  const [name, setName] = useState('');
  const [scope, setScope] = useState('all');
  const [page, setPage] = useState(1);

  const cacheKey = `${page}`;
  const cached = listCache[cacheKey] || { items: [], total: 0 };

  const [items, setItems] = useState<Category[]>(cached.items);
  const [total, setTotal] = useState(cached.total);
  const [loading, setLoading] = useState(cached.items.length === 0);

  const load = useCallback(() => {
    const key = `${page}`;
    if (!listCache[key]) setLoading(true);
    api.categories.list({ page: String(page), limit: String(PAGE_SIZE) })
      .then((data: any) => {
        const resItems = data.items || [];
        const resTotal = data.total || 0;
        setItems(resItems);
        setTotal(resTotal);
        listCache[key] = { items: resItems, total: resTotal };
      })
      .catch(() => toast.error('Failed to load categories'))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => load(), [load]);

  const create = async () => {
    if (!name.trim()) return toast.error('Category name is required');
    try {
      await api.categories.create({ name: name.trim(), scope: scope as Category['scope'] });
      toast.success('Category created');
      setName('');
      setScope('all');
      clearCache();
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create category');
    }
  };

  const remove = async (id: string) => {
    await api.categories.delete(id);
    toast.success('Category deleted');
    clearCache();
    load();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Categories"
        eyebrow="Organization"
        description="Create your own categories for research, bookmarks, notes, code, and Q&A. They will appear in filters and forms."
      />

      <Card className="rounded-3xl">
        <CardContent className="grid gap-4 p-4 sm:grid-cols-[1fr_14rem_auto] sm:items-end">
          <FormField label="Category name">
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Research, AI, Web Dev..." />
          </FormField>
          <FormField label="Where to use">
            <Select value={scope} onChange={setScope} options={scopeOptions} />
          </FormField>
          <Button onClick={create} className="h-10">
            <FolderPlus className="h-4 w-4" />
            Create
          </Button>
        </CardContent>
      </Card>

      {loading ? <Spinner /> : items.length === 0 ? (
        <EmptyState
          icon={<Tags className="h-6 w-6" />}
          title="No custom categories"
          description="Create categories once and use them across bookmarks, notes, code snippets and questions."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((category) => (
            <Card key={category._id} className="interactive-card rounded-3xl">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/12 text-primary">
                  <Tags className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{category.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="secondary" className="rounded-full text-[10px]">{category.scope}</Badge>
                    <span className="text-xs text-muted-foreground">{category.slug}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => remove(category._id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PaginationControls page={page} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}
