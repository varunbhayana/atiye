/**
 * Age-5 (UKG / Kindergarten) Maths curriculum.
 * Levels 1–3 are age-appropriate; levels 4–5 are "advanced" and only appear when a parent enables them.
 */
import type { ActivityDef, Level, TopicDef } from '../../core/types';
import type { GameKind, MathsTopic, ShapeName } from './types';

export const MATHS_TOPIC_DEFS: (TopicDef & { id: MathsTopic; zone: string; zoneEmoji: string })[] = [
  {
    id: 'counting',
    name: 'Counting',
    emoji: '🐰',
    zone: 'Counting Forest',
    zoneEmoji: '🌳',
    description: 'Count objects, count forward and back, and skip-count.',
    levels: [
      'Count up to 5 things',
      'Count up to 10 things',
      'Count to 10 and count backwards',
      'Count up to 15, count backwards from 20',
      'Count up to 20 and skip-count by 2s, 5s, 10s',
    ],
  },
  {
    id: 'numbers',
    name: 'Numbers',
    emoji: '🔢',
    zone: 'Number Mountain',
    zoneEmoji: '⛰️',
    description: 'Recognise numbers, before and after, missing numbers.',
    levels: [
      'Numbers 0–10',
      'Before and after (to 10)',
      'Numbers 0–20, missing numbers',
      'Numbers to 30, numbers in between',
      'Numbers to 50, counting back',
    ],
  },
  {
    id: 'addition',
    name: 'Adding',
    emoji: '➕',
    zone: 'Addition Castle',
    zoneEmoji: '🏰',
    description: 'Put groups together and find how many altogether.',
    levels: ['Add within 5', 'Add within 7', 'Add within 10', 'Add within 15', 'Add within 20'],
  },
  {
    id: 'subtraction',
    name: 'Taking Away',
    emoji: '➖',
    zone: 'Subtraction Cave',
    zoneEmoji: '🦇',
    description: 'Take some away and find how many are left.',
    levels: ['Take away within 5', 'Take away within 7', 'Take away within 10', 'Take away within 15', 'Take away within 20'],
  },
  {
    id: 'comparison',
    name: 'More or Less',
    emoji: '⚖️',
    zone: 'Compare Lake',
    zoneEmoji: '🏞️',
    description: 'More and fewer, bigger and smaller numbers, ordering.',
    levels: [
      'More or fewer (to 5)',
      'Bigger or smaller numbers (to 10)',
      'Greater, less or equal; ordering 3 numbers',
      'Compare and order to 20',
      'Compare and order to 50',
    ],
  },
  {
    id: 'shapes',
    name: 'Shapes',
    emoji: '🔺',
    zone: 'Shape City',
    zoneEmoji: '🏙️',
    description: 'Circle, square, triangle, rectangle, oval and star.',
    levels: [
      'Circle, square, triangle',
      'Add rectangles',
      'Add ovals and stars',
      'Find every shape in busy pictures',
      'Shape expert',
    ],
  },
  {
    id: 'patterns',
    name: 'Patterns',
    emoji: '🌸',
    zone: 'Pattern Garden',
    zoneEmoji: '🌷',
    description: 'Colour, object, shape and number patterns.',
    levels: ['AB patterns', 'AAB and ABB patterns', 'ABC and AABB patterns', 'Number patterns (+1, +2)', 'Number patterns (+2, +5, +10, counting back)'],
  },
  {
    id: 'reasoning',
    name: 'Thinking',
    emoji: '🧩',
    zone: 'Puzzle Beach',
    zoneEmoji: '🏖️',
    description: 'Sorting, odd one out, size, tall and short, position.',
    levels: [
      'Big and small, odd one out',
      'Tall and short, long and short',
      'On, under, next to',
      'Biggest, tallest, longest of three',
      'Tricky odd one out',
    ],
  },
  {
    id: 'measurement',
    name: 'Measure & Time',
    emoji: '🕰️',
    zone: 'Time Meadow',
    zoneEmoji: '🌅',
    description: 'Longer and shorter, heavier and lighter, day and night, daily routine.',
    levels: [
      'Day and night, longer or shorter',
      'Heavier or lighter',
      'What comes first? Measure with blocks',
      'Longest of three, measure to 10',
      'Mixed measuring and time',
    ],
  },
];

export function topicDef(topic: string) {
  const t = MATHS_TOPIC_DEFS.find((d) => d.id === topic);
  if (!t) throw new Error(`Unknown maths topic: ${topic}`);
  return t;
}

/** Hard difficulty boundaries per level (index 0 = level 1). Validators enforce these. */
export const LIMITS = {
  countMax: [5, 10, 10, 15, 20],
  numberMax: [10, 10, 20, 30, 50],
  addMax: [5, 7, 10, 15, 20],
  subMax: [5, 7, 10, 15, 20],
  compareMax: [5, 10, 10, 20, 50],
  towerMax: [5, 8, 10, 10, 10],
} as const;

export function limit(name: keyof typeof LIMITS, level: Level): number {
  return LIMITS[name][level - 1]!;
}

export const SHAPES_BY_LEVEL: Record<Level, ShapeName[]> = {
  1: ['circle', 'square', 'triangle'],
  2: ['circle', 'square', 'triangle', 'rectangle'],
  3: ['circle', 'square', 'triangle', 'rectangle', 'oval', 'star'],
  4: ['circle', 'square', 'triangle', 'rectangle', 'oval', 'star'],
  5: ['circle', 'square', 'triangle', 'rectangle', 'oval', 'star'],
};

interface KindRule {
  kind: GameKind;
  from: Level;
  to?: Level;
  weight: number;
}

