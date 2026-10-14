/**
 * Pure state machines behind the interactive games. Kept free of React so they can be unit-tested:
 * no double counting, removals update quantities, placements are unique, positions stay in range.
 */

// ---------------- generic "move items between places" (monster, pizza, coins, tower) ----------------
export interface Placed {
  /** ids currently placed in the target (e.g. monster tummy), in order of placement */
  placed: string[];
}

export function placeItem(s: Placed, id: string, max = Infinity): Placed {
  if (s.placed.includes(id)) return s; // the same object can never count twice
  if (s.placed.length >= max) return s;
  return { placed: [...s.placed, id] };
}

export function removeItem(s: Placed, id: string): Placed {
  if (!s.placed.includes(id)) return s;
  return { placed: s.placed.filter((x) => x !== id) };
}

export function placedCount(s: Placed): number {
  return new Set(s.placed).size;
}

// ---------------- pizza: toppings are typed ----------------
export interface PizzaState {
  /** topping instance id -> topping type */
  toppings: { id: string; type: string; slot: number }[];
  nextId: number;
}

export const PIZZA_SLOTS = 14;

export function addTopping(s: PizzaState, type: string): PizzaState {
  if (s.toppings.length >= PIZZA_SLOTS) return s;
  const used = new Set(s.toppings.map((t) => t.slot));
  let slot = 0;
  while (used.has(slot)) slot++;
  return { toppings: [...s.toppings, { id: `t${s.nextId}`, type, slot }], nextId: s.nextId + 1 };
}

export function removeTopping(s: PizzaState, id: string): PizzaState {
  if (!s.toppings.some((t) => t.id === id)) return s;
  return { ...s, toppings: s.toppings.filter((t) => t.id !== id) };
}

export function toppingCounts(s: PizzaState): Record<string, number> {
  const c: Record<string, number> = {};
  for (const t of s.toppings) c[t.type] = (c[t.type] ?? 0) + 1;
  return c;
}

// ---------------- number train ----------------
export type TrainSlots = Record<number, number | null>;

export function emptySlots(missing: number[]): TrainSlots {
  return Object.fromEntries(missing.map((i) => [i, null]));
}

/** Put a tile into a slot (or the first empty slot). A tile can only sit in one slot. */
export function placeTile(slots: TrainSlots, tile: number, slot?: number): TrainSlots {
  if (Object.values(slots).includes(tile)) return slots;
  const keys = Object.keys(slots)
    .map(Number)
    .sort((a, b) => a - b);
  const target = slot !== undefined && slot in slots ? slot : keys.find((k) => slots[k] === null);
  if (target === undefined) return slots;
  return { ...slots, [target]: tile };
}

export function clearSlot(slots: TrainSlots, slot: number): TrainSlots {
  if (!(slot in slots)) return slots;
  return { ...slots, [slot]: null };
}

export function slotsFilled(slots: TrainSlots): boolean {
  return Object.values(slots).every((v) => v !== null);
}

export function slotsResponse(slots: TrainSlots, missing: number[]): number[] {
  return missing.map((i) => slots[i] ?? -1);
}

// ---------------- number line frog ----------------
export interface FrogState {
  pos: number;
  path: number[];
}

export function frogStart(start: number): FrogState {
  return { pos: start, path: [start] };
}

export function frogJump(s: FrogState, dir: 1 | -1, min: number, max: number): FrogState {
  const pos = s.pos + dir;
  if (pos < min || pos > max) return s;
  return { pos, path: [...s.path, pos] };
}

export function jumpsMade(s: FrogState): number {
  return s.path.length - 1;
}

// ---------------- counting taps ----------------
/** Each creature can be counted once; returns the order in which they were tapped. */
export function tapCount(order: number[], index: number): number[] {
  return order.includes(index) ? order : [...order, index];
}

// ---------------- selection (shape detective) ----------------
export function toggleSelect(sel: string[], id: string): string[] {
  return sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id];
}
