/**
 * Deterministic question generators. Pure functions of (topic, level, rng, mode).
 * Every generated question is passed through the independent validator before use.
 */
import type { Level, Mode } from '../../core/types';
import type { Rng } from '../../core/rng';
import {
  CREATURES,
  DAY_THINGS,
  FOODS,
  NIGHT_THINGS,
  ODD_CATEGORIES,
  PATTERN_TOKENS,
  POSITION_ANCHORS,
  POSITION_OBJECTS,
  ROUTINES,
  SHOP_ITEMS,
  SIZE_OBJECTS,
  TOPPING_INFO,
  WEIGHT_OBJECTS,
  creature,
  food,
  shopItem,
  tokenInfo,
} from './catalog';
import { SHAPES_BY_LEVEL, limit } from './curriculum';
import type {
  BalloonQuestion,
  CatchQuestion,
  ChooseOption,
  ChooseQuestion,
  CountQuestion,
  FeedQuestion,
  GameKind,
  MathsQuestion,
  MathsTopic,
  NumberLineQuestion,
  NumberTask,
  PatternQuestion,
  PatternType,
  PizzaQuestion,
  Placement,
  SceneShape,
  ShapeName,
  ShapesQuestion,
  ShopQuestion,
  TokenSet,
  Topping,
  TowerQuestion,
  TrainQuestion,
  TreasureQuestion,
} from './types';
import { TOPPINGS } from './types';

// ---------------------------------------------------------------- helpers

function newId(kind: string, rng: Rng): string {
  return `${kind}-${rng.int(0, 2 ** 31 - 1).toString(36)}`;
}

/** Plausible, unique distractors around the answer, within [lo, hi]. Answer included exactly once. */
export function numberOptions(answer: number, count: number, lo: number, hi: number, rng: Rng, preferred: number[] = []): number[] {
  const chosen = new Set<number>();
  const ok = (n: number) => Number.isInteger(n) && n >= lo && n <= hi && n !== answer && !chosen.has(n);
  const tryAdd = (list: number[]) => {
    for (const n of list) {
      if (chosen.size >= count - 1) return;
      if (ok(n)) chosen.add(n);
    }
  };
  tryAdd(rng.shuffle(preferred));
  tryAdd(rng.shuffle([answer + 1, answer - 1]));
  tryAdd(rng.shuffle([answer + 2, answer - 2, answer + 3, answer - 3]));
  if (chosen.size < count - 1) {
    const rest: number[] = [];
    for (let n = lo; n <= hi; n++) rest.push(n);
    tryAdd(rng.shuffle(rest));
  }
  return rng.shuffle([answer, ...chosen]);
}

function splitInto(total: number, parts: number, rng: Rng): number[] {
  // random composition of `total` into `parts` positive integers
  if (parts === 1) return [total];
  const cuts = new Set<number>();
  while (cuts.size < parts - 1) cuts.add(rng.int(1, total - 1));
  const sorted = [...cuts].sort((a, b) => a - b);
  const out: number[] = [];
  let prev = 0;
  for (const c of sorted) {
    out.push(c - prev);
    prev = c;
  }
  out.push(total - prev);
  return out;
}

/** Scatter n items over a region without overlaps (coordinates in % of scene). */
export function scatter(n: number, rng: Rng, region = { x0: 8, x1: 92, y0: 14, y1: 86 }): Placement[] {
  if (n === 0) return [];
  const w = region.x1 - region.x0;
  const h = region.y1 - region.y0;
  const aspect = (w * 1.6) / h;
  let cols = Math.max(1, Math.ceil(Math.sqrt(n * 1.5 * aspect)));
  let rows = Math.max(1, Math.ceil((n * 1.5) / cols));
  while (cols * rows < n) rows++;
  cols = Math.min(cols, 8);
  while (cols * rows < n) rows++;
  const cw = w / cols;
  const ch = h / rows;
  const cells = rng.shuffle(Array.from({ length: cols * rows }, (_, i) => i)).slice(0, n);
  cells.sort((a, b) => a - b);
  return cells.map((cell) => {
    const c = cell % cols;
    const r = Math.floor(cell / cols);
    const jx = (rng.next() - 0.5) * cw * 0.3;
    const jy = (rng.next() - 0.5) * ch * 0.3;
    return {
      x: round1(region.x0 + cw * (c + 0.5) + jx),
      y: round1(region.y0 + ch * (r + 0.5) + jy),
      scale: round1(0.9 + rng.next() * 0.2),
      flip: rng.chance(0.5),
    };
  });
}
const round1 = (n: number) => Math.round(n * 10) / 10;

function rangeFor(topic: MathsTopic, level: Level): { lo: number; hi: number } {
  switch (topic) {
    case 'addition':
      return { lo: 0, hi: limit('addMax', level) };
    case 'subtraction':
      return { lo: 0, hi: limit('subMax', level) };
    case 'comparison':
      return { lo: 0, hi: limit('compareMax', level) };
    case 'counting':
      return { lo: 0, hi: limit('countMax', level) };
    default:
      return { lo: 0, hi: limit('numberMax', level) };
  }
}

// ---------------------------------------------------------------- number tasks

function addTask(level: Level, rng: Rng, cap = 99): NumberTask {
  const max = Math.min(limit('addMax', level), cap);
  const allowZero = level >= 3 && rng.chance(0.1);
  if (allowZero) {
    const a = rng.int(1, max);
    return rng.chance(0.5) ? { type: 'add', a, b: 0 } : { type: 'add', a: 0, b: a };
  }
  const sum = rng.int(2, max);
  const a = rng.int(1, sum - 1);
  return { type: 'add', a, b: sum - a };
}

function subTask(level: Level, rng: Rng, cap = 99): NumberTask {
  const max = Math.min(limit('subMax', level), cap);
  const a = rng.int(2, max);
  const allowZero = level >= 2 && rng.chance(0.12);
  const b = allowZero ? a : rng.int(1, a - 1);
  return { type: 'sub', a, b };
}

function numberTask(level: Level, rng: Rng, allowed: NumberTask['type'][]): NumberTask {
  const max = limit('numberMax', level);
  const type = rng.pick(allowed);
  switch (type) {
    case 'identify':
      return { type, n: rng.int(level === 1 ? 0 : Math.floor(max / 3), max) };
    case 'after':
      return { type, n: rng.int(0, max - 1) };
    case 'before':
      return { type, n: rng.int(1, max) };
    case 'between': {
      const low = rng.int(0, max - 2);
      return { type, low, high: low + 2 };
    }
    default:
      return { type: 'identify', n: rng.int(0, max) };
  }
}

