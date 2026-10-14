/** Interactive-game state machines: no double counting, removals, bounds. */
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { addTopping, clearSlot, emptySlots, frogJump, frogStart, jumpsMade, placeItem, placeTile, placedCount, removeItem, removeTopping, slotsFilled, slotsResponse, tapCount, toggleSelect, toppingCounts } from '../../src/games/logic';

describe('monster feeding / coins (placeItem)', () => {
  it('dropping the same apple twice counts once', () => {
    let s = { placed: [] as string[] };
    s = placeItem(s, 'a1');
    s = placeItem(s, 'a1');
    s = placeItem(s, 'a2');
    expect(placedCount(s)).toBe(2);
  });
  it('taking an apple back updates the quantity', () => {
    let s = placeItem(placeItem({ placed: [] }, 'a1'), 'a2');
    s = removeItem(s, 'a1');
    expect(placedCount(s)).toBe(1);
    expect(removeItem(s, 'zzz')).toBe(s);
  });
  it('any sequence of feeds and removals equals the number of distinct apples inside (property)', () => {
    fc.assert(
      fc.property(fc.array(fc.tuple(fc.boolean(), fc.integer({ min: 0, max: 9 })), { maxLength: 60 }), (ops) => {
        let s = { placed: [] as string[] };
        const model = new Set<number>();
        for (const [add, i] of ops) {
          if (add) {
            s = placeItem(s, `a${i}`);
            model.add(i);
          } else {
            s = removeItem(s, `a${i}`);
            model.delete(i);
          }
        }
        return placedCount(s) === model.size && s.placed.length === model.size;
      }),
    );
  });
});

describe('pizza toppings', () => {
  it('counts by type and supports removing', () => {
    let p = { toppings: [] as { id: string; type: string; slot: number }[], nextId: 0 };
    p = addTopping(p, 'mushroom');
    p = addTopping(p, 'mushroom');
    p = addTopping(p, 'tomato');
    expect(toppingCounts(p)).toEqual({ mushroom: 2, tomato: 1 });
    p = removeTopping(p, p.toppings[0]!.id);
    expect(toppingCounts(p)).toEqual({ mushroom: 1, tomato: 1 });
    // freed slot is reused, no overlaps
    p = addTopping(p, 'olive');
    expect(new Set(p.toppings.map((t) => t.slot)).size).toBe(p.toppings.length);
  });
  it('never exceeds the number of spots on the pizza', () => {
    let p = { toppings: [] as { id: string; type: string; slot: number }[], nextId: 0 };
    for (let i = 0; i < 30; i++) p = addTopping(p, 'olive');
    expect(p.toppings.length).toBe(14);
  });
});

describe('number train slots', () => {
  it('a tile can only sit in one carriage', () => {
    let s = emptySlots([1, 3]);
    s = placeTile(s, 5);
    s = placeTile(s, 5);
    expect(Object.values(s).filter((v) => v === 5)).toHaveLength(1);
    expect(slotsFilled(s)).toBe(false);
    s = placeTile(s, 7, 3);
    expect(slotsResponse(s, [1, 3])).toEqual([5, 7]);
    s = clearSlot(s, 1);
    expect(slotsFilled(s)).toBe(false);
    expect(placeTile(s, 9, 0)).toEqual({ 1: 9, 3: 7 }); // slot 0 is not empty-able → first empty slot
  });
});

describe('frog jumps', () => {
  it('every jump moves exactly one space and stays on the line', () => {
    let f = frogStart(3);
    f = frogJump(f, 1, 0, 10);
    f = frogJump(f, 1, 0, 10);
    expect(f.pos).toBe(5);
    expect(jumpsMade(f)).toBe(2);
    let g = frogStart(1);
    g = frogJump(g, -1, 0, 10);
    g = frogJump(g, -1, 0, 10);
    expect(g.pos).toBe(0);
    expect(jumpsMade(g)).toBe(1);
  });
});

describe('counting taps and selections', () => {
  it('tapping a counted animal again does not count it twice', () => {
    expect(tapCount(tapCount(tapCount([], 2), 2), 4)).toEqual([2, 4]);
  });
  it('toggle selection', () => {
    expect(toggleSelect(toggleSelect(['a'], 'b'), 'a')).toEqual(['b']);
  });
});
