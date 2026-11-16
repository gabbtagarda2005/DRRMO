import { useState } from 'react';
import { CheckCircle2, Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import type { ReportDefinition } from '@shared/src/exports';
import { errorMessage } from '@shared/src/format';
import { cn } from '../lib/cn';

type RunState = { status: 'idle' } | { status: 'running' } | { status: 'done'; count: number } | { status: 'error'; message: string };

/** Grid of one-click CSV report generators backed by live API data. */
export function ReportCenter({ reports, accentClass = 'bg-slate-800 hover:bg-slate-900' }: { reports: ReportDefinition[]; accentClass?: string }) {
  const [state, setState] = useState<Record<string, RunState>>({});

  const run = async (report: ReportDefinition) => {
    setState((s) => ({ ...s, [report.id]: { status: 'running' } }));
    try {
      const count = await report.run();
      setState((s) => ({ ...s, [report.id]: { status: 'done', count } }));
    } catch (error) {
      setState((s) => ({ ...s, [report.id]: { status: 'error', message: errorMessage(error) } }));
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {reports.map((report) => {
        const s = state[report.id] ?? { status: 'idle' };
        return (
          <article key={report.id} className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <FileSpreadsheet className="h-6 w-6 text-slate-500" />
            <h3 className="mt-3 font-semibold text-slate-900">{report.title}</h3>
            <p className="mt-1 flex-1 text-sm text-slate-500">{report.description}</p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={s.status === 'running'}
                onClick={() => run(report)}
                className={cn('inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60', accentClass)}
              >
                {s.status === 'running' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {s.status === 'running' ? 'Generating…' : 'Download CSV'}
              </button>
              {s.status === 'done' ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {s.count} rows
                </span>
              ) : null}
            </div>
            {s.status === 'error' ? <p className="mt-2 text-xs text-red-600">{s.message}</p> : null}
          </article>
        );
      })}
    </div>
  );
}