function numberTaskTypes(level: Level): NumberTask['type'][] {
  if (level === 1) return ['identify', 'identify', 'after'];
  if (level === 2) return ['identify', 'after', 'before'];
  if (level === 3) return ['identify', 'after', 'before'];
  return ['after', 'before', 'between', 'identify'];
}

function taskFor(topic: MathsTopic, level: Level, rng: Rng, cap?: number): NumberTask {
  if (topic === 'addition') return addTask(level, rng, cap);
  if (topic === 'subtraction') return subTask(level, rng, cap);
  return numberTask(level, rng, numberTaskTypes(level));
}

export function evalTask(t: NumberTask): number {
  switch (t.type) {
    case 'identify':
      return t.n;
    case 'after':
      return t.n + 1;
    case 'before':
      return t.n - 1;
    case 'between':
      return t.low + 1;
    case 'add':
      return t.a + t.b;
    case 'sub':
      return t.a - t.b;
  }
}

function taskDistractors(t: NumberTask): number[] {
  switch (t.type) {
    case 'add':
      return [t.a + t.b + 1, t.a + t.b - 1, Math.abs(t.a - t.b)];
    case 'sub':
      return [t.a + t.b, t.a - t.b + 1, t.a - t.b - 1];
    case 'after':
      return [t.n - 1, t.n];
    case 'before':
      return [t.n + 1, t.n];
    case 'between':
      return [t.low, t.high];
    case 'identify':
      // digit-reversal confusions (12 vs 21) and neighbours
      return t.n >= 10 ? [Number(String(t.n).split('').reverse().join('')), t.n + 10, t.n - 10] : [t.n + 10];
  }
}

export function taskText(t: NumberTask, verb: string): { prompt: string; speech: string } {
  switch (t.type) {
    case 'identify':
      return { prompt: `${verb} the number ${t.n}!`, speech: `${verb} the number ${t.n}!` };
    case 'after':
      return { prompt: `What comes just after ${t.n}?`, speech: `Which number comes just after ${t.n}?` };
    case 'before':
      return { prompt: `What comes just before ${t.n}?`, speech: `Which number comes just before ${t.n}?` };
    case 'between':
      return { prompt: `What number is between ${t.low} and ${t.high}?`, speech: `Which number is between ${t.low} and ${t.high}?` };
    case 'add':
      return { prompt: `${t.a} + ${t.b} = ?`, speech: `What is ${t.a} plus ${t.b}?` };
    case 'sub':
      return { prompt: `${t.a} − ${t.b} = ?`, speech: `What is ${t.a} take away ${t.b}?` };
  }
}

export function taskSignature(t: NumberTask): string {
  switch (t.type) {
    case 'add':
      return `${t.a}+${t.b}`;
    case 'sub':
      return `${t.a}-${t.b}`;
    case 'between':
      return `between${t.low}-${t.high}`;
    default:
      return `${t.type}${t.n}`;
  }
}

function taskOptionRange(topic: MathsTopic, level: Level, t: NumberTask) {
  const r = rangeFor(topic, level);
  if (t.type === 'add') return { lo: 0, hi: r.hi + 2 };
  return r;
}

// ---------------------------------------------------------------- Game 1: Count

function genCount(topic: MathsTopic, level: Level, rng: Rng, mode: Mode): CountQuestion {
  const c = rng.pick(CREATURES);
  let variant: CountQuestion['variant'] = 'count';
  let groups: number[];
  let leaving = 0;
  let placements: Placement[];
  if (topic === 'addition') {
    variant = 'together';
    const max = Math.min(limit('addMax', level), 12);
    const sum = rng.int(2, max);
    const a = rng.int(1, sum - 1);
    groups = [a, sum - a];
    placements = [
      ...scatter(groups[0]!, rng, { x0: 5, x1: 46, y0: 16, y1: 86 }),
      ...scatter(groups[1]!, rng, { x0: 54, x1: 95, y0: 16, y1: 86 }),
    ];
  } else if (topic === 'subtraction') {
    variant = 'takeaway';
    const max = Math.min(limit('subMax', level), 12);
    const n = rng.int(2, max);
    leaving = rng.int(1, n - 1);
    groups = [n];
    placements = scatter(n, rng);
  } else {
    const max = topic === 'numbers' ? Math.min(limit('numberMax', level), 10) : limit('countMax', level);
    const min = level === 1 ? 1 : Math.max(2, Math.floor(max / 2));
    groups = [rng.int(min, max)];
    placements = scatter(groups[0]!, rng);
  }
  const total = groups.reduce((s, n) => s + n, 0);
  const answer = variant === 'takeaway' ? total - leaving : total;
  const moving = mode !== 'test' && topic === 'counting' && level >= 3 && rng.chance(0.4);
  const optionCount = level === 1 ? 3 : 4;
  const options = numberOptions(answer, optionCount, variant === 'count' ? 1 : 0, Math.max(total + 2, 6), rng, variant === 'takeaway' ? [total, leaving] : []);
  let prompt: string;
  let speech: string;
  if (variant === 'together') {
    prompt = `${groups[0]} ${groups[0] === 1 ? c.one : c.many} and ${groups[1]} more ${groups[1] === 1 ? c.one : c.many}. How many altogether?`;
    speech = `${groups[0]} ${groups[0] === 1 ? c.one : c.many} are ${c.place}. ${groups[1]} more ${c.arrive}. How many ${c.many} are there altogether?`;
  } else if (variant === 'takeaway') {
    prompt = `${total} ${c.many}. ${leaving} ${c.leave}. How many are left?`;
    speech = `${total} ${c.many} are ${c.place}. ${leaving} ${c.leave}. How many ${c.many} are left?`;
  } else {
    prompt = `How many ${c.many} are ${c.place}?`;
    speech = `How many ${c.many} are ${c.place}? Tap each one to count.`;
  }
  return {
    id: newId('count', rng),
    subject: 'maths',
    topic,
    level,
    kind: 'count',
    variant,
    creature: c.key,
    groups,
    leaving,
    placements,
    moving,
    options,
    prompt,
    speech,
    signature: `count:${variant}:${groups.join('+')}-${leaving}`,
  };
}

// ---------------------------------------------------------------- Game 2: Feed the monster

