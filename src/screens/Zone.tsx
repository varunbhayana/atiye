import { useT } from '../app/i18n';
/** One island zone = one topic: learn it, play a mission, or pick a favourite game. */
import { navigate, qs } from '../app/router';
import { sfx } from '../app/sfx';
import { useActive } from '../app/store';
import { Mascot, SpeechBubble } from '../art/Mascot';
import { TopBar } from '../components/TopBar';
import { Emoji } from '../components/ui';
import { activityDef, kindRulesFor, topicDef } from '../subjects/maths/curriculum';
import type { MathsTopic } from '../subjects/maths/types';

export function Zone({ topic }: { topic: MathsTopic }) {
  const active = useActive();
  const t = useT();
  const def = topicDef(topic);
  const zoneLine = t(`Welcome to ${def.zone}! Pick Learn, a mission, or any game.`, `${def.zone} mein swagat hai! Seekho, mission khelo, ya koi game chuno.`);
  const level = active.topics.maths?.[topic]?.level ?? 1;
  const kinds = [...new Set(kindRulesFor(topic, level).map((r) => r.kind))];
  const n = active.settings.sessionLength === 'short' ? 4 : active.settings.sessionLength === 'long' ? 8 : 5;
  return (
    <div className="flex min-h-full flex-col">
      <TopBar title={def.zone} back="/maths" />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 pb-8">
        <div className="flex flex-wrap items-end gap-4">
          <span className="emoji text-7xl">{def.zoneEmoji}</span>
          <Mascot mood="happy" size={90} />
          <SpeechBubble className="mb-6 text-xl" say={zoneLine} autoSay>
            {zoneLine}
          </SpeechBubble>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <button className="btn3d btn-yellow flex items-center gap-4 px-6 py-6 text-left text-3xl" onClick={() => navigate(`/maths/learn/${topic}`)} data-testid="zone-learn">
            <Emoji size={56}>💡</Emoji>
            <span>
              {t('Learn', 'Seekho')}
              <span className="block text-lg font-medium">{t('Watch, tap and discover', 'Dekho, tap karo, seekho')}</span>
            </span>
          </button>
          <button
            className="btn3d btn-green flex items-center gap-4 px-6 py-6 text-left text-3xl"
            onClick={() => {
              sfx('tap');
              navigate(`/maths/play${qs({ topics: topic, n, label: `${def.zone} mission`, zone: topic, mode: 'adventure' })}`);
            }}
            data-testid="zone-mission"
          >
            <Emoji size={56}>🚩</Emoji>
            <span>
              {t('Play a mission', 'Mission khelo')}
              <span className="block text-lg font-medium">{n} {t('different games', 'alag games')}</span>
            </span>
          </button>
        </div>
        <h2 className="text-2xl font-bold">{t('Or pick a game', 'Ya koi game chuno')}</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {kinds.map((k) => {
            const a = activityDef(k);
            return (
              <button
                key={k}
                className="card flex flex-col items-center gap-2 p-5 text-center transition hover:scale-[1.03]"
                data-testid={`activity-${k}`}
                onClick={() => {
                  sfx('tap');
                  navigate(`/maths/play${qs({ topics: topic, kind: k, n: 4, label: a.name })}`);
                }}
              >
                <Emoji size={56}>{a.emoji}</Emoji>
                <span className="text-xl font-bold">{a.name}</span>
                <span className="text-sm text-slate-500">{a.description}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
