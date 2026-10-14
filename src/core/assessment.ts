/**
 * Test (assessment) engine — separate from practice.
 *  - questions are fixed when the test is created (stored, so an unfinished test can resume)
 *  - only the FIRST committed answer for a question counts; later submissions are ignored
 *  - no hints, no correctness feedback until the end
 *  - scoring is recomputed deterministically from stored questions + responses
 */
import type { TestConfig, TestRecord } from './state';
import { newId } from './state';
import type { AnswerResponse, QuestionBase } from './types';

export type Checker = (q: QuestionBase, r: AnswerResponse) => boolean;

export function createTest(config: TestConfig, questions: QuestionBase[], now = Date.now()): TestRecord {
  if (questions.length !== config.count) throw new Error(`Test needs ${config.count} questions, got ${questions.length}`);
  return { id: newId('test'), config, questions, answers: questions.map(() => null), current: 0, status: 'in-progress', startedAt: now, finishedAt: null };
}

export function commitAnswer(test: TestRecord, index: number, response: AnswerResponse, check: Checker, now = Date.now()): TestRecord {
  if (test.status !== 'in-progress') return test;
  if (index < 0 || index >= test.questions.length) return test;
  if (test.answers[index] !== null) return test; // duplicate submission: first answer stands
  const answers = test.answers.slice();
  answers[index] = { response, correct: check(test.questions[index]!, response), ts: now };
  const next = answers.findIndex((a) => a === null);
  return { ...test, answers, current: next === -1 ? index : next };
}

export function isComplete(test: TestRecord): boolean {
  return test.answers.every((a) => a !== null);
}

export function finishTest(test: TestRecord, now = Date.now()): TestRecord {
  if (test.status !== 'in-progress') return test;
  return { ...test, status: 'finished', finishedAt: now };
}

export interface TopicResult {
  topic: string;
  correct: number;
  total: number;
}

export interface TestScore {
  correct: number;
  incorrect: number;
  unanswered: number;
  total: number;
  percent: number;
  byTopic: TopicResult[];
  improve: string[];
  strong: string[];
}

export function scoreTest(test: TestRecord, check: Checker): TestScore {
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;
  const topics = new Map<string, TopicResult>();
  test.questions.forEach((q, i) => {
    const a = test.answers[i];
    const t = topics.get(q.topic) ?? { topic: q.topic, correct: 0, total: 0 };
    t.total++;
    if (!a) unanswered++;
    else if (check(q, a.response)) {
      correct++;
      t.correct++;
    } else incorrect++;
    topics.set(q.topic, t);
  });
  const total = test.questions.length;
  const byTopic = [...topics.values()];
  return {
    correct,
    incorrect,
    unanswered,
    total,
    percent: total === 0 ? 0 : Math.round((correct / total) * 100),
    byTopic,
    improve: byTopic.filter((t) => t.correct / t.total < 0.7).map((t) => t.topic),
    strong: byTopic.filter((t) => t.correct / t.total >= 0.9).map((t) => t.topic),
  };
}
