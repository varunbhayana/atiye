/**
 * Independent question validation. Written separately from the generators: it re-derives every
 * answer from primary data and checks the invariants a child relies on —
 * unique options, exactly one correct option, visuals matching numbers, difficulty limits, no negatives.
 */
import { PATTERN_TOKENS, TOPPING_INFO } from './catalog';
import { LIMITS, SHAPES_BY_LEVEL } from './curriculum';
import { expectedResponse, solveChoose } from './answers';
import type { MathsQuestion, NumberTask, SceneShape } from './types';

const isInt = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n);
const lim = (name: keyof typeof LIMITS, level: number) => LIMITS[name][level - 1]!;

function uniq<T>(xs: T[]): boolean {
  return new Set(xs).size === xs.length;
}

function checkOptions(errors: string[], options: (number | string)[], answer: number | string, min = 2) {
  if (options.length < min) errors.push(`too few options (${options.length})`);
  if (!uniq(options)) errors.push(`duplicate options ${options.join(',')}`);
  const hits = options.filter((o) => o === answer).length;
  if (hits !== 1) errors.push(`answer ${answer} appears ${hits} times in options ${options.join(',')}`);
  if (options.some((o) => typeof o === 'number' && (!isInt(o) || o < 0))) errors.push('option is negative or not a whole number');
}

function taskValue(t: NumberTask): number {
  // deliberately recomputed here rather than imported, so generator bugs cannot hide
  if (t.type === 'add') return t.a + t.b;
  if (t.type === 'sub') return t.a - t.b;
  if (t.type === 'after') return t.n + 1;
  if (t.type === 'before') return t.n - 1;
  if (t.type === 'between') return t.low + 1;
  return t.n;
}

function checkTask(errors: string[], q: MathsQuestion, t: NumberTask) {
  const nums = Object.values(t).filter((v) => typeof v === 'number') as number[];
  if (nums.some((n) => !isInt(n) || n < 0)) errors.push('task has negative or fractional numbers');
  const v = taskValue(t);
  if (v < 0) errors.push(`task result is negative (${v})`);
  if (t.type === 'between' && t.high - t.low !== 2) errors.push('between must have exactly one number in between');
  if (t.type === 'add' && v > lim('addMax', q.level) && q.topic === 'addition') errors.push(`sum ${v} exceeds level limit`);
  if (t.type === 'sub' && t.a > lim('subMax', q.level)) errors.push(`subtraction ${t.a} exceeds level limit`);
  if (q.topic === 'numbers' && (t.type === 'identify' || t.type === 'after' || t.type === 'before' || t.type === 'between')) {
    if (v > lim('numberMax', q.level)) errors.push(`number ${v} exceeds level limit`);
  }
  if (q.topic === 'addition' && t.type !== 'add') errors.push('addition topic must use an addition task');
  if (q.topic === 'subtraction' && t.type !== 'sub') errors.push('subtraction topic must use a subtraction task');
}

function shapeIsUnambiguous(s: SceneShape): boolean {
  const ratio = Math.max(s.w, s.h) / Math.min(s.w, s.h);
  const upright = s.rotation % 90 === 0;
  switch (s.shape) {
    case 'circle':
      return s.w === s.h;
    case 'square':
      return s.w === s.h && upright;
    case 'star':
      return s.w === s.h;
    case 'rectangle':
      return ratio >= 1.6 && upright;
    case 'oval':
      return ratio >= 1.25 && ratio <= 1.9;
    case 'triangle':
      return s.w > 0 && s.h > 0;
  }
}

