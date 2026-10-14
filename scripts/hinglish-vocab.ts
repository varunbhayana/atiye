// Lists every word Ollie can say in Hinglish (used to build/verify the Devanagari speech dictionary).
import fs from 'node:fs';
import path from 'node:path';
import { createRng } from '../src/core/rng';
import { TOPIC_KINDS } from '../src/subjects/maths/curriculum';
import { generateKind } from '../src/subjects/maths/generators';
import { hintText, questionText } from '../src/subjects/maths/hinglish';

export function staticHinglishLines(root = 'src'): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const f of fs.readdirSync(d)) {
      const p = path.join(d, f);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (/\.tsx?$/.test(f)) {
        const s = fs.readFileSync(p, 'utf8');
        // second argument of t('en', 'hi') / tr(...) calls
        for (const m of s.matchAll(/\bt?r?\(\s*(['`"])(?:\\.|(?!\1).)*\1\s*,\s*(['`"])((?:\\.|(?!\2).)*)\2\s*\)/gs)) out.push(m[3]!);
        // hi: '...' fields and Hinglish line tables
        for (const m of s.matchAll(/\bhi:\s*'((?:\\.|[^'])*)'/g)) out.push(m[1]!);
      }
    }
  };
  walk(root);
  return out;
}

export function generatedHinglishLines(): string[] {
  const out: string[] = [];
  for (const [topic, rules] of Object.entries(TOPIC_KINDS))
    for (const r of rules)
      for (let level = r.from; level <= (r.to ?? 5); level++)
        for (let s = 0; s < 60; s++) {
          const q = generateKind(r.kind, topic as never, level as never, createRng(s * 13 + level), 'practice');
          const t = questionText(q, 'hinglish');
          out.push(t.speech, t.prompt, hintText(q, 'hinglish'));
        }
  return out;
}

if (process.argv[1]?.endsWith('hinglish-vocab.ts')) {
  const words = new Set<string>();
  for (const line of [...staticHinglishLines(), ...generatedHinglishLines()])
    for (const w of line.replace(/\$\{[^}]*\}/g, ' ').toLowerCase().match(/[a-z’']+/g) ?? []) words.add(w);
  console.log([...words].sort().join(' '));
}
