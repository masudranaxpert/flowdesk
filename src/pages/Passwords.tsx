import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Plus, Trash2, Edit3, Globe, Key, Copy, RefreshCw, Eye, EyeOff, Lock, User, Link2, Tag, FileText, ShieldCheck, Shield, QrCode, Clock, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import { PageHeader, EmptyState, Spinner, SearchInput, ConfirmDialog, FormField, TagInput, PaginationControls } from '../components/UI';
import { Select } from '../components/Select';
import Dialog from '../components/Dialog';
import { formatDate, categoryLabel } from '../lib/utils';
import type { PasswordItem, Category, AuthenticatorItem } from '../types';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { generateTOTP, totpProgress, totpSecondsLeft } from '../lib/totp';

const emptyForm = { title: '', url: '', username: '', password: '', description: '', tags: [] as string[], category: 'general' };
const emptyAuthForm = { name: '', secret: '', issuer: '', account: '' };
const PAGE_SIZE = 9;
const fallbackCategory: Category = { _id: 'general', name: 'General', slug: 'general', scope: 'all', color: 'primary', createdAt: '', updatedAt: '' };

const listCache: Record<string, { items: any[]; total: number }> = {};
const clearCache = () => { for (const key in listCache) delete listCache[key]; };

function generatePassword(length = 20) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  let pass = "";
  for (let i = 0, n = chars.length; i < length; ++i) pass += chars.charAt(Math.floor(Math.random() * n));
  return pass;
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 14) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-400' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-400' };
  if (score <= 4) return { score, label: 'Strong', color: 'bg-emerald-500' };
  return { score, label: 'Very Strong', color: 'bg-emerald-400' };
}

