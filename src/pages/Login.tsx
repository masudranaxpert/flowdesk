import { Link } from 'react-router-dom';
import { type FormEvent, useState } from 'react';
import { BookOpen, Code2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await api.auth.login({ email, password });
      localStorage.setItem('auth-token', data.token);
      localStorage.setItem('auth-user', JSON.stringify(data.user));
      location.href = '/';
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 animate-fade-in lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl gap-6 lg:grid-cols-2 lg:items-center">
      <section className="hidden min-h-[34rem] flex-col justify-between rounded-3xl border border-border bg-card/70 p-8 lg:flex">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            BookmarkVault
          </div>
          <h1 className="mt-8 max-w-xl text-5xl font-semibold tracking-tight">
            Your personal knowledge memory system.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
            Keep answers, reusable code, notes and bookmarks organized with a clean shadcn-style workspace.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-muted/35 p-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <p className="mt-3 text-sm font-medium">Markdown notes</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/35 p-4">
            <Code2 className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-medium">Code book</p>
          </div>
        </div>
      </section>

      <main className="grid place-items-center">
        <Card className="w-full max-w-md rounded-3xl">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-7">
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground lg:hidden">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Login to continue managing your CP workspace.</p>
            </div>

            <form className="grid gap-4" onSubmit={submit}>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center gap-3">
                  <Label htmlFor="password">Password</Label>
                  <Link to="#" className="ml-auto text-sm font-medium text-primary hover:underline">
                    Forgot?
                  </Link>
                </div>
                <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </div>
              <Button type="submit" className="h-10 w-full" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              New here?{' '}
              <Link to="/signup" className="font-medium text-primary hover:underline">
                Create account
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
      </div>
    </div>
  );
}
