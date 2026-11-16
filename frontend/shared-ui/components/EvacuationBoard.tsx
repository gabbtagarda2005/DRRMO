import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Minus, Pencil, Plus, Search, Users } from 'lucide-react';
import { barangaysApi, evacuationsApi, type EvacuationCenterRecord } from '@shared/src/services';
import { errorMessage, humanize, timeAgo } from '@shared/src/format';
import { MAP_CONFIG } from '@shared/constants';
import { Field, Modal, inputClass } from './Modal';
import { EmptyState, ErrorState, LoadingState, Notice } from './Feedback';
import { StatusChip } from './StatusChip';
import { cn } from '../lib/cn';

const STATUS_VARIANT = { operational: 'success', under_maintenance: 'warning', closed: 'neutral' } as const;

function utilisationTone(pct: number) {
  if (pct >= 90) return { bar: 'bg-red-500', text: 'text-red-700' };
  if (pct >= 70) return { bar: 'bg-amber-500', text: 'text-amber-700' };
  return { bar: 'bg-emerald-500', text: 'text-emerald-700' };
}

interface CenterDraft {
  name: string;
  address: string;
  barangay: string;
  capacity: string;
  latitude: string;
  longitude: string;
  facilities: string;
  status: EvacuationCenterRecord['status'];
}

const emptyDraft = (barangay = ''): CenterDraft => ({
  name: '',
  address: '',
  barangay,
  capacity: '',
  latitude: String(MAP_CONFIG.DEFAULT_CENTER.lat),
  longitude: String(MAP_CONFIG.DEFAULT_CENTER.lng),
  facilities: '',
  status: 'operational',
});

interface EvacuationBoardProps {
  /** When set (barangay app), only this barangay's centers are shown and new centers are created in it. */
  scopeBarangay?: string;
  accentClass?: string;
}

