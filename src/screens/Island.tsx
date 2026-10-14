import { useT } from '../app/i18n';
/** Maths Adventure Island — the story world. Every zone is always open; a glow suggests where to go next. */
import { navigate, qs } from '../app/router';
import { sfx } from '../app/sfx';
import { useActive } from '../app/store';
import { Mascot, SpeechBubble } from '../art/Mascot';
import { TopBar } from '../components/TopBar';
import { Emoji } from '../components/ui';
import { recommendTopics } from '../core/analytics';
import { MATHS_TOPIC_DEFS } from '../subjects/maths/curriculum';
import { MATHS_TOPICS } from '../subjects/maths/types';

const ZONE_POS: Record<string, [number, number]> = {
  counting: [17, 30],
  numbers: [40, 17],
  addition: [65, 20],
  subtraction: [84, 42],
  comparison: [62, 47],
  shapes: [37, 47],
  patterns: [15, 63],
  reasoning: [38, 76],
  measurement: [66, 75],
};

export function Island() {
  const active = useActive();
  const t = useT();
  const rec = recommendTopics(active, 'maths', [...MATHS_TOPICS], 1)[0];
  const inProgressTest = active.tests.find((x) => x.status === 'in-progress');
  const recZone = MATHS_TOPIC_DEFS.find((d) => d.id === rec?.topic)?.zone;
  const islandLine = recZone ? t(`Let’s visit ${recZone}!`, `Chalo ${recZone} chalte hain!`) : t('Where shall we go?', 'Kahan chalein?');
  return (
    <div className="flex min-h-full flex-col">
      <TopBar title="Maths Adventure Island" />
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 pb-6 lg:flex-row">
        {/* the island map */}
        <div className="relative min-h-[460px] flex-1 overflow-hidden rounded-[36px] shadow-xl" style={{ background: 'radial-gradient(ellipse at 50% 55%, #67e8f9 0%, #22d3ee 40%, #0284c7 100%)' }} data-testid="island-map">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <path d="M8 40 C6 18 30 6 52 8 C76 9 96 22 94 46 C97 70 84 94 56 92 C30 95 6 84 7 62 C5 52 9 46 8 40Z" fill="#fde68a" />
            <path d="M12 41 C11 22 32 12 52 13 C73 14 90 25 89 46 C91 67 80 88 56 87 C33 89 12 80 12 62 C10 53 13 47 12 41Z" fill="#86efac" />
            <path d="M20 38 Q40 30 62 22 M40 20 Q38 48 37 50 Q50 60 62 50 Q75 44 84 44 M37 52 Q25 60 16 64 M37 52 Q38 66 38 78 Q52 78 66 77" stroke="#fef3c7" strokeWidth="1.6" strokeDasharray="2 1.6" fill="none" />
          </svg>
          <span className="emoji anim-sway absolute left-[3%] top-[6%] text-4xl" aria-hidden>
            ⛵
          </span>
          <span className="emoji absolute bottom-[4%] right-[4%] text-4xl" aria-hidden>
            🐳
          </span>
          {MATHS_TOPIC_DEFS.map((z) => {
            const [x, y] = ZONE_POS[z.id]!;
            const stars = active.rewards.zoneStars[z.id] ?? 0;
            const suggested = rec?.topic === z.id;
            const level = active.topics.maths?.[z.id]?.level ?? 1;
            return (
              <button
                key={z.id}
                data-testid={`zone-${z.id}`}
                onClick={() => {
                  sfx('tap');
                  navigate(`/maths/zone/${z.id}`);
                }}
                className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                style={{ left: `${x}%`, top: `${y}%` }}
                aria-label={`${z.zone}${suggested ? ', suggested next' : ''}`}
              >
                <span className={`flex h-20 w-20 items-center justify-center rounded-full bg-white text-5xl shadow-lg transition group-hover:scale-110 ${suggested ? 'anim-pulse-ring' : ''}`}>
                  <span className="emoji">{z.zoneEmoji}</span>
                </span>
                <span className="mt-1 whitespace-nowrap rounded-full bg-white/95 px-3 py-0.5 text-base font-bold text-slate-800 shadow">{z.zone}</span>
                <span className="text-sm font-semibold text-slate-700">
                  Lv {level} {stars > 0 ? `· ${'🚩'.repeat(Math.min(stars, 3))}` : ''}
                </span>
              </button>
            );
          })}
        </div>

        {/* adventures */}
        <div className="flex w-full flex-col gap-4 lg:w-80">
          <div className="flex items-end gap-2">
            <Mascot mood="idle" size={80} />
            <SpeechBubble className="mb-6 text-lg" say={islandLine} autoSay>
              {islandLine}
            </SpeechBubble>
          </div>
          <button className="btn3d btn-yellow flex items-center gap-3 px-5 py-5 text-left text-2xl" onClick={() => navigate('/maths/journey')} data-testid="start-journey">
            <Emoji size={40}>🌅</Emoji>
            <span>
              {t('Today’s Journey', 'Aaj ka Safar')}
              <span className="block text-base font-medium">{t('A short adventure, 10–15 min', 'Chhota sa adventure, 10–15 min')}</span>
            </span>
          </button>
          <button className="btn3d btn-pink flex items-center gap-3 px-5 py-5 text-left text-2xl" onClick={() => navigate('/maths/treasure')} data-testid="start-treasure">
            <Emoji size={40}>🏴‍☠️</Emoji>
            <span>
              {t('Treasure Hunt', 'Khazane ki khoj')}
              <span className="block text-base font-medium">{t('5 stops to the treasure', 'Khazane tak 5 stops')}</span>
            </span>
          </button>
          <button
            className="btn3d btn-blue flex items-center gap-3 px-5 py-5 text-left text-2xl"
            onClick={() => navigate(`/maths/play${qs({ topics: MATHS_TOPICS.join(','), n: 8, label: 'Free play' })}`)}
            data-testid="start-freeplay"
          >
            <Emoji size={40}>🎲</Emoji>
            <span>
              {t('Free Play', 'Free Play')}
              <span className="block text-base font-medium">{t('A mix of all the games', 'Saare games mix mein')}</span>
            </span>
          </button>
          <button className="btn3d btn-purple flex items-center gap-3 px-5 py-5 text-left text-2xl" onClick={() => navigate('/maths/quiz')} data-testid="start-quiz">
            <Emoji size={40}>📝</Emoji>
            <span>
              {inProgressTest ? t('Finish my quiz', 'Quiz pura karo') : t('Quiz time', 'Quiz time')}
              <span className="block text-base font-medium">{inProgressTest ? t('Carry on where you stopped', 'Jahan ruke the wahin se') : t('Set up by a grown-up', 'Bade set karenge')}</span>
            </span>
          </button>
          <button className="btn3d btn-white flex items-center gap-3 px-5 py-4 text-left text-xl" onClick={() => navigate('/stickers')}>
            <Emoji size={32}>📒</Emoji> {t('Sticker book', 'Sticker book')}
          </button>
        </div>
      </div>
    </div>
  );
}
