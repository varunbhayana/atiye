/** Hand-drawn SVG props used by the mini-games. All lightweight, no external assets. */
import type { CSSProperties } from 'react';
import type { ShapeName } from '../subjects/maths/types';

export function Monster({ mouthOpen, happy, chewing, size = 240 }: { mouthOpen: boolean; happy: boolean; chewing: number; size?: number }) {
  return (
    <svg viewBox="0 0 220 230" width={size} height={size * 1.05} aria-hidden>
      <g style={{ animation: happy ? 'hop 0.7s ease-in-out 2' : 'bob 3.5s ease-in-out infinite', transformOrigin: '110px 220px' }}>
        <ellipse cx="110" cy="222" rx="70" ry="8" fill="rgba(0,0,0,0.12)" />
        {/* feet */}
        <ellipse cx="75" cy="210" rx="24" ry="13" fill="#0d9488" />
        <ellipse cx="145" cy="210" rx="24" ry="13" fill="#0d9488" />
        {/* fuzzy body */}
        <path d="M30 120 C30 50 70 22 110 22 C150 22 190 50 190 120 C190 175 160 205 110 205 C60 205 30 175 30 120Z" fill="#14b8a6" />
        <path d="M40 110 l-14 -8 l12 -4 M180 110 l14 -8 l-12 -4" stroke="#0d9488" strokeWidth="6" strokeLinecap="round" fill="none" />
        {/* horns */}
        <path d="M62 40 C55 20 62 8 72 6 C70 18 74 28 80 34Z" fill="#fbbf24" />
        <path d="M158 40 C165 20 158 8 148 6 C150 18 146 28 140 34Z" fill="#fbbf24" />
        {/* belly */}
        <ellipse cx="110" cy="160" rx="48" ry="34" fill="#5eead4" />
        {/* eyes */}
        <circle cx="82" cy="72" r="20" fill="white" />
        <circle cx="138" cy="72" r="20" fill="white" />
        <g style={{ animation: 'blink 5s infinite', transformOrigin: '110px 72px' }}>
          {happy ? (
            <>
              <path d="M70 76 q12 -14 24 0" stroke="#1e293b" strokeWidth="5" fill="none" strokeLinecap="round" />
              <path d="M126 76 q12 -14 24 0" stroke="#1e293b" strokeWidth="5" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="86" cy="76" r="9" fill="#1e293b" />
              <circle cx="134" cy="76" r="9" fill="#1e293b" />
              <circle cx="89" cy="73" r="3" fill="white" />
              <circle cx="137" cy="73" r="3" fill="white" />
            </>
          )}
        </g>
        {/* mouth */}
        <g key={chewing} style={{ animation: chewing > 0 ? 'chomp 0.4s ease-in-out 2' : 'none', transformOrigin: '110px 118px' }}>
          {mouthOpen ? (
            <>
              <ellipse cx="110" cy="120" rx="44" ry="30" fill="#7f1d1d" />
              <ellipse cx="110" cy="134" rx="24" ry="12" fill="#f87171" />
              <path d="M78 98 l8 12 l8 -12 M126 98 l8 12 l8 -12" fill="white" />
            </>
          ) : (
            <path d="M74 112 Q110 146 146 112" stroke="#7f1d1d" strokeWidth="7" fill="#7f1d1d" strokeLinejoin="round" />
          )}
        </g>
      </g>
    </svg>
  );
}

export const BALLOON_COLOURS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ec4899'];

export function BalloonSvg({ color, label, size = 110 }: { color: string; label: string; size?: number }) {
  return (
    <svg viewBox="0 0 100 150" width={size} height={size * 1.5} aria-hidden>
      <path d="M50 108 C48 122 56 130 50 148" stroke="#64748b" strokeWidth="2" fill="none" />
      <ellipse cx="50" cy="55" rx="42" ry="50" fill={color} />
      <path d="M44 103 L56 103 L50 112Z" fill={color} />
      <ellipse cx="34" cy="34" rx="9" ry="14" fill="white" opacity="0.35" transform="rotate(-20 34 34)" />
      <text x="50" y="70" textAnchor="middle" fontSize="44" fontWeight="700" fill="white" style={{ fontFamily: 'var(--font-display)' }} stroke="rgba(0,0,0,0.18)" strokeWidth="1">
        {label}
      </text>
    </svg>
  );
}