function genFeed(topic: MathsTopic, level: Level, rng: Rng): FeedQuestion {
  const f = rng.pick(FOODS);
  let variant: FeedQuestion['variant'] = 'exact';
  let parts: number[];
  if (topic === 'addition') {
    variant = 'parts';
    const sum = rng.int(2, Math.min(limit('addMax', level), 10));
    const a = rng.int(1, sum - 1);
    parts = [a, sum - a];
  } else {
    const ranges: Record<Level, [number, number]> = { 1: [1, 5], 2: [2, 8], 3: [3, 10], 4: [4, 10], 5: [5, 10] };
    const [lo, hi] = ranges[level];
    parts = [rng.int(lo, hi)];
  }
  const target = parts.reduce((s, n) => s + n, 0);
  const supply = Math.min(target + rng.int(2, 3), 13);
  const prompt =
    variant === 'parts'
      ? `Feed the monster ${parts[0]} ${parts[0] === 1 ? f.one : f.many}, then ${parts[1]} more!`
      : `The monster wants ${target} ${target === 1 ? f.one : f.many}!`;
  const speech =
    variant === 'parts'
      ? `The monster is hungry! Give it ${parts[0]} ${parts[0] === 1 ? f.one : f.many}, and then ${parts[1]} more. Press done when you have finished.`
      : `The hungry monster wants ${target} ${target === 1 ? f.one : f.many}! Drag them into its mouth, then press done.`;
  return {
    id: newId('feed', rng),
    subject: 'maths',
    topic,
    level,
    kind: 'feed',
    food: f.key,
    variant,
    parts,
    supply,
    prompt,
    speech,
    signature: `feed:${parts.join('+')}`,
  };
}

// ---------------------------------------------------------------- Game 3: Balloon pop

function genBalloon(topic: MathsTopic, level: Level, rng: Rng): BalloonQuestion {
  const task = taskFor(topic, level, rng);
  const ans = evalTask(task);
  const { lo, hi } = taskOptionRange(topic, level, task);
  const options = numberOptions(ans, level === 1 ? 3 : 4, lo, hi, rng, taskDistractors(task));
  const t = taskText(task, 'Pop');
  const isSum = task.type === 'add' || task.type === 'sub';
  return {
    id: newId('balloon', rng),
    subject: 'maths',
    topic,
    level,
    kind: 'balloon',
    task,
    options,
    prompt: isSum ? `Pop the balloon with the answer!` : t.prompt,
    speech: isSum ? `${t.speech} Pop the balloon with the answer.` : t.speech,
    signature: `balloon:${taskSignature(task)}`,
  };
}

// ---------------------------------------------------------------- Game 4: Number train

function genTrain(topic: MathsTopic, level: Level, rng: Rng): TrainQuestion {
  const id = newId('train', rng);
  if (topic === 'comparison') {
    const k = level <= 3 ? 3 : level === 4 ? 4 : 5;
    const max = level <= 2 ? 10 : limit('compareMax', level);
    const picked = new Set<number>();
    while (picked.size < k) picked.add(rng.int(level <= 2 ? 1 : 0, max));
    const direction: 'asc' | 'desc' = level === 5 && rng.chance(0.4) ? 'desc' : 'asc';
    const cars = [...picked].sort((a, b) => (direction === 'asc' ? a - b : b - a));
    let tiles = rng.shuffle(cars);
    for (let i = 0; i < 5 && tiles.every((v, j) => v === cars[j]); i++) tiles = rng.shuffle(cars);
    return {
      id,
      subject: 'maths',
      topic,
      level,
      kind: 'train',
      variant: 'order',
      cars,
      start: cars[0]!,
      step: 0,
      direction,
      missing: cars.map((_, i) => i),
      tiles,
      prompt: direction === 'asc' ? 'Put the numbers in order — smallest first!' : 'Put the numbers in order — biggest first!',
      speech: direction === 'asc' ? 'Put the numbers on the train in order. Start with the smallest number.' : 'Put the numbers on the train in order. Start with the biggest number.',
      signature: `train:order:${direction}:${cars.join(',')}`,
    };
  }

  const n = level >= 4 ? 6 : 5;
  let step = 1;
  let start = 0;
  if (topic === 'counting') {
    if (level <= 2) {
      start = rng.int(1, 6);
    } else if (level === 3) {
      step = -1;
      start = rng.int(n + 1, 10);
    } else if (level === 4) {
      step = -1;
      start = rng.int(n + 1, 20);
    } else {
      step = rng.pick([2, 5, 10]);
      start = step * rng.int(0, step === 2 ? 5 : step === 5 ? 4 : 0);
    }
  } else if (topic === 'patterns') {
    if (level === 4) {
      step = 2;
      start = rng.int(0, 10);
    } else {
      step = rng.pick([5, 10, -2]);
      start = step === -2 ? rng.int(12, 20) : step * rng.int(0, step === 5 ? 3 : 0);
    }
  } else {
    // numbers
    const max = limit('numberMax', level);
    if (level === 5 && rng.chance(0.4)) {
      step = -1;
      start = rng.int(n + 5, max);
    } else {
      start = rng.int(level <= 2 ? 0 : Math.floor(max / 3), max - (n - 1));
    }
  }
  const cars = Array.from({ length: n }, (_, i) => start + step * i);
  const missingCount = level >= 4 ? 2 : 1;
  let missing: number[];
  do {
    missing = rng
      .shuffle(Array.from({ length: n - 1 }, (_, i) => i + 1))
      .slice(0, missingCount)
      .sort((a, b) => a - b);
  } while (missingCount === 2 && missing[1]! - missing[0]! === 1);
  const missingValues = missing.map((i) => cars[i]!);
  const used = new Set(cars);
  const distractors: number[] = [];
  const candidates = rng.shuffle(missingValues.flatMap((v) => [v + 1, v - 1, v + 2, v - 2, v + Math.abs(step) + 1, v + 10]));
  for (const d of candidates) {
    if (distractors.length >= 2) break;
    if (d >= 0 && !used.has(d) && !distractors.includes(d)) distractors.push(d);
  }
  const tiles = rng.shuffle([...missingValues, ...distractors]);
  const direction: 'asc' | 'desc' = step > 0 ? 'asc' : 'desc';
  let prompt = missingCount === 1 ? 'Which number is missing from the train?' : 'Which numbers are missing from the train?';
  let speech = missingCount === 1 ? 'One carriage is empty! Drag the right number onto the train.' : 'Some carriages are empty! Drag the right numbers onto the train.';
  if (Math.abs(step) > 1) {
    prompt = `Count in ${Math.abs(step)}s${step < 0 ? ' backwards' : ''}! Fill the gaps.`;
    speech = `This train counts in ${Math.abs(step)}s${step < 0 ? ', going backwards' : ''}. Which numbers are missing?`;
  } else if (step < 0) {
    prompt = 'Count backwards! Fill the empty carriage.';
    speech = 'This train counts backwards. Which number is missing?';
  }
  return {
    id,
    subject: 'maths',
    topic,
    level,
    kind: 'train',
    variant: 'sequence',
    cars,
    start,
    step,
    direction,
    missing,
    tiles,
    prompt,
    speech,
    signature: `train:${start}:${step}:${missing.join(',')}`,
  };
}

