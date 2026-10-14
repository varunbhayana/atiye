/** Game 12 — Block Towers. Build a tower of N blocks, or pick the taller / shorter tower. */
import { useState } from 'react';
import { useT } from '../app/i18n';
import { sfx } from '../app/sfx';
import { BLOCK_COLOURS, Block } from '../art/props';
import { Draggable } from '../components/Draggable';
import type { TowerQuestion } from '../subjects/maths/types';
import { DoneButton, useChoice } from './controls';
import type { GameProps } from './types';

const BLOCK_H = 38;

function Tower({ count, numbered, colorOffset = 0 }: { count: number; numbered: boolean; colorOffset?: number }) {
  return (
    <div className="flex flex-col-reverse items-center" style={{ minHeight: BLOCK_H * 10 }}>
      {Array.from({ length: count }, (_, i) => (
        <Block key={i} color={BLOCK_COLOURS[(i + colorOffset) % BLOCK_COLOURS.length]!} size={BLOCK_H} label={numbered ? i + 1 : undefined} style={{ marginTop: 2 }} />
      ))}
    </div>
  );
}

export function TowerGame(props: GameProps<TowerQuestion>) {
  return props.question.variant === 'build' ? <Build {...props} /> : <Compare {...props} />;
}

function Build({ question: q, mode, hint, reveal, locked, onSubmit, say }: GameProps<TowerQuestion>) {
  const t = useT();
  const [height, setHeight] = useState(0);
  const [hover, setHover] = useState(false);
  const add = () => {
    if (locked || height >= 12) return;
    setHeight((h) => h + 1);
    sfx('tap');
    say(String(height + 1));
  };
  const removeTop = () => {
    if (locked || height === 0) return;
    setHeight((h) => h - 1);
    sfx('tap');
  };
  return (
    <div className="flex h-full w-full flex-col items-center gap-4">
      <div className="flex w-full max-w-4xl flex-1 items-end justify-center gap-16">
        <div className="flex flex-col items-center gap-3">
          <Draggable id="block-bin" testId="block-bin" label="add a block" disabled={locked} onTap={add} onDrop={(z) => z === 'tower' && add()} onHoverZone={(z) => setHover(z === 'tower')} className="card flex flex-col items-center gap-2 p-4">
            <Block color="#f97316" size={BLOCK_H} />
            <span className="text-lg font-bold">{t('Add a block', 'Block jodo')}</span>
          </Draggable>
          <button className="btn3d btn-white px-4 py-3 text-lg" onClick={removeTop} disabled={locked || height === 0} data-testid="remove-block">
            {t('Take one off', 'Ek hatao')}
          </button>
        </div>
        <div data-dropzone="tower" data-testid="tower" className={`flex min-w-[200px] flex-col items-center justify-end rounded-3xl border-b-8 border-green-600 bg-white/40 px-6 pb-1 pt-4 ${hover ? 'drop-hover' : ''}`} style={{ minHeight: BLOCK_H * 10 + 40 }}>
          <Tower count={reveal ? q.target : height} numbered={hint || reveal} />
        </div>
      </div>
      <div className="flex items-center gap-4">
        {mode === 'practice' && (
          <span className="rounded-full bg-white px-5 py-2 text-2xl font-bold shadow" data-testid="tower-height">
            Blocks: {height}
          </span>
        )}
        <DoneButton onClick={() => !locked && onSubmit({ type: 'number', value: height })} disabled={locked || height === 0} />
      </div>
    </div>
  );
}

function Compare({ question: q, mode, wrongCount, hint, reveal, locked, onSubmit }: GameProps<TowerQuestion>) {
  const c = useChoice<string>(mode, locked, wrongCount, (v) => onSubmit({ type: 'choice', value: v }));
  const leftWins = q.ask === 'taller' || q.ask === 'more' ? q.left > q.right : q.left < q.right;
  const correct = leftWins ? 'left' : 'right';
  return (
    <div className="flex h-full w-full flex-col items-center gap-4">
      <div className="flex w-full max-w-4xl flex-1 items-end justify-center gap-24">
        {(['left', 'right'] as const).map((side, i) => {
          const count = side === 'left' ? q.left : q.right;
          const out = c.ruledOut.includes(side);
          const show = reveal && side === correct;
          return (
            <button
              key={side}
              data-testid={`tower-${side}`}
              aria-label={`${side} tower`}
              onClick={() => c.choose(side)}
              disabled={locked && !show}
              className={`flex flex-col items-center rounded-3xl border-b-8 border-green-600 bg-white/40 px-8 pb-1 pt-4 transition ${c.selected === side ? 'ring-8 ring-blue-400' : ''} ${show ? 'anim-pulse-ring ring-8 ring-green-400' : ''} ${out ? 'opacity-40' : 'hover:bg-white/70'}`}
            >
              <Tower count={count} numbered={hint || reveal} colorOffset={i * 3} />
            </button>
          );
        })}
      </div>
      {mode === 'test' && <DoneButton onClick={c.commit} disabled={c.selected === null || locked} />}
    </div>
  );
}
