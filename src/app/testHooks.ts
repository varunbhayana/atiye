/**
 * Read-only hooks for automated browser tests. Only active when the page is opened with ?e2e=1.
 * They expose the CURRENT question's data so Playwright can independently compute the answer
 * and then answer through the real UI.
 */
export const E2E = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('e2e');

interface E2EBridge {
  question: unknown;
  questionIndex: number;
}

export function publishQuestion(q: unknown, index: number) {
  if (!E2E) return;
  (window as unknown as { __MA__: E2EBridge }).__MA__ = { question: q, questionIndex: index };
}

export function seedFromUrl(): number | null {
  if (typeof window === 'undefined') return null;
  const s = new URLSearchParams(window.location.search).get('seed');
  return s && /^\d+$/.test(s) ? Number(s) : null;
}
