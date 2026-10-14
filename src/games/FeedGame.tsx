/** Game 2 — Feed the Hungry Monster. Drag (or tap) exactly the right number of treats into its mouth. */
import { useState } from 'react';
import { useT } from '../app/i18n';
import { sfx } from '../app/sfx';
import { Monster } from '../art/props';
import { Draggable } from '../components/Draggable';
import { food } from '../subjects/maths/catalog';
import type { FeedQuestion } from '../subjects/maths/types';
import { DoneButton } from './controls';
import { placeItem, placedCount, removeItem, type Placed } from './logic';
import type { GameProps } from './types';

export function FeedGame({ question: q, mode, feedback, hint, reveal, locked, onSubmit, say }: GameProps<FeedQuestion>) {
  const f = food(q.food);
  const target = q.parts.reduce((s, n) => s + n, 0);
  const t = useT();
  const [state, setState] = useState<Placed>({ placed: [] });
  const [hover, setHover] = useState(false);
  const [chew, setChew] = useState(0);
  const ids = Array.from({ length: q.supply }, (_, i) => `food-${i}`);
  const fed = placedCount(state);

  const feed = (id: string) => {
    if (locked) return;
    const next = placeItem(state, id, 13);
    if (next === state) return;
    setState(next);
    setChew((c) => c + 1);
    sfx('munch');
    say(String(placedCount(next)));
  };
  const giveBack = (id: string) => {
    if (locked) return;
    setState((s) => removeItem(s, id));
    sfx('tap');
  };

  // the progress slots show the instruction (how many the monster wants), not the answer to a hidden question
  const slots = q.variant === 'parts' ? q.parts : [target];
  let slotIndex = 0;

  return (
    <div className="flex h-full w-full flex-col items-center gap-3">
      {mode === 'test' ? (
        <div className="rounded-full bg-white/90 px-6 py-2 text-2xl font-bold shadow">
          {t('The monster wants', 'Monster ko chahiye')} {q.variant === 'parts' ? t(`${q.parts[0]} and then ${q.parts[1]} more`, `${q.parts[0]} aur phir ${q.parts[1]} aur`) : target} <span className="emoji">{f.emoji}</span>
        </div>
      ) : (
      <div className="flex flex-wrap items-center justify-center gap-4 rounded-full bg-white/90 px-6 py-2 shadow" aria-label={`Fed ${fed} of ${target}`} data-testid="feed-slots">
        {slots.map((n, g) => (
          <div key={g} className="flex items-center gap-1">
            {g > 0 && <span className="mx-2 text-2xl font-bold text-slate-500">{t('then', 'phir')}</span>}
            {Array.from({ length: n }, () => {
              const filled = slotIndex++ < fed;
              return (
                <span key={slotIndex} className={`flex h-10 w-10 items-center justify-center rounded-full border-4 ${filled ? 'border-green-500 bg-green-100' : 'border-dashed border-slate-300'}`}>
                  {filled && <span className="emoji text-xl">{f.emoji}</span>}
                </span>
              );
            })}
          </div>
        ))}
        {fed > target && (
          <span className="anim-pop-in rounded-full bg-orange-100 px-3 py-1 text-lg font-bold text-orange-700" data-testid="too-many">
            +{fed - target} {t('extra!', 'zyada!')}
          </span>
        )}
      </div>
      )}

      <div className="grid w-full max-w-5xl flex-1 grid-cols-[1fr_auto] items-center gap-6">
        <div className="card flex min-h-[260px] flex-wrap content-center items-center justify-center gap-3 p-5" aria-label="Treat tray">
          {ids.map((id) =>
            state.placed.includes(id) ? (
              <span key={id} className="h-[72px] w-[72px] rounded-2xl border-4 border-dashed border-slate-200" aria-hidden />
            ) : (
              <Draggable key={id} id={id} label={`${f.one}`} testId={`food-${id}`} disabled={locked} onTap={() => feed(id)} onDrop={(z) => z === 'mouth' && feed(id)} onHoverZone={(z) => setHover(z === 'mouth')} className="rounded-2xl bg-amber-50 p-2">
                <span className="emoji block text-[52px]">{f.emoji}</span>
              </Draggable>
            ),
          )}
        </div>

        <div className="flex flex-col items-center">
          <div data-dropzone="mouth" data-testid="monster-mouth" className={`relative rounded-[40px] ${hover ? 'drop-hover' : ''}`}>
            <Monster mouthOpen={!locked || feedback !== 'correct'} happy={feedback === 'correct' || (reveal && fed === target)} chewing={chew} size={250} />
          </div>
          <div className="mt-2 flex min-h-[64px] max-w-[300px] flex-wrap justify-center gap-1 rounded-3xl bg-teal-100 px-3 py-2" aria-label="In the monster's tummy (tap to take one back)">
            {state.placed.map((id, n) => (
              <button key={id} onClick={() => giveBack(id)} disabled={locked} className="emoji relative rounded-xl p-1 text-3xl hover:bg-white/60" aria-label={`Take back a ${f.one}`} data-testid="tummy-item">
                {f.emoji}
                {(hint || reveal) && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-300 font-sans text-xs font-bold text-slate-800">{n + 1}</span>}
              </button>
            ))}
            {fed === 0 && <span className="self-center text-base text-teal-700">{t('Yum yum tummy', 'Yummy pet')}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="rounded-full bg-white px-5 py-2 text-2xl font-bold shadow" data-testid="fed-count" aria-live="polite">
          {t('Fed', 'Khilaye')}: {mode === 'practice' ? fed : '?'}
        </span>
        <DoneButton onClick={() => !locked && onSubmit({ type: 'number', value: fed })} disabled={locked || fed === 0} />
      </div>
    </div>
  );
}
