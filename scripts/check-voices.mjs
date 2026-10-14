// Lists the on-device English/Hindi voices Google Chrome exposes on this Mac.
import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--window-position=-2000,-2000'] });
const page = await browser.newPage();
await page.goto('file://' + process.cwd() + '/dist/index.html');
const voices = await page.evaluate(
  () =>
    new Promise((resolve) => {
      const get = () => speechSynthesis.getVoices().filter((v) => v.localService && /^(hi|en-IN)/i.test(v.lang)).map((v) => `${v.name} (${v.lang})`);
      if (get().length) return resolve(get());
      speechSynthesis.onvoiceschanged = () => resolve(get());
      setTimeout(() => resolve(get()), 3000);
    }),
);
console.log(voices.join('\n'));
await browser.close();
