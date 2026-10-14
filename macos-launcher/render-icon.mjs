// Renders icon.svg to a 1024px PNG using Google Chrome (via Playwright).
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const [svgPath, outPath] = process.argv.slice(2);
const svg = fs.readFileSync(svgPath, 'utf8');
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
await page.locator('svg').screenshot({ path: outPath, omitBackground: true });
await browser.close();
