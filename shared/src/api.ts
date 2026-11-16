/**
 * DRRMO unified REST + Socket.IO networking layer for all browser clients.
 *
 * - REST base aligns with backend: `{origin}/api/...` (see `backend/src/server.ts`).
 * - Configure `VITE_API_URL` as the HTTP **origin only** (e.g. http://localhost:5000).
 * - Configure `VITE_WS_URL` when the Socket.IO host differs from the API origin.
 */
import { io, type Socket } from 'socket.io-client';

import type { ApiResponse } from '../types/index';
import { STORAGE_KEYS } from '../constants/index';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DEFAULT_ORIGIN = 'http://localhost:5000';

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function readBundlerEnv(key: string): string | undefined {
  try {
    const env =
      typeof import.meta !== 'undefined' && import.meta.env && typeof import.meta.env === 'object'
        ? (import.meta.env as Record<string, string | boolean | undefined>)[key]
        : undefined;
    if (env === undefined || env === '') return undefined;
    return String(env);
  } catch {
    return undefined;
  }
}

/** HTTP origin (`protocol://host[:port]`) without `/api`. */
export function resolveApiOrigin(): string {
  const fromEnv = readBundlerEnv('VITE_API_URL');
  const origin = stripTrailingSlash(fromEnv ?? DEFAULT_ORIGIN);
  return origin;
}

/**
 * Full REST prefix for `/api` routes — same as concatenating `$VITE_API_URL + '/api'` in existing providers.
 *
 * Prefer passing relative paths beginning with `/` (e.g. `/incidents`, `/health`).
 */
export function resolveRestBaseUrl(): string {
  return `${resolveApiOrigin()}/api`;
}

/** Socket.IO server URL — protocol + host + port (defaults to REST origin when unset). */
export function resolveSocketUrl(): string {
  const ws = readBundlerEnv('VITE_WS_URL');
  return ws ? stripTrailingSlash(ws) : resolveApiOrigin();
}

// ---------------------------------------------------------------------------
// Incident / domain payloads (wired to Mongoose Incident model semantics)
// ---------------------------------------------------------------------------

export type IncidentApiStatus =
  | 'reported'
  | 'verified'
  | 'responding'
  | 'in_progress'
  | 'resolved'
  | 'closed';

export type IncidentApiType =
  | 'flood'
  | 'earthquake'
  | 'fire'
  | 'landslide'
  | 'typhoon'
  | 'accident'
  | 'other';

export type IncidentSeverityApi = 'low' | 'medium' | 'high' | 'critical';

/**
 * Canonical incident payload for REST + realtime pipelines — coordinates, status tags, and geography.
 * Alias of wire shape for tactical clients (citizen PWA, barangay ledger, command center).
 */
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface IncidentPersonRef {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  role?: string;
}

export interface IncidentPayload {
  id?: string;
  title: string;
  description: string;
  type: IncidentApiType;
  severity: IncidentSeverityApi;
  status: IncidentApiStatus;
  statusTag: IncidentStatusTag;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  geography: {
    address: string;
    barangay: string;
    municipality?: string;
    province?: string;
  };
  affectedCount?: number;
  injuredCount?: number;
  priority?: number;
  priorityLevel?: PriorityLevel;
  priorityReason?: string;
  priorityOverridden?: boolean;
  mediaUrls?: string[];
  reportedAt?: string;
  updatedAt?: string;
  reportedBy?: IncidentPersonRef;
  assignedResponders?: IncidentPersonRef[];
  verifiedBy?: IncidentPersonRef;
  verifiedAt?: string;
}

/** Display-oriented status tags mapped to tactical UI contrast (critical / dispatched / synchronized). */
export type IncidentStatusTag =
  | 'critical'
  | 'dispatched'
  | 'pending'
  | 'synchronized'
  | 'resolved'
  | 'reported';

export function statusTagFromApiStatus(status: IncidentApiStatus): IncidentStatusTag {
  switch (status) {
    case 'reported':
      return 'reported';
    case 'verified':
      return 'pending';
    case 'responding':
    case 'in_progress':
      return 'dispatched';
    case 'resolved':
      return 'synchronized';
    case 'closed':
      return 'resolved';
    default:
      return 'pending';
  }
}

