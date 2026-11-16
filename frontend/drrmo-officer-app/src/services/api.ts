import type { HttpMethod } from '@shared/src/api';
import {
  apiRequest,
  readAuthToken,
  resolveApiOrigin,
} from '@shared/src/api';

/** Path relative to `/api` (`/health`, `/incidents`). Also accepts `/api/foo` → `/foo`. */
function toApiSuffix(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (p.startsWith('/api')) {
    const suffix = p.slice('/api'.length);
    return suffix.length ? suffix : '/';
  }
  return p;
}

/**
 * Builds an absolute URL for display, uploads, or non-REST fetch use cases.
 * Accepts `/api/...` or shorthand routes (`/incidents`).
 */
export function buildApiUrl(path: string): string {
  const origin = resolveApiOrigin().replace(/\/+$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized.startsWith('/api')) {
    return `${origin}${normalized}`;
  }
  return `${origin}/api${normalized}`;
}

/** Headers suited for authenticated JSON calls (prefer `apiRequest` from `@shared/src/api`). */
export function getAuthHeaders(): HeadersInit {
  const token = readAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Legacy helper — proxies through the unified `apiRequest` with bearer + envelope parsing. */
export async function fetchJson<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const suffix = toApiSuffix(path);
  const method = (options.method ?? 'GET').toUpperCase() as HttpMethod;

  let bodyPayload: unknown;
  const rawBody = options.body;
  if (typeof rawBody === 'string' && rawBody.trim().length) {
    try {
      bodyPayload = JSON.parse(rawBody);
    } catch {
      bodyPayload = undefined;
    }
  }

  const extraHeaders =
    typeof options.headers === 'object' && options.headers !== null ? options.headers : undefined;

  return apiRequest<T>(suffix, method, {
    ...(bodyPayload !== undefined ? { body: bodyPayload } : {}),
    ...(extraHeaders !== undefined ? { headers: extraHeaders } : {}),
  });
}
