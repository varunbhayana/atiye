/** Game 3 — Balloon Pop. Pop the balloon showing the answer. No timers. */
import { useState } from 'react';
import { sfx } from '../app/sfx';
import { BALLOON_COLOURS, BalloonSvg } from '../art/props';
import { solveTask } from '../subjects/maths/answers';
import type { BalloonQuestion } from '../subjects/maths/types';
import { DoneButton, useChoice } from './controls';
import { TaskBoard } from './TaskBoard';
import type { GameProps } from './types';

export function BalloonGame({ question: q, mode, feedback, wrongCount, hint, reveal, locked, reducedMotion, onSubmit }: GameProps<BalloonQuestion>) {
  const answer = solveTask(q.task);
  const [popped, setPopped] = useState<number[]>([]);
  const c = useChoice<number>(mode, locked, wrongCount, (n) => {
    setPopped((p) => [...p, n]);
    sfx('pop');
    onSubmit({ type: 'number', value: n });
  });

  return (
    <div className="flex h-full w-full flex-col items-center gap-4">
      <TaskBoard task={q.task} showDots={hint || reveal || q.level <= 2} />
      <div className="relative flex w-full max-w-5xl flex-1 items-center justify-center gap-6 rounded-[28px] bg-gradient-to-b from-sky-200 to-sky-50 px-6 py-4" style={{ minHeight: 300 }}>
        {q.options.map((n, i) => {
          const isPopped = mode === 'practice' && popped.includes(n) && (n !== answer || feedback === 'correct');
          const out = c.ruledOut.includes(n);
          const sel = c.selected === n && mode === 'test';
          const isReveal = reveal && n === answer;
          return (
            <button
              key={n}
              data-testid={`balloon-${n}`}
              aria-label={`Balloon ${n}`}
              disabled={locked && !isReveal}
              onClick={() => !out && c.choose(n)}
              className={`relative rounded-full transition ${sel ? 'scale-110 drop-shadow-[0_0_12px_rgba(59,130,246,0.9)]' : ''} ${isReveal ? 'anim-pulse-ring' : ''}`}
              style={{
                animation: isPopped ? 'balloonPop 0.35s ease-out forwards' : reducedMotion ? undefined : `float ${3.4 + i * 0.5}s ease-in-out ${i * 0.3}s infinite`,
                opacity: out && !isPopped ? 0.25 : 1,
              }}
            >
              <BalloonSvg color={BALLOON_COLOURS[(i + q.options.length) % BALLOON_COLOURS.length]!} label={String(n)} size={q.options.length > 3 ? 120 : 140} />
            </button>
          );
        })}
      </div>
      {mode === 'test' && <DoneButton onClick={c.commit} disabled={c.selected === null || locked} />}
    </div>
  );
}
