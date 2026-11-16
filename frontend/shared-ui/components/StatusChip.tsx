import { cn } from '../lib/cn';

type ChipVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const styles: Record<ChipVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  danger: 'bg-red-50 text-red-700 ring-red-600/20',
  info: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  neutral: 'bg-slate-100 text-slate-700 ring-slate-500/20',
};

interface StatusChipProps {
  label: string;
  variant?: ChipVariant;
  className?: string;
}

export function StatusChip({ label, variant = 'neutral', className }: StatusChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        styles[variant],
        className
      )}
    >
      {label}
    </span>
  );
}