/** Live evacuation center management: occupancy check-in/out, status and center records. */
export function EvacuationBoard({ scopeBarangay, accentClass = 'bg-blue-900 hover:bg-blue-800' }: EvacuationBoardProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState<EvacuationCenterRecord | 'new' | null>(null);
  const [draft, setDraft] = useState<CenterDraft>(emptyDraft(scopeBarangay));
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);

  const centers = useQuery({ queryKey: ['evacuations'], queryFn: evacuationsApi.list, refetchInterval: 20_000 });
  const barangays = useQuery({ queryKey: ['barangays'], queryFn: barangaysApi.list, staleTime: 10 * 60_000, enabled: !scopeBarangay });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['evacuations'] });

  const updateCenter = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<EvacuationCenterRecord> }) => evacuationsApi.update(id, input),
    onSuccess: (saved) => {
      setPending(({ [saved._id]: _drop, ...rest }) => rest);
      setRowError(null);
      queryClient.setQueryData<EvacuationCenterRecord[]>(['evacuations'], (list) => list?.map((c) => (c._id === saved._id ? saved : c)));
    },
    onError: (error, vars) => setRowError({ id: vars.id, message: errorMessage(error) }),
  });

  const saveCenter = useMutation({
    mutationFn: async () => {
      const input = {
        name: draft.name.trim(),
        address: draft.address.trim(),
        barangay: scopeBarangay ?? draft.barangay,
        capacity: Number(draft.capacity),
        location: { latitude: Number(draft.latitude), longitude: Number(draft.longitude) },
        facilities: draft.facilities.split(',').map((f) => f.trim()).filter(Boolean),
        status: draft.status,
      };
      return editing === 'new' ? evacuationsApi.create(input) : evacuationsApi.update((editing as EvacuationCenterRecord)._id, input);
    },
    onSuccess: () => {
      setEditing(null);
      invalidate();
    },
  });

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (centers.data ?? [])
      .filter((c) => !scopeBarangay || c.barangay === scopeBarangay)
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.barangay.toLowerCase().includes(q));
  }, [centers.data, scopeBarangay, search]);

  const totals = useMemo(() => {
    const open = visible.filter((c) => c.status === 'operational');
    const capacity = open.reduce((s, c) => s + c.capacity, 0);
    const occupancy = open.reduce((s, c) => s + c.currentOccupancy, 0);
    return { open: open.length, capacity, occupancy, pct: capacity ? Math.round((occupancy / capacity) * 100) : 0 };
  }, [visible]);

  const openEditor = (center: EvacuationCenterRecord | 'new') => {
    saveCenter.reset();
    setDraft(
      center === 'new'
        ? emptyDraft(scopeBarangay)
        : {
            name: center.name,
            address: center.address,
            barangay: center.barangay,
            capacity: String(center.capacity),
            latitude: String(center.location.latitude),
            longitude: String(center.location.longitude),
            facilities: (center.facilities ?? []).join(', '),
            status: center.status,
          }
    );
    setEditing(center);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    saveCenter.mutate();
  };

  const button = cn('inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50', accentClass);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Open centers</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totals.open}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Evacuees sheltered</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {totals.occupancy.toLocaleString()} <span className="text-sm font-medium text-slate-400">/ {totals.capacity.toLocaleString()}</span>
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Utilisation</p>
          <p className={cn('mt-1 text-2xl font-bold', utilisationTone(totals.pct).text)}>{totals.pct}%</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search centers…" className={cn(inputClass, "pl-10")} />
        </div>
        <button type="button" onClick={() => openEditor('new')} className={cn(button, 'ml-auto')}>
          <Plus className="h-4 w-4" />
          Add center
        </button>
      </div>

      {centers.isLoading ? (
        <LoadingState label="Loading evacuation centers…" />
      ) : centers.isError ? (
        <ErrorState message={errorMessage(centers.error)} onRetry={() => centers.refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState
          title="No evacuation centers yet"
          description={scopeBarangay ? `Register the first evacuation center for ${scopeBarangay}.` : 'Register evacuation centers so occupancy can be tracked live.'}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visible.map((c) => {
            const value = pending[c._id] ?? c.currentOccupancy;
            const dirty = pending[c._id] !== undefined && pending[c._id] !== c.currentOccupancy;
            const pct = c.capacity ? Math.min(100, Math.round((value / c.capacity) * 100)) : 0;
            const tone = utilisationTone(pct);
            const saving = updateCenter.isPending && updateCenter.variables?.id === c._id;
            const setValue = (n: number) => setPending((p) => ({ ...p, [c._id]: Math.max(0, Math.min(c.capacity, Math.round(n || 0))) }));

            return (
              <article key={c._id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                      <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate">{c.name}</span>
                    </h3>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {c.barangay} · {c.address}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <StatusChip label={humanize(c.status)} variant={STATUS_VARIANT[c.status] ?? 'neutral'} />
                    <button type="button" onClick={() => openEditor(c)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={`Edit ${c.name}`}>
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span className="font-semibold text-slate-900">{value.toLocaleString()}</span> / {c.capacity.toLocaleString()}
                    </span>
                    <span className={cn('font-semibold', tone.text)}>{pct}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={cn('h-full rounded-full transition-all duration-500', tone.bar)} style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <div className="flex items-center rounded-xl border border-slate-200">
                    <button type="button" onClick={() => setValue(value - 1)} className="px-2.5 py-2 text-slate-500 hover:text-slate-900" aria-label="Check out one evacuee">
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={c.capacity}
                      value={value}
                      onChange={(e) => setValue(Number(e.target.value))}
                      className="w-20 border-x border-slate-200 py-2 text-center text-sm outline-none"
                      aria-label="Current occupancy"
                    />
                    <button type="button" onClick={() => setValue(value + 1)} className="px-2.5 py-2 text-slate-500 hover:text-slate-900" aria-label="Check in one evacuee">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button type="button" onClick={() => setValue(value + 10)} className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                    +10
                  </button>
                  {dirty ? (
                    <>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => updateCenter.mutate({ id: c._id, input: { currentOccupancy: value } })}
                        className={cn('rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-50', accentClass)}
                      >
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPending(({ [c._id]: _drop, ...rest }) => rest)}
                        className="rounded-lg px-2 py-2 text-xs font-medium text-slate-500 hover:text-slate-800"
                      >
                        Reset
                      </button>
                    </>
                  ) : (
                    <span className="ml-auto text-xs text-slate-400">Updated {timeAgo(c.updatedAt)}</span>
                  )}
                </div>
                {rowError?.id === c._id ? <p className="mt-2 text-xs text-red-600">{rowError.message}</p> : null}
                {(c.facilities ?? []).length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.facilities.map((f) => (
                      <span key={f} className="rounded-md bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
                        {f}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={editing !== null}
        title={editing === 'new' ? 'Add evacuation center' : 'Edit evacuation center'}
        onClose={() => setEditing(null)}
        footer={
          <>
            <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" form="center-form" disabled={saveCenter.isPending} className={cn('rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50', accentClass)}>
              {saveCenter.isPending ? 'Saving…' : 'Save center'}
            </button>
          </>
        }
      >
        <form id="center-form" onSubmit={submit} className="space-y-4">
          {saveCenter.isError ? <Notice tone="error">{errorMessage(saveCenter.error)}</Notice> : null}
          <Field label="Center name">
            <input required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Address">
            <input required value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} className={inputClass} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Barangay">
              {scopeBarangay ? (
                <input disabled value={scopeBarangay} className={inputClass} />
              ) : (
                <select required value={draft.barangay} onChange={(e) => setDraft({ ...draft, barangay: e.target.value })} className={inputClass}>
                  <option value="">Select…</option>
                  {(barangays.data ?? []).map((b) => (
                    <option key={b._id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Capacity (persons)">
              <input required type="number" min={1} value={draft.capacity} onChange={(e) => setDraft({ ...draft, capacity: e.target.value })} className={inputClass} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Latitude">
              <input required type="number" step="any" min={-90} max={90} value={draft.latitude} onChange={(e) => setDraft({ ...draft, latitude: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Longitude">
              <input required type="number" step="any" min={-180} max={180} value={draft.longitude} onChange={(e) => setDraft({ ...draft, longitude: e.target.value })} className={inputClass} />
            </Field>
          </div>
          <Field label="Facilities" hint="Comma-separated, e.g. Restrooms, Kitchen, Generator">
            <input value={draft.facilities} onChange={(e) => setDraft({ ...draft, facilities: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Status">
            <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as CenterDraft['status'] })} className={inputClass}>
              <option value="operational">Operational</option>
              <option value="under_maintenance">Under maintenance</option>
              <option value="closed">Closed</option>
            </select>
          </Field>
        </form>
      </Modal>
    </div>
  );
}
