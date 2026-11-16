import { useQuery } from '@tanstack/react-query';
import { PageTitleSync, StatusChip } from '@drrmo/ui';
import { RISK_LEVEL_COLORS } from '@shared/constants';
import { MapPin } from 'lucide-react';
import { IncidentMap } from '../components/IncidentMap';
import { useIncidentRealtimeSync } from '../hooks/useIncidentRealtimeSync';
import { fetchIncidents } from '../services/incidents';

const LEGEND = [
  { label: 'Low risk', color: RISK_LEVEL_COLORS.LOW },
  { label: 'Medium', color: RISK_LEVEL_COLORS.MEDIUM },
  { label: 'High', color: RISK_LEVEL_COLORS.HIGH },
  { label: 'Critical', color: RISK_LEVEL_COLORS.CRITICAL },
];

export function Maps() {
  useIncidentRealtimeSync();
  const incidentsQuery = useQuery({ queryKey: ['incidents', { limit: 100 }], queryFn: () => fetchIncidents({ limit: 100 }) });
  const incidents = incidentsQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageTitleSync title="Disaster Map" />

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <IncidentMap incidents={incidents} heightClassName="h-80" />
        <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 p-4">
          {LEGEND.map((item) => (
            <span key={item.label} className="flex items-center gap-2 text-xs text-slate-600">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))}
          <StatusChip label={`${incidents.length} active pins`} variant="info" className="ml-auto" />
        </div>
      </div>

      <ul className="grid gap-3 sm:grid-cols-3">
        {incidents.length === 0 ? (
          <li className="text-sm text-slate-400">No incidents to display.</li>
        ) : (
          incidents.slice(0, 9).map((inc) => (
            <li key={inc._id} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm">
              <MapPin className="h-4 w-4 text-red-600" />
              {inc.title}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
