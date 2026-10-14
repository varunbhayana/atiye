/**
 * Friendly objects used by the Maths activities. Emoji render offline from the macOS system font.
 */
export interface Creature {
  key: string;
  emoji: string;
  one: string;
  many: string;
  place: string;
  scene: 'garden' | 'pond' | 'meadow' | 'sky';
  arrive: string; // verb for joining
  leave: string; // verb for leaving
}

export const CREATURES: Creature[] = [
  { key: 'rabbit', emoji: '🐰', one: 'rabbit', many: 'rabbits', place: 'in the garden', scene: 'garden', arrive: 'hop in', leave: 'hop away' },
  { key: 'duck', emoji: '🦆', one: 'duck', many: 'ducks', place: 'on the pond', scene: 'pond', arrive: 'swim over', leave: 'swim away' },
  { key: 'chick', emoji: '🐥', one: 'chick', many: 'chicks', place: 'in the meadow', scene: 'meadow', arrive: 'run in', leave: 'run home' },
  { key: 'bee', emoji: '🐝', one: 'bee', many: 'bees', place: 'in the sky', scene: 'sky', arrive: 'buzz in', leave: 'buzz away' },
  { key: 'ladybird', emoji: '🐞', one: 'ladybird', many: 'ladybirds', place: 'in the garden', scene: 'garden', arrive: 'crawl in', leave: 'fly away' },
  { key: 'fish', emoji: '🐟', one: 'fish', many: 'fish', place: 'in the pond', scene: 'pond', arrive: 'swim in', leave: 'swim away' },
  { key: 'frog', emoji: '🐸', one: 'frog', many: 'frogs', place: 'by the pond', scene: 'pond', arrive: 'jump in', leave: 'jump away' },
  { key: 'butterfly', emoji: '🦋', one: 'butterfly', many: 'butterflies', place: 'in the sky', scene: 'sky', arrive: 'flutter in', leave: 'flutter away' },
  { key: 'puppy', emoji: '🐶', one: 'puppy', many: 'puppies', place: 'in the meadow', scene: 'meadow', arrive: 'run in', leave: 'run home' },
  { key: 'turtle', emoji: '🐢', one: 'turtle', many: 'turtles', place: 'by the pond', scene: 'pond', arrive: 'crawl in', leave: 'crawl away' },
  { key: 'penguin', emoji: '🐧', one: 'penguin', many: 'penguins', place: 'on the ice', scene: 'meadow', arrive: 'waddle in', leave: 'waddle away' },
];

export function creature(key: string): Creature {
  const c = CREATURES.find((x) => x.key === key);
  if (!c) throw new Error(`Unknown creature ${key}`);
  return c;
}

export interface Food {
  key: string;
  emoji: string;
  one: string;
  many: string;
}
export const FOODS: Food[] = [
  { key: 'apple', emoji: '🍎', one: 'apple', many: 'apples' },
  { key: 'cookie', emoji: '🍪', one: 'cookie', many: 'cookies' },
  { key: 'strawberry', emoji: '🍓', one: 'strawberry', many: 'strawberries' },
  { key: 'banana', emoji: '🍌', one: 'banana', many: 'bananas' },
  { key: 'carrot', emoji: '🥕', one: 'carrot', many: 'carrots' },
  { key: 'cupcake', emoji: '🧁', one: 'cupcake', many: 'cupcakes' },
];
export function food(key: string): Food {
  const f = FOODS.find((x) => x.key === key);
  if (!f) throw new Error(`Unknown food ${key}`);
  return f;
}

export const TOPPING_INFO: Record<string, { emoji: string; one: string; many: string }> = {
  mushroom: { emoji: '🍄', one: 'mushroom', many: 'mushrooms' },
  tomato: { emoji: '🍅', one: 'tomato', many: 'tomatoes' },
  olive: { emoji: '🫒', one: 'olive', many: 'olives' },
  pepper: { emoji: '🫑', one: 'pepper', many: 'peppers' },
};

export const SHOP_ITEMS: { key: string; emoji: string; name: string }[] = [
  { key: 'teddy', emoji: '🧸', name: 'teddy bear' },
  { key: 'kite', emoji: '🪁', name: 'kite' },
  { key: 'car', emoji: '🚗', name: 'toy car' },
  { key: 'ball', emoji: '⚽', name: 'ball' },
  { key: 'dino', emoji: '🦖', name: 'dinosaur' },
  { key: 'yoyo', emoji: '🪀', name: 'yo-yo' },
  { key: 'crayons', emoji: '🖍️', name: 'crayon' },
  { key: 'balloon', emoji: '🎈', name: 'balloon' },
];
export function shopItem(key: string) {
  const s = SHOP_ITEMS.find((x) => x.key === key);
  if (!s) throw new Error(`Unknown shop item ${key}`);
  return s;
}

