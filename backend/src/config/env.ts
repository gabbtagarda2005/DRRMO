/**
 * Centralised access to security-sensitive environment values.
 *
 * In production the server refuses to sign or verify tokens with a guessable
 * fallback secret — a missing JWT_SECRET is a deployment error, not a default.
 */
const DEV_FALLBACK_SECRET = 'drrmo-local-dev-secret';

export const isProduction = () => process.env.NODE_ENV === 'production';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.trim().length > 0) return secret;
  if (isProduction()) {
    throw new Error('JWT_SECRET must be set in production');
  }
  return DEV_FALLBACK_SECRET;
}

/** Fail fast at boot so a misconfigured deploy never starts serving traffic. */
export function assertProductionEnv(): void {
  if (!isProduction()) return;
  const missing = ['MONGODB_URI', 'JWT_SECRET'].filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
