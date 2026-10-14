/**
 * Activity rotation. Plans which (topic, activity) comes next so a child never sees
 * the same kind of game twice in a row (when alternatives exist), activities stay balanced,
 * and concrete/visual activities are favoured for topics the child is finding hard.
 */
import type { Rng } from './rng';
import type { Level } from './types';

export interface PlanItem {
  topic: string;
  kind: string;
  level: Level;
  /** a slightly harder "challenge" item (daily journey) */
  challenge?: boolean;
}

export interface PlanInput {
  topics: string[];
  count: number;
  levelOf: (topic: string) => Level;
  kindsFor: (topic: string, level: Level) => string[];
  concreteKinds: ReadonlySet<string>;
  struggling: ReadonlySet<string>;
  rng: Rng;
  /** kind used just before this plan (e.g. last question of a previous block) */
  previousKind?: string;
}

export function planSession(input: PlanInput): PlanItem[] {
  const { topics, count, rng } = input;
  if (topics.length === 0 || count <= 0) return [];
  const order = rng.shuffle(topics);
  const usage = new Map<string, number>();
  const items: PlanItem[] = [];
  let prevKind = input.previousKind;
  let prevTopic: string | undefined;
  for (let i = 0; i < count; i++) {
    // rotate topics; avoid the same topic twice in a row when mixing
    let topic = order[i % order.length]!;
    if (order.length > 1 && topic === prevTopic) topic = order[(i + 1) % order.length]!;
    // a topic whose only game is the one just played would force a repeat: try the next topic instead
    for (let k = 1; k < order.length; k++) {
      const ks = input.kindsFor(topic, input.levelOf(topic));
      if (ks.some((x) => x !== prevKind)) break;
      topic = order[(i + k) % order.length]!;
    }
    const level = input.levelOf(topic);
    const kinds = input.kindsFor(topic, level);
    if (kinds.length === 0) continue;
    let candidates = kinds.filter((k) => k !== prevKind);
    if (candidates.length === 0) candidates = kinds;
    if (input.struggling.has(topic)) {
      const concrete = candidates.filter((k) => input.concreteKinds.has(k));
      if (concrete.length > 0) candidates = concrete;
    }
    const minUse = Math.min(...candidates.map((k) => usage.get(k) ?? 0));
    const leastUsed = candidates.filter((k) => (usage.get(k) ?? 0) === minUse);
    const kind = rng.pick(leastUsed);
    usage.set(kind, (usage.get(kind) ?? 0) + 1);
    items.push({ topic, kind, level });
    prevKind = kind;
    prevTopic = topic;
  }
  return items;
}

/**
 * Reorder items so neighbours differ in activity kind wherever possible (greedy, deterministic).
 * `before` is the kind played just before the first item, `after` the kind right after the last.
 */
export function spreadKinds(items: PlanItem[], before?: string, after?: string): PlanItem[] {
  const pool = items.slice();
  const out: PlanItem[] = [];
  let prev = before;
  while (pool.length) {
    const remaining = new Map<string, number>();
    for (const p of pool) remaining.set(p.kind, (remaining.get(p.kind) ?? 0) + 1);
    const last = pool.length === 1;
    const ok = pool.filter((p) => p.kind !== prev && !(last && after !== undefined && p.kind === after));
    const cands = ok.length ? ok : pool.filter((p) => p.kind !== prev).length ? pool.filter((p) => p.kind !== prev) : pool;
    cands.sort((a, b) => (remaining.get(b.kind) ?? 0) - (remaining.get(a.kind) ?? 0));
    const pick = cands[0]!;
    out.push(pick);
    pool.splice(pool.indexOf(pick), 1);
    prev = pick.kind;
  }
  return out;
}

/** Fewest consecutive repeats possible check, used by tests and diagnostics. */
export function maxConsecutiveSameKind(items: PlanItem[]): number {
  let best = 0;
  let run = 0;
  items.forEach((it, i) => {
    run = i > 0 && items[i - 1]!.kind === it.kind ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
}
