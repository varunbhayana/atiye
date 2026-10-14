/**
 * Wraps any game with the shared question experience:
 * spoken instructions, hints, gentle feedback, retries, worked solution, and exactly-once resolution.
 */
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { sfx } from '../app/sfx';
import { spokenName } from '../app/devanagari';
import { speak, stopSpeaking, usingHindiVoice } from '../app/speech';
import { useStore } from '../app/store';
import { publishQuestion } from '../app/testHooks';
import { Mascot, SpeechBubble, type MascotMood } from '../art/Mascot';
import { attemptReducer, initialAttempt } from '../core/attempt';
import type { AnswerResponse, Outcome } from '../core/types';
import { GAME_COMPONENTS } from '../games/registry';
import { mathsSubject } from '../subjects/maths';
import { describeAnswer } from '../subjects/maths/answers';
import { hintText, questionText } from '../subjects/maths/hinglish';
import type { MathsQuestion } from '../subjects/maths/types';
import { Confetti } from './ui';

export interface Resolution {
  outcome: Outcome;
  response: AnswerResponse | null;
  correct: boolean;
  tries: number;
  hintUsed: boolean;
}

export const LINES = {
  en: {
    praise: ['Yaaay! Great job!', 'Hooray! You did it!', 'Woohoo! Brilliant!', 'Yippee! Super!', 'Yay! That’s right!', 'Wow! Fantastic!', 'Hooray! Well done!', 'Yippee! You’re a star!'],
    retry: ['Yaaay! You kept trying — well done!', 'Yes! You worked it out!', 'Woohoo! Great thinking!'],
    tryAgain: ['Not quite — try one more time!', 'Ooh, so close! Have another go.', 'Let’s look again together.'],
    idle: ['You can do it!', 'Take your time.', 'Let’s figure it out!', 'Have a go!'],
    help: 'Tap 💡 if you need help.',
    answerIs: (a: string) => `The answer is ${a}.`,
    reveal: (a: string) => `The answer is ${a}. Let’s look at it together — you’ll get the next one!`,
    skipped: 'That’s okay! Let’s try a different one.',
    testIdle: 'Take your time. Press Done when you’re sure.',
    testDone: 'Got it! On to the next one.',
    replay: 'Hear the question again',
    hearAgain: 'Hear again',
    sayAgain: 'Hear Ollie again',
    hint: 'Hint',
    skip: 'Skip',
  },
  hinglish: {
    praise: ['Yaaay! Shabaash!', 'Hurray! Bahut badhiya!', 'Wah wah! Ekdum sahi!', 'Yippee! Kamaal kar diya!', 'Woohoo! Super!', 'Hurray! Tum toh star ho!', 'Yaaay! Bilkul sahi!', 'Wah! Zabardast!'],
    retry: ['Yaaay! Koshish karte rahe — shabaash!', 'Hurray! Tumne kar dikhaya!', 'Wah! Bahut achha socha!'],
    tryAgain: ['Thoda sa galat — ek baar aur try karo!', 'Arre, bas thoda sa! Phir se try karo.', 'Chalo saath mein dobara dekhte hain.'],
    idle: ['Tum kar sakte ho!', 'Aaram se socho.', 'Chalo, solve karte hain!', 'Try karo!'],
    help: 'Help chahiye toh 💡 dabao.',
    answerIs: (a: string) => (/^\d+$/.test(a) ? `Sahi jawab ${a} hai.` : 'Sahi jawab screen pe dekho.'),
    reveal: (a: string) => `Answer hai ${a}. Chalo saath mein dekhte hain — agla wala tum zaroor karoge!`,
    skipped: 'Koi baat nahi! Chalo dusra try karte hain.',
    testIdle: 'Aaram se socho. Pakka ho toh Done dabao.',
    testDone: 'Ho gaya! Chalo agle sawaal pe.',
    replay: 'Sawaal phir se suno',
    hearAgain: 'Phir se suno',
    sayAgain: 'Ollie ko phir se suno',
    hint: 'Hint',
    skip: 'Skip',
  },
};

