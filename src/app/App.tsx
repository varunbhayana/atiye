import { useEffect } from 'react';
import { Mascot } from '../art/Mascot';
import { MATHS_TOPICS, type MathsTopic } from '../subjects/maths/types';
import { Home } from '../screens/Home';
import { Island } from '../screens/Island';
import { Journey } from '../screens/Journey';
import { Learn } from '../screens/Learn';
import { ParentDashboard } from '../screens/ParentDashboard';
import { Practice } from '../screens/Practice';
import { ProfileSetup } from '../screens/ProfileSetup';
import { Quiz, QuizResult } from '../screens/Quiz';
import { StickerBook } from '../screens/StickerBook';
import { TreasureHunt } from '../screens/TreasureHunt';
import { Welcome } from '../screens/Welcome';
import { Zone } from '../screens/Zone';
import { navigate, useRoute } from './router';
import { StoreProvider, useStore } from './store';

const isTopic = (t: string | undefined): t is MathsTopic => !!t && (MATHS_TOPICS as readonly string[]).includes(t);

function Screens() {
  const route = useRoute();
  const { active, state, instance, takeOver } = useStore();
  const [a, b, c, d] = route.segments;
  const needsProfile = !['welcome', 'setup'].includes(a ?? '');

  useEffect(() => {
    if (!a) navigate(state.profiles.length && active ? '/home' : '/welcome', { replace: true });
    else if (needsProfile && !active) navigate('/welcome', { replace: true });
  }, [a, active, needsProfile, state.profiles.length]);

  if (instance !== 'primary') {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-6 p-8 text-center">
        <Mascot mood="think" size={140} />
        <h1 className="text-4xl font-bold">{instance === 'paused' ? 'Maths Adventure is open in another window' : 'Maths Adventure is already open'}</h1>
        <p className="max-w-lg text-xl text-slate-600">To keep progress safe, play in one window at a time.</p>
        <button className="btn3d btn-green px-8 py-4 text-2xl" onClick={takeOver} data-testid="use-this-window">
          Play in this window
        </button>
      </div>
    );
  }

  if (!a) return null;
  if (a === 'welcome') return <Welcome />;
  if (a === 'setup') return <ProfileSetup />;
  if (!active) return null;
  if (a === 'home') return <Home />;
  if (a === 'stickers') return <StickerBook />;
  if (a === 'parent') return <ParentDashboard />;
  if (a === 'maths') {
    if (!b) return <Island />;
    if (b === 'zone' && isTopic(c)) return <Zone key={c} topic={c} />;
    if (b === 'learn' && isTopic(c)) return <Learn key={c} topic={c} />;
    if (b === 'play') return <Practice key={route.query.toString()} query={route.query} />;
    if (b === 'journey') return <Journey />;
    if (b === 'treasure') return <TreasureHunt />;
    if (b === 'quiz' && c === 'result' && d) return <QuizResult id={d} />;
    if (b === 'quiz') return <Quiz />;
  }
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4">
      <Mascot mood="think" size={120} />
      <p className="text-2xl">Ollie can’t find that page.</p>
      <button className="btn3d btn-green px-6 py-3 text-xl" onClick={() => navigate('/home')}>
        Go home
      </button>
    </div>
  );
}

export function App() {
  return (
    <StoreProvider>
      <main className="h-full">
        <Screens />
      </main>
    </StoreProvider>
  );
}