// ---------------------------------------------------------------- Game 5: Treasure chest

function genTreasure(topic: MathsTopic, level: Level, rng: Rng): TreasureQuestion {
  const task = taskFor(topic, level, rng);
  const ans = evalTask(task);
  const { lo, hi } = taskOptionRange(topic, level, task);
  const keys = numberOptions(ans, level === 1 ? 3 : 4, lo, hi, rng, taskDistractors(task));
  const t = taskText(task, 'Find');
  return {
    id: newId('treasure', rng),
    subject: 'maths',
    topic,
    level,
    kind: 'treasure',
    task,
    keys,
    prompt: `Which key opens the chest? ${t.prompt}`,
    speech: `The treasure chest has a number lock. ${t.speech} Drag the right key to the lock.`,
    signature: `treasure:${taskSignature(task)}`,
  };
}

// ---------------------------------------------------------------- Game 6: Pizza

function genPizza(topic: MathsTopic, level: Level, rng: Rng): PizzaQuestion {
  let toppings: { type: Topping; count: number }[];
  if (topic === 'counting') {
    const type = rng.pick(TOPPINGS);
    toppings = [{ type, count: rng.int(level === 1 ? 1 : 3, level === 1 ? 5 : 8) }];
  } else {
    const kinds = level >= 4 ? 3 : 2;
    const max = Math.min(limit('addMax', level), level >= 4 ? 12 : 10);
    const total = rng.int(kinds, max);
    const counts = splitInto(total, kinds, rng);
    const types = rng.shuffle(TOPPINGS).slice(0, kinds);
    toppings = types.map((type, i) => ({ type, count: counts[i]! }));
  }
  const total = toppings.reduce((s, t) => s + t.count, 0);
  const options = numberOptions(total, level === 1 ? 3 : 4, 1, total + 3, rng);
  const list = toppings.map((t) => `${t.count} ${t.count === 1 ? TOPPING_INFO[t.type]!.one : TOPPING_INFO[t.type]!.many}`);
  const joined = list.length === 1 ? list[0] : `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
  return {
    id: newId('pizza', rng),
    subject: 'maths',
    topic,
    level,
    kind: 'pizza',
    toppings,
    options,
    prompt: `Put ${joined} on the pizza!`,
    speech: `Let's make a pizza! Put ${joined} on the pizza. Then press done.`,
    signature: `pizza:${toppings.map((t) => `${t.type}${t.count}`).join('+')}`,
  };
}

// ---------------------------------------------------------------- Game 7: Shape detective

const SHAPE_COLOURS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

/** Builds a little town picture out of clearly-drawn shapes (scene is 400 x 260). */
export function buildScene(level: Level, rng: Rng): SceneShape[] {
  const allowed = new Set(SHAPES_BY_LEVEL[level]);
  const items: SceneShape[] = [];
  let n = 0;
  const add = (shape: ShapeName, x: number, y: number, w: number, h: number, role: string, color?: string) => {
    if (!allowed.has(shape)) return;
    items.push({ id: `s${++n}`, shape, x, y, w, h, rotation: 0, role, color: color ?? rng.pick(SHAPE_COLOURS) });
  };
  // house
  add('square', 90, 187, 96, 96, 'house wall', '#fde68a');
  add('triangle', 90, 110, 126, 58, 'roof', rng.pick(['#ef4444', '#f97316', '#8b5cf6']));
  add('rectangle', 90, 211, 26, 48, 'door', '#92400e');
  const roundWindows = rng.chance(0.4);
  add(roundWindows ? 'circle' : 'square', 63, 165, 24, 24, 'window', '#7dd3fc');
  add(roundWindows ? 'circle' : 'square', 117, 165, 24, 24, 'window', '#7dd3fc');
  // vehicle or toys on the ground
  if (allowed.has('rectangle')) {
    add('rectangle', 250, 205, 104, 40, 'car', rng.pick(['#3b82f6', '#ef4444', '#22c55e']));
    add('circle', 222, 228, 30, 30, 'wheel', '#1f2937');
    add('circle', 278, 228, 30, 30, 'wheel', '#1f2937');
  } else {
    add('circle', 190, 220, 38, 38, 'ball');
    add('square', 245, 212, 54, 54, 'toy box');
  }
  // tree
  add('rectangle', 352, 219, 16, 44, 'tree trunk', '#92400e');
  if (rng.chance(0.5)) add('triangle', 352, 162, 72, 80, 'tree', '#16a34a');
  else add('circle', 352, 165, 72, 72, 'tree', '#16a34a');
  // sky
  add('circle', 352, 42, 48, 48, 'sun', '#facc15');
  if (allowed.has('star')) {
    const spots = rng.shuffle([
      [180, 38],
      [226, 62],
      [140, 28],
    ]);
    const k = rng.int(1, 3);
    for (const [x, y] of spots.slice(0, k)) add('star', x!, y!, 28, 28, 'star', '#facc15');
  }
  if (allowed.has('oval')) {
    add('oval', 205, 104, 34, 52, 'balloon');
    if (level >= 4 && rng.chance(0.6)) add('oval', 166, 112, 30, 46, 'balloon');
  }
  if (rng.chance(0.6)) add('triangle', 300, 100, 34, 28, 'flag');
  return items;
}

