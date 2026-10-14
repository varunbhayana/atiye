import { useT } from '../app/i18n';
/**
 * Quiz (assessment) mode — set up by a grown-up, played by the child.
 * No hints, no right/wrong feedback until the end, first committed answer counts,
 * and an unfinished quiz resumes after the app is closed.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { navigate } from '../app/router';
import { sfx } from '../app/sfx';
import { useActive, useStore } from '../app/store';
import { seedFromUrl } from '../app/testHooks';
import { Mascot, SpeechBubble } from '../art/Mascot';
import { ParentGate, isParentUnlocked } from '../components/ParentGate';
import { QuestionHost, type Resolution } from '../components/QuestionHost';
import { TopBar } from '../components/TopBar';
import { Confetti, Modal, ProgressDots } from '../components/ui';
import { commitAnswer, createTest, finishTest, isComplete, scoreTest } from '../core/assessment';
import { recordAttempt } from '../core/progress';
import { createRng, randomSeed } from '../core/rng';
import { planSession } from '../core/scheduler';
import { CLASS_LEVELS, topicLevel, type ProfileData, type TestConfig, type TestRecord } from '../core/state';
import { clampLevel, type AnswerResponse, type Level, type QuestionBase } from '../core/types';
import { mathsSubject } from '../subjects/maths';
import { describeAnswer, describeQuestion, describeResponse } from '../subjects/maths/answers';
import { CONCRETE_KINDS, MATHS_TOPIC_DEFS, topicDef } from '../subjects/maths/curriculum';
import type { MathsQuestion } from '../subjects/maths/types';
import { MATHS_TOPICS } from '../subjects/maths/types';

const check = (q: QuestionBase, r: AnswerResponse) => mathsSubject.checkAnswer(q as MathsQuestion, r);

export function generateTestQuestions(config: TestConfig, seed: number): MathsQuestion[] {
  const rng = createRng(seed);
  const plan = planSession({
    topics: config.topics,
    count: config.count,
    levelOf: () => config.level,
    kindsFor: (t, l) => mathsSubject.kindsFor(t, l),
    concreteKinds: CONCRETE_KINDS,
    struggling: new Set(),
    rng,
  });
  const avoid = new Set<string>();
  return plan.map((p) => {
    const q = mathsSubject.generate({ topic: p.topic, level: config.level, kind: p.kind, rng, mode: 'test', avoid }) as MathsQuestion;
    avoid.add(q.signature);
    return q;
  });
}

export function Quiz() {
  const active = useActive();
  const inProgress = active.tests.find((t) => t.status === 'in-progress');
  const [unlocked, setUnlocked] = useState(isParentUnlocked());
  if (inProgress) return <QuizRunner test={inProgress} />;
  if (!unlocked)
    return (
      <div className="flex min-h-full flex-col">
        <TopBar title="Quiz" back="/maths" />
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
          <Mascot mood="think" size={140} />
          <h1 className="text-4xl font-bold">Ask a grown-up to set up a quiz!</h1>
          <ParentGate onPass={() => setUnlocked(true)} onCancel={() => navigate('/maths')} />
        </div>
      </div>
    );
  return <QuizSetup data={active} />;
}

function QuizSetup({ data }: { data: ProfileData }) {
  const { updateActive } = useStore();
  const [topics, setTopics] = useState<string[]>(['counting', 'addition', 'subtraction', 'shapes']);
  const typical = clampLevel(Math.round(MATHS_TOPICS.reduce((s, t) => s + topicLevel(data, 'maths', t), 0) / MATHS_TOPICS.length));
  const [level, setLevel] = useState<Level>(typical);
  const [count, setCount] = useState<TestConfig['count']>(10);
  const ageLabel = `Age ${data.profile.age} · ${CLASS_LEVELS.find((c) => c.id === data.profile.schoolClass)?.label ?? ''}`;
  const chip = (on: boolean) => `rounded-2xl border-4 px-4 py-2 text-lg font-semibold ${on ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-transparent bg-slate-100 text-slate-700'}`;

  const start = () => {
    const config: TestConfig = { subject: 'maths', topics, level, count, ageLabel };
    const qs = generateTestQuestions(config, seedFromUrl() ?? randomSeed());
    const test = createTest(config, qs);
    updateActive((p) => ({ ...p, tests: [...p.tests, test] }));
  };

  return (
    <div className="flex min-h-full flex-col">
      <TopBar title="Set up a quiz (grown-ups)" back="/maths" />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-6 pb-8">
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Topics</h2>
            <div className="flex gap-2">
              <button className="rounded-xl bg-slate-100 px-3 py-1" onClick={() => setTopics([...MATHS_TOPICS])} data-testid="quiz-all-topics">
                Mixed (all)
              </button>
              <button className="rounded-xl bg-slate-100 px-3 py-1" onClick={() => setTopics([])}>
                Clear
              </button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {MATHS_TOPIC_DEFS.map((t) => (
              <button key={t.id} className={chip(topics.includes(t.id))} aria-pressed={topics.includes(t.id)} onClick={() => setTopics((x) => (x.includes(t.id) ? x.filter((y) => y !== t.id) : [...x, t.id]))} data-testid={`quiz-topic-${t.id}`}>
                {t.emoji} {t.name}
              </button>
            ))}
          </div>
        </section>
        <section className="card p-5">
          <h2 className="text-xl font-bold">Difficulty level</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {([1, 2, 3, 4, 5] as Level[]).map((l) => (
              <button key={l} className={chip(level === l)} onClick={() => setLevel(l)} aria-pressed={level === l} data-testid={`quiz-level-${l}`}>
                Level {l}
                {l > 3 ? ' (advanced)' : ''}
              </button>
            ))}
          </div>
          <p className="mt-2 text-slate-500">Suggested from current progress: level {typical}. Levels 1–3 cover the age-5 curriculum.</p>
        </section>
        <section className="card p-5">
          <h2 className="text-xl font-bold">Number of questions</h2>
          <div className="mt-3 flex gap-2">
            {([5, 10, 15, 20] as const).map((n) => (
              <button key={n} className={chip(count === n)} onClick={() => setCount(n)} aria-pressed={count === n} data-testid={`quiz-count-${n}`}>
                {n}
              </button>
            ))}
          </div>
          <p className="mt-3 text-slate-600">For: {ageLabel}</p>
        </section>
        <div className="flex justify-end">
          <button className="btn3d btn-green px-10 py-4 text-2xl" disabled={topics.length === 0} onClick={start} data-testid="quiz-start">
            Start the quiz ▶
          </button>
        </div>
      </div>
    </div>
  );
}

function QuizRunner({ test }: { test: TestRecord }) {
  const { updateActive } = useStore();
  const t = useT();
  const [intro, setIntro] = useState(test.answers.every((a) => a === null));
  const [confirmPause, setConfirmPause] = useState(false);
  const index = test.current;
  const quizIntro = t('Quiz time! Take your time — there’s no rush. Press Done when you’re sure.', 'Quiz time! Aaram se karo — koi jaldi nahi. Pakka ho toh Done dabao.');
  const q = test.questions[index] as MathsQuestion;

  const onResolved = useCallback(
    (r: Resolution) => {
      if (!r.response) return;
      const response = r.response;
      window.setTimeout(() => {
        updateActive((p) => {
          const tests = p.tests.map((t) => (t.id === test.id ? commitAnswer(t, index, response, check) : t));
          return { ...p, tests };
        });
      }, 450);
    },
    [updateActive, test.id, index],
  );

  const finish = () => {
    let finishedId = test.id;
    updateActive((p) => {
      const t = p.tests.find((x) => x.id === test.id);
      if (!t || !isComplete(t)) return p;
      const done = finishTest(t);
      finishedId = done.id;
      let next: ProfileData = { ...p, tests: p.tests.map((x) => (x.id === done.id ? done : x)) };
      done.questions.forEach((qq, i) => {
        const a = done.answers[i];
        if (!a) return;
        const mq = qq as MathsQuestion;
        next = recordAttempt(next, {
          id: `${done.id}:${i}`,
          ts: a.ts,
          sessionId: done.id,
          mode: 'test',
          subject: 'maths',
          topic: mq.topic,
          kind: mq.kind,
          level: mq.level,
          outcome: check(mq, a.response) ? 'first' : 'incorrect',
          tries: 1,
          hintUsed: false,
          signature: mq.signature,
          question: describeQuestion(mq),
          response: describeResponse(mq, a.response),
          correctAnswer: describeAnswer(mq),
        }).data;
      });
      return next;
    });
    navigate(`/maths/quiz/result/${finishedId}`);
  };

  if (isComplete(test)) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-6 p-6 text-center">
        <Mascot mood="cheer" size={150} />
        <h1 className="text-5xl font-bold">{t('All done!', 'Ho gaya!')}</h1>
        <p className="text-2xl text-slate-600">{t('You answered every question.', 'Tumne har sawaal ka jawab diya.')}</p>
        <button className="btn3d btn-green px-10 py-5 text-3xl" onClick={finish} data-testid="quiz-submit">
          {t('See my results', 'Mera result dekho')} ▶
        </button>
      </div>
    );
  }

  if (intro)
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="flex items-end gap-4">
          <Mascot mood="happy" size={150} />
          <SpeechBubble className="mb-12 text-2xl" say={quizIntro} autoSay>
            {quizIntro}
          </SpeechBubble>
        </div>
        <p className="text-2xl text-slate-600">{test.questions.length} {t('questions', 'sawaal')}</p>
        <button className="btn3d btn-green px-12 py-5 text-3xl" onClick={() => setIntro(false)} data-testid="quiz-begin">
          {t('Begin', 'Shuru karo')} ▶
        </button>
      </div>
    );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-4 px-4 pt-3">
        <button className="btn3d btn-white h-14 px-5 text-xl" onClick={() => setConfirmPause(true)} data-testid="quiz-pause">
          ⏸ Pause
        </button>
        <div className="flex flex-1 flex-col items-center gap-1">
          <span className="text-lg font-semibold text-slate-600" data-testid="quiz-progress">
            Question {index + 1} of {test.questions.length}
          </span>
          <ProgressDots total={test.questions.length} current={index} results={test.answers.map((a) => (a ? 'ok' : null))} />
        </div>
        <span className="w-24" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-4 pb-2 pt-2">
        <QuestionHost key={`${test.id}-${index}`} question={q} mode="test" index={index} onResolved={onResolved} onNext={() => undefined} />
      </div>
      {confirmPause && (
        <Modal label="Pause the quiz?" onClose={() => setConfirmPause(false)}>
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold">Pause the quiz?</h2>
            <p className="text-xl text-slate-600">Your answers are saved. You can finish it later.</p>
            <div className="flex gap-4">
              <button className="btn3d btn-green px-6 py-3 text-xl" onClick={() => setConfirmPause(false)}>
                Keep going
              </button>
              <button className="btn3d btn-white px-6 py-3 text-xl" onClick={() => navigate('/maths')} data-testid="quiz-pause-confirm">
                Pause
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function QuizResult({ id }: { id: string }) {
  const active = useActive();
  const t = useT();
  const test = active.tests.find((t) => t.id === id);
  const score = useMemo(() => (test ? scoreTest(test, check) : null), [test]);
  useEffect(() => {
    sfx('cheer');
  }, []);
  if (!test || !score) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4">
        <p className="text-2xl">That quiz could not be found.</p>
        <button className="btn3d btn-green px-6 py-3 text-xl" onClick={() => navigate('/maths')}>
          Back to the island
        </button>
      </div>
    );
  }
  return (
    <div className="flex min-h-full flex-col">
      <Confetti pieces={30} />
      <TopBar title="Quiz results" back="/maths" />
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-6 pb-8 text-center" data-testid="quiz-result">
        <Mascot mood="cheer" size={130} />
        <h1 className="text-4xl font-bold">{score.percent >= 80 ? t('Amazing work!', 'Kamaal kar diya!') : score.percent >= 50 ? t('Great effort!', 'Bahut achhi koshish!') : t('Well done for trying your best!', 'Poori koshish ke liye shabaash!')}</h1>
        <div className="flex flex-wrap justify-center gap-4">
          <div className="card px-8 py-4">
            <div className="text-5xl font-bold text-green-600" data-testid="result-correct">
              {score.correct}
            </div>
            <div className="text-lg">correct</div>
          </div>
          <div className="card px-8 py-4">
            <div className="text-5xl font-bold text-slate-500" data-testid="result-incorrect">
              {score.incorrect}
            </div>
            <div className="text-lg">to practise</div>
          </div>
          <div className="card px-8 py-4">
            <div className="text-5xl font-bold text-blue-600" data-testid="result-score">
              {score.percent}%
            </div>
            <div className="text-lg">score</div>
          </div>
        </div>
        <div className="card w-full p-5 text-left">
          <h2 className="text-2xl font-bold">By topic</h2>
          <ul className="mt-2 space-y-2">
            {score.byTopic.map((t) => (
              <li key={t.topic} className="flex items-center gap-3 text-xl" data-testid={`result-topic-${t.topic}`}>
                <span className="w-48">
                  {topicDef(t.topic).emoji} {topicDef(t.topic).name}
                </span>
                <span className="h-4 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <span className="block h-full rounded-full bg-green-500" style={{ width: `${(t.correct / t.total) * 100}%` }} />
                </span>
                <span className="w-16 text-right font-bold">
                  {t.correct}/{t.total}
                </span>
              </li>
            ))}
          </ul>
          {score.improve.length > 0 && (
            <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-lg text-amber-800">
              Let’s practise more: <b>{score.improve.map((t) => topicDef(t).name).join(', ')}</b>
            </p>
          )}
          <p className="mt-3 text-base text-slate-500">Grown-ups can see every answer in the Grown-ups area → Quizzes.</p>
        </div>
        <button className="btn3d btn-green px-10 py-4 text-2xl" onClick={() => navigate('/maths')} data-testid="result-done">
          Back to the island
        </button>
      </div>
    </div>
  );
}
