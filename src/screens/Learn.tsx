/**
 * Learn mode: short, replayable, hands-on lessons. The child taps, counts and watches things move
 * before being asked anything. Numbers change each time the lesson is replayed.
 */
import { useEffect, useMemo, useState } from 'react';
import { navigate, qs } from '../app/router';
import { sfx } from '../app/sfx';
import { speak } from '../app/speech';
import { useT } from '../app/i18n';
import { useActive, useStore } from '../app/store';
import { Mascot, SpeechBubble } from '../art/Mascot';
import { FrogSvg, ShapeIcon } from '../art/props';
import { TopBar } from '../components/TopBar';
import { Emoji } from '../components/ui';
import { markLessonDone } from '../core/progress';
import { createRng, randomSeed, type Rng } from '../core/rng';
import { topicLevel } from '../core/state';
import { SHAPES_BY_LEVEL, topicDef } from '../subjects/maths/curriculum';
import { PATTERN_TOKENS } from '../subjects/maths/catalog';
import type { MathsTopic, ShapeName } from '../subjects/maths/types';
import { Token } from '../games/PatternGame';

type Step =
  | { type: 'count'; emoji: string; n: number }
  | { type: 'add'; emoji: string; a: number; b: number }
  | { type: 'sub'; emoji: string; a: number; b: number }
  | { type: 'number'; n: number }
  | { type: 'jump'; start: number; jumps: number; dir: 1 | -1 }
  | { type: 'compare'; emoji: string; a: number; b: number }
  | { type: 'symbol'; a: number; b: number }
  | { type: 'shape'; shape: ShapeName }
  | { type: 'pattern'; set: 'colours' | 'fruits'; unit: string[] }
  | { type: 'contrast'; kind: 'size' | 'tall' }
  | { type: 'daynight' }
  | { type: 'measure'; emoji: string; length: number };

const SHAPE_FACTS: Record<ShapeName, { says: string; hi: string; examples: string }> = {
  circle: { says: 'A circle is round. It has no corners at all!', hi: 'Circle gol hota hai. Iska koi corner nahi hota!', examples: '⚽ 🍪 🕐' },
  square: { says: 'A square has 4 sides, all the same length, and 4 corners.', hi: 'Square ki 4 sides hoti hain, sab barabar, aur 4 corners.', examples: '🔲 🧇 🎁' },
  triangle: { says: 'A triangle has 3 sides and 3 corners.', hi: 'Triangle ki 3 sides aur 3 corners hote hain.', examples: '🍕 ⛺ 🔺' },
  rectangle: { says: 'A rectangle has 4 sides: 2 long and 2 short.', hi: 'Rectangle ki 4 sides: do lambi aur do chhoti.', examples: '🚪 📱 📕' },
  oval: { says: 'An oval is round but stretched, like an egg.', hi: 'Oval gol hai par khincha hua, ande jaisa.', examples: '🥚 🏉 🪞' },
  star: { says: 'A star has 5 points!', hi: 'Star ke 5 points hote hain!', examples: '⭐ 🌟 ✨' },
};