function genShapes(_topic: MathsTopic, level: Level, rng: Rng): ShapesQuestion {
  const allowed = SHAPES_BY_LEVEL[level];
  const pickOne = rng.chance(level <= 2 ? 0.45 : 0.3);
  if (pickOne) {
    const k = level === 1 ? 3 : 4;
    const target = rng.pick(allowed);
    const others = rng.shuffle(allowed.filter((s) => s !== target)).slice(0, k - 1);
    const shapes = rng.shuffle([target, ...others]);
    const dims: Record<ShapeName, [number, number]> = {
      circle: [80, 80],
      square: [76, 76],
      triangle: [88, 78],
      rectangle: [112, 60],
      oval: [100, 64],
      star: [88, 88],
    };
    const gap = 400 / k;
    const items: SceneShape[] = shapes.map((shape, i) => ({
      id: `o${i + 1}`,
      shape,
      x: Math.round(gap * (i + 0.5)),
      y: 130,
      w: dims[shape][0],
      h: dims[shape][1],
      rotation: 0,
      role: shape,
      color: SHAPE_COLOURS[(i * 3 + rng.int(0, 7)) % SHAPE_COLOURS.length]!,
    }));
    return {
      id: newId('shapes', rng),
      subject: 'maths',
      topic: 'shapes',
      level,
      kind: 'shapes',
      variant: 'pick-one',
      target,
      items,
      prompt: `Which one is a ${target}?`,
      speech: `Can you find the ${target}? Tap it!`,
      signature: `shapes:pick:${target}:${shapes.join(',')}`,
    };
  }
  const items = buildScene(level, rng);
  const present = [...new Set(items.map((i) => i.shape))].filter((s) => allowed.includes(s));
  const target = rng.pick(present);
  const count = items.filter((i) => i.shape === target).length;
  return {
    id: newId('shapes', rng),
    subject: 'maths',
    topic: 'shapes',
    level,
    kind: 'shapes',
    variant: 'find-all',
    target,
    items,
    prompt: `Find all the ${plural(target)}!`,
    speech: `Be a shape detective! Find all the ${plural(target)} in the picture. Then press done.`,
    signature: `shapes:find:${target}:${count}:${items.length}`,
  };
}

export function plural(shape: ShapeName): string {
  return `${shape}s`;
}

// ---------------------------------------------------------------- Game 8: Catch

function genCatch(topic: MathsTopic, level: Level, rng: Rng): CatchQuestion {
  const task = topic === 'addition' ? addTask(level, rng, 10) : topic === 'subtraction' ? subTask(level, rng, 10) : numberTask(level, rng, numberTaskTypes(level));
  const ans = evalTask(task);
  const { lo, hi } = taskOptionRange(topic, level, task);
  const k = level === 1 ? 4 : level === 2 ? 5 : 6;
  const values = numberOptions(ans, k, lo, hi, rng, taskDistractors(task));
  const lanes = rng.shuffle(values.map((_, i) => i));
  const items = values.map((value, i) => ({ id: `c${i + 1}`, value, lane: lanes[i]!, delay: round1(i * 0.9 + rng.next() * 0.6) }));
  const t = taskText(task, 'Catch');
  const isSum = task.type === 'add' || task.type === 'sub';
  return {
    id: newId('catch', rng),
    subject: 'maths',
    topic,
    level,
    kind: 'catch',
    task,
    items,
    prompt: isSum ? `Catch the star with the answer!` : task.type === 'identify' ? t.prompt : `Catch the answer! ${t.prompt}`,
    speech: isSum ? `${t.speech} Catch the star with the answer.` : t.speech,
    signature: `catch:${taskSignature(task)}`,
  };
}

// ---------------------------------------------------------------- Game 9: Pattern

const PATTERN_UNITS: Record<Exclude<PatternType, 'number'>, number[]> = {
  AB: [0, 1],
  AAB: [0, 0, 1],
  ABB: [0, 1, 1],
  ABC: [0, 1, 2],
  AABB: [0, 0, 1, 1],
};

function genPattern(_topic: MathsTopic, level: Level, rng: Rng): PatternQuestion {
  const types: PatternType[] =
    level === 1 ? ['AB'] : level === 2 ? ['AB', 'AAB', 'ABB'] : level === 3 ? ['ABC', 'AABB', 'AAB', 'ABB'] : level === 4 ? ['number', 'ABC', 'AABB', 'number'] : ['number', 'number', 'ABC', 'AABB'];
  const patternType = rng.pick(types);
  const id = newId('pattern', rng);
  if (patternType === 'number') {
    const step = level === 4 ? rng.pick([1, 2]) : rng.pick([2, 5, 10, -1, -2]);
    const len = 6;
    let start: number;
    if (step > 0) start = step >= 5 ? step * rng.int(0, step === 5 ? 4 : 2) : rng.int(0, 10);
    else start = rng.int(Math.abs(step) * (len - 1), 20);
    const values = Array.from({ length: len }, (_, i) => start + step * i);
    const blankIndex = level >= 5 && rng.chance(0.4) ? rng.int(3, len - 1) : len - 1;
    const ans = values[blankIndex]!;
    const opts = numberOptions(ans, 4, 0, Math.max(...values) + 10, rng, [ans + 1, ans - 1, ans + step + 1, ans - step]);
    return {
      id,
      subject: 'maths',
      topic: 'patterns',
      level,
      kind: 'pattern',
      patternType,
      tokenSet: 'numbers',
      unit: [],
      start,
      step,
      sequence: values.map(String),
      blankIndex,
      options: opts.map(String),
      prompt: blankIndex === len - 1 ? 'What number comes next?' : 'Which number is missing?',
      speech: blankIndex === len - 1 ? 'Look at the number pattern. What number comes next?' : 'Look at the number pattern. Which number is missing?',
      signature: `pattern:n:${start}:${step}:${blankIndex}`,
    };
  }
  const letters = PATTERN_UNITS[patternType];
  const distinct = Math.max(...letters) + 1;
  const sets: Exclude<TokenSet, 'numbers'>[] = level === 1 ? ['colours', 'fruits', 'animals'] : ['colours', 'fruits', 'animals', 'shapes'];
  const tokenSet = rng.pick(sets);
  const pool = rng.shuffle(PATTERN_TOKENS[tokenSet].map((t) => t.id));
  const chosen = pool.slice(0, distinct);
  const unit = letters.map((l) => chosen[l]!);
  const u = unit.length;
  const total = rng.int(2 * u + 1, 3 * u);
  const sequence = Array.from({ length: total }, (_, i) => unit[i % u]!);
  const blankIndex = level >= 4 && rng.chance(0.4) ? rng.int(2 * u, total - 1) : total - 1;
  const answer = sequence[blankIndex]!;
  const distractor = pool.find((t) => !chosen.includes(t));
  const optionIds = rng.shuffle(level === 1 ? [...chosen, ...(distractor ? [distractor] : [])].slice(0, 3) : [...chosen, ...(distractor ? [distractor] : [])]);
  if (!optionIds.includes(answer)) optionIds[0] = answer;
  const label = (tid: string) => tokenInfo(tokenSet, tid).label;
  return {
    id,
    subject: 'maths',
    topic: 'patterns',
    level,
    kind: 'pattern',
    patternType,
    tokenSet,
    unit,
    start: 0,
    step: 0,
    sequence,
    blankIndex,
    options: optionIds,
    prompt: blankIndex === total - 1 ? 'What comes next?' : 'What is missing?',
    speech: `${sequence.slice(0, Math.min(blankIndex, 2 * u)).map(label).join(', ')}… ${blankIndex === total - 1 ? 'What comes next?' : 'What is missing?'}`,
    signature: `pattern:${patternType}:${unit.join('-')}:${blankIndex}`,
  };
}

