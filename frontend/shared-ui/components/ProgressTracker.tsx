import { cn } from '../lib/cn';
import { Check } from 'lucide-react';

export interface ProgressStep {
  id: string;
  label: string;
  description?: string;
}

interface ProgressTrackerProps {
  steps: ProgressStep[];
  currentIndex: number;
  accentClass?: string;
  dark?: boolean;
}

export function ProgressTracker({ steps, currentIndex, accentClass = 'bg-red-600', dark }: ProgressTrackerProps) {
  return (
    <ol className="space-y-0">
      {steps.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        const pending = index > currentIndex;
        return (
          <li key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
            {index < steps.length - 1 ? (
              <span
                className={cn(
                  'absolute left-[15px] top-8 h-[calc(100%-8px)] w-0.5',
                  done ? accentClass : dark ? 'bg-slate-700' : 'bg-slate-200'
                )}
                aria-hidden
              />
            ) : null}
            <span
              className={cn(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-4',
                done && `${accentClass} text-white ring-white`,
                active && `${accentClass} text-white ring-white shadow-lg`,
                pending && (dark ? 'bg-slate-800 text-slate-500 ring-slate-900' : 'bg-slate-100 text-slate-400 ring-white')
              )}
            >
              {done ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <div className="pt-0.5">
              <p
                className={cn(
                  'text-sm font-semibold',
                  active && (dark ? 'text-amber-400' : 'text-slate-900'),
                  done && (dark ? 'text-slate-300' : 'text-slate-700'),
                  pending && (dark ? 'text-slate-500' : 'text-slate-400')
                )}
              >
                {step.label}
              </p>
              {step.description ? (
                <p className={cn('text-xs mt-0.5', dark ? 'text-slate-500' : 'text-slate-500')}>
                  {step.description}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
