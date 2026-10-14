/** Game 4 — Number Train. Drag (or tap) number tiles into the empty carriages, then send the train off. */
import { useState } from 'react';
import { useT } from '../app/i18n';
import { sfx } from '../app/sfx';
import { CAR_COLOURS, Engine, Wheels } from '../art/props';
import { Draggable } from '../components/Draggable';
import type { TrainQuestion } from '../subjects/maths/types';
import { DoneButton } from './controls';
import { clearSlot, emptySlots, placeTile, slotsFilled, slotsResponse, type TrainSlots } from './logic';
import type { GameProps } from './types';

export function TrainGame({ question: q, mode, feedback, wrongCount, hint, reveal, locked, reducedMotion, onSubmit, say }: GameProps<TrainQuestion>) {
  const t = useT();
  const [slots, setSlots] = useState<TrainSlots>(() => emptySlots(q.missing));
  const [hoverSlot, setHoverSlot] = useState<number | null>(null);
  const [lastWrong, setLastWrong] = useState(0);
  const used = new Set(Object.values(slots).filter((v): v is number => v !== null));

  // after a wrong try in practice, send back only the misplaced tiles so the child can fix them
  if (mode === 'practice' && wrongCount > lastWrong) {
    setLastWrong(wrongCount);
    const fixed: TrainSlots = { ...slots };
    for (const i of q.missing) if (fixed[i] !== q.cars[i]) fixed[i] = null;
    if (q.variant === 'order') {
      const sorted = [...q.tiles].sort((a, b) => (q.direction === 'asc' ? a - b : b - a));
      for (const i of q.missing) if (fixed[i] !== null && fixed[i] !== sorted[i]) fixed[i] = null;
    }
    setSlots(fixed);
  }

  const put = (tile: number, slot?: number) => {
    if (locked) return;
    setSlots((s) => placeTile(s, tile, slot));
    sfx('tap');
    say(String(tile));
  };
  const going = feedback === 'correct' && !reducedMotion;
  const display = (i: number): number | null => (q.missing.includes(i) ? (reveal ? q.cars[i]! : (slots[i] ?? null)) : q.cars[i]!);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 overflow-hidden">
      <div className="relative w-full overflow-hidden py-4">
        <div className="flex items-end justify-center gap-2" style={{ animation: going ? 'trainGo 2.2s ease-in 0.2s forwards' : undefined }}>
          <Engine size={150} />
          {q.cars.map((_, i) => {
            const v = display(i);
            const empty = q.missing.includes(i);
            return (
              <div key={i} className="relative">
                <div
                  data-dropzone={empty ? `slot-${i}` : undefined}
                  data-testid={`car-${i}`}
                  onClick={() => empty && slots[i] !== null && !locked && setSlots((s) => clearSlot(s, i))}
                  className={`relative flex h-24 w-24 items-center justify-center rounded-2xl text-5xl font-bold shadow-[inset_0_-8px_0_rgba(0,0,0,0.15)] ${hoverSlot === i ? 'drop-hover' : ''} ${empty && slots[i] !== null && !locked ? 'cursor-pointer' : ''}`}
                  style={{ background: CAR_COLOURS[i % CAR_COLOURS.length] }}
                  aria-label={empty ? (v === null ? `empty carriage ${i + 1}` : `carriage ${i + 1} has ${v}, tap to take it out`) : `carriage ${i + 1}: ${v}`}
                  role={empty ? 'button' : undefined}
                >
                  {v === null ? (
                    <span className="flex h-16 w-16 items-center justify-center rounded-xl border-4 border-dashed border-white/80 text-4xl text-white/90">?</span>
                  ) : (
                    <span className={`flex h-16 w-16 items-center justify-center rounded-xl bg-white text-slate-800 ${empty ? 'anim-pop-in' : ''}`}>{v}</span>
                  )}
                  <Wheels />
                </div>
                {hint && i > 0 && q.variant === 'sequence' && !q.missing.includes(i) && !q.missing.includes(i - 1) && (
                  <span className="absolute -left-5 -top-7 rounded-full bg-yellow-200 px-2 text-sm font-bold">{q.step > 0 ? `+${q.step}` : q.step}</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="mx-auto mt-4 h-3 w-[90%] rounded-full bg-slate-500" aria-hidden />
      </div>

      <div className="flex flex-wrap justify-center gap-4" aria-label="Number tiles">
        {q.tiles.map((t) =>
          used.has(t) ? (
            <span key={t} className="h-20 w-20 rounded-2xl border-4 border-dashed border-slate-300" aria-hidden />
          ) : (
            <Draggable
              key={t}
              id={`tile-${t}`}
              testId={`tile-${t}`}
              label={`number ${t}`}
              disabled={locked}
              onTap={() => put(t)}
              onDrop={(z) => z.startsWith('slot-') && put(t, Number(z.slice(5)))}
              onHoverZone={(z) => setHoverSlot(z?.startsWith('slot-') ? Number(z.slice(5)) : null)}
              className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-4xl font-bold shadow-[0_6px_0_#cbd5e1]"
            >
              {t}
            </Draggable>
          ),
        )}
      </div>
      <DoneButton
        testId="train-go"
        disabled={locked || !slotsFilled(slots)}
        onClick={() => {
          if (locked || !slotsFilled(slots)) return;
          if (mode === 'practice') sfx('toot');
          onSubmit({ type: 'sequence', value: slotsResponse(slots, q.missing) });
        }}
      >
        {mode === 'test' ? 'Done' : t('Go train!', 'Chalo train!')}
      </DoneButton>
    </div>
  );
}
