import rateLimit from 'express-rate-limit';

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;

/**
 * General API limiter. Dashboards poll and refetch on focus, and a whole
 * municipal office may share one public IP, so the default is generous.
 */
export const apiRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 1500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many requests from this IP, please try again shortly.' },
});

/** Brute-force guard for login/register: only failed attempts count against the budget. */
export const authRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many failed sign-in attempts. Please wait 15 minutes and try again.' },
});
