/** Maths Treasure Hunt: 5 stops on a map, each a different mini-game, ending with a treasure chest. */
import { useMemo, useState } from 'react';
import { navigate } from '../app/router';
import { useActive } from '../app/store';
import { seedFromUrl } from '../app/testHooks';
import { ChestSvg } from '../art/props';
import { createRng, randomSeed } from '../core/rng';
import type { PlanItem } from '../core/scheduler';
import { topicLevel } from '../core/state';
import { mathsSubject } from '../subjects/maths';
import type { MathsTopic } from '../subjects/maths/types';
import { SessionRunner } from './SessionRunner';

const STOPS = [
  { name: 'Forest', emoji: '🌲', x: 10, y: 70 },
  { name: 'River', emoji: '🌊', x: 30, y: 35 },
  { name: 'Mountain', emoji: '⛰️', x: 50, y: 65 },
  { name: 'Castle', emoji: '🏰', x: 70, y: 30 },
  { name: 'Treasure Island', emoji: '🏝️', x: 90, y: 62 },
];

const STOP_TOPICS: MathsTopic[][] = [['counting'], ['numbers', 'comparison'], ['addition'], ['shapes', 'patterns'], ['subtraction', 'addition']];

export function planTreasureHunt(levelOf: (t: string) => 1 | 2 | 3 | 4 | 5, seed: number): PlanItem[] {
  const rng = createRng(seed);
  const used = new Set<string>();
  return STOP_TOPICS.map((options) => {
    const topic = rng.pick(options);
    const level = levelOf(topic);
    const kinds = mathsSubject.kindsFor(topic, level);
    const fresh = kinds.filter((k) => !used.has(k));
    const kind = rng.pick(fresh.length ? fresh : kinds);
    used.add(kind);
    return { topic, kind, level };
  });
}

export function TreasureHunt() {
  const active = useActive();
  const [round, setRound] = useState(0);
  const plan = useMemo(() => planTreasureHunt((t) => topicLevel(active, 'maths', t), (seedFromUrl() ?? randomSeed()) + round), [round]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <SessionRunner
      key={round}
      plan={plan}
      attemptMode="adventure"
      label="Treasure Hunt"
      treasureHunt
      onExit={() => navigate('/maths')}
      onPlayAgain={() => setRound((r) => r + 1)}
      summaryExtra={
        <div className="flex flex-col items-center" data-testid="treasure-found">
          <ChestSvg open size={220} />
          <div className="text-3xl font-bold text-amber-700">You found the treasure!</div>
        </div>
      }
      renderBetween={(index, results) => (
        <div className="relative mx-auto mt-2 h-24 w-full max-w-4xl rounded-3xl bg-gradient-to-r from-amber-100 to-sky-100 shadow-inner" aria-label={`Treasure map: stop ${index + 1} of 5`} data-testid="treasure-map">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <path d={`M${STOPS.map((s) => `${s.x} ${s.y}`).join(' L')}`} stroke="#b45309" strokeWidth="1.5" strokeDasharray="3 2" fill="none" vectorEffect="non-scaling-stroke" />
          </svg>
          {STOPS.map((s, i) => {
            const done = results[i] !== null && results[i] !== undefined;
            const here = i === index;
            return (
              <div key={s.name} className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${s.x}%`, top: `${s.y}%` }}>
                <span className={`emoji flex h-12 w-12 items-center justify-center rounded-full text-3xl ${here ? 'anim-pulse-ring bg-yellow-200' : done ? 'bg-green-200' : 'bg-white/80 opacity-70'}`}>{done ? '✅' : s.emoji}</span>
                <span className="text-xs font-bold text-slate-700">{s.name}</span>
              </div>
            );
          })}
        </div>
      )}
    />
  );
}