function buildLesson(topic: MathsTopic, level: number, rng: Rng): Step[] {
  const small = (lo: number, hi: number) => rng.int(lo, hi);
  switch (topic) {
    case 'counting':
      return [
        { type: 'count', emoji: rng.pick(['🍎', '🐥', '🌸']), n: small(3, level >= 2 ? 7 : 5) },
        { type: 'count', emoji: rng.pick(['🐞', '⭐', '🐟']), n: small(4, level >= 2 ? 9 : 5) },
      ];
    case 'numbers': {
      const n = small(2, level >= 3 ? 9 : 6);
      return [{ type: 'number', n }, { type: 'jump', start: n, jumps: 1, dir: 1 }];
    }
    case 'addition': {
      const a = small(1, 3);
      const b = small(1, level >= 3 ? 4 : 2);
      return [
        { type: 'add', emoji: rng.pick(['🍎', '🧁', '🐰']), a, b },
        { type: 'jump', start: a, jumps: b, dir: 1 },
      ];
    }
    case 'subtraction': {
      const a = small(3, level >= 3 ? 7 : 5);
      const b = small(1, a - 1);
      return [
        { type: 'sub', emoji: rng.pick(['🍪', '🍓', '🎈']), a, b },
        { type: 'jump', start: a, jumps: b, dir: -1 },
      ];
    }
    case 'comparison': {
      const a = small(2, 5);
      let b = small(2, 6);
      while (b === a) b = small(2, 6);
      return [
        { type: 'compare', emoji: rng.pick(['🐟', '🍓', '⭐']), a, b },
        { type: 'symbol', a: small(1, 9), b: small(1, 9) },
      ];
    }
    case 'shapes':
      return SHAPES_BY_LEVEL[Math.max(1, Math.min(5, level)) as 1].map((shape) => ({ type: 'shape' as const, shape }));
    case 'patterns':
      return [
        { type: 'pattern', set: 'colours', unit: rng.shuffle(PATTERN_TOKENS.colours.map((t) => t.id)).slice(0, 2) },
        { type: 'pattern', set: 'fruits', unit: (() => { const [x, y] = rng.shuffle(PATTERN_TOKENS.fruits.map((t) => t.id)); return [x!, x!, y!]; })() },
      ];
    case 'reasoning':
      return [{ type: 'contrast', kind: 'size' }, { type: 'contrast', kind: 'tall' }];
    case 'measurement':
      return [{ type: 'daynight' }, { type: 'measure', emoji: rng.pick(['🐍', '🐛', '✏️']), length: small(3, 6) }];
  }
}

