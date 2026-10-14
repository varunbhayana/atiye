/**
 * The Maths subject module. Registers curriculum, activities, generators and validators
 * with the subject-agnostic core through the SubjectModule interface.
 */
import type { GenerateRequest, Level, SubjectModule } from '../../core/types';
import { describeAnswer, describeResponse, expectedResponse, checkAnswer } from './answers';
import { CONCRETE_KINDS, MATHS_ACTIVITIES, MATHS_TOPIC_DEFS, kindRulesFor, TOPIC_KINDS } from './curriculum';
import { generateKind } from './generators';
import { hintFor } from './hints';
import type { GameKind, MathsQuestion, MathsTopic } from './types';
import { MATHS_TOPICS } from './types';
import { validateMathsQuestion } from './validate';

function isTopic(t: string): t is MathsTopic {
  return (MATHS_TOPICS as readonly string[]).includes(t);
}

export function generateMaths(req: GenerateRequest): MathsQuestion {
  if (!isTopic(req.topic)) throw new Error(`Unknown maths topic ${req.topic}`);
  const topic = req.topic;
  const rules = kindRulesFor(topic, req.level);
  let kind: GameKind;
  if (req.kind) {
    const servesTopic = TOPIC_KINDS[topic].some((r) => r.kind === req.kind);
    if (!servesTopic) throw new Error(`${req.kind} does not teach ${topic}`);
    kind = req.kind as GameKind;
  } else {
    const weighted = rules.flatMap((r) => {
      const w = r.weight * (req.preferConcrete && CONCRETE_KINDS.has(r.kind) ? 3 : 1);
      return Array.from({ length: w }, () => r.kind);
    });
    kind = req.rng.pick(weighted);
  }
  let last: MathsQuestion | null = null;
  let lastErrors: string[] = [];
  for (let attempt = 0; attempt < 60; attempt++) {
    const q = generateKind(kind, topic, req.level, req.rng, req.mode);
    const errors = validateMathsQuestion(q);
    if (errors.length > 0) {
      last = q;
      lastErrors = errors;
      continue;
    }
    if (req.avoid?.has(q.signature) && attempt < 40) continue;
    return q;
  }
  throw new Error(`Could not generate a valid ${kind}/${topic}/L${req.level} question: ${lastErrors.join('; ')} ${last ? last.signature : ''}`);
}

export const mathsSubject: SubjectModule<MathsQuestion> = {
  id: 'maths',
  name: 'Maths',
  emoji: '🔢',
  color: '#f97316',
  status: 'available',
  topics: MATHS_TOPIC_DEFS,
  activities: MATHS_ACTIVITIES,
  generate: generateMaths,
  validateQuestion: validateMathsQuestion,
  expectedResponse,
  checkAnswer,
  describeAnswer,
  describeResponse,
  hint: hintFor,
  kindsFor(topic: string, level: Level) {
    if (!isTopic(topic)) return [];
    return [...new Set(kindRulesFor(topic, level).map((r) => r.kind))];
  },
};

export * from './types';
