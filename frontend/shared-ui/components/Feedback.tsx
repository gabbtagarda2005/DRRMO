import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/cn';

export function LoadingState({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white p-10 text-sm text-slate-500', className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center gap-3 rounded-2xl border border-red-100 bg-red-50/60 p-8 text-center', className)}>
      <AlertTriangle className="h-6 w-6 text-red-600" />
      <p className="text-sm font-medium text-red-800">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center', className)}>
      <Inbox className="h-7 w-7 text-slate-300" />
      <p className="font-medium text-slate-700">{title}</p>
      {description ? <p className="max-w-sm text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/** Inline banner for mutation results (success or failure). */
export function Notice({
  tone,
  children,
  onDismiss,
  className,
}: {
  tone: 'success' | 'error';
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const success = tone === 'success';
  const Icon = success ? CheckCircle2 : AlertTriangle;
  return (
    <div
      role={success ? 'status' : 'alert'}
      className={cn(
        'flex items-start gap-2 rounded-xl border px-4 py-3 text-sm',
        success ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800',
        className
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">{children}</div>
      {onDismiss ? (
        <button type="button" onClick={onDismiss} className="text-xs font-semibold opacity-70 hover:opacity-100">
          Dismiss
        </button>
      ) : null}
    </div>
  );
}
