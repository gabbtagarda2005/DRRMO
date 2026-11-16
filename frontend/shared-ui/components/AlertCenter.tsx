import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Send, Users } from 'lucide-react';
import { alertsApi, describeAudience, type AlertPriority, type AlertType } from '@shared/src/services';
import { errorMessage, formatDateTime, fullName, humanize, timeAgo } from '@shared/src/format';
import { Field, inputClass } from './Modal';
import { EmptyState, ErrorState, LoadingState, Notice } from './Feedback';
import { StatusChip } from './StatusChip';
import { cn } from '../lib/cn';

export interface AudienceOption {
  value: string;
  label: string;
}

const priorityVariant = { critical: 'danger', high: 'warning', medium: 'info', low: 'neutral' } as const;

interface AlertCenterProps {
  audiences: AudienceOption[];
  /** Shown under the audience picker, e.g. barangay scoping notes. */
  audienceHint?: string;
  accentClass?: string;
  iconClass?: string;
  composeTitle?: string;
  historyTitle?: string;
}

/** Compose + history panel for broadcast alerts backed by `/notifications`. */
export function AlertCenter({
  audiences,
  audienceHint,
  accentClass = 'bg-blue-900 hover:bg-blue-800',
  iconClass = 'text-blue-900',
  composeTitle = 'Broadcast alert',
  historyTitle = 'Recent broadcasts',
}: AlertCenterProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'alert' as AlertType,
    priority: 'high' as AlertPriority,
    audience: audiences[0]?.value ?? 'all',
  });
  const [sentTo, setSentTo] = useState<string | null>(null);

  const history = useQuery({ queryKey: ['alerts-sent'], queryFn: alertsApi.sent, refetchInterval: 30_000 });

  const send = useMutation({
    mutationFn: () => alertsApi.send({ ...form, title: form.title.trim(), message: form.message.trim() }),
    onSuccess: (result) => {
      setSentTo(`Delivered to ${result.recipientCount} ${result.recipientCount === 1 ? 'person' : 'people'} · ${describeAudience(result.audience)}`);
      setForm((f) => ({ ...f, title: '', message: '' }));
      queryClient.invalidateQueries({ queryKey: ['alerts-sent'] });
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSentTo(null);
    send.mutate();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          <Megaphone className={cn('h-5 w-5', iconClass)} />
          {composeTitle}
        </h3>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <Field label="Title">
            <input
              required
              maxLength={120}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Pre-emptive evacuation — low-lying areas"
              className={inputClass}
            />
          </Field>
          <Field label="Message">
            <textarea
              required
              rows={5}
              maxLength={1000}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="What is happening, who is affected, and what people should do now."
              className={inputClass}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Type">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AlertType })} className={inputClass}>
                <option value="alert">Alert</option>
                <option value="warning">Warning</option>
                <option value="update">Update</option>
                <option value="info">Info</option>
              </select>
            </Field>
            <Field label="Priority">
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as AlertPriority })} className={inputClass}>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </Field>
            <Field label="Audience">
              <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} className={inputClass}>
                {audiences.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {audienceHint ? <p className="text-xs text-slate-500">{audienceHint}</p> : null}
          {sentTo ? (
            <Notice tone="success" onDismiss={() => setSentTo(null)}>
              {sentTo}
            </Notice>
          ) : null}
          {send.isError ? <Notice tone="error">{errorMessage(send.error)}</Notice> : null}
          <button
            type="submit"
            disabled={send.isPending}
            className={cn('inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50', accentClass)}
          >
            <Send className="h-4 w-4" />
            {send.isPending ? 'Sending…' : 'Send alert'}
          </button>
        </form>
      </section>

      <section>
        <h3 className="mb-3 font-semibold text-slate-900">{historyTitle}</h3>
        {history.isLoading ? (
          <LoadingState />
        ) : history.isError ? (
          <ErrorState message={errorMessage(history.error)} onRetry={() => history.refetch()} />
        ) : (history.data ?? []).length === 0 ? (
          <EmptyState title="No broadcasts yet" description="Alerts you send appear here with their delivery count." />
        ) : (
          <ul className="space-y-3">
            {(history.data ?? []).map((a) => (
              <li key={a._id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip label={humanize(a.priority)} variant={priorityVariant[a.priority] ?? 'neutral'} />
                  <StatusChip label={humanize(a.type)} variant="neutral" />
                  <span className="ml-auto text-xs text-slate-500" title={formatDateTime(a.createdAt)}>
                    {timeAgo(a.createdAt)}
                  </span>
                </div>
                <h4 className="mt-2 font-medium text-slate-900">{a.title}</h4>
                <p className="mt-1 line-clamp-3 text-sm text-slate-600">{a.message}</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                  <Users className="h-3.5 w-3.5" />
                  {describeAudience(a.audience)} · {a.recipientCount} recipients · by {fullName(a.createdBy)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
