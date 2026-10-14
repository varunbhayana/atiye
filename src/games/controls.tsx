/** Answer controls shared by the games. Practice: tap = answer. Test: tap = select, then Done. */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { sfx } from '../app/sfx';

export function useChoice<T extends string | number>(mode: 'practice' | 'test', locked: boolean, wrongCount: number, submit: (v: T) => void) {
  const [selected, setSelected] = useState<T | null>(null);
  const [ruledOut, setRuledOut] = useState<T[]>([]);
  const lastWrong = useRef(0);
  useEffect(() => {
    if (wrongCount > lastWrong.current && selected !== null) {
      setRuledOut((r) => (r.includes(selected) ? r : [...r, selected]));
      setSelected(null);
    }
    lastWrong.current = wrongCount;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrongCount]);
  const choose = (v: T) => {
    if (locked || ruledOut.includes(v)) return;
    sfx('tap');
    setSelected(v);
    if (mode === 'practice') submit(v);
  };
  const commit = () => {
    if (mode === 'test' && selected !== null && !locked) submit(selected);
  };
  return { selected, ruledOut, choose, commit };
}

export function DoneButton({ onClick, disabled, children = 'Done', testId = 'done' }: { onClick: () => void; disabled?: boolean; children?: ReactNode; testId?: string }) {
  return (
    <button className="btn3d btn-green min-w-44 px-8 py-4 text-2xl" disabled={disabled} onClick={onClick} data-testid={testId}>
      {children} ✓
    </button>
  );
}

export function NumberChoices({
  options,
  mode,
  locked,
  wrongCount,
  correct,
  reveal,
  onSubmit,
  size = 96,
}: {
  options: number[];
  mode: 'practice' | 'test';
  locked: boolean;
  wrongCount: number;
  correct?: number;
  reveal?: boolean;
  onSubmit: (n: number) => void;
  size?: number;
}) {
  const c = useChoice<number>(mode, locked, wrongCount, onSubmit);
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-4" role="group" aria-label="Answer choices">
        {options.map((n) => {
          const out = c.ruledOut.includes(n);
          const sel = c.selected === n;
          const isRevealed = reveal && correct === n;
          return (
            <button
              key={n}
              data-testid={`choice-${n}`}
              aria-pressed={sel}
              disabled={locked && !sel && !isRevealed}
              onClick={() => c.choose(n)}
              className={`btn3d ${isRevealed ? 'btn-green anim-pulse-ring' : sel ? 'btn-blue' : 'btn-white'} ${out ? 'opacity-30' : ''}`}
              style={{ width: size, height: size, fontSize: size * 0.46, borderRadius: size / 2 }}
            >
              {n}
            </button>
          );
        })}
      </div>
      {mode === 'test' && <DoneButton onClick={c.commit} disabled={c.selected === null || locked} />}
    </div>
  );
}

/** Dots that make a small number concrete (e.g. under "3 + 2"). */
export function Dots({ n, color = '#f97316', size = 16 }: { n: number; color?: string; size?: number }) {
  return (
    <div className="flex max-w-[180px] flex-wrap justify-center gap-1" aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="block rounded-full" style={{ width: size, height: size, background: color }} />
      ))}
    </div>
  );
}