/** Adds the child's name to the last cheer: "Yaaay! Shabaash!" → "Yaaay! Shabaash, Atiye!" */
export function withName(line: string, name: string | undefined): string {
  const n = name?.trim();
  if (!n) return line;
  return /!\s*$/.test(line) ? line.replace(/!\s*$/, `, ${n}!`) : `${line} ${n}!`;
}

function pick(list: string[], seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return list[h % list.length]!;
}

export function QuestionHost({
  question,
  mode,
  index,
  onResolved,
  onNext,
  nextLabel = 'Next',
}: {
  question: MathsQuestion;
  mode: 'practice' | 'test';
  index: number;
  onResolved: (r: Resolution) => void;
  onNext: () => void;
  nextLabel?: string;
}) {
  const { reducedMotion, active } = useStore();
  const [att, dispatch] = useReducer(attemptReducer, mode, initialAttempt);
  const [celebrate, setCelebrate] = useState(false);
  /** the last feedback line Ollie spoke, so the child can hear it again */
  const [lastSaid, setLastSaid] = useState<string | null>(null);
  const reported = useRef(false);
  const Game = GAME_COMPONENTS[question.kind];
  const voiceOn = active?.settings.voice ?? true;
  const lang = active?.settings.language ?? 'hindi';
  const L = LINES[lang === 'en' ? 'en' : 'hinglish'];
  const childName = active?.profile.name;
  const childSay = active ? spokenName(active.profile.name, active.profile.nameSay ?? '', usingHindiVoice()) : '';
  const text = questionText(question, lang);
  const hint = hintText(question, lang);

  useEffect(() => {
    publishQuestion(question, index);
  }, [question, index]);

  useEffect(() => {
    if (voiceOn) speak(questionText(question, lang).speech);
    return () => stopSpeaking();
  }, [question, voiceOn, lang]);

  // report exactly once
  useEffect(() => {
    if (!att.resolved || reported.current) return;
    reported.current = true;
    onResolved({ outcome: att.resolved.outcome, response: att.resolved.response, correct: att.resolved.correct, tries: att.tries, hintUsed: att.hintUsed });
  }, [att, onResolved]);

  // after a second wrong try, switch on the visual hint automatically (counts as help)
  useEffect(() => {
    if (mode === 'practice' && att.tries === 2 && !att.resolved && !att.hintUsed) dispatch({ type: 'hint' });
  }, [att.tries, att.resolved, att.hintUsed, mode]);

  const submit = useCallback(
    (r: AnswerResponse) => {
      if (att.resolved) return;
      const correct = mathsSubject.checkAnswer(question, r);
      dispatch({ type: 'submit', response: r, correct });
      if (mode === 'test') {
        sfx('tap');
        return;
      }
      if (correct) {
        sfx('correct');
        window.setTimeout(() => sfx('cheer'), 250);
        setCelebrate(true);
        window.setTimeout(() => setCelebrate(false), 2600);
        const line = withName(att.tries === 0 && !att.hintUsed ? pick(L.praise, question.id) : pick(L.retry, question.id), childSay);
        setLastSaid(line);
        if (voiceOn) speak(line);
      } else {
        sfx('gentle');
        const line = att.tries >= 2 ? L.answerIs(describeAnswer(question)) : `${pick(L.tryAgain, question.id + att.tries)} ${hint}`;
        setLastSaid(line);
        if (voiceOn) speak(line);
      }
    },
    [att.resolved, att.tries, att.hintUsed, question, mode, voiceOn, L, hint, childSay],
  );

  const say = useCallback((t: string) => voiceOn && speak(t), [voiceOn]);

  const resolved = att.resolved;
  /** repeat Ollie's latest line: feedback if there is some, the hint if asked for, otherwise the question */
  const sayAgain = () => {
    if (att.lastFeedback !== 'none' || resolved) speak(lastSaid ?? text.speech);
    else if (att.hintUsed) speak(hint);
    else speak(text.speech);
  };

  const reveal = mode === 'practice' && !!resolved && !resolved.correct && resolved.outcome === 'incorrect';
  let mood: MascotMood = 'idle';
  let message: string = mode === 'practice' ? `${pick(L.idle, question.id)} ${L.help}` : L.testIdle;
  if (mode === 'practice') {
    if (resolved?.correct) {
      mood = 'cheer';
      message = withName(att.tries === 1 && !att.hintUsed ? pick(L.praise, question.id) : pick(L.retry, question.id), childName);
    } else if (reveal) {
      mood = 'think';
      message = L.reveal(describeAnswer(question));
    } else if (resolved?.outcome === 'skipped') {
      mood = 'wave';
      message = L.skipped;
    } else if (att.lastFeedback === 'wrong') {
      mood = 'think';
      message = `${pick(L.tryAgain, question.id + att.tries)} ${hint}`;
    } else if (att.hintUsed) {
      mood = 'think';
      message = hint;
    }
  } else if (resolved) {
    message = L.testDone;
  }

  if (!Game) return <div className="p-10 text-2xl">This activity is missing.</div>;

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-3">
      {celebrate && <Confetti />}
      {/* instruction */}
      <div className="card mx-auto flex w-full max-w-5xl items-center gap-4 px-5 py-3">
        <button className="btn3d btn-blue flex h-16 shrink-0 items-center gap-2 px-5 text-xl" onClick={() => speak(text.speech)} aria-label={L.replay} title={L.replay} data-testid="replay-voice">
          <span className="text-3xl">🔊</span>
          <span className="whitespace-nowrap">{L.hearAgain}</span>
        </button>
        <h2 className="flex-1 text-2xl font-bold leading-tight text-slate-800 md:text-3xl" data-testid="prompt">
          {text.prompt}
        </h2>
      </div>

      {/* the game */}
      <div className="flex min-h-0 flex-1 items-stretch justify-center overflow-auto px-2 py-2" data-testid={`game-${question.kind}`}>
        <Game
          key={question.id}
          question={question}
          mode={mode}
          feedback={att.lastFeedback}
          wrongCount={att.wrongResponses.length}
          hint={mode === 'practice' && (att.hintUsed || reveal)}
          reveal={reveal}
          locked={!!resolved}
          reducedMotion={reducedMotion}
          onSubmit={submit}
          say={say}
        />
      </div>

      {/* companion + controls */}
      <div className="mx-auto flex w-full max-w-6xl items-end justify-between gap-4">
        <div className="flex items-end gap-3" data-testid="feedback">
          <button onClick={sayAgain} aria-label={L.sayAgain} title={L.sayAgain} className="rounded-full" data-testid="mascot-say-again">
            <Mascot mood={mood} size={92} />
          </button>
          <SpeechBubble className="mb-4 flex max-w-xl items-center gap-3 text-lg md:text-xl">
            <button onClick={sayAgain} aria-label={L.sayAgain} title={L.sayAgain} className="btn3d btn-blue flex h-11 w-11 shrink-0 items-center justify-center text-xl" data-testid="feedback-say-again">
              🔊
            </button>
            <span data-testid="feedback-text" data-state={mode === 'test' ? (resolved ? 'saved' : 'none') : resolved ? (resolved.correct ? 'correct' : resolved.outcome) : att.lastFeedback}>
              {message}
            </span>
          </SpeechBubble>
        </div>
        <div className="mb-4 flex items-center gap-3">
          {mode === 'practice' && !resolved && (
            <>
              <button className="btn3d btn-yellow px-5 py-3 text-xl" onClick={() => {
                  dispatch({ type: 'hint' });
                  if (voiceOn) speak(hint);
                }}
                disabled={att.hintUsed}
                data-testid="hint">
                💡 {L.hint}
              </button>
              <button className="btn3d btn-white px-4 py-3 text-lg" onClick={() => dispatch({ type: 'skip' })} data-testid="skip">
                {L.skip}
              </button>
            </>
          )}
          {resolved && mode === 'practice' && (
            <button className="btn3d btn-green anim-pop-in px-10 py-4 text-2xl" onClick={onNext} data-testid="next" autoFocus>
              {nextLabel} ▶
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
