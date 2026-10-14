import { describe, expect, it } from 'vitest';
import { commitAnswer, createTest, finishTest, isComplete, scoreTest } from '../../src/core/assessment';
import { createRng } from '../../src/core/rng';
import type { AnswerResponse, QuestionBase } from '../../src/core/types';
import { mathsSubject } from '../../src/subjects/maths';
import { expectedResponse } from '../../src/subjects/maths/answers';
import type { MathsQuestion } from '../../src/subjects/maths/types';
import { generateTestQuestions } from '../../src/screens/Quiz';

const check = (q: QuestionBase, r: AnswerResponse) => mathsSubject.checkAnswer(q as MathsQuestion, r);
const config = { subject: 'maths', topics: ['addition', 'shapes', 'counting'], level: 2 as const, count: 10 as const, ageLabel: 'Age 5' };

describe('test engine', () => {
  it('generates the configured number of objectively-assessable questions, deterministically', () => {
    const a = generateTestQuestions(config, 77);
    const b = generateTestQuestions(config, 77);
    expect(a).toHaveLength(10);
    expect(a).toEqual(b);
    expect(new Set(a.map((q) => q.topic))).toEqual(new Set(config.topics));
    for (const q of a) expect(mathsSubject.validateQuestion(q)).toEqual([]);
  });
  it('keeps the first committed answer and ignores duplicates', () => {
    const qs = generateTestQuestions(config, 5);
    let t = createTest(config, qs);
    const right = expectedResponse(qs[0]!);
    t = commitAnswer(t, 0, right, check);
    const again = commitAnswer(t, 0, { type: 'number', value: 999 }, check);
    expect(again).toBe(t);
    expect(t.answers[0]?.correct).toBe(true);
    expect(t.current).toBe(1);
  });
  it('scores deterministically with topic breakdown', () => {
    const qs = generateTestQuestions(config, 11);
    let t = createTest(config, qs);
    qs.forEach((q, i) => {
      const r = i % 3 === 0 ? ({ type: 'number', value: 12345 } as AnswerResponse) : expectedResponse(q);
      t = commitAnswer(t, i, r, check);
    });
    expect(isComplete(t)).toBe(true);
    t = finishTest(t);
    const s1 = scoreTest(t, check);
    const s2 = scoreTest(t, check);
    expect(s1).toEqual(s2);
    expect(s1.correct).toBe(6);
    expect(s1.incorrect).toBe(4);
    expect(s1.percent).toBe(60);
    expect(s1.byTopic.reduce((a, b) => a + b.total, 0)).toBe(10);
    // finished tests cannot change
    expect(commitAnswer(t, 0, expectedResponse(qs[0]!), check)).toBe(t);
  });
  it('rejects a mismatched question count', () => {
    expect(() => createTest(config, generateTestQuestions({ ...config, count: 5 }, 1))).toThrow();
  });
  it('different seeds give different tests', () => {
    expect(generateTestQuestions(config, 1).map((q) => q.signature)).not.toEqual(generateTestQuestions(config, 2).map((q) => q.signature));
    expect(createRng(1).next()).not.toBe(createRng(2).next());
  });
});
