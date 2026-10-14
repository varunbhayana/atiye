/**
 * Offline speech using the operating system's voices (Web Speech API).
 * We only use voices marked `localService` (on-device), so nothing is sent anywhere.
 * If no suitable voice exists, the app works silently with on-screen text.
 */
import { toHindiSpeech } from './devanagari';

let enabled = true;
let preferredName: string | null = null;
let cachedVoice: SpeechSynthesisVoice | null | undefined;
let language: 'en' | 'hinglish' | 'hindi' = 'hindi';
const RATES = { 'very-slow': 0.6, slow: 0.75, normal: 0.9 } as const;
let rate: number = RATES.slow;

/** Hinglish (Roman script) sounds most natural in an Indian-English voice. */
/** Hindi voices (macOS: Lekha). */
const PREFERRED_HINDI = ['Lekha', 'Kiyara', 'Google हिन्दी'];
const PREFERRED_HINGLISH = ['Tara', 'Veena', 'Rishi', 'Aman', 'Isha', 'Neel'];
const PREFERRED = ['Samantha', 'Karen', 'Moira', 'Tessa', 'Daniel', 'Rishi', 'Veena', 'Serena', 'Kate', 'Allison', 'Ava', 'Google UK English Female'];

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

export function setVoiceEnabled(on: boolean) {
  enabled = on;
  if (!on) stopSpeaking();
}

export function setPreferredVoice(name: string | null) {
  preferredName = name;
  cachedVoice = undefined;
}

export function setVoiceSpeed(speed: keyof typeof RATES) {
  rate = RATES[speed] ?? RATES.slow;
}

export function setSpeechLanguage(lang: 'en' | 'hinglish' | 'hindi') {
  if (lang !== language) cachedVoice = undefined;
  language = lang;
}

/** On-device English and Hindi voices (never network voices). */
export function localEnglishVoices(): SpeechSynthesisVoice[] {
  if (!speechSupported()) return [];
  return window.speechSynthesis.getVoices().filter((v) => v.localService && /^(en|hi)[-_]/i.test(v.lang));
}

function pickVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice !== undefined && cachedVoice !== null) return cachedVoice;
  const voices = localEnglishVoices();
  if (voices.length === 0) return (cachedVoice = null);
  const byName = (n: string) => voices.find((v) => v.name === n || v.name.startsWith(n + ' '));
  if (language === 'hindi') {
    const hindi = (preferredName ? byName(preferredName) : undefined) ?? PREFERRED_HINDI.map(byName).find(Boolean) ?? voices.find((v) => /^hi[-_]/i.test(v.lang));
    if (hindi) return (cachedVoice = hindi);
  }
  const english = voices.filter((v) => /^en[-_]/i.test(v.lang));
  const indian = language !== 'en' ? (PREFERRED_HINGLISH.map(byName).find(Boolean) ?? english.find((v) => /en[-_]IN/i.test(v.lang))) : undefined;
  const named = preferredName ? byName(preferredName) : undefined;
  cachedVoice = (named && /^en/i.test(named.lang) ? named : undefined) ?? indian ?? PREFERRED.map(byName).find(Boolean) ?? english.find((v) => /en[-_](GB|IN|AU|US)/i.test(v.lang)) ?? english[0] ?? null;
  return cachedVoice;
}

export function usingHindiVoice(): boolean {
  const v = pickVoice();
  return !!v && /^hi[-_]/i.test(v.lang);
}

export function hasOfflineVoice(): boolean {
  return pickVoice() !== null;
}

export function currentVoiceName(): string | null {
  return pickVoice()?.name ?? null;
}

if (speechSupported()) {
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    cachedVoice = undefined;
  });
}

/**
 * Splits text into sentences and gives each a tone, so the voice sounds like a friendly teacher:
 * exclamations ("Hurray!", "Shabaash!") are bright and excited, questions lift a little, the rest stays calm and clear.
 */
export function speechParts(text: string): { text: string; pitch: number; rate: number; volume: number }[] {
  const sentences = text.match(/[^!?.।]+[!?.।]*/g)?.map((s) => s.trim()).filter((s) => s.replace(/[!?.।,\s]/g, '').length > 0) ?? [];
  return sentences.map((s) => {
    if (s.endsWith('!')) return { text: s, pitch: 1.45, rate: 1.12, volume: 1 }; // excited!
    if (s.endsWith('?')) return { text: s, pitch: 1.2, rate: 1, volume: 1 };
    return { text: s, pitch: 1.08, rate: 1, volume: 0.95 };
  });
}

/**
 * Chrome's speech engine has known bugs: utterances that get garbage-collected never finish (the queue stalls),
 * a paused engine stays silent, and after long sessions it can get stuck. We keep references, resume first,
 * and a watchdog resets the engine and retries once if nothing starts.
 */
const live = new Set<SpeechSynthesisUtterance>();
let token = 0;
let watchdog: number | undefined;

function enqueue(parts: { text: string; pitch: number; rate: number; volume: number }[], voice: SpeechSynthesisVoice, myToken: number, retry: boolean) {
  let started = false;
  parts.forEach((part) => {
    const u = new SpeechSynthesisUtterance(part.text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = Math.min(1.2, rate * part.rate);
    u.pitch = part.pitch;
    u.volume = part.volume;
    u.onstart = () => {
      started = true;
    };
    u.onend = u.onerror = () => {
      live.delete(u);
    };
    live.add(u);
    window.speechSynthesis.speak(u);
  });
  window.clearTimeout(watchdog);
  watchdog = window.setTimeout(() => {
    if (started || myToken !== token) return;
    // nothing started: the engine is stuck — reset it and try once more
    try {
      window.speechSynthesis.cancel();
      live.clear();
      if (retry) window.setTimeout(() => myToken === token && enqueue(parts, voice, myToken, false), 120);
    } catch {
      /* ignore */
    }
  }, 1800);
}

export function speak(text: string, opts: { interrupt?: boolean } = {}) {
  if (!enabled || !speechSupported() || !text) return;
  const voice = pickVoice();
  if (!voice) return; // visual-only fallback
  try {
    const synth = window.speechSynthesis;
    const myToken = ++token;
    if (opts.interrupt !== false && (synth.speaking || synth.pending)) {
      synth.cancel();
      live.clear();
    }
    if (synth.paused) synth.resume();
    const hindiVoice = /^hi[-_]/i.test(voice.lang);
    const spoken = hindiVoice ? toHindiSpeech(text) : text.replace(/−/g, ' minus ').replace(/[🌟⭐✨]/gu, '');
    const parts = speechParts(spoken);
    // a short gap after cancel() avoids Chrome dropping the next utterance
    window.setTimeout(() => myToken === token && enqueue(parts, voice, myToken, true), 60);
  } catch {
    /* ignore speech errors */
  }
}

export function stopSpeaking() {
  if (!speechSupported()) return;
  try {
    token++;
    window.clearTimeout(watchdog);
    live.clear();
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}
