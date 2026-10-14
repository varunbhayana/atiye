/**
 * Subject-agnostic types shared by the whole app.
 * Nothing in here may know about Maths — subjects plug in through SubjectModule.
 */
import type { Rng } from './rng';

export type Mode = 'learn' | 'practice' | 'test' | 'adventure' | 'journey';

/**
 * How a question ended. Kept distinct so mastery is never inflated by retries:
 *  first     – correct on the first attempt, no help
 *  hint      – correct after the child asked for / was shown a hint
 *  retry     – correct after at least one wrong attempt (no hint)
 *  incorrect – never answered correctly (or wrong in a test)
 *  skipped   – child chose to skip
 */
export type Outcome = 'first' | 'hint' | 'retry' | 'incorrect' | 'skipped';

export const LEVELS = [1, 2, 3, 4, 5] as const;
export type Level = (typeof LEVELS)[number];
export const MIN_LEVEL: Level = 1;
export const MAX_LEVEL: Level = 5;
/** Highest level a 5-year-old sees unless a parent enables advanced challenges. */
export const AGE_APPROPRIATE_MAX_LEVEL: Level = 3;

export function clampLevel(n: number, max: number = MAX_LEVEL): Level {
  const v = Math.max(MIN_LEVEL, Math.min(max, Math.round(n)));
  return v as Level;
}

/** A child's standardised answer, produced by every interactive activity. */
export type AnswerResponse =
  | { type: 'number'; value: number }
  | { type: 'choice'; value: string }
  | { type: 'set'; value: string[] }
  | { type: 'sequence'; value: number[] }
  | { type: 'pizza'; placed: Record<string, number>; total: number };

export interface QuestionBase {
  id: string;
  subject: string;
  topic: string;
  level: Level;
  kind: string;
  /** short on-screen instruction */
  prompt: string;
  /** what the voice says (defaults to prompt) */
  speech?: string;
  /** stable description of the maths content; used to avoid repeats */
  signature: string;
}

export interface TopicDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  /** a human description of each level, index 0 = level 1 */
  levels: string[];
}

export interface ActivityDef {
  kind: string;
  name: string;
  emoji: string;
  description: string;
  /** topics this activity can teach */
  topics: string[];
  /** concrete/visual activities are preferred when a child is struggling */
  concrete: boolean;
  /** suitable for test mode (objectively assessable, no motor-skill dependence) */
  testable: boolean;
}

export interface GenerateRequest {
  topic: string;
  level: Level;
  rng: Rng;
  mode: Mode;
  /** force a particular activity type */
  kind?: string;
  /** prefer concrete/visual activities (used by adaptive engine) */
  preferConcrete?: boolean;
  /** signatures recently seen, to avoid repeating questions */
  avoid?: ReadonlySet<string>;
}

export interface SubjectModule<Q extends QuestionBase = QuestionBase> {
  id: string;
  name: string;
  emoji: string;
  color: string;
  status: 'available' | 'coming-soon';
  topics: TopicDef[];
  activities: ActivityDef[];
  generate(req: GenerateRequest): Q;
  /** independent validation: returns a list of problems (empty = valid) */
  validateQuestion(q: Q): string[];
  /** the correct response, computed from the question's primary data */
  expectedResponse(q: Q): AnswerResponse;
  checkAnswer(q: Q, response: AnswerResponse): boolean;
  describeAnswer(q: Q): string;
  describeResponse(q: Q, r: AnswerResponse): string;
  hint(q: Q): string;
  /** which activity kinds can serve a topic at a level */
  kindsFor(topic: string, level: Level): string[];
}
