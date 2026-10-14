// Opens the app in real (headed, off-screen) Chrome and logs every speech utterance's start / end / error.
import { chromium } from '@playwright/test';
const lang = process.argv[2] ?? 'hindi';
const browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--window-position=-2400,-2400', '--disable-background-networking', '--disable-component-update', '--disable-domain-reliability', '--no-pings', '--disable-features=Translate,MediaRouter,OptimizationHints', '--disable-sync'] });
const page = await browser.newPage();
page.on('console', (m) => m.text().startsWith('[tts]') && console.log(m.text()));
await page.addInitScript(() => {
  const Orig = window.SpeechSynthesisUtterance;
  // @ts-ignore
  window.SpeechSynthesisUtterance = function (text) {
    const u = new Orig(text);
    u.addEventListener('start', () => console.log(`[tts] start "${u.text}" voice=${u.voice?.name} pitch=${u.pitch} rate=${u.rate}`));
    u.addEventListener('end', () => console.log(`[tts] end   "${u.text}"`));
    u.addEventListener('error', (e) => console.log(`[tts] ERROR "${u.text}" ${e.error}`));
    return u;
  };
  const speak = speechSynthesis.speak.bind(speechSynthesis);
  speechSynthesis.speak = (u) => {
    console.log(`[tts] queued "${u.text}" voice=${u.voice?.name}`);
    speak(u);
  };
  const cancel = speechSynthesis.cancel.bind(speechSynthesis);
  speechSynthesis.cancel = () => {
    console.log('[tts] cancel');
    cancel();
  };
});
const base = 'file://' + process.cwd() + '/dist/index.html?e2e=1&seed=5';
await page.goto(base + '#/setup');
await page.getByTestId('name-input').fill('Atiye');
await page.getByTestId(`lang-${lang}`).click();
await page.getByTestId('create-profile').click();
await page.waitForTimeout(1500);
await page.getByTestId('subject-maths').click();
await page.goto(base + '#/maths/play?topics=numbers&kind=balloon&n=2&label=t');
await page.waitForTimeout(6000);
const q = await page.evaluate(() => window.__MA__.question);
const ans = { identify: q.task.n, after: q.task.n + 1, before: q.task.n - 1, between: q.task.low + 1 }[q.task.type];
await page.getByTestId(`balloon-${ans}`).click({ force: true }).catch(() => {});
await page.waitForTimeout(7000);
await browser.close();
