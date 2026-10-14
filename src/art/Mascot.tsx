/** Ollie the Owl — the friendly learning companion. Pure SVG + CSS animation. */
import { useEffect, type ReactNode } from "react";
import { speak } from "../app/speech";
export type MascotMood = 'idle' | 'happy' | 'think' | 'cheer' | 'wave';

export function Mascot({ mood = 'idle', size = 140, className = '' }: { mood?: MascotMood; size?: number; className?: string }) {
  const bodyAnim = mood === 'cheer' || mood === 'happy' ? 'hop 0.7s ease-in-out 2' : 'bob 3.2s ease-in-out infinite';
  const wingAnim = mood === 'wave' || mood === 'cheer' ? 'flap 0.35s ease-in-out 6' : 'none';
  return (
    <svg viewBox="0 0 160 170" width={size} height={size * 1.06} className={className} role="img" aria-label="Ollie the owl">
      <g style={{ animation: bodyAnim, transformOrigin: '80px 160px' }}>
        {/* feet */}
        <ellipse cx="62" cy="160" rx="12" ry="6" fill="#f59e0b" />
        <ellipse cx="98" cy="160" rx="12" ry="6" fill="#f59e0b" />
        {/* left wing */}
        <path d="M30 95 C10 105 12 135 34 145 C40 125 40 108 30 95Z" fill="#7c3aed" style={{ animation: wingAnim, transformOrigin: '34px 100px' }} />
        {/* right wing (waves) */}
        <path d="M130 95 C150 105 148 135 126 145 C120 125 120 108 130 95Z" fill="#7c3aed" style={{ animation: wingAnim, transformOrigin: '126px 100px' }} />
        {/* body */}
        <ellipse cx="80" cy="105" rx="52" ry="56" fill="#8b5cf6" />
        <ellipse cx="80" cy="120" rx="34" ry="36" fill="#ede9fe" />
        {/* belly feathers */}
        <path d="M64 112 q6 6 12 0 M84 112 q6 6 12 0 M72 126 q6 6 12 0" stroke="#c4b5fd" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* ear tufts */}
        <path d="M38 62 L46 30 L62 54Z" fill="#7c3aed" />
        <path d="M122 62 L114 30 L98 54Z" fill="#7c3aed" />
        {/* face */}
        <circle cx="58" cy="76" r="22" fill="white" />
        <circle cx="102" cy="76" r="22" fill="white" />
        <g style={{ animation: 'blink 4.5s infinite', transformOrigin: '80px 76px' }}>
          {mood === 'happy' || mood === 'cheer' ? (
            <>
              <path d="M46 80 q12 -14 24 0" stroke="#1e293b" strokeWidth="5" fill="none" strokeLinecap="round" />
              <path d="M90 80 q12 -14 24 0" stroke="#1e293b" strokeWidth="5" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx={mood === 'think' ? 63 : 60} cy={mood === 'think' ? 71 : 78} r="10" fill="#1e293b" />
              <circle cx={mood === 'think' ? 107 : 104} cy={mood === 'think' ? 71 : 78} r="10" fill="#1e293b" />
              <circle cx={mood === 'think' ? 66 : 63} cy={mood === 'think' ? 68 : 75} r="3.5" fill="white" />
              <circle cx={mood === 'think' ? 110 : 107} cy={mood === 'think' ? 68 : 75} r="3.5" fill="white" />
            </>
          )}
        </g>
        {/* cheeks */}
        <circle cx="42" cy="96" r="7" fill="#f9a8d4" opacity="0.8" />
        <circle cx="118" cy="96" r="7" fill="#f9a8d4" opacity="0.8" />
        {/* beak */}
        <path d={mood === 'cheer' || mood === 'happy' ? 'M72 92 L88 92 L80 106Z' : 'M73 92 L87 92 L80 102Z'} fill="#f59e0b" />
        {/* graduation-free cute hat: a little leaf */}
        <path d="M80 48 C70 38 74 26 86 24 C88 36 86 44 80 48Z" fill="#22c55e" />
      </g>
    </svg>
  );
}

/**
 * Ollie's speech bubble. Children can't read yet, so any bubble given `say` shows a big 🔊 button
 * to hear it again, and `autoSay` speaks it once when it appears.
 */
export function SpeechBubble({ children, className = '', say, autoSay = false }: { children: ReactNode; className?: string; say?: string; autoSay?: boolean }) {
  useEffect(() => {
    if (autoSay && say) speak(say);
  }, [autoSay, say]);
  return (
    <div className={`relative rounded-[26px] bg-white px-5 py-3 text-xl font-semibold text-slate-800 shadow-[0_5px_0_rgba(0,0,0,0.08)] ${say ? 'flex items-center gap-3' : ''} ${className}`} role="status" aria-live="polite">
      {say && (
        <button
          type="button"
          onClick={() => speak(say)}
          aria-label="Hear it again"
          title="Hear it again"
          data-testid="bubble-say-again"
          className="btn3d btn-blue flex h-12 w-12 shrink-0 items-center justify-center text-2xl"
        >
          🔊
        </button>
      )}
      {say ? <span>{children}</span> : children}
      <span className="absolute -left-3 bottom-5 h-6 w-6 rotate-45 bg-white" aria-hidden />
    </div>
  );
}
