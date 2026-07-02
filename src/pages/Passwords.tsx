import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2, Edit3, Globe, Key, Copy, RefreshCw, Eye, EyeOff, Search } from 'lucide-react';
import { api } from '../lib/api';
import { PageHeader, EmptyState, Spinner, SearchInput, ConfirmDialog, FormField, TagInput, PaginationControls } from '../components/UI';
import { Select } from '../components/Select';
import Dialog from '../components/Dialog';
import { formatDate, categoryLabel, copyToClipboard } from '../lib/utils';
import type { PasswordItem, Category } from '../types';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const emptyForm = { title: '', url: '', username: '', password: '', description: '', tags: [] as string[], category: 'general' };
const PAGE_SIZE = 9;
const fallbackCategory: Category = { _id: 'general', name: 'General', slug: 'general', scope: 'all', color: 'primary', createdAt: '', updatedAt: '' };

const listCache: Record<string, { items: any[]; total: number }> = {};
const clearCache = () => {
  for (const key in listCache) delete listCache[key];
};

function generatePassword(length = 16) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  let pass = "";
  for (let i = 0, n = chars.length; i < length; ++i) {
    pass += chars.charAt(Math.floor(Math.random() * n));
  }
  return pass;
}

export default function PasswordsPage() {
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

  const [items, setItems] = useState<PasswordItem[]>(cached.items);
  const [total, setTotal] = useState(cached.total);
  const [loading, setLoading] = useState(cached.items.length === 0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PasswordItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [delId, setDelId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([fallbackCategory]);
  
  // Visibility toggles for the list
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  // Visibility toggle for the form
  const [formPasswordVisible, setFormPasswordVisible] = useState(false);

  const loadData = useCallback(async (isBg = false) => {
    if (!isBg) setLoading(true);
    try {
      const p = { page: String(page), limit: String(PAGE_SIZE), q: debouncedSearch, category: category === 'all' ? '' : category };
      const [res, catRes] = await Promise.all([
        api.passwords.list(p),
        api.categories.list().catch(() => ({ items: [] }))
      ]);
      setItems(res.items || []);
      setTotal(res.total || 0);
      listCache[cacheKey] = { items: res.items || [], total: res.total || 0 };
      if (catRes.items) {
        const cats = [fallbackCategory, ...catRes.items.filter((c: Category) => c.scope === 'all')];
        setCategories(cats);
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to load passwords');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, category, cacheKey]);

  useEffect(() => { loadData(); }, [loadData]);

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (text: string, label: string) => {
    copyToClipboard(text);
    toast.success(`${label} copied to clipboard`);
  };

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormPasswordVisible(false);
    setDialogOpen(true);
  };

  const openEdit = (item: PasswordItem) => {
    setEditing(item);
    setForm({
      title: item.title,
      url: item.url || '',
      username: item.username || '',
      password: item.password || '',
      description: item.description || '',
      tags: item.tags || [],
      category: item.category || 'general'
    });
    setFormPasswordVisible(false);
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.password.trim()) {
      toast.error('Title and Password are required');
      return;
    }
    const data = {
      ...form,
      title: form.title.trim(),
      url: form.url.trim(),
      username: form.username.trim(),
      password: form.password,
      description: form.description.trim()
    };
    try {
      if (editing) {
        await api.passwords.update(editing._id, data);
        toast.success('Password updated');
      } else {
        await api.passwords.create(data);
        toast.success('Password saved');
      }
      setDialogOpen(false);
      clearCache();
      loadData(true);
    } catch (e: any) {
      toast.error(e.message || 'Error saving password');
    }
  };

  const remove = async () => {
    if (!delId) return;
    try {
      await api.passwords.delete(delId);
      toast.success('Password deleted');
      clearCache();
      loadData(true);
    } catch (e: any) {
      toast.error(e.message || 'Error deleting password');
    } finally {
      setDelId(null);
    }
  };

  const catOptions = useMemo(() => [
    { value: 'all', label: 'All Categories' },
    ...categories.map(c => ({ value: c.slug, label: c.name }))
  ], [categories]);

  const formCatOptions = useMemo(() => categories.map(c => ({ value: c.slug, label: c.name })), [categories]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Password Manager" 
        icon={Key} 
        description="Securely manage and group your passwords"
        action={<Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Add Password</Button>}
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search passwords, URLs..." />
        <Select value={category} onChange={setCategory} options={catOptions} className="w-full sm:w-48" />
      </div>

      {loading && <Spinner />}
      
      {!loading && items.length === 0 && (
        <EmptyState icon={Key} title="No passwords found" description="Add your first password to get started." action={<Button onClick={openNew}>Add Password</Button>} />
      )}

      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <Card key={item._id} className="overflow-hidden hover:shadow-md transition-shadow group">
              <CardContent className="p-0">
                <div className="p-5 border-b border-border/50 bg-muted/20">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Key className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold truncate text-lg">{item.title}</h3>
                      </div>
                      {item.url && (
                        <a href={item.url.startsWith('http') ? item.url : `https://${item.url}`} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 w-max">
                          <Globe className="w-3 h-3" />
                          <span className="truncate max-w-[200px]">{item.url}</span>
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background rounded-md shadow-sm border border-border p-0.5">
                      <Button variant="ghost" size="icon" className="w-8 h-8 rounded-sm text-muted-foreground hover:text-primary" onClick={() => openEdit(item)}>
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-8 h-8 rounded-sm text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDelId(item._id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {item.username && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Username / Email</p>
                      <div className="flex items-center justify-between bg-muted/40 p-2 rounded-md font-mono text-sm">
                        <span className="truncate mr-2 select-all">{item.username}</span>
                        <Button variant="ghost" size="icon" className="w-6 h-6 shrink-0" onClick={() => handleCopy(item.username, 'Username')}>
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Password</p>
                    <div className="flex items-center justify-between bg-muted/40 p-2 rounded-md font-mono text-sm">
                      <span className="truncate mr-2 select-all">
                        {visiblePasswords[item._id] ? item.password : '••••••••••••••••'}
                      </span>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => togglePasswordVisibility(item._id)}>
                          {visiblePasswords[item._id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => handleCopy(item.password, 'Password')}>
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {item.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{item.description}</p>}

                  <div className="flex items-center gap-2 pt-2">
                    <Badge variant="outline" className="text-xs">{categoryLabel(item.category, categories)}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {total > PAGE_SIZE && <PaginationControls page={page} total={total} pageSize={PAGE_SIZE} setPage={setPage} />}

      <ConfirmDialog
        isOpen={!!delId}
        title="Delete Password"
        description="Are you sure you want to delete this password? This action cannot be undone."
        onConfirm={remove}
        onCancel={() => setDelId(null)}
        confirmText="Delete"
        variant="danger"
      />

      <Dialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? 'Edit Password' : 'Add Password'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Title *" id="title">
              <Input id="title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Facebook, Gmail" autoFocus />
            </FormField>
            
            <FormField label="URL (Optional)" id="url">
              <Input id="url" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://example.com" type="url" />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Username / Email" id="username">
              <Input id="username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="username or email" />
            </FormField>

            <FormField label="Password *" id="password">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input 
                    id="password" 
                    value={form.password} 
                    onChange={e => setForm({ ...form, password: e.target.value })} 
                    placeholder="Enter or generate password" 
                    type={formPasswordVisible ? 'text' : 'password'}
                    className="pr-10"
                  />
                  <button 
                    type="button" 
                    onClick={() => setFormPasswordVisible(!formPasswordVisible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {formPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button type="button" variant="outline" size="icon" onClick={() => { setForm({ ...form, password: generatePassword() }); setFormPasswordVisible(true); }} title="Generate Password">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </FormField>
          </div>

          <FormField label="Description (Optional)" id="description">
            <Textarea id="description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Security questions, notes, etc." rows={3} />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Category" id="category">
              <Select id="category" value={form.category} onChange={val => setForm({ ...form, category: val })} options={formCatOptions} />
            </FormField>
            <FormField label="Tags" id="tags">
              <TagInput tags={form.tags} onChange={tags => setForm({ ...form, tags })} />
            </FormField>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={save}>Save Password</Button>
        </div>
      </Dialog>
    </div>
  );
}
