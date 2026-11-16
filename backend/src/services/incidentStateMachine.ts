export type IncidentStatus =
  | 'reported'
  | 'verified'
  | 'responding'
  | 'in_progress'
  | 'resolved'
  | 'closed';

export const ALLOWED_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  reported: ['verified', 'closed'],
  verified: ['responding', 'closed'],
  responding: ['in_progress', 'closed'],
  in_progress: ['resolved', 'closed'],
  resolved: ['closed'],
  closed: [],
};

export function isIncidentStatus(value: string): value is IncidentStatus {
  return Object.prototype.hasOwnProperty.call(ALLOWED_TRANSITIONS, value);
}

export function canTransition(from: string, to: string): boolean {
  if (!isIncidentStatus(from) || !isIncidentStatus(to)) return false;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function getNextStatuses(from: string): IncidentStatus[] {
  if (!isIncidentStatus(from)) return [];
  return ALLOWED_TRANSITIONS[from];
}
