/**
 * Strongly-typed question schemas for every Maths activity.
 * These are pure data — no React. The presentation layer renders them; the engine validates them.
 */
import type { Level, QuestionBase } from '../../core/types';

export const MATHS_TOPICS = [
  'counting',
  'numbers',
  'addition',
  'subtraction',
  'comparison',
  'shapes',
  'patterns',
  'reasoning',
  'measurement',
] as const;
export type MathsTopic = (typeof MATHS_TOPICS)[number];

export const GAME_KINDS = [
  'count',
  'feed',
  'balloon',
  'train',
  'treasure',
  'pizza',
  'shapes',
  'catch',
  'pattern',
  'shop',
  'numberline',
  'tower',
  'choose',
] as const;
export type GameKind = (typeof GAME_KINDS)[number];

/** A small arithmetic / number-sense task, shared by Balloon Pop, Catch and Treasure. */
export type NumberTask =
  | { type: 'identify'; n: number }
  | { type: 'after'; n: number }
  | { type: 'before'; n: number }
  | { type: 'between'; low: number; high: number }
  | { type: 'add'; a: number; b: number }
  | { type: 'sub'; a: number; b: number };

interface MQ extends QuestionBase {
  subject: 'maths';
  topic: MathsTopic;
  level: Level;
}

// ---------- Game 1: Count the Animals ----------
export interface Placement {
  x: number; // 0..100 (% of scene width)
  y: number; // 0..100 (% of scene height)
  scale: number;
  flip: boolean;
}
export interface CountQuestion extends MQ {
  kind: 'count';
  /** 'count': count all; 'together': two groups added; 'takeaway': some leave, count who stays */
  variant: 'count' | 'together' | 'takeaway';
  creature: string; // key into the creature catalogue
  /** creatures shown at start (for 'together' = group a + group b) */
  groups: number[];
  /** for 'takeaway': how many leave */
  leaving: number;
  placements: Placement[];
  moving: boolean;
  options: number[];
}

// ---------- Game 2: Feed the Hungry Monster ----------
export interface FeedQuestion extends MQ {
  kind: 'feed';
  food: string;
  /** 'exact': feed N; 'parts': feed a then b more (addition) */
  variant: 'exact' | 'parts';
  parts: number[]; // [target] or [a, b]
  supply: number; // how many food items are available (> target)
}

// ---------- Game 3: Balloon Pop ----------
export interface BalloonQuestion extends MQ {
  kind: 'balloon';
  task: NumberTask;
  options: number[];
}

// ---------- Game 4: Number Train ----------
export interface TrainQuestion extends MQ {
  kind: 'train';
  /** 'sequence': arithmetic sequence with gaps; 'order': put given numbers in order */
  variant: 'sequence' | 'order';
  /** the complete, correct carriage numbers */
  cars: number[];
  /** sequence: start + step*i. step may be negative (counting back) */
  start: number;
  step: number;
  direction: 'asc' | 'desc';
  /** indices of carriages that are empty */
  missing: number[];
  /** number tiles the child can place (unique) */
  tiles: number[];
}

// ---------- Game 5: Treasure Chest (also used by the Treasure Hunt adventure) ----------
export interface TreasureQuestion extends MQ {
  kind: 'treasure';
  task: NumberTask;
  keys: number[];
}

// ---------- Game 6: Pizza Maths ----------
export const TOPPINGS = ['mushroom', 'tomato', 'olive', 'pepper'] as const;
export type Topping = (typeof TOPPINGS)[number];
export interface PizzaQuestion extends MQ {
  kind: 'pizza';
  toppings: { type: Topping; count: number }[];
  options: number[];
}

// ---------- Game 7: Shape Detective ----------
export const SHAPES = ['circle', 'square', 'triangle', 'rectangle', 'oval', 'star'] as const;
export type ShapeName = (typeof SHAPES)[number];
export interface SceneShape {
  id: string;
  shape: ShapeName;
  color: string;
  /** centre, in scene units (scene is 400 x 260) */
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  /** what the shape is in the picture, e.g. 'wheel', 'roof' */
  role: string;
}
export interface ShapesQuestion extends MQ {
  kind: 'shapes';
  variant: 'find-all' | 'pick-one';
  target: ShapeName;
  /** find-all: the scene; pick-one: one shape per option */
  items: SceneShape[];
}

