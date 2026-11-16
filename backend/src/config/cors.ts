import type { CorsOptions } from 'cors';

/**
 * CORS_ORIGIN is a comma-separated list. Entries may be exact origins
 * (`https://drrmo-admin.vercel.app`) or contain `*` wildcards
 * (`https://drrmo-*.vercel.app`) to cover Vercel preview deployments.
 * A lone `*` allows every origin (not recommended in production).
 */
function configuredOrigins(): string[] {
  return process.env.CORS_ORIGIN?.split(',').map((s) => s.trim().replace(/\/+$/, '')).filter(Boolean) ?? [];
}

function toMatcher(pattern: string): (origin: string) => boolean {
  if (pattern === '*') return () => true;
  if (!pattern.includes('*')) return (origin) => origin === pattern;
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[a-z0-9-]+');
  const re = new RegExp(`^${escaped}$`, 'i');
  return (origin) => re.test(origin);
}

const isDev = () => process.env.NODE_ENV !== 'production';

export function isOriginAllowed(origin: string | undefined): boolean {
  // Same-origin requests, curl, mobile apps and server-to-server calls send no Origin header.
  if (!origin) return true;
  if (isDev()) return true;
  return configuredOrigins().map(toMatcher).some((match) => match(origin));
}

const originCallback = (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
  cb(null, isOriginAllowed(origin));
};

export function getCorsOptions(): CorsOptions {
  return { origin: originCallback, credentials: true };
}

export function getSocketCorsOrigin() {
  return originCallback;
}