// ---------------------------------------------------------------- Game 10: Shop

function genShop(topic: MathsTopic, level: Level, rng: Rng): ShopQuestion {
  const item = rng.pick(SHOP_ITEMS);
  let variant: ShopQuestion['variant'];
  let have: number;
  let amount: number;
  if (topic === 'addition') {
    variant = 'earn';
    const sum = rng.int(2, Math.min(limit('addMax', level), 12));
    have = rng.int(1, sum - 1);
    amount = sum - have;
  } else {
    variant = 'spend';
    have = rng.int(2, Math.min(limit('subMax', level), 12));
    amount = level >= 3 && rng.chance(0.1) ? have : rng.int(1, have - 1);
  }
  const ans = variant === 'spend' ? have - amount : have + amount;
  const options = numberOptions(ans, level === 1 ? 3 : 4, 0, have + amount + 2, rng, variant === 'spend' ? [have + amount, amount] : [have, amount]);
  const prompt =
    variant === 'spend'
      ? `You have ${have} coins. The ${item.name} costs ${amount}. Pay for it!`
      : `You have ${have} coins. Granny gives you ${amount} more!`;
  const speech =
    variant === 'spend'
      ? `You have ${have} coins. The ${item.name} costs ${amount} ${amount === 1 ? 'coin' : 'coins'}. Put ${amount} ${amount === 1 ? 'coin' : 'coins'} on the counter to pay.`
      : `You have ${have} coins. Granny gives you ${amount} more ${amount === 1 ? 'coin' : 'coins'}. Put them in your purse.`;
  return {
    id: newId('shop', rng),
    subject: 'maths',
    topic,
    level,
    kind: 'shop',
    variant,
    have,
    amount,
    item: item.key,
    options,
    prompt,
    speech,
    signature: `shop:${variant}:${have}:${amount}`,
  };
}

// ---------------------------------------------------------------- Game 11: Number line

function genNumberLine(topic: MathsTopic, level: Level, rng: Rng): NumberLineQuestion {
  let start: number;
  let jumps: number;
  let direction: 'forward' | 'back';
  if (topic === 'subtraction') {
    direction = 'back';
    start = rng.int(2, limit('subMax', level));
    jumps = rng.int(1, Math.min(start, 6));
  } else if (topic === 'addition') {
    direction = 'forward';
    const sum = rng.int(2, limit('addMax', level));
    jumps = rng.int(1, Math.min(sum, 6));
    start = sum - jumps;
  } else {
    direction = rng.chance(0.5) ? 'forward' : 'back';
    jumps = rng.int(1, 2);
    const max = Math.min(limit('numberMax', level), 20);
    start = direction === 'forward' ? rng.int(0, max - jumps) : rng.int(jumps, max);
  }
  const end = direction === 'forward' ? start + jumps : start - jumps;
  const max = Math.max(start, end) > 10 ? 20 : 10;
  return {
    id: newId('numberline', rng),
    subject: 'maths',
    topic,
    level,
    kind: 'numberline',
    start,
    jumps,
    direction,
    min: 0,
    max,
    prompt: `Start at ${start}. Jump ${direction === 'forward' ? 'forward' : 'back'} ${jumps}. Where do you land?`,
    speech: `The frog is on ${start}. Help it jump ${direction === 'forward' ? 'forward' : 'back'} ${jumps} ${jumps === 1 ? 'space' : 'spaces'}. Then tap the number where it lands.`,
    signature: `numberline:${start}${direction === 'forward' ? '+' : '-'}${jumps}`,
  };
}

// ---------------------------------------------------------------- Game 12: Tower

function genTower(topic: MathsTopic, level: Level, rng: Rng): TowerQuestion {
  const base = { id: newId('tower', rng), subject: 'maths' as const, topic, level, kind: 'tower' as const };
  if (topic === 'counting') {
    const ranges: Record<Level, [number, number]> = { 1: [1, 5], 2: [2, 8], 3: [3, 10], 4: [4, 10], 5: [5, 10] };
    const [lo, hi] = ranges[level];
    const target = Math.min(rng.int(lo, hi), limit('towerMax', level));
    return {
      ...base,
      variant: 'build',
      target,
      left: 0,
      right: 0,
      ask: 'taller',
      prompt: `Build a tower of ${target} ${target === 1 ? 'block' : 'blocks'}!`,
      speech: `Build a tower with ${target} ${target === 1 ? 'block' : 'blocks'}. Tap the blocks to add them. Press done when it is ready.`,
      signature: `tower:build:${target}`,
    };
  }
  const max = Math.min(level === 1 ? 5 : 10, limit('towerMax', level));
  const left = rng.int(1, max);
  let right = rng.int(1, max);
  const minGap = level === 1 ? 2 : 1;
  while (Math.abs(right - left) < minGap) right = rng.int(1, max);
  const asks: TowerQuestion['ask'][] = topic === 'reasoning' ? ['taller', 'shorter'] : ['taller', 'shorter', 'more', 'fewer'];
  const ask = rng.pick(asks);
  const prompts: Record<TowerQuestion['ask'], string> = {
    taller: 'Which tower is taller?',
    shorter: 'Which tower is shorter?',
    more: 'Which tower has more blocks?',
    fewer: 'Which tower has fewer blocks?',
  };
  return {
    ...base,
    variant: 'compare',
    target: 0,
    left,
    right,
    ask,
    prompt: prompts[ask],
    speech: prompts[ask],
    signature: `tower:cmp:${left}:${right}:${ask}`,
  };
}

// ---------------------------------------------------------------- Game 13: Look & choose

function opt(id: string, visual: ChooseOption['visual'], facts: ChooseOption['facts']): ChooseOption {
  return { id, visual, facts };
}

