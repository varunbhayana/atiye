/** Every word Ollie can say must have a Hindi form, so the Hindi voice never stumbles over Roman text. */
import { describe, expect, it } from 'vitest';
import { HINDI_WORDS, toHindiSpeech, unknownWords } from '../../src/app/devanagari';
import { LINES } from '../../src/components/QuestionHost';
import { STEP_INTRO } from '../../src/screens/Learn';
import { generatedHinglishLines, staticHinglishLines } from '../../scripts/hinglish-vocab';

const strip = (s: string) => s.replace(/\$\{[^}]*\}/g, ' ');

describe('Hindi voice conversion', () => {
  it('covers every generated question, voice line and hint', () => {
    const missing = new Set<string>();
    for (const line of generatedHinglishLines()) for (const w of unknownWords(line)) missing.add(w);
    expect([...missing]).toEqual([]);
  });
  it('covers every fixed Hinglish line in the app (screens, lessons, praise, hints)', () => {
    const h = LINES.hinglish;
    const lines = [
      ...staticHinglishLines(),
      ...h.praise, ...h.retry, ...h.tryAgain, ...h.idle, h.skipped, h.testIdle, h.testDone, h.answerIs('5'), h.answerIs('🐘 elephant'), h.reveal('5'),
      ...Object.values(STEP_INTRO).map((x) => x[1]),
    ];
    const missing = new Set<string>();
    for (const line of lines) for (const w of unknownWords(strip(line))) missing.add(w);
    expect([...missing]).toEqual([]);
  });
  it('produces natural Hindi, with numbers always in English', () => {
    expect(toHindiSpeech('Garden mein kitne rabbits hain? Har ek pe tap karke gino!')).toBe('बगीचे में कितने खरगोश हैं? हर एक पे टैप करके गिनो!');
    expect(toHindiSpeech('3 plus 2 kitna hota hai?')).toBe('थ्री प्लस टू कितना होता है?');
    expect(toHindiSpeech('7 ke just baad kya aata hai?')).toBe('सेवन के ठीक बाद क्या आता है?');
    expect(toHindiSpeech('2-2 karke gino')).toBe('टू टू करके गिनो');
    expect(toHindiSpeech('5 − 2 = ?')).toBe('फ़ाइव माइनस टू = ?');
    expect(toHindiSpeech('Shabaash Atiye! 🌟')).toBe('शाबाश Atiye!');
  });
  it('dictionary values are Devanagari', () => {
    for (const [k, v] of Object.entries(HINDI_WORDS)) expect(v, k).toMatch(/^[ऀ-ॿ ]+$/);
  });
});

describe('expressive voice', () => {
  it('exclamations sound excited, questions lift, other sentences stay calm', async () => {
    const { speechParts } = await import('../../src/app/speech');
    const parts = speechParts('येएएए! शाबाश! बगीचे में कितने खरगोश हैं? हर एक को गिनो.');
    expect(parts.map((p) => p.text)).toEqual(['येएएए!', 'शाबाश!', 'बगीचे में कितने खरगोश हैं?', 'हर एक को गिनो.']);
    expect(parts[0]!.pitch).toBeGreaterThan(parts[3]!.pitch);
    expect(parts[1]!.rate).toBeGreaterThan(parts[3]!.rate);
    expect(parts[2]!.pitch).toBeGreaterThan(parts[3]!.pitch);
  });
});

describe('praise uses the child’s name', () => {
  it('adds the name to the cheer', async () => {
    const { withName } = await import('../../src/components/QuestionHost');
    expect(withName('Yaaay! Shabaash!', 'Atiye')).toBe('Yaaay! Shabaash, Atiye!');
    expect(withName('Hurray! Bahut badhiya!', '  ')).toBe('Hurray! Bahut badhiya!');
    expect(withName('Great thinking', 'Atiye')).toBe('Great thinking Atiye!');
  });
});

describe('numbers and names', () => {
  it('numbers are English words (seven, not saat)', async () => {
    const { englishNumber } = await import('../../src/app/devanagari');
    expect([0, 7, 12, 20, 21, 37, 50].map(englishNumber)).toEqual(['ज़ीरो', 'सेवन', 'ट्वेल्व', 'ट्वेंटी', 'ट्वेंटी वन', 'थर्टी सेवन', 'फ़िफ़्टी']);
  });
  it('Atiye is pronounced अतिये by the Hindi voice; a parent spelling wins', async () => {
    const { transliterateName, spokenName } = await import('../../src/app/devanagari');
    expect(transliterateName('Atiye')).toBe('अतिये');
    expect(spokenName('Atiye', '', true)).toBe('अतिये');
    expect(spokenName('Atiye', '', false)).toBe('Atiye');
    expect(spokenName('Atiye', 'आतिये', true)).toBe('आतिये');
    expect(spokenName('Atiye', 'आतिये', false)).toBe('Atiye'); // English voice can't read Devanagari
    expect(spokenName('Atiye', 'Ah-tee-yeh', false)).toBe('Ah-tee-yeh');
    expect(spokenName('', '', true)).toBe('');
  });
  it('praise is spoken with the name', async () => {
    const { withName } = await import('../../src/components/QuestionHost');
    const { toHindiSpeech, spokenName } = await import('../../src/app/devanagari');
    expect(toHindiSpeech(withName('Yaaay! Shabaash!', spokenName('Atiye', '', true)))).toBe('येएएए! शाबाश, अतिये!');
  });
});
