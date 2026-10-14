/**
 * Grown-ups area: progress, topic levels and reasons for changes, quiz reviews, common mistakes,
 * history, settings, and local data backup / restore / export / reset.
 */
import { useEffect, useMemo, useState } from 'react';
import { navigate } from '../app/router';
import { spokenName } from '../app/devanagari';
import { currentVoiceName, localEnglishVoices, speak, speechSupported, usingHindiVoice } from '../app/speech';
import { useActive, useStore } from '../app/store';
import { ParentGate, isParentUnlocked, lockParent } from '../components/ParentGate';
import { TopBar } from '../components/TopBar';
import { Emoji, Modal } from '../components/ui';
import { ACHIEVEMENTS } from '../core/achievements';
import { evaluateTopic, setTopicLevel } from '../core/adaptive';
import { commonMistakes, overview, recommendTopics, summarizeTopic, weeklyTrend, type TopicSummary } from '../core/analytics';
import { scoreTest } from '../core/assessment';
import { resetProgress } from '../core/progress';
import { AGES, CLASS_LEVELS, initialLevel, supportInfo, type ClassLevel, type ProfileData, type TestRecord } from '../core/state';
import { attemptsToCsv, exportBackup, importBackup } from '../core/storage';
import type { Level, Outcome } from '../core/types';
import { mathsSubject } from '../subjects/maths';
import { describeAnswer, describeQuestion, describeResponse } from '../subjects/maths/answers';
import { MATHS_TOPIC_DEFS, activityDef, topicDef } from '../subjects/maths/curriculum';
import type { MathsQuestion } from '../subjects/maths/types';
import { MATHS_TOPICS } from '../subjects/maths/types';

const TABS = ['Overview', 'Topics', 'Quizzes', 'Mistakes', 'History', 'Settings', 'Data'] as const;
type Tab = (typeof TABS)[number];

const pct = (x: number | null) => (x === null ? '—' : `${Math.round(x * 100)}%`);
const fmtDate = (ts: number) => new Date(ts).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const OUTCOME_STYLE: Record<Outcome, { label: string; color: string; icon: string }> = {
  first: { label: 'Right first time', color: '#16a34a', icon: '●' },
  hint: { label: 'Right after a hint', color: '#ca8a04', icon: '◐' },
  retry: { label: 'Right after a retry', color: '#2563eb', icon: '◑' },
  incorrect: { label: 'Not yet', color: '#dc2626', icon: '○' },
  skipped: { label: 'Skipped', color: '#94a3b8', icon: '–' },
};

function download(name: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ParentDashboard() {
  const [unlocked, setUnlocked] = useState(isParentUnlocked());
  const [tab, setTab] = useState<Tab>('Overview');
  const { notice, dismissNotice } = useStore();
  const active = useActive();

  if (!unlocked) {
    return (
      <div className="flex min-h-full flex-col">
        <TopBar title="Grown-ups" showParent={false} />
        <ParentGate onPass={() => setUnlocked(true)} onCancel={() => navigate('/home')} />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      <TopBar
        title="Grown-ups area"
        showParent={false}
        onBack={() => {
          lockParent();
          navigate('/home');
        }}
      />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pb-10 text-slate-800" style={{ userSelect: 'text' }}>
        {notice && (
          <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3 text-amber-900" role="status">
            <span>
              {notice === 'recovered-from-previous'
                ? 'Saved data was damaged, so the previous good copy was restored.'
                : notice === 'reset-corrupt'
                  ? 'Saved data could not be read and no backup copy was available, so the app started fresh. The unreadable data was kept aside in browser storage.'
                  : 'Some saved data was invalid and has been repaired.'}
            </span>
            <button className="rounded-xl bg-white px-3 py-1" onClick={dismissNotice}>
              OK
            </button>
          </div>
        )}
        <div className="flex items-center gap-3">
          <Emoji size={40}>{active.profile.companion}</Emoji>
          <div>
            <div className="text-2xl font-bold">{active.profile.name || 'Explorer'}</div>
            <div className="text-slate-600">
              Age {active.profile.age} · {CLASS_LEVELS.find((c) => c.id === active.profile.schoolClass)?.label}
            </div>
          </div>
        </div>
        <nav className="flex flex-wrap gap-2" role="tablist">
          {TABS.map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} className={`rounded-2xl px-4 py-2 text-lg font-semibold ${tab === t ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 shadow-sm'}`} onClick={() => setTab(t)} data-testid={`tab-${t}`}>
              {t}
            </button>
          ))}
        </nav>
        <div className="rounded-3xl bg-white p-5 shadow-sm" role="tabpanel">
          {tab === 'Overview' && <OverviewTab data={active} />}
          {tab === 'Topics' && <TopicsTab data={active} />}
          {tab === 'Quizzes' && <QuizzesTab data={active} />}
          {tab === 'Mistakes' && <MistakesTab data={active} />}
          {tab === 'History' && <HistoryTab data={active} />}
          {tab === 'Settings' && <SettingsTab data={active} />}
          {tab === 'Data' && <DataTab data={active} />}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, testId }: { label: string; value: string | number; sub?: string; testId?: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="text-sm font-semibold text-slate-500">{label}</div>
      <div className="text-3xl font-bold" data-testid={testId}>
        {value}
      </div>
      {sub && <div className="text-sm text-slate-500">{sub}</div>}
    </div>
  );
}

