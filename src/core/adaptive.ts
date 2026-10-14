/**
 * Deterministic, explainable adaptive difficulty.
 *
 * Per topic we look only at practice-style attempts made AT THE CURRENT LEVEL since the last level change:
 *  - level UP   when at least `minUp` attempts exist and the first-try rate over the last `window` ≥ `upRate`
 *  - level DOWN when at least `minDown` attempts exist and the first-try rate over the last `minDown` ≤ `downRate`
 * One lucky answer can never move the level. Tests and Learn mode never move the level.
 */
import type { AttemptRecord, DifficultyPref, LevelChange, ProfileData } from './state';
import { maxLevelFor } from './state';
import type { Level } from './types';

export interface AdaptiveRules {
  window: number;
  minUp: number;
  upRate: number;
  minDown: number;
  downRate: number;
}

export function rulesFor(pref: DifficultyPref): AdaptiveRules {
  switch (pref) {
    case 'gentle':
      return { window: 10, minUp: 8, upRate: 0.85, minDown: 5, downRate: 0.4 };
    case 'challenge':
      return { window: 8, minUp: 5, upRate: 0.75, minDown: 6, downRate: 0.34 };
    default:
      return { window: 8, minUp: 6, upRate: 0.8, minDown: 5, downRate: 0.4 };
  }
}

const COUNTS_FOR_ADAPTIVE = new Set(['practice', 'adventure', 'journey']);

export function eligibleAttempts(data: ProfileData, subject: string, topic: string): AttemptRecord[] {
  const tp = data.topics[subject]?.[topic];
  const since = tp?.history.length ? tp.history[tp.history.length - 1]!.ts : 0;
  const level = tp?.level ?? 1;
  return data.attempts.filter(
    (a) => a.subject === subject && a.topic === topic && a.level === level && a.ts >= since && COUNTS_FOR_ADAPTIVE.has(a.mode) && a.outcome !== 'skipped',
  );
}

export interface AdaptiveDecision {
  direction: 'up' | 'down' | 'stay';
  to: Level;
  reason: string;
  /** a suggestion shown to parents when auto-adapt is off or the cap is reached */
  suggestion: string | null;
}

export function evaluateTopic(data: ProfileData, subject: string, topic: string): AdaptiveDecision {
  const level = data.topics[subject]?.[topic]?.level ?? 1;
  const rules = rulesFor(data.settings.difficulty);
  const recent = eligibleAttempts(data, subject, topic);
  const lastWindow = recent.slice(-rules.window);
  const firstUp = lastWindow.filter((a) => a.outcome === 'first').length;
  const cap = maxLevelFor(data.settings);

  if (lastWindow.length >= rules.minUp && firstUp / lastWindow.length >= rules.upRate) {
    const reason = `${firstUp} of the last ${lastWindow.length} answers at level ${level} were right first time.`;
    if (level >= cap) {
      return {
        direction: 'stay',
        to: level,
        reason,
        suggestion: level < 5 ? `Doing great at the top age-5 level. You can switch on “advanced challenges” in settings.` : null,
      };
    }
    return { direction: 'up', to: (level + 1) as Level, reason: `${reason} Moving up to level ${level + 1}.`, suggestion: `Ready for level ${level + 1}.` };
  }
  const lastDown = recent.slice(-rules.minDown);
  const firstDown = lastDown.filter((a) => a.outcome === 'first').length;
  if (lastDown.length >= rules.minDown && firstDown / lastDown.length <= rules.downRate && level > 1) {
    return {
      direction: 'down',
      to: (level - 1) as Level,
      reason: `Only ${firstDown} of the last ${lastDown.length} answers at level ${level} were right first time. Making it a little easier with more pictures.`,
      suggestion: `Level ${level} looks tricky right now — level ${level - 1} may help.`,
    };
  }
  return { direction: 'stay', to: level, reason: '', suggestion: null };
}

/** Apply the adaptive decision if auto-adapt is on. Returns the updated data and any change made. */
export function applyAdaptive(data: ProfileData, subject: string, topic: string, now = Date.now()): { data: ProfileData; change: LevelChange | null } {
  if (!data.settings.autoAdapt) return { data, change: null };
  const d = evaluateTopic(data, subject, topic);
  if (d.direction === 'stay') return { data, change: null };
  const tp = data.topics[subject]?.[topic] ?? { level: 1 as Level, history: [] };
  const change: LevelChange = { ts: now, from: tp.level, to: d.to, reason: d.reason, auto: true };
  return {
    data: {
      ...data,
      topics: { ...data.topics, [subject]: { ...data.topics[subject], [topic]: { level: d.to, history: [...tp.history, change].slice(-100) } } },
    },
    change,
  };
}

/** Manual level change by a parent. */
export function setTopicLevel(data: ProfileData, subject: string, topic: string, level: Level, now = Date.now()): ProfileData {
  const tp = data.topics[subject]?.[topic] ?? { level: 1 as Level, history: [] };
  if (tp.level === level) return data;
  const change: LevelChange = { ts: now, from: tp.level, to: level, reason: 'Changed by a parent.', auto: false };
  return { ...data, topics: { ...data.topics, [subject]: { ...data.topics[subject], [topic]: { level, history: [...tp.history, change].slice(-100) } } } };
}

/** Struggling = most recent attempts in a topic mostly not right first time → prefer concrete, visual activities. */
export function isStruggling(data: ProfileData, subject: string, topic: string): boolean {
  const recent = data.attempts.filter((a) => a.subject === subject && a.topic === topic && COUNTS_FOR_ADAPTIVE.has(a.mode) && a.outcome !== 'skipped').slice(-5);
  if (recent.length < 3) return false;
  return recent.filter((a) => a.outcome === 'first').length / recent.length < 0.5;
}
