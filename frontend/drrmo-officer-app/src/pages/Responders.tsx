import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Award, MapPin, Star } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState, Notice, PageTitleSync, StatusChip, cn } from '@drrmo/ui';
import { respondersApi, type ResponderRecord, type ResponderStatus } from '@shared/src/services';
import { errorMessage, fullName, humanize, timeAgo } from '@shared/src/format';

const STATUSES: ResponderStatus[] = ['available', 'on_duty', 'responding', 'on_scene', 'off_duty'];
const statusVariant = { available: 'success', on_duty: 'info', responding: 'warning', on_scene: 'danger', off_duty: 'neutral' } as const;

export function Responders() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | ResponderStatus>('all');

  const responders = useQuery({ queryKey: ['responders'], queryFn: respondersApi.list, refetchInterval: 15_000 });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ResponderStatus }) => respondersApi.setStatus(id, status),
    onSuccess: (saved) =>
      queryClient.setQueryData<ResponderRecord[]>(['responders'], (list) => list?.map((r) => (r._id === saved._id ? saved : r))),
  });

  const counts = useMemo(() => {
    const all = responders.data ?? [];
    return Object.fromEntries(STATUSES.map((s) => [s, all.filter((r) => r.status === s).length])) as Record<ResponderStatus, number>;
  }, [responders.data]);

  const list = (responders.data ?? []).filter((r) => filter === 'all' || r.status === filter);

  return (
    <div className="space-y-6">
      <PageTitleSync title="Responders" />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={cn('rounded-full px-3 py-1.5 text-xs font-medium transition', filter === 'all' ? 'bg-blue-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50')}
        >
          All · {responders.data?.length ?? 0}
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={cn('rounded-full px-3 py-1.5 text-xs font-medium transition', filter === s ? 'bg-blue-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50')}
          >
            {humanize(s)} · {counts[s] ?? 0}
          </button>
        ))}
      </div>

      {setStatus.isError ? <Notice tone="error">{errorMessage(setStatus.error)}</Notice> : null}

      {responders.isLoading ? (
        <LoadingState label="Loading responders…" />
      ) : responders.isError ? (
        <ErrorState message={errorMessage(responders.error)} onRetry={() => responders.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          title="No responders in this view"
          description="Responder profiles appear here once responder accounts sign in to the field app or are registered by an administrator."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((r) => {
            const busy = setStatus.isPending && setStatus.variables?.id === r._id;
            const loc = r.currentLocation;
            return (
              <article key={r._id} className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-900">{fullName(r.userId)}</h3>
                    <p className="truncate text-sm text-slate-500">{r.team || 'Unassigned team'}</p>
                  </div>
                  <StatusChip label={humanize(r.status)} variant={statusVariant[r.status] ?? 'neutral'} />
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="flex items-center gap-1 text-xs text-slate-500">
                      <Award className="h-3.5 w-3.5" /> Resolved
                    </dt>
                    <dd className="font-semibold text-slate-800">{r.totalIncidentsResolved ?? 0} incidents</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1 text-xs text-slate-500">
                      <Star className="h-3.5 w-3.5" /> Rating
                    </dt>
                    <dd className="font-semibold text-slate-800">{(r.rating ?? 0).toFixed(1)} / 5</dd>
                  </div>
                </dl>

                {(r.certifications ?? []).length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {r.certifications!.map((c) => (
                      <span key={c} className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-900">
                        {c}
                      </span>
                    ))}
                  </div>
                ) : null}

                <p className="mt-3 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5" />
                  {loc?.latitude !== undefined && loc?.longitude !== undefined
                    ? `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)} · ${timeAgo(r.updatedAt)}`
                    : 'No location reported'}
                </p>

                <div className="mt-auto pt-4">
                  <label className="text-xs font-medium text-slate-500">
                    Set status
                    <select
                      value={r.status}
                      disabled={busy}
                      onChange={(e) => setStatus.mutate({ id: r._id, status: e.target.value as ResponderStatus })}
                      className="mt-1 w-full rounded-xl border border-blue-200 px-3 py-2 text-sm font-medium text-blue-900 disabled:opacity-50"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {humanize(s)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
