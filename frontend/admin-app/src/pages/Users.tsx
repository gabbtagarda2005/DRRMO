import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Pencil, Search, Trash2, UserPlus } from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  Modal,
  Notice,
  PageTitleSync,
  StatusChip,
  inputClass,
  cn,
} from '@drrmo/ui';
import { barangaysApi, usersApi, type UserInput, type UserRecord, type UserRole } from '@shared/src/services';
import { downloadCsv, errorMessage, formatDateTime, fullName, humanize, timeAgo, todayStamp, userIdOf } from '@shared/src/format';
import { useAuth } from '../app/providers/AuthProvider';

const ROLES: UserRole[] = ['admin', 'drrmo_officer', 'responder', 'barangay_official', 'citizen'];

type Draft = Required<Pick<UserInput, 'email' | 'firstName' | 'lastName' | 'role'>> & {
  password: string;
  barangay: string;
  phone: string;
  isActive: boolean;
};

const EMPTY_DRAFT: Draft = { email: '', firstName: '', lastName: '', role: 'citizen', password: '', barangay: '', phone: '', isActive: true };

export function Users() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const myId = userIdOf(user);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [editing, setEditing] = useState<UserRecord | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [confirmDelete, setConfirmDelete] = useState<UserRecord | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const users = useQuery({ queryKey: ['users'], queryFn: usersApi.list });
  const barangays = useQuery({ queryKey: ['barangays'], queryFn: barangaysApi.list, staleTime: 10 * 60_000 });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['system-health'] });
    queryClient.invalidateQueries({ queryKey: ['audit'] });
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload: UserInput = {
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        role: draft.role,
        barangay: draft.barangay || undefined,
        phone: draft.phone.trim() || undefined,
      };
      if (editing === 'new') {
        return usersApi.create({ ...payload, email: draft.email.trim(), password: draft.password });
      }
      const target = editing as UserRecord;
      return usersApi.update(target._id, {
        ...payload,
        isActive: draft.isActive,
        ...(draft.password ? { password: draft.password } : {}),
      });
    },
    onSuccess: (saved) => {
      setFlash(editing === 'new' ? `Created ${saved.email}` : `Saved changes to ${saved.email}`);
      setEditing(null);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (u: UserRecord) => usersApi.remove(u._id),
    onSuccess: (_v, u) => {
      setFlash(`Deleted ${u.email}`);
      setConfirmDelete(null);
      invalidate();
    },
  });

  const openNew = () => {
    save.reset();
    setDraft(EMPTY_DRAFT);
    setEditing('new');
  };

  const openEdit = (u: UserRecord) => {
    save.reset();
    setDraft({
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      password: '',
      barangay: u.barangay ?? '',
      phone: u.phone ?? '',
      isActive: u.isActive,
    });
    setEditing(u);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (users.data ?? []).filter((u) => {
      const matchSearch = !q || fullName(u).toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.barangay ?? '').toLowerCase().includes(q);
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? u.isActive : !u.isActive);
      return matchSearch && matchRole && matchStatus;
    });
  }, [users.data, search, roleFilter, statusFilter]);

  const exportCsv = () =>
    downloadCsv(
      `drrmo-users-${todayStamp()}`,
      filtered.map((u) => ({
        Name: fullName(u),
        Email: u.email,
        Role: humanize(u.role),
        Barangay: u.barangay ?? '',
        Phone: u.phone ?? '',
        Status: u.isActive ? 'Active' : 'Suspended',
        'Last login': u.lastLogin ? formatDateTime(u.lastLogin) : 'Never',
        Created: formatDateTime(u.createdAt),
      }))
    );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate();
  };

  const isNew = editing === 'new';
  const editingSelf = !isNew && editing !== null && editing._id === myId;

  return (
    <div className="space-y-6">
      <PageTitleSync title="User Management" />

      {flash ? (
        <Notice tone="success" onDismiss={() => setFlash(null)}>
          {flash}
        </Notice>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email or barangay…"
            className={cn(inputClass, "pl-10")}
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)} className={cn(inputClass, "w-auto")}>
          <option value="all">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {humanize(r)}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className={cn(inputClass, "w-auto")}>
          <option value="all">Any status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900"
          >
            <UserPlus className="h-4 w-4" />
            Add user
          </button>
        </div>
      </div>

      {users.isLoading ? (
        <LoadingState label="Loading accounts…" />
      ) : users.isError ? (
        <ErrorState message={errorMessage(users.error)} onRetry={() => users.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No users match your filters" description="Try a different search term or clear the role and status filters." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Barangay</th>
                  <th className="px-4 py-3">Last sign-in</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">
                        {fullName(u)} {u._id === myId ? <span className="text-xs font-normal text-slate-400">(you)</span> : null}
                      </p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{humanize(u.role)}</td>
                    <td className="px-4 py-3 text-slate-600">{u.barangay || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{u.lastLogin ? timeAgo(u.lastLogin) : 'Never'}</td>
                    <td className="px-4 py-3">
                      <StatusChip label={u.isActive ? 'Active' : 'Suspended'} variant={u.isActive ? 'success' : 'danger'} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(u)}
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          aria-label={`Edit ${u.email}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={u._id === myId}
                          onClick={() => {
                            remove.reset();
                            setConfirmDelete(u);
                          }}
                          className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                          aria-label={`Delete ${u.email}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-slate-50 px-4 py-3 text-xs text-slate-500">
            Showing {filtered.length} of {users.data?.length ?? 0} accounts
          </p>
        </div>
      )}

      <Modal
        open={editing !== null}
        title={isNew ? 'Add user' : 'Edit user'}
        description={isNew ? 'Create an account and assign its role.' : (editing as UserRecord | null)?.email}
        onClose={() => setEditing(null)}
        footer={
          <>
            <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="submit"
              form="user-form"
              disabled={save.isPending}
              className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
            >
              {save.isPending ? 'Saving…' : isNew ? 'Create account' : 'Save changes'}
            </button>
          </>
        }
      >
        <form id="user-form" onSubmit={onSubmit} className="space-y-4">
          {save.isError ? <Notice tone="error">{errorMessage(save.error)}</Notice> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name">
              <input required value={draft.firstName} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Last name">
              <input required value={draft.lastName} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })} className={inputClass} />
            </Field>
          </div>
          <Field label="Email">
            <input
              required
              type="email"
              disabled={!isNew}
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              className={inputClass}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Role">
              <select
                value={draft.role}
                disabled={editingSelf}
                onChange={(e) => setDraft({ ...draft, role: e.target.value as UserRole })}
                className={inputClass}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {humanize(r)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Barangay" hint={draft.role === 'barangay_official' ? 'Required for barangay officials' : undefined}>
              <select
                value={draft.barangay}
                required={draft.role === 'barangay_official'}
                onChange={(e) => setDraft({ ...draft, barangay: e.target.value })}
                className={inputClass}
              >
                <option value="">— None —</option>
                {(barangays.data ?? []).map((b) => (
                  <option key={b._id} value={b.name}>
                    {b.name}
                  </option>
                ))}
                {draft.barangay && !(barangays.data ?? []).some((b) => b.name === draft.barangay) ? (
                  <option value={draft.barangay}>{draft.barangay}</option>
                ) : null}
              </select>
            </Field>
          </div>
          <Field label="Phone">
            <input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="+63 9xx xxx xxxx" className={inputClass} />
          </Field>
          <Field label={isNew ? 'Temporary password' : 'Reset password'} hint={isNew ? 'At least 6 characters. Share it securely with the user.' : 'Leave blank to keep the current password.'}>
            <input
              type="password"
              autoComplete="new-password"
              required={isNew}
              minLength={6}
              value={draft.password}
              onChange={(e) => setDraft({ ...draft, password: e.target.value })}
              className={inputClass}
            />
          </Field>
          {!isNew ? (
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
              <input
                type="checkbox"
                checked={draft.isActive}
                disabled={editingSelf}
                onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span className="text-sm">
                <span className="font-medium text-slate-800">Account active</span>
                <span className="block text-xs text-slate-500">Suspended users cannot sign in to any DRRMO app.</span>
              </span>
            </label>
          ) : null}
          {editingSelf ? <p className="text-xs text-slate-500">You can't change your own role or suspend yourself.</p> : null}
        </form>
      </Modal>

      <Modal
        open={confirmDelete !== null}
        title="Delete user?"
        description={confirmDelete?.email}
        onClose={() => setConfirmDelete(null)}
        footer={
          <>
            <button type="button" onClick={() => setConfirmDelete(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() => confirmDelete && remove.mutate(confirmDelete)}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {remove.isPending ? 'Deleting…' : 'Delete permanently'}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          This permanently removes <strong>{fullName(confirmDelete)}</strong>. Their past incident reports and audit entries are kept. To temporarily block access, suspend the account instead.
        </p>
        {remove.isError ? <Notice tone="error" className="mt-3">{errorMessage(remove.error)}</Notice> : null}
      </Modal>
    </div>
  );
}