function TOTPCard({ item, onEdit, onDelete }: { item: AuthenticatorItem; onEdit: () => void; onDelete: () => void }) {
  const [code, setCode] = useState('------');
  const [progress, setProgress] = useState(100);
  const [seconds, setSeconds] = useState(30);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    const update = async () => {
      if (!mounted) return;
      try {
        const c = await generateTOTP(item.secret, item.digits ?? 6, item.period ?? 30);
        setCode(c);
      } catch {
        setCode('ERROR');
      }
      setProgress(totpProgress(item.period ?? 30));
      setSeconds(totpSecondsLeft(item.period ?? 30));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => { mounted = false; clearInterval(interval); };
  }, [item.secret, item.digits, item.period]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      toast.success('Code copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const urgency = seconds <= 5 ? 'text-red-400' : seconds <= 10 ? 'text-orange-400' : 'text-emerald-400';
  const ringColor = seconds <= 5 ? 'ring-red-500/40 bg-red-500/10' : seconds <= 10 ? 'ring-orange-500/40 bg-orange-500/10' : 'ring-emerald-500/30 bg-emerald-500/10';
  const barColor = seconds <= 5 ? 'bg-red-500' : seconds <= 10 ? 'bg-orange-400' : 'bg-emerald-500';

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/60">
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ring-1 ${ringColor}`}>
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base leading-tight">{item.name}</h3>
                {(item.issuer || item.account) && (
                  <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                    {item.issuer && <span>{item.issuer}</span>}
                    {item.issuer && item.account && <span> · </span>}
                    {item.account && <span>{item.account}</span>}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background rounded-md shadow-sm border border-border p-0.5">
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-sm text-muted-foreground hover:text-primary" onClick={onEdit}>
                <Edit3 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-sm text-destructive hover:bg-destructive/10" onClick={onDelete}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="w-full group/code relative overflow-hidden rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors p-4 text-center"
          >
            <div className="font-mono text-3xl font-bold tracking-[0.3em] text-foreground group-hover/code:opacity-80 transition-opacity select-all">
              {code.slice(0, 3)} {code.slice(3)}
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/code:opacity-100 transition-opacity">
              {copied
                ? <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                : <Copy className="w-5 h-5 text-muted-foreground" />}
            </div>
          </button>

          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Expires in</span>
              <span className={`text-xs font-bold tabular-nums ${urgency}`}>{seconds}s</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PasswordsPage() {
  const [activeTab, setActiveTab] = useState<'passwords' | 'authenticator'>('passwords');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (search === '') { setDebouncedSearch(''); return; }
    const t = setTimeout(() => setDebouncedSearch(search), 300);
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
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [formPasswordVisible, setFormPasswordVisible] = useState(false);

  // Authenticator state
  const [authItems, setAuthItems] = useState<AuthenticatorItem[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authEditing, setAuthEditing] = useState<AuthenticatorItem | null>(null);
  const [authForm, setAuthForm] = useState(emptyAuthForm);
  const [authDelId, setAuthDelId] = useState<string | null>(null);
  const [authSearch, setAuthSearch] = useState('');

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
        const cats = [fallbackCategory, ...catRes.items.filter((c: Category) => c.scope === 'all' || c.scope === 'password' || c.scope === 'passwords')];
        setCategories(cats);
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to load passwords');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, category, cacheKey]);

  const loadAuthenticators = useCallback(async () => {
    setAuthLoading(true);
    try {
      const res = await api.authenticators.list({ limit: '100' });
      setAuthItems(res.items || []);
    } catch (e: any) {
      toast.error('Failed to load authenticators');
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { loadAuthenticators(); }, [loadAuthenticators]);

  const togglePasswordVisibility = (id: string) => setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied!`)).catch(() => toast.error(`Failed to copy ${label}`));
  };

  const openNew = () => { setEditing(null); setForm(emptyForm); setFormPasswordVisible(false); setDialogOpen(true); };
  const openEdit = (item: PasswordItem) => {
    setEditing(item);
    setForm({ title: item.title, url: item.url || '', username: item.username || '', password: item.password || '', description: item.description || '', tags: item.tags || [], category: item.category || 'general' });
    setFormPasswordVisible(false);
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.password.trim()) { toast.error('Title and Password are required'); return; }
    const data = { ...form, title: form.title.trim(), url: form.url.trim(), username: form.username.trim(), password: form.password, description: form.description.trim() };
    try {
      if (editing) { await api.passwords.update(editing._id, data); toast.success('Password updated'); }
      else { await api.passwords.create(data); toast.success('Password saved'); }
      setDialogOpen(false); clearCache(); loadData(true);
    } catch (e: any) { toast.error(e.message || 'Error saving password'); }
  };

  const remove = async () => {
    if (!delId) return;
    try { await api.passwords.delete(delId); toast.success('Password deleted'); clearCache(); loadData(true); }
    catch (e: any) { toast.error(e.message || 'Error deleting password'); }
    finally { setDelId(null); }
  };

  const openNewAuth = () => { setAuthEditing(null); setAuthForm(emptyAuthForm); setAuthDialogOpen(true); };
  const openEditAuth = (item: AuthenticatorItem) => {
    setAuthEditing(item);
    setAuthForm({ name: item.name, secret: item.secret, issuer: item.issuer || '', account: item.account || '' });
    setAuthDialogOpen(true);
  };

  const saveAuth = async () => {
    if (!authForm.name.trim() || !authForm.secret.trim()) { toast.error('Name and Secret Key are required'); return; }
    try {
      const cleaned = authForm.secret.trim().toUpperCase().replace(/\s/g, '');
      const data = { ...authForm, secret: cleaned };
      if (authEditing) { await api.authenticators.update(authEditing._id, data); toast.success('Authenticator updated'); }
      else { await api.authenticators.create(data); toast.success('Authenticator added'); }
      setAuthDialogOpen(false);
      loadAuthenticators();
    } catch (e: any) { toast.error(e.message || 'Error saving authenticator'); }
  };

  const removeAuth = async () => {
    if (!authDelId) return;
    try { await api.authenticators.delete(authDelId); toast.success('Authenticator removed'); loadAuthenticators(); }
    catch (e: any) { toast.error(e.message || 'Error deleting authenticator'); }
    finally { setAuthDelId(null); }
  };

  const catOptions = useMemo(() => [{ value: 'all', label: 'All Categories' }, ...categories.map(c => ({ value: c.slug, label: c.name }))], [categories]);
  const formCatOptions = useMemo(() => categories.map(c => ({ value: c.slug, label: c.name })), [categories]);
  const strength = getPasswordStrength(form.password);

  const filteredAuthItems = authItems.filter(a =>
    !authSearch || a.name.toLowerCase().includes(authSearch.toLowerCase()) || (a.issuer || '').toLowerCase().includes(authSearch.toLowerCase()) || (a.account || '').toLowerCase().includes(authSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Password Manager"
        description="Securely manage your passwords and 2FA codes"
      >
        {activeTab === 'passwords'
          ? <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Add Password</Button>
          : <Button onClick={openNewAuth}><Plus className="w-4 h-4 mr-2" /> Add Account</Button>}
      </PageHeader>

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-muted/40 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('passwords')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'passwords' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Key className="w-4 h-4" /> Passwords
          <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">{total}</Badge>
        </button>
        <button
          onClick={() => setActiveTab('authenticator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'authenticator' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Shield className="w-4 h-4" /> Authenticator
          {authItems.length > 0 && <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">{authItems.length}</Badge>}
        </button>
      </div>

      {/* ── PASSWORDS TAB ── */}
      {activeTab === 'passwords' && (
        <>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <SearchInput value={search} onChange={setSearch} placeholder="Search passwords, URLs..." />
            <Select value={category} onChange={setCategory} options={catOptions} className="w-full sm:w-48" />
          </div>

          {loading && <Spinner />}
          {!loading && items.length === 0 && (
            <EmptyState icon={<Key className="h-7 w-7" />} title="No passwords found" description="Add your first password to get started." action={<Button onClick={openNew}>Add Password</Button>} />
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
                          <span className="truncate mr-2 select-all">{visiblePasswords[item._id] ? item.password : '••••••••••••••••'}</span>
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
          {total > PAGE_SIZE && <PaginationControls page={page} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />}
        </>
      )}

      {/* ── AUTHENTICATOR TAB ── */}
      {activeTab === 'authenticator' && (
        <>
          <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center">
            <SearchInput value={authSearch} onChange={setAuthSearch} placeholder="Search accounts..." />
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg border border-border/40 shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>All codes generated offline · No server needed</span>
            </div>
          </div>

          {authLoading && <Spinner />}
          {!authLoading && filteredAuthItems.length === 0 && (
            <EmptyState
              icon={<Shield className="h-7 w-7" />}
              title="No authenticators yet"
              description="Add a 2FA account using the secret key from any website's 2FA setup page."
              action={<Button onClick={openNewAuth}><Plus className="w-4 h-4 mr-1.5" /> Add Account</Button>}
            />
          )}
          {!authLoading && filteredAuthItems.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAuthItems.map(item => (
                <TOTPCard
                  key={item._id}
                  item={item}
                  onEdit={() => openEditAuth(item)}
                  onDelete={() => setAuthDelId(item._id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Password Confirm Delete ── */}
      <ConfirmDialog
        open={!!delId}
        onOpenChange={(v: boolean) => { if (!v) setDelId(null); }}
        title="Delete Password"
        description="Are you sure you want to delete this password? This action cannot be undone."
        onConfirm={remove}
      />

      {/* ── Auth Confirm Delete ── */}
      <ConfirmDialog
        open={!!authDelId}
        onOpenChange={(v: boolean) => { if (!v) setAuthDelId(null); }}
        title="Remove Authenticator"
        description="Are you sure? You will lose access to this 2FA code. Make sure you have a backup."
        onConfirm={removeAuth}
      />

      {/* ── Password Add/Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title="" description="" maxWidth="max-w-2xl">
        <div className="-mt-2">
          <div className="relative -mx-5 -mt-4 mb-6 overflow-hidden rounded-t-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent px-6 pb-5 pt-6 sm:-mx-6 sm:-mt-5">
            <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-primary/15 blur-2xl" />
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/20 text-primary ring-1 ring-primary/30">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight">{editing ? 'Edit Password' : 'Add New Password'}</h2>
                <p className="text-sm text-muted-foreground">{editing ? 'Update your stored credentials' : 'Store credentials securely in your vault'}</p>
              </div>
              {editing && <div className="ml-auto flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"><ShieldCheck className="h-3 w-3" /> Editing</div>}
            </div>
          </div>
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Identity</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title <span className="text-destructive">*</span></label>
                  <div className="relative">
                    <Key className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Facebook, Gmail" className="pl-9" autoFocus />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80">URL <span className="text-muted-foreground font-normal text-xs">(optional)</span></label>
                  <div className="relative">
                    <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://example.com" type="url" className="pl-9" />
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-border/50" />
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Credentials</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80">Username / Email</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="username or email" className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password <span className="text-destructive">*</span></label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Enter or generate" type={formPasswordVisible ? 'text' : 'password'} className="pl-9 pr-10 font-mono" />
                      <button type="button" onClick={() => setFormPasswordVisible(!formPasswordVisible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground">
                        {formPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button type="button" variant="outline" size="icon" className="shrink-0 border-primary/25 text-primary hover:bg-primary/10 hover:text-primary" onClick={() => { setForm({ ...form, password: generatePassword() }); setFormPasswordVisible(true); }} title="Generate strong password">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  {form.password && (
                    <div className="space-y-1 pt-0.5">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(n => (
                          <div key={n} className={`h-1 flex-1 rounded-full transition-all duration-300 ${n <= strength.score ? strength.color : 'bg-muted/40'}`} />
                        ))}
                      </div>
                      <p className={`text-[11px] font-medium ${strength.score <= 1 ? 'text-red-400' : strength.score <= 2 ? 'text-orange-400' : strength.score <= 3 ? 'text-yellow-400' : 'text-emerald-400'}`}>{strength.label}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="border-t border-border/50" />
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Details</p>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Notes <span className="text-muted-foreground font-normal text-xs">(optional)</span></label>
                <div className="relative">
                  <FileText className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Security questions, 2FA backup codes, notes…" rows={2} className="pl-9 resize-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Category">
                  <Select value={form.category} onChange={val => setForm({ ...form, category: val })} options={formCatOptions} />
                </FormField>
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-foreground/80"><Tag className="h-3.5 w-3.5" /> Tags</label>
                  <TagInput tags={form.tags} onChange={tags => setForm({ ...form, tags })} />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <p className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Stored securely in your vault
            </p>
            <div className="flex w-full gap-3 sm:w-auto">
              <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={save} className="flex-1 gap-2 sm:flex-none">
                <Lock className="h-4 w-4" /> {editing ? 'Update' : 'Save Password'}
              </Button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* ── Authenticator Add/Edit Dialog ── */}
      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} title="" description="" maxWidth="max-w-lg">
        <div className="-mt-2">
          <div className="relative -mx-5 -mt-4 mb-6 overflow-hidden rounded-t-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent px-6 pb-5 pt-6 sm:-mx-6 sm:-mt-5">
            <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-emerald-500/15 blur-2xl" />
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight">{authEditing ? 'Edit Authenticator' : 'Add 2FA Account'}</h2>
                <p className="text-sm text-muted-foreground">Enter the secret key from your 2FA setup page</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Account Name <span className="text-destructive">*</span></label>
              <div className="relative">
                <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} placeholder="e.g. Google, GitHub, Discord" className="pl-9" autoFocus />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Secret Key <span className="text-destructive">*</span></label>
              <div className="relative">
                <Key className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={authForm.secret} onChange={e => setAuthForm({ ...authForm, secret: e.target.value })} placeholder="e.g. FXNNJHKEJXOQIWNN" className="pl-9 font-mono tracking-wider uppercase" />
              </div>
              <p className="text-xs text-muted-foreground">Enter the Base32 secret key from the website's 2FA setup page</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Issuer <span className="text-muted-foreground font-normal text-xs">(optional)</span></label>
                <Input value={authForm.issuer} onChange={e => setAuthForm({ ...authForm, issuer: e.target.value })} placeholder="e.g. Google" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Account Email <span className="text-muted-foreground font-normal text-xs">(optional)</span></label>
                <Input value={authForm.account} onChange={e => setAuthForm({ ...authForm, account: e.target.value })} placeholder="user@gmail.com" />
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p>Codes are generated <strong className="text-emerald-400">100% offline</strong> on your device using the TOTP algorithm (RFC 6238). Your secret key never leaves your device.</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
            <Button variant="outline" onClick={() => setAuthDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveAuth} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Shield className="h-4 w-4" /> {authEditing ? 'Update' : 'Add Authenticator'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
