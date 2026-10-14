/** Friendly, non-revealing hints. Used in practice only — never in tests. */
import { creature, food } from './catalog';
import type { MathsQuestion } from './types';

export function hintFor(q: MathsQuestion): string {
  switch (q.kind) {
    case 'count':
      if (q.variant === 'together') return `Count the first group, then keep counting the new ${creature(q.creature).many}.`;
      if (q.variant === 'takeaway') return `Count only the ${creature(q.creature).many} that stayed.`;
      return `Tap each ${creature(q.creature).one} once. Say the numbers as you tap!`;
    case 'feed':
      return `Count each ${food(q.food).one} as you feed it. Tap one in the tummy to take it back.`;
    case 'balloon':
    case 'treasure':
    case 'catch': {
      const t = q.task;
      if (t.type === 'add') return `Start at ${Math.max(t.a, t.b)} and count on ${Math.min(t.a, t.b)} more on your fingers.`;
      if (t.type === 'sub') return `Hold up ${t.a} fingers. Fold down ${t.b}. How many are still up?`;
      if (t.type === 'after') return `Count: …${t.n}, and then?`;
      if (t.type === 'before') return `Count up to ${t.n}. Which number did you say just before it?`;
      if (t.type === 'between') return `Count from ${t.low} to ${t.high}. Which number is in the middle?`;
      return `Look carefully for the number ${t.n}.`;
    }
    case 'train':
      if (q.variant === 'order') return q.direction === 'asc' ? 'Find the smallest number first.' : 'Find the biggest number first.';
      return Math.abs(q.step) > 1 ? `Each carriage goes ${q.step > 0 ? 'up' : 'down'} by ${Math.abs(q.step)}.` : q.step > 0 ? 'Each carriage is one more.' : 'Each carriage is one less.';
    case 'pizza':
      return 'Put on one topping at a time and count. Then count them all together.';
    case 'shapes':
      return q.target === 'triangle'
        ? 'A triangle has 3 sides and 3 corners.'
        : q.target === 'square'
          ? 'A square has 4 sides that are all the same length.'
          : q.target === 'rectangle'
            ? 'A rectangle has 4 sides: two long and two short.'
            : q.target === 'circle'
              ? 'A circle is perfectly round, like a wheel.'
              : q.target === 'oval'
                ? 'An oval is round but stretched, like an egg.'
                : 'A star has 5 points.';
    case 'pattern':
      return q.patternType === 'number' ? `The numbers change by ${Math.abs(q.step)} each time.` : 'Say the pattern out loud. What part repeats?';
    case 'shop':
      return q.variant === 'spend' ? 'Count the coins still in your purse.' : 'Count all the coins in your purse.';
    case 'numberline':
      return `Press jump ${q.jumps} ${q.jumps === 1 ? 'time' : 'times'}, counting each hop.`;
    case 'tower':
      return q.variant === 'build' ? 'Count the blocks in your tower.' : 'Count the blocks in each tower.';
    case 'choose':
      switch (q.variant) {
        case 'symbol':
          return 'The crocodile’s mouth opens towards the bigger number. If they are the same, use =.';
        case 'more-group':
          return 'Count each group.';
        case 'measure':
          return 'Count the blocks underneath, one by one.';
        case 'odd-one-out':
          return 'Which three are the same kind of thing?';
        case 'routine':
          return 'Think about your own day.';
        case 'weight':
          return 'Imagine picking each one up.';
        default:
          return 'Look carefully at each one.';
      }
  }
}
