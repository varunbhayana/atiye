import { describe, expect, it } from 'vitest';
import { applyAdaptive, evaluateTopic, isStruggling, setTopicLevel } from '../../src/core/adaptive';
import { recordAttempt } from '../../src/core/progress';
import type { ProfileData } from '../../src/core/state';
import { attempt, profile } from './helpers';

function withAttempts(p: ProfileData, list: ReturnType<typeof attempt>[]): ProfileData {
  return { ...p, attempts: [...p.attempts, ...list] };
}

describe('adaptive difficulty', () => {
  it('one lucky answer never raises the level', () => {
    const p = withAttempts(profile(), [attempt('addition', 'first')]);
    expect(evaluateTopic(p, 'maths', 'addition').direction).toBe('stay');
  });
  it('moves up after sustained first-try success, with a reason', () => {
    const p = withAttempts(profile(), Array.from({ length: 6 }, () => attempt('addition', 'first')));
    const d = evaluateTopic(p, 'maths', 'addition');
    expect(d.direction).toBe('up');
    expect(d.to).toBe(2);
    expect(d.reason).toMatch(/6 of the last 6/);
  });
  it('retries do not count as mastery', () => {
    const p = withAttempts(profile(), Array.from({ length: 8 }, () => attempt('addition', 'retry')));
    expect(evaluateTopic(p, 'maths', 'addition').direction).not.toBe('up');
  });
  it('moves down after repeated difficulty', () => {
    let p = setTopicLevel(profile(), 'maths', 'addition', 2, 1);
    p = withAttempts(p, ['incorrect', 'retry', 'first', 'hint', 'incorrect'].map((o) => attempt('addition', o as never, 2)));
    const d = evaluateTopic(p, 'maths', 'addition');
    expect(d.direction).toBe('down');
    expect(d.to).toBe(1);
  });
  it('respects the age-appropriate cap unless advanced is enabled', () => {
    let p = setTopicLevel(profile(), 'maths', 'addition', 3, 1);
    p = withAttempts(p, Array.from({ length: 8 }, () => attempt('addition', 'first', 3)));
    expect(evaluateTopic(p, 'maths', 'addition').direction).toBe('stay');
    expect(evaluateTopic(p, 'maths', 'addition').suggestion).toMatch(/advanced/);
    const adv = { ...p, settings: { ...p.settings, allowAdvanced: true } };
    expect(evaluateTopic(adv, 'maths', 'addition').to).toBe(4);
  });
  it('does nothing when the parent switches automatic difficulty off', () => {
    const base = profile({ autoAdapt: false });
    const p = withAttempts(base, Array.from({ length: 8 }, () => attempt('addition', 'first')));
    expect(applyAdaptive(p, 'maths', 'addition').change).toBeNull();
  });
  it('test answers never change the level', () => {
    let p = profile();
    for (let i = 0; i < 10; i++) p = recordAttempt(p, attempt('addition', 'first', 1, { mode: 'test' })).data;
    expect(p.topics.maths!.addition!.level).toBe(1);
  });
  it('recordAttempt applies level-ups through practice and logs history', () => {
    let p = profile();
    let changed = false;
    for (let i = 0; i < 6; i++) {
      const r = recordAttempt(p, attempt('patterns', 'first'));
      p = r.data;
      changed ||= !!r.levelChange;
    }
    expect(changed).toBe(true);
    expect(p.topics.maths!.patterns!.level).toBe(2);
    expect(p.topics.maths!.patterns!.history[0]!.auto).toBe(true);
  });
  it('flags struggling topics so concrete activities are preferred', () => {
    const p = withAttempts(profile(), ['incorrect', 'retry', 'hint'].map((o) => attempt('addition', o as never)));
    expect(isStruggling(p, 'maths', 'addition')).toBe(true);
    expect(isStruggling(p, 'maths', 'counting')).toBe(false);
  });
});
