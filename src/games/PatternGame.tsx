/** Game 9 — Pattern Puzzle. Drag (or tap) the piece that completes the pattern. */
import { useState } from 'react';
import { sfx } from '../app/sfx';
import { ShapeIcon } from '../art/props';
import { Draggable } from '../components/Draggable';
import { tokenInfo } from '../subjects/maths/catalog';
import type { PatternQuestion, ShapeName } from '../subjects/maths/types';
import { DoneButton, useChoice } from './controls';
import type { GameProps } from './types';

export function Token({ set, id, size = 72 }: { set: string; id: string; size?: number }) {
  if (set === 'numbers')
    return (
      <span className="flex items-center justify-center rounded-2xl bg-white font-bold text-slate-800 shadow-[inset_0_-5px_0_#e2e8f0]" style={{ width: size, height: size, fontSize: size * 0.48 }}>
        {id}
      </span>
    );
  const t = tokenInfo(set, id);
  if (set === 'colours')
    return <span className="block rounded-full shadow-[inset_0_-6px_0_rgba(0,0,0,0.18)]" style={{ width: size * 0.86, height: size * 0.86, background: t.color }} aria-label={t.label} />;
  if (set === 'shapes') return <ShapeIcon shape={t.shape as ShapeName} color={t.color!} size={size} />;
  return (
    <span className="emoji block" style={{ fontSize: size * 0.8 }}>
      {t.emoji}
    </span>
  );
}

export function PatternGame({ question: q, mode, feedback, wrongCount, hint, reveal, locked, reducedMotion, onSubmit, say }: GameProps<PatternQuestion>) {
  const [hover, setHover] = useState(false);
  const answer = q.patternType === 'number' ? String(q.start + q.step * q.blankIndex) : q.unit[q.blankIndex % q.unit.length]!;
  const c = useChoice<string>(mode, locked, wrongCount, (id) => {
    if (mode === 'practice' && id === answer) {
      const words = q.sequence.map((t, i) => (i === q.blankIndex ? id : t)).map((t) => (q.tokenSet === 'numbers' ? t : tokenInfo(q.tokenSet, t).label));
      say(words.join(', '));
    }
    onSubmit({ type: 'choice', value: id });
  });
  const filled = feedback === 'correct' ? answer : reveal ? answer : mode === 'test' ? c.selected : null;
  const unitLen = q.unit.length;
  const size = q.sequence.length > 8 ? 64 : 76;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8">
      <div className="card flex flex-wrap items-center justify-center gap-3 px-6 py-6" data-testid="pattern-row">
        {q.sequence.map((t, i) => {
          const isBlank = i === q.blankIndex;
          const groupStart = hint && unitLen > 0 && i % unitLen === 0 && i > 0;
          return (
            <div key={i} className={`flex items-center ${groupStart ? 'ml-4 border-l-4 border-dashed border-yellow-300 pl-4' : ''}`}>
              {isBlank ? (
                <div
                  data-dropzone="blank"
                  data-testid="pattern-blank"
                  className={`flex items-center justify-center rounded-2xl border-4 border-dashed ${filled ? 'border-green-400 bg-green-50' : 'border-orange-400 bg-orange-50'} ${hover ? 'drop-hover' : ''}`}
                  style={{ width: size + 16, height: size + 16 }}
                >
                  {filled ? (
                    <span className="anim-pop-in">
                      <Token set={q.tokenSet} id={filled} size={size} />
                    </span>
                  ) : (
                    <span className="text-4xl font-bold text-orange-400">?</span>
                  )}
                </div>
              ) : (
                <span style={{ animation: feedback === 'correct' && !reducedMotion ? `hop 0.6s ease-in-out ${i * 0.08}s 1` : undefined }}>
                  <Token set={q.tokenSet} id={t} size={size} />
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-5" aria-label="Pieces">
        {q.options.map((o) => {
          const out = c.ruledOut.includes(o);
          return (
            <Draggable
              key={o}
              id={`piece-${o}`}
              testId={`piece-${o}`}
              label={q.tokenSet === 'numbers' ? `number ${o}` : tokenInfo(q.tokenSet, o).label}
              disabled={locked || out}
              onTap={() => {
                sfx('tap');
                c.choose(o);
              }}
              onDrop={(z) => z === 'blank' && c.choose(o)}
              onHoverZone={(z) => setHover(z === 'blank')}
              className={`card flex items-center justify-center p-3 ${c.selected === o && mode === 'test' ? 'ring-4 ring-blue-400' : ''} ${out ? 'opacity-30' : ''}`}
            >
              <Token set={q.tokenSet} id={o} size={84} />
            </Draggable>
          );
        })}
      </div>
      {mode === 'test' && <DoneButton onClick={c.commit} disabled={c.selected === null || locked} />}
    </div>
  );
}