/** Pattern tokens. Colour and shape tokens are drawn as SVG; others as emoji. */
export const PATTERN_TOKENS: Record<'colours' | 'fruits' | 'animals' | 'shapes', { id: string; label: string; emoji?: string; color?: string; shape?: string }[]> = {
  colours: [
    { id: 'red', label: 'red', color: '#ef4444' },
    { id: 'blue', label: 'blue', color: '#3b82f6' },
    { id: 'yellow', label: 'yellow', color: '#facc15' },
    { id: 'green', label: 'green', color: '#22c55e' },
    { id: 'purple', label: 'purple', color: '#a855f7' },
  ],
  fruits: [
    { id: 'apple', label: 'apple', emoji: '🍎' },
    { id: 'banana', label: 'banana', emoji: '🍌' },
    { id: 'grapes', label: 'grapes', emoji: '🍇' },
    { id: 'orange', label: 'orange', emoji: '🍊' },
    { id: 'pear', label: 'pear', emoji: '🍐' },
  ],
  animals: [
    { id: 'dog', label: 'dog', emoji: '🐶' },
    { id: 'cat', label: 'cat', emoji: '🐱' },
    { id: 'rabbit', label: 'rabbit', emoji: '🐰' },
    { id: 'frog', label: 'frog', emoji: '🐸' },
    { id: 'chick', label: 'chick', emoji: '🐥' },
  ],
  shapes: [
    { id: 'circle', label: 'circle', shape: 'circle', color: '#f97316' },
    { id: 'square', label: 'square', shape: 'square', color: '#0ea5e9' },
    { id: 'triangle', label: 'triangle', shape: 'triangle', color: '#22c55e' },
    { id: 'star', label: 'star', shape: 'star', color: '#eab308' },
  ],
};

export function tokenInfo(set: string, id: string) {
  if (set === 'numbers') return { id, label: id };
  const list = PATTERN_TOKENS[set as keyof typeof PATTERN_TOKENS];
  const t = list?.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown token ${set}/${id}`);
  return t;
}

export const SIZE_OBJECTS = ['🐘', '🍎', '🐻', '🌳', '🎁', '🐢', '🚗', '⚽'];

/** Weight tiers — only objects ≥2 tiers apart are ever compared, so the answer is obvious. */
export const WEIGHT_OBJECTS: { emoji: string; label: string; tier: number }[] = [
  { emoji: '🪶', label: 'feather', tier: 1 },
  { emoji: '🍃', label: 'leaf', tier: 1 },
  { emoji: '🎈', label: 'balloon', tier: 1 },
  { emoji: '🍎', label: 'apple', tier: 2 },
  { emoji: '👟', label: 'shoe', tier: 2 },
  { emoji: '📘', label: 'book', tier: 2 },
  { emoji: '🐕', label: 'dog', tier: 3 },
  { emoji: '🧒', label: 'child', tier: 3 },
  { emoji: '🐘', label: 'elephant', tier: 4 },
  { emoji: '🚗', label: 'car', tier: 4 },
  { emoji: '🦛', label: 'hippo', tier: 4 },
];

export const DAY_THINGS: { emoji: string; label: string }[] = [
  { emoji: '☀️', label: 'the sun' },
  { emoji: '🌈', label: 'a rainbow' },
  { emoji: '🌻', label: 'an open sunflower' },
  { emoji: '🏫', label: 'going to school' },
];
export const NIGHT_THINGS: { emoji: string; label: string }[] = [
  { emoji: '🌙', label: 'the moon' },
  { emoji: '🌟', label: 'twinkling stars' },
  { emoji: '🦉', label: 'an owl awake' },
  { emoji: '😴', label: 'sleeping in bed' },
];

export const ROUTINES: { name: string; steps: { emoji: string; label: string }[] }[] = [
  {
    name: 'morning',
    steps: [
      { emoji: '🛏️', label: 'wake up' },
      { emoji: '🪥', label: 'brush teeth' },
      { emoji: '🥣', label: 'eat breakfast' },
      { emoji: '🎒', label: 'go to school' },
    ],
  },
  {
    name: 'bedtime',
    steps: [
      { emoji: '🛁', label: 'have a bath' },
      { emoji: '👕', label: 'put on pyjamas' },
      { emoji: '📖', label: 'read a story' },
      { emoji: '😴', label: 'go to sleep' },
    ],
  },
  {
    name: 'plant',
    steps: [
      { emoji: '🌰', label: 'seed' },
      { emoji: '🌱', label: 'sprout' },
      { emoji: '🌷', label: 'flower' },
    ],
  },
];

export const ODD_CATEGORIES: { category: string; items: string[] }[] = [
  { category: 'fruit', items: ['🍎', '🍌', '🍇', '🍐', '🍊'] },
  { category: 'animal', items: ['🐶', '🐱', '🐰', '🐮', '🐷'] },
  { category: 'vehicle', items: ['🚗', '🚌', '🚲', '✈️', '🚂'] },
  { category: 'clothes', items: ['👕', '👖', '🧦', '🧢', '👗'] },
  { category: 'weather', items: ['☀️', '🌧️', '❄️', '⛅'] },
];

export const POSITION_OBJECTS = ['🐱', '⚽', '🧸', '🐶', '🦆', '🍎'];
export const POSITION_ANCHORS: { emoji: string; name: string }[] = [
  { emoji: '📦', name: 'box' },
  { emoji: '🪑', name: 'chair' },
];
