/**
 * Typed REST wrappers for every DRRMO resource, shared by all web clients.
 * Paths are relative to `/api` (see `apiRequest`).
 */
import { apiDelete, apiGet, apiPost, apiPut, type IncidentWirePayload } from './api';

export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PersonRef {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  role?: string;
  barangay?: string;
}

// ---------------------------------------------------------------- Users

export type UserRole = 'admin' | 'drrmo_officer' | 'responder' | 'barangay_official' | 'citizen';

export interface UserRecord {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  barangay?: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface UserInput {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  barangay?: string;
  phone?: string;
  isActive?: boolean;
}

export const usersApi = {
  list: () => apiGet<UserRecord[]>('/users'),
  me: () => apiGet<UserRecord>('/users/me'),
  updateMe: (input: Pick<UserInput, 'firstName' | 'lastName' | 'phone'>) => apiPut<UserRecord>('/users/me', input),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiPut<{ message: string }>('/users/me/password', { currentPassword, newPassword }),
  create: (input: UserInput) => apiPost<UserRecord>('/users', input),
  update: (id: string, input: UserInput) => apiPut<UserRecord>(`/users/${id}`, input),
  remove: (id: string) => apiDelete<void>(`/users/${id}`),
};

// ---------------------------------------------------------------- Incidents

export type IncidentRecord = IncidentWirePayload & {
  escalated?: boolean;
  escalatedAt?: string;
  affectedCount?: number;
  injuredCount?: number;
};

export interface IncidentQuery {
  status?: string;
  severity?: string;
  type?: string;
  barangay?: string;
  page?: number;
  limit?: number;
}

export interface IncidentInput {
  title: string;
  description: string;
  type: string;
  severity: string;
  location: { latitude: number; longitude: number; address: string; barangay: string };
  affectedCount?: number;
  injuredCount?: number;
}

export const incidentsApi = {
  list: (query: IncidentQuery = {}) => apiGet<Paginated<IncidentRecord>>('/incidents', { query: { ...query } }),
  create: (input: IncidentInput) => apiPost<IncidentRecord>('/incidents', input),
  escalate: (id: string, note?: string) => apiPost<IncidentRecord>(`/incidents/${id}/escalate`, { note }),
};

// ---------------------------------------------------------------- Evacuation centers

export interface EvacuationCenterRecord {
  _id: string;
  name: string;
  address: string;
  barangay: string;
  location: { latitude: number; longitude: number };
  capacity: number;
  currentOccupancy: number;
  facilities: string[];
  status: 'operational' | 'closed' | 'under_maintenance';
  updatedAt: string;
}

export type EvacuationCenterInput = Partial<Omit<EvacuationCenterRecord, '_id' | 'updatedAt'>>;

export const evacuationsApi = {
  list: () => apiGet<EvacuationCenterRecord[]>('/evacuations'),
  create: (input: EvacuationCenterInput) => apiPost<EvacuationCenterRecord>('/evacuations', input),
  update: (id: string, input: EvacuationCenterInput) => apiPut<EvacuationCenterRecord>(`/evacuations/${id}`, input),
};

// ---------------------------------------------------------------- Resources

export type ResourceType = 'ambulance' | 'vehicle' | 'equipment' | 'supplies' | 'personnel';
export type ResourceStatus = 'available' | 'in_use' | 'maintenance' | 'unavailable';

export interface ResourceRecord {
  _id: string;
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  quantity: number;
  location: string;
  updatedAt: string;
}

export type ResourceInput = Partial<Omit<ResourceRecord, '_id' | 'updatedAt'>>;

export const resourcesApi = {
  list: () => apiGet<ResourceRecord[]>('/resources'),
  create: (input: ResourceInput) => apiPost<ResourceRecord>('/resources', input),
  update: (id: string, input: ResourceInput) => apiPut<ResourceRecord>(`/resources/${id}`, input),
  remove: (id: string) => apiDelete<void>(`/resources/${id}`),
};

// ---------------------------------------------------------------- Responders

export type ResponderStatus = 'available' | 'on_duty' | 'responding' | 'on_scene' | 'off_duty';

export interface ResponderRecord {
  _id: string;
  userId: PersonRef | null;
  status: ResponderStatus;
  team?: string;
  certifications?: string[];
  currentLocation?: { latitude?: number; longitude?: number };
  assignedIncidents?: string[];
  rating?: number;
  totalIncidentsResolved?: number;
  updatedAt: string;
}

export const respondersApi = {
  list: () => apiGet<ResponderRecord[]>('/responders'),
  setStatus: (id: string, status: ResponderStatus) => apiPut<ResponderRecord>(`/responders/${id}/status`, { status }),
};

// ---------------------------------------------------------------- Alerts / notifications

export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';
export type AlertType = 'alert' | 'update' | 'warning' | 'info';

export interface SentAlert {
  _id: string;
  title: string;
  message: string;
  type: AlertType;
  priority: AlertPriority;
  audience: string;
  recipientCount: number;
  createdAt: string;
  createdBy?: PersonRef;
}

export interface AlertInput {
  title: string;
  message: string;
  type: AlertType;
  priority: AlertPriority;
  audience: string;
}

export const alertsApi = {
  sent: () => apiGet<SentAlert[]>('/notifications/sent'),
  send: (input: AlertInput) => apiPost<SentAlert>('/notifications', input),
};

export function describeAudience(audience: string): string {
  if (audience.startsWith('barangay:')) return audience.slice('barangay:'.length);
  const labels: Record<string, string> = {
    all: 'Everyone',
    citizens: 'All citizens',
    responders: 'Responders',
    barangay_officials: 'Barangay officials',
    staff: 'All DRRMO staff',
    direct: 'Selected users',
  };
  return labels[audience] ?? audience;
}

// ---------------------------------------------------------------- Reports (damage, resource requests, field)

export type ReportType = 'damage_report' | 'field_report' | 'casualty_report' | 'resource_report';
export type ReportStatus = 'pending' | 'reviewed' | 'processed';

export interface ReportRecord {
  _id: string;
  title: string;
  description: string;
  type: ReportType;
  severity: AlertPriority;
  status: ReportStatus;
  barangay?: string;
  details?: Record<string, unknown>;
  submittedBy?: PersonRef;
  createdAt: string;
}

export interface ReportInput {
  title: string;
  description: string;
  type: ReportType;
  severity: AlertPriority;
  details?: Record<string, unknown>;
}

export const reportsApi = {
  list: (query: { type?: ReportType; status?: ReportStatus; barangay?: string; limit?: number } = {}) =>
    apiGet<Paginated<ReportRecord>>('/reports', { query: { limit: 100, ...query } }),
  create: (input: ReportInput) => apiPost<ReportRecord>('/reports', input),
  setStatus: (id: string, status: ReportStatus) => apiPut<ReportRecord>(`/reports/${id}`, { status }),
};

// ---------------------------------------------------------------- Barangays

export interface BarangayRecord {
  _id: string;
  name: string;
  code: string;
  population: number;
}

export const barangaysApi = {
  list: () => apiGet<BarangayRecord[]>('/barangays'),
};

// ---------------------------------------------------------------- Audit / system

export interface AuditRecord {
  _id: string;
  userId: PersonRef | null;
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, unknown>;
  createdAt: string;
}

export const auditApi = {
  list: (query: { action?: string; resourceType?: string; page?: number; limit?: number } = {}) =>
    apiGet<Paginated<AuditRecord>>('/audit', { query: { ...query } }),
};

export interface SystemHealth {
  api: { uptimeSeconds: number; nodeVersion: string; environment: string; memoryMb: number };
  database: { state: string; latencyMs: number | null; name: string };
  realtime: { sessions: number };
  users: { total: number; active: number; suspended: number; byRole: Record<string, number> };
  activity: { logins24h: number; actions24h: number };
  records: { incidents: number; resources: number };
  checkedAt: string;
}

export const systemApi = {
  health: () => apiGet<SystemHealth>('/system/health'),
};
