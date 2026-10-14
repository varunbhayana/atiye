import { describe, expect, it } from 'vitest';
import { createRng } from '../../src/core/rng';
import type { Level } from '../../src/core/types';
import { TOPIC_KINDS } from '../../src/subjects/maths/curriculum';
import { generateKind } from '../../src/subjects/maths/generators';
import { hintText, questionText } from '../../src/subjects/maths/hinglish';
import type { MathsTopic } from '../../src/subjects/maths/types';

describe('Hinglish wording', () => {
  it('every question type and hint has complete Hinglish text', () => {
    for (const [topic, rules] of Object.entries(TOPIC_KINDS))
      for (const r of rules)
        for (let level = r.from; level <= (r.to ?? 5); level++)
          for (let s = 0; s < 40; s++) {
            const q = generateKind(r.kind, topic as MathsTopic, level as Level, createRng(s * 13 + level), 'practice');
            const t = questionText(q, 'hinglish');
            const h = hintText(q, 'hinglish');
            for (const x of [t.prompt, t.speech, h]) {
              expect(x.length, q.signature).toBeGreaterThan(3);
              expect(x).not.toMatch(/undefined|NaN|\[object/);
            }
          }
  });
  it('English text is unchanged', () => {
    const q = generateKind('balloon', 'addition', 2, createRng(1), 'practice');
    expect(questionText(q, 'en').prompt).toBe(q.prompt);
  });
  it('sample wording', () => {
    const q = generateKind('count', 'counting', 1, createRng(5), 'practice');
    expect(questionText(q, 'hinglish').prompt).toMatch(/kitne .* hain\?$/);
  });
});
