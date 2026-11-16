export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface PriorityInput {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedCount: number;
  injuredCount: number;
  ageMinutes: number;
}

export interface PriorityResult {
  score: number;
  level: PriorityLevel;
  reason: string;
}

const SEVERITY_WEIGHT: Record<string, number> = {
  low: 5,
  medium: 15,
  high: 30,
  critical: 45,
};

const TYPE_RISK_WEIGHT: Record<string, number> = {
  earthquake: 15,
  fire: 15,
  flood: 12,
  landslide: 12,
  typhoon: 10,
  accident: 8,
  other: 5,
};

/**
 * Deterministic, transparent scoring — NOT an AI/ML model.
 * score is unbounded-but-typically-0..~120; level is derived from fixed thresholds.
 */
export function calculateIncidentPriority(input: PriorityInput): PriorityResult {
  const severityWeight = SEVERITY_WEIGHT[input.severity] ?? SEVERITY_WEIGHT.low;
  const typeWeight = TYPE_RISK_WEIGHT[input.type] ?? TYPE_RISK_WEIGHT.other;
  const affectedWeight = Math.min(input.affectedCount, 200) * 0.15;
  const injuredWeight = Math.min(input.injuredCount, 100) * 1.5;
  const waitWeight = Math.min(Math.max(input.ageMinutes, 0), 240) * 0.1;

  const score = Math.round(severityWeight + typeWeight + affectedWeight + injuredWeight + waitWeight);

  let level: PriorityLevel;
  if (input.injuredCount > 0 && (input.severity === 'critical' || input.severity === 'high')) {
    level = 'critical';
  } else if (score >= 55) {
    level = 'critical';
  } else if (score >= 35) {
    level = 'high';
  } else if (score >= 18) {
    level = 'medium';
  } else {
    level = 'low';
  }

  const reason = buildReason(level, input);

  return { score, level, reason };
}

function buildReason(level: PriorityLevel, input: PriorityInput): string {
  const parts: string[] = [];

  if (input.injuredCount > 0) {
    parts.push('reported injured persons');
  }
  if (input.affectedCount > 20) {
    parts.push(`${input.affectedCount} people affected`);
  }
  if (input.severity === 'critical' || input.severity === 'high') {
    parts.push(`${input.severity} severity ${input.type}`);
  }
  if (input.ageMinutes > 60) {
    parts.push(`waiting ${Math.round(input.ageMinutes)} minutes for response`);
  }

  const detail = parts.length > 0 ? parts.join(', ') : `${input.severity} severity ${input.type} report`;
  const label = level.toUpperCase();

  if (level === 'critical') {
    return `${label} — life-threatening emergency with ${detail}.`;
  }
  if (level === 'high') {
    return `${label} — significant emergency with ${detail}.`;
  }
  if (level === 'medium') {
    return `${label} — moderate emergency with ${detail}.`;
  }
  return `${label} — limited-impact report (${detail}).`;
}
