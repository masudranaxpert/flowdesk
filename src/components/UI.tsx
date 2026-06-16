import { ReactNode } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface flex min-h-[22rem] flex-col items-center justify-center rounded-3xl px-6 py-14 text-center animate-fade-in">
      <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-border bg-muted/70 text-muted-foreground">
        {icon || <Inbox className="h-7 w-7" />}
      </div>
      <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  eyebrow = 'Workspace',
  children,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  children?: ReactNode;
}) {
  return (
    <div className="surface rounded-3xl p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
          {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}
        </div>
        {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
      </div>
    </div>
  );
}

export function Spinner({ size = 'default' }: { size?: 'sm' | 'default' }) {
  return (
    <div className="grid min-h-[18rem] place-items-center">
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-primary/25 border-t-primary',
          size === 'sm' ? 'h-5 w-5' : 'h-8 w-8'
        )}
      />
    </div>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => onOpenChange(false)}>
      <div className="fixed inset-0 bg-black/65 backdrop-blur-sm" />
      <Card
        className="relative w-full max-w-sm rounded-3xl p-6 shadow-2xl shadow-black/30 animate-scale-in"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-destructive/12 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Delete
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-2xl bg-card/75 pl-10 shadow-sm"
      />
    </div>
  );
}

export function TagInput({
  tags,
  onChange,
  placeholder = 'Add tag and press Enter...',
}: {
  tags: string[];
  onChange: (t: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex min-h-11 flex-wrap gap-2 rounded-2xl border border-input bg-card/75 px-3 py-2 shadow-sm transition focus-within:ring-2 focus-within:ring-ring/35">
      {tags.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-xl bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((item) => item !== tag))}
            className="rounded-full p-0.5 text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground"
            aria-label={`Remove ${tag}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        placeholder={tags.length === 0 ? placeholder : ''}
        className="min-w-[8rem] flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
        onKeyDown={(event) => {
          if (event.key === 'Enter' && event.currentTarget.value.trim()) {
            event.preventDefault();
            const value = event.currentTarget.value.trim();
            if (!tags.includes(value)) onChange([...tags, value]);
            event.currentTarget.value = '';
          }
        }}
      />
    </div>
  );
}

export function FormField({
  label,
  children,
  description,
}: {
  label: string;
  children: ReactNode;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground/90">{label}</label>
      {children}
      {description && <p className="text-xs leading-5 text-muted-foreground">{description}</p>}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

export function PaginationControls({
  page,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;

  return (
    <div className="surface flex flex-col gap-3 rounded-3xl p-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{(page - 1) * pageSize + 1}</span>-
        <span className="font-medium text-foreground">{Math.min(page * pageSize, total)}</span> of{' '}
        <span className="font-medium text-foreground">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" disabled={page === 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="rounded-xl border border-border bg-muted/45 px-3 py-1.5 text-sm font-medium">
          {page} / {pageCount}
        </div>
        <Button variant="outline" size="icon" disabled={page === pageCount} onClick={() => onPageChange(page + 1)} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
