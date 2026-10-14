/**
 * Parent-dashboard aggregation. Mastery uses FIRST-TRY accuracy only, so unlimited retries
 * can never inflate it. Everything is computed from stored attempts.
 */
import type { AttemptRecord, ProfileData } from './state';
import type { Outcome } from './types';

export type OutcomeCounts = Record<Outcome, number>;

export function countOutcomes(attempts: AttemptRecord[]): OutcomeCounts {
  const c: OutcomeCounts = { first: 0, hint: 0, retry: 0, incorrect: 0, skipped: 0 };
  for (const a of attempts) c[a.outcome]++;
  return c;
}

const PRACTICE_MODES = new Set(['practice', 'adventure', 'journey']);

export interface TopicSummary {
  topic: string;
  level: number;
  attempts: number;
  outcomes: OutcomeCounts;
  /** first-try rate over all answered (non-skipped) practice attempts */
  firstTryRate: number | null;
  /** eventually-correct rate */
  correctRate: number | null;
  /** first-try rate over the last 10 */
  recentRate: number | null;
  recent: Outcome[];
  lastChange: { ts: number; from: number; to: number; reason: string; auto: boolean } | null;
  status: 'not-started' | 'learning' | 'practising' | 'secure';
}

function rate(xs: AttemptRecord[], pred: (a: AttemptRecord) => boolean): number | null {
  const answered = xs.filter((a) => a.outcome !== 'skipped');
  if (answered.length === 0) return null;
  return answered.filter(pred).length / answered.length;
}

export function summarizeTopic(data: ProfileData, subject: string, topic: string): TopicSummary {
  const xs = data.attempts.filter((a) => a.subject === subject && a.topic === topic && PRACTICE_MODES.has(a.mode));
  const tp = data.topics[subject]?.[topic];
  const last10 = xs.filter((a) => a.outcome !== 'skipped').slice(-10);
  const recentRate = rate(last10, (a) => a.outcome === 'first');
  let status: TopicSummary['status'] = 'not-started';
  if (xs.length > 0) status = 'learning';
  if (last10.length >= 5 && (recentRate ?? 0) >= 0.6) status = 'practising';
  if (last10.length >= 8 && (recentRate ?? 0) >= 0.85) status = 'secure';
  const lc = tp?.history[tp.history.length - 1] ?? null;
  return {
    topic,
    level: tp?.level ?? 1,
    attempts: xs.length,
    outcomes: countOutcomes(xs),
    firstTryRate: rate(xs, (a) => a.outcome === 'first'),
    correctRate: rate(xs, (a) => a.outcome !== 'incorrect'),
    recentRate,
    recent: xs.slice(-10).map((a) => a.outcome),
    lastChange: lc,
    status,
  };
}

export interface MistakeGroup {
  topic: string;
  kind: string;
  count: number;
  examples: { question: string; response: string; correctAnswer: string; ts: number }[];
}

/** Questions the child answered wrong at least once, grouped by topic + activity. */
export function commonMistakes(data: ProfileData, limit = 5): MistakeGroup[] {
  const groups = new Map<string, MistakeGroup>();
  for (const a of data.attempts) {
    if (a.outcome !== 'incorrect' && a.outcome !== 'retry' && a.outcome !== 'hint') continue;
    const key = `${a.topic}/${a.kind}`;
    const g = groups.get(key) ?? { topic: a.topic, kind: a.kind, count: 0, examples: [] };
    g.count++;
    if (a.outcome === 'incorrect') g.examples.push({ question: a.question, response: a.response, correctAnswer: a.correctAnswer, ts: a.ts });
    groups.set(key, g);
  }
  return [...groups.values()]
    .map((g) => ({ ...g, examples: g.examples.slice(-3).reverse() }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export interface WeekPoint {
  week: string;
  attempts: number;
  firstTryRate: number;
}

/** First-try accuracy per calendar week (Monday start). */
export function weeklyTrend(data: ProfileData, weeks = 8, now = Date.now()): WeekPoint[] {
  const monday = (ts: number) => {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.getTime();
  };
  const thisWeek = monday(now);
  const out: WeekPoint[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = thisWeek - i * 7 * 86400000;
    const end = start + 7 * 86400000;
    const xs = data.attempts.filter((a) => a.ts >= start && a.ts < end && PRACTICE_MODES.has(a.mode) && a.outcome !== 'skipped');
    const d = new Date(start);
    out.push({ week: `${d.getDate()}/${d.getMonth() + 1}`, attempts: xs.length, firstTryRate: xs.length ? xs.filter((a) => a.outcome === 'first').length / xs.length : 0 });
  }
  return out;
}

export interface Overview {
  totalAttempts: number;
  outcomes: OutcomeCounts;
  firstTryRate: number | null;
  correctRate: number | null;
  sessions: number;
  minutesPlayed: number;
  daysPlayed: number;
  testsTaken: number;
}

export function overview(data: ProfileData): Overview {
  const xs = data.attempts.filter((a) => PRACTICE_MODES.has(a.mode));
  return {
    totalAttempts: xs.length,
    outcomes: countOutcomes(xs),
    firstTryRate: rate(xs, (a) => a.outcome === 'first'),
    correctRate: rate(xs, (a) => a.outcome !== 'incorrect'),
    sessions: data.sessions.length,
    minutesPlayed: Math.round(data.sessions.reduce((s, x) => s + Math.max(0, x.endedAt - x.startedAt), 0) / 60000),
    daysPlayed: new Set(data.daysPlayed).size,
    testsTaken: data.tests.filter((t) => t.status === 'finished').length,
  };
}

/**
 * Recommend what to do next: weakest started topic first (needs practice), then the
 * next untouched topic in curriculum order, then topics ready to level up.
 */
export function recommendTopics(data: ProfileData, subject: string, topicOrder: string[], max = 3): { topic: string; why: string }[] {
  const out: { topic: string; why: string }[] = [];
  const sums = topicOrder.map((t) => summarizeTopic(data, subject, t));
  const weak = sums.filter((s) => s.attempts >= 4 && (s.recentRate ?? 1) < 0.6).sort((a, b) => (a.recentRate ?? 0) - (b.recentRate ?? 0));
  for (const s of weak) out.push({ topic: s.topic, why: 'needs a bit more practice' });
  for (const s of sums.filter((x) => x.attempts === 0)) out.push({ topic: s.topic, why: 'not tried yet' });
  for (const s of sums.filter((x) => x.status === 'learning' || x.status === 'practising')) out.push({ topic: s.topic, why: 'keep going' });
  for (const s of sums.filter((x) => x.status === 'secure')) out.push({ topic: s.topic, why: 'going strong — try a harder level' });
  const seen = new Set<string>();
  return out.filter((r) => (seen.has(r.topic) ? false : (seen.add(r.topic), true))).slice(0, max);
}
