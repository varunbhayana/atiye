/** Route wrapper: builds a varied plan and runs it. */
import { useMemo, useState } from 'react';
import { navigate } from '../app/router';
import { useActive } from '../app/store';
import { seedFromUrl } from '../app/testHooks';
import { isStruggling } from '../core/adaptive';
import { createRng, randomSeed } from '../core/rng';
import { planSession } from '../core/scheduler';
import { topicLevel } from '../core/state';
import { mathsSubject } from '../subjects/maths';
import { CONCRETE_KINDS } from '../subjects/maths/curriculum';
import { MATHS_TOPICS } from '../subjects/maths/types';
import { SessionRunner } from './SessionRunner';

export function Practice({ query }: { query: URLSearchParams }) {
  const active = useActive();
  const [round, setRound] = useState(0);
  const topics = (query.get('topics') ?? '').split(',').filter((t) => (MATHS_TOPICS as readonly string[]).includes(t));
  const kind = query.get('kind') ?? undefined;
  const n = Math.max(1, Math.min(20, Number(query.get('n') ?? 5) || 5));
  const label = query.get('label') ?? 'Practice';
  const zone = query.get('zone') ?? undefined;
  const mode = query.get('mode') === 'adventure' ? 'adventure' : 'practice';
  const plan = useMemo(() => {
    const rng = createRng((seedFromUrl() ?? randomSeed()) + round);
    const list = topics.length ? topics : [...MATHS_TOPICS];
    if (kind) return Array.from({ length: n }, (_, i) => ({ topic: list[i % list.length]!, kind, level: topicLevel(active, 'maths', list[i % list.length]!) }));
    return planSession({
      topics: list,
      count: n,
      levelOf: (t) => topicLevel(active, 'maths', t),
      kindsFor: (t, l) => mathsSubject.kindsFor(t, l),
      concreteKinds: CONCRETE_KINDS,
      struggling: new Set(list.filter((t) => isStruggling(active, 'maths', t))),
      rng,
    });
    // plan once per round
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);
  const back = zone ? `/maths/zone/${zone}` : '/maths';
  return <SessionRunner key={round} plan={plan} attemptMode={mode} label={label} zone={zone} onExit={() => navigate(back)} onPlayAgain={() => setRound((r) => r + 1)} />;
}
