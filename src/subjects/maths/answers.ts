/**
 * Expected answers and answer checking. Everything is recomputed from the question's primary data
 * (operands, counts, rules) — never from animation state or UI state.
 */
import type { AnswerResponse } from '../../core/types';
import { TOPPING_INFO, creature, food, shopItem, tokenInfo } from './catalog';
import type { ChooseQuestion, MathsQuestion, NumberTask } from './types';

export function solveTask(t: NumberTask): number {
  switch (t.type) {
    case 'identify':
      return t.n;
    case 'after':
      return t.n + 1;
    case 'before':
      return t.n - 1;
    case 'between':
      return (t.low + t.high) / 2;
    case 'add':
      return t.a + t.b;
    case 'sub':
      return t.a - t.b;
  }
}

/** The single correct option id for a Look & Choose question, or null if the rule is ambiguous. */
export function solveChoose(q: ChooseQuestion): string | null {
  const r = q.rule;
  const opts = q.options;
  const num = (o: (typeof opts)[number], f: string) => Number(o.facts[f]);
  if (r.type === 'max' || r.type === 'min') {
    const vals = opts.map((o) => num(o, r.fact));
    if (vals.some((v) => Number.isNaN(v))) return null;
    const best = r.type === 'max' ? Math.max(...vals) : Math.min(...vals);
    const hits = opts.filter((o) => num(o, r.fact) === best);
    return hits.length === 1 ? hits[0]!.id : null;
  }
  if (r.type === 'match') {
    const hits = opts.filter((o) => String(o.facts[r.fact]) === String(r.value));
    return hits.length === 1 ? hits[0]!.id : null;
  }
  if (r.type === 'odd') {
    const counts = new Map<string, number>();
    for (const o of opts) counts.set(String(o.facts[r.fact]), (counts.get(String(o.facts[r.fact])) ?? 0) + 1);
    const singles = opts.filter((o) => counts.get(String(o.facts[r.fact])) === 1);
    // exactly one option differs and all the others agree
    return singles.length === 1 && counts.size === 2 ? singles[0]!.id : null;
  }
  // compare: a ? b
  const symbol = r.a < r.b ? '<' : r.a > r.b ? '>' : '=';
  const hits = opts.filter((o) => o.facts.symbol === symbol);
  return hits.length === 1 ? hits[0]!.id : null;
}

export function expectedResponse(q: MathsQuestion): AnswerResponse {
  switch (q.kind) {
    case 'count': {
      const total = q.groups.reduce((s, n) => s + n, 0);
      return { type: 'number', value: q.variant === 'takeaway' ? total - q.leaving : total };
    }
    case 'feed':
      return { type: 'number', value: q.parts.reduce((s, n) => s + n, 0) };
    case 'balloon':
    case 'treasure':
    case 'catch':
      return { type: 'number', value: solveTask(q.task) };
    case 'train': {
      if (q.variant === 'order') {
        const sorted = [...q.tiles].sort((a, b) => (q.direction === 'asc' ? a - b : b - a));
        return { type: 'sequence', value: sorted };
      }
      return { type: 'sequence', value: q.missing.map((i) => q.start + q.step * i) };
    }
    case 'pizza': {
      const placed: Record<string, number> = {};
      for (const t of q.toppings) placed[t.type] = t.count;
      return { type: 'pizza', placed, total: q.toppings.reduce((s, t) => s + t.count, 0) };
    }
    case 'shapes': {
      const ids = q.items.filter((i) => i.shape === q.target).map((i) => i.id);
      return q.variant === 'pick-one' ? { type: 'choice', value: ids[0] ?? '' } : { type: 'set', value: ids.sort() };
    }
    case 'pattern': {
      if (q.patternType === 'number') return { type: 'choice', value: String(q.start + q.step * q.blankIndex) };
      return { type: 'choice', value: q.unit[q.blankIndex % q.unit.length]! };
    }
    case 'shop':
      return { type: 'number', value: q.variant === 'spend' ? q.have - q.amount : q.have + q.amount };
    case 'numberline':
      return { type: 'number', value: q.direction === 'forward' ? q.start + q.jumps : q.start - q.jumps };
    case 'tower': {
      if (q.variant === 'build') return { type: 'number', value: q.target };
      const leftWins = q.ask === 'taller' || q.ask === 'more' ? q.left > q.right : q.left < q.right;
      return { type: 'choice', value: leftWins ? 'left' : 'right' };
    }
    case 'choose':
      return { type: 'choice', value: solveChoose(q) ?? '' };
  }
}