export function Engine({ size = 150 }: { size?: number }) {
  return (
    <svg viewBox="0 0 150 120" width={size} height={size * 0.8} aria-hidden>
      <rect x="10" y="40" width="90" height="50" rx="10" fill="#ef4444" />
      <rect x="70" y="14" width="56" height="76" rx="10" fill="#dc2626" />
      <rect x="80" y="24" width="36" height="28" rx="6" fill="#bae6fd" />
      <rect x="20" y="14" width="18" height="30" rx="4" fill="#334155" />
      <circle cx="29" cy="8" r="7" fill="#e2e8f0" opacity="0.8" />
      <rect x="0" y="80" width="18" height="10" rx="3" fill="#64748b" />
      <circle cx="35" cy="98" r="15" fill="#1e293b" />
      <circle cx="35" cy="98" r="6" fill="#94a3b8" />
      <circle cx="98" cy="98" r="15" fill="#1e293b" />
      <circle cx="98" cy="98" r="6" fill="#94a3b8" />
      <path d="M126 70 L146 90 L126 90Z" fill="#facc15" />
    </svg>
  );
}

export const CAR_COLOURS = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#06b6d4'];

export function Wheels() {
  return (
    <div className="pointer-events-none absolute -bottom-4 left-0 right-0 flex justify-around" aria-hidden>
      {[0, 1].map((i) => (
        <span key={i} className="block h-8 w-8 rounded-full border-[6px] border-slate-800 bg-slate-400" />
      ))}
    </div>
  );
}

export function ChestSvg({ open, size = 220 }: { open: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 220 190" width={size} height={size * 0.86} aria-hidden>
      {open && (
        <g style={{ animation: 'riseUp 0.6s ease-out both' }}>
          <circle cx="110" cy="70" r="40" fill="#fde68a" opacity="0.7" />
          <text x="110" y="88" textAnchor="middle" fontSize="48" className="emoji">
            💎
          </text>
        </g>
      )}
      <rect x="20" y="90" width="180" height="90" rx="12" fill="#b45309" />
      <rect x="20" y="90" width="180" height="16" fill="#92400e" />
      <rect x="40" y="90" width="14" height="90" fill="#fbbf24" />
      <rect x="166" y="90" width="14" height="90" fill="#fbbf24" />
      {open ? (
        <path d="M20 90 L40 30 L180 30 L200 90Z" fill="#92400e" opacity="0.9" />
      ) : (
        <path d="M20 92 C20 40 200 40 200 92Z" fill="#d97706" />
      )}
      {!open && <rect x="40" y="52" width="14" height="40" fill="#fbbf24" />}
      {!open && <rect x="166" y="52" width="14" height="40" fill="#fbbf24" />}
    </svg>
  );
}

export function KeySvg({ color = '#facc15', size = 90 }: { color?: string; size?: number }) {
  return (
    <svg viewBox="0 0 120 50" width={size} height={size * 0.42} aria-hidden>
      <circle cx="22" cy="25" r="18" fill={color} stroke="#a16207" strokeWidth="3" />
      <circle cx="22" cy="25" r="7" fill="white" />
      <rect x="38" y="20" width="76" height="10" rx="3" fill={color} stroke="#a16207" strokeWidth="3" />
      <rect x="92" y="28" width="8" height="14" fill={color} stroke="#a16207" strokeWidth="3" />
      <rect x="104" y="28" width="8" height="10" fill={color} stroke="#a16207" strokeWidth="3" />
    </svg>
  );
}

export function FrogSvg({ size = 70 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 80" width={size} height={size * 0.8} aria-hidden>
      <ellipse cx="50" cy="55" rx="38" ry="24" fill="#22c55e" />
      <ellipse cx="50" cy="62" rx="24" ry="14" fill="#bbf7d0" />
      <circle cx="30" cy="28" r="14" fill="#22c55e" />
      <circle cx="70" cy="28" r="14" fill="#22c55e" />
      <circle cx="30" cy="28" r="8" fill="white" />
      <circle cx="70" cy="28" r="8" fill="white" />
      <circle cx="32" cy="29" r="4" fill="#1e293b" />
      <circle cx="68" cy="29" r="4" fill="#1e293b" />
      <path d="M36 52 Q50 62 64 52" stroke="#166534" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="18" cy="74" rx="12" ry="5" fill="#16a34a" />
      <ellipse cx="82" cy="74" rx="12" ry="5" fill="#16a34a" />
    </svg>
  );
}

export function Coin({ size = 54 }: { size?: number }) {
  return (
    <svg viewBox="0 0 60 60" width={size} height={size} aria-hidden>
      <circle cx="30" cy="30" r="27" fill="#facc15" stroke="#ca8a04" strokeWidth="4" />
      <circle cx="30" cy="30" r="18" fill="none" stroke="#fde68a" strokeWidth="3" />
      <text x="30" y="38" textAnchor="middle" fontSize="22" fontWeight="700" fill="#a16207">
        1
      </text>
    </svg>
  );
}

