/** Game 1 — Count the Animals. Tap each creature to count it, then choose how many. */
import { useEffect, useState } from 'react';
import { useT } from '../app/i18n';
import { sfx } from '../app/sfx';
import { Scenery } from '../art/props';
import { creature } from '../subjects/maths/catalog';
import type { CountQuestion } from '../subjects/maths/types';
import { NumberChoices } from './controls';
import { tapCount } from './logic';
import type { GameProps } from './types';

export function CountGame({ question: q, mode, wrongCount, hint, reveal, locked, reducedMotion, onSubmit, say }: GameProps<CountQuestion>) {
  const c = creature(q.creature);
  const total = q.groups.reduce((s, n) => s + n, 0);
  const firstGroup = q.groups[0]!;
  const t = useT();
  const [order, setOrder] = useState<number[]>([]);
  const [phase, setPhase] = useState<'start' | 'done'>(reducedMotion ? 'done' : 'start');
  const [wobble, setWobble] = useState<number | null>(null);

  // 'together': second group walks in; 'takeaway': some leave
  useEffect(() => {
    if (reducedMotion || q.variant === 'count') {
      setPhase('done');
      return;
    }
    const t = window.setTimeout(() => {
      setPhase('done');
      sfx('whoosh');
    }, 1300);
    return () => window.clearTimeout(t);
  }, [q.variant, reducedMotion]);

  const leavingFrom = total - q.leaving; // the last `leaving` creatures leave
  const isLeaving = (i: number) => q.variant === 'takeaway' && i >= leavingFrom;
  const isVisible = (i: number) => {
    if (q.variant === 'together') return i < firstGroup || phase === 'done';
    return true;
  };
  const countable = (i: number) => isVisible(i) && !(isLeaving(i) && phase === 'done');
  const showRevealCount = reveal || (hint && mode === 'practice');
  const emojiSize = total <= 5 ? 76 : total <= 10 ? 62 : total <= 15 ? 52 : 46;

  const tap = (i: number) => {
    if (!countable(i) || locked) return;
    if (order.includes(i)) {
      setWobble(i);
      window.setTimeout(() => setWobble(null), 500);
      return;
    }
    const next = tapCount(order, i);
    setOrder(next);
    sfx('count');
    say(String(next.length));
  };

  const answer = q.variant === 'takeaway' ? total - q.leaving : total;
  const revealNumbers = new Map<number, number>();
  if (showRevealCount && reveal) {
    let k = 0;
    q.placements.forEach((_, i) => {
      if (countable(i)) revealNumbers.set(i, ++k);
    });
  }

  return (
    <div className="flex h-full w-full flex-col items-center gap-4">
      <div className="relative w-full max-w-5xl flex-1" style={{ minHeight: 300 }} data-testid="count-scene">
        <Scenery scene={c.scene} />
        {q.variant === 'together' && (
          <div className="pointer-events-none absolute inset-y-4 left-1/2 w-1 -translate-x-1/2 rounded bg-white/60" aria-hidden />
        )}
        {q.placements.map((p, i) => {
          if (!isVisible(i)) return null;
          const counted = order.indexOf(i);
          const gone = isLeaving(i) && phase === 'done';
          const arriving = q.variant === 'together' && i >= firstGroup;
          const num = revealNumbers.get(i) ?? (counted >= 0 ? counted + 1 : null);
          return (
            <button
              key={i}
              data-testid={gone ? `gone-${i}` : `creature-${i}`}
              aria-label={gone ? `${c.one} that left` : `${c.one} ${i + 1}${counted >= 0 ? `, counted as ${counted + 1}` : ''}`}
              onClick={() => tap(i)}
              disabled={gone || locked}
              className={`absolute rounded-full p-1 transition-opacity duration-700 ${gone ? 'opacity-30 grayscale' : ''} ${hint && counted < 0 && !gone ? 'anim-pulse-ring' : ''}`}
              style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)' }}
            >
              <span
                className="block"
                style={{
                  animation: arriving
                    ? `walkIn 0.9s ease-out ${(i - firstGroup) * 0.08}s both`
                    : q.moving && !reducedMotion && !gone
                      ? `bob ${2.2 + (i % 4) * 0.4}s ease-in-out ${i * 0.2}s infinite`
                      : undefined,
                }}
              >
                <span className={`emoji block ${wobble === i ? 'anim-wiggle' : ''}`} style={{ fontSize: emojiSize * p.scale, transform: p.flip ? 'scaleX(-1)' : undefined }}>
                  {c.emoji}
                </span>
              </span>
              {gone && <span className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-red-500/80">✕</span>}
              {num !== null && !gone && (
                <span className="anim-pop-in absolute -right-1 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-yellow-300 text-lg font-bold text-slate-800 shadow" data-testid="count-badge">
                  {num}
                </span>
              )}
            </button>
          );
        })}
        {q.variant !== 'count' && (
          <div className="absolute left-3 top-3 flex gap-2 text-2xl font-bold">
            {q.variant === 'together' ? (
              <>
                <span className="rounded-full bg-white/90 px-4 py-1">{q.groups[0]}</span>
                {phase === 'done' && <span className="anim-pop-in rounded-full bg-white/90 px-4 py-1">+ {q.groups[1]}</span>}
              </>
            ) : (
              <>
                <span className="rounded-full bg-white/90 px-4 py-1">{total}</span>
                {phase === 'done' && <span className="anim-pop-in rounded-full bg-white/90 px-4 py-1">− {q.leaving}</span>}
              </>
            )}
          </div>
        )}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xl font-bold shadow" aria-live="polite" data-testid="count-indicator">
          <span>{t('Counted:', 'Gine:')}</span>
          <span className="text-2xl text-orange-500">{order.length}</span>
          {order.length > 0 && !locked && (
            <button className="ml-2 rounded-full bg-slate-200 px-3 py-1 text-sm" onClick={() => setOrder([])} aria-label="Count again">
              ↺
            </button>
          )}
        </div>
      </div>
      <NumberChoices options={q.options} mode={mode} locked={locked} wrongCount={wrongCount} correct={answer} reveal={reveal} onSubmit={(n) => onSubmit({ type: 'number', value: n })} />
    </div>
  );
}
