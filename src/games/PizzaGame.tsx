/** Game 6 — Pizza Maths. Put the right toppings on, then count how many altogether. */
import { useMemo, useState } from 'react';
import { useT } from '../app/i18n';
import { sfx } from '../app/sfx';
import { PizzaBase } from '../art/props';
import { Draggable } from '../components/Draggable';
import { TOPPING_INFO } from '../subjects/maths/catalog';
import { TOPPINGS, type PizzaQuestion } from '../subjects/maths/types';
import { DoneButton, NumberChoices } from './controls';
import { addTopping, removeTopping, toppingCounts, type PizzaState } from './logic';
import type { GameProps } from './types';

// 14 friendly spots on the pizza (fractions of the pizza size)
const SPOTS: [number, number][] = [
  [0.5, 0.28], [0.72, 0.38], [0.72, 0.62], [0.5, 0.72], [0.28, 0.62], [0.28, 0.38], [0.5, 0.5],
  [0.38, 0.18], [0.62, 0.18], [0.84, 0.5], [0.62, 0.82], [0.38, 0.82], [0.16, 0.5], [0.5, 0.92],
];

export function PizzaGame({ question: q, mode, wrongCount, hint, reveal, locked, onSubmit, say }: GameProps<PizzaQuestion>) {
  const t = useT();
  const tr = t;
  const [pizza, setPizza] = useState<PizzaState>({ toppings: [], nextId: 0 });
  const [phase, setPhase] = useState<'build' | 'count'>('build');
  const [note, setNote] = useState<string | null>(null);
  const [hover, setHover] = useState(false);
  const counts = toppingCounts(pizza);
  const total = q.toppings.reduce((s, t) => s + t.count, 0);
  const bins = useMemo(() => {
    const types: string[] = q.toppings.map((t) => t.type);
    if (q.level >= 2) {
      const extra = TOPPINGS.find((t) => !types.includes(t));
      if (extra) types.push(extra);
    }
    return types;
  }, [q]);
  const size = 320;

  const add = (type: string) => {
    if (locked || phase !== 'build') return;
    setPizza((p) => addTopping(p, type));
    setNote(null);
    sfx('tap');
    say(TOPPING_INFO[type]!.one);
  };

  const finishBuild = () => {
    if (locked) return;
    if (mode === 'practice') {
      for (const tp of q.toppings) {
        const have = counts[tp.type] ?? 0;
        if (have !== tp.count) {
          const info = TOPPING_INFO[tp.type]!;
          setNote(tr(`You need ${tp.count} ${tp.count === 1 ? info.one : info.many}. You have ${have}.`, `${tp.count} ${tp.count === 1 ? info.one : info.many} chahiye. Abhi ${have} hain.`));
          sfx('gentle');
          return;
        }
      }
      const extra = Object.keys(counts).find((k) => !q.toppings.some((t) => t.type === k));
      if (extra) {
        setNote(tr(`Oops! This pizza doesn't need ${TOPPING_INFO[extra]!.many}. Tap them to take them off.`, `Oops! Is pizza pe ${TOPPING_INFO[extra]!.many} nahi chahiye. Unpe tap karke hatao.`));
        sfx('gentle');
        return;
      }
    }
    setPhase('count');
    say(tr('How many toppings are on the pizza altogether?', 'Pizza pe total kitne toppings hain?'));
  };

  return (
    <div className="flex h-full w-full flex-col items-center gap-3">
      <div className="flex w-full max-w-5xl flex-1 items-center justify-center gap-8">
        <div className="relative shrink-0" style={{ width: size, height: size }} data-dropzone="pizza" data-testid="pizza">
          <div className={`absolute inset-0 rounded-full ${hover ? 'drop-hover' : ''}`} />
          <PizzaBase size={size} />
          {pizza.toppings.map((t, idx) => {
            const [fx, fy] = SPOTS[t.slot % SPOTS.length]!;
            return (
              <button
                key={t.id}
                data-testid={`placed-${t.type}`}
                aria-label={`${TOPPING_INFO[t.type]!.one} on the pizza${phase === 'build' ? ', tap to take it off' : ''}`}
                onClick={() => {
                  if (locked || phase !== 'build') return;
                  setPizza((p) => removeTopping(p, t.id));
                  sfx('tap');
                }}
                className="emoji anim-pop-in absolute -translate-x-1/2 -translate-y-1/2 text-[40px]"
                style={{ left: fx * size, top: fy * size }}
              >
                {TOPPING_INFO[t.type]!.emoji}
                {(phase === 'count' && (hint || reveal)) && (
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-300 text-sm font-bold text-slate-800">{idx + 1}</span>
                )}
              </button>
            );
          })}
        </div>

        {phase === 'build' && (
          <div className="flex flex-col gap-3" aria-label="Topping bowls">
            {bins.map((type) => {
              const info = TOPPING_INFO[type]!;
              const target = q.toppings.find((t) => t.type === type)?.count;
              return (
                <div key={type} className="card flex items-center gap-4 px-4 py-2">
                  <Draggable id={`bin-${type}`} testId={`bin-${type}`} label={`add a ${info.one}`} disabled={locked} onTap={() => add(type)} onDrop={(z) => z === 'pizza' && add(type)} onHoverZone={(z) => setHover(z === 'pizza')} className="rounded-2xl bg-amber-100 p-2">
                    <span className="emoji block text-5xl">{info.emoji}</span>
                  </Draggable>
                  <div className="min-w-32 text-xl">
                    <div className="font-bold capitalize">{info.many}</div>
                    {mode === 'practice' && target !== undefined && (
                      <div className="text-slate-500" data-testid={`progress-${type}`}>
                        {counts[type] ?? 0} {t('of', '/')} {target}
                      </div>
                    )}
                    {mode === 'practice' && target === undefined && <div className="text-slate-400">{t('not needed', 'nahi chahiye')}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {phase === 'count' && (
          <div className="flex max-w-md flex-col items-center gap-4">
            <div className="card px-6 py-4 text-center text-2xl font-bold">{t('How many toppings are on the pizza altogether?', 'Pizza pe total kitne toppings hain?')}</div>
            {(hint || reveal) && (
              <div className="rounded-2xl bg-yellow-100 px-4 py-2 text-xl font-semibold">
                {q.toppings.map((t) => `${counts[t.type] ?? 0} ${TOPPING_INFO[t.type]!.emoji}`).join(' + ')}
                {reveal ? ` = ${total}` : ''}
              </div>
            )}
          </div>
        )}
      </div>

      {note && (
        <div className="anim-pop-in rounded-2xl bg-orange-100 px-5 py-2 text-xl font-semibold text-orange-800" role="status" data-testid="pizza-note">
          {note}
        </div>
      )}

      {phase === 'build' ? (
        <DoneButton onClick={finishBuild} disabled={locked || pizza.toppings.length === 0} testId="pizza-done">
          {t('Pizza ready', 'Pizza taiyaar')}
        </DoneButton>
      ) : (
        <NumberChoices options={q.options} mode={mode} locked={locked} wrongCount={wrongCount} correct={total} reveal={reveal} onSubmit={(n) => onSubmit({ type: 'pizza', placed: counts, total: n })} />
      )}
    </div>
  );
}
