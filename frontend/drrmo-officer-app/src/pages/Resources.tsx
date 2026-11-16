import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ambulance, Package, Pencil, Plus, Truck, Users, Wrench, type LucideIcon } from 'lucide-react';
import { EmptyState, ErrorState, Field, LoadingState, Modal, Notice, PageTitleSync, StatusChip, cn, inputClass } from '@drrmo/ui';
import { resourcesApi, type ResourceRecord, type ResourceStatus, type ResourceType } from '@shared/src/services';
import { errorMessage, humanize, timeAgo } from '@shared/src/format';

const TYPES: ResourceType[] = ['ambulance', 'vehicle', 'equipment', 'supplies', 'personnel'];
const STATUSES: ResourceStatus[] = ['available', 'in_use', 'maintenance', 'unavailable'];

const TYPE_ICON: Record<ResourceType, LucideIcon> = {
  ambulance: Ambulance,
  vehicle: Truck,
  equipment: Wrench,
  supplies: Package,
  personnel: Users,
};

const statusVariant = { available: 'success', in_use: 'warning', maintenance: 'neutral', unavailable: 'danger' } as const;

type Draft = { name: string; type: ResourceType; status: ResourceStatus; quantity: string; location: string };
const EMPTY: Draft = { name: '', type: 'equipment', status: 'available', quantity: '1', location: '' };

export function Resources() {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<'all' | ResourceType>('all');
  const [editing, setEditing] = useState<ResourceRecord | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);

  const resources = useQuery({ queryKey: ['resources'], queryFn: resourcesApi.list, refetchInterval: 30_000 });

  const quickStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ResourceStatus }) => resourcesApi.update(id, { status }),
    onSuccess: (saved) =>
      queryClient.setQueryData<ResourceRecord[]>(['resources'], (list) => list?.map((r) => (r._id === saved._id ? saved : r))),
  });

  const save = useMutation({
    mutationFn: () => {
      const input = { name: draft.name.trim(), type: draft.type, status: draft.status, quantity: Number(draft.quantity), location: draft.location.trim() };
      return editing === 'new' ? resourcesApi.create(input) : resourcesApi.update((editing as ResourceRecord)._id, input);
    },
    onSuccess: () => {
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });

  const open = (r: ResourceRecord | 'new') => {
    save.reset();
    setDraft(r === 'new' ? EMPTY : { name: r.name, type: r.type, status: r.status, quantity: String(r.quantity), location: r.location });
    setEditing(r);
  };

  const list = useMemo(() => (resources.data ?? []).filter((r) => typeFilter === 'all' || r.type === typeFilter), [resources.data, typeFilter]);

  const summary = useMemo(() => {
    const all = resources.data ?? [];
    return STATUSES.map((s) => ({ status: s, count: all.filter((r) => r.status === s).length }));
  }, [resources.data]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate();
  };

  return (
    <div className="space-y-6">
      <PageTitleSync title="Resources" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summary.map((s) => (
          <div key={s.status} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{humanize(s.status)}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{s.count}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(['all', ...TYPES] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTypeFilter(t)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium capitalize transition',
              typeFilter === t ? 'bg-blue-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            )}
          >
            {t === 'all' ? 'All' : humanize(t)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => open('new')}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" />
          Add resource
        </button>
      </div>

      {quickStatus.isError ? <Notice tone="error">{errorMessage(quickStatus.error)}</Notice> : null}

      {resources.isLoading ? (
        <LoadingState label="Loading inventory…" />
      ) : resources.isError ? (
        <ErrorState message={errorMessage(resources.error)} onRetry={() => resources.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState title="No resources in this category" description="Add vehicles, equipment, supplies or personnel pools to track deployment." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((item) => {
            const Icon = TYPE_ICON[item.type] ?? Package;
            return (
              <article key={item._id} className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-900">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <StatusChip label={humanize(item.status)} variant={statusVariant[item.status] ?? 'neutral'} />
                    <button type="button" onClick={() => open(item)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={`Edit ${item.name}`}>
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h3 className="mt-3 font-semibold text-slate-900">{item.name}</h3>
                <p className="text-xs text-slate-500">
                  {humanize(item.type)} · {item.location}
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{item.quantity.toLocaleString()}</p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                  <select
                    value={item.status}
                    disabled={quickStatus.isPending && quickStatus.variables?.id === item._id}
                    onChange={(e) => quickStatus.mutate({ id: item._id, status: e.target.value as ResourceStatus })}
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                    aria-label="Change status"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {humanize(s)}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-slate-400">Updated {timeAgo(item.updatedAt)}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={editing !== null}
        title={editing === 'new' ? 'Add resource' : 'Edit resource'}
        onClose={() => setEditing(null)}
        footer={
          <>
            <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" form="resource-form" disabled={save.isPending} className="rounded-xl bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
              {save.isPending ? 'Saving…' : 'Save resource'}
            </button>
          </>
        }
      >
        <form id="resource-form" onSubmit={submit} className="space-y-4">
          {save.isError ? <Notice tone="error">{errorMessage(save.error)}</Notice> : null}
          <Field label="Name">
            <input required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Rescue Boat RB-03" className={inputClass} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type">
              <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as ResourceType })} className={inputClass}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {humanize(t)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as ResourceStatus })} className={inputClass}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {humanize(s)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Quantity">
              <input required type="number" min={1} value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Location">
              <input required value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} placeholder="e.g. Municipal Warehouse" className={inputClass} />
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
