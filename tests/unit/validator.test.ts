/** The validator must catch broken questions on its own, without trusting the generator. */
import { describe, expect, it } from 'vitest';
import { createRng } from '../../src/core/rng';
import { generateKind } from '../../src/subjects/maths/generators';
import type { MathsQuestion } from '../../src/subjects/maths/types';
import { validateMathsQuestion } from '../../src/subjects/maths/validate';

const gen = <K extends MathsQuestion['kind']>(kind: K, topic: string, level = 2, seed = 1) => generateKind(kind as never, topic as never, level as never, createRng(seed), 'practice') as Extract<MathsQuestion, { kind: K }>;

describe('validator independence', () => {
  it('rejects a counting scene whose picture count does not match', () => {
    const q = gen('count', 'counting');
    expect(validateMathsQuestion({ ...q, placements: q.placements.slice(1) })).not.toEqual([]);
  });
  it('rejects duplicate options and missing correct option', () => {
    const q = gen('balloon', 'addition');
    expect(validateMathsQuestion({ ...q, options: [q.options[0]!, q.options[0]!] })).not.toEqual([]);
    const ans = q.task.type === 'add' ? q.task.a + q.task.b : -1;
    expect(validateMathsQuestion({ ...q, options: q.options.filter((o) => o !== ans) })).not.toEqual([]);
  });
  it('rejects a train whose carriages break the rule', () => {
    const q = gen('train', 'numbers');
    const cars = q.cars.slice();
    cars[0] = cars[0]! + 5;
    expect(validateMathsQuestion({ ...q, cars })).not.toEqual([]);
  });
  it('rejects an ambiguous pattern (too few repeats)', () => {
    const q = gen('pattern', 'patterns', 1);
    expect(validateMathsQuestion({ ...q, sequence: q.sequence.slice(0, 3), blankIndex: 2 })).not.toEqual([]);
  });
  it('rejects ambiguous shapes (a "square" that is really a rectangle)', () => {
    const q = gen('shapes', 'shapes', 3, 4);
    const items = q.items.map((i) => (i.shape === 'square' || i.shape === 'circle' ? { ...i, w: i.w * 1.3 } : i));
    if (items.some((i, k) => i !== q.items[k])) expect(validateMathsQuestion({ ...q, items })).not.toEqual([]);
  });
  it('rejects shapes not taught at the level', () => {
    const q = gen('shapes', 'shapes', 1, 2);
    expect(validateMathsQuestion({ ...q, target: 'star' })).not.toEqual([]);
  });
  it('rejects a Look & Choose question with a tie', () => {
    const q = gen('choose', 'comparison', 2, 3);
    const options = q.options.map((o) => ({ ...o, facts: { ...o.facts, count: 3, value: 3 } }));
    expect(validateMathsQuestion({ ...q, options })).not.toEqual([]);
  });
  it('rejects addition beyond the level limit', () => {
    const q = gen('balloon', 'addition', 1);
    expect(validateMathsQuestion({ ...q, task: { type: 'add', a: 9, b: 9 }, options: [18, 17, 19] })).not.toEqual([]);
  });
  it('rejects shop spending more than you have', () => {
    const q = gen('shop', 'subtraction', 2);
    expect(validateMathsQuestion({ ...q, amount: q.have + 1 })).not.toEqual([]);
  });
  it('rejects a frog that would leave the number line', () => {
    const q = gen('numberline', 'subtraction', 1);
    expect(validateMathsQuestion({ ...q, jumps: q.start + 1 })).not.toEqual([]);
  });
  it('rejects equal towers in a comparison', () => {
    const q = gen('tower', 'comparison', 2);
    expect(validateMathsQuestion({ ...q, variant: 'compare', right: q.left })).not.toEqual([]);
  });
});
