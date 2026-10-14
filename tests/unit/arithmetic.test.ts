/** Exhaustive checks for every bounded addition / subtraction a child can meet (0–20). */
import { describe, expect, it } from 'vitest';
import { checkAnswer, expectedResponse } from '../../src/subjects/maths/answers';
import type { BalloonQuestion, NumberTask } from '../../src/subjects/maths/types';
import { validateMathsQuestion } from '../../src/subjects/maths/validate';

function balloon(task: NumberTask, options: number[], topic: BalloonQuestion['topic'] = 'addition', level: 1 | 2 | 3 | 4 | 5 = 5): BalloonQuestion {
  return { id: 'b', subject: 'maths', topic, level, kind: 'balloon', task, options, prompt: 'p', signature: 's' };
}

describe('addition 0–20 (exhaustive)', () => {
  it('every pair a+b ≤ 20 has the right answer and only it is accepted', () => {
    let checked = 0;
    for (let a = 0; a <= 20; a++)
      for (let b = 0; a + b <= 20; b++) {
        const q = balloon({ type: 'add', a, b }, [a + b, a + b + 1, a + b + 2]);
        expect(expectedResponse(q)).toEqual({ type: 'number', value: a + b });
        expect(checkAnswer(q, { type: 'number', value: a + b })).toBe(true);
        for (let wrong = 0; wrong <= 22; wrong++) if (wrong !== a + b) expect(checkAnswer(q, { type: 'number', value: wrong })).toBe(false);
        expect(validateMathsQuestion(q)).toEqual([]);
        checked++;
      }
    expect(checked).toBe(231);
  });
});

describe('subtraction 0–20 (exhaustive, non-negative)', () => {
  it('every pair b ≤ a ≤ 20 is correct and never negative', () => {
    let checked = 0;
    for (let a = 0; a <= 20; a++)
      for (let b = 0; b <= a; b++) {
        const q = balloon({ type: 'sub', a, b }, [a - b, a - b + 1, a - b + 2], 'subtraction');
        expect(expectedResponse(q)).toEqual({ type: 'number', value: a - b });
        expect(checkAnswer(q, { type: 'number', value: a - b })).toBe(true);
        expect(checkAnswer(q, { type: 'number', value: a - b + 1 })).toBe(false);
        expect(validateMathsQuestion(q)).toEqual([]);
        checked++;
      }
    expect(checked).toBe(231);
  });
  it('the validator rejects a subtraction that would go negative', () => {
    const q = balloon({ type: 'sub', a: 2, b: 5 }, [0, 1, 3], 'subtraction');
    expect(validateMathsQuestion(q).join()).toMatch(/negative/);
  });
});

describe('before / after / between', () => {
  it('computes neighbours correctly for 0–50', () => {
    for (let n = 1; n <= 49; n++) {
      expect(expectedResponse(balloon({ type: 'after', n }, [n + 1, n + 2], 'numbers'))).toEqual({ type: 'number', value: n + 1 });
      expect(expectedResponse(balloon({ type: 'before', n }, [n - 1, n + 2], 'numbers'))).toEqual({ type: 'number', value: n - 1 });
      expect(expectedResponse(balloon({ type: 'between', low: n - 1, high: n + 1 }, [n, n + 2], 'numbers'))).toEqual({ type: 'number', value: n });
    }
  });
});