// ---------- Game 8: Catch the Number ----------
export interface CatchItem {
  id: string;
  value: number;
  lane: number; // 0..lanes-1
  delay: number; // seconds of animation offset
}
export interface CatchQuestion extends MQ {
  kind: 'catch';
  task: NumberTask;
  items: CatchItem[];
}

// ---------- Game 9: Complete the Pattern ----------
export type PatternType = 'AB' | 'AAB' | 'ABB' | 'ABC' | 'AABB' | 'number';
export type TokenSet = 'colours' | 'fruits' | 'animals' | 'shapes' | 'numbers';
export interface PatternQuestion extends MQ {
  kind: 'pattern';
  patternType: PatternType;
  tokenSet: TokenSet;
  /** repeating unit for token patterns (token ids). Empty for number patterns. */
  unit: string[];
  /** for number patterns */
  start: number;
  step: number;
  /** full sequence including the blank position (token ids, or numbers as strings) */
  sequence: string[];
  blankIndex: number;
  options: string[];
}

// ---------- Game 10: Shopping Adventure ----------
export interface ShopQuestion extends MQ {
  kind: 'shop';
  /** 'spend': have - cost; 'earn': have + gift */
  variant: 'spend' | 'earn';
  have: number;
  amount: number; // cost (spend) or gift (earn)
  item: string;
  options: number[];
}

// ---------- Game 11: Number Line Jumping ----------
export interface NumberLineQuestion extends MQ {
  kind: 'numberline';
  start: number;
  jumps: number;
  direction: 'forward' | 'back';
  min: number;
  max: number;
}

// ---------- Game 12: Build the Tower ----------
export interface TowerQuestion extends MQ {
  kind: 'tower';
  variant: 'build' | 'compare';
  /** build: target height */
  target: number;
  /** compare: block counts of left/right tower */
  left: number;
  right: number;
  ask: 'taller' | 'shorter' | 'more' | 'fewer';
}

// ---------- Game 13: Look & Choose (comparison, measurement, reasoning, time) ----------
export type ChooseVariant =
  | 'more-group'
  | 'compare-numbers'
  | 'symbol'
  | 'size'
  | 'height'
  | 'length'
  | 'weight'
  | 'measure'
  | 'day-night'
  | 'routine'
  | 'odd-one-out'
  | 'position';
export type ChooseVisual =
  | { type: 'number'; n: number }
  | { type: 'symbol'; symbol: '<' | '>' | '=' }
  | { type: 'group'; emoji: string; count: number }
  | { type: 'sized'; emoji: string; size: number } // size in % (40..100)
  | { type: 'bar'; emoji: string; length: number; color: string } // length in units (blocks)
  | { type: 'emoji'; emoji: string; label: string };
export interface ChooseOption {
  id: string;
  visual: ChooseVisual;
  /** facts used by the validator, e.g. { night: 1 } or { order: 2 } or { category: 'fruit' } */
  facts: Record<string, string | number>;
}
export interface ChooseQuestion extends MQ {
  kind: 'choose';
  variant: ChooseVariant;
  /** what to choose: 'max' | 'min' of a fact, or 'match' a fact value, or 'odd' */
  rule:
    | { type: 'max'; fact: string }
    | { type: 'min'; fact: string }
    | { type: 'match'; fact: string; value: string | number }
    | { type: 'odd'; fact: string }
    | { type: 'compare'; a: number; b: number };
  /** extra picture for the question, e.g. numbers either side of the crocodile, or the scene for position */
  scene?: { left?: number; right?: number; measureEmoji?: string; measureLength?: number; anchor?: string };
  options: ChooseOption[];
}

export type MathsQuestion =
  | CountQuestion
  | FeedQuestion
  | BalloonQuestion
  | TrainQuestion
  | TreasureQuestion
  | PizzaQuestion
  | ShapesQuestion
  | CatchQuestion
  | PatternQuestion
  | ShopQuestion
  | NumberLineQuestion
  | TowerQuestion
  | ChooseQuestion;

export type QuestionOfKind<K extends GameKind> = Extract<MathsQuestion, { kind: K }>;
