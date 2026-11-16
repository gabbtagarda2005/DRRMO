import { canTransition, getNextStatuses, isIncidentStatus } from '../incidentStateMachine.js';

describe('incident state machine', () => {
  it('recognizes valid status strings', () => {
    expect(isIncidentStatus('reported')).toBe(true);
    expect(isIncidentStatus('bogus')).toBe(false);
  });

  it('allows the standard forward pipeline', () => {
    expect(canTransition('reported', 'verified')).toBe(true);
    expect(canTransition('verified', 'responding')).toBe(true);
    expect(canTransition('responding', 'in_progress')).toBe(true);
    expect(canTransition('in_progress', 'resolved')).toBe(true);
    expect(canTransition('resolved', 'closed')).toBe(true);
  });

  it('allows closing from any non-terminal state', () => {
    expect(canTransition('reported', 'closed')).toBe(true);
    expect(canTransition('verified', 'closed')).toBe(true);
    expect(canTransition('responding', 'closed')).toBe(true);
    expect(canTransition('in_progress', 'closed')).toBe(true);
  });

  it('rejects skipping steps', () => {
    expect(canTransition('reported', 'responding')).toBe(false);
    expect(canTransition('reported', 'in_progress')).toBe(false);
    expect(canTransition('reported', 'resolved')).toBe(false);
  });

  it('rejects moving backward', () => {
    expect(canTransition('responding', 'reported')).toBe(false);
    expect(canTransition('resolved', 'verified')).toBe(false);
  });

  it('treats closed as terminal', () => {
    expect(getNextStatuses('closed')).toEqual([]);
    expect(canTransition('closed', 'reported')).toBe(false);
  });

  it('rejects unknown status values', () => {
    expect(canTransition('reported', 'bogus')).toBe(false);
    expect(canTransition('bogus', 'reported')).toBe(false);
  });
});
