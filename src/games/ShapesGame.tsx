/** Game 7 — Shape Detective. Find all the shapes of one kind hiding in a picture (or pick the named shape). */
import { useState } from 'react';
import { sfx } from '../app/sfx';
import { ShapePath } from '../art/props';
import type { SceneShape, ShapesQuestion } from '../subjects/maths/types';
import { DoneButton, useChoice } from './controls';
import { toggleSelect } from './logic';
import type { GameProps } from './types';

function SceneDecor({ items }: { items: SceneShape[] }) {
  const has = (role: string) => items.filter((i) => i.role === role);
  return (
    <g aria-hidden>
      <rect x="0" y="0" width="400" height="190" fill="#bae6fd" />
      <rect x="0" y="190" width="400" height="70" fill="#86efac" />
      {has('flag').length > 0 && <rect x="281" y="86" width="4" height="110" fill="#78716c" />}
      {has('tree trunk').length === 0 && has('tree').length > 0 && <rect x="346" y="198" width="12" height="44" fill="#a16207" opacity="0.55" />}
      {has('balloon').map((b) => (
        <path key={b.id} d={`M${b.x} ${b.y + b.h / 2} C${b.x - 2} ${b.y + b.h / 2 + 20} ${b.x + 4} ${b.y + b.h / 2 + 40} ${b.x} 190`} stroke="#64748b" strokeWidth="1.5" fill="none" />
      ))}
    </g>
  );
}

export function ShapesGame(props: GameProps<ShapesQuestion>) {
  return props.question.variant === 'pick-one' ? <PickOne {...props} /> : <FindAll {...props} />;
}

function FindAll({ question: q, mode, wrongCount, hint, reveal, locked, onSubmit, say }: GameProps<ShapesQuestion>) {
  const [sel, setSel] = useState<string[]>([]);
  const [label, setLabel] = useState<{ id: string; text: string } | null>(null);
  const targets = q.items.filter((i) => i.shape === q.target);
  const hintTarget = hint ? targets.find((t) => !sel.includes(t.id)) : undefined;

  const click = (s: SceneShape) => {
    if (locked) return;
    setSel((x) => toggleSelect(x, s.id));
    sfx('tap');
    if (mode === 'practice') {
      setLabel({ id: s.id, text: s.shape });
      say(`${s.shape}`);
    }
  };

  return (
    <div className="flex h-full w-full flex-col items-center gap-3">
      <div className="card w-full max-w-4xl overflow-hidden p-2">
        <svg viewBox="0 0 400 260" className="h-auto w-full" style={{ maxHeight: '52vh' }} data-testid="shape-scene">
          <SceneDecor items={q.items} />
          {q.items.map((s) => {
            const picked = sel.includes(s.id);
            const show = reveal && s.shape === q.target;
            return (
              <g
                key={s.id}
                role="button"
                tabIndex={locked ? -1 : 0}
                aria-pressed={picked}
                aria-label={`${s.role}${picked ? ', picked' : ''}`}
                data-testid={`shape-${s.id}`}
                data-shape-role={s.role}
                onClick={() => click(s)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), click(s))}
                style={{ cursor: locked ? 'default' : 'pointer' }}
              >
                <ShapePath shape={s.shape} cx={s.x} cy={s.y} w={s.w} h={s.h} color={s.color} stroke={picked || show ? '#2563eb' : '#1e293b'} strokeWidth={picked || show ? 5 : 2.5} />
                {(picked || show) && (
                  <text x={s.x + s.w / 2 - 4} y={s.y - s.h / 2 + 4} fontSize="18" textAnchor="middle" className="emoji" aria-hidden>
                    {show && !picked ? '👉' : '🔍'}
                  </text>
                )}
                {hintTarget?.id === s.id && <circle cx={s.x} cy={s.y} r={Math.max(s.w, s.h) / 2 + 8} fill="none" stroke="#facc15" strokeWidth="4" strokeDasharray="6 5" />}
              </g>
            );
          })}
          {label && mode === 'practice' && (() => {
            const s = q.items.find((i) => i.id === label.id);
            if (!s) return null;
            return (
              <g aria-hidden>
                <rect x={s.x - 42} y={s.y + s.h / 2 + 2} width="84" height="22" rx="11" fill="white" stroke="#cbd5e1" />
                <text x={s.x} y={s.y + s.h / 2 + 18} textAnchor="middle" fontSize="14" fontWeight="700" fill="#1e293b">
                  {label.text}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>
      <div className="flex items-center gap-4">
        <span className="rounded-full bg-white px-5 py-2 text-2xl font-bold shadow" data-testid="picked-count">
          🔍 Picked: {sel.length}
        </span>
        <DoneButton
          disabled={locked || sel.length === 0}
          onClick={() => {
            if (locked) return;
            onSubmit({ type: 'set', value: [...sel].sort() });
            // keep only the correct picks after a wrong try, so the child can keep looking
            if (mode === 'practice' && wrongCount < 2) setSel((x) => x.filter((id) => targets.some((t) => t.id === id)));
          }}
        />
      </div>
    </div>
  );
}

function PickOne({ question: q, mode, wrongCount, reveal, locked, onSubmit }: GameProps<ShapesQuestion>) {
  const c = useChoice<string>(mode, locked, wrongCount, (id) => onSubmit({ type: 'choice', value: id }));
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6">
      <div className="flex flex-wrap justify-center gap-6">
        {q.items.map((s) => {
          const out = c.ruledOut.includes(s.id);
          const show = reveal && s.shape === q.target;
          return (
            <button
              key={s.id}
              data-testid={`shape-${s.id}`}
              aria-label={`shape ${s.id.slice(1)}`}
              onClick={() => c.choose(s.id)}
              disabled={locked && !show}
              className={`card flex h-48 w-48 items-center justify-center transition ${c.selected === s.id ? 'ring-8 ring-blue-400' : ''} ${show ? 'anim-pulse-ring ring-8 ring-green-400' : ''} ${out ? 'opacity-30' : 'hover:scale-105'}`}
            >
              <svg viewBox="0 0 140 140" width="150" height="150" aria-hidden>
                <ShapePath shape={s.shape} cx={70} cy={70} w={s.w} h={s.h} color={s.color} />
              </svg>
            </button>
          );
        })}
      </div>
      {mode === 'test' && <DoneButton onClick={c.commit} disabled={c.selected === null || locked} />}
    </div>
  );
}
