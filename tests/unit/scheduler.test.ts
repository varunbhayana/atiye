import { describe, expect, it } from 'vitest';
import { createRng } from '../../src/core/rng';
import { maxConsecutiveSameKind, planSession } from '../../src/core/scheduler';
import { mathsSubject } from '../../src/subjects/maths';
import { CONCRETE_KINDS } from '../../src/subjects/maths/curriculum';
import { MATHS_TOPICS } from '../../src/subjects/maths/types';
import { buildJourneyPlan } from '../../src/screens/Journey';
import { planTreasureHunt } from '../../src/screens/TreasureHunt';

const base = { levelOf: () => 2 as const, kindsFor: (t: string, l: 1 | 2 | 3 | 4 | 5) => mathsSubject.kindsFor(t, l), concreteKinds: CONCRETE_KINDS, struggling: new Set<string>() };

describe('activity rotation', () => {
  it('never repeats the same game twice in a row when alternatives exist', () => {
    for (let s = 0; s < 200; s++) {
      for (const topics of [['addition'], ['counting'], [...MATHS_TOPICS], ['subtraction', 'numbers']]) {
        const plan = planSession({ ...base, topics, count: 10, rng: createRng(s) });
        expect(plan).toHaveLength(10);
        expect(maxConsecutiveSameKind(plan)).toBe(1);
      }
    }
  });
  it('balances activities across a session', () => {
    const plan = planSession({ ...base, topics: ['addition'], count: 12, rng: createRng(3) });
    const counts = new Map<string, number>();
    for (const p of plan) counts.set(p.kind, (counts.get(p.kind) ?? 0) + 1);
    expect(Math.max(...counts.values()) - Math.min(...counts.values())).toBeLessThanOrEqual(1);
  });
  it('prefers hands-on activities for a struggling topic', () => {
    const plan = planSession({ ...base, struggling: new Set(['addition']), topics: ['addition'], count: 10, rng: createRng(1) });
    for (const p of plan) expect(CONCRETE_KINDS.has(p.kind as never)).toBe(true);
  });
  it('the daily journey has warm-up, games and a challenge at the end', () => {
    const plan = buildJourneyPlan({ focus: 'addition', second: 'shapes' }, { warm: 2, games: 4, challenge: 1 }, () => 2, new Set(), 4);
    expect(plan).toHaveLength(7);
    expect(plan.slice(0, 2).every((p) => p.topic === 'counting')).toBe(true);
    expect(plan[6]!.challenge).toBe(true);
    expect(maxConsecutiveSameKind(plan)).toBe(1);
  });
  it('the treasure hunt has 5 stops with different games', () => {
    for (let s = 0; s < 100; s++) {
      const plan = planTreasureHunt(() => 2, s);
      expect(plan).toHaveLength(5);
      expect(new Set(plan.map((p) => p.kind)).size).toBe(5);
    }
  });
});
