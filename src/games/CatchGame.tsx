/** Game 8 — Catch the Number. Number stars drift slowly across the sky; catch the right one. Motion can be switched off. */
import { useState } from 'react';
import { useT } from '../app/i18n';
import { sfx } from '../app/sfx';
import { solveTask } from '../subjects/maths/answers';
import type { CatchQuestion } from '../subjects/maths/types';
import { DoneButton, useChoice } from './controls';
import { TaskBoard } from './TaskBoard';
import type { GameProps } from './types';

export function CatchGame({ question: q, mode, feedback, wrongCount, hint, reveal, locked, reducedMotion, onSubmit }: GameProps<CatchQuestion>) {
  const answer = solveTask(q.task);
  const t = useT();
  const [still, setStill] = useState(false);
  const moving = !reducedMotion && !still && mode === 'practice';
  const [caught, setCaught] = useState<number | null>(null);
  const c = useChoice<number>(mode, locked, wrongCount, (n) => {
    setCaught(n);
    sfx(mode === 'practice' && n === answer ? 'correct' : 'tap');
    onSubmit({ type: 'number', value: n });
  });
  const lanes = q.items.length;

  return (
    <div className="flex h-full w-full flex-col items-center gap-3">
      <TaskBoard task={q.task} showDots={hint || reveal || ((q.task.type === 'add' || q.task.type === 'sub') && q.level <= 3)} />
      <div className="relative w-full max-w-5xl flex-1 overflow-hidden rounded-[28px]" style={{ minHeight: 320, background: 'linear-gradient(180deg,#1e3a8a 0%,#4f46e5 60%,#7c3aed 100%)' }} data-testid="catch-sky">
        {moving ? (
          q.items.map((it, idx) => {
            const out = c.ruledOut.includes(it.value);
            const isCaught = caught === it.value && feedback === 'correct';
            return (
              <button
                key={it.id}
                data-testid={`star-${it.value}`}
                aria-label={`star ${it.value}`}
                onClick={() => !out && c.choose(it.value)}
                disabled={locked}
                className="absolute"
                style={{
                  top: `${8 + (it.lane * 80) / lanes}%`,
                  // same speed for all stars, evenly spaced, so they never overlap
                  animation: isCaught ? undefined : `driftAcross 20s linear ${-(idx * 20) / lanes}s infinite`,
                  left: isCaught ? '45%' : undefined,
                  opacity: out ? 0.3 : 1,
                }}
              >
                <StarCard value={it.value} big={isCaught} />
              </button>
            );
          })
        ) : (
          <div className="flex h-full flex-wrap items-center justify-center gap-6 p-6">
            {q.items.map((it) => {
              const out = c.ruledOut.includes(it.value);
              return (
                <button
                  key={it.id}
                  data-testid={`star-${it.value}`}
                  aria-label={`star ${it.value}`}
                  aria-pressed={c.selected === it.value}
                  onClick={() => !out && c.choose(it.value)}
                  disabled={locked && !(reveal && it.value === answer)}
                  className={`rounded-full transition ${c.selected === it.value && mode === 'test' ? 'scale-110 ring-8 ring-yellow-300' : ''} ${reveal && it.value === answer ? 'anim-pulse-ring' : ''}`}
                  style={{ opacity: out ? 0.3 : 1 }}
                >
                  <StarCard value={it.value} big={false} />
                </button>
              );
            })}
          </div>
        )}
        {!reducedMotion && mode === 'practice' && (
          <button className="absolute bottom-3 right-3 rounded-full bg-white/90 px-4 py-2 text-lg font-bold" onClick={() => setStill((s) => !s)} data-testid="toggle-motion">
            {still ? t('▶ Make them float', '▶ Udne do') : t('⏸ Stop moving', '⏸ Rok do')}
          </button>
        )}
      </div>
      {mode === 'test' && <DoneButton onClick={c.commit} disabled={c.selected === null || locked} />}
    </div>
  );
}

function StarCard({ value, big }: { value: number; big: boolean }) {
  const s = big ? 130 : 104;
  return (
    <svg viewBox="0 0 100 100" width={s} height={s} aria-hidden>
      <polygon points="50,4 62,36 96,38 69,59 79,93 50,73 21,93 31,59 4,38 38,36" fill="#facc15" stroke="#ca8a04" strokeWidth="3" strokeLinejoin="round" />
      <text x="50" y="66" textAnchor="middle" fontSize="30" fontWeight="700" fill="#713f12">
        {value}
      </text>
    </svg>
  );
}
