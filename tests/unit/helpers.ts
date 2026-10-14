import { createProfile, type AttemptRecord, type ProfileData } from '../../src/core/state';
import type { Level, Outcome } from '../../src/core/types';
import { MATHS_TOPICS } from '../../src/subjects/maths/types';

export function profile(over: Partial<ProfileData['settings']> = {}): ProfileData {
  return createProfile({ name: 'Test', age: 5, schoolClass: 'ukg', settings: over }, { maths: [...MATHS_TOPICS] });
}

let n = 0;
export function attempt(topic: string, outcome: Outcome, level: Level = 1, extra: Partial<AttemptRecord> = {}): AttemptRecord {
  n++;
  return {
    id: `a${n}`,
    ts: 1_700_000_000_000 + n * 1000,
    sessionId: 's',
    mode: 'practice',
    subject: 'maths',
    topic,
    kind: 'balloon',
    level,
    outcome,
    tries: outcome === 'first' ? 1 : 2,
    hintUsed: outcome === 'hint',
    signature: `sig${n}`,
    question: 'q',
    response: 'r',
    correctAnswer: 'c',
    ...extra,
  };
}
