/** Game 10 — Toy Shop. Pay with coins (or collect Granny's coins), then count what is in your purse. */
import { useState } from 'react';
import { useT } from '../app/i18n';
import { sfx } from '../app/sfx';
import { Coin } from '../art/props';
import { Draggable } from '../components/Draggable';
import { shopItem } from '../subjects/maths/catalog';
import type { ShopQuestion } from '../subjects/maths/types';
import { DoneButton, NumberChoices } from './controls';
import { placeItem, removeItem, type Placed } from './logic';
import type { GameProps } from './types';

export function ShopGame({ question: q, mode, wrongCount, hint, reveal, locked, onSubmit, say }: GameProps<ShopQuestion>) {
  const item = shopItem(q.item);
  const spend = q.variant === 'spend';
  // spend: purse starts with `have` coins and the child moves `amount` to the counter.
  // earn:  Granny holds `amount` coins and the child moves them into the purse (which has `have`).
  const movable = Array.from({ length: spend ? q.have : q.amount }, (_, i) => `coin-${i}`);
  const t = useT();
  const [moved, setMoved] = useState<Placed>({ placed: [] });
  const [phase, setPhase] = useState<'pay' | 'count'>('pay');
  const [note, setNote] = useState<string | null>(null);
  const [hover, setHover] = useState(false);
  const answer = spend ? q.have - q.amount : q.have + q.amount;

  const move = (id: string) => {
    if (locked || phase !== 'pay') return;
    setMoved((m) => placeItem(m, id));
    setNote(null);
    sfx('coin');
  };
  const back = (id: string) => {
    if (locked || phase !== 'pay') return;
    setMoved((m) => removeItem(m, id));
    sfx('tap');
  };
  const n = moved.placed.length;
  const finishPay = () => {
    if (n !== q.amount) {
      // restating the instruction, never the answer to the question
      setNote(spend ? t(`The ${item.name} costs ${q.amount} ${q.amount === 1 ? 'coin' : 'coins'}. You put ${n} on the counter.`, `${item.name} ${q.amount} coins ka hai. Tumne counter pe ${n} rakhe.`) : t(`Granny gives you ${q.amount} ${q.amount === 1 ? 'coin' : 'coins'}. Put them all in your purse.`, `Dadi ne ${q.amount} coins diye. Sab purse mein daalo.`));
      sfx('gentle');
      return;
    }
    setPhase('count');
    say(spend ? t('How many coins are left in your purse?', 'Purse mein kitne coins bache?') : t('How many coins are in your purse now?', 'Ab purse mein kitne coins hain?'));
  };

  const purseCoins = spend ? movable.filter((id) => !moved.placed.includes(id)) : [...Array.from({ length: q.have }, (_, i) => `own-${i}`), ...moved.placed];
  const otherSide = spend ? moved.placed : movable.filter((id) => !moved.placed.includes(id));

  return (
    <div className="flex h-full w-full flex-col items-center gap-3">
      <div className="grid w-full max-w-5xl flex-1 grid-cols-2 gap-6">
        {/* shop counter or Granny */}
        <div className="card relative flex flex-col items-center gap-3 p-4" data-dropzone={spend ? 'counter' : undefined} data-testid={spend ? 'shop-counter' : 'granny'}>
          <div className="flex items-center gap-4">
            <span className="emoji text-6xl">{spend ? '🧑‍🍳' : '👵'}</span>
            {spend && (
              <div className={`flex flex-col items-center rounded-2xl bg-pink-50 px-4 py-2 ${phase === 'count' ? 'opacity-40' : ''}`}>
                <span className="emoji text-6xl">{item.emoji}</span>
                <span className="mt-1 flex items-center gap-1 rounded-full bg-yellow-200 px-3 text-xl font-bold">
                  {q.amount} <Coin size={22} />
                </span>
              </div>
            )}
          </div>
          <div className={`flex min-h-[120px] w-full flex-wrap content-start justify-center gap-2 rounded-2xl ${spend ? 'bg-amber-100' : 'bg-violet-50'} p-3 ${hover ? 'drop-hover' : ''}`}>
            <span className="w-full text-center text-lg font-semibold text-slate-500">{spend ? 'Counter' : t("Granny's coins", 'Dadi ke coins')}</span>
            {otherSide.map((id) =>
              spend ? (
                <button key={id} onClick={() => back(id)} disabled={locked || phase !== 'pay'} aria-label="coin on the counter, tap to take it back" data-testid="counter-coin" className={phase === 'count' ? 'opacity-50' : ''}>
                  <Coin size={50} />
                </button>
              ) : (
                <Draggable key={id} id={id} testId="granny-coin" label="Granny's coin" disabled={locked || phase !== 'pay'} onTap={() => move(id)} onDrop={(z) => z === 'purse' && move(id)} onHoverZone={(z) => setHover(z === 'purse')}>
                  <Coin size={54} />
                </Draggable>
              ),
            )}
          </div>
        </div>

        {/* the child's purse */}
        <div className="card flex flex-col items-center gap-2 p-4" data-dropzone={spend ? undefined : 'purse'} data-testid="purse">
          <span className="text-2xl font-bold">👛 {t('Your purse', 'Tumhara purse')}</span>
          <div className="flex min-h-[160px] w-full flex-wrap content-start justify-center gap-2 rounded-2xl bg-sky-50 p-3">
            {purseCoins.map((id, idx) =>
              spend && phase === 'pay' ? (
                <Draggable key={id} id={id} testId="purse-coin" label="coin in your purse" disabled={locked} onTap={() => move(id)} onDrop={(z) => z === 'counter' && move(id)} onHoverZone={(z) => setHover(z === 'counter')}>
                  <Coin size={54} />
                </Draggable>
              ) : (
                <span key={id} className="relative" data-testid="purse-coin-static">
                  <Coin size={54} />
                  {phase === 'count' && (hint || reveal) && <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">{idx + 1}</span>}
                </span>
              ),
            )}
            {purseCoins.length === 0 && <span className="self-center text-xl text-slate-400">{t('empty!', 'khaali!')}</span>}
          </div>
        </div>
      </div>

      {note && (
        <div className="anim-pop-in rounded-2xl bg-orange-100 px-5 py-2 text-xl font-semibold text-orange-800" role="status" data-testid="shop-note">
          {note}
        </div>
      )}

      {phase === 'pay' ? (
        <DoneButton onClick={finishPay} disabled={locked || n === 0} testId="shop-pay">
          {spend ? t('Pay', 'Pay karo') : t('All in my purse', 'Sab purse mein')}
        </DoneButton>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="text-2xl font-bold">{spend ? t('How many coins are left in your purse?', 'Purse mein kitne coins bache?') : t('How many coins are in your purse now?', 'Ab purse mein kitne coins hain?')}</div>
          <NumberChoices options={q.options} mode={mode} locked={locked} wrongCount={wrongCount} correct={answer} reveal={reveal} onSubmit={(v) => onSubmit({ type: 'number', value: v })} size={84} />
        </div>
      )}
    </div>
  );
}