export function incidentPayloadFromWire(wire: IncidentWirePayload): IncidentPayload {
  const status = wire.status ?? 'reported';
  return {
    id: wire._id,
    title: wire.title,
    description: wire.description,
    type: wire.type,
    severity: wire.severity,
    status,
    statusTag: statusTagFromApiStatus(status),
    coordinates: {
      latitude: wire.location.latitude,
      longitude: wire.location.longitude,
    },
    geography: {
      address: wire.location.address,
      barangay: wire.location.barangay,
    },
    affectedCount: wire.affectedCount,
    injuredCount: wire.injuredCount,
    priority: wire.priority,
    priorityLevel: wire.priorityLevel,
    priorityReason: wire.priorityReason,
    priorityOverridden: wire.priorityOverridden,
    mediaUrls: wire.mediaUrls,
    updatedAt: wire.updatedAt,
    reportedBy: wire.reportedBy,
    assignedResponders: wire.assignedResponders,
    verifiedBy: wire.verifiedBy,
    verifiedAt: wire.verifiedAt,
  };
}

/** Wire payload for POST/PATCH incidents — matches backend `Incident` schema. */
export interface IncidentWirePayload {
  _id?: string;
  title: string;
  description: string;
  type: IncidentApiType;
  severity: IncidentSeverityApi;
  status?: IncidentApiStatus;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    barangay: string;
  };
  affectedCount?: number;
  injuredCount?: number;
  priority?: number;
  priorityLevel?: PriorityLevel;
  priorityReason?: string;
  priorityOverridden?: boolean;
  mediaUrls?: string[];
  createdAt?: string;
  updatedAt?: string;
  reportedBy?: IncidentPersonRef;
  assignedResponders?: IncidentPersonRef[];
  verifiedBy?: IncidentPersonRef;
  verifiedAt?: string;
}

/**
 * Lightweight incident row used when the network drops (table / map shells stay interactive).
 * Uses display-friendly enums per tactical UI taxonomy.
 */
export interface IncidentFallbackRow {
  id: string;
  type: IncidentApiType;
  severityLabel: 'Low' | 'Medium' | 'High' | 'Critical';
  statusLabel:
    | 'Reported'
    | 'Verified'
    | 'Dispatched'
    | 'On-Going'
    | 'Resolved'
    | 'False Alarm';
  latitude: number;
  longitude: number;
  address: string;
  barangay: string;
  summary: string;
  updatedAtISO: string;
}

// ---------------------------------------------------------------------------
// Socket event contract (mirror `backend/src/server.ts` + route emitters)
// ---------------------------------------------------------------------------

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  CONNECT_ERROR: 'connect_error',
  DISCONNECT: 'disconnect',
  /** Client emits with `incidentId` string payload. */
  JOIN_INCIDENT: 'join_incident',
  /** Client emits moving responder pings. Server broadcasts globally. */
  RESPONDER_LOCATION_UPDATE: 'responder_location_update',
  /** Broadcast replica of responder movement (different name from persisted `responder_location`). */
  RESPONDER_LOCATION_UPDATED: 'responder_location_updated',
  /** Client submits status deltas; occupants of `incident_${id}` room receive this. */
  INCIDENT_STATUS_UPDATE: 'incident_status_update',
  INCIDENT_UPDATED: 'incident_updated',
  /** Global emits from routers (see incidents / responders / evacuations routes). */
  INCIDENT_UPDATE: 'incident_update',
  RESPONDER_LOCATION: 'responder_location',
  NOTIFICATION: 'notification',
  EMERGENCY_ALERT: 'emergency_alert',
  RESOURCE_UPDATE: 'resource_update',
  EVACUATION_UPDATE: 'evacuation_update',
} as const;

// ---------------------------------------------------------------------------
// Auth token access (SSR-safe + shared storage convention)
// ---------------------------------------------------------------------------

/**
 * Matches `setToStorage(STORAGE_KEYS.AUTH_TOKEN, token)` shape from `@shared/utils`
 * (`JSON.stringify` on strings stores a quoted JWT).
 */
export function readAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (raw == null || raw === '') return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed === 'string') return parsed;
    } catch {
      /* Not JSON-encoded (legacy installs) */
      return raw;
    }
    return raw;
  } catch {
    return null;
  }
}

/** Mirrors `AuthProvider` / `setToStorage` so tokens stay interchangeable. */
export function writeAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, JSON.stringify(token));
  } catch {
    /* noop */
  }
}

export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch {
    /* noop */
  }
}