function TrendChart({ data }: { data: ProfileData }) {
  const points = weeklyTrend(data);
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const H = 140;
  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Right-first-time rate by week</h3>
        <button className="text-sm text-blue-700 underline" onClick={() => setTable((t) => !t)}>
          {table ? 'Show chart' : 'Show table'}
        </button>
      </div>
      {table ? (
        <table className="data-table mt-2">
          <thead>
            <tr>
              <th>Week starting</th>
              <th>Questions</th>
              <th>Right first time</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.week}>
                <td>{p.week}</td>
                <td>{p.attempts}</td>
                <td>{p.attempts ? pct(p.firstTryRate) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative mt-2 flex items-end gap-3 border-b border-slate-200 pl-10" style={{ height: H + 24 }} data-testid="trend-chart">
          {[0, 50, 100].map((g) => (
            <div key={g} className="absolute left-0 right-0 flex items-center" style={{ bottom: 24 + (g / 100) * H - 8 }}>
              <span className="w-9 text-right text-xs text-slate-400">{g}%</span>
              <span className="ml-1 h-px flex-1 bg-slate-100" />
            </div>
          ))}
          {points.map((p, i) => (
            <div key={p.week} className="relative z-10 flex flex-1 flex-col items-center justify-end self-stretch" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              {hover === i && (
                <div className="absolute bottom-full mb-1 whitespace-nowrap rounded-lg bg-slate-800 px-2 py-1 text-xs text-white">
                  {p.attempts ? `${pct(p.firstTryRate)} of ${p.attempts} questions` : 'No practice'}
                </div>
              )}
              <div className="w-full max-w-10 rounded-t" style={{ height: p.attempts ? Math.max(3, p.firstTryRate * H) : 0, background: '#3b82f6' }} />
              <span className="h-6 pt-1 text-xs text-slate-500">{p.week}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OverviewTab({ data }: { data: ProfileData }) {
  const o = overview(data);
  const recs = recommendTopics(data, 'maths', [...MATHS_TOPICS], 3);
  return (
    <div className="flex flex-col gap-6" data-testid="overview">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Questions played" value={o.totalAttempts} sub={`practice & games · ${o.outcomes.skipped} skipped`} testId="ov-attempts" />
        <Stat label="Right first time" value={pct(o.firstTryRate)} sub="no hints, no retries" testId="ov-first" />
        <Stat label="Eventually right" value={pct(o.correctRate)} sub="including retries & hints" />
        <Stat label="Days played" value={o.daysPlayed} sub={`${o.minutesPlayed} min in ${o.sessions} sessions`} />
      </div>
      <div>
        <h3 className="text-lg font-bold">How answers went</h3>
        <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-5">
          {(Object.keys(OUTCOME_STYLE) as Outcome[]).map((k) => (
            <div key={k} className="rounded-2xl bg-slate-50 p-3" data-testid={`outcome-${k}`}>
              <div className="text-sm text-slate-600">
                <span style={{ color: OUTCOME_STYLE[k].color }}>{OUTCOME_STYLE[k].icon}</span> {OUTCOME_STYLE[k].label}
              </div>
              <div className="text-2xl font-bold">{o.outcomes[k]}</div>
            </div>
          ))}
        </div>
      </div>
      <TrendChart data={data} />
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-lg font-bold">Suggested next</h3>
          <ul className="mt-2 space-y-1">
            {recs.map((r) => (
              <li key={r.topic} className="text-lg">
                {topicDef(r.topic).emoji} <b>{topicDef(r.topic).name}</b> — {r.why}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-bold">Badges</h3>
          <p className="mt-2 text-lg">
            {data.rewards.achievements.length} of {ACHIEVEMENTS.length} badges · {data.rewards.stickers.length} stickers · ⭐ {data.rewards.stars}
          </p>
          <p className="text-sm text-slate-500">Stars are earned for every correct answer (effort counts), never for speed.</p>
        </div>
      </div>
    </div>
  );
}

function OutcomeDots({ list }: { list: Outcome[] }) {
  return (
    <span className="flex gap-1" aria-label={list.map((o) => OUTCOME_STYLE[o].label).join(', ')}>
      {list.map((o, i) => (
        <span key={i} title={OUTCOME_STYLE[o].label} style={{ color: OUTCOME_STYLE[o].color }}>
          {OUTCOME_STYLE[o].icon}
        </span>
      ))}
    </span>
  );
}

function TopicsTab({ data }: { data: ProfileData }) {
  const { updateActive } = useStore();
  const max = data.settings.allowAdvanced ? 5 : 3;
  const rows: TopicSummary[] = MATHS_TOPICS.map((t) => summarizeTopic(data, 'maths', t));
  return (
    <div className="flex flex-col gap-4" data-testid="topics-tab">
      <label className="flex items-center gap-3 text-lg">
        <input type="checkbox" className="h-6 w-6" checked={data.settings.autoAdapt} onChange={(e) => updateActive((p) => ({ ...p, settings: { ...p.settings, autoAdapt: e.target.checked } }))} data-testid="auto-adapt" />
        Adjust difficulty automatically (moves up after 6+ answers at ≥80% right first time; down after 5 answers at ≤40%)
      </label>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Topic</th>
              <th>Level</th>
              <th>Status</th>
              <th>Answered</th>
              <th>Right 1st time</th>
              <th>Last 10</th>
              <th>Last level change</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const def = topicDef(r.topic);
              const sugg = evaluateTopic(data, 'maths', r.topic).suggestion;
              return (
                <tr key={r.topic} data-testid={`topic-row-${r.topic}`}>
                  <td>
                    {def.emoji} {def.name}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button className="h-8 w-8 rounded-lg bg-slate-100" aria-label={`Lower ${def.name} level`} disabled={r.level <= 1} onClick={() => updateActive((p) => setTopicLevel(p, 'maths', r.topic, (r.level - 1) as Level))}>
                        −
                      </button>
                      <span className="w-6 text-center font-bold" data-testid={`level-${r.topic}`}>
                        {r.level}
                      </span>
                      <button className="h-8 w-8 rounded-lg bg-slate-100" aria-label={`Raise ${def.name} level`} disabled={r.level >= max} onClick={() => updateActive((p) => setTopicLevel(p, 'maths', r.topic, (r.level + 1) as Level))}>
                        +
                      </button>
                    </div>
                    <div className="text-xs text-slate-500">{def.levels[r.level - 1]}</div>
                  </td>
                  <td className="capitalize">{r.status.replace('-', ' ')}</td>
                  <td>{r.attempts}</td>
                  <td>{pct(r.firstTryRate)}</td>
                  <td>
                    <OutcomeDots list={r.recent} />
                  </td>
                  <td className="max-w-xs text-sm">
                    {r.lastChange ? (
                      <>
                        <b>
                          {r.lastChange.from} → {r.lastChange.to}
                        </b>{' '}
                        {r.lastChange.reason}
                      </>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                    {sugg && <div className="text-blue-700">{sugg}</div>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-slate-500">Levels 1–3 are the age-5 (UKG) curriculum. Turn on “advanced challenges” in Settings to unlock levels 4–5.</p>
    </div>
  );
}

function QuizReview({ test, onClose }: { test: TestRecord; onClose: () => void }) {
  return (
    <Modal label="Quiz review" onClose={onClose}>
      <h2 className="text-2xl font-bold">Quiz review</h2>
      <p className="text-slate-600">
        {fmtDate(test.startedAt)} · Level {test.config.level} · {test.config.topics.map((t) => topicDef(t).name).join(', ')}
      </p>
      <ol className="mt-4 space-y-2" data-testid="quiz-review">
        {test.questions.map((q, i) => {
          const mq = q as MathsQuestion;
          const a = test.answers[i];
          const ok = a ? mathsSubject.checkAnswer(mq, a.response) : false;
          return (
            <li key={i} className={`rounded-xl p-3 ${ok ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="font-semibold">
                {i + 1}. {ok ? '✅' : '❌'} {describeQuestion(mq)} <span className="text-sm text-slate-500">({activityDef(mq.kind).name})</span>
              </div>
              <div className="text-sm">
                Answered: <b>{a ? describeResponse(mq, a.response) : 'not answered'}</b> · Correct: <b>{describeAnswer(mq)}</b>
              </div>
            </li>
          );
        })}
      </ol>
      <button className="btn3d btn-blue mt-4 px-6 py-2 text-lg" onClick={onClose}>
        Close
      </button>
    </Modal>
  );
}

function QuizzesTab({ data }: { data: ProfileData }) {
  const { updateActive } = useStore();
  const [open, setOpen] = useState<TestRecord | null>(null);
  const tests = [...data.tests].reverse();
  return (
    <div className="flex flex-col gap-4" data-testid="quizzes-tab">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Quizzes</h3>
        <button className="btn3d btn-green px-4 py-2 text-lg" onClick={() => navigate('/maths/quiz')} data-testid="new-quiz">
          Set up a new quiz
        </button>
      </div>
      {tests.length === 0 && <p className="text-slate-500">No quizzes yet.</p>}
      <table className="data-table">
        <tbody>
          {tests.map((t) => {
            const s = scoreTest(t, (q, r) => mathsSubject.checkAnswer(q as MathsQuestion, r));
            return (
              <tr key={t.id} data-testid="quiz-row">
                <td>{fmtDate(t.startedAt)}</td>
                <td>{t.config.topics.length === MATHS_TOPICS.length ? 'Mixed' : t.config.topics.map((x) => topicDef(x).name).join(', ')}</td>
                <td>Level {t.config.level}</td>
                <td>
                  {t.status === 'finished' ? (
                    <b data-testid="quiz-row-score">
                      {s.correct}/{s.total} ({s.percent}%)
                    </b>
                  ) : (
                    <span className="text-amber-700">
                      {t.status === 'in-progress' ? `in progress (${t.answers.filter(Boolean).length}/${t.questions.length})` : 'abandoned'}
                    </span>
                  )}
                </td>
                <td className="text-right">
                  {t.status === 'finished' && (
                    <button className="rounded-lg bg-slate-100 px-3 py-1" onClick={() => setOpen(t)} data-testid="quiz-review-open">
                      Review answers
                    </button>
                  )}
                  {t.status === 'in-progress' && (
                    <button className="rounded-lg bg-slate-100 px-3 py-1" onClick={() => updateActive((p) => ({ ...p, tests: p.tests.map((x) => (x.id === t.id ? { ...x, status: 'abandoned' } : x)) }))}>
                      Discard
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {open && <QuizReview test={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function MistakesTab({ data }: { data: ProfileData }) {
  const groups = commonMistakes(data);
  return (
    <div className="flex flex-col gap-4" data-testid="mistakes-tab">
      <p className="text-slate-600">Where your child needed more than one try, grouped by topic and game. Wrong answers are a normal part of learning!</p>
      {groups.length === 0 && <p className="text-slate-500">Nothing to show yet.</p>}
      {groups.map((g) => (
        <div key={`${g.topic}/${g.kind}`} className="rounded-2xl bg-slate-50 p-4">
          <div className="text-lg font-bold">
            {topicDef(g.topic).emoji} {topicDef(g.topic).name} · {activityDef(g.kind).name} <span className="font-normal text-slate-500">— {g.count} times</span>
          </div>
          <ul className="mt-1 text-sm">
            {g.examples.map((e, i) => (
              <li key={i}>
                {e.question}: answered <b>{e.response}</b>, correct <b>{e.correctAnswer}</b>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function HistoryTab({ data }: { data: ProfileData }) {
  const sessions = [...data.sessions].reverse().slice(0, 100);
  return (
    <div className="overflow-x-auto" data-testid="history-tab">
      {sessions.length === 0 && <p className="text-slate-500">No sessions yet.</p>}
      <table className="data-table">
        <thead>
          <tr>
            <th>When</th>
            <th>Activity</th>
            <th>Answered</th>
            <th>Right 1st time</th>
            <th>Eventually right</th>
            <th>Minutes</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id}>
              <td>{fmtDate(s.startedAt)}</td>
              <td>{s.label}</td>
              <td>{s.total}</td>
              <td>{s.firstTry}</td>
              <td>{s.correct}</td>
              <td>{Math.max(1, Math.round((s.endedAt - s.startedAt) / 60000))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SettingsTab({ data }: { data: ProfileData }) {
  const { updateActive, state, setState } = useStore();
  const [voices, setVoices] = useState(() => localEnglishVoices());
  useEffect(() => {
    if (!speechSupported()) return;
    const on = () => setVoices(localEnglishVoices());
    window.speechSynthesis.addEventListener?.('voiceschanged', on);
    const t = window.setTimeout(on, 500);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', on);
      window.clearTimeout(t);
    };
  }, []);
  const s = data.settings;
  const set = (patch: Partial<ProfileData['settings']>) => updateActive((p) => ({ ...p, settings: { ...p.settings, ...patch } }));
  const setProfile = (patch: Partial<ProfileData['profile']>) => updateActive((p) => ({ ...p, profile: { ...p.profile, ...patch } }));
  const support = supportInfo(data.profile.age, data.profile.schoolClass);
  const row = 'flex flex-wrap items-center gap-3 py-2';
  const sel = 'rounded-xl border-2 border-slate-200 px-3 py-2 text-lg';
  return (
    <div className="flex flex-col divide-y divide-slate-100" data-testid="settings-tab">
      <div className={row}>
        <label className="w-48 font-semibold" htmlFor="set-name">
          Name or nickname
        </label>
        <input id="set-name" className={sel} value={data.profile.name} maxLength={24} onChange={(e) => setProfile({ name: e.target.value })} data-testid="set-name" />
      </div>
      <div className={row}>
        <label className="w-48 font-semibold" htmlFor="set-name-say">
          How Ollie says the name
        </label>
        <input
          id="set-name-say"
          className={sel}
          value={data.profile.nameSay ?? ''}
          maxLength={40}
          placeholder={spokenName(data.profile.name, '', usingHindiVoice()) || 'e.g. अतिये'}
          onChange={(e) => setProfile({ nameSay: e.target.value })}
          data-testid="set-name-say"
        />
        <button
          className="rounded-xl bg-slate-100 px-3 py-2"
          data-testid="test-name"
          onClick={() => {
            const n = spokenName(data.profile.name, data.profile.nameSay ?? '', usingHindiVoice());
            speak(s.language === 'en' ? `Yay! Great job, ${n}!` : `Yaaay! Shabaash, ${n}!`);
          }}
        >
          🔊 Say it
        </button>
        <span className="text-sm text-slate-500">Leave empty to use the automatic version shown. You can type Hindi (अतिये) for the Hindi voice.</span>
      </div>
      <div className={row}>
        <label className="w-48 font-semibold" htmlFor="set-age">
          Age
        </label>
        <select id="set-age" className={sel} value={data.profile.age} onChange={(e) => setProfile({ age: Number(e.target.value) })}>
          {AGES.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <label className="font-semibold" htmlFor="set-class">
          Class
        </label>
        <select id="set-class" className={sel} value={data.profile.schoolClass} onChange={(e) => setProfile({ schoolClass: e.target.value as ClassLevel })}>
          {CLASS_LEVELS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <span className="text-sm text-slate-500">{support.message}</span>
      </div>
      <div className={row}>
        <span className="w-48 font-semibold">Difficulty style</span>
        <select className={sel} value={s.difficulty} onChange={(e) => set({ difficulty: e.target.value as ProfileData['settings']['difficulty'] })} data-testid="set-difficulty">
          <option value="gentle">Gentle (moves up slowly)</option>
          <option value="standard">Standard</option>
          <option value="challenge">Challenge (moves up sooner)</option>
        </select>
      </div>
      <label className={row}>
        <span className="w-48 font-semibold">Automatic difficulty</span>
        <input type="checkbox" className="h-6 w-6" checked={s.autoAdapt} onChange={(e) => set({ autoAdapt: e.target.checked })} />
      </label>
      <label className={row}>
        <span className="w-48 font-semibold">Advanced challenges</span>
        <input type="checkbox" className="h-6 w-6" checked={s.allowAdvanced} onChange={(e) => {
          const allow = e.target.checked;
          updateActive((p) => {
            let next = { ...p, settings: { ...p.settings, allowAdvanced: allow } };
            if (!allow) for (const t of MATHS_TOPICS) if ((next.topics.maths?.[t]?.level ?? 1) > 3) next = setTopicLevel(next, 'maths', t, 3);
            return next;
          });
        }} data-testid="set-advanced" />
        <span className="text-sm text-slate-500">Unlocks levels 4–5 (adding to 20, numbers to 50, skip-counting).</span>
      </label>
      <div className={row}>
        <span className="w-48 font-semibold">Session length</span>
        <select className={sel} value={s.sessionLength} onChange={(e) => set({ sessionLength: e.target.value as ProfileData['settings']['sessionLength'] })}>
          <option value="short">Short (about 5 minutes)</option>
          <option value="normal">Normal (about 10 minutes)</option>
          <option value="long">Long (about 15 minutes)</option>
        </select>
      </div>
      <label className={row}>
        <span className="w-48 font-semibold">Sound effects</span>
        <input type="checkbox" className="h-6 w-6" checked={s.sound} onChange={(e) => set({ sound: e.target.checked })} />
      </label>
      <div className={row}>
        <span className="w-48 font-semibold">Spoken instructions</span>
        <input type="checkbox" className="h-6 w-6" checked={s.voice} onChange={(e) => set({ voice: e.target.checked })} aria-label="Spoken instructions" />
        {voices.length > 0 ? (
          <>
            <select className={sel} value={s.voiceName ?? ''} onChange={(e) => set({ voiceName: e.target.value || null })} data-testid="set-voice">
              <option value="">Automatic ({currentVoiceName() ?? 'best available'})</option>
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
            <button className="rounded-xl bg-slate-100 px-3 py-2" onClick={() => speak(s.language === 'en' ? 'Hello! Let’s count: one, two, three!' : 'Namaste! Chalo ginte hain: 1, 2, 3!')}>
              Test voice
            </button>
          </>
        ) : (
          <span className="text-amber-700">No offline English voice found — instructions are shown as text only. (macOS: System Settings → Accessibility → Spoken Content → System Voice.)</span>
        )}
      </div>
      <div className={row}>
        <span className="w-48 font-semibold">Ollie’s voice &amp; language</span>
        <select className={sel} value={s.language} onChange={(e) => set({ language: e.target.value as ProfileData['settings']['language'], voiceName: null })} data-testid="set-language">
          <option value="hindi">Hindi voice (Hindi words, Hindi numbers)</option>
          <option value="hinglish">Hinglish (Indian-English voice)</option>
          <option value="en">English</option>
        </select>
        <span className="text-sm text-slate-500">On screen the child sees simple Hinglish (or English). This grown-ups area stays in English.</span>
      </div>
      <div className={row}>
        <span className="w-48 font-semibold">Voice speed</span>
        <select className={sel} value={s.voiceSpeed} onChange={(e) => set({ voiceSpeed: e.target.value as ProfileData['settings']['voiceSpeed'] })} data-testid="set-voice-speed">
          <option value="very-slow">Very slow</option>
          <option value="slow">Slow (recommended)</option>
          <option value="normal">Normal</option>
        </select>
        <button className="rounded-xl bg-slate-100 px-3 py-2" onClick={() => speak(s.language === 'en' ? 'Hello! How many rabbits are in the garden?' : 'Namaste! Garden mein kitne rabbits hain? Chalo ginte hain: 1, 2, 3!')} data-testid="test-voice-speed">
          Test voice
        </button>
      </div>
      <div className={row}>
        <span className="w-48 font-semibold">Reduce motion</span>
        <select className={sel} value={s.reducedMotion} onChange={(e) => set({ reducedMotion: e.target.value as ProfileData['settings']['reducedMotion'] })} data-testid="set-motion">
          <option value="system">Follow the Mac setting</option>
          <option value="on">On — keep things still</option>
          <option value="off">Off — allow animation</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-3 py-4">
        <span className="w-48 font-semibold">Children on this Mac</span>
        {state.profiles.map((p) => (
          <button
            key={p.profile.id}
            className={`rounded-xl px-3 py-2 ${p.profile.id === data.profile.id ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}
            onClick={() => setState((st) => ({ ...st, activeProfileId: p.profile.id }))}
          >
            {p.profile.companion} {p.profile.name || 'Explorer'}
          </button>
        ))}
        <button className="rounded-xl bg-green-100 px-3 py-2" onClick={() => navigate('/setup')}>
          + Add a child
        </button>
      </div>
    </div>
  );
}

function DataTab({ data }: { data: ProfileData }) {
  const { state, setState, updateActive } = useStore();
  const [msg, setMsg] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'reset' | 'delete' | null>(null);
  const [typed, setTyped] = useState('');
  const stamp = useMemo(() => new Date().toISOString().slice(0, 10), []);
  return (
    <div className="flex flex-col gap-5" data-testid="data-tab">
      <p className="text-slate-600">All progress is stored only in this Mac’s browser profile used by Maths Adventure. Nothing is uploaded.</p>
      <div className="flex flex-wrap gap-3">
        <button className="btn3d btn-blue px-5 py-3 text-lg" onClick={() => download(`maths-adventure-backup-${stamp}.json`, exportBackup(state), 'application/json')} data-testid="export-json">
          Download backup (JSON)
        </button>
        <button className="btn3d btn-blue px-5 py-3 text-lg" onClick={() => download(`maths-adventure-${data.profile.name || 'child'}-answers-${stamp}.csv`, attemptsToCsv(data), 'text/csv')} data-testid="export-csv">
          Export answers (CSV)
        </button>
        <label className="btn3d btn-white cursor-pointer px-5 py-3 text-lg">
          Restore from backup…
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            data-testid="import-json"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              try {
                const restored = importBackup(await f.text());
                setState(() => restored);
                setMsg(`Restored ${restored.profiles.length} profile(s) from backup.`);
              } catch (err) {
                setMsg(err instanceof Error ? err.message : 'Could not restore that file.');
              }
            }}
          />
        </label>
      </div>
      {msg && (
        <p className="rounded-xl bg-blue-50 px-4 py-2 text-blue-900" role="status" data-testid="data-msg">
          {msg}
        </p>
      )}
      <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
        <button className="btn3d btn-red px-5 py-3 text-lg" onClick={() => setConfirm('reset')} data-testid="reset-progress">
          Reset {data.profile.name || 'this child'}’s progress…
        </button>
        <button className="btn3d btn-slate px-5 py-3 text-lg" onClick={() => setConfirm('delete')}>
          Delete this child’s profile…
        </button>
      </div>
      {confirm && (
        <Modal label="Confirm" onClose={() => setConfirm(null)}>
          <h2 className="text-2xl font-bold">{confirm === 'reset' ? 'Reset all progress?' : 'Delete this profile?'}</h2>
          <p className="mt-2 text-slate-600">This removes {confirm === 'reset' ? 'all answers, quizzes, stars, stickers and levels' : 'the profile and all its progress'} for {data.profile.name || 'this child'}. Consider downloading a backup first. Type <b>RESET</b> to confirm.</p>
          <input className="mt-3 rounded-xl border-2 border-slate-200 px-3 py-2 text-lg" value={typed} onChange={(e) => setTyped(e.target.value)} data-testid="confirm-input" aria-label="Type RESET to confirm" />
          <div className="mt-4 flex gap-3">
            <button className="btn3d btn-white px-5 py-2 text-lg" onClick={() => setConfirm(null)}>
              Cancel
            </button>
            <button
              className="btn3d btn-red px-5 py-2 text-lg"
              disabled={typed !== 'RESET'}
              data-testid="confirm-reset"
              onClick={() => {
                if (confirm === 'reset') {
                  updateActive((p) => resetProgress(p, (_s, t) => initialLevel(t, p.profile, p.settings)));
                  setMsg('Progress has been reset.');
                } else {
                  setState((st) => {
                    const profiles = st.profiles.filter((p) => p.profile.id !== data.profile.id);
                    return { ...st, profiles, activeProfileId: profiles[0]?.profile.id ?? null };
                  });
                  navigate(state.profiles.length > 1 ? '/home' : '/welcome');
                }
                setConfirm(null);
                setTyped('');
              }}
            >
              {confirm === 'reset' ? 'Reset' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
      <p className="text-sm text-slate-500">
        Topics tracked: {MATHS_TOPIC_DEFS.length}. Stored answers: {data.attempts.length} (the most recent 3,000 are kept).
      </p>
    </div>
  );
}
