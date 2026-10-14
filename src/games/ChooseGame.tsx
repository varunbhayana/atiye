/** Game 13 — Look & Choose: more/fewer, bigger/smaller, longer/shorter, heavier/lighter, day/night, routines, odd one out, position. */
import { solveChoose } from '../subjects/maths/answers';
import type { ChooseOption, ChooseQuestion } from '../subjects/maths/types';
import { DoneButton, Dots, useChoice } from './controls';
import type { GameProps } from './types';

const UNIT = 40;

function OptionVisual({ o, q, hint }: { o: ChooseOption; q: ChooseQuestion; hint: boolean }) {
  const v = o.visual;
  switch (v.type) {
    case 'number':
      return <span className="text-7xl font-bold text-slate-800">{v.n}</span>;
    case 'symbol': {
      const words = { '<': 'less than', '>': 'more than', '=': 'the same as' };
      return (
        <span className="flex flex-col items-center">
          <span className="text-7xl font-bold text-emerald-600">{v.symbol}</span>
          <span className="text-lg font-semibold text-slate-500">{words[v.symbol]}</span>
        </span>
      );
    }
    case 'group':
      return (
        <span className="flex flex-col items-center gap-2">
          <span className="grid grid-cols-5 gap-1">
            {Array.from({ length: v.count }, (_, i) => (
              <span key={i} className="emoji text-4xl">
                {v.emoji}
              </span>
            ))}
          </span>
          {hint && <span className="rounded-full bg-yellow-200 px-3 text-xl font-bold">{v.count}</span>}
        </span>
      );
    case 'sized':
      return (
        <span className="flex h-40 items-end justify-center">
          <span className="emoji" style={{ fontSize: (v.size / 100) * 140 }}>
            {v.emoji}
          </span>
        </span>
      );
    case 'bar':
      return q.variant === 'height' ? (
        <span className="flex flex-col items-center justify-end" style={{ height: 9 * UNIT * 0.9 + 60 }}>
          <span className="emoji text-5xl">{v.emoji}</span>
          <span className="block w-4 rounded-b-md" style={{ height: v.length * UNIT * 0.9, background: '#16a34a' }} />
          {hint && <span className="mt-1 rounded-full bg-yellow-200 px-2 text-lg font-bold">{v.length}</span>}
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <span className="block h-8 rounded-full" style={{ width: v.length * UNIT, background: v.color }} />
          <span className="emoji text-4xl">{v.emoji}</span>
          {hint && <span className="rounded-full bg-yellow-200 px-2 text-lg font-bold">{v.length}</span>}
        </span>
      );
    case 'emoji': {
      const showLabel = q.variant === 'day-night' || q.variant === 'weight' || q.variant === 'routine';
      return (
        <span className="flex flex-col items-center gap-1">
          <span className="emoji text-8xl">{v.emoji}</span>
          {showLabel && <span className="text-lg font-semibold capitalize text-slate-600">{v.label}</span>}
        </span>
      );
    }
  }
}

function Scene({ q, chosen }: { q: ChooseQuestion; chosen: string | null }) {
  if (q.variant === 'symbol' && q.scene) {
    const sym = chosen ? q.options.find((o) => o.id === chosen)?.visual : null;
    return (
      <div className="card flex items-center gap-6 px-10 py-4" data-testid="symbol-scene">
        <div className="flex flex-col items-center gap-2">
          <span className="text-7xl font-bold">{q.scene.left}</span>
          {(q.scene.left ?? 0) <= 10 && <Dots n={q.scene.left ?? 0} />}
        </div>
        <span className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-dashed border-emerald-400 text-6xl font-bold text-emerald-600">{sym && sym.type === 'symbol' ? sym.symbol : '?'}</span>
        <div className="flex flex-col items-center gap-2">
          <span className="text-7xl font-bold">{q.scene.right}</span>
          {(q.scene.right ?? 0) <= 10 && <Dots n={q.scene.right ?? 0} color="#3b82f6" />}
        </div>
        <span className="emoji ml-4 text-6xl" title="The crocodile eats the bigger number">
          🐊
        </span>
      </div>
    );
  }
  if (q.variant === 'measure' && q.scene?.measureLength) {
    const L = q.scene.measureLength;
    const ruler = Math.max(L + 2, 8);
    return (
      <div className="card flex flex-col items-start gap-1 px-8 py-6" data-testid="measure-scene">
        <div className="flex items-center" style={{ width: L * 52 }}>
          <span className="block h-10 flex-1 rounded-l-full bg-gradient-to-r from-lime-400 to-green-500" />
          <span className="emoji -ml-2 text-5xl">{q.scene.measureEmoji}</span>
        </div>
        <div className="flex">
          {Array.from({ length: ruler }, (_, i) => (
            <span key={i} className="block h-12 w-[52px] border-2 border-white" style={{ background: i < L ? '#f97316' : '#fed7aa', opacity: i < L ? 1 : 0.5 }} />
          ))}
        </div>
      </div>
    );
  }
  if (q.variant === 'position' && q.scene?.anchor) {
    const at = (pos: string) => q.options.find((o) => o.facts.pos === pos);
    const e = (pos: string) => {
      const o = at(pos);
      return o && o.visual.type === 'emoji' ? o.visual.emoji : '';
    };
    return (
      <div className="card relative h-72 w-[420px]" data-testid="position-scene">
        <span className="emoji absolute left-[38%] top-[2%] text-6xl">{e('on')}</span>
        <span className="emoji absolute left-[30%] top-[25%] text-[120px]">{q.scene.anchor}</span>
        <span className="emoji absolute left-[38%] bottom-[2%] text-6xl">{e('under')}</span>
        <span className="emoji absolute right-[6%] top-[42%] text-6xl">{e('beside')}</span>
        <div className="absolute bottom-[22%] left-6 right-6 h-1 rounded bg-slate-200" />
      </div>
    );
  }
  return null;
}

export function ChooseGame({ question: q, mode, wrongCount, hint, reveal, locked, onSubmit }: GameProps<ChooseQuestion>) {
  const answer = solveChoose(q);
  const c = useChoice<string>(mode, locked, wrongCount, (id) => onSubmit({ type: 'choice', value: id }));
  const horizontal = q.variant === 'length';
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6">
      <Scene q={q} chosen={mode === 'test' ? c.selected : reveal ? answer : null} />
      <div className={`flex ${horizontal ? 'flex-col' : 'flex-wrap'} items-center justify-center gap-5`} role="group" aria-label="Choices">
        {q.options.map((o, i) => {
          const out = c.ruledOut.includes(o.id);
          const show = reveal && o.id === answer;
          return (
            <button
              key={o.id}
              data-testid={`option-${o.id}`}
              aria-label={`choice ${i + 1}`}
              onClick={() => c.choose(o.id)}
              disabled={locked && !show}
              className={`card flex min-h-32 min-w-40 items-center ${horizontal ? 'w-[520px] justify-start' : 'justify-center'} px-6 py-4 transition ${c.selected === o.id ? 'ring-8 ring-blue-400' : ''} ${show ? 'anim-pulse-ring ring-8 ring-green-400' : ''} ${out ? 'opacity-30' : 'hover:scale-[1.03]'}`}
            >
              <OptionVisual o={o} q={q} hint={hint || reveal} />
            </button>
          );
        })}
      </div>
      {mode === 'test' && <DoneButton onClick={c.commit} disabled={c.selected === null || locked} />}
    </div>
  );
}
