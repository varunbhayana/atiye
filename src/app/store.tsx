/**
 * Application store: holds AppState, persists every change to localStorage, keeps
 * multiple windows in sync, and applies per-child settings (sound, voice, motion).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AppState, ProfileData } from '../core/state';
import { STORAGE_KEY, loadState, saveState, type LoadResult } from '../core/storage';
import { setSoundEnabled } from './sfx';
import { setPreferredVoice, setSpeechLanguage, setVoiceEnabled, setVoiceSpeed } from './speech';

interface StoreValue {
  state: AppState;
  notice: LoadResult['notice'];
  dismissNotice(): void;
  active: ProfileData | null;
  setState(fn: (s: AppState) => AppState): void;
  updateActive(fn: (p: ProfileData) => ProfileData): void;
  reducedMotion: boolean;
  instance: 'primary' | 'duplicate' | 'paused';
  takeOver(): void;
}

const StoreContext = createContext<StoreValue | null>(null);

function systemPrefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

const INSTANCE_ID = Math.random().toString(36).slice(2);

export function StoreProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => loadState(), []);
  const [state, setRaw] = useState<AppState>(initial.state);
  const [notice, setNotice] = useState<LoadResult['notice']>(initial.notice);
  const [systemReduce, setSystemReduce] = useState(systemPrefersReducedMotion);
  const [instance, setInstance] = useState<StoreValue['instance']>('primary');
  const stateRef = useRef(state);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const setState = useCallback((fn: (s: AppState) => AppState) => {
    const next = fn(stateRef.current);
    if (next === stateRef.current) return;
    stateRef.current = next;
    saveState(next);
    setRaw(next);
  }, []);

  const updateActive = useCallback(
    (fn: (p: ProfileData) => ProfileData) => {
      setState((s) => {
        const idx = s.profiles.findIndex((p) => p.profile.id === s.activeProfileId);
        if (idx < 0) return s;
        const updated = fn(s.profiles[idx]!);
        if (updated === s.profiles[idx]) return s;
        const profiles = s.profiles.slice();
        profiles[idx] = updated;
        return { ...s, profiles };
      });
    },
    [setState],
  );

  // another window saved → adopt its state so windows never overwrite each other's progress
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || e.newValue === null) return;
      const fresh = loadState().state;
      stateRef.current = fresh;
      setRaw(fresh);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // single active window: a newer window asks; the older one answers; the user chooses
  useEffect(() => {
    let ch: BroadcastChannel | null = null;
    try {
      ch = new BroadcastChannel('maths-adventure-instance');
    } catch {
      return;
    }
    channelRef.current = ch;
    ch.onmessage = (ev: MessageEvent<{ type: string; id: string }>) => {
      const m = ev.data;
      if (!m || m.id === INSTANCE_ID) return;
      if (m.type === 'hello') ch?.postMessage({ type: 'here', id: INSTANCE_ID });
      if (m.type === 'here') setInstance((cur) => (cur === 'primary' ? 'duplicate' : cur));
      if (m.type === 'takeover') setInstance('paused');
    };
    ch.postMessage({ type: 'hello', id: INSTANCE_ID });
    return () => {
      ch?.close();
      channelRef.current = null;
    };
  }, []);

  const takeOver = useCallback(() => {
    channelRef.current?.postMessage({ type: 'takeover', id: INSTANCE_ID });
    const fresh = loadState().state;
    stateRef.current = fresh;
    setRaw(fresh);
    setInstance('primary');
  }, []);

  useEffect(() => {
    try {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      const on = () => setSystemReduce(mq.matches);
      mq.addEventListener('change', on);
      return () => mq.removeEventListener('change', on);
    } catch {
      return;
    }
  }, []);

  const active = state.profiles.find((p) => p.profile.id === state.activeProfileId) ?? null;
  const motionSetting = active?.settings.reducedMotion ?? 'system';
  const reducedMotion = motionSetting === 'on' || (motionSetting === 'system' && systemReduce);

  useEffect(() => {
    document.documentElement.dataset.motion = reducedMotion ? 'reduce' : 'full';
  }, [reducedMotion]);

  useEffect(() => {
    setSoundEnabled(active?.settings.sound ?? true);
    setVoiceEnabled(active?.settings.voice ?? true);
    setSpeechLanguage(active?.settings.language ?? 'hindi');
    setVoiceSpeed(active?.settings.voiceSpeed ?? 'slow');
    setPreferredVoice(active?.settings.voiceName ?? null);
  }, [active?.settings.sound, active?.settings.voice, active?.settings.voiceName, active?.settings.language, active?.settings.voiceSpeed]);

  const value: StoreValue = {
    state,
    notice,
    dismissNotice: () => setNotice(null),
    active,
    setState,
    updateActive,
    reducedMotion,
    instance,
    takeOver,
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

/** Store access that tolerates being rendered outside the provider (e.g. isolated component tests). */
export function useOptionalStore(): StoreValue | null {
  return useContext(StoreContext);
}

export function useStore(): StoreValue {
  const v = useContext(StoreContext);
  if (!v) throw new Error('useStore outside provider');
  return v;
}

export function useActive(): ProfileData {
  const { active } = useStore();
  if (!active) throw new Error('No active profile');
  return active;
}
