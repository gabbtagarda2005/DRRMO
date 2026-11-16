import type { AuditRecord } from '@shared/src/services';
import { humanize } from '@shared/src/format';

const RESOURCE_LABELS: Record<string, string> = {
  Auth: 'session',
  User: 'user account',
  Incident: 'incident',
  EvacuationCenter: 'evacuation center',
  Resource: 'resource',
  Responder: 'responder',
  Notification: 'alert',
  Report: 'report',
  Barangay: 'barangay',
  EmergencyRequest: 'emergency request',
};

const ACTION_VERBS: Record<string, string> = {
  create: 'Created',
  read: 'Viewed',
  update: 'Updated',
  delete: 'Deleted',
  verify: 'Verified',
  assign: 'Assigned responders to',
  status_change: 'Changed status of',
  priority_override: 'Overrode priority of',
};

/** Human sentence for an audit log row, e.g. "Updated user account · isActive". */
export function describeAuditEvent(ev: AuditRecord): string {
  if (ev.action === 'login') return 'Signed in';
  if (ev.action === 'logout') return 'Signed out';

  const verb = ACTION_VERBS[ev.action] ?? humanize(ev.action);
  const resource = RESOURCE_LABELS[ev.resourceType] ?? humanize(ev.resourceType).toLowerCase();
  const changes = ev.changes ?? {};

  const title = typeof changes.title === 'string' ? `“${changes.title}”` : '';
  const email = typeof changes.email === 'string' ? changes.email : '';
  const keys = Object.keys(changes).filter((k) => !['title', 'email', 'firstName', 'lastName'].includes(k));

  let detail = title || email;
  if (!detail && ev.action === 'update' && keys.length > 0 && keys.length <= 3) {
    detail = keys.map((k) => (k === 'isActive' ? (changes.isActive ? 'reactivated' : 'suspended') : humanize(k).toLowerCase())).join(', ');
  }
  if (ev.action === 'status_change' && typeof changes.status === 'string') {
    detail = `→ ${humanize(changes.status)}`;
  }

  return detail ? `${verb} ${resource} · ${detail}` : `${verb} ${resource}`;
}

export const AUDIT_ACTIONS = ['login', 'create', 'update', 'delete', 'verify', 'assign', 'status_change', 'priority_override'];
