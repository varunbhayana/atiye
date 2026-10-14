/**
 * Progress recording: attempts, sessions, stars, stickers, achievements and adaptive updates.
 * Pure functions over ProfileData so they are easy to test.
 */
import { applyAdaptive } from './adaptive';
import { newAchievements, nextSticker } from './achievements';
import type { AttemptRecord, LevelChange, ProfileData, SessionRecord } from './state';
import { MAX_ATTEMPTS_STORED, MAX_SESSIONS_STORED, newId, todayKey } from './state';

export interface RecordResult {
  data: ProfileData;
  levelChange: LevelChange | null;
  achievements: string[];
  starsEarned: number;
}

export function starsFor(outcome: AttemptRecord['outcome']): number {
  // effort counts: any correct answer earns a star; first-try adds nothing extra (no speed/perfection pressure)
  return outcome === 'first' || outcome === 'hint' || outcome === 'retry' ? 1 : 0;
}

export function recordAttempt(data: ProfileData, attempt: Omit<AttemptRecord, 'id'> & { id?: string }): RecordResult {
  // idempotent: the same attempt id is never stored twice
  const id = attempt.id ?? newId('att');
  if (data.attempts.some((a) => a.id === id)) return { data, levelChange: null, achievements: [], starsEarned: 0 };
  const full: AttemptRecord = { ...attempt, id };
  const starsEarned = full.mode === 'test' ? 0 : starsFor(full.outcome);
  const day = todayKey(full.ts);
  let next: ProfileData = {
    ...data,
    attempts: [...data.attempts, full].slice(-MAX_ATTEMPTS_STORED),
    rewards: { ...data.rewards, stars: data.rewards.stars + starsEarned },
    daysPlayed: data.daysPlayed.includes(day) ? data.daysPlayed : [...data.daysPlayed, day],
  };
  let levelChange: LevelChange | null = null;
  if (full.mode !== 'test' && full.mode !== 'learn') {
    const r = applyAdaptive(next, full.subject, full.topic, full.ts);
    next = r.data;
    levelChange = r.change;
  }
  const achievements = newAchievements(next);
  if (achievements.length) {
    next = { ...next, rewards: { ...next.rewards, achievements: [...next.rewards.achievements, ...achievements.map((id) => ({ id, ts: full.ts }))] } };
  }
  return { data: next, levelChange, achievements, starsEarned };
}

export interface SessionResult {
  data: ProfileData;
  sticker: string | null;
  achievements: string[];
}

/** Close a session; a finished session with at least 3 answered questions earns the next album sticker. */
export function recordSession(data: ProfileData, session: Omit<SessionRecord, 'id'>, opts: { zone?: string; treasureHunt?: boolean } = {}): SessionResult {
  const rec: SessionRecord = { ...session, id: newId('session') };
  const earnsSticker = session.total >= 3 && session.mode !== 'test';
  const sticker = earnsSticker ? nextSticker(data) : null;
  let next: ProfileData = {
    ...data,
    sessions: [...data.sessions, rec].slice(-MAX_SESSIONS_STORED),
    rewards: {
      ...data.rewards,
      stickers: sticker ? [...data.rewards.stickers, sticker] : data.rewards.stickers,
      zoneStars: opts.zone ? { ...data.rewards.zoneStars, [opts.zone]: (data.rewards.zoneStars[opts.zone] ?? 0) + 1 } : data.rewards.zoneStars,
      treasureHunts: data.rewards.treasureHunts + (opts.treasureHunt ? 1 : 0),
    },
  };
  const achievements = newAchievements(next);
  if (achievements.length) {
    next = { ...next, rewards: { ...next.rewards, achievements: [...next.rewards.achievements, ...achievements.map((id) => ({ id, ts: session.endedAt }))] } };
  }
  return { data: next, sticker, achievements };
}

export function markLessonDone(data: ProfileData, lessonId: string): { data: ProfileData; achievements: string[] } {
  if (data.rewards.lessonsDone.includes(lessonId)) return { data, achievements: [] };
  let next = { ...data, rewards: { ...data.rewards, lessonsDone: [...data.rewards.lessonsDone, lessonId] } };
  const achievements = newAchievements(next);
  if (achievements.length) next = { ...next, rewards: { ...next.rewards, achievements: [...next.rewards.achievements, ...achievements.map((id) => ({ id, ts: Date.now() }))] } };
  return { data: next, achievements };
}

export function resetProgress(data: ProfileData, levelFor: (subject: string, topic: string) => ProfileData['topics'][string][string]['level']): ProfileData {
  const topics: ProfileData['topics'] = {};
  for (const [s, m] of Object.entries(data.topics)) {
    topics[s] = {};
    for (const t of Object.keys(m)) topics[s][t] = { level: levelFor(s, t), history: [] };
  }
  return { ...data, topics, attempts: [], sessions: [], tests: [], rewards: { stars: 0, stickers: [], achievements: [], zoneStars: {}, treasureHunts: 0, lessonsDone: [] }, daysPlayed: [] };
}
