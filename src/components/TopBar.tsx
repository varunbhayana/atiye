import { navigate } from '../app/router';
import { stopSpeaking } from '../app/speech';
import { useStore } from '../app/store';
import { Emoji, StarCount } from './ui';

export function TopBar({ title, back = '/home', onBack, showParent = true }: { title?: string; back?: string; onBack?: () => void; showParent?: boolean }) {
  const { active, updateActive } = useStore();
  const muted = active ? !active.settings.sound && !active.settings.voice : false;
  return (
    <header className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-3">
        <button className="btn3d btn-white flex h-14 items-center gap-2 px-4 text-xl" onClick={() => (onBack ? onBack() : navigate(back))} aria-label="Go back" data-testid="back">
          <Emoji>{back === '/home' ? '🏠' : '⬅️'}</Emoji>
          <span className="hidden sm:inline">{back === '/home' ? 'Home' : 'Back'}</span>
        </button>
        {title && <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">{title}</h1>}
      </div>
      <div className="flex items-center gap-3">
        {active && <StarCount stars={active.rewards.stars} />}
        {active && (
          <button
            className="btn3d btn-white flex h-14 w-14 items-center justify-center text-2xl"
            aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
            aria-pressed={muted}
            data-testid="mute"
            onClick={() => {
              if (!muted) stopSpeaking();
              updateActive((p) => ({ ...p, settings: { ...p.settings, sound: muted, voice: muted } }));
            }}
          >
            <Emoji>{muted ? '🔇' : '🔊'}</Emoji>
          </button>
        )}
        {showParent && (
          <button className="btn3d btn-slate flex h-14 items-center gap-2 px-4 text-lg" onClick={() => navigate('/parent')} aria-label="Grown-ups area" data-testid="parent-button">
            <Emoji>🔒</Emoji>
            <span className="hidden md:inline">Grown-ups</span>
          </button>
        )}
      </div>
    </header>
  );
}