// ---------------------------------------------------------------------------
// REST surface
// ---------------------------------------------------------------------------

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface ApiCallOptions<TBody = unknown> {
  /** Query string object — arrays are emitted as repeated keys. */
  query?: Record<string, string | number | boolean | string[] | undefined>;
  headers?: HeadersInit;
  body?: TBody extends FormData ? FormData : TBody;
  signal?: AbortSignal;
  /** Total attempts including the first — safe GET replay only unless `dangerouslyRetryNonIdempotent` is true */
  retries?: number;
  /** Opt-in retries for POST/PUT/PATCH/DELETE — default **false**. */
  dangerouslyRetryNonIdempotent?: boolean;
}

export class HttpFaultError extends Error {
  readonly status: number;

  readonly bodySnippet?: string;

  constructor(message: string, status: number, bodySnippet?: string) {
    super(message);
    this.name = 'HttpFaultError';
    this.status = status;
    this.bodySnippet = bodySnippet;
  }
}

function buildQuery(search?: Record<string, string | number | boolean | string[] | undefined>): string {
  if (!search) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, String(v));
    } else {
      params.append(key, String(value));
    }
  }
  const qs = params.toString();
  return qs.length ? `?${qs}` : '';
}

async function consumeBodySnippet(response: Response): Promise<string | undefined> {
  try {
    const text = await response.clone().text();
    return text.length > 480 ? `${text.slice(0, 480)}…` : text;
  } catch {
    return undefined;
  }
}

function shouldRetry(method: HttpMethod, attempt: number, maxAttempts: number, opts?: ApiCallOptions): boolean {
  if (attempt >= maxAttempts - 1) return false;
  if (method === 'GET' || opts?.dangerouslyRetryNonIdempotent === true) return true;
  return false;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Parses JSON responses; unwraps `{ success, data }` envelopes when detected.
 *
 * Bare arrays / primitives pass through verbatim.
 */
export function parseEnvelope<T>(parsed: unknown): T {
  if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const rec = parsed as ApiResponse<T> & { data?: unknown };
    if ('data' in rec && typeof rec.success === 'boolean' && rec.success) {
      return rec.data as T;
    }
  }
  return parsed as T;
}

function normalizeEndpoint(endpoint: string): string {
  if (!endpoint.startsWith('/')) return `/${endpoint}`;
  return endpoint;
}

/**
 * Canonical low-level REST helper — callers pass paths relative to `/api` (`/health`, `/incidents`, …).
 *
 * Mirrors existing front-end conventions (`fetch(${origin}/api/...)`).
 */
