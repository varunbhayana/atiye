import { useT } from '../app/i18n';
/**
 * Today's Journey (optional, ~10–15 minutes): welcome → counting warm-up → mini lesson →
 * different mini-games → a slightly harder challenge → celebration. The child can stop at any time.
 */
import { useMemo, useState } from 'react';
import { navigate } from '../app/router';
import { spokenName } from '../app/devanagari';
import { speak, usingHindiVoice } from '../app/speech';
import { useActive } from '../app/store';
import { seedFromUrl } from '../app/testHooks';
import { Mascot, SpeechBubble } from '../art/Mascot';
import { TopBar } from '../components/TopBar';
import { Emoji } from '../components/ui';
import { isStruggling } from '../core/adaptive';
import { recommendTopics } from '../core/analytics';
import { createRng, randomSeed } from '../core/rng';
import { planSession, spreadKinds, type PlanItem } from '../core/scheduler';
import { topicLevel } from '../core/state';
import { mathsSubject } from '../subjects/maths';
import { CONCRETE_KINDS, topicDef } from '../subjects/maths/curriculum';
import { MATHS_TOPICS, type MathsTopic } from '../subjects/maths/types';
import { LessonPlayer } from './Learn';
import { SessionRunner } from './SessionRunner';

const LENGTHS = { short: { warm: 1, games: 2, challenge: 1 }, normal: { warm: 2, games: 4, challenge: 1 }, long: { warm: 2, games: 6, challenge: 2 } };

export function buildJourneyPlan(topics: { focus: string; second: string }, cfg: { warm: number; games: number; challenge: number }, levelOf: (t: string) => 1 | 2 | 3 | 4 | 5, struggling: Set<string>, seed: number): PlanItem[] {
  const rng = createRng(seed);
  const common = { levelOf, kindsFor: (t: string, l: 1 | 2 | 3 | 4 | 5) => mathsSubject.kindsFor(t, l), concreteKinds: CONCRETE_KINDS, struggling, rng };
  const warm = planSession({ ...common, topics: ['counting'], count: cfg.warm });
  const focusN = Math.ceil(cfg.games / 2);
  const games = [
    ...planSession({ ...common, topics: [topics.focus], count: focusN, previousKind: warm[warm.length - 1]?.kind }),
  ];
  games.push(...planSession({ ...common, topics: [topics.second], count: cfg.games - focusN, previousKind: games[games.length - 1]?.kind }));
  const challenge = planSession({ ...common, topics: [topics.focus], count: cfg.challenge, previousKind: games[games.length - 1]?.kind }).map((p) => ({ ...p, challenge: true }));
  return [...warm, ...spreadKinds(games, warm[warm.length - 1]?.kind, challenge[0]?.kind), ...challenge];
}

export function Journey() {
  const active = useActive();
  const t = useT();
  const [phase, setPhase] = useState<'welcome' | 'lesson' | 'play'>('welcome');
  const recs = recommendTopics(active, 'maths', MATHS_TOPICS.filter((t) => t !== 'counting'), 2);
  const focus = (recs[0]?.topic ?? 'addition') as MathsTopic;
  const second = (recs[1]?.topic ?? 'shapes') as MathsTopic;
  const cfg = LENGTHS[active.settings.sessionLength];
  const plan = useMemo(
    () =>
      buildJourneyPlan(
        { focus, second },
        cfg,
        (t) => topicLevel(active, 'maths', t),
        new Set(MATHS_TOPICS.filter((t) => isStruggling(active, 'maths', t))),
        seedFromUrl() ?? randomSeed(),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const name = active.profile.name;
  const sayName = spokenName(name, active.profile.nameSay ?? '', usingHindiVoice());
  const journeyLine = t(
    `${name ? `Good to see you, ${name}!` : 'Good to see you!'} Today we’ll warm up with counting, learn about ${topicDef(focus).name.toLowerCase()}, and play some games.`,
    `${name ? `${name}, tumhe dekh ke achha laga!` : 'Tumhe dekh ke achha laga!'} Aaj pehle ginti se warm-up, phir ${topicDef(focus).name.toLowerCase()} seekhenge, aur kuch games khelenge.`,
  );
  const journeySay = t(
    `${sayName ? `Good to see you, ${sayName}!` : 'Good to see you!'} Today we’ll warm up with counting, learn about ${topicDef(focus).name.toLowerCase()}, and play some games.`,
    `${sayName ? `${sayName}, tumhe dekh ke achha laga!` : 'Tumhe dekh ke achha laga!'} Aaj pehle ginti se warm-up, phir ${topicDef(focus).name.toLowerCase()} seekhenge, aur kuch games khelenge.`,
  );

  if (phase === 'play') return <SessionRunner plan={plan} attemptMode="journey" label="Today’s Journey" onExit={() => navigate('/maths')} />;

  return (
    <div className="flex min-h-full flex-col">
      <TopBar title="Today’s Journey" back="/maths" />
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-6 px-6 pb-8">
        {phase === 'welcome' ? (
          <>
            <div className="flex items-end gap-4">
              <Mascot mood="wave" size={170} />
              <SpeechBubble className="mb-14 text-2xl" say={journeySay} autoSay>
                {journeyLine}
              </SpeechBubble>
            </div>
            <ol className="card flex flex-wrap justify-center gap-6 px-8 py-5 text-xl font-semibold">
              <li>🌅 Hello</li>
              <li>🐰 Warm-up</li>
              <li>💡 Learn</li>
              <li>🎮 Games</li>
              <li>⛰️ Challenge</li>
              <li>🎉 Party</li>
            </ol>
            <button
              className="btn3d btn-green px-12 py-5 text-3xl"
              data-testid="journey-go"
              onClick={() => {
                setPhase('lesson');
                speak(t(`Let's learn about ${topicDef(focus).name.toLowerCase()}!`, `Chalo ${topicDef(focus).name.toLowerCase()} seekhte hain!`));
              }}
            >
              {t('Let’s go!', 'Chalo chalein!')} <Emoji>🚀</Emoji>
            </button>
            <button className="text-lg text-slate-500 underline" onClick={() => setPhase('play')} data-testid="journey-skip-lesson">
              {t('Skip the lesson and just play', 'Lesson chhodo, seedha khelo')}
            </button>
          </>
        ) : (
          <LessonPlayer topic={focus} run={0} onComplete={() => setPhase('play')} />
        )}
      </div>
    </div>
  );
}