/** Which activity types can teach which topic, from which level. */
export const TOPIC_KINDS: Record<MathsTopic, KindRule[]> = {
  counting: [
    { kind: 'count', from: 1, weight: 3 },
    { kind: 'feed', from: 1, weight: 3 },
    { kind: 'tower', from: 1, weight: 2 },
    { kind: 'pizza', from: 1, to: 2, weight: 1 },
    { kind: 'train', from: 2, weight: 2 },
  ],
  numbers: [
    { kind: 'balloon', from: 1, weight: 3 },
    { kind: 'catch', from: 1, weight: 2 },
    { kind: 'train', from: 1, weight: 3 },
    { kind: 'treasure', from: 1, weight: 2 },
    { kind: 'count', from: 1, to: 2, weight: 1 },
    { kind: 'numberline', from: 2, weight: 1 },
  ],
  addition: [
    { kind: 'pizza', from: 1, weight: 3 },
    { kind: 'count', from: 1, weight: 2 },
    { kind: 'feed', from: 1, weight: 2 },
    { kind: 'balloon', from: 1, weight: 2 },
    { kind: 'numberline', from: 1, weight: 2 },
    { kind: 'treasure', from: 2, weight: 1 },
    { kind: 'shop', from: 2, weight: 2 },
    { kind: 'catch', from: 3, weight: 1 },
  ],
  subtraction: [
    { kind: 'count', from: 1, weight: 3 },
    { kind: 'shop', from: 1, weight: 3 },
    { kind: 'numberline', from: 1, weight: 2 },
    { kind: 'balloon', from: 1, weight: 2 },
    { kind: 'treasure', from: 2, weight: 1 },
    { kind: 'catch', from: 3, weight: 1 },
  ],
  comparison: [
    { kind: 'choose', from: 1, weight: 3 },
    { kind: 'tower', from: 1, weight: 2 },
    { kind: 'train', from: 2, weight: 2 },
  ],
  shapes: [{ kind: 'shapes', from: 1, weight: 1 }],
  patterns: [
    { kind: 'pattern', from: 1, weight: 3 },
    { kind: 'train', from: 4, weight: 1 },
  ],
  reasoning: [
    { kind: 'choose', from: 1, weight: 3 },
    { kind: 'tower', from: 1, weight: 1 },
  ],
  measurement: [{ kind: 'choose', from: 1, weight: 1 }],
};

export function kindRulesFor(topic: MathsTopic, level: Level): KindRule[] {
  return TOPIC_KINDS[topic].filter((r) => level >= r.from && (r.to === undefined || level <= r.to));
}

/** Concrete, hands-on activities: preferred when a child is finding a topic hard. */
export const CONCRETE_KINDS: ReadonlySet<GameKind> = new Set<GameKind>(['count', 'feed', 'pizza', 'tower', 'numberline', 'shop', 'shapes']);

export const MATHS_ACTIVITIES: (ActivityDef & { kind: GameKind })[] = [
  { kind: 'count', name: 'Count the Animals', emoji: '🐰', description: 'Tap each animal to count it.', topics: ['counting', 'numbers', 'addition', 'subtraction'], concrete: true, testable: true },
  { kind: 'feed', name: 'Feed the Monster', emoji: '👾', description: 'Drag the right number of treats to the hungry monster.', topics: ['counting', 'addition'], concrete: true, testable: true },
  { kind: 'balloon', name: 'Balloon Pop', emoji: '🎈', description: 'Pop the balloon with the right number.', topics: ['numbers', 'addition', 'subtraction'], concrete: false, testable: true },
  { kind: 'train', name: 'Number Train', emoji: '🚂', description: 'Fill the empty carriages.', topics: ['numbers', 'counting', 'comparison', 'patterns'], concrete: false, testable: true },
  { kind: 'treasure', name: 'Treasure Chest', emoji: '🗝️', description: 'Pick the right key to open the chest.', topics: ['numbers', 'addition', 'subtraction'], concrete: false, testable: true },
  { kind: 'pizza', name: 'Pizza Maths', emoji: '🍕', description: 'Put toppings on the pizza and count them.', topics: ['addition', 'counting'], concrete: true, testable: true },
  { kind: 'shapes', name: 'Shape Detective', emoji: '🔍', description: 'Find the shapes hiding in the picture.', topics: ['shapes'], concrete: true, testable: true },
  { kind: 'catch', name: 'Catch the Number', emoji: '⭐', description: 'Catch the floating number star.', topics: ['numbers', 'addition', 'subtraction'], concrete: false, testable: true },
  { kind: 'pattern', name: 'Pattern Puzzle', emoji: '🌈', description: 'What comes next in the pattern?', topics: ['patterns'], concrete: false, testable: true },
  { kind: 'shop', name: 'Toy Shop', emoji: '🛍️', description: 'Pay with coins and count what is left.', topics: ['subtraction', 'addition'], concrete: true, testable: true },
  { kind: 'numberline', name: 'Frog Jumps', emoji: '🐸', description: 'Help the frog hop along the number line.', topics: ['addition', 'subtraction', 'numbers'], concrete: true, testable: true },
  { kind: 'tower', name: 'Block Towers', emoji: '🧱', description: 'Build towers and compare them.', topics: ['counting', 'comparison', 'reasoning'], concrete: true, testable: true },
  { kind: 'choose', name: 'Look & Choose', emoji: '👀', description: 'Bigger, longer, heavier, day or night…', topics: ['comparison', 'reasoning', 'measurement'], concrete: false, testable: true },
];

export function activityDef(kind: string) {
  const a = MATHS_ACTIVITIES.find((x) => x.kind === kind);
  if (!a) throw new Error(`Unknown activity: ${kind}`);
  return a;
}
