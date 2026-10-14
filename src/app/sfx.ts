/**
 * Tiny synthesised sound effects (Web Audio) — no audio files, works offline.
 * The AudioContext is only created on the first sound, which always follows a click,
 * so nothing ever plays before the child interacts.
 */
export type SfxName = 'tap' | 'pop' | 'correct' | 'gentle' | 'munch' | 'cheer' | 'coin' | 'jump' | 'toot' | 'whoosh' | 'unlock' | 'count';

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

function audio(): AudioContext | null {
  if (!enabled) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.18, slideTo?: number) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + start;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(start: number, dur: number, vol = 0.12) {
  const a = audio();
  if (!a) return;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  const gain = a.createGain();
  gain.gain.value = vol;
  src.buffer = buf;
  src.connect(gain).connect(a.destination);
  src.start(a.currentTime + start);
}

export function sfx(name: SfxName) {
  if (!enabled) return;
  switch (name) {
    case 'tap':
      tone(660, 0, 0.07, 'triangle', 0.1);
      break;
    case 'count':
      tone(880, 0, 0.09, 'triangle', 0.12);
      break;
    case 'pop':
      noise(0, 0.08, 0.2);
      tone(900, 0, 0.08, 'square', 0.05, 300);
      break;
    case 'correct':
      tone(660, 0, 0.12, 'triangle');
      tone(880, 0.1, 0.12, 'triangle');
      tone(1320, 0.2, 0.22, 'triangle');
      break;
    case 'gentle':
      tone(440, 0, 0.15, 'sine', 0.1);
      tone(392, 0.13, 0.2, 'sine', 0.1);
      break;
    case 'munch':
      noise(0, 0.05, 0.15);
      noise(0.09, 0.05, 0.15);
      tone(220, 0, 0.15, 'sawtooth', 0.04, 160);
      break;
    case 'cheer':
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.08, 0.25, 'triangle', 0.14));
      break;
    case 'coin':
      tone(988, 0, 0.07, 'square', 0.06);
      tone(1319, 0.07, 0.15, 'square', 0.06);
      break;
    case 'jump':
      tone(300, 0, 0.2, 'sine', 0.15, 700);
      break;
    case 'toot':
      tone(392, 0, 0.25, 'sawtooth', 0.06);
      tone(523, 0.28, 0.35, 'sawtooth', 0.06);
      break;
    case 'whoosh':
      noise(0, 0.25, 0.08);
      break;
    case 'unlock':
      tone(523, 0, 0.1, 'triangle');
      tone(784, 0.1, 0.1, 'triangle');
      tone(1047, 0.2, 0.3, 'triangle');
      break;
  }
}
