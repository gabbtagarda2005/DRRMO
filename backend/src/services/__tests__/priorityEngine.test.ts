import { calculateIncidentPriority } from '../priorityEngine.js';

describe('calculateIncidentPriority', () => {
  it('rates a low-severity report with no casualties as low priority', () => {
    const result = calculateIncidentPriority({
      type: 'other',
      severity: 'low',
      affectedCount: 0,
      injuredCount: 0,
      ageMinutes: 0,
    });
    expect(result.level).toBe('low');
    expect(result.reason).toContain('LOW');
  });

  it('escalates to critical whenever there are injuries on a high/critical severity incident', () => {
    const result = calculateIncidentPriority({
      type: 'accident',
      severity: 'high',
      affectedCount: 2,
      injuredCount: 1,
      ageMinutes: 5,
    });
    expect(result.level).toBe('critical');
    expect(result.reason).toContain('injured persons');
  });

  it('does not escalate to critical from injuries alone at low/medium severity', () => {
    const result = calculateIncidentPriority({
      type: 'other',
      severity: 'low',
      affectedCount: 1,
      injuredCount: 1,
      ageMinutes: 0,
    });
    expect(result.level).not.toBe('critical');
  });

  it('increases score as an incident waits longer for a response', () => {
    const fresh = calculateIncidentPriority({
      type: 'flood',
      severity: 'medium',
      affectedCount: 5,
      injuredCount: 0,
      ageMinutes: 0,
    });
    const stale = calculateIncidentPriority({
      type: 'flood',
      severity: 'medium',
      affectedCount: 5,
      injuredCount: 0,
      ageMinutes: 180,
    });
    expect(stale.score).toBeGreaterThan(fresh.score);
  });

  it('rates a critical earthquake with many affected people as critical', () => {
    const result = calculateIncidentPriority({
      type: 'earthquake',
      severity: 'critical',
      affectedCount: 100,
      injuredCount: 10,
      ageMinutes: 30,
    });
    expect(result.level).toBe('critical');
  });
});
