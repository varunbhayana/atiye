import { chromium } from '@playwright/test';
const out = process.argv[2];
const base = 'file://' + process.cwd() + '/dist/index.html?e2e=1&seed=3';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
await page.goto(base + '#/setup');
await page.getByTestId('name-input').fill('Atiye');
await page.getByTestId('create-profile').click();
await page.goto(base + '#/maths/play?topics=addition&n=4&label=x');
for (let i = 0; i < 4; i++) {
  await page.waitForTimeout(300);
  await page.getByTestId('skip').click();
  await page.getByTestId('next').click();
}
await page.goto(base + '#/maths/learn/subtraction');
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/learn.png` });
await page.goto(base + '#/parent');
const q = page.getByTestId('gate-question');
await page.getByTestId('gate-input').fill(String(Number(await q.getAttribute('data-a')) * Number(await q.getAttribute('data-b'))));
await page.getByTestId('gate-submit').click();
await page.screenshot({ path: `${out}/parent.png`, fullPage: true });
await page.getByTestId('tab-Topics').click();
await page.screenshot({ path: `${out}/parent-topics.png` });
await page.goto(base + '#/maths/quiz');
await page.screenshot({ path: `${out}/quiz-setup.png` });
await page.goto(base + '#/stickers');
await page.screenshot({ path: `${out}/stickers.png` });
await browser.close();
