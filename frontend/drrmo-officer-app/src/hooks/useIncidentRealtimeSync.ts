import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SOCKET_EVENTS } from '@shared/src/api';
import { useRealtime } from '../app/providers/RealtimeProvider';
import type { Incident, PaginatedIncidents } from '../services/incidents';

/**
 * Patches any cached `['incidents', ...]` list query in place when a room-scoped
 * `incident_update` event arrives, instead of refetching/reloading the whole page.
 */
export function useIncidentRealtimeSync() {
  const { on, off } = useRealtime();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = (payload: unknown) => {
      const incoming = payload as Incident;
      if (!incoming?._id) return;

      queryClient.setQueriesData<PaginatedIncidents>({ queryKey: ['incidents'] }, (old) => {
        if (!old) return old;
        const index = old.data.findIndex((i) => i._id === incoming._id);
        if (index === -1) {
          return { ...old, data: [incoming, ...old.data], total: old.total + 1 };
        }
        const next = [...old.data];
        next[index] = incoming;
        return { ...old, data: next };
      });

      queryClient.setQueryData<Incident>(['incident', incoming._id], incoming);
      queryClient.invalidateQueries({ queryKey: ['incidents', 'stats'] });
    };

    on(SOCKET_EVENTS.INCIDENT_UPDATE, handler);
    return () => off(SOCKET_EVENTS.INCIDENT_UPDATE, handler);
  }, [on, off, queryClient]);
}
