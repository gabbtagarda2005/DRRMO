/**
 * Framework-free formatting + export helpers shared by every web client.
 */
import { HttpFaultError } from './api';

/** "in_progress" → "In progress" */
export function humanize(value: string | undefined | null): string {
  if (!value) return '—';
  const text = value.replace(/[_-]+/g, ' ').trim().replace(/drrmo/gi, 'DRRMO');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function timeAgo(input: string | number | Date | undefined | null): string {
  if (!input) return '—';
  const then = new Date(input).getTime();
  if (Number.isNaN(then)) return '—';
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return formatDate(input);
}

export function formatDate(input: string | number | Date | undefined | null): string {
  if (!input) return '—';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(input: string | number | Date | undefined | null): string {
  if (!input) return '—';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function formatDuration(totalSeconds: number): string {
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/** Extracts the backend's `{ message }` from an HttpFaultError, falling back to a friendly default. */
export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof HttpFaultError) {
    if (error.bodySnippet) {
      try {
        const parsed = JSON.parse(error.bodySnippet) as { message?: string };
        if (parsed.message) return parsed.message;
      } catch {
        /* non-JSON body */
      }
    }
    if (error.status === 401) return 'Your session has expired. Please sign in again.';
    if (error.status === 403) return 'You do not have permission to do that.';
    if (error.status === 429) return 'Too many requests. Please wait a moment and try again.';
    return fallback;
  }
  if (error instanceof TypeError) return 'Cannot reach the DRRMO server. Check your connection.';
  return error instanceof Error && error.message ? error.message : fallback;
}

type CsvValue = string | number | boolean | null | undefined | Date;

function csvCell(value: CsvValue): string {
  if (value === null || value === undefined) return '';
  const text = value instanceof Date ? value.toISOString() : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Builds a CSV (with BOM so Excel opens UTF-8 correctly) and triggers a browser download. */
export function downloadCsv(filename: string, rows: Record<string, CsvValue>[]): void {
  const headers = rows.length > 0 ? Object.keys(rows[0]) : ['(no records)'];
  const lines = [headers.map(csvCell).join(','), ...rows.map((row) => headers.map((h) => csvCell(row[h])).join(','))];
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function fullName(person?: { firstName?: string; lastName?: string } | null): string {
  if (!person) return '—';
  return [person.firstName, person.lastName].filter(Boolean).join(' ') || '—';
}

/** The login response carries `id`; `/users/me` carries `_id`. Accept either. */
export function userIdOf(user: unknown): string | undefined {
  if (!user || typeof user !== 'object') return undefined;
  const u = user as { id?: unknown; _id?: unknown };
  const id = u.id ?? u._id;
  return id ? String(id) : undefined;
}
