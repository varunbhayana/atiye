import { chromium, expect, test } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { APP, createProfile, currentQuestion, play, url } from './helpers';

test('close and reopen the app: progress, stars and profile are kept', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ma-profile-'));
  const launch = () => chromium.launchPersistentContext(dir, { channel: 'chrome', headless: true, viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  let ctx = await launch();
  let page = ctx.pages()[0] ?? (await ctx.newPage());
  await createProfile(page, 'Zara');
  await page.goto(url('/maths/play?topics=counting&kind=count&n=3&label=t', 8));
  let prev: string | undefined;
  for (let i = 0; i < 3; i++) {
    const q = await currentQuestion(page, prev);
    await play(page, q);
    await page.getByTestId('next').click();
    prev = q.id;
  }
  await expect(page.getByTestId('session-summary')).toBeVisible();
  await ctx.close();

  ctx = await launch();
  page = ctx.pages()[0] ?? (await ctx.newPage());
  await page.goto(`${APP}?e2e=1#/`);
  await expect(page.getByText('Hi Zara!')).toBeVisible();
  await expect(page.getByText('⭐').first()).toBeVisible();
  await expect(page.locator('[aria-label="3 stars"]')).toBeVisible();
  await page.goto(`${APP}?e2e=1#/stickers`);
  await expect(page.getByTestId('sticker-album')).toContainText('(1/24)');
  await ctx.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

test('works fully offline and never makes a network request', async ({ page, context }) => {
  await context.setOffline(true);
  const requests: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('file:') && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) requests.push(r.url());
  });
  await createProfile(page);
  await page.goto(url('/maths/play?topics=shapes&kind=shapes&n=1&label=t', 3));
  const q = await currentQuestion(page);
  await play(page, q);
  await expect(page.getByTestId('feedback-text')).toHaveAttribute('data-state', 'correct');
  expect(requests).toEqual([]);
});

test('keyboard only: answer a question with Tab and Enter', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await createProfile(page);
  await page.goto(url('/maths/play?topics=numbers&kind=pattern&n=1&label=t', 6));
  await page.goto(url('/maths/play?topics=patterns&kind=pattern&n=1&label=t', 6));
  const q = await currentQuestion(page);
  const answer = q.patternType === 'number' ? String(q.start + q.step * q.blankIndex) : q.unit[q.blankIndex % q.unit.length];
  const target = page.getByTestId(`piece-${answer}`);
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    if (await target.evaluate((el) => el === document.activeElement)) break;
  }
  await expect(target).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('feedback-text')).toHaveAttribute('data-state', 'correct');
});

test('small window (900×600): island and a game stay usable', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 600 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await createProfile(page);
  await page.getByTestId('subject-maths').click();
  await expect(page.getByTestId('zone-counting')).toBeVisible();
  await page.goto(url('/maths/play?topics=addition&kind=pizza&n=1&label=t', 2));
  const q = await currentQuestion(page);
  await play(page, q);
  await expect(page.getByTestId('feedback-text')).toHaveAttribute('data-state', 'correct');
  const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollW).toBeLessThanOrEqual(900);
});

test('reduced motion is respected (OS setting) and motion can be paused in Catch', async ({ browser }) => {
  const reduced = await browser.newPage({ reducedMotion: 'reduce' });
  await createProfile(reduced);
  expect(await reduced.evaluate(() => document.documentElement.dataset.motion)).toBe('reduce');
  await reduced.close();
  const page = await browser.newPage({ reducedMotion: 'no-preference' });
  await createProfile(page);
  expect(await page.evaluate(() => document.documentElement.dataset.motion)).toBe('full');
  await page.goto(url('/maths/play?topics=numbers&kind=catch&n=1&label=t', 4));
  const q = await currentQuestion(page);
  await page.getByTestId('toggle-motion').click(); // child/parent can stop the floating
  await play(page, q);
  await expect(page.getByTestId('feedback-text')).toHaveAttribute('data-state', 'correct');
  await page.close();
});

test('recovers gracefully from corrupted saved data', async ({ page }) => {
  await page.goto(url('/welcome'));
  await page.evaluate(() => localStorage.setItem('mathsAdventure.state.v1', '{oops'));
  await page.reload();
  await expect(page.getByTestId('start')).toBeVisible();
});

test('a second window is detected and can take over', async ({ context }) => {
  const a = await context.newPage();
  await createProfile(a);
  const b = await context.newPage();
  await b.goto(url('/home'));
  await expect(b.getByTestId('use-this-window')).toBeVisible();
  await b.getByTestId('use-this-window').click();
  await expect(b.getByTestId('subject-maths')).toBeVisible();
  await expect(a.getByTestId('use-this-window')).toBeVisible();
});

test('the child can always hear Ollie again: 🔊 buttons on every screen speak', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __spoken: string[] }).__spoken = [];
    const orig = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = (u: SpeechSynthesisUtterance) => {
      (window as unknown as { __spoken: string[] }).__spoken.push(u.text);
      orig(u);
    };
  });
  const spoken = () => page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken.length);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await createProfile(page, 'Atiye', { hinglish: true });
  const hasVoice = await page.evaluate(() => speechSynthesis.getVoices().some((v) => v.localService));
  test.skip(!hasVoice, 'no on-device voice in this environment');
  for (const route of ['/home', '/maths', '/maths/zone/counting', '/maths/learn/counting']) {
    await page.goto(url(route));
    const before = await spoken();
    await page.getByTestId('bubble-say-again').first().click();
    await expect.poll(spoken).toBeGreaterThan(before);
  }
  await page.goto(url('/maths/play?topics=numbers&kind=balloon&n=1&label=t', 3));
  const q = await currentQuestion(page);
  for (const id of ['replay-voice', 'feedback-say-again', 'mascot-say-again']) {
    const before = await spoken();
    await page.getByTestId(id).click();
    await expect.poll(spoken).toBeGreaterThan(before);
  }
  await play(page, q);
  const before = await spoken();
  await page.getByTestId('feedback-say-again').click();
  await expect.poll(spoken).toBeGreaterThan(before);
});
