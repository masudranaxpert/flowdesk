import { Link } from 'react-router-dom';
import { type FormEvent, useState } from 'react';
import { ArrowLeft, KeyRound, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [loading, setLoading] = useState(false);

  const handleRequest = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await api.auth.forgotPassword({ email });
      setStep('reset');
      toast.success(data.message || 'Password reset code sent to your email');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await api.auth.resetPassword({ email, code, newPassword });
      toast.success(data.message || 'Password reset successful');
      location.href = '/login';
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reset password');
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
              Regain access to your workspace.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
              Don't worry, it happens to the best of us. Let's get your account secured and back online.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-muted/35 p-4">
              <KeyRound className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-medium">Secure Reset</p>
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
                <h2 className="text-2xl font-semibold tracking-tight">
                  {step === 'reset' ? 'Set new password' : 'Reset password'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {step === 'reset' 
                    ? `Enter the verification code sent to ${email} and your new password.` 
                    : 'Enter your email address to receive a 6-digit reset code.'}
                </p>
              </div>

              {step === 'reset' ? (
                <form className="grid gap-4" onSubmit={handleReset}>
                  <div className="grid gap-2">
                    <Label htmlFor="code">Verification Code</Label>
                    <Input id="code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="123456" maxLength={6} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="••••••••" required />
                  </div>
                  <Button type="submit" className="h-10 w-full" disabled={loading}>
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </Button>
                  <Button type="button" variant="outline" className="h-10 w-full" onClick={() => setStep('request')}>
                    Back
                  </Button>
                </form>
              ) : (
                <form className="grid gap-4" onSubmit={handleRequest}>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
                  </div>
                  <Button type="submit" className="h-10 w-full" disabled={loading}>
                    {loading ? 'Sending code...' : 'Send reset code'}
                  </Button>
                </form>
              )}

              <p className="mt-6 text-center text-sm text-muted-foreground">
                <Link to="/login" className="inline-flex items-center gap-2 font-medium text-primary hover:underline">
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Link>
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