export async function apiRequest<T>(
  endpoint: string,
  method: HttpMethod,
  options: ApiCallOptions = {},
): Promise<T> {
  const token = readAuthToken();
  const retries = Math.max(options.retries ?? 1, 1);
  const base = resolveRestBaseUrl();
  const normalized = normalizeEndpoint(endpoint);
  let lastError: unknown;

  const isFormBody = typeof FormData !== 'undefined' && options.body instanceof FormData;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const url = `${base}${normalized}${buildQuery(options.query)}`;
      const headers: HeadersInit = {
        ...(isFormBody ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      };

      const init: RequestInit = {
        method,
        headers,
        ...(options.body !== undefined
          ? { body: isFormBody ? (options.body as FormData) : JSON.stringify(options.body) }
          : {}),
        signal: options.signal,
      };

      const response = await fetch(url, init);

      if (response.ok) {
        if (response.status === 204) return undefined as T;
        const text = await response.text();
        const parsed = text ? JSON.parse(text) : undefined;
        return parseEnvelope<T>(parsed);
      }

      const snippet = await consumeBodySnippet(response);
      throw new HttpFaultError(
        `HTTP ${response.status} on [${method}] ${normalized}`,
        response.status,
        snippet,
      );
    } catch (error) {
      lastError = error;
      console.error(`📡 Network pipeline fault on [${method}] ${endpoint}:`, error);
      const retrying = shouldRetry(method, attempt, retries, options);
      if (!retrying) break;
      const backoff = Math.min(750 * 2 ** attempt, 8_000);
      await sleep(backoff);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function apiGet<T>(endpoint: string, opts?: Omit<ApiCallOptions, 'body'>): Promise<T> {
  return apiRequest<T>(endpoint, 'GET', { ...opts });
}

export async function apiDelete<T>(endpoint: string, opts?: Omit<ApiCallOptions, 'body'>): Promise<T> {
  return apiRequest<T>(endpoint, 'DELETE', opts);
}

export async function apiPost<T, B = unknown>(endpoint: string, body?: B, opts?: Omit<ApiCallOptions<B>, 'body'>): Promise<T> {
  return apiRequest<T>(endpoint, 'POST', { ...opts, body });
}

export async function apiPut<T, B = unknown>(endpoint: string, body?: B, opts?: Omit<ApiCallOptions<B>, 'body'>): Promise<T> {
  return apiRequest<T>(endpoint, 'PUT', { ...opts, body });
}

export async function apiPatch<T, B = unknown>(endpoint: string, body?: B, opts?: Omit<ApiCallOptions<B>, 'body'>): Promise<T> {
  return apiRequest<T>(endpoint, 'PATCH', { ...opts, body });
}

/**
 * Returns live data when available; never throws — surfaces `offline` sentinel for UI loaders.
 *
 * Typical pattern for dashboards: show skeleton/spinner → swap to stale mock matrix with banner.
 */
export async function resilientApiGet<T>(endpoint: string, fallback: T, opts?: Omit<ApiCallOptions, 'body'>): Promise<{
  data: T;
  source: 'network' | 'fallback';
}> {
  try {
    const data = await apiGet<T>(endpoint, opts);
    return { data, source: 'network' };
  } catch {
    console.warn(`📴 Serving cached mock payload for ${endpoint}`);
    return { data: fallback, source: 'fallback' };
  }
}

/** Hard fallback matrix for resilient incident grids/maps (low-cardinality placeholders). */
export const MOCK_INCIDENT_MATRIX: IncidentFallbackRow[] = [
  {
    id: 'demo-ign-001',
    type: 'fire',
    severityLabel: 'Critical',
    statusLabel: 'Dispatched',
    latitude: 14.5995,
    longitude: 120.9842,
    address: 'Roxas Blvd evacuation corridor · demo',
    barangay: 'Ermita',
    summary: 'Structure fire — sprinkler fault — staging medical triage Alpha.',
    updatedAtISO: new Date(Date.now() - 5 * 60_000).toISOString(),
  },
  {
    id: 'demo-hydr-022',
    type: 'flood',
    severityLabel: 'High',
    statusLabel: 'On-Going',
    latitude: 14.628,
    longitude: 121.0369,
    address: 'MarikinaRiver · sensor overshoot demo',
    barangay: 'Marikina Heights',
    summary: 'Rapid inundation — deploy amphibious rigs & verify safe corridors.',
    updatedAtISO: new Date(Date.now() - 18 * 60_000).toISOString(),
  },
  {
    id: 'demo-safe-913',
    type: 'earthquake',
    severityLabel: 'Medium',
    statusLabel: 'Resolved',
    latitude: 14.676,
    longitude: 121.0437,
    address: 'Command staging · structural inspection complete demo',
    barangay: 'Quezon City',
    summary: 'Aftershocks decaying — shelters opened per municipal advisory.',
    updatedAtISO: new Date(Date.now() - 92 * 60_000).toISOString(),
  },
];

/** Generic paging shell seeded from `MOCK_INCIDENT_MATRIX` (map rows to your grid DTO). */
export function incidentMatrixAsPaged<T>(
  mapRow?: (row: IncidentFallbackRow) => T,
): { items: T[]; total: number; page: number; limit: number; totalPages: number } {
  const mapper = mapRow ?? ((row) => row as unknown as T);
  const items = MOCK_INCIDENT_MATRIX.map(mapper);
  return { items, total: items.length, page: 1, limit: items.length || 20, totalPages: 1 };
}

// ---------------------------------------------------------------------------
// Socket.IO singleton orchestration + helpers
// ---------------------------------------------------------------------------

let globalSocket: Socket | null = null;

/** Reconnect policy tuned for degraded LTE / command-link backhaul. */
export const SOCKET_RECONNECT_POLICY = {
  transports: ['websocket', 'polling'] as const,
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 12,
  reconnectionDelay: 1_250,
  reconnectionDelayMax: 12_500,
  randomizationFactor: 0.35,
  timeout: 18_000,
};

const defaultSocketOpts = (): Parameters<typeof io>[1] => ({
  ...SOCKET_RECONNECT_POLICY,
  transports: [...SOCKET_RECONNECT_POLICY.transports],
  auth: (cb: (data: { token: string | null }) => void) => cb({ token: readAuthToken() }),
});

/**
 * Singleton Socket.IO factory — aligns with tactical reconnect cadence tuned for degraded LTE backhaul.
 */
export function getSocketConnection(): Socket {
  if (!globalSocket?.connected && globalSocket) {
    globalSocket.connect();
    return globalSocket;
  }
  if (globalSocket) return globalSocket;

  globalSocket = io(resolveSocketUrl(), defaultSocketOpts());
  globalSocket.on('connect_error', (err) =>
    console.error('⚡ Socket command link negotiation failed:', err.message),
  );
  return globalSocket;
}

/** Forces a clean reconnect cycle (logout / tenant switch hooks). */
export function resetSocketConnection(): void {
  if (!globalSocket) return;
  globalSocket.disconnect();
  globalSocket = null;
}

/**
 * Re-runs the connect handshake (and therefore the `auth` callback) on the *same*
 * socket instance, so listeners already attached elsewhere (e.g. `RealtimeProvider`)
 * keep working. Use this after login/logout instead of `resetSocketConnection` +
 * `getSocketConnection`, which would swap in a new object those listeners never see.
 */
export function reauthenticateSocket(): void {
  if (!globalSocket) {
    getSocketConnection();
    return;
  }
  globalSocket.disconnect();
  globalSocket.connect();
}

export interface IncidentRoomHandlers {
  onIncidentUpdated?: (payload: Record<string, unknown>) => void;
}

export function joinIncidentChannel(
  incidentId: string,
  handlers: IncidentRoomHandlers,
  socket: Socket = getSocketConnection(),
): () => void {
  socket.emit(SOCKET_EVENTS.JOIN_INCIDENT, incidentId);
  const handler = handlers.onIncidentUpdated;
  const roomEvent = SOCKET_EVENTS.INCIDENT_UPDATED;
  if (!handler) {
    return () => {};
  }
  socket.on(roomEvent, handler as (...args: unknown[]) => void);
  return () => socket.off(roomEvent, handler as (...args: unknown[]) => void);
}

export interface ResponderPresenceHandlers {
  onBroadcast?: (payload: Record<string, unknown>) => void;
  onOfficial?: (payload: Record<string, unknown>) => void;
}

/** Subscribe once to responder movement fan-out + persisted snapshot events. */
export function subscribeResponderTelemetry(handlers: ResponderPresenceHandlers, socket = getSocketConnection()) {
  const b = handlers.onBroadcast;
  const o = handlers.onOfficial;
  if (b) socket.on(SOCKET_EVENTS.RESPONDER_LOCATION_UPDATED, b as (...args: unknown[]) => void);
  if (o) socket.on(SOCKET_EVENTS.RESPONDER_LOCATION, o as (...args: unknown[]) => void);
  return () => {
    if (b) socket.off(SOCKET_EVENTS.RESPONDER_LOCATION_UPDATED, b as (...args: unknown[]) => void);
    if (o) socket.off(SOCKET_EVENTS.RESPONDER_LOCATION, o as (...args: unknown[]) => void);
  };
}

/** Socket / REST payloads may carry Mongo `_id` + backend enums not yet synced to `@shared/types` — normalize here before view models consume. */
export interface IncidentRealtimeSnapshot {
  id?: string;
  title?: string;
  type?: string;
  severity?: string;
  status?: string;
  location?: { lat: number; lng: number };
}

/** Utility bridge for realtime listeners mapping unknown envelopes into a stable tactical snapshot shape. */
export function coerceIncidentSnapshot(payload: unknown): IncidentRealtimeSnapshot | null {
  if (!payload || typeof payload !== 'object') return null;
  const rec = payload as Record<string, unknown>;
  const idCandidate = typeof rec._id === 'string' ? rec._id : typeof rec.id === 'string' ? rec.id : undefined;
  if (!idCandidate) return null;
  const title = typeof rec.title === 'string' ? rec.title : undefined;
  const statusRaw = typeof rec.status === 'string' ? rec.status : undefined;

  let lat: number | undefined;
  let lng: number | undefined;
  const loc = rec.location;
  if (loc && typeof loc === 'object' && loc !== null) {
    const l = loc as Record<string, unknown>;
    if (typeof l.latitude === 'number') lat = l.latitude;
    if (typeof l.longitude === 'number') lng = l.longitude;
  }

  const snapshot: IncidentRealtimeSnapshot = {
    id: idCandidate,
    title: title ?? 'Incident snapshot',
    type: typeof rec.type === 'string' ? rec.type : 'other',
    severity: typeof rec.severity === 'string' ? rec.severity : 'medium',
    status: statusRaw ?? 'reported',
  };
  if (lat !== undefined && lng !== undefined) {
    snapshot.location = { lat, lng };
  }
  return snapshot;
}
