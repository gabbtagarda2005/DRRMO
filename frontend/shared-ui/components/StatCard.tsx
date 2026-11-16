import { cn } from '../lib/cn';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  dark?: boolean;
}

export function StatCard({ label, value, hint, icon: Icon, trend, className, dark }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-5 shadow-sm transition hover:shadow-md',
        dark
          ? 'border-slate-800 bg-slate-900/80 hover:border-amber-500/30'
          : 'border-slate-100/80 bg-white hover:border-slate-200',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={cn('text-sm font-medium', dark ? 'text-slate-400' : 'text-slate-500')}>{label}</p>
          <p className={cn('mt-1 text-2xl font-bold tracking-tight', dark ? 'text-white' : 'text-slate-900')}>
            {value}
          </p>
          {hint ? (
            <p
              className={cn(
                'mt-1 text-xs',
                trend === 'up' && 'text-emerald-600',
                trend === 'down' && 'text-red-600',
                !trend && (dark ? 'text-slate-500' : 'text-slate-400')
              )}
            >
              {hint}
            </p>
          ) : null}
        </div>
        {Icon ? (
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
              dark ? 'bg-amber-500/15 text-amber-400' : 'bg-slate-100 text-slate-600'
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
