import { useT } from '../app/i18n';
import { navigate } from '../app/router';
import { sfx } from '../app/sfx';
import { useStore } from '../app/store';
import { Mascot, SpeechBubble } from '../art/Mascot';
import { Emoji } from '../components/ui';

export function Welcome() {
  const { state, setState } = useStore();
  const t = useT();
  const greet = t('Hello! I’m Ollie. Let’s go on a maths adventure!', 'Namaste! Main Ollie hoon. Chalo maths adventure pe chalein!');
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-8 p-6 text-center">
      <div className="flex items-end gap-4">
        <Mascot mood="wave" size={190} />
        <SpeechBubble className="mb-16 text-2xl" say={greet}>{greet}</SpeechBubble>
      </div>
      <h1 className="text-5xl font-bold text-slate-800 md:text-6xl">
        Maths Adventure Island <Emoji>🏝️</Emoji>
      </h1>
      {state.profiles.length > 0 ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-2xl text-slate-600">{t('Who is playing?', 'Kaun khel raha hai?')}</p>
          <div className="flex flex-wrap justify-center gap-4">
            {state.profiles.map((p) => (
              <button
                key={p.profile.id}
                className="btn3d btn-white flex min-w-48 flex-col items-center gap-1 px-6 py-4 text-2xl"
                data-testid={`profile-${p.profile.name || 'explorer'}`}
                onClick={() => {
                  sfx('tap');
                  setState((s) => ({ ...s, activeProfileId: p.profile.id }));
                  navigate('/home');
                }}
              >
                <Emoji size={48}>{p.profile.companion}</Emoji>
                {p.profile.name || 'Explorer'}
              </button>
            ))}
          </div>
          <button className="btn3d btn-slate mt-2 px-6 py-3 text-lg" onClick={() => navigate('/setup')} data-testid="add-profile">
            + Add a child (grown-ups)
          </button>
        </div>
      ) : (
        <button className="btn3d btn-green px-12 py-6 text-3xl" onClick={() => navigate('/setup')} data-testid="start">
          Let’s start! ▶
        </button>
      )}
      <p className="max-w-xl text-base text-slate-500">Works without internet. Everything stays on this computer. No ads, no accounts.</p>
    </div>
  );
}
