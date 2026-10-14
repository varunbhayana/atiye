/** Game 5 — Treasure Chest. Drag the key with the right number into the lock to open the chest. */
import { useState } from 'react';
import { useT } from '../app/i18n';
import { sfx } from '../app/sfx';
import { ChestSvg, KeySvg } from '../art/props';
import { Draggable } from '../components/Draggable';
import { solveTask } from '../subjects/maths/answers';
import type { TreasureQuestion } from '../subjects/maths/types';
import { DoneButton, useChoice } from './controls';
import { TaskBoard } from './TaskBoard';
import type { GameProps } from './types';

const KEY_COLOURS = ['#facc15', '#fb923c', '#a3e635', '#67e8f9'];

export function TreasureGame({ question: q, mode, feedback, wrongCount, hint, reveal, locked, onSubmit }: GameProps<TreasureQuestion>) {
  const answer = solveTask(q.task);
  const t = useT();
  const [hover, setHover] = useState(false);
  const [jiggle, setJiggle] = useState<number | null>(null);
  const c = useChoice<number>(mode, locked, wrongCount, (n) => {
    if (n !== answer && mode === 'practice') {
      setJiggle(n);
      window.setTimeout(() => setJiggle(null), 500);
    }
    sfx(mode === 'practice' && n === answer ? 'unlock' : 'tap');
    onSubmit({ type: 'number', value: n });
  });
  const open = feedback === 'correct';
  const inLock = mode === 'test' ? c.selected : feedback === 'correct' ? answer : null;

  return (
    <div className="flex h-full w-full flex-col items-center gap-4">
      <TaskBoard task={q.task} showDots={hint || reveal || q.level <= 2} />
      <div className="flex w-full max-w-5xl flex-1 items-center justify-around gap-6">
        <div className="relative flex flex-col items-center" data-dropzone="lock" data-testid="chest-lock">
          <div className={`rounded-[36px] p-2 ${hover ? 'drop-hover' : ''}`}>
            <ChestSvg open={open} size={260} />
          </div>
          <div className="absolute left-1/2 top-[58%] flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-2xl border-4 border-amber-800 bg-amber-300 text-3xl font-bold text-amber-900 shadow" aria-label="Lock">
            {inLock ?? '🔒'}
          </div>
          {reveal && <div className="mt-2 rounded-full bg-green-100 px-4 py-1 text-xl font-bold text-green-800">{t('The key was', 'Sahi chaabi thi')} {answer}</div>}
        </div>
        <div className="grid grid-cols-2 gap-4" aria-label="Keys">
          {q.keys.map((k, i) => {
            const out = c.ruledOut.includes(k);
            return (
              <Draggable
                key={k}
                id={`key-${k}`}
                testId={`key-${k}`}
                label={`key ${k}`}
                disabled={locked || out}
                onTap={() => c.choose(k)}
                onDrop={(z) => z === 'lock' && c.choose(k)}
                onHoverZone={(z) => setHover(z === 'lock')}
                className={`flex flex-col items-center rounded-3xl bg-white px-4 py-3 shadow-[0_6px_0_#e2e8f0] ${c.selected === k && mode === 'test' ? 'ring-4 ring-blue-400' : ''} ${jiggle === k ? 'anim-shake' : ''} ${out ? 'opacity-30' : ''}`}
              >
                <KeySvg color={KEY_COLOURS[i % KEY_COLOURS.length]} size={110} />
                <span className="text-4xl font-bold">{k}</span>
              </Draggable>
            );
          })}
        </div>
      </div>
      {mode === 'test' && <DoneButton onClick={c.commit} disabled={c.selected === null || locked} />}
    </div>
  );
}
