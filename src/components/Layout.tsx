import { ReactNode, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Bookmark,
  Bot,
  CalendarDays,
  Code2,
  Command,
  Tags,
  HelpCircle,
  LayoutDashboard,
  Menu,
  Moon,
  PanelLeftClose,
  Plus,
  Search,
  Sparkles,
  Sun,
  X,
  User,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import Dialog from './Dialog';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { cn, fuzzyMatch } from '../lib/utils';
import type { Bookmark as BookmarkType, CodeSnippet, Notebook, Question, RoutineItem } from '../types';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', hint: 'Overview' },
  { to: '/chatbot', icon: Bot, label: 'Chatbot', hint: 'AI' },
  { to: '/routine', icon: CalendarDays, label: 'Routine', hint: 'Planner' },
  { to: '/bookmarks', icon: Bookmark, label: 'Bookmarks', hint: 'Links' },
  { to: '/notebooks', icon: BookOpen, label: 'Notebooks', hint: 'Notes' },
  { to: '/codes', icon: Code2, label: 'Code Book', hint: 'Snippets' },
  { to: '/questions', icon: HelpCircle, label: 'Q&A', hint: 'Problems' },
  { to: '/categories', icon: Tags, label: 'Categories', hint: 'Organize' },
];

const quickActions = [
  { to: '/chatbot', label: 'Ask AI', icon: Bot },
  { to: '/bookmarks', label: 'Save link', icon: Bookmark },
  { to: '/notebooks/new', label: 'Write note', icon: BookOpen },
  { to: '/questions/new', label: 'Add question', icon: HelpCircle },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-20 items-center gap-3 px-5">
        <Link to="/" onClick={onNavigate} className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-primary/30 bg-primary text-primary-foreground shadow-[0_16px_40px_oklch(0.795_0.184_86.047/0.25)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-tight text-sidebar-foreground">BookmarkVault</p>
            <p className="truncate text-xs text-sidebar-foreground/55">Knowledge command center</p>
          </div>
        </Link>
      </div>

      <div className="px-3">
        <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/60 p-3">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium text-sidebar-foreground/65">
            <Command className="h-3.5 w-3.5" />
            Quick create
          </div>
          <div className="grid gap-1.5">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.to}
                onClick={onNavigate}
                className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-sidebar-foreground transition hover:bg-background/70"
              >
                <action.icon className="h-4 w-4 text-sidebar-primary" />
                <span>{action.label}</span>
                <Plus className="ml-auto h-3.5 w-3.5 text-sidebar-foreground/40" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <nav className="mt-5 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/40">
          Workspace
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-[0_12px_30px_oklch(0.795_0.184_86.047/0.25)]'
                  : 'text-sidebar-foreground/72 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )
            }
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            <span>{item.label}</span>
            <span className="ml-auto hidden text-[11px] font-normal opacity-55 xl:inline">{item.hint}</span>
          </NavLink>
        ))}
      </nav>

      <div className="h-3" />
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; type: string; title: string; subtitle: string; to: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('theme') !== 'light');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    const q = globalSearch.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      api.search(q)
        .then((items) => setSearchResults(items || []))
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(t);
  }, [globalSearch]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isSearchShortcut =
        (event.key === '/' && !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)) ||
        (event.key === 'k' && (event.ctrlKey || event.metaKey));

      if (isSearchShortcut) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const active = useMemo(
    () => navItems.find((item) => (item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to))) ?? navItems[0],
    [location.pathname]
  );
  const logout = () => {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-user');
    navigate('/login');
  };

  const [profileOpen, setProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'danger'>('profile');

  const currentUser = useMemo(() => {
    try {
      const stored = localStorage.getItem('auth-user');
      return stored ? JSON.parse(stored) : { name: '', email: '' };
    } catch {
      return { name: '', email: '' };
    }
  }, [profileOpen]);

  const [newName, setNewName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (profileOpen) {
      setNewName(currentUser.name);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setDeleteConfirmEmail('');
      setActiveTab('profile');
    }
  }, [profileOpen, currentUser]);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return toast.error('Name is required');
    setProfileLoading(true);
    try {
      const data = await api.auth.updateProfile({ name: newName.trim() });
      localStorage.setItem('auth-user', JSON.stringify(data.user));
      toast.success(data.message || 'Profile updated successfully');
      setProfileOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    if (newPassword !== confirmPassword) return toast.error('New passwords do not match');
    setProfileLoading(true);
    try {
      const data = await api.auth.changePassword({ currentPassword, newPassword });
      toast.success(data.message || 'Password changed successfully');
      setProfileOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleDeleteAccount = async (e: FormEvent) => {
    e.preventDefault();
    if (deleteConfirmEmail !== currentUser.email) return toast.error('Email confirmation does not match');
    setProfileLoading(true);
    try {
      const data = await api.auth.deleteAccount();
      toast.success(data.message || 'Account deleted successfully');
      localStorage.removeItem('auth-token');
      localStorage.removeItem('auth-user');
      navigate('/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete account');
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-y-0 left-0 z-30 hidden w-[18.5rem] border-r border-sidebar-border bg-sidebar/92 backdrop-blur-xl lg:block">
        <SidebarContent />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-[86vw] max-w-[20rem] border-r border-sidebar-border bg-sidebar shadow-2xl animate-slide-right">
            <div className="absolute right-3 top-3 z-10">
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-col lg:pl-[18.5rem]">
        <header className="sticky top-0 z-20 border-b border-border/70 bg-background/78 backdrop-blur-xl">
          <div className="flex min-h-16 items-center gap-2 px-3 py-2 sm:px-5 lg:h-16 lg:px-7 lg:py-0">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>

            <div className="min-w-0 flex-1 md:flex-none">
              <div className="truncate text-xs text-muted-foreground md:flex md:items-center md:gap-2">
                <PanelLeftClose className="hidden h-3.5 w-3.5 lg:block" />
                Knowledge workspace
              </div>
              <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">{active.label}</h1>
            </div>

            <button type="button" onClick={() => setSearchOpen(true)} className="ml-auto hidden min-w-[16rem] max-w-md flex-1 cursor-pointer items-center rounded-2xl border border-border bg-card/70 px-3 py-2 text-left shadow-sm transition hover:bg-muted/50 md:flex">
              <Search className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Search inside each section</span>
              <kbd className="ml-auto rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">/</kbd>
            </button>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <Button variant="outline" size="icon" className="md:hidden" onClick={() => setSearchOpen(true)} aria-label="Search">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setDark((value) => !value)} aria-label="Toggle theme">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="outline" onClick={() => setProfileOpen(true)} aria-label="Profile">
                <User className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Profile</span>
              </Button>
              <Button variant="outline" className="hidden sm:inline-flex" onClick={logout}>Logout</Button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-24 pt-5 sm:px-5 lg:px-7 lg:pb-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>

        <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-6 rounded-2xl border border-border bg-card/90 p-1 shadow-2xl backdrop-blur-xl lg:hidden">
          {navItems.filter((item) => ['/', '/chatbot', '/routine', '/bookmarks', '/notebooks', '/questions'].includes(item.to)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium transition',
                  isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              <span className="max-w-full truncate px-1">{item.label.replace('Bookmarks', 'Links').replace('Notebooks', 'Notes')}</span>
            </NavLink>
          ))}
        </nav>

        {searchOpen && (
          <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/65 p-3 pt-20 backdrop-blur-sm sm:p-6">
            <div className="w-full max-w-2xl rounded-3xl border border-border bg-card p-3 shadow-2xl">
              <div className="flex items-center gap-2">
                <Search className="ml-2 h-4 w-4 text-muted-foreground" />
                <Input autoFocus value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} placeholder="Search bookmarks, notes, code, questions, routine..." className="border-0 bg-transparent shadow-none focus-visible:ring-0" />
                <Button variant="ghost" size="icon" onClick={() => setSearchOpen(false)} aria-label="Close search">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto">
                {searching ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <p className="px-3 py-8 text-center text-sm text-muted-foreground">{globalSearch ? 'No result found.' : 'Start typing to search your workspace.'}</p>
                ) : searchResults.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    onClick={() => {
                      setSearchOpen(false);
                      setGlobalSearch('');
                      navigate(item.to);
                    }}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-border bg-muted/30 p-3 text-left transition hover:bg-muted/60"
                  >
                    <Badge variant="secondary" className="rounded-full">{item.type}</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{item.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {profileOpen && (
          <Dialog open={profileOpen} onOpenChange={setProfileOpen} title="Account Settings" description="Manage your account profile, password, or delete your account.">
            <div className="flex border-b border-border mb-4">
              <button
                type="button"
                className={cn(
                  "flex-1 pb-2 text-sm font-medium border-b-2 transition-colors",
                  activeTab === 'profile'
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab('profile')}
              >
                Profile Details
              </button>
              <button
                type="button"
                className={cn(
                  "flex-1 pb-2 text-sm font-medium border-b-2 transition-colors",
                  activeTab === 'password'
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab('password')}
              >
                Password
              </button>
              <button
                type="button"
                className={cn(
                  "flex-1 pb-2 text-sm font-medium border-b-2 transition-colors",
                  activeTab === 'danger'
                    ? "border-destructive text-destructive"
                    : "border-transparent text-muted-foreground hover:text-destructive"
                )}
                onClick={() => setActiveTab('danger')}
              >
                Danger Zone
              </button>
            </div>

            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="profile-email">Email Address</Label>
                  <Input id="profile-email" type="email" value={currentUser.email} disabled className="opacity-60 cursor-not-allowed bg-muted" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="profile-name">Full Name</Label>
                  <Input id="profile-name" type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full animate-fade-in" disabled={profileLoading}>
                  {profileLoading ? 'Saving changes...' : 'Save Profile'}
                </Button>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="current-pass">Current Password</Label>
                  <Input id="current-pass" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-pass">New Password</Label>
                  <Input id="new-pass" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-pass">Confirm New Password</Label>
                  <Input id="confirm-pass" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
                </div>
                <Button type="submit" className="w-full animate-fade-in" disabled={profileLoading}>
                  {profileLoading ? 'Changing password...' : 'Update Password'}
                </Button>
              </form>
            )}

            {activeTab === 'danger' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                  <p className="font-semibold">Warning: Account deletion is permanent!</p>
                  <p className="mt-1 text-destructive/80 leading-normal">
                    All database data, including bookmarks, notes, code snippets, routines, categories, and AI settings, will be completely deleted and cannot be recovered.
                  </p>
                </div>
                <form onSubmit={handleDeleteAccount} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="delete-email">
                      To confirm, please type your email: <span className="font-semibold select-all">{currentUser.email}</span>
                    </Label>
                    <Input id="delete-email" type="email" value={deleteConfirmEmail} onChange={(e) => setDeleteConfirmEmail(e.target.value)} placeholder="Enter your email to confirm" required />
                  </div>
                  <Button type="submit" variant="destructive" className="w-full animate-fade-in" disabled={profileLoading || deleteConfirmEmail !== currentUser.email}>
                    {profileLoading ? 'Deleting account...' : 'Permanently Delete My Account'}
                  </Button>
                </form>
              </div>
            )}
          </Dialog>
        )}
      </div>
    </div>
  );
}
