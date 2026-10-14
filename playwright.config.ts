import { defineConfig } from '@playwright/test';

// End-to-end tests run against the BUILT single-file app (dist/index.html) opened from disk,
// in the real Google Chrome — exactly how the macOS launcher runs it.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  workers: 4,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    channel: 'chrome',
    headless: true,
    viewport: { width: 1280, height: 800 },
    actionTimeout: 8_000,
    trace: 'retain-on-failure',
  },
});