function distinctInts(k: number, lo: number, hi: number, rng: Rng, minGap = 1): number[] {
  for (let attempt = 0; attempt < 200; attempt++) {
    const vals = new Set<number>();
    while (vals.size < k) vals.add(rng.int(lo, hi));
    const sorted = [...vals].sort((a, b) => a - b);
    if (sorted.every((v, i) => i === 0 || v - sorted[i - 1]! >= minGap)) return rng.shuffle(sorted);
  }
  throw new Error('distinctInts: could not satisfy gap');
}

function chooseVariants(topic: MathsTopic, level: Level): ChooseQuestion['variant'][] {
  if (topic === 'comparison') {
    if (level === 1) return ['more-group'];
    if (level === 2) return ['more-group', 'compare-numbers'];
    return ['compare-numbers', 'symbol', 'more-group'];
  }
  if (topic === 'reasoning') {
    if (level === 1) return ['size', 'odd-one-out'];
    if (level === 2) return ['size', 'odd-one-out', 'height', 'length'];
    return ['size', 'odd-one-out', 'height', 'length', 'position'];
  }
  // measurement
  if (level === 1) return ['day-night', 'length'];
  if (level === 2) return ['day-night', 'length', 'weight'];
  return ['length', 'weight', 'routine', 'measure', 'day-night'];
}