export function validateMathsQuestion(q: MathsQuestion): string[] {
  const errors: string[] = [];
  if (!q.id || !q.prompt || !q.signature) errors.push('missing id/prompt/signature');
  if (!isInt(q.level) || q.level < 1 || q.level > 5) errors.push(`bad level ${q.level}`);
  const exp = expectedResponse(q);

  switch (q.kind) {
    case 'count': {
      const total = q.groups.reduce((s, n) => s + n, 0);
      if (q.groups.some((g) => !isInt(g) || g < 1)) errors.push('groups must be positive');
      if (q.placements.length !== total) errors.push(`shows ${q.placements.length} creatures but total is ${total}`);
      if (q.variant === 'together' && q.groups.length !== 2) errors.push('together needs two groups');
      if (q.variant !== 'together' && q.groups.length !== 1) errors.push('one group expected');
      if (q.variant === 'takeaway' && !(q.leaving >= 1 && q.leaving < total)) errors.push('takeaway must leave at least one');
      if (q.variant !== 'takeaway' && q.leaving !== 0) errors.push('leaving must be 0');
      const answer = q.variant === 'takeaway' ? total - q.leaving : total;
      if (q.topic === 'counting' && answer > lim('countMax', q.level)) errors.push('count exceeds level');
      if (q.topic === 'addition' && answer > lim('addMax', q.level)) errors.push('sum exceeds level');
      if (q.topic === 'subtraction' && total > lim('subMax', q.level)) errors.push('subtraction exceeds level');
      for (const p of q.placements) if (p.x < 0 || p.x > 100 || p.y < 0 || p.y > 100) errors.push('creature off screen');
      // no creature may hide behind another: centres at least 10 units apart (x weighted for 16:10 scene)
      for (let i = 0; i < q.placements.length; i++)
        for (let j = i + 1; j < q.placements.length; j++) {
          const a = q.placements[i]!;
          const b = q.placements[j]!;
          const d = Math.hypot((a.x - b.x) * 1.6, a.y - b.y);
          if (d < 9) errors.push(`creatures ${i} and ${j} overlap (${d.toFixed(1)})`);
        }
      checkOptions(errors, q.options, answer);
      break;
    }
    case 'feed': {
      const target = q.parts.reduce((s, n) => s + n, 0);
      if (q.parts.some((p) => !isInt(p) || p < 1)) errors.push('parts must be positive');
      if (q.variant === 'parts' && q.parts.length !== 2) errors.push('parts variant needs two parts');
      if (q.supply <= target) errors.push('supply must exceed target so the child has to count');
      if (target > 10) errors.push('too many to feed');
      if (q.topic === 'addition' && target > lim('addMax', q.level)) errors.push('sum exceeds level');
      break;
    }
    case 'balloon':
    case 'treasure':
    case 'catch': {
      checkTask(errors, q, q.task);
      const opts = q.kind === 'catch' ? q.items.map((i) => i.value) : q.kind === 'balloon' ? q.options : q.keys;
      checkOptions(errors, opts, taskValue(q.task));
      if (q.kind === 'catch' && !uniq(q.items.map((i) => i.lane))) errors.push('catch lanes overlap');
      break;
    }
    case 'train': {
      const n = q.cars.length;
      if (n < 3) errors.push('train too short');
      if (!uniq(q.missing) || q.missing.some((i) => i < 0 || i >= n)) errors.push('bad missing indices');
      if (!uniq(q.tiles)) errors.push('duplicate tiles');
      if (q.cars.some((c) => !isInt(c) || c < 0)) errors.push('negative carriage');
      if (q.cars.some((c) => c > lim('numberMax', q.level))) errors.push('carriage exceeds level');
      if (q.variant === 'sequence') {
        if (q.step === 0) errors.push('step must not be 0');
        q.cars.forEach((c, i) => {
          if (c !== q.start + q.step * i) errors.push(`carriage ${i} breaks the rule`);
        });
        if ((q.step > 0) !== (q.direction === 'asc')) errors.push('direction mismatch');
        // the rule must be visible: two neighbouring carriages shown
        const shown = (i: number) => !q.missing.includes(i);
        if (!q.cars.some((_, i) => i + 1 < n && shown(i) && shown(i + 1))) errors.push('no two neighbouring carriages visible');
        for (const i of q.missing) if (!q.tiles.includes(q.cars[i]!)) errors.push('missing value not among tiles');
        const missingVals = new Set(q.missing.map((i) => q.cars[i]!));
        for (const t of q.tiles) if (!missingVals.has(t) && q.cars.includes(t)) errors.push('distractor duplicates a carriage');
        if (q.tiles.some((t) => t < 0)) errors.push('negative tile');
      } else {
        if (!uniq(q.cars)) errors.push('order numbers must be distinct');
        const sorted = [...q.tiles].sort((a, b) => (q.direction === 'asc' ? a - b : b - a));
        if (sorted.join() !== q.cars.join()) errors.push('order cars are not the sorted tiles');
        if (q.missing.length !== n) errors.push('order variant: every carriage starts empty');
        if (q.topic === 'comparison' && Math.max(...q.cars) > lim('compareMax', q.level)) errors.push('order exceeds level');
      }
      break;
    }
    case 'pizza': {
      const types = q.toppings.map((t) => t.type);
      if (!uniq(types)) errors.push('duplicate topping types');
      if (types.some((t) => !TOPPING_INFO[t])) errors.push('unknown topping');
      if (q.toppings.some((t) => !isInt(t.count) || t.count < 1)) errors.push('topping count must be positive');
      const total = q.toppings.reduce((s, t) => s + t.count, 0);
      if (q.topic === 'addition' && total > lim('addMax', q.level)) errors.push('pizza sum exceeds level');
      if (total > 12) errors.push('too many toppings for one pizza');
      checkOptions(errors, q.options, total);
      break;
    }
    case 'shapes': {
      const allowed = SHAPES_BY_LEVEL[q.level];
      if (!allowed.includes(q.target)) errors.push(`target ${q.target} not taught at level ${q.level}`);
      if (!uniq(q.items.map((i) => i.id))) errors.push('duplicate shape ids');
      for (const s of q.items) {
        if (!allowed.includes(s.shape)) errors.push(`shape ${s.shape} not taught at level ${q.level}`);
        if (!shapeIsUnambiguous(s)) errors.push(`ambiguous ${s.shape} (${s.w}x${s.h} rot ${s.rotation})`);
      }
      const targets = q.items.filter((i) => i.shape === q.target).length;
      if (q.variant === 'pick-one') {
        if (targets !== 1) errors.push(`pick-one needs exactly one ${q.target}, has ${targets}`);
        if (!uniq(q.items.map((i) => i.shape))) errors.push('pick-one options must all be different shapes');
      } else {
        if (targets < 1) errors.push('nothing to find');
        if (targets === q.items.length) errors.push('every shape is a target');
      }
      break;
    }
    case 'pattern': {
      if (q.blankIndex < 0 || q.blankIndex >= q.sequence.length) errors.push('blank out of range');
      if (!uniq(q.options)) errors.push('duplicate pattern options');
      if (q.patternType === 'number') {
        const vals = q.sequence.map(Number);
        vals.forEach((v, i) => {
          if (v !== q.start + q.step * i) errors.push('number pattern breaks its rule');
          if (v < 0) errors.push('negative number in pattern');
        });
        // at least three known numbers in a row show the rule
        let run = 0;
        let best = 0;
        vals.forEach((_, i) => {
          run = i === q.blankIndex ? 0 : run + 1;
          best = Math.max(best, run);
        });
        if (best < 3) errors.push('rule not visible');
        checkOptions(errors, q.options, String(q.start + q.step * q.blankIndex));
      } else {
        const u = q.unit.length;
        const known = q.sequence.slice(0, q.blankIndex);
        if (known.length < 2 * u) errors.push('fewer than two full repeats shown before the blank');
        // the smallest repeating unit of what is shown must be exactly the unit → only one sensible answer
        let period = 1;
        for (; period <= known.length; period++) if (known.every((t, i) => t === known[i % period])) break;
        if (period !== u) errors.push(`visible period ${period} ≠ unit ${u}`);
        q.sequence.forEach((t, i) => {
          if (t !== q.unit[i % u]) errors.push('sequence does not follow unit');
        });
        const tokenIds = new Set(PATTERN_TOKENS[q.tokenSet as keyof typeof PATTERN_TOKENS]?.map((t) => t.id) ?? []);
        if ([...q.sequence, ...q.options].some((t) => !tokenIds.has(t))) errors.push('unknown pattern token');
        checkOptions(errors, q.options, q.unit[q.blankIndex % u]!);
      }
      break;
    }
    case 'shop': {
      if (q.have < 1 || q.amount < 1) errors.push('coins must be positive');
      if (q.variant === 'spend' && q.amount > q.have) errors.push('cannot spend more than you have');
      const ans = q.variant === 'spend' ? q.have - q.amount : q.have + q.amount;
      if (q.variant === 'spend' && q.have > lim('subMax', q.level)) errors.push('shop exceeds level');
      if (q.variant === 'earn' && ans > lim('addMax', q.level)) errors.push('shop sum exceeds level');
      checkOptions(errors, q.options, ans);
      break;
    }
    case 'numberline': {
      const end = q.direction === 'forward' ? q.start + q.jumps : q.start - q.jumps;
      if (q.jumps < 1) errors.push('needs at least one jump');
      if (q.start < q.min || q.start > q.max || end < q.min || end > q.max) errors.push('frog leaves the number line');
      if (q.topic === 'addition' && end > lim('addMax', q.level)) errors.push('sum exceeds level');
      if (q.topic === 'subtraction' && q.start > lim('subMax', q.level)) errors.push('subtraction exceeds level');
      break;
    }
    case 'tower': {
      if (q.variant === 'build') {
        if (q.target < 1 || q.target > lim('towerMax', q.level)) errors.push('tower target out of range');
      } else {
        if (q.left === q.right) errors.push('towers must differ');
        if (q.left < 1 || q.right < 1 || q.left > 10 || q.right > 10) errors.push('tower size out of range');
      }
      break;
    }
    case 'choose': {
      if (!uniq(q.options.map((o) => o.id))) errors.push('duplicate option ids');
      if (solveChoose(q) === null) errors.push('choose rule has no single answer');
      const vis = q.options.map((o) => JSON.stringify(o.visual));
      if (!uniq(vis)) errors.push('two options look identical');
      if (q.variant === 'measure' && q.rule.type === 'match' && q.scene?.measureLength !== q.rule.value) errors.push('measure picture mismatch');
      if (q.variant === 'symbol' && q.rule.type === 'compare' && (q.scene?.left !== q.rule.a || q.scene?.right !== q.rule.b)) errors.push('symbol picture mismatch');
      if (q.variant === 'weight') {
        const w = q.options.map((o) => Number(o.facts.weight));
        if (Math.abs(w[0]! - w[1]!) < 2) errors.push('weights too similar to be obvious');
      }
      if (q.variant === 'more-group') {
        for (const o of q.options) if (o.visual.type !== 'group' || o.visual.count !== o.facts.count) errors.push('group picture mismatch');
      }
      if (q.variant === 'height' || q.variant === 'length') {
        for (const o of q.options) if (o.visual.type !== 'bar' || o.visual.length !== o.facts.length) errors.push('bar picture mismatch');
      }
      if (q.variant === 'compare-numbers' || q.variant === 'measure') {
        for (const o of q.options) if (o.visual.type !== 'number' || o.visual.n !== o.facts.value) errors.push('number picture mismatch');
      }
      break;
    }
  }

  // the canonical expected answer must itself be well formed
  if (exp.type === 'number' && (!isInt(exp.value) || exp.value < 0)) errors.push(`expected answer invalid: ${exp.value}`);
  if (exp.type === 'choice' && !exp.value) errors.push('expected choice missing');
  return errors;
}
