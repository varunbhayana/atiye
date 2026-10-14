import type { AnswerResponse } from '../core/types';
import type { MathsQuestion } from '../subjects/maths/types';

export interface GameProps<Q extends MathsQuestion = MathsQuestion> {
  question: Q;
  /** practice: instant feedback; test: select then press Done, no feedback */
  mode: 'practice' | 'test';
  /** feedback from the last submission (practice only) */
  feedback: 'none' | 'correct' | 'wrong';
  /** number of wrong submissions so far */
  wrongCount: number;
  /** the child asked for a hint */
  hint: boolean;
  /** show the worked solution (practice, after the last try) */
  reveal: boolean;
  /** the question is finished — ignore further input */
  locked: boolean;
  reducedMotion: boolean;
  onSubmit(response: AnswerResponse): void;
  /** speak a short phrase (e.g. count numbers aloud) */
  say(text: string): void;
}
