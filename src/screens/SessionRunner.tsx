import { useT } from '../app/i18n';
/**
 * Runs a sequence of mini-games (practice, island missions, daily journey):
 * generates each question lazily at the child's live level, records attempts exactly once,
 * shows small surprises, and ends with a celebration + summary.
 */
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { sfx } from '../app/sfx';
import { spokenName } from '../app/devanagari';
import { speak, usingHindiVoice } from '../app/speech';
import { useActive, useOptionalStore, useStore } from '../app/store';
import { seedFromUrl } from '../app/testHooks';
import { Mascot } from '../art/Mascot';
import { QuestionHost, type Resolution } from '../components/QuestionHost';
import { Confetti, Emoji, Modal, ProgressDots } from '../components/ui';
import { achievementDef } from '../core/achievements';
import { recordAttempt, recordSession } from '../core/progress';
import { createRng, randomSeed } from '../core/rng';
import type { PlanItem } from '../core/scheduler';
import { maxLevelFor, newId, topicLevel, type ProfileData } from '../core/state';
import { clampLevel, type Mode } from '../core/types';
import { mathsSubject } from '../subjects/maths';
import { describeAnswer, describeQuestion, describeResponse } from '../subjects/maths/answers';
import { topicDef } from '../subjects/maths/curriculum';
import type { MathsQuestion } from '../subjects/maths/types';

const SURPRISES = [
  { emoji: '🦋', text: 'A butterfly came to watch you!', hi: 'Ek titli tumhe dekhne aayi!' },
  { emoji: '🐚', text: 'You found a shiny shell on the beach!', hi: 'Tumhe beach pe ek chamakti seep mili!' },
  { emoji: '🌈', text: 'A rainbow appeared over the island!', hi: 'Island pe indradhanush nikla!' },
  { emoji: '🐿️', text: 'A squirrel waves hello!', hi: 'Ek gilahri hello bol rahi hai!' },
  { emoji: '🎈', text: 'A balloon floats by just for you!', hi: 'Ek balloon sirf tumhare liye ud raha hai!' },
];

export function generateFor(item: PlanItem, data: ProfileData, rng: ReturnType<typeof createRng>, avoid: Set<string>, mode: Mode): MathsQuestion {
  const base = topicLevel(data, 'maths', item.topic);
  const level = clampLevel(base + (item.challenge ? 1 : 0), maxLevelFor(data.settings));
  const kinds = mathsSubject.kindsFor(item.topic, level);
  const kind = kinds.includes(item.kind) ? item.kind : undefined;
  try {
    return mathsSubject.generate({ topic: item.topic, level, kind, rng, mode, avoid }) as MathsQuestion;
  } catch {
    return mathsSubject.generate({ topic: item.topic, level, rng, mode, avoid }) as MathsQuestion;
  }
}

export interface SessionSummary {
  total: number;
  firstTry: number;
  correct: number;
  stars: number;
  sticker: string | null;
  achievements: string[];
}

