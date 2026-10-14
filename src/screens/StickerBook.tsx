/** Sticker album, badges and island friends — earned by playing, in a fixed order (no random loot). */
import { useActive } from '../app/store';
import { TopBar } from '../components/TopBar';
import { Emoji } from '../components/ui';
import { ACHIEVEMENTS, FRIENDS, STICKER_ALBUM } from '../core/achievements';

export function StickerBook() {
  const active = useActive();
  const have = new Set(active.rewards.stickers);
  const badges = new Map(active.rewards.achievements.map((a) => [a.id, a.ts]));
  return (
    <div className="flex min-h-full flex-col">
      <TopBar title="My sticker book" back="/home" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pb-10">
        <section className="card p-6" data-testid="sticker-album">
          <h2 className="text-2xl font-bold">
            Stickers <span className="text-slate-500">({have.size}/{STICKER_ALBUM.length})</span>
          </h2>
          <p className="text-slate-600">Finish a game session to get the next sticker.</p>
          <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
            {STICKER_ALBUM.map((s, i) => (
              <div key={s} className={`flex aspect-square items-center justify-center rounded-3xl ${have.has(s) ? 'bg-amber-50 shadow-inner' : 'border-4 border-dashed border-slate-200'}`}>
                {have.has(s) ? <Emoji size={48}>{s}</Emoji> : <span className="text-2xl font-bold text-slate-300">{i + 1}</span>}
              </div>
            ))}
          </div>
        </section>
        <section className="card p-6">
          <h2 className="text-2xl font-bold">Badges</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ACHIEVEMENTS.map((a) => {
              const got = badges.has(a.id);
              return (
                <div key={a.id} className={`flex items-center gap-3 rounded-3xl p-3 ${got ? 'bg-violet-50' : 'bg-slate-50 opacity-60'}`} data-testid={`badge-${a.id}`} data-earned={got}>
                  <span className={got ? '' : 'grayscale'}>
                    <Emoji size={44}>{a.emoji}</Emoji>
                  </span>
                  <span>
                    <span className="block text-lg font-bold">{a.name}</span>
                    <span className="block text-sm text-slate-600">{a.description}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </section>
        <section className="card p-6">
          <h2 className="text-2xl font-bold">Island friends</h2>
          <div className="mt-4 flex flex-wrap gap-4">
            {FRIENDS.map((f) => {
              const got = have.size >= f.stickers;
              return (
                <div key={f.name} className={`flex w-40 flex-col items-center rounded-3xl p-4 text-center ${got ? 'bg-sky-50' : 'bg-slate-50'}`}>
                  <span className={got ? 'anim-bob' : 'opacity-30 grayscale'}>
                    <Emoji size={60}>{f.emoji}</Emoji>
                  </span>
                  <span className="mt-1 font-bold">{got ? f.name : '???'}</span>
                  {!got && <span className="text-sm text-slate-500">{f.stickers} stickers</span>}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
