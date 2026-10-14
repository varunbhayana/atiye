/**
 * Lifecycle of a single question attempt (practice and test). Pure reducer.
 * Guarantees: an attempt resolves exactly once; repeated clicks, double submissions or
 * replayed animations after resolution are ignored and cannot change the outcome.
 */
import type { AnswerResponse, Outcome } from './types';

export const PRACTICE_MAX_TRIES = 3;

export interface AttemptState {
  mode: 'practice' | 'test';
  tries: number;
  hintUsed: boolean;
  wrongResponses: AnswerResponse[];
  lastFeedback: 'none' | 'correct' | 'wrong';
  resolved: null | { outcome: Outcome; response: AnswerResponse | null; correct: boolean };
}

export type AttemptAction =
  | { type: 'submit'; response: AnswerResponse; correct: boolean }
  | { type: 'hint' }
  | { type: 'skip' }
  | { type: 'reset' };

export function initialAttempt(mode: 'practice' | 'test'): AttemptState {
  return { mode, tries: 0, hintUsed: false, wrongResponses: [], lastFeedback: 'none', resolved: null };
}

export function outcomeFor(correct: boolean, tries: number, hintUsed: boolean): Outcome {
  if (!correct) return 'incorrect';
  if (tries <= 1 && !hintUsed) return 'first';
  return hintUsed ? 'hint' : 'retry';
}

export function attemptReducer(s: AttemptState, a: AttemptAction): AttemptState {
  if (a.type === 'reset') return initialAttempt(s.mode);
  if (s.resolved) return s; // already final: ignore duplicate submissions, clicks, hints
  switch (a.type) {
    case 'hint':
      // hints are not available in tests
      return s.mode === 'test' ? s : { ...s, hintUsed: true };
    case 'skip':
      return { ...s, resolved: { outcome: 'skipped', response: null, correct: false } };
    case 'submit': {
      const tries = s.tries + 1;
      if (s.mode === 'test') {
        // first committed answer is final; no feedback is shown
        return { ...s, tries, resolved: { outcome: a.correct ? 'first' : 'incorrect', response: a.response, correct: a.correct } };
      }
      if (a.correct) {
        return { ...s, tries, lastFeedback: 'correct', resolved: { outcome: outcomeFor(true, tries, s.hintUsed), response: a.response, correct: true } };
      }
      const wrongResponses = [...s.wrongResponses, a.response];
      if (tries >= PRACTICE_MAX_TRIES) {
        return { ...s, tries, wrongResponses, lastFeedback: 'wrong', resolved: { outcome: 'incorrect', response: a.response, correct: false } };
      }
      return { ...s, tries, wrongResponses, lastFeedback: 'wrong' };
    }
  }
}
