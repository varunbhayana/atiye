/** Game 11 — Frog Jumps. Make the frog hop along the number line, then tap where it lands. */
import { useState } from 'react';
import { useT } from '../app/i18n';
import { sfx } from '../app/sfx';
import { FrogSvg } from '../art/props';
import type { NumberLineQuestion } from '../subjects/maths/types';
import { DoneButton, useChoice } from './controls';
import { frogJump, frogStart, jumpsMade, type FrogState } from './logic';
import type { GameProps } from './types';

export function NumberLineGame({ question: q, mode, wrongCount, hint, reveal, locked, onSubmit, say }: GameProps<NumberLineQuestion>) {
  const t = useT();
  const [frog, setFrog] = useState<FrogState>(() => frogStart(q.start));
  const dir: 1 | -1 = q.direction === 'forward' ? 1 : -1;
  const end = q.start + dir * q.jumps;
  const c = useChoice<number>(mode, locked, wrongCount, (n) => onSubmit({ type: 'number', value: n }));
  const span = q.max - q.min;
  const xOf = (n: number) => 4 + ((n - q.min) / span) * 92; // percent
  const ticks = Array.from({ length: span + 1 }, (_, i) => q.min + i);
  const jumps = jumpsMade(frog);

  const jump = () => {
    if (locked) return;
    const next = frogJump(frog, dir, q.min, q.max);
    if (next === frog) return;
    setFrog(next);
    sfx('jump');
    say(String(jumpsMade(next)));
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6">
      <div className="card relative w-full max-w-6xl px-2 pb-6 pt-28" data-testid="number-line">
        {/* jump arcs */}
        <svg className="pointer-events-none absolute left-0 top-10 h-24 w-full" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden>
          {frog.path.slice(1).map((p, i) => {
            const a = xOf(frog.path[i]!);
            const b = xOf(p);
            return <path key={i} d={`M${a} 22 Q${(a + b) / 2} 2 ${b} 22`} fill="none" stroke="#22c55e" strokeWidth="0.6" strokeDasharray="1.2 0.8" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 3 }} />;
          })}
        </svg>
        {/* frog */}
        <div className="absolute top-6 transition-[left] duration-300 ease-out" style={{ left: `${xOf(frog.pos)}%`, transform: 'translateX(-50%)' }} data-testid="frog" data-pos={frog.pos}>
          <div key={jumps} className="anim-hop">
            <FrogSvg size={72} />
          </div>
        </div>
        {/* the line */}
        <div className="relative h-24">
          <div className="absolute left-[3%] right-[3%] top-3 h-2 rounded-full bg-slate-700" />
          {ticks.map((n) => {
            const isStart = n === q.start;
            const sel = c.selected === n && mode === 'test';
            const show = reveal && n === end;
            const out = c.ruledOut.includes(n);
            return (
              <button
                key={n}
                data-testid={`tick-${n}`}
                aria-label={`number ${n}`}
                onClick={() => c.choose(n)}
                disabled={locked && !show}
                className={`absolute top-0 flex -translate-x-1/2 flex-col items-center rounded-xl px-1 ${out ? 'opacity-30' : ''}`}
                style={{ left: `${xOf(n)}%` }}
              >
                <span className="block h-8 w-1.5 rounded bg-slate-700" />
                <span
                  className={`mt-1 flex items-center justify-center rounded-full font-bold ${span > 10 ? 'h-10 w-10 text-xl' : 'h-14 w-14 text-3xl'} ${
                    sel ? 'bg-blue-500 text-white' : show ? 'anim-pulse-ring bg-green-500 text-white' : isStart ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800 hover:bg-yellow-100'
                  }`}
                >
                  {n}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <button className="btn3d btn-green px-8 py-4 text-2xl" onClick={jump} disabled={locked} data-testid="jump">
          {dir === 1 ? t('Jump forward ➡️', 'Aage jump ➡️') : t('⬅️ Jump back', '⬅️ Peeche jump')}
        </button>
        <span className="rounded-full bg-white px-5 py-3 text-2xl font-bold shadow" data-testid="jump-count" aria-live="polite">
          {t('Jumps', 'Jumps')}: {jumps}
          {hint && <span className="text-slate-400"> / {q.jumps}</span>}
        </span>
        <button className="btn3d btn-white px-5 py-4 text-xl" onClick={() => !locked && setFrog(frogStart(q.start))} disabled={locked || jumps === 0} aria-label="Start again">
          ↺ {t('Start again', 'Phir se')}
        </button>
      </div>
      <div className="text-2xl font-semibold text-slate-700">{t('Then tap the number where the frog lands.', 'Phir us number pe tap karo jahan frog pahuncha.')}</div>
      {mode === 'test' && <DoneButton onClick={c.commit} disabled={c.selected === null || locked} />}
    </div>
  );
}
