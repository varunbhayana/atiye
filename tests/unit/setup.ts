// Vitest global setup (jsdom). Provide a clean localStorage between tests.
import { afterEach } from 'vitest';
afterEach(() => {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});