export const BLOCK_COLOURS = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

export function Block({ color, size = 44, label, style }: { color: string; size?: number; label?: string | number; style?: CSSProperties }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-lg text-lg font-bold text-white"
      style={{ width: size * 1.6, height: size, background: color, boxShadow: 'inset 0 -6px 0 rgba(0,0,0,0.18), inset 0 4px 0 rgba(255,255,255,0.25)', ...style }}
    >
      <span className="absolute left-3 top-1 h-2 w-4 rounded-full bg-white/40" aria-hidden />
      {label !== undefined && <span style={{ textShadow: '0 2px 0 rgba(0,0,0,0.25)' }}>{label}</span>}
    </div>
  );
}

/** Draws a geometry shape into a (cx, cy, w, h) box. */
export function ShapePath({ shape, cx, cy, w, h, color, stroke = '#1e293b', strokeWidth = 3 }: { shape: ShapeName; cx: number; cy: number; w: number; h: number; color: string; stroke?: string; strokeWidth?: number }) {
  const common = { fill: color, stroke, strokeWidth, strokeLinejoin: 'round' as const };
  switch (shape) {
    case 'circle':
      return <circle cx={cx} cy={cy} r={w / 2} {...common} />;
    case 'oval':
      return <ellipse cx={cx} cy={cy} rx={w / 2} ry={h / 2} {...common} />;
    case 'square':
    case 'rectangle':
      return <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={Math.min(w, h) * 0.06} {...common} />;
    case 'triangle':
      return <path d={`M${cx} ${cy - h / 2} L${cx + w / 2} ${cy + h / 2} L${cx - w / 2} ${cy + h / 2}Z`} {...common} />;
    case 'star': {
      const pts: string[] = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? w / 2 : w / 4.6;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a) + h * 0.04).toFixed(1)}`);
      }
      return <polygon points={pts.join(' ')} {...common} />;
    }
  }
}

export function ShapeIcon({ shape, color, size = 60 }: { shape: ShapeName; color: string; size?: number }) {
  const dims: Record<ShapeName, [number, number]> = { circle: [80, 80], square: [76, 76], triangle: [88, 78], rectangle: [96, 54], oval: [92, 60], star: [88, 88] };
  const [w, h] = dims[shape];
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <ShapePath shape={shape} cx={50} cy={50} w={w} h={h} color={color} />
    </svg>
  );
}

export function PizzaBase({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden className="absolute inset-0">
      <circle cx="100" cy="100" r="96" fill="#d97706" />
      <circle cx="100" cy="100" r="84" fill="#ef4444" />
      <circle cx="100" cy="100" r="80" fill="#fde68a" />
      {[
        [70, 60, 16],
        [130, 80, 14],
        [95, 130, 18],
        [60, 115, 10],
        [140, 135, 12],
      ].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#fcd34d" opacity="0.8" />
      ))}
    </svg>
  );
}

export function Scenery({ scene }: { scene: 'garden' | 'pond' | 'meadow' | 'sky' }) {
  const bg: Record<string, string> = {
    garden: 'linear-gradient(180deg,#bae6fd 0%,#e0f2fe 30%,#86efac 31%,#4ade80 100%)',
    pond: 'linear-gradient(180deg,#bae6fd 0%,#e0f2fe 25%,#86efac 26%,#86efac 34%,#38bdf8 35%,#0ea5e9 100%)',
    meadow: 'linear-gradient(180deg,#fef3c7 0%,#fde68a 30%,#bef264 31%,#84cc16 100%)',
    sky: 'linear-gradient(180deg,#7dd3fc 0%,#bae6fd 70%,#e0f2fe 100%)',
  };
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[28px]" style={{ background: bg[scene] }} aria-hidden>
      {scene === 'sky' && (
        <>
          <div className="absolute left-[8%] top-[10%] h-10 w-28 rounded-full bg-white/80" />
          <div className="absolute right-[12%] top-[22%] h-12 w-36 rounded-full bg-white/70" />
          <div className="absolute left-[40%] bottom-[8%] h-10 w-32 rounded-full bg-white/70" />
        </>
      )}
      {scene === 'garden' && (
        <div className="emoji absolute bottom-2 left-0 right-0 flex justify-between px-4 text-2xl opacity-70">
          <span>🌷</span>
          <span>🌼</span>
          <span>🌷</span>
          <span>🌼</span>
          <span>🌷</span>
        </div>
      )}
      {scene === 'pond' && <div className="emoji absolute bottom-3 right-6 text-3xl opacity-60">🪷</div>}
      {scene === 'meadow' && <div className="emoji absolute right-4 top-3 text-4xl">☀️</div>}
    </div>
  );
}
