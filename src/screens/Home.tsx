import { useT } from '../app/i18n';
/** Home: choose a subject. Maths is available; other subjects are honestly marked "Coming soon". */
import { useState } from 'react';
import { navigate } from '../app/router';
import { sfx } from '../app/sfx';
import { spokenName } from '../app/devanagari';
import { speak, usingHindiVoice } from '../app/speech';
import { useActive } from '../app/store';
import { Mascot, SpeechBubble } from '../art/Mascot';
import { TopBar } from '../components/TopBar';
import { Emoji } from '../components/ui';
import { SUBJECTS } from '../subjects/registry';

export function Home() {
  const active = useActive();
  const t = useT();
  const [soon, setSoon] = useState<string | null>(null);
  const name = active.profile.name;
  const sayName = spokenName(active.profile.name, active.profile.nameSay ?? '', usingHindiVoice());
  const ask = t('What shall we learn today?', 'Aaj kya seekhein?');
  return (
    <div className="flex min-h-full flex-col">
      <TopBar back="/welcome" />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 pb-8">
        <div className="flex items-end gap-4">
          <Mascot mood="wave" size={120} />
          <SpeechBubble className="mb-10 text-2xl" say={`${sayName ? `Hi ${sayName}!` : 'Hi explorer!'} ${ask}`} autoSay>
            {name ? `Hi ${name}! ` : 'Hi explorer! '}
            {ask}
          </SpeechBubble>
        </div>
        <div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-3">
          {SUBJECTS.map((s) => {
            const available = s.status === 'available';
            return (
              <button
                key={s.id}
                data-testid={`subject-${s.id}`}
                aria-label={available ? s.name : `${s.name}, coming soon`}
                onClick={() => {
                  sfx('tap');
                  if (available) navigate(`/${s.id}`);
                  else {
                    setSoon(s.id);
                    speak(t(`${s.name} is coming soon!`, `${s.name} jaldi aa raha hai!`));
                  }
                }}
                className={`card relative flex flex-col items-center justify-center gap-3 p-6 transition ${available ? 'md:col-span-3 md:flex-row md:gap-8 md:py-10 hover:scale-[1.01]' : 'opacity-80 hover:opacity-100'}`}
                style={available ? { background: 'linear-gradient(135deg,#fff7ed,#fed7aa)' } : undefined}
              >
                <span className="flex items-center justify-center rounded-full font-bold text-white" style={{ background: s.color, width: available ? 140 : 90, height: available ? 140 : 90, fontSize: available ? 70 : 44 }}>
                  <span className={s.id === 'hindi' ? '' : 'emoji'}>{s.emoji}</span>
                </span>
                <span className="flex flex-col items-center md:items-start">
                  <span className={`${available ? 'text-5xl' : 'text-2xl'} font-bold text-slate-800`}>{s.name}</span>
                  {available ? (
                    <span className="mt-2 text-2xl text-orange-700">{t('Play on Maths Adventure Island', 'Maths Adventure Island pe khelo')} ▶</span>
                  ) : (
                    <span className="mt-1 rounded-full bg-slate-200 px-3 py-1 text-base font-semibold text-slate-600">Coming soon</span>
                  )}
                </span>
                {soon === s.id && <span className="anim-pop-in absolute right-3 top-3 rounded-full bg-yellow-200 px-3 py-1 text-base font-bold">Soon! 🚧</span>}
              </button>
            );
          })}
        </div>
        <div className="flex justify-center">
          <button className="btn3d btn-purple px-8 py-4 text-2xl" onClick={() => navigate('/stickers')} data-testid="sticker-book">
            <Emoji>📒</Emoji> {t('My sticker book', 'Meri sticker book')}
          </button>
        </div>
      </div>
    </div>
  );
}
