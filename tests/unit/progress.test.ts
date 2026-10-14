import { describe, expect, it } from 'vitest';
import { STICKER_ALBUM } from '../../src/core/achievements';
import { commonMistakes, overview, recommendTopics, summarizeTopic } from '../../src/core/analytics';
import { recordAttempt, recordSession, resetProgress } from '../../src/core/progress';
import { createProfile, initialLevel, supportInfo } from '../../src/core/state';
import { MATHS_TOPICS } from '../../src/subjects/maths/types';
import { attempt, profile } from './helpers';

const session = (total: number) => ({ startedAt: 0, endedAt: 60000, mode: 'practice' as const, subject: 'maths', label: 'x', total, firstTry: total, correct: total, stars: total });

describe('progress tracking', () => {
  it('records each attempt exactly once', () => {
    const a = attempt('counting', 'first');
    const r1 = recordAttempt(profile(), a);
    const r2 = recordAttempt(r1.data, a);
    expect(r2.data.attempts).toHaveLength(1);
    expect(r2.starsEarned).toBe(0);
    expect(r1.starsEarned).toBe(1);
  });
  it('stars reward effort (retries earn a star) but not failure or skipping', () => {
    let p = profile();
    for (const o of ['first', 'retry', 'hint', 'incorrect', 'skipped'] as const) p = recordAttempt(p, attempt('counting', o)).data;
    expect(p.rewards.stars).toBe(3);
  });
  it('unlocks achievements', () => {
    let p = profile();
    const r = recordAttempt(p, attempt('counting', 'first'));
    expect(r.achievements).toContain('first-steps');
    p = r.data;
    for (let i = 0; i < 9; i++) p = recordAttempt(p, attempt('counting', 'retry')).data;
    expect(p.rewards.achievements.map((a) => a.id)).toEqual(expect.arrayContaining(['counting-explorer', 'brave-learner']));
  });
  it('finished sessions earn the next album sticker in a fixed order', () => {
    let p = profile();
    const s1 = recordSession(p, session(5));
    p = s1.data;
    const s2 = recordSession(p, session(5));
    expect([s1.sticker, s2.sticker]).toEqual(STICKER_ALBUM.slice(0, 2));
    expect(recordSession(s2.data, session(1)).sticker).toBeNull();
  });
  it('treasure hunts and zone missions are tallied', () => {
    const r = recordSession(profile(), session(5), { zone: 'shapes', treasureHunt: true });
    expect(r.data.rewards.zoneStars.shapes).toBe(1);
    expect(r.data.rewards.treasureHunts).toBe(1);
    expect(r.achievements).toContain('treasure-finder');
  });
  it('reset clears progress but keeps the profile', () => {
    let p = recordAttempt(profile(), attempt('counting', 'first')).data;
    p = resetProgress(p, (_s, t) => initialLevel(t, p.profile, p.settings));
    expect(p.attempts).toEqual([]);
    expect(p.rewards.stars).toBe(0);
    expect(p.profile.name).toBe('Test');
  });
});

describe('parent dashboard aggregation', () => {
  it('first-try rate is not inflated by retries', () => {
    let p = profile();
    for (const o of ['first', 'retry', 'retry', 'hint', 'incorrect'] as const) p = recordAttempt(p, attempt('addition', o)).data;
    const s = summarizeTopic(p, 'maths', 'addition');
    expect(s.firstTryRate).toBeCloseTo(0.2);
    expect(s.correctRate).toBeCloseTo(0.8);
    expect(s.outcomes).toEqual({ first: 1, hint: 1, retry: 2, incorrect: 1, skipped: 0 });
    const o = overview(p);
    expect(o.totalAttempts).toBe(5);
    expect(o.firstTryRate).toBeCloseTo(0.2);
  });
  it('tests are reported separately from practice', () => {
    const p = recordAttempt(profile(), attempt('addition', 'first', 1, { mode: 'test' })).data;
    expect(overview(p).totalAttempts).toBe(0);
  });
  it('groups common mistakes', () => {
    let p = profile();
    for (let i = 0; i < 3; i++) p = recordAttempt(p, attempt('subtraction', 'incorrect', 1, { kind: 'shop' })).data;
    p = recordAttempt(p, attempt('shapes', 'retry', 1, { kind: 'shapes' })).data;
    const m = commonMistakes(p);
    expect(m[0]).toMatchObject({ topic: 'subtraction', kind: 'shop', count: 3 });
    expect(m[0]!.examples).toHaveLength(3);
  });
  it('recommends weak topics first, then untried ones', () => {
    let p = profile();
    for (let i = 0; i < 5; i++) p = recordAttempt(p, attempt('patterns', 'incorrect')).data;
    const r = recommendTopics(p, 'maths', [...MATHS_TOPICS]);
    expect(r[0]).toEqual({ topic: 'patterns', why: 'needs a bit more practice' });
    expect(r[1]!.why).toBe('not tried yet');
  });
});

describe('profiles', () => {
  it('age and class are independent; age 5 / UKG is fully supported, others honestly marked', () => {
    expect(supportInfo(5, 'ukg').full).toBe(true);
    expect(supportInfo(7, 'class2').full).toBe(false);
    expect(supportInfo(3, 'nursery').message).toMatch(/coming soon/);
    const p = createProfile({ name: '  Atiye  ', age: 5, schoolClass: 'lkg' }, { maths: [...MATHS_TOPICS] });
    expect(p.profile.name).toBe('Atiye');
    expect(p.profile.schoolClass).toBe('lkg');
    expect(Object.keys(p.topics.maths!)).toHaveLength(9);
    for (const t of MATHS_TOPICS) expect(p.topics.maths![t]!.level).toBeLessThanOrEqual(3);
  });
});
