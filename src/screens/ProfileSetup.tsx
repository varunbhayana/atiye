/** First-time setup (done with a grown-up): name, age, class, difficulty, sound. */
import { useState } from 'react';
import { navigate } from '../app/router';
import { useStore } from '../app/store';
import { Mascot } from '../art/Mascot';
import { Emoji } from '../components/ui';
import { AGES, CLASS_LEVELS, createProfile, supportInfo, type ClassLevel, type DifficultyPref } from '../core/state';
import { MATHS_TOPICS } from '../subjects/maths/types';

const BUDDIES = ['🦉', '🐯', '🐼', '🦄', '🐸', '🐙'];

export function ProfileSetup() {
  const { state, setState } = useStore();
  const [name, setName] = useState('');
  const [age, setAge] = useState(5);
  const [cls, setCls] = useState<ClassLevel>('ukg');
  const [difficulty, setDifficulty] = useState<DifficultyPref>('standard');
  const [sound, setSound] = useState(true);
  const [language, setLanguage] = useState<'en' | 'hinglish' | 'hindi'>('hindi');
  const [buddy, setBuddy] = useState('🦉');
  const support = supportInfo(age, cls);

  const create = () => {
    const data = createProfile({ name, age, schoolClass: cls, companion: buddy, settings: { difficulty, sound, voice: sound, language } }, { maths: [...MATHS_TOPICS] });
    setState((s) => ({ ...s, profiles: [...s.profiles, data], activeProfileId: data.profile.id }));
    navigate('/home');
  };

  const chip = (on: boolean) => `rounded-2xl border-4 px-4 py-2 text-xl font-semibold transition ${on ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-transparent bg-white text-slate-700 hover:bg-slate-50'}`;

  return (
    <div className="mx-auto flex min-h-full max-w-4xl flex-col gap-5 p-6">
      <div className="flex items-center gap-4">
        <Mascot mood="happy" size={90} />
        <div>
          <h1 className="text-4xl font-bold">Let’s get ready!</h1>
          <p className="text-lg text-slate-600">A grown-up can help fill this in. You can change it later.</p>
        </div>
      </div>

      <section className="card p-5">
        <label className="text-xl font-bold" htmlFor="child-name">
          Child’s name or nickname <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <input id="child-name" data-testid="name-input" className="mt-2 w-full rounded-2xl border-4 border-slate-200 px-4 py-3 text-2xl outline-none focus:border-blue-400" maxLength={24} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Atiye" />
        <div className="mt-4 text-xl font-bold">Pick a buddy colour</div>
        <div className="mt-2 flex gap-3">
          {BUDDIES.map((b) => (
            <button key={b} className={chip(buddy === b)} onClick={() => setBuddy(b)} aria-pressed={buddy === b} aria-label={`buddy ${b}`}>
              <Emoji size={36}>{b}</Emoji>
            </button>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <div className="text-xl font-bold">Age</div>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Age">
          {AGES.map((a) => (
            <button key={a} role="radio" aria-checked={age === a} className={chip(age === a)} onClick={() => setAge(a)} data-testid={`age-${a}`}>
              {a}
            </button>
          ))}
        </div>
        <div className="mt-4 text-xl font-bold">School class</div>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="School class">
          {CLASS_LEVELS.map((c) => (
            <button key={c.id} role="radio" aria-checked={cls === c.id} className={chip(cls === c.id)} onClick={() => setCls(c.id)} data-testid={`class-${c.id}`}>
              {c.label}
            </button>
          ))}
        </div>
        <p className={`mt-4 rounded-2xl px-4 py-3 text-lg ${support.full ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'}`} data-testid="support-info">
          {support.full ? '✅ ' : 'ℹ️ '}
          {support.message}
        </p>
      </section>

      <section className="card p-5">
        <div className="text-xl font-bold">Ollie’s voice</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {(
            [
              ['hindi', 'Hindi 🇮🇳', 'lang-hindi'],
              ['hinglish', 'Hinglish', 'lang-hinglish'],
              ['en', 'English', 'lang-en'],
            ] as const
          ).map(([v, label, id]) => (
            <button key={v} className={chip(language === v)} onClick={() => setLanguage(v)} aria-pressed={language === v} data-testid={id}>
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-base text-slate-500">Hindi: Ollie speaks Hindi (words on screen stay in simple Hinglish). Hinglish: Hindi–English mix in an Indian-English voice.</p>
      </section>

      <section className="card grid gap-4 p-5 md:grid-cols-2">
        <div>
          <div className="text-xl font-bold">How tricky?</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                ['gentle', 'Gentle 🐢'],
                ['standard', 'Just right 🐰'],
                ['challenge', 'Challenge 🚀'],
              ] as const
            ).map(([v, l]) => (
              <button key={v} className={chip(difficulty === v)} onClick={() => setDifficulty(v)} aria-pressed={difficulty === v}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xl font-bold">Sound and voice</div>
          <div className="mt-2 flex gap-2">
            <button className={chip(sound)} onClick={() => setSound(true)} aria-pressed={sound}>
              🔊 On
            </button>
            <button className={chip(!sound)} onClick={() => setSound(false)} aria-pressed={!sound}>
              🔇 Off
            </button>
          </div>
        </div>
      </section>

      <div className="flex justify-between">
        <button className="btn3d btn-white px-6 py-4 text-xl" onClick={() => navigate(state.profiles.length ? '/welcome' : '/welcome')}>
          Back
        </button>
        <button className="btn3d btn-green px-10 py-4 text-2xl" onClick={create} data-testid="create-profile">
          Start the adventure ▶
        </button>
      </div>
    </div>
  );
}
