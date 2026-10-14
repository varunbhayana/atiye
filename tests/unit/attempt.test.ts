import { describe, expect, it } from 'vitest';
import { attemptReducer, initialAttempt } from '../../src/core/attempt';

const R = { type: 'number' as const, value: 1 };
const run = (mode: 'practice' | 'test', actions: Parameters<typeof attemptReducer>[1][]) => actions.reduce(attemptReducer, initialAttempt(mode));

describe('attempt lifecycle', () => {
  it('first try correct', () => expect(run('practice', [{ type: 'submit', response: R, correct: true }]).resolved?.outcome).toBe('first'));
  it('correct after retry', () =>
    expect(run('practice', [{ type: 'submit', response: R, correct: false }, { type: 'submit', response: R, correct: true }]).resolved?.outcome).toBe('retry'));
  it('correct after hint', () => expect(run('practice', [{ type: 'hint' }, { type: 'submit', response: R, correct: true }]).resolved?.outcome).toBe('hint'));
  it('incorrect after three wrong tries', () => {
    const s = run('practice', [1, 2, 3].map(() => ({ type: 'submit' as const, response: R, correct: false })));
    expect(s.resolved?.outcome).toBe('incorrect');
    expect(s.tries).toBe(3);
  });
  it('skip', () => expect(run('practice', [{ type: 'skip' }]).resolved?.outcome).toBe('skipped'));
  it('ignores repeated clicks after resolution', () => {
    const s = run('practice', [
      { type: 'submit', response: R, correct: true },
      { type: 'submit', response: R, correct: true },
      { type: 'submit', response: R, correct: false },
      { type: 'hint' },
    ]);
    expect(s.tries).toBe(1);
    expect(s.resolved?.outcome).toBe('first');
  });
  it('test mode: first answer is final, hints unavailable', () => {
    const s = run('test', [{ type: 'hint' }, { type: 'submit', response: R, correct: false }, { type: 'submit', response: R, correct: true }]);
    expect(s.hintUsed).toBe(false);
    expect(s.resolved?.outcome).toBe('incorrect');
    expect(s.tries).toBe(1);
  });
});