function Tappables({ n, emoji, counted, onTap, start = 0, crossed = [] as number[] }: { n: number; emoji: string; counted: number[]; onTap: (i: number) => void; start?: number; crossed?: number[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {Array.from({ length: n }, (_, k) => {
        const i = start + k;
        const c = counted.indexOf(i);
        const x = crossed.includes(i);
        return (
          <button key={i} onClick={() => onTap(i)} className={`relative rounded-2xl bg-white p-3 shadow ${x ? 'opacity-30' : ''}`} data-testid={`learn-obj-${i}`} aria-label={`object ${i + 1}`}>
            <Emoji size={60}>{emoji}</Emoji>
            {c >= 0 && !x && <span className="anim-pop-in absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-yellow-300 text-lg font-bold">{c + 1}</span>}
            {x && <span className="absolute inset-0 flex items-center justify-center text-5xl font-bold text-red-500">✕</span>}
          </button>
        );
      })}
    </div>
  );
}

/** One lesson step. Calls onReady when the child has done the interaction. */
function StepView({ step, onReady, say }: { step: Step; onReady: (line: string) => void; say: (t: string) => void }) {
  const t = useT();
  const [counted, setCounted] = useState<number[]>([]);
  const [phase, setPhase] = useState(0);
  const [crossed, setCrossed] = useState<number[]>([]);
  const [pos, setPos] = useState(step.type === 'jump' ? step.start : 0);

  const count = (i: number, total: number, done: string | null) => {
    if (counted.includes(i) || crossed.includes(i)) return;
    const next = [...counted, i];
    setCounted(next);
    sfx('count');
    say(String(next.length));
    if (done && next.length === total) window.setTimeout(() => onReady(done), 500);
  };

  switch (step.type) {
    case 'count':
      return (
        <div className="flex flex-col items-center gap-6">
          <Tappables n={step.n} emoji={step.emoji} counted={counted} onTap={(i) => count(i, step.n, t(`There are ${step.n}! The last number we say tells us how many.`, `${step.n} hain! Jo number aakhir mein bolte hain, utne hi hote hain.`))} />
          {counted.length === step.n && <div className="anim-pop-in text-8xl font-bold text-orange-500">{step.n}</div>}
        </div>
      );
    case 'add': {
      const total = step.a + step.b;
      return (
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-8">
            <Tappables n={step.a} emoji={step.emoji} counted={counted} onTap={(i) => count(i, phase === 0 ? step.a : total, phase === 0 ? null : t(`${step.a} and ${step.b} more makes ${total}. ${step.a} plus ${step.b} equals ${total}!`, `${step.a} aur ${step.b} aur milke ${total} hue. ${step.a} plus ${step.b} barabar ${total}!`))} />
            {phase >= 1 && <span className="text-6xl font-bold">+</span>}
            {phase >= 1 && (
              <div className="anim-walk-in">
                <Tappables n={step.b} emoji={step.emoji} counted={counted} start={step.a} onTap={(i) => count(i, total, t(`${step.a} and ${step.b} more makes ${total}. ${step.a} plus ${step.b} equals ${total}!`, `${step.a} aur ${step.b} aur milke ${total} hue. ${step.a} plus ${step.b} barabar ${total}!`))} />
              </div>
            )}
          </div>
          {phase === 0 && counted.length === step.a && (
            <button
              className="btn3d btn-blue px-6 py-4 text-2xl"
              data-testid="learn-action"
              onClick={() => {
                setPhase(1);
                sfx('whoosh');
                say(t(`Here come ${step.b} more! Keep counting.`, `${step.b} aur aa gaye! Ginte raho.`));
              }}
            >
              {t(`Here come ${step.b} more!`, `${step.b} aur aa rahe hain!`)} ▶
            </button>
          )}
          {counted.length === total && <div className="anim-pop-in text-7xl font-bold">{step.a} + {step.b} = <span className="text-orange-500">{total}</span></div>}
        </div>
      );
    }
    case 'sub': {
      const left = step.a - step.b;
      return (
        <div className="flex flex-col items-center gap-6">
          <Tappables
            n={step.a}
            emoji={step.emoji}
            counted={counted}
            crossed={crossed}
            onTap={(i) => {
              if (phase === 0) {
                if (crossed.includes(i) || crossed.length >= step.b) return;
                const nx = [...crossed, i];
                setCrossed(nx);
                sfx('munch');
                say(`${nx.length}`);
                if (nx.length === step.b) {
                  setPhase(1);
                  window.setTimeout(() => say(t('Now count the ones that are left.', 'Ab jo bache hain unhe gino.')), 600);
                }
              } else count(i, left, t(`${step.a} take away ${step.b} leaves ${left}. ${step.a} minus ${step.b} equals ${left}!`, `${step.a} mein se ${step.b} gaye, ${left} bache. ${step.a} minus ${step.b} barabar ${left}!`));
            }}
          />
          <div className="text-2xl font-semibold">{phase === 0 ? t(`Tap ${step.b} to eat ${step.b === 1 ? 'it' : 'them'}! (${crossed.length}/${step.b})`, `${step.b} pe tap karke khao! (${crossed.length}/${step.b})`) : t('Now count what is left!', 'Ab bache hue gino!')}</div>
          {counted.length === left && phase === 1 && (
            <div className="anim-pop-in text-7xl font-bold">
              {step.a} − {step.b} = <span className="text-orange-500">{left}</span>
            </div>
          )}
        </div>
      );
    }
    case 'number':
      return (
        <div className="flex flex-col items-center gap-6">
          <div className="text-[160px] font-bold leading-none text-orange-500">{step.n}</div>
          <Tappables n={step.n} emoji="🔵" counted={counted} onTap={(i) => count(i, step.n, t(`This is the number ${step.n}. It means ${step.n} things.`, `Ye number ${step.n} hai. Iska matlab ${step.n} cheezein.`))} />
        </div>
      );
    case 'jump': {
      const end = step.start + step.dir * step.jumps;
      const made = Math.abs(pos - step.start);
      const max = Math.max(10, end, step.start);
      return (
        <div className="flex w-full flex-col items-center gap-6">
          <div className="card relative w-full max-w-4xl px-4 pb-4 pt-24">
            <div className="absolute top-4 transition-[left] duration-300" style={{ left: `${4 + (pos / max) * 92}%`, transform: 'translateX(-50%)' }}>
              <div key={pos} className="anim-hop">
                <FrogSvg size={64} />
              </div>
            </div>
            <div className="relative h-16">
              <div className="absolute left-[3%] right-[3%] top-3 h-2 rounded bg-slate-700" />
              {Array.from({ length: max + 1 }, (_, n) => (
                <span key={n} className={`absolute top-0 flex -translate-x-1/2 flex-col items-center text-2xl font-bold ${n === end && made === step.jumps ? 'text-green-600' : ''}`} style={{ left: `${4 + (n / max) * 92}%` }}>
                  <span className="block h-7 w-1.5 bg-slate-700" />
                  {n}
                </span>
              ))}
            </div>
          </div>
          {made < step.jumps ? (
            <button
              className="btn3d btn-green px-8 py-4 text-2xl"
              data-testid="learn-action"
              onClick={() => {
                const p = pos + step.dir;
                setPos(p);
                sfx('jump');
                say(String(made + 1));
                if (made + 1 === step.jumps)
                  window.setTimeout(
                    () =>
                      onReady(
                        step.dir === 1
                          ? t(`We started at ${step.start}, jumped ${step.jumps}, and landed on ${end}. ${step.start} plus ${step.jumps} is ${end}.`, `Hum ${step.start} se shuru hue, ${step.jumps} jump kiye, aur ${end} pe pahunche. ${step.start} plus ${step.jumps} barabar ${end}.`)
                          : t(`We started at ${step.start}, jumped back ${step.jumps}, and landed on ${end}. ${step.start} take away ${step.jumps} is ${end}.`, `Hum ${step.start} se shuru hue, ${step.jumps} jump peeche gaye, aur ${end} pe pahunche. ${step.start} minus ${step.jumps} barabar ${end}.`),
                      ),
                    500,
                  );
              }}
            >
              {step.dir === 1 ? t('Jump forward ➡️', 'Aage jump ➡️') : t('⬅️ Jump back', '⬅️ Peeche jump')} ({made}/{step.jumps})
            </button>
          ) : (
            <div className="anim-pop-in text-6xl font-bold">
              {step.start} {step.dir === 1 ? '+' : '−'} {step.jumps} = <span className="text-green-600">{end}</span>
            </div>
          )}
        </div>
      );
    }
    case 'compare': {
      const more = step.a > step.b ? 'top' : 'bottom';
      return (
        <div className="flex flex-col items-start gap-4">
          {[step.a, step.b].map((n, r) => (
            <div key={r} className="flex items-center gap-2">
              {Array.from({ length: n }, (_, i) => (
                <span key={i} className={`flex h-20 w-20 items-center justify-center rounded-2xl ${phase === 1 && i >= Math.min(step.a, step.b) ? 'anim-pulse-ring bg-yellow-200' : 'bg-white'} shadow`}>
                  <Emoji size={48}>{step.emoji}</Emoji>
                </span>
              ))}
              <span className="ml-4 text-4xl font-bold">{n}</span>
            </div>
          ))}
          {phase === 0 ? (
            <button
              className="btn3d btn-blue self-center px-6 py-4 text-2xl"
              data-testid="learn-action"
              onClick={() => {
                setPhase(1);
                onReady(t(`Line them up! The ${more} row has extra ones left over, so it has more. ${Math.max(step.a, step.b)} is more than ${Math.min(step.a, step.b)}.`, `Line mein lagao! ${more === 'top' ? 'Upar' : 'Neeche'} wali line mein kuch bach gaye, toh usmein zyada hain. ${Math.max(step.a, step.b)}, ${Math.min(step.a, step.b)} se zyada hai.`));
              }}
            >
              {t('Line them up!', 'Line mein lagao!')}
            </button>
          ) : null}
        </div>
      );
    }
    case 'symbol': {
      const s = step.a > step.b ? '>' : step.a < step.b ? '<' : '=';
      return (
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-8 text-8xl font-bold">
            <span>{step.a}</span>
            <span className={`flex h-32 w-32 items-center justify-center rounded-3xl ${phase ? 'bg-green-100 text-green-600' : 'border-4 border-dashed border-slate-300'}`}>{phase ? s : <Emoji size={70}>🐊</Emoji>}</span>
            <span>{step.b}</span>
          </div>
          {!phase && (
            <button
              className="btn3d btn-green px-6 py-4 text-2xl"
              data-testid="learn-action"
              onClick={() => {
                setPhase(1);
                sfx('munch');
                onReady(s === '=' ? t('They are the same, so we use the equals sign.', 'Dono barabar hain, isliye equals ka sign lagate hain.') : t(`The hungry crocodile always opens its mouth to the bigger number: ${Math.max(step.a, step.b)}!`, `Bhookha magarmach hamesha bade number ki taraf muh kholta hai: ${Math.max(step.a, step.b)}!`));
              }}
            >
              {t('Feed the crocodile', 'Magarmach ko khilao')} 🐊
            </button>
          )}
        </div>
      );
    }
    case 'shape': {
      const f = SHAPE_FACTS[step.shape];
      return (
        <div className="flex flex-col items-center gap-4">
          <button
            className="card p-6"
            data-testid="learn-action"
            onClick={() => {
              sfx('tap');
              onReady(t(`This is a ${step.shape}. ${f.says}`, `Ye ${step.shape} hai. ${f.hi}`));
            }}
          >
            <ShapeIcon shape={step.shape} color="#f97316" size={200} />
          </button>
          <div className="text-5xl font-bold capitalize">{step.shape}</div>
          <div className="emoji text-6xl">{f.examples}</div>
        </div>
      );
    }
    case 'pattern': {
      const shown = 4 + phase;
      const items = Array.from({ length: Math.min(shown, step.unit.length * 3) }, (_, i) => step.unit[i % step.unit.length]!);
      return (
        <div className="flex flex-col items-center gap-6">
          <div className="card flex flex-wrap items-center justify-center gap-3 p-5">
            {items.map((t, i) => (
              <span key={i} className={i >= 4 ? 'anim-pop-in' : ''}>
                <Token set={step.set} id={t} size={76} />
              </span>
            ))}
          </div>
          {shown < step.unit.length * 3 ? (
            <button
              className="btn3d btn-purple px-6 py-4 text-2xl"
              data-testid="learn-action"
              onClick={() => {
                setPhase((p) => p + 1);
                sfx('tap');
                if (shown + 1 >= step.unit.length * 3) onReady(t('The same part keeps repeating. That’s a pattern!', 'Wahi hissa baar-baar aata hai. Isko pattern kehte hain!'));
              }}
            >
              {t('What comes next?', 'Aage kya aayega?')} ▶
            </button>
          ) : null}
        </div>
      );
    }
    case 'contrast': {
      const pairs =
        step.kind === 'size'
          ? [
              { label: t('BIG', 'BADA'), node: <Emoji size={150}>🐘</Emoji> },
              { label: t('small', 'chhota'), node: <Emoji size={60}>🐘</Emoji> },
            ]
          : [
              { label: t('TALL', 'LAMBA'), node: <span className="flex flex-col items-center"><Emoji size={56}>🌻</Emoji><span className="block h-56 w-4 bg-green-600" /></span> },
              { label: t('short', 'chhota'), node: <span className="flex flex-col items-center"><Emoji size={56}>🌻</Emoji><span className="block h-16 w-4 bg-green-600" /></span> },
            ];
      return (
        <div className="flex items-end gap-16">
          {pairs.map((p, i) => (
            <button
              key={i}
              className="card flex flex-col items-center justify-end gap-2 p-6"
              data-testid={i === 1 ? 'learn-action' : undefined}
              style={{ minHeight: 320 }}
              onClick={() => {
                say(p.label.toLowerCase());
                if (!counted.includes(i)) {
                  const nx = [...counted, i];
                  setCounted(nx);
                  if (nx.length === 2) onReady(step.kind === 'size' ? t('One is big and one is small!', 'Ek bada hai aur ek chhota!') : t('One is tall and one is short!', 'Ek lamba hai aur ek chhota!'));
                }
              }}
            >
              {p.node}
              <span className="text-3xl font-bold">{p.label}</span>
            </button>
          ))}
        </div>
      );
    }
    case 'daynight': {
      const night = phase % 2 === 1;
      return (
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-72 w-[560px] items-center justify-around rounded-[36px] transition-colors duration-700" style={{ background: night ? '#1e1b4b' : '#7dd3fc' }}>
            <Emoji size={110}>{night ? '🌙' : '☀️'}</Emoji>
            <Emoji size={70}>{night ? '😴' : '🏫'}</Emoji>
            <Emoji size={60}>{night ? '🦉' : '🌻'}</Emoji>
          </div>
          <button
            className="btn3d btn-purple px-6 py-4 text-2xl"
            data-testid="learn-action"
            onClick={() => {
              setPhase((p) => p + 1);
              sfx('whoosh');
              const nowNight = !night;
              say(nowNight ? t('Night time: the moon is out and we sleep.', 'Raat ho gayi: chaand nikla aur hum sote hain.') : t('Day time: the sun is up and we play and go to school.', 'Din ho gaya: suraj nikla, hum khelte hain aur school jaate hain.'));
              if (phase >= 1) onReady(t('In the day the sun shines. At night we see the moon and stars.', 'Din mein suraj chamakta hai. Raat mein chaand aur taare dikhte hain.'));
            }}
          >
            {night ? t('Make it day ☀️', 'Din karo ☀️') : t('Make it night 🌙', 'Raat karo 🌙')}
          </button>
        </div>
      );
    }
    case 'measure':
      return (
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center" style={{ width: step.length * 64 }}>
            <span className="block h-10 flex-1 rounded-l-full bg-gradient-to-r from-lime-400 to-green-500" />
            <Emoji size={56}>{step.emoji}</Emoji>
          </div>
          <div className="flex">
            {Array.from({ length: step.length }, (_, i) => (
              <button key={i} onClick={() => count(i, step.length, t(`It is ${step.length} blocks long! We measured it with blocks.`, `Ye ${step.length} blocks lamba hai! Humne blocks se naapa.`))} className="relative h-16 w-16 border-2 border-white bg-orange-400" data-testid={`learn-obj-${i}`} aria-label={`block ${i + 1}`}>
                {counted.includes(i) && <span className="text-2xl font-bold text-white">{counted.indexOf(i) + 1}</span>}
              </button>
            ))}
          </div>
          <div className="text-xl text-slate-600">{t('Tap each block to measure', 'Naapne ke liye har block pe tap karo')}</div>
        </div>
      );
  }
}

export const STEP_INTRO: Record<Step['type'], [string, string]> = {
  count: ['Let’s count together! Tap each one.', 'Chalo saath mein ginte hain! Har ek pe tap karo.'],
  add: ['Let’s add! Count these first.', 'Chalo jodte hain! Pehle inhe gino.'],
  sub: ['Let’s take some away!', 'Chalo kuch hatate hain!'],
  number: ['Let’s meet a number! Tap the dots to count.', 'Ek number se milte hain! Dots pe tap karke gino.'],
  jump: ['Help the frog jump!', 'Frog ko jump karne mein help karo!'],
  compare: ['Which row has more?', 'Kis line mein zyada hain?'],
  symbol: ['Meet the hungry crocodile!', 'Bhookhe magarmach se milo!'],
  shape: ['Tap the shape to learn about it.', 'Shape pe tap karke uske baare mein jaano.'],
  pattern: ['Look at this pattern!', 'Ye pattern dekho!'],
  contrast: ['Tap each one.', 'Har ek pe tap karo.'],
  daynight: ['Day and night!', 'Din aur raat!'],
  measure: ['How long is it? Let’s measure with blocks!', 'Ye kitna lamba hai? Chalo blocks se naapte hain!'],
};

/** Plays a topic's lesson steps; calls onComplete when the last step is finished. */
export function LessonPlayer({ topic, run, onComplete }: { topic: MathsTopic; run: number; onComplete: () => void }) {
  const active = useActive();
  const steps = useMemo(() => buildLesson(topic, topicLevel(active, 'maths', topic), createRng(randomSeed() + run)), [topic, run]); // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(0);
  const [line, setLine] = useState<string | null>(null);
  const voice = active.settings.voice;
  const say = (t: string) => voice && speak(t);
  const step = steps[i];
  const intro = (type: Step['type']) => STEP_INTRO[type][active.settings.language === 'en' ? 0 : 1];
  const t = useT();

  useEffect(() => {
    if (step) say(intro(step.type));
    setLine(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, run]);

  if (!step) return null;
  return (
    <div className="flex w-full flex-1 flex-col items-center gap-6">
      <div className="flex items-end gap-3 self-start">
        <Mascot mood={line ? 'happy' : 'idle'} size={90} />
        <SpeechBubble className="mb-6 text-xl" say={line ?? intro(step.type)}>
          <span data-testid="learn-line">{line ?? intro(step.type)}</span>
        </SpeechBubble>
      </div>
      <div className="flex min-h-[360px] w-full flex-1 items-center justify-center" key={`${run}-${i}`}>
        <StepView
          step={step}
          say={say}
          onReady={(l) => {
            setLine(l);
            say(l);
          }}
        />
      </div>
      <div className="flex gap-4">
        <span className="self-center text-lg text-slate-500">
          {t('Step', 'Step')} {i + 1} / {steps.length}
        </span>
        <button
          className="btn3d btn-green px-8 py-4 text-2xl"
          disabled={!line}
          onClick={() => (i + 1 >= steps.length ? onComplete() : setI((x) => x + 1))}
          data-testid="learn-next"
        >
          Next ▶
        </button>
      </div>
    </div>
  );
}

export function Learn({ topic }: { topic: MathsTopic }) {
  const active = useActive();
  const t = useT();
  const { updateActive } = useStore();
  const def = topicDef(topic);
  const [run, setRun] = useState(0);
  const [done, setDone] = useState(false);

  return (
    <div className="flex min-h-full flex-col">
      <TopBar title={`Learn: ${def.name}`} back={`/maths/zone/${topic}`} />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-6 px-6 pb-8">
        {!done ? (
          <LessonPlayer
            key={run}
            topic={topic}
            run={run}
            onComplete={() => {
              setDone(true);
              updateActive((p) => markLessonDone(p, `maths:${topic}`).data);
              sfx('cheer');
              if (active.settings.voice) speak(t('Well done! Now it’s your turn to play.', 'Shabaash! Ab tumhari baari hai khelne ki.'));
            }}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-6" data-testid="learn-done">
            <Mascot mood="cheer" size={130} />
            <h2 className="text-4xl font-bold">{t('You learned something new!', 'Tumne kuch naya seekha!')}</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                className="btn3d btn-white px-8 py-4 text-2xl"
                onClick={() => {
                  setRun((r) => r + 1);
                  setDone(false);
                }}
                data-testid="learn-replay"
              >
                ↺ {t('Watch again', 'Phir se dekho')}
              </button>
              <button className="btn3d btn-green px-8 py-4 text-2xl" onClick={() => navigate(`/maths/play${qs({ topics: topic, n: 3, label: `Your turn: ${def.name}`, zone: topic })}`)} data-testid="learn-try">
                {t('Your turn!', 'Ab tumhari baari!')} ▶
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
