import { useQuery } from '@tanstack/react-query';
import { Globe, Server } from 'lucide-react';
import { AccountSettings, PageTitleSync } from '@drrmo/ui';
import { resolveApiOrigin, resolveSocketUrl } from '@shared/src/api';
import { systemApi } from '@shared/src/services';
import { formatDuration, humanize } from '@shared/src/format';

export function Settings() {
  const health = useQuery({ queryKey: ['system-health'], queryFn: systemApi.health });
  const h = health.data;

  const rows = [
    { label: 'API endpoint', value: resolveApiOrigin() },
    { label: 'Realtime endpoint', value: resolveSocketUrl() },
    { label: 'Server environment', value: h ? humanize(h.api.environment) : '…' },
    { label: 'Server runtime', value: h ? `Node ${h.api.nodeVersion}` : '…' },
    { label: 'Uptime', value: h ? formatDuration(h.api.uptimeSeconds) : '…' },
    { label: 'Database', value: h ? `${h.database.name} · ${h.database.state}` : '…' },
    { label: 'Timezone', value: 'Asia/Manila (UTC+8)' },
  ];

  return (
    <div className="space-y-6">
      <PageTitleSync title="Settings" />

      <AccountSettings />

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          <Server className="h-5 w-5 text-slate-600" />
          Deployment
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Read-only. These values come from environment variables on Vercel (frontend) and Render (API).
        </p>
        <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="min-w-0">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{row.label}</dt>
              <dd className="mt-1 flex items-center gap-1.5 truncate font-mono text-sm text-slate-800">
                {row.label.includes('endpoint') ? <Globe className="h-3.5 w-3.5 shrink-0 text-slate-400" /> : null}
                <span className="truncate">{row.value}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
