import { describe, expect, it } from 'vitest';
import { emptyState, type AppState } from '../../src/core/state';
import { CORRUPT_PREFIX, PREVIOUS_KEY, STORAGE_KEY, attemptsToCsv, exportBackup, importBackup, loadState, sanitizeState, saveState, type KeyValueStore } from '../../src/core/storage';
import { attempt, profile } from './helpers';

class MemStore implements KeyValueStore {
  m = new Map<string, string>();
  failNext = false;
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    if (this.failNext) {
      this.failNext = false;
      throw new Error('QuotaExceeded');
    }
    this.m.set(k, v);
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
}

function stateWithChild(): AppState {
  const p = profile();
  p.attempts.push(attempt('addition', 'first'));
  return { ...emptyState(), profiles: [p], activeProfileId: p.profile.id };
}

describe('local persistence', () => {
  it('save → load round-trips (re-opening the app keeps progress)', () => {
    const store = new MemStore();
    const s = stateWithChild();
    expect(saveState(s, store)).toBe(true);
    const loaded = loadState(store);
    expect(loaded.notice).toBeNull();
    expect(loaded.state.profiles[0]!.attempts).toHaveLength(1);
    expect(loaded.state.activeProfileId).toBe(s.activeProfileId);
  });
  it('first launch gives an empty state', () => {
    expect(loadState(new MemStore()).state.profiles).toEqual([]);
  });
  it('recovers from corrupted JSON using the previous good copy and quarantines the bad data', () => {
    const store = new MemStore();
    saveState(stateWithChild(), store);
    saveState(stateWithChild(), store); // previous copy now exists
    store.m.set(STORAGE_KEY, '{"profiles": [ broken');
    const r = loadState(store);
    expect(r.notice).toBe('recovered-from-previous');
    expect(r.state.profiles).toHaveLength(1);
    expect([...store.m.keys()].some((k) => k.startsWith(CORRUPT_PREFIX))).toBe(true);
  });
  it('starts fresh (without crashing) when nothing is recoverable', () => {
    const store = new MemStore();
    store.m.set(STORAGE_KEY, 'not json at all');
    const r = loadState(store);
    expect(r.notice).toBe('reset-corrupt');
    expect(r.state.profiles).toEqual([]);
  });
  it('repairs partially invalid data field by field', () => {
    const s = stateWithChild();
    const raw = JSON.parse(JSON.stringify(s));
    raw.profiles[0].attempts.push({ nonsense: true }, { topic: 'addition', outcome: 'banana' });
    raw.profiles[0].topics.maths.addition.level = 99;
    raw.profiles[0].settings.difficulty = 'ultra';
    raw.profiles.push({ broken: 1 });
    const r = sanitizeState(raw)!;
    expect(r.repaired).toBe(true);
    expect(r.state.profiles).toHaveLength(1);
    expect(r.state.profiles[0]!.attempts).toHaveLength(1);
    expect(r.state.profiles[0]!.topics.maths!.addition!.level).toBe(5);
    expect(r.state.profiles[0]!.settings.difficulty).toBe('standard');
  });
  it('older data moves to the Hindi voice once; a parent choosing English is respected', () => {
    const s = stateWithChild();
    const withLang = (v: number, lang: string) => {
      const raw = JSON.parse(JSON.stringify({ ...s, schemaVersion: v }));
      raw.profiles[0].settings.language = lang;
      return sanitizeState(raw)!.state.profiles[0]!.settings.language;
    };
    expect(withLang(1, 'en')).toBe('hindi');
    expect(withLang(2, 'hinglish')).toBe('hindi');
    expect(withLang(2, 'en')).toBe('en');
    expect(withLang(3, 'hinglish')).toBe('hinglish');
    expect(withLang(3, 'en')).toBe('en');
  });
  it('trims history and retries when storage is full', () => {
    const store = new MemStore();
    store.failNext = true;
    expect(saveState(stateWithChild(), store)).toBe(true);
    expect(store.m.has(STORAGE_KEY)).toBe(true);
    expect(store.m.has(PREVIOUS_KEY)).toBe(false);
  });
  it('backup export and restore', () => {
    const s = stateWithChild();
    const text = exportBackup(s);
    const back = importBackup(text);
    expect(back.profiles[0]!.profile.id).toBe(s.profiles[0]!.profile.id);
    expect(back.profiles[0]!.attempts).toEqual(s.profiles[0]!.attempts);
    expect(() => importBackup('{"hello":1}')).toThrow();
    expect(() => importBackup('garbage')).toThrow();
  });
  it('CSV export escapes commas and quotes', () => {
    const p = profile();
    p.attempts.push(attempt('addition', 'first', 1, { question: 'Count 3, then "more"' }));
    const csv = attemptsToCsv(p);
    expect(csv.split('\n')).toHaveLength(2);
    expect(csv).toContain('"Count 3, then ""more"""');
  });
  it('works through the real browser localStorage too', () => {
    const s = stateWithChild();
    expect(saveState(s)).toBe(true);
    expect(loadState().state.profiles[0]!.profile.name).toBe('Test');
  });
});
