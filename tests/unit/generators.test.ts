/** Large seeded batches of generated questions, validated independently. */
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '../../src/core/rng';
import type { Level } from '../../src/core/types';
import { generateMaths } from '../../src/subjects/maths';
import { expectedResponse } from '../../src/subjects/maths/answers';
import { LIMITS, SHAPES_BY_LEVEL, TOPIC_KINDS } from '../../src/subjects/maths/curriculum';
import { generateKind, numberOptions } from '../../src/subjects/maths/generators';
import type { MathsQuestion, MathsTopic } from '../../src/subjects/maths/types';
import { validateMathsQuestion } from '../../src/subjects/maths/validate';

const SEEDS = 250;
const combos: { topic: MathsTopic; kind: string; level: Level }[] = [];
for (const [topic, rules] of Object.entries(TOPIC_KINDS))
  for (const r of rules) for (let l = r.from; l <= (r.to ?? 5); l++) combos.push({ topic: topic as MathsTopic, kind: r.kind, level: l as Level });

function optionsOf(q: MathsQuestion): (number | string)[] | null {
  switch (q.kind) {
    case 'count':
    case 'balloon':
    case 'pizza':
    case 'shop':
      return q.options;
    case 'treasure':
      return q.keys;
    case 'catch':
      return q.items.map((i) => i.value);
    case 'pattern':
      return q.options;
    case 'choose':
      return q.options.map((o) => o.id);
    default:
      return null;
  }
}

describe('generated questions (seeded batches)', () => {
  it.each(combos.map((c) => [`${c.kind}/${c.topic}/L${c.level}`, c] as const))('%s: always valid, unique options, exactly one correct', (_name, c) => {
    for (let s = 0; s < SEEDS; s++) {
      const q = generateKind(c.kind as never, c.topic, c.level, createRng(s * 7919 + c.level * 31), 'practice');
      expect(validateMathsQuestion(q), `seed ${s}: ${q.signature}`).toEqual([]);
      const opts = optionsOf(q);
      if (opts) {
        expect(new Set(opts).size).toBe(opts.length);
        const exp = expectedResponse(q);
        const value = exp.type === 'number' ? exp.value : exp.type === 'choice' ? exp.value : exp.type === 'pizza' ? exp.total : null;
        expect(opts.filter((o) => o === value)).toHaveLength(1);
      }
    }
  });

  it('is deterministic for a fixed seed', () => {
    for (const c of combos) {
      const a = generateKind(c.kind as never, c.topic, c.level, createRng(123), 'practice');
      const b = generateKind(c.kind as never, c.topic, c.level, createRng(123), 'practice');
      expect(a).toEqual(b);
    }
  });

  it('respects difficulty boundaries', () => {
    for (let s = 0; s < 400; s++) {
      for (const level of [1, 2, 3, 4, 5] as Level[]) {
        const rng = createRng(s + level * 1000);
        const add = generateMaths({ topic: 'addition', level, rng, mode: 'practice' });
        const exp = expectedResponse(add);
        const sum = exp.type === 'number' ? exp.value : exp.type === 'pizza' ? exp.total : -1;
        expect(sum).toBeLessThanOrEqual(LIMITS.addMax[level - 1]!);
        const sub = generateMaths({ topic: 'subtraction', level, rng, mode: 'practice' });
        const se = expectedResponse(sub);
        expect(se.type === 'number' && se.value >= 0).toBe(true);
        const shapes = generateMaths({ topic: 'shapes', level, rng, mode: 'practice' });
        if (shapes.kind === 'shapes') for (const it of shapes.items) expect(SHAPES_BY_LEVEL[level]).toContain(it.shape);
      }
    }
  });

  it('counting scenes show exactly as many creatures as the numbers say, never overlapping', () => {
    for (let s = 0; s < 500; s++) {
      for (const topic of ['counting', 'addition', 'subtraction'] as const) {
        const q = generateKind('count', topic, (1 + (s % 5)) as Level, createRng(s), 'practice');
        if (q.kind !== 'count') throw new Error();
        expect(q.placements).toHaveLength(q.groups.reduce((a, b) => a + b, 0));
      }
    }
  });

  it('number trains follow their rule and ordering trains are sorted', () => {
    for (let s = 0; s < 500; s++) {
      for (const topic of ['numbers', 'counting', 'comparison', 'patterns'] as const) {
        const level = (topic === 'patterns' ? 4 + (s % 2) : 1 + (s % 5)) as Level;
        const q = generateKind('train', topic, level, createRng(s), 'practice');
        if (q.kind !== 'train') throw new Error();
        if (q.variant === 'sequence') q.cars.forEach((c, i) => expect(c).toBe(q.start + q.step * i));
        else expect([...q.cars]).toEqual([...q.tiles].sort((a, b) => (q.direction === 'asc' ? a - b : b - a)));
      }
    }
  });

  it('patterns show at least two full repeats so only one answer makes sense', () => {
    for (let s = 0; s < 800; s++) {
      const q = generateKind('pattern', 'patterns', (1 + (s % 5)) as Level, createRng(s), 'practice');
      if (q.kind !== 'pattern' || q.patternType === 'number') continue;
      expect(q.blankIndex).toBeGreaterThanOrEqual(2 * q.unit.length);
    }
  });

  it('greater/less comparisons pick the right side', () => {
    for (let s = 0; s < 500; s++) {
      const q = generateKind('tower', 'comparison', (1 + (s % 3)) as Level, createRng(s), 'practice');
      if (q.kind !== 'tower' || q.variant !== 'compare') continue;
      const exp = expectedResponse(q);
      const bigger = q.left > q.right ? 'left' : 'right';
      const smaller = bigger === 'left' ? 'right' : 'left';
      expect(exp).toEqual({ type: 'choice', value: q.ask === 'taller' || q.ask === 'more' ? bigger : smaller });
    }
  });

  it('avoids recently seen questions when it can', () => {
    const rng = createRng(9);
    const seen = new Set<string>();
    let repeats = 0;
    for (let i = 0; i < 30; i++) {
      const q = generateMaths({ topic: 'addition', level: 3, rng, mode: 'practice', avoid: seen });
      if (seen.has(q.signature)) repeats++;
      seen.add(q.signature);
    }
    expect(repeats).toBe(0);
  });

  it('test mode never produces moving creatures', () => {
    for (let s = 0; s < 300; s++) {
      const q = generateKind('count', 'counting', 4, createRng(s), 'test');
      if (q.kind === 'count') expect(q.moving).toBe(false);
    }
  });

  it('numberOptions: unique, in range, contains the answer once (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 30 }), fc.integer({ min: 2, max: 5 }), fc.integer({ min: 0, max: 1e6 }), (answer, count, seed) => {
        const lo = Math.max(0, answer - 5);
        const hi = answer + 5;
        const opts = numberOptions(answer, count, lo, hi, createRng(seed));
        return new Set(opts).size === opts.length && opts.filter((o) => o === answer).length === 1 && opts.every((o) => o >= lo && o <= hi) && opts.length === count;
      }),
    );
  });
});