function genChoose(topic: MathsTopic, level: Level, rng: Rng): ChooseQuestion {
  const variant = rng.pick(chooseVariants(topic, level));
  const base = { id: newId('choose', rng), subject: 'maths' as const, topic, level, kind: 'choose' as const, variant };
  const three = level >= 4;
  switch (variant) {
    case 'more-group': {
      const max = Math.min(limit('compareMax', level), 10);
      const [a, b] = distinctInts(2, 1, max, rng, level === 1 ? 2 : 1) as [number, number];
      const emoji = rng.pick(['🍎', '🐟', '🌸', '⭐', '🐞', '🍓']);
      const ask = rng.pick(['max', 'min'] as const);
      return {
        ...base,
        rule: { type: ask, fact: 'count' },
        options: [opt('g1', { type: 'group', emoji, count: a }, { count: a }), opt('g2', { type: 'group', emoji, count: b }, { count: b })],
        prompt: ask === 'max' ? 'Which group has MORE?' : 'Which group has FEWER?',
        speech: ask === 'max' ? 'Which group has more? Tap it.' : 'Which group has fewer? Tap it.',
        signature: `choose:group:${a}:${b}:${ask}`,
      };
    }
    case 'compare-numbers': {
      const max = limit('compareMax', level);
      const k = three ? 3 : 2;
      const nums = distinctInts(k, 0, max, rng);
      const ask = rng.pick(['max', 'min'] as const);
      return {
        ...base,
        rule: { type: ask, fact: 'value' },
        options: nums.map((n, i) => opt(`n${i + 1}`, { type: 'number', n }, { value: n })),
        prompt: ask === 'max' ? 'Which number is BIGGER?' : 'Which number is SMALLER?',
        speech: ask === 'max' ? `Which number is bigger: ${nums.join(' or ')}?` : `Which number is smaller: ${nums.join(' or ')}?`,
        signature: `choose:num:${nums.join(',')}:${ask}`,
      };
    }
    case 'symbol': {
      const max = level <= 3 ? 10 : limit('compareMax', level);
      const a = rng.int(0, max);
      const b = rng.chance(0.25) ? a : rng.int(0, max);
      return {
        ...base,
        rule: { type: 'compare', a, b },
        scene: { left: a, right: b },
        options: [
          opt('lt', { type: 'symbol', symbol: '<' }, { symbol: '<' }),
          opt('eq', { type: 'symbol', symbol: '=' }, { symbol: '=' }),
          opt('gt', { type: 'symbol', symbol: '>' }, { symbol: '>' }),
        ],
        prompt: `${a}  ?  ${b}`,
        speech: `Is ${a} bigger than, smaller than, or the same as ${b}? The crocodile always eats the bigger number!`,
        signature: `choose:sym:${a}:${b}`,
      };
    }
    case 'size': {
      const emoji = rng.pick(SIZE_OBJECTS);
      const sizes = three ? rng.shuffle([42, 68, 96]) : rng.shuffle([45, 95]);
      const ask = rng.pick(['max', 'min'] as const);
      return {
        ...base,
        rule: { type: ask, fact: 'size' },
        options: sizes.map((s, i) => opt(`z${i + 1}`, { type: 'sized', emoji, size: s }, { size: s })),
        prompt: ask === 'max' ? (three ? 'Which is the BIGGEST?' : 'Which is BIGGER?') : three ? 'Which is the SMALLEST?' : 'Which is SMALLER?',
        speech: ask === 'max' ? 'Which one is the biggest?' : 'Which one is the smallest?',
        signature: `choose:size:${emoji}:${sizes.join(',')}:${ask}`,
      };
    }
    case 'height':
    case 'length': {
      const k = three ? 3 : 2;
      const lens = distinctInts(k, 2, 9, rng, 2);
      const ask = rng.pick(['max', 'min'] as const);
      const emoji = variant === 'height' ? rng.pick(['🌻', '🌷', '🦒']) : rng.pick(['🐍', '🐛', '✏️']);
      const colors = rng.shuffle(['#f472b6', '#60a5fa', '#34d399', '#fbbf24']);
      const word = variant === 'height' ? (ask === 'max' ? 'TALLER' : 'SHORTER') : ask === 'max' ? 'LONGER' : 'SHORTER';
      const wordMost = variant === 'height' ? (ask === 'max' ? 'TALLEST' : 'SHORTEST') : ask === 'max' ? 'LONGEST' : 'SHORTEST';
      return {
        ...base,
        rule: { type: ask, fact: 'length' },
        options: lens.map((l, i) => opt(`b${i + 1}`, { type: 'bar', emoji, length: l, color: colors[i]! }, { length: l })),
        prompt: three ? `Which is the ${wordMost}?` : `Which is ${word}?`,
        speech: three ? `Which one is the ${wordMost.toLowerCase()}?` : `Which one is ${word.toLowerCase()}?`,
        signature: `choose:${variant}:${lens.join(',')}:${ask}`,
      };
    }
    case 'weight': {
      let a = rng.pick(WEIGHT_OBJECTS);
      let b = rng.pick(WEIGHT_OBJECTS);
      while (Math.abs(a.tier - b.tier) < 2) {
        a = rng.pick(WEIGHT_OBJECTS);
        b = rng.pick(WEIGHT_OBJECTS);
      }
      const ask = rng.pick(['max', 'min'] as const);
      return {
        ...base,
        rule: { type: ask, fact: 'weight' },
        options: [opt('w1', { type: 'emoji', emoji: a.emoji, label: a.label }, { weight: a.tier }), opt('w2', { type: 'emoji', emoji: b.emoji, label: b.label }, { weight: b.tier })],
        prompt: ask === 'max' ? 'Which is HEAVIER?' : 'Which is LIGHTER?',
        speech: ask === 'max' ? `Which is heavier: the ${a.label} or the ${b.label}?` : `Which is lighter: the ${a.label} or the ${b.label}?`,
        signature: `choose:weight:${a.label}:${b.label}:${ask}`,
      };
    }
    case 'measure': {
      const len = rng.int(2, level >= 4 ? 10 : 6);
      const emoji = rng.pick(['🐛', '✏️', '🐍', '🥖']);
      const values = numberOptions(len, level >= 4 ? 4 : 3, 1, 12, rng);
      return {
        ...base,
        rule: { type: 'match', fact: 'value', value: len },
        scene: { measureEmoji: emoji, measureLength: len },
        options: values.map((v, i) => opt(`m${i + 1}`, { type: 'number', n: v }, { value: v })),
        prompt: 'How many blocks long is it?',
        speech: 'Count the blocks. How many blocks long is it?',
        signature: `choose:measure:${emoji}:${len}`,
      };
    }
    case 'day-night': {
      const ask = rng.pick(['night', 'day'] as const);
      const right = rng.pick(ask === 'night' ? NIGHT_THINGS : DAY_THINGS);
      const wrong = rng.shuffle(ask === 'night' ? DAY_THINGS : NIGHT_THINGS).slice(0, 2);
      const all = rng.shuffle([
        { ...right, when: ask },
        ...wrong.map((w) => ({ ...w, when: ask === 'night' ? 'day' : 'night' })),
      ]);
      return {
        ...base,
        rule: { type: 'match', fact: 'when', value: ask },
        options: all.map((t, i) => opt(`d${i + 1}`, { type: 'emoji', emoji: t.emoji, label: t.label }, { when: t.when })),
        prompt: ask === 'night' ? 'Which do we see at NIGHT?' : 'Which do we see in the DAY?',
        speech: ask === 'night' ? 'Which one belongs to the night time?' : 'Which one belongs to the day time?',
        signature: `choose:dn:${ask}:${all.map((a) => a.emoji).join('')}`,
      };
    }
    case 'routine': {
      const r = rng.pick(ROUTINES);
      const k = three ? 3 : 2;
      const idx = rng
        .shuffle(r.steps.map((_, i) => i))
        .slice(0, Math.min(k, r.steps.length));
      const ask = rng.pick(['min', 'max'] as const);
      const lead = r.name === 'plant' ? 'A plant grows.' : r.name === 'morning' ? 'In the morning…' : 'At bedtime…';
      return {
        ...base,
        rule: { type: ask, fact: 'order' },
        options: idx.map((i, j) => opt(`r${j + 1}`, { type: 'emoji', emoji: r.steps[i]!.emoji, label: r.steps[i]!.label }, { order: i })),
        prompt: `${lead} What comes ${ask === 'min' ? 'FIRST' : 'LAST'}?`,
        speech: `${lead} Which comes ${ask === 'min' ? 'first' : 'last'}?`,
        signature: `choose:routine:${r.name}:${idx.join(',')}:${ask}`,
      };
    }
    case 'odd-one-out': {
      const [major, minor] = rng.shuffle(ODD_CATEGORIES) as [(typeof ODD_CATEGORIES)[number], (typeof ODD_CATEGORIES)[number]];
      const k = level >= 3 ? 3 : 2;
      const same = rng.shuffle(major.items).slice(0, k);
      const odd = rng.pick(minor.items);
      const all = rng.shuffle([...same.map((e) => ({ e, c: major.category })), { e: odd, c: minor.category }]);
      return {
        ...base,
        rule: { type: 'odd', fact: 'category' },
        options: all.map((x, i) => opt(`x${i + 1}`, { type: 'emoji', emoji: x.e, label: x.c }, { category: x.c })),
        prompt: 'Which one does NOT belong?',
        speech: 'Three of these go together. Which one does not belong?',
        signature: `choose:odd:${all.map((a) => a.e).join('')}`,
      };
    }
    case 'position': {
      const anchor = rng.pick(POSITION_ANCHORS);
      const objs = rng.shuffle(POSITION_OBJECTS).slice(0, 3);
      const positions = ['on', 'under', 'beside'] as const;
      const ask = rng.pick(positions);
      const words = { on: 'ON', under: 'UNDER', beside: 'NEXT TO' };
      return {
        ...base,
        rule: { type: 'match', fact: 'pos', value: ask },
        scene: { anchor: anchor.emoji },
        options: rng.shuffle(objs.map((e, i) => opt(`p${i + 1}`, { type: 'emoji', emoji: e, label: positions[i]! }, { pos: positions[i]! }))),
        prompt: `What is ${words[ask]} the ${anchor.name}?`,
        speech: `Look at the ${anchor.name}. What is ${words[ask].toLowerCase()} the ${anchor.name}?`,
        signature: `choose:pos:${anchor.name}:${objs.join('')}:${ask}`,
      };
    }
  }
}

// ---------------------------------------------------------------- dispatcher

export function generateKind(kind: GameKind, topic: MathsTopic, level: Level, rng: Rng, mode: Mode): MathsQuestion {
  switch (kind) {
    case 'count':
      return genCount(topic, level, rng, mode);
    case 'feed':
      return genFeed(topic, level, rng);
    case 'balloon':
      return genBalloon(topic, level, rng);
    case 'train':
      return genTrain(topic, level, rng);
    case 'treasure':
      return genTreasure(topic, level, rng);
    case 'pizza':
      return genPizza(topic, level, rng);
    case 'shapes':
      return genShapes(topic, level, rng);
    case 'catch':
      return genCatch(topic, level, rng);
    case 'pattern':
      return genPattern(topic, level, rng);
    case 'shop':
      return genShop(topic, level, rng);
    case 'numberline':
      return genNumberLine(topic, level, rng);
    case 'tower':
      return genTower(topic, level, rng);
    case 'choose':
      return genChoose(topic, level, rng);
  }
}

// re-exported for UI convenience
export { creature, food, shopItem };
