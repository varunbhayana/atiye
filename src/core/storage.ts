/**
 * Local persistence (browser localStorage) with:
 *  - schema validation and per-field repair (never crash on bad data)
 *  - a rolling "previous good copy" used if the main copy is corrupted
 *  - quarantine of unreadable data instead of silently deleting it
 *  - JSON backup / restore and CSV export
 * Nothing ever leaves the computer.
 */
import type { AppState, AttemptRecord, ProfileData, SessionRecord, TestRecord, TopicProgress } from './state';
import { MAX_ATTEMPTS_STORED, MAX_SESSIONS_STORED, MAX_TESTS_STORED, SCHEMA_VERSION, defaultSettings, emptyRewards, emptyState } from './state';
import { clampLevel } from './types';

export const STORAGE_KEY = 'mathsAdventure.state.v1';
export const PREVIOUS_KEY = 'mathsAdventure.state.v1.previous';
export const CORRUPT_PREFIX = 'mathsAdventure.corrupt.';

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface LoadResult {
  state: AppState;
  /** what happened, for a gentle notice in the parent area */
  notice: null | 'recovered-from-previous' | 'reset-corrupt' | 'repaired';
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, d = ''): string => (typeof v === 'string' ? v : d);
const num = (v: unknown, d = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const bool = (v: unknown, d: boolean): boolean => (typeof v === 'boolean' ? v : d);
const OUTCOMES = new Set(['first', 'hint', 'retry', 'incorrect', 'skipped']);

function sanitizeTopicProgress(v: unknown): TopicProgress | null {
  if (!isObj(v)) return null;
  const history = Array.isArray(v.history)
    ? v.history.filter(isObj).map((h) => ({ ts: num(h.ts), from: clampLevel(num(h.from, 1)), to: clampLevel(num(h.to, 1)), reason: str(h.reason), auto: bool(h.auto, true) }))
    : [];
  return { level: clampLevel(num(v.level, 1)), history: history.slice(-100) };
}

function sanitizeAttempt(v: unknown): AttemptRecord | null {
  if (!isObj(v)) return null;
  if (typeof v.topic !== 'string' || typeof v.outcome !== 'string' || !OUTCOMES.has(v.outcome)) return null;
  return {
    id: str(v.id, 'a'),
    ts: num(v.ts),
    sessionId: str(v.sessionId),
    mode: (['learn', 'practice', 'test', 'adventure', 'journey'].includes(str(v.mode)) ? v.mode : 'practice') as AttemptRecord['mode'],
    subject: str(v.subject, 'maths'),
    topic: v.topic,
    kind: str(v.kind),
    level: clampLevel(num(v.level, 1)),
    outcome: v.outcome as AttemptRecord['outcome'],
    tries: Math.max(0, Math.round(num(v.tries, 1))),
    hintUsed: bool(v.hintUsed, false),
    signature: str(v.signature),
    question: str(v.question),
    response: str(v.response),
    correctAnswer: str(v.correctAnswer),
  };
}

function sanitizeSession(v: unknown): SessionRecord | null {
  if (!isObj(v) || typeof v.id !== 'string') return null;
  return {
    id: v.id,
    startedAt: num(v.startedAt),
    endedAt: num(v.endedAt),
    mode: (str(v.mode, 'practice') as SessionRecord['mode']),
    subject: str(v.subject, 'maths'),
    label: str(v.label),
    total: num(v.total),
    firstTry: num(v.firstTry),
    correct: num(v.correct),
    stars: num(v.stars),
  };
}

function sanitizeTest(v: unknown): TestRecord | null {
  if (!isObj(v) || typeof v.id !== 'string' || !isObj(v.config) || !Array.isArray(v.questions) || !Array.isArray(v.answers)) return null;
  const c = v.config;
  const count = [5, 10, 15, 20].includes(num(c.count)) ? (num(c.count) as 5 | 10 | 15 | 20) : 5;
  const questions = v.questions.filter(isObj) as unknown as TestRecord['questions'];
  if (questions.length === 0) return null;
  const answers = questions.map((_, i) => {
    const a = (v.answers as unknown[])[i];
    if (!isObj(a) || !isObj(a.response)) return null;
    return { response: a.response as never, correct: bool(a.correct, false), ts: num(a.ts) };
  });
  const status = ['in-progress', 'finished', 'abandoned'].includes(str(v.status)) ? (v.status as TestRecord['status']) : 'abandoned';
  return {
    id: v.id,
    config: {
      subject: str(c.subject, 'maths'),
      topics: Array.isArray(c.topics) ? c.topics.filter((t): t is string => typeof t === 'string') : [],
      level: clampLevel(num(c.level, 1)),
      count,
      ageLabel: str(c.ageLabel),
    },
    questions,
    answers,
    current: Math.max(0, Math.min(questions.length - 1, Math.round(num(v.current)))),
    status,
    startedAt: num(v.startedAt),
    finishedAt: v.finishedAt === null ? null : num(v.finishedAt, 0) || null,
  };
}

function sanitizeProfile(v: unknown): ProfileData | null {
  if (!isObj(v) || !isObj(v.profile) || typeof v.profile.id !== 'string') return null;
  const p = v.profile;
  const s = isObj(v.settings) ? v.settings : {};
  const d = defaultSettings();
  const topics: ProfileData['topics'] = {};
  if (isObj(v.topics)) {
    for (const [subject, tmap] of Object.entries(v.topics)) {
      if (!isObj(tmap)) continue;
      topics[subject] = {};
      for (const [t, tp] of Object.entries(tmap)) {
        const clean = sanitizeTopicProgress(tp);
        if (clean) topics[subject][t] = clean;
      }
    }
  }
  const r = isObj(v.rewards) ? v.rewards : {};
  const er = emptyRewards();
  const zoneStars: Record<string, number> = {};
  if (isObj(r.zoneStars)) for (const [k, n] of Object.entries(r.zoneStars)) zoneStars[k] = Math.max(0, num(n));
  const arr = (x: unknown) => (Array.isArray(x) ? x : []);
  return {
    profile: {
      id: p.id as string,
      name: str(p.name).slice(0, 24),
      nameSay: str(p.nameSay).slice(0, 40),
      age: Math.max(3, Math.min(12, Math.round(num(p.age, 5)))),
      schoolClass: (str(p.schoolClass, 'ukg') as ProfileData['profile']['schoolClass']),
      companion: str(p.companion, '🦉'),
      createdAt: num(p.createdAt),
    },
    settings: {
      sound: bool(s.sound, d.sound),
      voice: bool(s.voice, d.voice),
      reducedMotion: ['system', 'on', 'off'].includes(str(s.reducedMotion)) ? (s.reducedMotion as 'system') : d.reducedMotion,
      difficulty: ['gentle', 'standard', 'challenge'].includes(str(s.difficulty)) ? (s.difficulty as 'standard') : d.difficulty,
      autoAdapt: bool(s.autoAdapt, d.autoAdapt),
      allowAdvanced: bool(s.allowAdvanced, d.allowAdvanced),
      sessionLength: ['short', 'normal', 'long'].includes(str(s.sessionLength)) ? (s.sessionLength as 'normal') : d.sessionLength,
      voiceName: typeof s.voiceName === 'string' ? s.voiceName : null,
      language: s.language === 'en' || s.language === 'hinglish' ? s.language : 'hindi',
      voiceSpeed: s.voiceSpeed === 'very-slow' || s.voiceSpeed === 'normal' ? s.voiceSpeed : 'slow',
    },
    topics,
    attempts: arr(v.attempts).map(sanitizeAttempt).filter((a): a is AttemptRecord => a !== null).slice(-MAX_ATTEMPTS_STORED),
    sessions: arr(v.sessions).map(sanitizeSession).filter((a): a is SessionRecord => a !== null).slice(-MAX_SESSIONS_STORED),
    tests: arr(v.tests).map(sanitizeTest).filter((a): a is TestRecord => a !== null).slice(-MAX_TESTS_STORED),
    rewards: {
      stars: Math.max(0, num(r.stars)),
      stickers: arr(r.stickers).filter((x): x is string => typeof x === 'string'),
      achievements: arr(r.achievements)
        .filter(isObj)
        .map((a) => ({ id: str(a.id), ts: num(a.ts) }))
        .filter((a) => a.id),
      zoneStars,
      treasureHunts: Math.max(0, num(r.treasureHunts, er.treasureHunts)),
      lessonsDone: arr(r.lessonsDone).filter((x): x is string => typeof x === 'string'),
    },
    daysPlayed: arr(v.daysPlayed).filter((x): x is string => typeof x === 'string').slice(-400),
  };
}

/** Validate and repair any parsed value into a usable AppState. Returns null if unusable. */
export function sanitizeState(raw: unknown): { state: AppState; repaired: boolean } | null {
  if (!isObj(raw) || !Array.isArray(raw.profiles)) return null;
  let profiles = raw.profiles.map(sanitizeProfile).filter((p): p is ProfileData => p !== null);
  // one-time migrations: v1 → everyone Hindi voice; v2 → Hinglish profiles move to the Hindi voice (English choices kept)
  const version = num(raw.schemaVersion, 1);
  if (version < 3) profiles = profiles.map((p) => (version < 2 || p.settings.language !== 'en' ? { ...p, settings: { ...p.settings, language: 'hindi' } } : p));
  const seen = new Set<string>();
  const unique = profiles.filter((p) => (seen.has(p.profile.id) ? false : (seen.add(p.profile.id), true)));
  const active = typeof raw.activeProfileId === 'string' && unique.some((p) => p.profile.id === raw.activeProfileId) ? raw.activeProfileId : (unique[0]?.profile.id ?? null);
  const state: AppState = { schemaVersion: SCHEMA_VERSION, profiles: unique, activeProfileId: active, updatedAt: num(raw.updatedAt, Date.now()) };
  const repaired = unique.length !== raw.profiles.length || (raw.activeProfileId !== undefined && active !== raw.activeProfileId);
  return { state, repaired };
}

function tryParse(text: string | null): unknown {
  if (text === null) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function loadState(store: KeyValueStore | null = safeLocalStorage()): LoadResult {
  if (!store) return { state: emptyState(), notice: null };
  let mainText: string | null;
  try {
    mainText = store.getItem(STORAGE_KEY);
  } catch {
    return { state: emptyState(), notice: null };
  }
  if (mainText === null) return { state: emptyState(), notice: null };
  const main = sanitizeState(tryParse(mainText));
  if (main) return { state: main.state, notice: main.repaired ? 'repaired' : null };
  // main copy unreadable — keep it aside for inspection, then fall back to the previous good copy
  try {
    store.setItem(CORRUPT_PREFIX + Date.now(), mainText);
  } catch {
    /* storage full — nothing more we can do */
  }
  const prev = sanitizeState(tryParse(safeGet(store, PREVIOUS_KEY)));
  if (prev) {
    saveState(prev.state, store);
    return { state: prev.state, notice: 'recovered-from-previous' };
  }
  return { state: emptyState(), notice: 'reset-corrupt' };
}

function safeGet(store: KeyValueStore, key: string): string | null {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}

export function saveState(state: AppState, store: KeyValueStore | null = safeLocalStorage()): boolean {
  if (!store) return false;
  try {
    const current = store.getItem(STORAGE_KEY);
    if (current !== null && sanitizeState(tryParse(current))) store.setItem(PREVIOUS_KEY, current);
    store.setItem(STORAGE_KEY, JSON.stringify({ ...state, updatedAt: Date.now() }));
    return true;
  } catch {
    // quota exceeded: trim history and try once more
    try {
      const trimmed: AppState = {
        ...state,
        profiles: state.profiles.map((p) => ({ ...p, attempts: p.attempts.slice(-1000), sessions: p.sessions.slice(-100), tests: p.tests.slice(-20) })),
      };
      store.removeItem(PREVIOUS_KEY);
      store.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      return true;
    } catch {
      return false;
    }
  }
}

export function safeLocalStorage(): KeyValueStore | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const k = '__ma_probe__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return localStorage;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- backup / restore / export

export function exportBackup(state: AppState): string {
  return JSON.stringify({ app: 'maths-adventure', exportedAt: new Date().toISOString(), schemaVersion: SCHEMA_VERSION, state }, null, 2);
}

export function importBackup(text: string): AppState {
  const parsed = tryParse(text);
  if (!isObj(parsed)) throw new Error('This file is not a Maths Adventure backup.');
  const candidate = parsed.app === 'maths-adventure' ? parsed.state : parsed;
  const result = sanitizeState(candidate);
  if (!result || result.state.profiles.length === 0) throw new Error('The backup file does not contain any learner profiles.');
  return result.state;
}

function csvCell(v: string | number | boolean): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function attemptsToCsv(data: ProfileData): string {
  const header = ['date', 'mode', 'subject', 'topic', 'activity', 'level', 'outcome', 'tries', 'hint_used', 'question', 'child_answer', 'correct_answer'];
  const rows = data.attempts.map((a) =>
    [new Date(a.ts).toISOString(), a.mode, a.subject, a.topic, a.kind, a.level, a.outcome, a.tries, a.hintUsed, a.question, a.response, a.correctAnswer].map(csvCell).join(','),
  );
  return [header.join(','), ...rows].join('\n');
}