export function responsesEqual(a: AnswerResponse, b: AnswerResponse): boolean {
  if (a.type !== b.type) return false;
  switch (a.type) {
    case 'number':
      return a.value === (b as typeof a).value;
    case 'choice':
      return a.value === (b as typeof a).value;
    case 'set': {
      const x = [...new Set(a.value)].sort();
      const y = [...new Set((b as typeof a).value)].sort();
      return x.length === y.length && x.every((v, i) => v === y[i]);
    }
    case 'sequence': {
      const y = (b as typeof a).value;
      return a.value.length === y.length && a.value.every((v, i) => v === y[i]);
    }
    case 'pizza': {
      const bb = b as typeof a;
      if (a.total !== bb.total) return false;
      const keys = new Set([...Object.keys(a.placed), ...Object.keys(bb.placed)]);
      for (const k of keys) if ((a.placed[k] ?? 0) !== (bb.placed[k] ?? 0)) return false;
      return true;
    }
  }
}

export function checkAnswer(q: MathsQuestion, r: AnswerResponse): boolean {
  return responsesEqual(expectedResponse(q), r);
}

// ---------------------------------------------------------------- human-readable descriptions (parent review)

function chooseLabel(q: ChooseQuestion, id: string): string {
  const o = q.options.find((x) => x.id === id);
  if (!o) return '—';
  const v = o.visual;
  switch (v.type) {
    case 'number':
      return String(v.n);
    case 'symbol':
      return v.symbol;
    case 'group':
      return `${v.count} ${v.emoji}`;
    case 'sized':
      return `${v.emoji} (size ${v.size})`;
    case 'bar':
      return `${v.emoji} ${v.length} long`;
    case 'emoji':
      return `${v.emoji} ${v.label}`;
  }
}

export function describeResponse(q: MathsQuestion, r: AnswerResponse): string {
  switch (r.type) {
    case 'number':
      return String(r.value);
    case 'sequence':
      return r.value.join(', ');
    case 'set': {
      if (q.kind !== 'shapes') return r.value.join(', ');
      const picked = q.items.filter((i) => r.value.includes(i.id));
      const right = picked.filter((i) => i.shape === q.target).length;
      return `${picked.length} picked (${right} ${q.target}${right === 1 ? '' : 's'})`;
    }
    case 'pizza':
      return `${Object.entries(r.placed)
        .filter(([, n]) => n > 0)
        .map(([k, n]) => `${n} ${TOPPING_INFO[k]?.emoji ?? k}`)
        .join(' + ')} → said ${r.total}`;
    case 'choice': {
      if (q.kind === 'choose') return chooseLabel(q, r.value);
      if (q.kind === 'shapes') return q.items.find((i) => i.id === r.value)?.shape ?? r.value;
      if (q.kind === 'pattern') return q.tokenSet === 'numbers' ? r.value : tokenInfo(q.tokenSet, r.value).label;
      return r.value;
    }
  }
}

export function describeAnswer(q: MathsQuestion): string {
  return describeResponse(q, expectedResponse(q));
}

/** A one-line description of the question for the parent's review screen. */
export function describeQuestion(q: MathsQuestion): string {
  switch (q.kind) {
    case 'count': {
      const c = creature(q.creature);
      if (q.variant === 'together') return `${q.groups[0]} + ${q.groups[1]} ${c.many} (count together)`;
      if (q.variant === 'takeaway') return `${q.groups[0]} ${c.many}, ${q.leaving} leave`;
      return `Count ${q.groups[0]} ${c.many}`;
    }
    case 'feed':
      return q.variant === 'parts' ? `Feed ${q.parts[0]} + ${q.parts[1]} ${food(q.food).many}` : `Feed ${q.parts[0]} ${food(q.food).many}`;
    case 'shop':
      return q.variant === 'spend' ? `${q.have} coins − ${q.amount} for a ${shopItem(q.item).name}` : `${q.have} coins + ${q.amount} more`;
    case 'numberline':
      return `Number line: ${q.start} ${q.direction === 'forward' ? '+' : '−'} ${q.jumps}`;
    case 'tower':
      return q.variant === 'build' ? `Build a tower of ${q.target}` : `Towers ${q.left} vs ${q.right}: ${q.ask}?`;
    case 'train':
      return q.variant === 'order'
        ? `Order ${q.tiles.join(', ')} (${q.direction === 'asc' ? 'smallest first' : 'biggest first'})`
        : `Sequence ${q.cars.map((c, i) => (q.missing.includes(i) ? '_' : c)).join(', ')}`;
    case 'pattern':
      return `Pattern ${q.sequence.map((s, i) => (i === q.blankIndex ? '?' : q.tokenSet === 'numbers' ? s : tokenInfo(q.tokenSet, s).label)).join(' ')}`;
    case 'shapes':
      return q.variant === 'pick-one' ? `Pick the ${q.target}` : `Find all ${q.target}s`;
    case 'pizza':
      return `Pizza: ${q.toppings.map((t) => `${t.count} ${TOPPING_INFO[t.type]!.many}`).join(' + ')}`;
    case 'choose':
      return q.prompt;
    default:
      return q.prompt;
  }
}
