import { chromium } from '@playwright/test';
const out = process.argv[2];
const url = 'file://' + process.cwd() + '/dist/index.html?e2e=1&seed=42';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(url);
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/01-welcome.png` });
await page.getByTestId('start').click();
await page.getByTestId('name-input').fill('Atiye');
await page.screenshot({ path: `${out}/02-setup.png` });
await page.getByTestId('create-profile').click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/03-home.png` });
await page.getByTestId('subject-maths').click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/04-island.png` });
const kinds = ['count','feed','balloon','train','treasure','pizza','shapes','catch','pattern','shop','numberline','tower','choose'];
const topicFor = { count:'counting', feed:'counting', balloon:'addition', train:'numbers', treasure:'subtraction', pizza:'addition', shapes:'shapes', catch:'numbers', pattern:'patterns', shop:'subtraction', numberline:'addition', tower:'comparison', choose:'measurement' };
for (const k of kinds) {
  await page.goto(url.replace('#','') + `#/maths/play?topics=${topicFor[k]}&kind=${k}&n=2&label=${k}`);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${out}/game-${k}.png` });
}
console.log('errors:', JSON.stringify(errors.slice(0, 10)));
await browser.close();