export function SessionRunner({
  plan,
  attemptMode,
  label,
  zone,
  treasureHunt,
  onExit,
  onPlayAgain,
  renderBetween,
  summaryExtra,
}: {
  plan: PlanItem[];
  attemptMode: 'practice' | 'adventure' | 'journey';
  label: string;
  zone?: string;
  treasureHunt?: boolean;
  onExit: () => void;
  onPlayAgain?: () => void;
  /** optional custom layout around each question (e.g. treasure map) */
  renderBetween?: (index: number, results: (Resolution | null)[]) => ReactNode;
  summaryExtra?: ReactNode;
}) {
  const { updateActive } = useStore();
  const active = useActive();
  const tr = useT();
  const activeRef = useRef(active);
  activeRef.current = active;
  const sessionId = useMemo(() => newId('session'), []);
  const startedAt = useMemo(() => Date.now(), []);
  const rng = useMemo(() => createRng(seedFromUrl() ?? randomSeed()), []);
  const avoid = useMemo(() => new Set(active.attempts.slice(-30).map((a) => a.signature)), [active.attempts]);
  const [index, setIndex] = useState(0);
  const [questions, setQuestions] = useState<MathsQuestion[]>(() => (plan[0] ? [generateFor(plan[0], active, rng, avoid, attemptMode)] : []));
  const [results, setResults] = useState<(Resolution | null)[]>(() => plan.map(() => null));
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [surprise, setSurprise] = useState<(typeof SURPRISES)[number] | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const recorded = useRef(new Set<string>());

  const current = questions[index];

  const onResolved = useCallback(
    (r: Resolution) => {
      const q = questions[index];
      if (!q || recorded.current.has(q.id)) return;
      recorded.current.add(q.id);
      setResults((rs) => {
        const next = rs.slice();
        next[index] = r;
        return next;
      });
      let levelMsg: string | null = null;
      let ach: string[] = [];
      updateActive((p) => {
        const res = recordAttempt(p, {
          id: `${sessionId}:${q.id}`,
          ts: Date.now(),
          sessionId,
          mode: attemptMode,
          subject: 'maths',
          topic: q.topic,
          kind: q.kind,
          level: q.level,
          outcome: r.outcome,
          tries: r.tries,
          hintUsed: r.hintUsed,
          signature: q.signature,
          question: describeQuestion(q),
          response: r.response ? describeResponse(q, r.response) : '(skipped)',
          correctAnswer: describeAnswer(q),
        });
        if (res.levelChange && res.levelChange.to > res.levelChange.from) levelMsg = tr(`🌱 ${topicDef(q.topic).name} level ${res.levelChange.to} unlocked!`, `🌱 ${topicDef(q.topic).name} level ${res.levelChange.to} khul gaya!`);
        ach = res.achievements;
        return res.data;
      });
      if (ach.length) {
        const a = achievementDef(ach[0]!);
        if (a) setToast(tr(`${a.emoji} New badge: ${a.name}!`, `${a.emoji} Naya badge: ${a.name}!`));
      } else if (levelMsg) setToast(levelMsg);
      // small surprise every 4th correct answer — decorative only, no value attached
      if (r.correct) {
        const correctSoFar = results.filter((x) => x?.correct).length + 1;
        if (correctSoFar % 4 === 0) window.setTimeout(() => setSurprise(SURPRISES[(correctSoFar / 4 - 1) % SURPRISES.length]!), 900);
      }
    },
    [questions, index, sessionId, attemptMode, updateActive, results, tr],
  );

  const finish = useCallback(
    (finalResults: (Resolution | null)[]) => {
      const answered = finalResults.filter((r): r is Resolution => r !== null && r.outcome !== 'skipped');
      const s = {
        total: answered.length,
        firstTry: answered.filter((r) => r.outcome === 'first').length,
        correct: answered.filter((r) => r.correct).length,
        stars: answered.filter((r) => r.correct).length,
      };
      let sticker: string | null = null;
      let ach: string[] = [];
      if (s.total > 0) {
        updateActive((p) => {
          const res = recordSession(p, { startedAt, endedAt: Date.now(), mode: attemptMode, subject: 'maths', label, ...s }, { zone, treasureHunt: treasureHunt && finalResults.every((r) => r !== null) });
          sticker = res.sticker;
          ach = res.achievements;
          return res.data;
        });
      }
      setSummary({ ...s, sticker, achievements: ach });
      sfx('cheer');
      const nm = spokenName(activeRef.current.profile.name, activeRef.current.profile.nameSay ?? '', usingHindiVoice());
      speak(s.total > 0 ? tr(`Hooray${nm ? `, ${nm}` : ''}! You finished! You solved ${s.correct} puzzles!`, `Hurray${nm ? `, ${nm}` : ''}! Tumne pura kar liya! Tumne ${s.correct} puzzles solve kiye! Shabaash!`) : tr('See you next time!', 'Phir milenge!'));
    },
    [updateActive, startedAt, attemptMode, label, zone, treasureHunt, tr],
  );

  const next = useCallback(() => {
    setSurprise(null);
    const ni = index + 1;
    if (ni >= plan.length) {
      finish(results);
      return;
    }
    const q = generateFor(plan[ni]!, activeRef.current, rng, new Set([...avoid, ...questions.map((x) => x.signature)]), attemptMode);
    setQuestions((qs) => [...qs, q]);
    setIndex(ni);
  }, [index, plan, results, finish, rng, avoid, questions, attemptMode]);

  if (summary) return <SessionSummaryView summary={summary} label={label} onExit={onExit} onPlayAgain={onPlayAgain} extra={summaryExtra} />;
  if (!current) return null;

  const dots = results.map((r) => (r === null ? null : r.outcome === 'first' ? 'good' : r.correct ? 'ok' : 'miss')) as ('good' | 'ok' | 'miss' | null)[];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-4 px-4 pt-3">
        <button className="btn3d btn-white h-14 px-5 text-xl" onClick={() => setConfirmExit(true)} data-testid="exit-session" aria-label="Stop playing">
          ✋ {tr('Stop', 'Ruko')}
        </button>
        <div className="flex flex-1 flex-col items-center gap-1">
          <span className="text-lg font-semibold text-slate-600">{label}</span>
          <ProgressDots total={plan.length} current={index} results={dots} />
        </div>
        <span className="rounded-full bg-white/90 px-4 py-2 text-xl font-bold shadow" data-testid="session-stars">
          ⭐ {active.rewards.stars}
        </span>
      </div>
      {renderBetween?.(index, results)}
      <div className="flex min-h-0 flex-1 flex-col px-4 pb-2 pt-2">
        <QuestionHost key={current.id} question={current} mode="practice" index={index} onResolved={onResolved} onNext={next} nextLabel={index + 1 >= plan.length ? tr('Finish', 'Khatam') : tr('Next', 'Aage')} />
      </div>

      {surprise && (
        <div className="anim-pop-in fixed left-1/2 top-24 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white px-6 py-3 text-xl font-bold shadow-xl" role="status">
          <Emoji size={40}>{surprise.emoji}</Emoji>
          {tr(surprise.text, surprise.hi)}
        </div>
      )}
      {toast && (
        <div className="anim-pop-in fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-violet-600 px-6 py-3 text-xl font-bold text-white shadow-xl" role="status" onAnimationEnd={() => window.setTimeout(() => setToast(null), 3000)}>
          {toast}
        </div>
      )}
      {confirmExit && (
        <Modal label="Stop playing?" onClose={() => setConfirmExit(false)}>
          <div className="flex flex-col items-center gap-4 text-center">
            <Mascot mood="wave" size={110} />
            <h2 className="text-3xl font-bold">{tr('Stop playing now?', 'Abhi khelna band karein?')}</h2>
            <p className="text-xl text-slate-600">{tr('Everything you did is saved.', 'Tumhara sab kuch save hai.')}</p>
            <div className="flex gap-4">
              <button className="btn3d btn-green px-6 py-4 text-xl" onClick={() => setConfirmExit(false)} data-testid="keep-playing">
                {tr('Keep playing', 'Khelte raho')}
              </button>
              <button
                className="btn3d btn-white px-6 py-4 text-xl"
                data-testid="confirm-stop"
                onClick={() => {
                  setConfirmExit(false);
                  if (results.some((r) => r !== null)) finish(results);
                  else onExit();
                }}
              >
                {tr('Yes, stop', 'Haan, band karo')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function SessionSummaryView({ summary, label, onExit, onPlayAgain, extra }: { summary: SessionSummary; label: string; onExit: () => void; onPlayAgain?: () => void; extra?: ReactNode }) {
  const t = useT();
  const name = useOptionalStore()?.active?.profile.name.trim();
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 p-6 text-center" data-testid="session-summary">
      <Confetti pieces={48} />
      {extra ?? <Mascot mood="cheer" size={150} />}
      <h1 className="text-5xl font-bold">{summary.total > 0 ? `${t('Hooray', 'Hurray')}${name ? `, ${name}` : ''}! ${t('You did it!', 'Tumne kar dikhaya!')}` : t('See you soon!', 'Phir milenge!')}</h1>
      <p className="text-2xl text-slate-600">{label}</p>
      {summary.total > 0 && (
        <div className="flex flex-wrap justify-center gap-4">
          <div className="card px-8 py-4">
            <div className="text-5xl font-bold text-orange-500" data-testid="summary-correct">
              {summary.correct}
            </div>
            <div className="text-lg text-slate-600">{t('puzzles solved', 'puzzles solve kiye')}</div>
          </div>
          <div className="card px-8 py-4">
            <div className="text-5xl font-bold text-yellow-500">⭐ {summary.stars}</div>
            <div className="text-lg text-slate-600">{t('stars earned', 'stars mile')}</div>
          </div>
          {summary.sticker && (
            <div className="card anim-rise px-8 py-4" data-testid="summary-sticker">
              <div className="emoji text-6xl">{summary.sticker}</div>
              <div className="text-lg text-slate-600">{t('new sticker!', 'naya sticker!')}</div>
            </div>
          )}
        </div>
      )}
      {summary.achievements.map((id) => {
        const a = achievementDef(id);
        return a ? (
          <div key={id} className="anim-rise rounded-full bg-violet-100 px-6 py-2 text-xl font-bold text-violet-800">
            {a.emoji} {t('New badge', 'Naya badge')}: {a.name}
          </div>
        ) : null;
      })}
      <div className="flex gap-4">
        {onPlayAgain && (
          <button className="btn3d btn-blue px-8 py-4 text-2xl" onClick={onPlayAgain} data-testid="play-again">
            {t('Play again', 'Phir se khelo')}
          </button>
        )}
        <button className="btn3d btn-green px-8 py-4 text-2xl" onClick={onExit} data-testid="summary-done">
          {t('Back to the island', 'Island pe wapas')}
        </button>
      </div>
    </div>
  );
}
