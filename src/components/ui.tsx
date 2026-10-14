import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Mascot, SpeechBubble, type MascotMood } from '../art/Mascot';

export function Emoji({ children, size, className = '', label }: { children: ReactNode; size?: number; className?: string; label?: string }) {
  return (
    <span className={`emoji inline-block ${className}`} style={size ? { fontSize: size } : undefined} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {children}
    </span>
  );
}

export function ProgressDots({ total, current, results }: { total: number; current: number; results: ('good' | 'ok' | 'miss' | null)[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2" aria-label={`Question ${Math.min(current + 1, total)} of ${total}`}>
      {Array.from({ length: total }, (_, i) => {
        const r = results[i];
        const bg = r === 'good' ? '#22c55e' : r === 'ok' ? '#facc15' : r === 'miss' ? '#cbd5e1' : i === current ? '#3b82f6' : '#e2e8f0';
        return <span key={i} className="block rounded-full transition-all" style={{ width: i === current ? 28 : 16, height: 16, background: bg, boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.12)' }} />;
      })}
    </div>
  );
}

export function Modal({ children, onClose, label }: { children: ReactNode; onClose?: () => void; label: string }) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true" aria-label={label}>
      <div className="card anim-pop-in max-h-[92vh] w-full max-w-xl overflow-auto p-8">{children}</div>
    </div>
  );
}

/** Gentle confetti — slow, no flashing. */
export function Confetti({ pieces = 36 }: { pieces?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        left: (i * 37) % 100,
        delay: (i % 12) * 0.12,
        dur: 2.4 + (i % 5) * 0.35,
        color: ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'][i % 6],
        size: 8 + (i % 4) * 3,
        round: i % 3 === 0,
      })),
    [pieces],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {items.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 block"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 1.6,
            background: p.color,
            borderRadius: p.round ? '50%' : 3,
            animation: `confetti ${p.dur}s ease-in ${p.delay}s 1 both`,
          }}
        />
      ))}
    </div>
  );
}

export function MascotSays({ mood, children, size = 110 }: { mood: MascotMood; children: ReactNode; size?: number }) {
  return (
    <div className="flex items-end gap-4">
      <Mascot mood={mood} size={size} />
      <SpeechBubble className="mb-6 max-w-md">{children}</SpeechBubble>
    </div>
  );
}

export function StarCount({ stars }: { stars: number }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xl font-bold shadow" aria-label={`${stars} stars`}>
      <Emoji>⭐</Emoji>
      {stars}
    </div>
  );
}

export function useDelayedFlag(delayMs: number, deps: unknown[] = []): boolean {
  const [on, setOn] = useState(delayMs <= 0);
  useEffect(() => {
    if (delayMs <= 0) {
      setOn(true);
      return;
    }
    setOn(false);
    const t = window.setTimeout(() => setOn(true), delayMs);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return on;
}
