import { apiGet, apiPost, apiPut, type IncidentWirePayload, type PriorityLevel } from '@shared/src/api';

export type Incident = IncidentWirePayload;

export interface IncidentFilters {
  status?: string;
  severity?: string;
  type?: string;
  barangay?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedIncidents {
  data: Incident[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IncidentStatsSummary {
  total: number;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
  hourly: number[];
}

export interface ResponderUserRef {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface ResponderRecord {
  _id: string;
  userId: ResponderUserRef;
  status: 'available' | 'on_duty' | 'responding' | 'on_scene' | 'off_duty';
  currentLocation?: { latitude: number; longitude: number };
  team?: string;
}

export function fetchIncidents(filters: IncidentFilters = {}): Promise<PaginatedIncidents> {
  return apiGet<PaginatedIncidents>('/incidents', { query: { ...filters } });
}

export function fetchIncident(id: string): Promise<Incident> {
  return apiGet<Incident>(`/incidents/${id}`);
}

export function fetchIncidentStats(): Promise<IncidentStatsSummary> {
  return apiGet<IncidentStatsSummary>('/incidents/stats/summary');
}

export function verifyIncident(id: string): Promise<Incident> {
  return apiPost<Incident>(`/incidents/${id}/verify`);
}

export function setIncidentPriority(id: string, level: PriorityLevel, reason: string): Promise<Incident> {
  return apiPost<Incident>(`/incidents/${id}/priority`, { level, reason });
}

export function assignResponders(id: string, responderIds: string[]): Promise<Incident> {
  return apiPost<Incident>(`/incidents/${id}/assign`, { responderIds });
}

export function advanceIncidentStatus(id: string, status: string): Promise<Incident> {
  return apiPost<Incident>(`/incidents/${id}/status`, { status });
}

export function updateIncident(id: string, updates: Partial<Pick<Incident, 'title' | 'description' | 'affectedCount' | 'injuredCount'>>): Promise<Incident> {
  return apiPut<Incident>(`/incidents/${id}`, updates);
}

export function fetchResponders(params: { status?: string } = {}): Promise<ResponderRecord[]> {
  return apiGet<ResponderRecord[]>('/responders', { query: { ...params } });
}

/** Mirrors `backend/src/services/incidentStateMachine.ts` so the UI never offers an invalid transition. */
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  reported: ['verified', 'closed'],
  verified: ['responding', 'closed'],
  responding: ['in_progress', 'closed'],
  in_progress: ['resolved', 'closed'],
  resolved: ['closed'],
  closed: [],
};

export function getNextStatuses(current: string): string[] {
  return ALLOWED_TRANSITIONS[current] ?? [];
}
